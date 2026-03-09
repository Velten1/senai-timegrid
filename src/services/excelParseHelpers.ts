/**
 * Utilitários compartilhados para parsing de planilhas Excel.
 * 
 * Este arquivo contém funções auxiliares usadas por:
 * - excelServiceSuperiorPosGrad
 * - excelSuperiorPosGradParser
 * 
 * Funções:
 * - Parsing de horários (conversão de strings para formato "HH:MM")
 * - Detecção de nomes de turma
 * - Mapeamento de dias da semana
 * - Cálculo de horários distribuídos
 */

// ── Parsing de horários ───────────────────────────────────

/**
 * Converte string de horário do Excel para formato "HH:MM"
 * Aceita: "8h45" → "08:45", "10h15" → "10:15", "8h" → "08:00", "18:25" → "18:25"
 */
export function parseTimeString(raw: string): string {
  const trimmed = raw.trim()
  // Formato "8h45", "18h25", "8h"
  const hMatch = trimmed.match(/(\d{1,2})h(\d{0,2})/)
  if (hMatch) {
    const hour = hMatch[1].padStart(2, '0')
    const min = (hMatch[2] || '00').padStart(2, '0')
    return `${hour}:${min}`
  }
  // Formato "18:25", "8:45" (usado em algumas planilhas)
  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (colonMatch) {
    return `${colonMatch[1].padStart(2, '0')}:${colonMatch[2]}`
  }
  return '00:00'
}

/**
 * Extrai horário de início e fim de uma string
 * Exemplo: "8h - 8h45" → { start: "08:00", end: "08:45" }
 */
export function parseTimeRange(horario: string): { start: string; end: string } {
  const parts = horario.split(/\s*[-–]\s*/)
  if (parts.length === 2) {
    return { start: parseTimeString(parts[0]), end: parseTimeString(parts[1]) }
  }
  return { start: '00:00', end: '00:00' }
}

// ── Detecção de turmas ────────────────────────────────────

/**
 * Verifica se uma string parece ser um nome de turma
 * Exemplos válidos: "CSTELI226N1", "17MGF", "2MB"
 */
export function isTurmaName(value: string): boolean {
  if (!value || value.length > 25 || value.length < 2) return false
  const low = value.toLowerCase()
  // Lista de palavras reservadas que não são turmas
  const reserved = [
    'turma', 'aula', 'horário', 'horario', 'intervalo',
    't1', 't2', 'cai', 'cursos', 'classe', 'info',
    'disciplina', 'professor', 'local', 'data',
    'ensalamento', 'semestral',
  ]
  if (reserved.some((r) => low === r)) return false
  // Rejeitar strings que contêm nomes de dias, períodos, etc
  if (/segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|semestre|manh[ãa]|tarde|noite|trimestre/i.test(value)) return false
  if (/^(1[ºo]|2[ºo])\s/i.test(value)) return false
  if (/intervalo/i.test(value)) return false
  // Turma: começa com dígito ou letra, alfanumérico + hífens/pontos
  return /^[\dA-Z][\dA-Za-z\-\.]*$/i.test(value)
}

// ── Mapeamento de dias da semana ──────────────────────────

/**
 * Mapeamento de nomes de dias para números
 * 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
 */
export const DAY_NAME_MAP: Record<string, number> = {
  segunda: 1,
  terca: 2,
  'terça': 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
  'sábado': 6,
}

/**
 * Normaliza texto removendo acentos para comparação
 */
function normalizeDayText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Converte texto de dia da semana para número
 * Exemplos: "Segunda" → 1, "Terça-feira" → 2, "Sábado" → 6
 */
export function getDayNumberFromText(text: string): number | null {
  const normalized = normalizeDayText(text)
  for (const [dayName, dayNum] of Object.entries(DAY_NAME_MAP)) {
    if (normalized.includes(normalizeDayText(dayName))) return dayNum
  }
  return null
}

// ── Cálculo de horários intermediários ────────────────────

/**
 * Distribui um intervalo de tempo em N aulas de 1 hora cada
 * 
 * Exemplo: das 8h às 11h com 3 aulas → 
 *   [{ start: "08:00", end: "09:00" }, 
 *    { start: "09:00", end: "10:00" }, 
 *    { start: "10:00", end: "11:00" }]
 */
export function calculateHourlyTimes(
  startTime: string,
  endTime: string,
  numClasses: number,
): Array<{ start: string; end: string }> {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  const startMin = startH * 60 + startM
  const endMin = endH * 60 + endM
  const times: Array<{ start: string; end: string }> = []

  for (let i = 0; i < numClasses; i++) {
    const s = startMin + i * 60
    let e = s + 60
    if (e > endMin) e = endMin

    const fmt = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

    times.push({ start: fmt(s), end: fmt(e) })
    if (e >= endMin) break
  }

  return times
}
