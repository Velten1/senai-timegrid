import { useState, useMemo } from 'react'
import type { CalendarView, CompleteClass } from '../types'
import { getWeekDays } from '../utils/calendar'

export function useCalendar(classes: CompleteClass[]) {
  const [currentView, setCurrentView] = useState<CalendarView>('weekly')
  const [selectedDate, setSelectedDate] = useState(new Date())

  const classesByDay = useMemo(() => {
    const daysOfWeek: CompleteClass[][] = [[], [], [], [], [], [], []]

    classes.forEach((classItem) => {
      if (currentView === 'weekly' || currentView === 'grid') {
        // For weekly and grid views, group by day of week
        daysOfWeek[classItem.dayOfWeek].push(classItem)
      }
    })

    return daysOfWeek
  }, [classes, currentView])

  const weekDays = useMemo(() => {
    return getWeekDays(selectedDate)
  }, [selectedDate])

  const nextWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + 7)
    setSelectedDate(newDate)
  }

  const previousWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() - 7)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const nextMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(selectedDate.getMonth() + 1)
    setSelectedDate(newDate)
  }

  const previousMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(selectedDate.getMonth() - 1)
    setSelectedDate(newDate)
  }

  return {
    currentView,
    setCurrentView,
    selectedDate,
    setSelectedDate,
    classesByDay,
    weekDays,
    nextWeek,
    previousWeek,
    nextMonth,
    previousMonth,
    goToToday,
  }
}
