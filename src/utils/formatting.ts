// format a date object to brazilian format (dd/mm/yyyy)
export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// format a date range as "dd/mm/yyyy - dd/mm/yyyy"
export function formatDateRange(start: Date, end: Date): string {
  return `${formatDate(start)} - ${formatDate(end)}`
}

// format a date with full weekday and month names
// example: "segunda-feira, 01 de janeiro de 2026"
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// get the full name of a day of week (0=sunday, 1=monday, etc)
export function getDayName(day: number): string {
  const days = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ]
  return days[day] || ''
}

// get the abbreviated name of a day of week (0=sunday, 1=monday, etc)
export function getDayNameAbbrev(day: number): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return days[day] || ''
}

// calculate the duration between two times in minutes
// times should be in format "HH:MM"
export function calculateDuration(startTime: string, endTime: string): number {
  // split time strings and convert to numbers
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  // convert to total minutes for easier calculation
  const start = startHour * 60 + startMinute
  const end = endHour * 60 + endMinute

  return end - start // returns in minutes
}

// format a duration in minutes to a human-readable string
// examples: "2h30min", "1h", "45min"
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60) // get whole hours
  const mins = minutes % 60 // get remaining minutes

  // format based on what we have
  if (hours > 0 && mins > 0) {
    return `${hours}h${mins}min`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${mins}min`
  }
}

// determine the current status of a class based on its time and day
// compares current date/time with class schedule
export function getClassStatus(
  startTime: string,
  endTime: string,
  dayOfWeek: number
): 'scheduled' | 'in_progress' | 'finished' {
  const now = new Date()
  const today = now.getDay() // 0=sunday, 1=monday, etc
  const [currentHour, currentMinute] = [now.getHours(), now.getMinutes()]
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  // if class day is before today, it's finished
  if (dayOfWeek < today) {
    return 'finished'
  }
  // if class day is after today, it's scheduled
  else if (dayOfWeek > today) {
    return 'scheduled'
  }
  // if it's the same day, check the time
  else {
    // convert everything to minutes for comparison
    const currentMinutes = currentHour * 60 + currentMinute
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    // before start time = scheduled
    if (currentMinutes < startMinutes) {
      return 'scheduled'
    }
    // between start and end = in progress
    else if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return 'in_progress'
    }
    // after end time = finished
    else {
      return 'finished'
    }
  }
}
