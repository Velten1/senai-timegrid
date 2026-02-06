export function getWeekStart(date: Date): Date {
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

export function getWeekDays(date: Date): Date[] {
  const weekStart = getWeekStart(date)
  const days: Date[] = []

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    days.push(day)
  }

  return days
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function isSameWeek(date1: Date, date2: Date): boolean {
  const weekStart1 = getWeekStart(date1)
  const weekStart2 = getWeekStart(date2)
  return weekStart1.getTime() === weekStart2.getTime()
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(date.getDate() + days)
  return result
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(date.getMonth() + months)
  return result
}
