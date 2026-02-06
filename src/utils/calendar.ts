// get the sunday (start of week) for a given date
// returns a new date object set to midnight of that sunday
export function getWeekStart(date: Date): Date {
  const weekStart = new Date(date)
  // subtract the day of week to get back to sunday (0)
  weekStart.setDate(date.getDate() - date.getDay())
  // set to midnight for consistency
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

// get an array of all 7 days in the week containing the given date
// returns array of date objects from sunday to saturday
export function getWeekDays(date: Date): Date[] {
  const weekStart = getWeekStart(date)
  const days: Date[] = []

  // loop 7 times to get all days of the week
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    // add i days to get each day of the week
    day.setDate(weekStart.getDate() + i)
    days.push(day)
  }

  return days
}

// check if a given date is today
// compares day, month, and year
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

// check if two dates are in the same week
// compares the week start dates
export function isSameWeek(date1: Date, date2: Date): boolean {
  const weekStart1 = getWeekStart(date1)
  const weekStart2 = getWeekStart(date2)
  // compare timestamps to see if they're the same date
  return weekStart1.getTime() === weekStart2.getTime()
}

// add a number of days to a date
// returns a new date object (doesn't modify original)
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(date.getDate() + days)
  return result
}

// add a number of weeks to a date
// uses addDays internally (1 week = 7 days)
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

// add a number of months to a date
// returns a new date object (doesn't modify original)
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(date.getMonth() + months)
  return result
}
