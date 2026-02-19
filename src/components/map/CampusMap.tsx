import { useMemo } from 'react'
import type { Course } from '../../types'
import type { Period } from '../../utils/courseSchedule'
import { CourseScheduleCard } from '../course/CourseScheduleCard'
import { getCompleteClasses } from '../../data/mockData'
import { classes } from '../../data/mockData'
import { filterClassesByPeriod } from '../../utils/courseSchedule'

interface CampusMapProps {
  courses: Course[]
  period: Period
}

// course grid component - displays courses with mini weekly calendars
// each course is shown as a card with its schedule for the next 5 days
export function CampusMap({ courses, period }: CampusMapProps) {
  // get all complete classes with related data (course, teacher, room)
  const completeClasses = useMemo(() => getCompleteClasses(classes), [])

  return (
    <div className="w-full">
      {/* course cards grid - responsive layout */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8">
        {courses.map((course) => {
          // filter classes for this specific course
          let courseClasses = completeClasses.filter(
            (classItem) => classItem.courseId === course.id
          )

          // apply period filter if selected
          if (period) {
            courseClasses = filterClassesByPeriod(courseClasses, period)
          }

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
