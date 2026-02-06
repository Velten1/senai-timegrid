import { useState, useMemo } from 'react'
import type { CalendarView, CompleteClass } from '../types'
import { getWeekDays } from '../utils/calendar'

// custom hook to manage calendar state and organize classes by day
// handles view switching, date navigation, and class grouping
export function useCalendar(classes: CompleteClass[]) {
  // stores which view is currently active (weekly, monthly, or grid)
  const [currentView, setCurrentView] = useState<CalendarView>('weekly')
  
  // stores the currently selected date (used for navigation)
  // starts with today's date
  const [selectedDate, setSelectedDate] = useState(new Date())

  // memoized calculation that groups classes by day of week
  // creates an array with 7 positions (one for each day: sunday=0, monday=1, etc)
  // only recalculates when classes or view changes
  const classesByDay = useMemo(() => {
    // initialize array with 7 empty arrays (one per day)
    const daysOfWeek: CompleteClass[][] = [[], [], [], [], [], [], []]

    // loop through all classes and put each one in its corresponding day array
    classes.forEach((classItem) => {
      // only group by day for weekly and grid views
      if (currentView === 'weekly' || currentView === 'grid') {
        // dayOfWeek is 0-6 (0=sunday, 1=monday, etc)
        // push this class into the correct day's array
        daysOfWeek[classItem.dayOfWeek].push(classItem)
      }
    })

    return daysOfWeek
  }, [classes, currentView])

  // memoized calculation that gets all 7 days of the week for selected date
  // only recalculates when selectedDate changes
  const weekDays = useMemo(() => {
    return getWeekDays(selectedDate)
  }, [selectedDate])

  // function to move forward one week
  const nextWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + 7) // add 7 days
    setSelectedDate(newDate)
  }

  // function to move backward one week
  const previousWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() - 7) // subtract 7 days
    setSelectedDate(newDate)
  }

  // function to jump back to today's date
  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // function to move forward one month
  const nextMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(selectedDate.getMonth() + 1)
    setSelectedDate(newDate)
  }

  // function to move backward one month
  const previousMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(selectedDate.getMonth() - 1)
    setSelectedDate(newDate)
  }

  // return everything components need to display and navigate the calendar
  return {
    currentView, // which view is active
    setCurrentView, // function to change view
    selectedDate, // current date being viewed
    setSelectedDate, // function to change date
    classesByDay, // classes organized by day of week
    weekDays, // array of 7 dates for current week
    nextWeek, // navigate forward one week
    previousWeek, // navigate backward one week
    nextMonth, // navigate forward one month
    previousMonth, // navigate backward one month
    goToToday, // jump to today
  }
}
