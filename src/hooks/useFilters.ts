import { useState, useMemo } from 'react'
import type { Filters, CompleteClass } from '../types'

export function useFilters(classes: CompleteClass[]) {
  const [filters, setFilters] = useState<Filters>({})

  const filteredClasses = useMemo(() => {
    return classes.filter((classItem) => {
      if (filters.courseId && classItem.courseId !== filters.courseId) return false
      if (filters.teacherId && classItem.teacherId !== filters.teacherId) return false
      if (filters.period && classItem.period !== filters.period) return false
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        return (
          classItem.title.toLowerCase().includes(searchLower) ||
          classItem.course.name.toLowerCase().includes(searchLower) ||
          classItem.teacher.name.toLowerCase().includes(searchLower) ||
          classItem.room.name.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }, [classes, filters])

  const updateFilter = (key: keyof Filters, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  return {
    filters,
    filteredClasses,
    updateFilter,
    clearFilters,
  }
}
