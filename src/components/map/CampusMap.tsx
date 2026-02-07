import { useState, useMemo } from 'react'
import type { Course } from '../../types'
import { CourseModal } from './CourseModal'
import { CourseIcon } from './CourseIcon'
import { getCompleteClasses } from '../../data/mockData'
import { classes } from '../../data/mockData'

interface CampusMapProps {
  courses: Course[]
}

// modern course grid component - elegant card-based layout
// displays courses as large, interactive cards in a grid
// optimized for totem/kiosk display with touch-friendly interactions
export function CampusMap({ courses }: CampusMapProps) {
  // stores which course is currently selected (for modal)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // get all complete classes with related data (course, teacher, room)
  const completeClasses = useMemo(() => getCompleteClasses(classes), [])

  // handle course card click - opens modal with course info
  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course)
    setIsModalOpen(true)
  }

  // close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCourse(null)
  }

  // get classes for the selected course
  const selectedCourseClasses = useMemo(() => {
    if (!selectedCourse) return []
    return completeClasses.filter((classItem) => classItem.courseId === selectedCourse.id)
  }, [selectedCourse, completeClasses])

  return (
    <>
      {/* modern grid layout for courses */}
      <div className="w-full">
        {/* header section with title and subtitle */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-3">
            Nossos Cursos
          </h2>
          <p className="text-xl lg:text-2xl text-gray-400">
            Selecione um curso para ver informações detalhadas
          </p>
        </div>

        {/* course cards grid - responsive layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 lg:gap-8">
          {courses.map((course, index) => (
            <button
              key={course.id}
              onClick={() => handleCourseClick(course)}
              className="group relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg animate-fade-in-up opacity-0 touch-manipulation"
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'forwards',
              }}
            >
              {/* card background - clean and professional */}
              <div
                className="relative h-[280px] lg:h-[320px] rounded-xl p-6 lg:p-8 flex flex-col justify-between border transition-all duration-200 bg-slate-800/50 hover:bg-slate-800/70"
                style={{
                  borderColor: `${course.color}30`,
                }}
              >
                {/* content section */}
                <div className="relative z-10 h-full flex flex-col">
                  {/* icon section - minimal and professional */}
                  <div className="mb-4">
                    <div
                      className="w-14 h-14 lg:w-16 lg:h-16 rounded-lg flex items-center justify-center mb-4 transition-colors duration-200"
                      style={{
                        backgroundColor: `${course.color}15`,
                      }}
                    >
                      <CourseIcon
                        iconName={course.icon}
                        size={32}
                        color={course.color}
                      />
                    </div>
                  </div>

                  {/* course name and description */}
                  <div className="mb-3">
                    <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">
                      {course.name}
                    </h3>
                    {course.description && (
                      <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                        {course.description}
                      </p>
                    )}
                  </div>

                  {/* info preview - shows what's available */}
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-xs">Horários disponíveis</span>
                    </div>
                  </div>

                  {/* click indicator - minimal arrow */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                      <svg
                        className="w-4 h-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* course information modal */}
      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          classes={selectedCourseClasses}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}
