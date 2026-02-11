import { useState } from 'react'
import type { Course, CompleteClass } from '../../types'
import { CourseIcon } from '../map/CourseIcon'
import { CourseScheduleTable } from './CourseScheduleTable'
import { CourseModal } from '../map/CourseModal'

interface CourseScheduleCardProps {
  course: Course
  classes: CompleteClass[]
}

// course schedule card component
// displays course info (icon, name, description) and schedule table
// represents one course grid with its schedule
export function CourseScheduleCard({ course, classes }: CourseScheduleCardProps) {
  // state for course modal (ver calendário button)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)

  // handle ver calendário button click
  const handleViewCalendar = () => {
    setIsCourseModalOpen(true)
  }

  // close course modal
  const handleCloseCourseModal = () => {
    setIsCourseModalOpen(false)
  }

  return (
    <>
      <div
        className="rounded-xl p-4 flex flex-col border transition-all duration-200 bg-slate-800/50"
        style={{
          borderColor: `${course.color}30`,
        }}
      >
        {/* header section - icon, name, description */}
      <div className="mb-3">
          <div className="flex items-start gap-3">
            {/* icon */}
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200"
              style={{
                backgroundColor: `${course.color}15`,
              }}
            >
              <CourseIcon
                iconName={course.icon}
                size={24}
                color={course.color}
              />
            </div>

            {/* name and description */}
            <div className="flex-1">
              <h3 className="text-base font-bold text-white mb-0.5">
                {course.name}
              </h3>
              {course.description && (
                <p className="text-xs text-gray-400">
                  {course.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* title: Aulas da semana */}
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-white">Aulas da semana</h4>
        </div>

        {/* schedule table */}
        <div className="flex-1 mb-4 overflow-hidden">
          <CourseScheduleTable
            classes={classes}
            courseColor={course.color}
          />
        </div>

        {/* ver calendário button */}
        <div className="mt-auto">
          <button
            onClick={handleViewCalendar}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 touch-manipulation"
            style={{
              backgroundColor: course.color,
              minHeight: '40px',
            }}
          >
            Ver Calendário
          </button>
        </div>
      </div>

      {/* course modal - ver calendário */}
      <CourseModal
        course={course}
        classes={classes}
        isOpen={isCourseModalOpen}
        onClose={handleCloseCourseModal}
      />
    </>
  )
}
