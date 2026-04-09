import type { CompleteClass } from '../types'
import { addDays } from './calendar'

// Retorna sempre os dias fixos (Segunda a Sábado) da semana atual.
// Observação: usamos `Date` apenas para obter `getDay()` (1..6) na grade.
export function getNextFiveDays(): Date[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dow = today.getDay() // 0=Dom, 1=Seg, ... 6=Sáb
  const deltaToMonday = dow === 0 ? -6 : 1 - dow
  const monday = addDays(today, deltaToMonday)

  return [0, 1, 2, 3, 4, 5].map((i) => addDays(monday, i))
}

/** Mantido por compatibilidade: retorna Seg–Qua (3 primeiros dias fixos). */
export function getNextThreeDays(): Date[] {
  return getNextFiveDays().slice(0, 3)
}

/**
 * Até 5 faixas de horário para colunas (transp.vista técnica).
 * Preenche com null se o curso tiver menos de 5 horários distintos.
 */
export function getTechnicalDisplayTimeSlots(
  classes: CompleteClass[],
): Array<{ startTime: string; endTime: string } | null> {
  const unique = getTimeSlots(classes)
  const out: Array<{ startTime: string; endTime: string } | null> = []
  for (let i = 0; i < 5; i++) {
    out.push(unique[i] ?? null)
  }
  return out
}

// Retorna o nome do dia da semana (fixo), sem labels relativos (Hoje/Amanhã).
export function getRelativeDayLabel(date: Date): string {
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  return dayNames[date.getDay()]
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * MBA e POS (especialização): ordena por dia e ordem da aula; aplica a **mesma** faixa
 * (min início → max fim de todas as aulas do card) a cada linha — ex.: 09h00–16h00 ou 19h00–22h00.
 */
export function prepareMbaCourseClassesForDisplay(classes: CompleteClass[]): CompleteClass[] {
  if (classes.length === 0) return classes

  const sorted = [...classes].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
    const t =
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime) || a.id.localeCompare(b.id)
    return t
  })

  let minS = Infinity
  let maxE = -Infinity
  for (const c of sorted) {
    minS = Math.min(minS, timeToMinutes(c.startTime))
    maxE = Math.max(maxE, timeToMinutes(c.endTime))
  }
  const start = minutesToTime(minS)
  const end = minutesToTime(maxE)

  return sorted.map((c) => ({
    ...c,
    startTime: start,
    endTime: end,
  }))
}

// get all unique time slots from classes
// returns array of { startTime, endTime } objects sorted by start time
export function getTimeSlots(classes: CompleteClass[]): Array<{ startTime: string; endTime: string }> {
  const slots = new Set<string>()
  
  classes.forEach((classItem) => {
    const slotKey = `${classItem.startTime}-${classItem.endTime}`
    slots.add(slotKey)
  })

  return Array.from(slots)
    .map((slot) => {
      const [startTime, endTime] = slot.split('-')
      return { startTime, endTime }
    })
    .sort((a, b) => {
      // sort by start time
      const [aHour, aMin] = a.startTime.split(':').map(Number)
      const [bHour, bMin] = b.startTime.split(':').map(Number)
      const aMinutes = aHour * 60 + aMin
      const bMinutes = bHour * 60 + bMin
      return aMinutes - bMinutes
    })
}

// get classes for a specific time slot and day
export function getClassesForTimeSlotAndDay(
  classes: CompleteClass[],
  startTime: string,
  endTime: string,
  day: Date
): CompleteClass[] {
  const dayOfWeek = day.getDay()
  return classes.filter(
    (classItem) =>
      classItem.dayOfWeek === dayOfWeek &&
      classItem.startTime === startTime &&
      classItem.endTime === endTime
  )
}

// period type for filtering classes
export type Period = 'manha' | 'tarde' | 'noite' | null

// filter classes by period based on start time
// manhã: 00h até 12h
// tarde: 12h até 18h
// noite: 18h até 23h59
export function filterClassesByPeriod(classes: CompleteClass[], period: Period): CompleteClass[] {
  if (!period) return classes

  return classes.filter((classItem) => {
    const [startHour] = classItem.startTime.split(':').map(Number)

    switch (period) {
      case 'manha':
        return startHour >= 0 && startHour < 12
      case 'tarde':
        return startHour >= 12 && startHour < 18
      case 'noite':
        return startHour >= 18 && startHour < 24
      default:
        return true
    }
  })
}
