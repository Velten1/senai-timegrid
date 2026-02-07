import { useState } from 'react'
import type { Course, CompleteClass } from '../../types'
import { getDayName } from '../../utils/formatting'

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
      {/* overlay with blur effect for depth - animated fade in */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 animate-modal-overlay"
        onClick={onClose}
      />

      {/* modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: `0 30px 100px ${course.color}40`,
          }}
        >
          {/* header with course color accent */}
          <div
            className="relative p-10 border-b border-slate-700/50"
            style={{
              background: `linear-gradient(135deg, ${course.color}20 0%, transparent 100%)`,
            }}
          >
            {/* top accent bar - elegant gradient line */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl"
              style={{
                background: `linear-gradient(90deg, ${course.color} 0%, ${course.color}80 50%, transparent 100%)`,
              }}
            />

            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-6 flex-1">
                {/* large icon with glow */}
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${course.color} 0%, ${course.color}dd 100%)`,
                    boxShadow: `0 15px 50px ${course.color}50`,
                  }}
                >
                  {course.icon}
                </div>
                <div className="flex-1 pt-2">
                  {/* course name - very prominent */}
                  <h2 className="text-4xl font-bold text-white mb-3">
                    {course.name}
                  </h2>
                  {/* course description - better readability */}
                  {course.description && (
                    <p className="text-gray-300 text-lg leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>
              </div>
              {/* close button */}
              <button
                onClick={onClose}
                className="p-3 rounded-xl text-gray-400 hover:text-white hover:bg-slate-700/50 transition-all"
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
          <div className="p-10">
            {/* day selection tabs */}
            <div className="flex flex-wrap gap-3 mb-8 pb-6 border-b border-slate-700/50">
              {weekDays.map((day) => {
                const isSelected = selectedDay === day.dayOfWeek
                return (
                  <button
                    key={day.dayOfWeek}
                    onClick={() => setSelectedDay(day.dayOfWeek)}
                    className="px-6 py-3 rounded-xl font-semibold text-sm lg:text-base transition-all duration-200"
                    style={{
                      backgroundColor: isSelected
                        ? course.color
                        : 'rgba(51, 65, 85, 0.3)',
                      color: isSelected ? 'white' : 'rgb(148, 163, 184)',
                      border: isSelected
                        ? `2px solid ${course.color}`
                        : '2px solid rgba(51, 65, 85, 0.5)',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isSelected
                        ? `0 4px 20px ${course.color}40`
                        : 'none',
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
                      className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all"
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
                <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm text-center">
                  <p className="text-gray-400 text-lg">
                    Nenhuma aula marcada para este dia
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* footer with elegant button */}
          <div className="p-6 border-t border-slate-700/50 flex justify-end bg-slate-900/30">
            <button
              onClick={onClose}
              className="px-10 py-4 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105 shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${course.color} 0%, ${course.color}dd 100%)`,
                boxShadow: `0 8px 30px ${course.color}60`,
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
