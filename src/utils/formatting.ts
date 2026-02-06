export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateRange(start: Date, end: Date): string {
  return `${formatDate(start)} - ${formatDate(end)}`
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

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

export function getDayNameAbbrev(day: number): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return days[day] || ''
}

export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const start = startHour * 60 + startMinute
  const end = endHour * 60 + endMinute

  return end - start // returns in minutes
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) {
    return `${hours}h${mins}min`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${mins}min`
  }
}

export function getClassStatus(
  startTime: string,
  endTime: string,
  dayOfWeek: number
): 'scheduled' | 'in_progress' | 'finished' {
  const now = new Date()
  const today = now.getDay()
  const [currentHour, currentMinute] = [now.getHours(), now.getMinutes()]
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  if (dayOfWeek < today) {
    return 'finished'
  } else if (dayOfWeek > today) {
    return 'scheduled'
  } else {
    // Same day
    const currentMinutes = currentHour * 60 + currentMinute
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    if (currentMinutes < startMinutes) {
      return 'scheduled'
    } else if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return 'in_progress'
    } else {
      return 'finished'
    }
  }
}
