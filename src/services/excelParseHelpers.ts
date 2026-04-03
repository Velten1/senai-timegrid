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

const TURMA_NAME_MAX_LEN = 120

/**
 * Verifica se uma string parece ser um nome de turma/classe.
 * Aceita texto livre (espaços, acentos, símbolos comuns), exceto palavras/dias reservados.
 * Exemplos válidos: "CSTELI226N1", "17MGF TESTE", "MBA — Turma A"
 */
export function isTurmaName(value: string): boolean {
  const trimmed = String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .trim()
  if (!trimmed || trimmed.length < 2 || trimmed.length > TURMA_NAME_MAX_LEN) return false
  const low = trimmed.toLowerCase()
  const reserved = [
    'turma', 'aula', 'horário', 'horario', 'intervalo',
    't1', 't2', 'cai', 'cursos', 'classe', 'info',
    'disciplina', 'professor', 'local', 'data',
    'ensalamento', 'semestral',
  ]
  if (reserved.some((r) => low === r)) return false
  // Evitar confundir com cabeçalhos de dia/período (substring em qualquer lugar)
  if (/segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|semestre|manh[ãa]|tarde|noite|trimestre/i.test(trimmed)) {
    return false
  }
  if (/^(1[ºo°]|2[ºo°])\s/i.test(trimmed)) return false
  if (/intervalo/i.test(trimmed)) return false
  if (/[\r\n]/.test(trimmed)) return false
  return true
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

// ── Detecção de período do dia ────────────────────────────

/**
 * Detecta o período do dia analisando as primeiras linhas da planilha
 * Reconhece: NOTURNO/NOITE, MATUTINO/MANHÃ, VESPERTINO/TARDE, DIURNO, SÁBADO
 * @param defaultPeriod Período padrão caso nenhum seja detectado (default: 'noite')
 */
export function detectPeriod(
  data: any[][],
  defaultPeriod: 'manha' | 'tarde' | 'noite' | 'sabado' = 'noite',
): 'manha' | 'tarde' | 'noite' | 'sabado' {
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const text = (data[i] || []).map((c: any) => String(c || '')).join(' ').toUpperCase()
    if (text.includes('NOTURNO') || text.includes('NOITE')) return 'noite'
    if (text.includes('MATUTINO') || text.includes('MANHÃ') || text.includes('MANHA')) return 'manha'
    if (text.includes('VESPERTINO') || text.includes('TARDE')) return 'tarde'
    if (text.includes('DIURNO')) return 'manha'
    if (text.includes('SÁBADO') || text.includes('SABADO')) return 'sabado'
  }
  return defaultPeriod
}

// ── Extração de horário de uma célula ─────────────────────

/**
 * Extrai início e fim de uma string de horário de célula.
 * Aceita "8h - 9h", "8h–9h" (faixa) ou "8h" (horário único — assume 1h de duração).
 * Retorna null se nenhum dígito for encontrado.
 */
export function extractTimeFromCell(horarioStr: string): { start: string; end: string } | null {
  if (!horarioStr) return null
  if (horarioStr.includes('-') || horarioStr.includes('–')) {
    return parseTimeRange(horarioStr)
  }
  if (/\d/.test(horarioStr)) {
    const s = parseTimeString(horarioStr)
    const [h, m] = s.split(':').map(Number)
    const endMin = h * 60 + m + 60
    const eH = Math.min(Math.floor(endMin / 60), 23)
    const eM = endMin % 60
    return { start: s, end: `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}` }
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
