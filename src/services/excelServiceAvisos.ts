/**
 * Serviço de parsing da planilha de Avisos/Eventos.
 *
 * Estrutura esperada (aba "Avisos"):
 *   Linhas de título/subtítulo no topo (ignoradas automaticamente)
 *   Cabeçalho: Texto | Tipo | Data Início | Data Fim | Público | Ativo
 *   Dados logo após o cabeçalho
 *
 * Regras:
 * - Detecta o cabeçalho automaticamente (procura a linha com "Texto")
 * - Lê cada célula pelo endereço (não só sheet_to_json), resolvendo mesclagens
 * - Só retorna linhas com coluna "Ativo" = sim / 1 / boolean TRUE (case-insensitive)
 * - Download com cache desativado no fetch para reduzir arquivo antigo do SharePoint
 * - Usa cache em memória (hash) para evitar re-parse quando o arquivo não mudou
 */

import * as XLSX from 'xlsx'
import { hashArrayBuffer } from '../utils/hashUtils'

const EXCEL_AVISOS_URL =
  'https://fiapcom-my.sharepoint.com/personal/rm572913_fiap_com_br/_layouts/15/download.aspx?share=IQCiUOrqnNj8SYgUlMm38GPAAc1aZVgvvPLD6mtfhLGRo3s'

// ── Tipos ──────────────────────────────────────────────

export interface Aviso {
  texto: string
  tipo: 'aviso' | 'evento'
  dataInicio: Date | null
  dataFim: Date | null
  publico: string
}

export interface AvisosData {
  avisos: Aviso[]
}

// ── Cache ──────────────────────────────────────────────

let _cache: { hash: string; result: AvisosData } | null = null

// ── Helpers ────────────────────────────────────────────

async function downloadExcel(): Promise<ArrayBuffer> {
  console.log('Baixando Excel (Avisos)...')
  const res = await fetch(EXCEL_AVISOS_URL, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })
  if (!res.ok) throw new Error(`Download falhou (Avisos): ${res.status}`)
  const buf = await res.arrayBuffer()
  console.log(`Excel baixado (Avisos): ${(buf.byteLength / 1024).toFixed(0)} KB`)
  return buf
}

/** Excel serial (dias desde 1899-12-30) → Date local meia-noite */
function parseExcelSerial(n: number): Date | null {
  if (!Number.isFinite(n) || n < 1) return null
  const epoch = Date.UTC(1899, 11, 30)
  const d = new Date(epoch + Math.round(n * 86400000))
  if (isNaN(d.getTime())) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Converte qualquer valor de célula de data para Date.
 * Aceita: número serial do Excel, DD/MM/AAAA, DD-MM-AAAA,
 *         AAAA-MM-DD, e variantes com hora (ignora a hora).
 */
function parseDateCell(value: unknown): Date | null {
  if (value == null || value === '') return null

  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }

  if (typeof value === 'number') return parseExcelSerial(value)

  const s = String(value).trim()
  if (!s) return null

  // DD/MM/AAAA ou DD-MM-AAAA (com hora opcional)
  const brMatch = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/)
  if (brMatch) {
    const [, d, mo, y] = brMatch
    const date = new Date(Number(y), Number(mo) - 1, Number(d))
    return isNaN(date.getTime()) ? null : date
  }

  // AAAA-MM-DD (ISO, com hora opcional)
  const isoMatch = s.match(/^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})/)
  if (isoMatch) {
    const [, y, mo, d] = isoMatch
    const date = new Date(Number(y), Number(mo) - 1, Number(d))
    return isNaN(date.getTime()) ? null : date
  }

  // String numérica pura (serial como texto)
  const num = Number(s)
  if (!isNaN(num) && num > 1 && num < 200000) return parseExcelSerial(num)

  return null
}

// ── Parse ──────────────────────────────────────────────

/** Normaliza para comparar cabeçalhos (remove acentos). */
function normHeader(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

/** Valor efetivo da célula: resolve o âncora se estiver em região mesclada (Excel grava só o canto). */
function getCellValue(ws: XLSX.WorkSheet, r: number, c: number): unknown {
  let anchorR = r
  let anchorC = c
  const merges = ws['!merges'] as XLSX.Range[] | undefined
  if (merges) {
    for (const m of merges) {
      if (r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c) {
        anchorR = m.s.r
        anchorC = m.s.c
        break
      }
    }
  }
  const addr = XLSX.utils.encode_cell({ r: anchorR, c: anchorC })
  const cell = (ws as Record<string, XLSX.CellObject | undefined>)[addr]
  if (!cell || cell.v === undefined || cell.v === '') return ''
  return cell.v
}

function parseSheet(arrayBuffer: ArrayBuffer): AvisosData {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })

  const sheetName = wb.SheetNames.find(n => /aviso/i.test(n)) ?? wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  if (!ws) return { avisos: [] }

  const range = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : null
  if (!range) return { avisos: [] }

  const maxCol = Math.min(range.e.c, 25)

  // Encontrar linha do cabeçalho (primeiras 10 linhas lógicas)
  let headerIdx = -1
  const scanLimit = Math.min(9, range.e.r)
  for (let ri = 0; ri <= scanLimit; ri++) {
    let hasTexto = false
    for (let ci = 0; ci <= maxCol; ci++) {
      const v = String(getCellValue(ws, ri, ci) ?? '').trim().toLowerCase()
      if (v === 'texto') {
        hasTexto = true
        break
      }
    }
    if (hasTexto) {
      headerIdx = ri
      break
    }
  }

  if (headerIdx < 0) {
    console.warn('[Avisos] Cabeçalho com coluna "Texto" não encontrado — pulando')
    return { avisos: [] }
  }

  const header: string[] = []
  for (let c = 0; c <= maxCol; c++) {
    header.push(String(getCellValue(ws, headerIdx, c) ?? '').trim().toLowerCase())
  }

  const colTexto = header.findIndex(h => h === 'texto')
  const colTipo = header.findIndex(h => h === 'tipo')
  const colInicio = header.findIndex(h => {
    const n = normHeader(h)
    return (
      (n.includes('data') && n.includes('inicio') && !n.includes('fim')) ||
      n === 'inicio'
    )
  })
  const colFim = header.findIndex(h => {
    const n = normHeader(h)
    return n.includes('data') && n.includes('fim') && !n.includes('inicio')
  })
  const colPublico = header.findIndex(h => {
    const n = normHeader(h)
    return n === 'publico' || n.includes('publico')
  })
  const colAtivo = header.findIndex(h => normHeader(h) === 'ativo')

  console.log(`[Avisos] Cabeçalho na linha ${headerIdx + 1} (leitura por célula + mesclagens)`)

  const avisos: Aviso[] = []

  for (let r = headerIdx + 1; r <= range.e.r; r++) {
    const texto = String(getCellValue(ws, r, colTexto) ?? '').trim()
    if (!texto) continue

    const ativoCell = colAtivo >= 0 ? getCellValue(ws, r, colAtivo) : 'sim'
    const ativoRaw =
      typeof ativoCell === 'boolean'
        ? ativoCell
          ? 'sim'
          : 'não'
        : String(ativoCell ?? '').trim().toLowerCase()
    if (ativoRaw !== 'sim' && ativoRaw !== '1') continue

    const dataInicio = colInicio >= 0 ? parseDateCell(getCellValue(ws, r, colInicio)) : null
    const dataFim = colFim >= 0 ? parseDateCell(getCellValue(ws, r, colFim)) : null

    const tipoRaw = colTipo >= 0 ? String(getCellValue(ws, r, colTipo) ?? '').trim().toLowerCase() : 'aviso'
    const tipo: Aviso['tipo'] = tipoRaw === 'evento' ? 'evento' : 'aviso'
    const publico =
      colPublico >= 0
        ? String(getCellValue(ws, r, colPublico) ?? '').trim().toLowerCase()
        : 'todos'

    avisos.push({ texto, tipo, dataInicio, dataFim, publico })
  }

  console.log(`[Avisos] ${avisos.length} aviso(s) ativo(s) encontrado(s)`)
  return { avisos }
}

// ── Função principal exportada ─────────────────────────

export async function parseExcelFileAvisos(): Promise<AvisosData> {
  const buf = await downloadExcel()

  const hash = await hashArrayBuffer(buf)
  if (_cache && _cache.hash === hash) {
    console.log('[Avisos] Planilha não mudou — usando cache')
    return _cache.result
  }

  console.log('[Avisos] Planilha mudou — re-parseando...\n')
  const result = parseSheet(buf)
  _cache = { hash, result }
  return result
}
