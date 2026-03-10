/**
 * Serviço de parsing de planilhas Excel para Cursos Livres.
 * 
 * Este arquivo:
 * - Baixa a planilha do SharePoint
 * - Tenta parsear usando o parser estruturado (mesmo formato de Superior/PosGrad)
 * - Se não encontrar blocos estruturados, faz fallback para o parser legado (salas na coluna A)
 * - Usa cache com hash para evitar re-parse quando a planilha não mudou
 */

import * as XLSX from 'xlsx'
import type { ParsedClass, ExcelData } from './excelService'
import { hashArrayBuffer } from '../utils/hashUtils'
import { parseTimeString, detectPeriod } from './excelParseHelpers'
import { parseSheetData as parseSheetStructured } from './excelSuperiorPosGradParser'

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

// ══════════════════════════════════════════════════════════════════════
// PARSER NOVO (formato estruturado: CLASSE/AULA/HORÁRIO/Info + dias)
// Reutiliza o parser de Superior/PosGrad
// ══════════════════════════════════════════════════════════════════════

/**
 * Tenta parsear todas as abas usando o parser estruturado
 * Retorna as aulas encontradas (array vazio se nenhuma aba é estruturada)
 */
function parseWithStructuredFormat(workbook: XLSX.WorkBook): ParsedClass[] {
  const allClasses: ParsedClass[] = []

  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name]
    if (!ws) continue

    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false })
    if (data.length < 3) continue

    // Detectar período (default 'sabado' para Cursos Livres)
    const period = detectPeriod(data, 'sabado')
    console.log(`\n--- [Livres] "${name}" (${period}) ---`)

    const classes = parseSheetStructured(data, name, period)
    if (classes.length === 0) {
      console.log('   Sem aulas (formato estruturado)')
      continue
    }

    console.log(`   ${classes.length} aula(s) encontradas`)
    allClasses.push(...classes)
  }

  return allClasses
}

// ══════════════════════════════════════════════════════════════════════
// PARSER LEGADO (formato antigo: salas na coluna A, cursos em B e H)
// Mantido como fallback para planilhas que ainda não migraram
// ══════════════════════════════════════════════════════════════════════

/**
 * Verifica se uma string parece ser nome de sala/laboratório
 */
function isRoomName(value: string): boolean {
  if (!value) return false
  return /^(Sala\s|Lab\.)/i.test(value.trim())
}

interface ParsedCourseInfo {
  courseName: string
  teacherName: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

/**
 * Parseia o texto de uma única entrada de curso (formato legado)
 */
function parseSingleCourse(text: string): ParsedCourseInfo | null {
  if (!text?.trim()) return null

  let remaining = text.trim()

  let teacherName = ''
  const teacherRegex = /\s*-?\s*prof[a]?\.\s*([^-–(]+?)(?:\s*[-–]|\s*$|\s*\()/i
  const teacherMatch = remaining.match(teacherRegex)
  if (teacherMatch) {
    teacherName = teacherMatch[1].trim().replace(/\s*\(.*?\)$/, '').trim()
    remaining = remaining.replace(teacherMatch[0], ' - ')
  }

  let startDate = '', endDate = ''
  const dateRegex = /\s*-?\s*(\d{1,2}\/\d{2})\s*a\s*(\d{1,2}\/\d{2})\s*-?\s*/
  const dateMatch = remaining.match(dateRegex)
  if (dateMatch) {
    startDate = dateMatch[1]
    endDate = dateMatch[2]
    remaining = remaining.replace(dateMatch[0], ' - ')
  }

  let startTime = '09:00', endTime = '18:00'
  const timeRegex = /\s*-?\s*das\s*(\d{1,2}h\d{0,2})\s*[àa]s\s*(\d{1,2}h\d{0,2})\s*/i
  const timeMatch = remaining.match(timeRegex)
  if (timeMatch) {
    startTime = parseTimeString(timeMatch[1])
    endTime = parseTimeString(timeMatch[2])
    remaining = remaining.replace(timeMatch[0], ' - ')
  }

  remaining = remaining.replace(/\s*\([^)]*\)\s*/g, ' ')
  remaining = remaining.replace(/(\s*-\s*){2,}/g, ' - ')
  remaining = remaining.replace(/^\s*-\s*|\s*-\s*$/g, '')
  remaining = remaining.trim()

  let courseName = remaining
  const isLongFormat = teacherMatch || dateMatch || timeMatch

  if (!isLongFormat) {
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
 */
function parseCourseText(text: string): ParsedCourseInfo[] {
  if (!text?.trim()) return []
  const entries = text.split(/\s+\/\s+/)
  const results: ParsedCourseInfo[] = []
  for (const entry of entries) {
    const info = parseSingleCourse(entry.trim())
    if (info) results.push(info)
  }
  return results
}

/**
 * Parser legado: encontra aba "Sábado" e parseia formato sala + texto
 */
function parseLegacyFormat(workbook: XLSX.WorkBook): ParsedClass[] {
  const sabadoSheet = workbook.SheetNames.find((name) => /s[áa]bado/i.test(name))
  if (!sabadoSheet) {
    console.warn('[Livres] Aba "Sábado" não encontrada no formato legado')
    return []
  }

  console.log(`[Livres] Usando parser legado na aba "${sabadoSheet}"`)

  const ws = workbook.Sheets[sabadoSheet]
  if (!ws) return []

  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false })
  console.log(`   ${data.length} linhas encontradas`)

  const allClasses: ParsedClass[] = []
  const GROUP1_COL = 1
  const GROUP2_COL = 7

  for (let ri = 0; ri < data.length; ri++) {
    const row = data[ri]
    if (!row || row.length === 0) continue

    const roomName = String(row[0] || '').trim()
    if (!isRoomName(roomName)) continue

    console.log(`   Sala encontrada: ${roomName}`)

    const group1Text = String(row[GROUP1_COL] || '').trim()
    const group2Text = String(row[GROUP2_COL] || '').trim()

    for (const courseInfo of parseCourseText(group1Text)) {
      allClasses.push({
        turma: courseInfo.courseName,
        dayOfWeek: 6,
        startTime: courseInfo.startTime,
        endTime: courseInfo.endTime,
        group: 'T1',
        courseCode: courseInfo.courseName,
        teacherName: courseInfo.teacherName,
        labRoom: roomName,
        period: 'sabado',
      })
    }

    for (const courseInfo of parseCourseText(group2Text)) {
      allClasses.push({
        turma: courseInfo.courseName,
        dayOfWeek: 6,
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

  // Deduplicar
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
  if (removedDups > 0) console.log(`   ${removedDups} entradas duplicadas removidas`)

  return deduplicated
}

// ── Função principal exportada ──────────────────────────

/**
 * Função principal: baixa e parseia a planilha de Cursos Livres
 * 
 * Estratégia:
 * 1. Tenta o formato estruturado (CLASSE/AULA/HORÁRIO — compatível com Superior/PosGrad)
 * 2. Se não encontrar nada, faz fallback para o formato legado (salas na coluna A)
 * 
 * Usa cache com hash para evitar re-parse quando a planilha não mudou
 */
export async function parseExcelFileLivres(): Promise<ExcelData> {
  console.log('Iniciando parse de CURSOS LIVRES...')

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

  // Tentar formato estruturado primeiro
  let classes = parseWithStructuredFormat(workbook)

  if (classes.length === 0) {
    // Fallback: formato legado (salas na coluna A)
    console.log('\n[Livres] Formato estruturado não encontrou aulas — tentando formato legado...')
    classes = parseLegacyFormat(workbook)
  }

  // Estatísticas para log
  const turmas = [...new Set(classes.map((c) => c.turma))]
  const profs = [...new Set(classes.map((c) => c.teacherName).filter(Boolean))]
  const salas = [...new Set(classes.map((c) => c.labRoom).filter(Boolean))]

  console.log(`\nParse concluído (CURSOS LIVRES):`)
  console.log(`   Cursos/Turmas: ${turmas.length} (${turmas.join(', ')})`)
  console.log(`   Professores (${profs.length}): ${profs.join(', ')}`)
  console.log(`   Salas (${salas.length}): ${salas.join(', ')}`)

  const result: ExcelData = { classes, announcements: [] }

  // 4. Atualizar cache
  _cache = { hash, result }

  return result
}
