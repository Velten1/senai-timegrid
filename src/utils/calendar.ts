/**
 * Utilitários de manipulação de datas.
 * 
 * Funções para adicionar dias/semanas/meses a datas
 * e para verificação de datas (isToday, isSameWeek).
 */

// ── Manipulação de datas ─────────────────────────────────

/**
 * Adiciona N dias a uma data e retorna nova Date (não modifica a original)
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(date.getDate() + days)
  return result
}
