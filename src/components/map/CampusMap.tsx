import type { Course, CompleteClass } from '../../types'
import type { Period } from '../../utils/courseSchedule'
import { CourseScheduleCard } from '../course/CourseScheduleCard'
import { filterClassesByPeriod } from '../../utils/courseSchedule'

interface CampusMapProps {
  courses: Course[]
  period: Period
  completeClasses: CompleteClass[]
  /** Somente cursos técnicos: grade compacta (3 dias × 5 horários). */
  isTechnicalModality?: boolean
}

// course grid component - displays courses with mini weekly calendars
// each course is shown as a card with its schedule for the next 5 days
export function CampusMap({ courses, period, completeClasses, isTechnicalModality = false }: CampusMapProps) {
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
              scheduleLayout={isTechnicalModality ? 'technical' : 'classic'}
            />
          )
        })}
      </div>
    </div>
  )
}
