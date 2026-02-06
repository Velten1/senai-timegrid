import { useState, useMemo } from 'react'
import type { Filters, CompleteClass } from '../types'

// custom hook to manage filtering logic for classes
// receives all classes and returns filtered results based on user selections
export function useFilters(classes: CompleteClass[]) {
  // stores the current filter values (course, teacher, period, search)
  // starts empty, meaning no filters applied initially
  const [filters, setFilters] = useState<Filters>({})

  // memoized calculation that filters classes based on current filter state
  // only recalculates when classes or filters change (performance optimization)
  const filteredClasses = useMemo(() => {
    return classes.filter((classItem) => {
      // if course filter is set, check if this class matches
      if (filters.courseId && classItem.courseId !== filters.courseId) return false
      
      // if teacher filter is set, check if this class matches
      if (filters.teacherId && classItem.teacherId !== filters.teacherId) return false
      
      // if period filter is set, check if this class matches
      if (filters.period && classItem.period !== filters.period) return false
      
      // if search filter is set, check if search text appears in any field
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        return (
          classItem.title.toLowerCase().includes(searchLower) ||
          classItem.course.name.toLowerCase().includes(searchLower) ||
          classItem.teacher.name.toLowerCase().includes(searchLower) ||
          classItem.room.name.toLowerCase().includes(searchLower)
        )
      }
      
      // if no filters or all filters passed, include this class
      return true
    })
  }, [classes, filters])

  // function to update a specific filter value
  // uses functional update to preserve other filter values
  const updateFilter = (key: keyof Filters, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev, // keep existing filters
      [key]: value || undefined, // update only the specified filter
    }))
  }

  // function to clear all filters at once
  const clearFilters = () => {
    setFilters({})
  }

  // return everything the component needs to use filters
  return {
    filters, // current filter state
    filteredClasses, // calculated filtered results
    updateFilter, // function to change a filter
    clearFilters, // function to reset all filters
  }
}
