/**
 * Serviço de parsing de planilhas Excel para Cursos Livres/FIC.
 *
 * Estratégia de parse (em ordem de prioridade):
 * 1. Parser dedicado Livres (CLASSE/AULA/HORÁRIO/Info + uma coluna por dia, sem T1/T2)
 * 2. Parser estruturado Superior/PosGrad (formato com T1/T2 — se alguma aba usar)
 * 3. Parser legado (salas na coluna A — planilhas antigas)
 *
 * Usa cache com hash para evitar re-parse quando a planilha não mudou
 */

import * as XLSX from 'xlsx'
import type { ParsedClass, ExcelData } from './excelServiceTecnicos'
import { hashArrayBuffer } from '../utils/hashUtils'
import { parseTimeString, detectPeriod } from './excelParseHelpers'
import { parseSheetData as parseSheetStructured } from './excelSuperiorPosGradParser'
import { parseLivresSheetData } from './excelLivresParser'
import { sheetToMatrix } from './excelSheetMatrix'

// Cache em memória: guarda o hash e o resultado parseado
let _cache: { hash: string; result: ExcelData } | null = null

// URL da planilha de Cursos Livres (Google Sheets → export .xlsx)
const EXCEL_LIVRES_URL =
  'https://docs.google.com/spreadsheets/d/1BIXy19vCS88jZBNUzYCHTYHKFKbpFQWy/export?format=xlsx'

// ── Funções auxiliares ───────────────────────────────────────────────

/**
 * Baixa a planilha (.xlsx) e retorna como ArrayBuffer
 */
async function downloadExcel(url: string): Promise<ArrayBuffer> {
  console.log('Baixando planilha (Cursos Livres)...')
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  })

  if (!response.ok) {
    throw new Error(`Erro ao baixar Excel (Cursos Livres): ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  console.log(`Excel baixado (Cursos Livres): ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`)
  return arrayBuffer
}

// ══════════════════════════════════════════════════════════════════════
// PARSER DEDICADO LIVRES (sem T1/T2 — uma coluna por dia, 2 linhas por aula)
// ══════════════════════════════════════════════════════════════════════

/**
 * Tenta parsear todas as abas com o parser dedicado para Cursos Livres.
 * Formato: CLASSE | AULA | HORÁRIO | Info + uma coluna por dia (sem T1/T2).
 */
function parseWithLivresFormat(workbook: XLSX.WorkBook): ParsedClass[] {
  const allClasses: ParsedClass[] = []

  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name]
    if (!ws) continue

    // Matriz com mesclagens resolvidas (Google Sheets / Excel — CLASSE mesclada)
    const data = sheetToMatrix(ws)
    if (data.length < 3) continue

    const period = detectPeriod(data, 'sabado')
    console.log(`\n--- [Livres/Dedicado] "${name}" (${period}) ---`)

    const classes = parseLivresSheetData(data, name, period)
    if (classes.length === 0) {
      console.log('   Sem aulas (formato Livres)')
      continue
    }

    console.log(`   ${classes.length} aula(s) encontradas`)
    allClasses.push(...classes)
  }

  return allClasses
}

// ══════════════════════════════════════════════════════════════════════
// FALLBACK: PARSER ESTRUTURADO SUPERIOR/POSGRAD (formato com T1/T2)
// ══════════════════════════════════════════════════════════════════════

function parseWithStructuredFormat(workbook: XLSX.WorkBook): ParsedClass[] {
  const allClasses: ParsedClass[] = []

  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name]
    if (!ws) continue

    const data = sheetToMatrix(ws)
    if (data.length < 3) continue

    const period = detectPeriod(data, 'sabado')
    console.log(`\n--- [Livres/SupPosGrad] "${name}" (${period}) ---`)

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

  const data = sheetToMatrix(ws)
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
 * Estratégia (em ordem de prioridade):
 * 1. Parser dedicado Livres (sem T1/T2 — uma coluna por dia)
 * 2. Fallback: parser estruturado Superior/PosGrad (com T1/T2)
 * 3. Fallback: parser legado (salas na coluna A)
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

  // 3. Parsear planilha (cellDates ajuda horários; mesclagens via sheetToMatrix)
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  console.log('Abas disponíveis:', workbook.SheetNames)

  // 1) Parser dedicado Livres (sem T1/T2)
  let classes = parseWithLivresFormat(workbook)

  // 2) Fallback: formato estruturado Superior/PosGrad (com T1/T2)
  if (classes.length === 0) {
    console.log('\n[Livres] Formato dedicado não encontrou aulas — tentando formato estruturado (T1/T2)...')
    classes = parseWithStructuredFormat(workbook)
  }

  // 3) Fallback: formato legado (salas na coluna A)
  if (classes.length === 0) {
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
