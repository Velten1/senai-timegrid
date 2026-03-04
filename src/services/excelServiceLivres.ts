/**
 * Serviço de parsing de planilhas Excel para Cursos Livres (Sábado).
 * 
 * Este arquivo:
 * - Baixa a planilha do SharePoint
 * - Parseia a aba "Sábado" que contém cursos livres
 * - Extrai informações de cada curso (nome, professor, horário, sala)
 * - Usa cache com hash para evitar re-parse quando a planilha não mudou
 */

import * as XLSX from 'xlsx'
import type { ParsedClass, ExcelData } from './excelService'
import { hashArrayBuffer } from '../utils/hashUtils'
import { parseTimeString } from './excelParseHelpers'

// Cache em memória: guarda o hash e o resultado parseado
let _cache: { hash: string; result: ExcelData } | null = null

// URL da planilha de Cursos Livres no SharePoint
const EXCEL_LIVRES_URL =
  'https://fiapcom-my.sharepoint.com/personal/rm572913_fiap_com_br/_layouts/15/download.aspx?share=IQAMbmQ5Kb4vQZarPc5S_kccAcYE8xeMC4R4Co5WOOhsyYA'

// ── Funções auxiliares ───────────────────────────────────────────────

/**
 * Baixa a planilha Excel do SharePoint e retorna como ArrayBuffer
 */
async function downloadExcel(url: string): Promise<ArrayBuffer> {
  console.log('Baixando Excel do SharePoint (Cursos Livres)...')
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Erro ao baixar Excel (Cursos Livres): ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  console.log(`Excel baixado (Cursos Livres): ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`)
  return arrayBuffer
}

/**
 * Verifica se uma string parece ser nome de sala/laboratório
 * Exemplos: "Sala S0", "Lab. 01 Robótica", "Lab. Elevadores Atlas Schindler"
 */
function isRoomName(value: string): boolean {
  if (!value) return false
  const trimmed = value.trim()
  return /^(Sala\s|Lab\.)/i.test(trimmed)
}

// ── Estrutura de dados extraída de cada curso ─────────

interface ParsedCourseInfo {
  courseName: string
  teacherName: string
  startDate: string   // Formato "DD/MM"
  endDate: string     // Formato "DD/MM"
  startTime: string   // Formato "HH:MM"
  endTime: string     // Formato "HH:MM"
}

/**
 * Parseia o texto de uma única entrada de curso
 * 
 * Formatos suportados:
 * - LONGO: "CCNA V7: Switchings... - prof. David - 17/01 a 21/03 - das 9h às 18h"
 * - CURTO: "PROEMB+MIC32 - POLONI - 17SES"
 */
function parseSingleCourse(text: string): ParsedCourseInfo | null {
  if (!text?.trim()) return null

  let remaining = text.trim()

  // Extrair nome do professor (formato "prof. Nome" ou "profa. Nome")
  let teacherName = ''
  const teacherRegex = /\s*-?\s*prof[a]?\.\s*([^-–(]+?)(?:\s*[-–]|\s*$|\s*\()/i
  const teacherMatch = remaining.match(teacherRegex)
  if (teacherMatch) {
    teacherName = teacherMatch[1].trim()
    teacherName = teacherName.replace(/\s*\(.*?\)$/, '').trim()
    remaining = remaining.replace(teacherMatch[0], ' - ')
  }

  // Extrair intervalo de datas (formato "DD/MM a DD/MM")
  let startDate = '', endDate = ''
  const dateRegex = /\s*-?\s*(\d{1,2}\/\d{2})\s*a\s*(\d{1,2}\/\d{2})\s*-?\s*/
  const dateMatch = remaining.match(dateRegex)
  if (dateMatch) {
    startDate = dateMatch[1]
    endDate = dateMatch[2]
    remaining = remaining.replace(dateMatch[0], ' - ')
  }

  // Extrair intervalo de horário (formato "das Xh às Yh")
  let startTime = '09:00', endTime = '18:00' // Valores padrão para sábado
  const timeRegex = /\s*-?\s*das\s*(\d{1,2}h\d{0,2})\s*[àa]s\s*(\d{1,2}h\d{0,2})\s*/i
  const timeMatch = remaining.match(timeRegex)
  if (timeMatch) {
    startTime = parseTimeString(timeMatch[1])
    endTime = parseTimeString(timeMatch[2])
    remaining = remaining.replace(timeMatch[0], ' - ')
  }

  // Remover notas entre parênteses
  remaining = remaining.replace(/\s*\([^)]*\)\s*/g, ' ')

  // Limpar traços duplicados
  remaining = remaining.replace(/(\s*-\s*){2,}/g, ' - ')
  remaining = remaining.replace(/^\s*-\s*|\s*-\s*$/g, '')
  remaining = remaining.trim()

  // Determinar nome do curso
  let courseName = remaining
  const isLongFormat = teacherMatch || dateMatch || timeMatch

  if (!isLongFormat) {
    // Formato curto: "CURSO - PROFESSOR - NSSES"
    const segments = text.split(/\s*-\s*/)
    courseName = segments[0]?.trim() || text.trim()
    if (segments.length >= 2) {
      teacherName = segments[1].trim()
    }
  }

  if (!courseName) courseName = text.split(' - ')[0].trim()

  return {
    courseName: courseName || text.trim(),
    teacherName,
    startDate,
    endDate,
    startTime,
    endTime,
  }
}

/**
 * Parseia texto que pode conter múltiplos cursos separados por " / "
 * Exemplo: "GPSE - SIMPLÍCIO - 16SES / LIP - SIMPLÍCIO - 19SES"
 */
function parseCourseText(text: string): ParsedCourseInfo[] {
  if (!text?.trim()) return []

  // Separar múltiplos cursos por " / "
  const entries = text.split(/\s+\/\s+/)
  const results: ParsedCourseInfo[] = []

  for (const entry of entries) {
    const info = parseSingleCourse(entry.trim())
    if (info) results.push(info)
  }

  return results
}

// ── Parser principal da aba "Sábado" ──────────────────────

/**
 * Encontra e parseia a aba "Sábado" do workbook
 */
function parseSabadoSheet(workbook: XLSX.WorkBook): ParsedClass[] {
  // Procurar pela aba "Sábado" (aceita variações de acentuação)
  const sabadoSheet = workbook.SheetNames.find(
    (name) => /s[áa]bado/i.test(name)
  )

  if (!sabadoSheet) {
    console.warn('Aba "Sábado" não encontrada. Abas disponíveis:', workbook.SheetNames)
    // Tentar encontrar qualquer aba que possa ser sábado
    const possibleSheets = workbook.SheetNames.filter((name) => 
      name.toLowerCase().includes('sab') || name.toLowerCase().includes('sáb')
    )
    if (possibleSheets.length > 0) {
      console.log('   Tentando usar:', possibleSheets[0])
      const ws = workbook.Sheets[possibleSheets[0]]
      if (ws) {
        return parseSheetData(ws, possibleSheets[0])
      }
    }
    return []
  }

  console.log(`Parseando aba "${sabadoSheet}"...`)

  const ws = workbook.Sheets[sabadoSheet]
  return parseSheetData(ws, sabadoSheet)
}

/**
 * Parseia os dados de uma aba específica
 * Estrutura esperada:
 * - Coluna A: Nome da sala/lab
 * - Coluna B: Grupo 1 (células verdes)
 * - Coluna H: Grupo 2 (células rosas)
 */
function parseSheetData(ws: XLSX.WorkSheet, sheetName: string): ParsedClass[] {
  const data: any[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: '',
    raw: false,
  })

  console.log(`   ${data.length} linhas encontradas na aba "${sheetName}"`)

  const allClasses: ParsedClass[] = []

  // Colunas fixas: Grupo 1 na coluna B (1), Grupo 2 na coluna H (7)
  const GROUP1_COL = 1
  const GROUP2_COL = 7

  let roomsFound = 0
  for (let ri = 0; ri < data.length; ri++) {
    const row = data[ri]
    if (!row || row.length === 0) continue

    const roomName = String(row[0] || '').trim()

    // Pular linhas que não começam com nome de sala/lab
    if (!isRoomName(roomName)) continue

    roomsFound++
    console.log(`   Sala encontrada: ${roomName}`)

    // Ler texto do Grupo 1 (colunas B-F, merged → valor em B)
    const group1Text = String(row[GROUP1_COL] || '').trim()
    // Ler texto do Grupo 2 (colunas H-M, merged → valor em H)
    const group2Text = String(row[GROUP2_COL] || '').trim()

    // Parsear cursos do Grupo 1
    const group1Courses = parseCourseText(group1Text)
    if (group1Courses.length > 0) {
      console.log(`      Grupo 1: ${group1Courses.length} curso(s) encontrado(s)`)
    }
    for (const courseInfo of group1Courses) {
      allClasses.push({
        turma: courseInfo.courseName,
        dayOfWeek: 6, // Sábado
        startTime: courseInfo.startTime,
        endTime: courseInfo.endTime,
        group: 'T1',
        courseCode: courseInfo.courseName,
        teacherName: courseInfo.teacherName,
        labRoom: roomName,
        period: 'sabado',
      })
    }

    // Parsear cursos do Grupo 2
    const group2Courses = parseCourseText(group2Text)
    if (group2Courses.length > 0) {
      console.log(`      Grupo 2: ${group2Courses.length} curso(s) encontrado(s)`)
    }
    for (const courseInfo of group2Courses) {
      allClasses.push({
        turma: courseInfo.courseName,
        dayOfWeek: 6, // Sábado
        startTime: courseInfo.startTime,
        endTime: courseInfo.endTime,
        group: 'T2',
        courseCode: courseInfo.courseName,
        teacherName: courseInfo.teacherName,
        labRoom: roomName,
        period: 'sabado',
      })
    }
  }

  console.log(`   Total de salas processadas: ${roomsFound}`)
  console.log(`   Total de aulas parseadas (antes deduplicação): ${allClasses.length}`)

  // Deduplicar: se o mesmo curso aparece em T1 e T2 com dados idênticos, manter apenas um
  const seen = new Set<string>()
  const deduplicated: ParsedClass[] = []

  for (const pc of allClasses) {
    const key = `${pc.turma}|${pc.startTime}|${pc.endTime}|${pc.teacherName}|${pc.labRoom}`
    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(pc)
    }
  }

  const removedDups = allClasses.length - deduplicated.length
  if (removedDups > 0) {
    console.log(`   ${removedDups} entradas duplicadas removidas`)
  }

  return deduplicated
}

// ── Função principal exportada ──────────────────────────

/**
 * Função principal: baixa e parseia a planilha de Cursos Livres
 * Usa cache com hash para evitar re-parse quando a planilha não mudou
 */
export async function parseExcelFileLivres(): Promise<ExcelData> {
  // 1. Baixar planilha
  const arrayBuffer = await downloadExcel(EXCEL_LIVRES_URL)

  // 2. Verificar hash
  const hash = await hashArrayBuffer(arrayBuffer)
  if (_cache && _cache.hash === hash) {
    console.log('[Livres] Planilha não mudou — usando cache')
    return _cache.result
  }

  console.log('[Livres] Planilha mudou — re-parseando...\n')

  // 3. Parsear planilha
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  console.log('Abas disponíveis:', workbook.SheetNames)

  const classes = parseSabadoSheet(workbook)

  // Estatísticas para log
  const turmas = [...new Set(classes.map((c) => c.turma))]
  const profs = [...new Set(classes.map((c) => c.teacherName).filter(Boolean))]
  const salas = [...new Set(classes.map((c) => c.labRoom).filter(Boolean))]

  console.log(`\nParse concluído (CURSOS LIVRES - Sábado):`)
  console.log(`   Cursos: ${turmas.length}`)
  console.log(`   Turmas: ${turmas.join(', ')}`)
  console.log(`   Professores (${profs.length}): ${profs.join(', ')}`)
  console.log(`   Salas (${salas.length}): ${salas.join(', ')}`)

  const result: ExcelData = { classes, announcements: [] }

  // 4. Atualizar cache
  _cache = { hash, result }

  return result
}
