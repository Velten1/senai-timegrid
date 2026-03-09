/**
 * Serviço de parsing de planilhas Excel para Cursos Superiores e Pós-Graduação.
 * 
 * Este arquivo:
 * - Baixa a planilha do SharePoint
 * - Classifica as abas (superior / pós-graduação)
 * - Extrai a legenda de siglas (mapeamento sigla → nome completo)
 * - Delega o parsing detalhado para excelSuperiorPosGradParser
 * - Usa cache com hash para evitar re-parse quando a planilha não mudou
 */

import * as XLSX from 'xlsx'
import type { ParsedClass, ExcelData } from './excelService'
import { parseSheetData } from './excelSuperiorPosGradParser'
import { hashArrayBuffer } from '../utils/hashUtils'

// Cache em memória: guarda o hash e o resultado parseado
let _cache: { hash: string; result: SuperiorPosGradData } | null = null

// URL da planilha no SharePoint
const EXCEL_URL =
  'https://fiapcom-my.sharepoint.com/personal/rm572913_fiap_com_br/_layouts/15/download.aspx?share=IQDyto4bs8gESoxty7LExzy3AQdOdvWgxp4BzI3dTiAc3J0'

// ── Tipos exportados ──────────────────────────────────────

export interface SuperiorPosGradData {
  superiores: ExcelData
  posGraduacao: ExcelData
  courseNameMap: Record<string, string> // Mapeamento sigla → nome completo
}

// ── Funções auxiliares ──────────────────────────────────────────────

/**
 * Baixa a planilha Excel do SharePoint e retorna como ArrayBuffer
 */
async function downloadExcel(): Promise<ArrayBuffer> {
  console.log('Baixando Excel (Superior + Pos-Grad)...')
  const res = await fetch(EXCEL_URL)
  if (!res.ok) throw new Error(`Download falhou: ${res.status}`)
  const buf = await res.arrayBuffer()
  console.log(`Excel baixado: ${(buf.byteLength / 1024).toFixed(0)} KB`)
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

/**
 * Detecta o período do dia analisando as primeiras linhas
 * Reconhece: NOTURNO/NOITE, MATUTINO/MANHÃ, VESPERTINO/TARDE, DIURNO, SÁBADO
 */
function detectPeriod(data: any[][]): ParsedClass['period'] {
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const text = (data[i] || []).map((c: any) => String(c || '')).join(' ').toUpperCase()
    if (text.includes('NOTURNO') || text.includes('NOITE')) return 'noite'
    if (text.includes('MATUTINO') || text.includes('MANHÃ') || text.includes('MANHA')) return 'manha'
    if (text.includes('VESPERTINO') || text.includes('TARDE')) return 'tarde'
    if (text.includes('DIURNO')) return 'manha'
    if (text.includes('SÁBADO') || text.includes('SABADO')) return 'sabado'
  }
  return 'noite'
}

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
  const wb = XLSX.read(buf, { type: 'array' })

  console.log('Abas:', wb.SheetNames.join(', '))

  const supClasses: ParsedClass[] = []
  const pgClasses: ParsedClass[] = []
  const courseNameMap: Record<string, string> = {}

  // Processar cada aba
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name]
    if (!ws) continue

    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false })
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
