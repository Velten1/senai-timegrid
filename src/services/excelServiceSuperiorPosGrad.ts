/**
 * Serviço de parsing de planilhas Excel para Cursos Superiores, MBA e Pós (POS).
 *
 * Convenção de nomes de aba (Google Sheets / Excel):
 *   SUP_*  → Cursos superiores (/cursos/superior)
 *   MBA_*  → Especialização MBA (/cursos/especializacao/mba)
 *   POS_*  → Pós-graduação (/cursos/especializacao/pos)
 * Abas sem esses prefixos são ignoradas (aviso no console).
 */

import * as XLSX from 'xlsx'
import type { ParsedClass, ExcelData } from './excelServiceTecnicos'
import { parseSheetData } from './excelSuperiorPosGradParser'
import { hashArrayBuffer } from '../utils/hashUtils'
import { detectPeriod } from './excelParseHelpers'
import { sheetToMatrix } from './excelSheetMatrix'

// Cache em memória: guarda o hash e o resultado parseado
let _cache: { hash: string; result: SuperiorPosGradData } | null = null

// Google Sheets → export .xlsx (planilha: Horários Superior e Pós Graduação)
const EXCEL_URL_DEFAULT =
  'https://docs.google.com/spreadsheets/d/1uwxdME9UwONTshjW0XQ5cxhXrbE8fOXI/export?format=xlsx'

const _supPosUrlOverride = import.meta.env.VITE_EXCEL_SUPERIOR_POSGRAD_URL?.trim() ?? ''
const EXCEL_URL =
  _supPosUrlOverride.length > 0 ? _supPosUrlOverride : EXCEL_URL_DEFAULT

// ── Tipos exportados ──────────────────────────────────────

/** Uma aba = um botão na UI; `label` é o nome sem prefixo SUP_/MBA_/POS_. */
export interface SuperiorSheetEntry {
  sheetName: string
  label: string
  data: ExcelData
}

export interface SuperiorPosGradData {
  superiorSheets: SuperiorSheetEntry[]
  mbaSheets: SuperiorSheetEntry[]
  posSheets: SuperiorSheetEntry[]
  courseNameMap: Record<string, string>
}

// ── Funções auxiliares ──────────────────────────────────────────────

/**
 * Baixa a planilha (.xlsx) e retorna como ArrayBuffer
 */
async function downloadExcel(): Promise<ArrayBuffer> {
  console.log('Baixando planilha (Superior + Pós-Grad)...')
  const res = await fetch(EXCEL_URL, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  })
  if (!res.ok) throw new Error(`Download falhou (Superior/Pós-Grad): ${res.status}`)
  const buf = await res.arrayBuffer()
  console.log(`Planilha baixada: ${(buf.byteLength / 1024).toFixed(0)} KB`)
  return buf
}

type SheetPrefix = 'SUP' | 'MBA' | 'POS'

/** SUP_nome, MBA_nome ou POS_nome (underscore, hífen ou espaço após o prefixo). */
function getSheetPrefix(sheetName: string): SheetPrefix | null {
  const s = sheetName.trim()
  if (/^SUP(?:[_\s-]|$)/i.test(s)) return 'SUP'
  if (/^MBA(?:[_\s-]|$)/i.test(s)) return 'MBA'
  if (/^POS(?:[_\s-]|$)/i.test(s)) return 'POS'
  return null
}

/** Texto do botão: remove SUP_/MBA_/POS_ e troca _ por espaço. */
function displayLabelFromSheetName(sheetName: string): string {
  const rest = sheetName
    .trim()
    .replace(/^(SUP|MBA|POS)(?:[_\s-]+|$)/i, '')
    .replace(/_/g, ' ')
    .trim()
  return rest.length > 0 ? rest : sheetName.trim()
}

// detectPeriod importado de excelParseHelpers

/**
 * Extrai a legenda de siglas das últimas 100 linhas da planilha
 * Procura por padrões como "SIGLA: Nome Completo" ou "SIGLA - Nome Completo"
 */
function extractCourseNameMap(data: any[][]): Record<string, string> {
  const map: Record<string, string> = {}
  const startRow = Math.max(0, data.length - 100)

  for (let ri = startRow; ri < data.length; ri++) {
    const row = data[ri]
    if (!row || row.length === 0) continue

    for (let ci = 0; ci < row.length; ci++) {
      const cell = String(row[ci] || '').trim()
      if (!cell || cell.length > 120) continue

      // Padrão: "SIGLA: Nome Completo"
      const m1 = cell.match(/^([A-Z][A-Z0-9]{1,9})\s*:\s*(.{3,})$/i)
      if (m1) { map[m1[1].toUpperCase()] = m1[2].trim(); continue }

      // Padrão: "SIGLA - Nome Completo"
      const m2 = cell.match(/^([A-Z][A-Z0-9]{1,9})\s+-\s+(.{3,})$/i)
      if (m2 && !/semestral|trimestre/i.test(m2[2])) {
        map[m2[1].toUpperCase()] = m2[2].trim()
        continue
      }

      // Duas colunas adjacentes: sigla curta | nome longo
      if (ci < row.length - 1) {
        const c2 = String(row[ci + 1] || '').trim()
        if (/^[A-Z][A-Z0-9]{1,7}$/i.test(cell) && c2.length > 10 && !/^\d/.test(c2)) {
          map[cell.toUpperCase()] = c2
        }
      }
    }
  }

  const n = Object.keys(map).length
  if (n > 0) console.log(`   Legenda: ${n} sigla(s) mapeada(s)`)
  return map
}

/**
 * Ajusta o período para "sabado" se todas as aulas forem no sábado
 */
function adjustSaturdayPeriod(classes: ParsedClass[]): ParsedClass[] {
  if (classes.length > 0 && classes.every(c => c.dayOfWeek === 6)) {
    return classes.map(c => ({ ...c, period: 'sabado' as const }))
  }
  return classes
}

// ── Função principal exportada ────────────────────────────

/**
 * Função principal: baixa e parseia a planilha de Cursos Superiores e Pós-Graduação
 * Usa cache com hash para evitar re-parse quando a planilha não mudou
 */
export async function parseExcelFileSuperiorPosGrad(): Promise<SuperiorPosGradData> {
  // 1. Baixar planilha
  const buf = await downloadExcel()

  // 2. Verificar hash
  const hash = await hashArrayBuffer(buf)
  if (_cache && _cache.hash === hash) {
    console.log('[Superior/PosGrad] Planilha não mudou — usando cache')
    return _cache.result
  }

  console.log('[Superior/PosGrad] Planilha mudou — re-parseando...\n')

  // 3. Parsear planilha
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })

  console.log('Abas:', wb.SheetNames.join(', '))

  const superiorSheets: SuperiorSheetEntry[] = []
  const mbaSheets: SuperiorSheetEntry[] = []
  const posSheets: SuperiorSheetEntry[] = []
  const courseNameMap: Record<string, string> = {}

  const sortByLabel = (a: SuperiorSheetEntry, b: SuperiorSheetEntry) =>
    a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' })

  // Processar cada aba
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name]
    if (!ws) continue

    const prefix = getSheetPrefix(name)
    if (!prefix) {
      console.warn(`[Superior/PosGrad] Aba ignorada (use prefixo SUP_, MBA_ ou POS_): "${name}"`)
      continue
    }

    const data = sheetToMatrix(ws)
    const period = detectPeriod(data)
    console.log(`\n--- "${name}" → ${prefix} (${period}) ---`)

    Object.assign(courseNameMap, extractCourseNameMap(data))

    const classes = parseSheetData(data, name, period)
    if (classes.length === 0) {
      console.log('   Sem aulas')
      continue
    }

    console.log(`   ${classes.length} aula(s)`)

    const ready =
      prefix === 'SUP' ? classes : adjustSaturdayPeriod(classes)
    const entry: SuperiorSheetEntry = {
      sheetName: name,
      label: displayLabelFromSheetName(name),
      data: { classes: ready, announcements: [] },
    }

    if (prefix === 'SUP') superiorSheets.push(entry)
    else if (prefix === 'MBA') mbaSheets.push(entry)
    else posSheets.push(entry)
  }

  superiorSheets.sort(sortByLabel)
  mbaSheets.sort(sortByLabel)
  posSheets.sort(sortByLabel)

  const sumAulas = (arr: SuperiorSheetEntry[]) =>
    arr.reduce((n, e) => n + e.data.classes.length, 0)
  console.log('')
  console.log(
    `SUP: ${superiorSheets.length} aba(s), ${sumAulas(superiorSheets)} aula(s) | ` +
      `MBA: ${mbaSheets.length} aba(s), ${sumAulas(mbaSheets)} aula(s) | ` +
      `POS: ${posSheets.length} aba(s), ${sumAulas(posSheets)} aula(s)`,
  )
  console.log(`LEGENDA: ${Object.keys(courseNameMap).length} sigla(s)`)

  const result: SuperiorPosGradData = {
    superiorSheets,
    mbaSheets,
    posSheets,
    courseNameMap,
  }

  // 4. Atualizar cache
  _cache = { hash, result }

  return result
}
