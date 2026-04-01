import type { CompleteClass } from '../types'
import { addDays } from './calendar'

// get array with next 5 days starting from today (excluding Sundays)
// returns array of date objects
export function getNextFiveDays(): Date[] {
  const days: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let currentDay = today
  let daysAdded = 0
  
  // Skip if today is Sunday, start from Monday
  if (currentDay.getDay() === 0) {
    currentDay = addDays(currentDay, 1)
  }
  
  // Get next 5 days (excluding Sundays)
  while (daysAdded < 5) {
    // Skip Sundays (day 0)
    if (currentDay.getDay() !== 0) {
      days.push(new Date(currentDay))
      daysAdded++
    }
    currentDay = addDays(currentDay, 1)
  }
  
  return days
}

/** Próximos 3 dias úteis a partir de hoje (exclui domingos). Para grade compacta de cursos técnicos. */
export function getNextThreeDays(): Date[] {
  const days: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let currentDay = today
  let daysAdded = 0

  if (currentDay.getDay() === 0) {
    currentDay = addDays(currentDay, 1)
  }

  while (daysAdded < 3) {
    if (currentDay.getDay() !== 0) {
      days.push(new Date(currentDay))
      daysAdded++
    }
    currentDay = addDays(currentDay, 1)
  }

  return days
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

// get label for a day relative to today
// returns "Hoje", "Amanhã" or day name (always shows day name from 3rd day onwards)
export function getRelativeDayLabel(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Amanhã'
  
  // from 3rd day onwards, always return the day name
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  return dayNames[date.getDay()]
}

/**
 * Segunda a sábado da semana corrente (não usado na grade dos cards —
 * lá usamos sempre {@link getNextFiveDays} para “hoje + 4 dias úteis”).
 * Mantida para outros usos eventualmente.
 */
export function getWeekDaysMondayToSaturday(): Date[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find current week's Monday
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = addDays(today, -daysToSubtract)

  // Return Mon(1) through Sat(6)
  const days: Date[] = []
  for (let i = 0; i < 6; i++) {
    days.push(addDays(monday, i))
  }
  return days
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
