import type { Course, CompleteClass } from '../../types'
import {
  type Period,
  filterClassesByPeriod,
  prepareMbaCourseClassesForDisplay,
} from '../../utils/courseSchedule'
import { CourseScheduleCard } from '../course/CourseScheduleCard'
import type { CourseScheduleLayout } from '../course/CourseScheduleTable'

interface CampusMapProps {
  courses: Course[]
  period: Period
  completeClasses: CompleteClass[]
  /** Somente cursos técnicos: grade compacta (3 dias × 5 horários). */
  isTechnicalModality?: boolean
  /** Sobrescreve o layout derivado de `isTechnicalModality` (ex.: MBA). */
  scheduleLayout?: CourseScheduleLayout
}

// course grid component - displays courses with mini weekly calendars
// each course is shown as a card with its schedule for the next 5 days
export function CampusMap({
  courses,
  period,
  completeClasses,
  isTechnicalModality = false,
  scheduleLayout: scheduleLayoutProp,
}: CampusMapProps) {
  const scheduleLayout: CourseScheduleLayout =
    scheduleLayoutProp ?? (isTechnicalModality ? 'technical' : 'classic')

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

          // Layout 'mba': MBA e POS — faixa única (ex. 09h–16h) + uma linha por aula
          if (scheduleLayout === 'mba') {
            courseClasses = prepareMbaCourseClassesForDisplay(courseClasses)
          }

          return (
            <CourseScheduleCard
              key={course.id}
              course={course}
              classes={courseClasses}
              scheduleLayout={scheduleLayout}
            />
          )
        })}
      </div>
    </div>
  )
}
