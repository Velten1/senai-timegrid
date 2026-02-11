import { useMemo } from 'react'
import type { Course } from '../../types'
import { CourseScheduleCard } from '../course/CourseScheduleCard'
import { getCompleteClasses } from '../../data/mockData'
import { classes } from '../../data/mockData'

interface CampusMapProps {
  courses: Course[]
}

// course grid component - displays courses with mini weekly calendars
// each course is shown as a card with its schedule for the next 5 days
export function CampusMap({ courses }: CampusMapProps) {
  // get all complete classes with related data (course, teacher, room)
  const completeClasses = useMemo(() => getCompleteClasses(classes), [])

  return (
    <div className="w-full">
      {/* course cards grid - responsive layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 lg:gap-8">
        {courses.map((course) => {
          // filter classes for this specific course
          const courseClasses = completeClasses.filter(
            (classItem) => classItem.courseId === course.id
          )

          return (
            <CourseScheduleCard
              key={course.id}
              course={course}
              classes={courseClasses}
            />
          )
        })}
      </div>
    </div>
  )
}
