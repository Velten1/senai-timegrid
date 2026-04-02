/**
 * Constrói matriz densa a partir de uma aba XLSX, resolvendo mesclagens.
 * Excel/Google gravam o valor só na âncora; sheet_to_json deixa o resto vazio.
 */

import * as XLSX from 'xlsx'

/** Valor efetivo da célula (âncora se estiver em região mesclada). */
export function getCellValueWithMerges(ws: XLSX.WorkSheet, r: number, c: number): unknown {
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

/**
 * Converte aba em matriz de linhas (índice 0 = primeira linha do !ref).
 * Colunas alinhadas a partir da coluna inicial do range (em geral A = 0).
 */
export function sheetToMatrix(
  ws: XLSX.WorkSheet,
  options: { maxCols?: number } = {},
): any[][] {
  const maxCols = options.maxCols ?? 45
  const ref = ws['!ref']
  if (!ref) return []
  const range = XLSX.utils.decode_range(ref)
  const rows: any[][] = []
  const lastCol = Math.min(range.e.c, range.s.c + maxCols - 1)

  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: any[] = []
    for (let c = range.s.c; c <= lastCol; c++) {
      const v = getCellValueWithMerges(ws, r, c)
      row.push(v === undefined || v === null ? '' : v)
    }
    rows.push(row)
  }
  return rows
}
