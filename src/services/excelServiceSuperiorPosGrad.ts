/**
 * Serviço de parsing de planilhas Excel para Cursos Superiores e Pós-Graduação.
 *
 * Este arquivo:
 * - Baixa a planilha (.xlsx — Google Sheets export ou outra URL via env)
 * - Classifica as abas (superior / pós-graduação)
 * - Extrai a legenda de siglas (mapeamento sigla → nome completo)
 * - Delega o parsing detalhado para excelSuperiorPosGradParser
 * - Lê células com sheetToMatrix (mesclagens resolvidas, compatível com Google)
 * - Usa cache com hash para evitar re-parse quando a planilha não mudou
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

export interface SuperiorPosGradData {
  superiores: ExcelData
  posGraduacao: ExcelData
  courseNameMap: Record<string, string> // Mapeamento sigla → nome completo
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

/**
 * Classifica uma aba como "superior", "pos-graduacao" ou "unknown"
 * Analisa as primeiras 5 linhas procurando por palavras-chave
 */
type SheetType = 'superior' | 'pos-graduacao' | 'unknown'

function classifySheet(data: any[][]): SheetType {
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const text = (data[i] || []).map((c: any) => String(c || '')).join(' ').toUpperCase()
    if (text.includes('CURSO SUPERIOR')) return 'superior'
    if (/PÓS[- ]?GRADUA[ÇC]|POS[- ]?GRADUA[ÇC]|MBA\s/i.test(text)) return 'pos-graduacao'
  }
  return 'unknown'
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

  const supClasses: ParsedClass[] = []
  const pgClasses: ParsedClass[] = []
  const courseNameMap: Record<string, string> = {}

  // Processar cada aba
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name]
    if (!ws) continue

    const data = sheetToMatrix(ws)
    const type = classifySheet(data)

    // Pular abas desconhecidas
    if (type === 'unknown') continue

    const period = detectPeriod(data)
    console.log(`\n--- "${name}" → ${type} (${period}) ---`)

    // Extrair legenda de siglas desta aba
    Object.assign(courseNameMap, extractCourseNameMap(data))

    // Parsear aulas desta aba
    const classes = parseSheetData(data, name, period)
    if (classes.length === 0) { console.log('   Sem aulas'); continue }

    console.log(`   ${classes.length} aula(s)`)

    // Separar por tipo
    if (type === 'superior') {
      supClasses.push(...classes)
    } else {
      pgClasses.push(...adjustSaturdayPeriod(classes))
    }
  }

  // Resumo final
  const log = (label: string, arr: ParsedClass[]) => {
    const t = [...new Set(arr.map(c => c.turma))]
    console.log(`${label}: ${arr.length} aulas, ${t.length} turma(s)`)
  }
  console.log('')
  log('SUPERIORES', supClasses)
  log('POS-GRAD', pgClasses)
  console.log(`LEGENDA: ${Object.keys(courseNameMap).length} sigla(s)`)

  const result: SuperiorPosGradData = {
    superiores: { classes: supClasses, announcements: [] },
    posGraduacao: { classes: pgClasses, announcements: [] },
    courseNameMap,
  }

  // 4. Atualizar cache
  _cache = { hash, result }

  return result
}
