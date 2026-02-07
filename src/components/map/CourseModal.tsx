import { useState, useEffect } from 'react'
import type { Course, CompleteClass } from '../../types'
import { getDayName } from '../../utils/formatting'
import { CourseIcon } from './CourseIcon'

interface CourseModalProps {
  course: Course
  classes: CompleteClass[]
  isOpen: boolean
  onClose: () => void
}

// modal component that displays course information
// shows course details, schedules with day selection tabs
// modern design optimized for totem display
export function CourseModal({ course, classes, isOpen, onClose }: CourseModalProps) {
  if (!isOpen) return null

  // state to track which day is currently selected (defaults to monday)
  const [selectedDay, setSelectedDay] = useState<number>(1)

  // auto-select current day when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date().getDay() // 0 = domingo, 1 = segunda, etc.
      // adjust to match our weekDays array (monday = 1, tuesday = 2, etc.)
      // if sunday (0), we'll keep it as monday (1) since we don't show sunday
      const adjustedDay = today === 0 ? 1 : today
      if (adjustedDay >= 1 && adjustedDay <= 6) {
        setSelectedDay(adjustedDay)
      }
    }
  }, [isOpen])

  // group classes by day of week for better organization
  const classesByDay = classes.reduce((acc, classItem) => {
    const dayName = getDayName(classItem.dayOfWeek)
    if (!acc[dayName]) {
      acc[dayName] = []
    }
    acc[dayName].push(classItem)
    return acc
  }, {} as Record<string, CompleteClass[]>)

  // always show monday to saturday, even if there are no classes
  const weekDays = [
    { dayOfWeek: 1, name: 'Segunda-feira', shortName: 'Seg' },
    { dayOfWeek: 2, name: 'Terça-feira', shortName: 'Ter' },
    { dayOfWeek: 3, name: 'Quarta-feira', shortName: 'Qua' },
    { dayOfWeek: 4, name: 'Quinta-feira', shortName: 'Qui' },
    { dayOfWeek: 5, name: 'Sexta-feira', shortName: 'Sex' },
    { dayOfWeek: 6, name: 'Sábado', shortName: 'Sáb' },
  ]

  // get classes for the selected day
  const selectedDayName = weekDays.find((d) => d.dayOfWeek === selectedDay)?.name || ''
  const selectedDayClasses = classesByDay[selectedDayName] || []

  return (
    <>
      {/* overlay - minimal backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-50 animate-modal-overlay"
        onClick={onClose}
      />

      {/* modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-slate-900 rounded-xl border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* header - clean and professional */}
          <div className="relative p-8 border-b border-slate-700">
            {/* top accent bar - simple line */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                backgroundColor: course.color,
              }}
            />

            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-6 flex-1">
                {/* icon - minimal and clean */}
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
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
                <div className="flex-1 pt-2">
                  {/* course name - prominent but professional */}
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {course.name}
                  </h2>
                  {/* course description */}
                  {course.description && (
                    <p className="text-gray-400 text-base leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>
              </div>
              {/* close button - larger for touch */}
              <button
                onClick={onClose}
                className="p-4 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all touch-manipulation"
                style={{ minWidth: '48px', minHeight: '48px' }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* content with day selection tabs */}
          <div className="p-8">
            {/* day selection tabs - minimal design */}
            <div className="flex flex-wrap gap-3 mb-8 pb-6 border-b border-slate-700">
              {weekDays.map((day) => {
                const isSelected = selectedDay === day.dayOfWeek
                return (
                  <button
                    key={day.dayOfWeek}
                    onClick={() => setSelectedDay(day.dayOfWeek)}
                    className="px-8 py-4 rounded-lg font-semibold text-base lg:text-lg transition-all duration-200 active:scale-95 touch-manipulation"
                    style={{
                      backgroundColor: isSelected
                        ? course.color
                        : 'rgba(51, 65, 85, 0.5)',
                      color: isSelected ? 'white' : 'rgb(148, 163, 184)',
                      border: isSelected
                        ? `1px solid ${course.color}`
                        : '1px solid rgba(51, 65, 85, 0.5)',
                      minHeight: '48px',
                      minWidth: '120px',
                    }}
                  >
                    <span className="hidden sm:inline">{day.name}</span>
                    <span className="sm:hidden">{day.shortName}</span>
                  </button>
                )
              })}
            </div>

            {/* selected day schedule */}
            <section>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div
                  className="w-2 h-8 rounded-full"
                  style={{ backgroundColor: course.color }}
                />
                {selectedDayName}
              </h3>

              {selectedDayClasses.length > 0 ? (
                <div className="space-y-4">
                  {selectedDayClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="p-6 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-white mb-3">
                            {classItem.title}
                          </h4>
                          {classItem.description && (
                            <p className="text-gray-300 text-sm mb-4">
                              {classItem.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                              <svg
                                className="w-5 h-5"
                                style={{ color: course.color }}
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
                              <span className="font-semibold">
                                {classItem.startTime} - {classItem.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <svg
                                className="w-5 h-5"
                                style={{ color: course.color }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              <span className="font-semibold">{classItem.room.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <svg
                                className="w-5 h-5"
                                style={{ color: course.color }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <span className="font-semibold">{classItem.teacher.name}</span>
                            </div>
                          </div>
                        </div>
                        {classItem.status && (
                          <div
                            className="px-4 py-2 rounded-full text-xs font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: `${course.color}20`,
                              color: course.color,
                            }}
                          >
                            {classItem.status === 'in_progress'
                              ? 'Em andamento'
                              : classItem.status === 'finished'
                              ? 'Finalizada'
                              : classItem.status === 'scheduled'
                              ? 'Agendada'
                              : 'Cancelada'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
                  <p className="text-gray-400 text-lg">
                    Nenhuma aula marcada para este dia
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* footer - minimal button */}
          <div className="p-6 border-t border-slate-700 flex justify-end bg-slate-900/50">
            <button
              onClick={onClose}
              className="px-12 py-5 rounded-lg font-semibold text-lg text-white transition-all duration-200 hover:opacity-90 active:scale-95 touch-manipulation"
              style={{
                backgroundColor: course.color,
                minHeight: '56px',
                minWidth: '140px',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
