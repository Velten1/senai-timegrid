import type { CompleteClass } from '../types'
import { addDays } from './calendar'

// get all classes that occur on a specific day
// filters classes by matching dayOfWeek with the day's weekday
export function getClassesForDay(classes: CompleteClass[], day: Date): CompleteClass[] {
  const dayOfWeek = day.getDay() // 0 = sunday, 1 = monday, etc.
  return classes.filter((classItem) => classItem.dayOfWeek === dayOfWeek)
}

// check if there are any classes on a specific day
// returns true if at least one class exists for that day
export function hasClassesOnDay(classes: CompleteClass[], day: Date): boolean {
  return getClassesForDay(classes, day).length > 0
}

// get array with next 5 days starting from today
// returns array of date objects
export function getNextFiveDays(): Date[] {
  const days: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < 5; i++) {
    days.push(addDays(today, i))
  }
  
  return days
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

// filter classes that are relevant based on current time
// removes classes that have already finished today
export function getRelevantClasses(classes: CompleteClass[]): CompleteClass[] {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTimeInMinutes = currentHour * 60 + currentMinute
  const today = now.getDay() // 0 = sunday, 1 = monday, etc.

  return classes.filter((classItem) => {
    const [startHour, startMinute] = classItem.startTime.split(':').map(Number)
    const startTimeInMinutes = startHour * 60 + startMinute

    // if class is on a future day, always include it
    if (classItem.dayOfWeek > today) {
      return true
    }

    // if class is on a past day, exclude it
    if (classItem.dayOfWeek < today) {
      return false
    }

    // if class is today, only include if it hasn't started yet or is in progress
    // include if start time is >= current time
    return startTimeInMinutes >= currentTimeInMinutes
  })
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
