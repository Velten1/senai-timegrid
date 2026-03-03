import { useMemo, useState } from 'react'
import type { CompleteClass } from '../../types'
import { getNextFiveDays, getWeekDaysMondayToSaturday, getRelativeDayLabel, getTimeSlots, getClassesForTimeSlotAndDay } from '../../utils/courseSchedule'
import { ClassDetailModal } from './ClassDetailModal'

interface CourseScheduleTableProps {
  classes: CompleteClass[]
  courseColor: string
}

// compact schedule table component for use inside course cards
// displays time slots as rows and days as columns
// shows all classes for the week (not filtered by time)
// automatically detects Saturday classes and expands to Mon-Sat
export function CourseScheduleTable({ classes, courseColor }: CourseScheduleTableProps) {
  // Use all classes (not filtered) to show complete weekly schedule
  // This ensures all slots are visible, not just future ones
  const relevantClasses = useMemo(() => classes, [classes])
  
  // get all unique time slots from all classes
  const timeSlots = useMemo(() => getTimeSlots(classes), [classes])
  
  // Check if any class is on Saturday → use Mon-Sat view
  const hasSaturdayClasses = useMemo(
    () => classes.some((c) => c.dayOfWeek === 6),
    [classes]
  )

  // get days to display: 5 days (Mon-Fri rolling) or 6 days (Mon-Sat fixed week)
  const days = useMemo(
    () => hasSaturdayClasses ? getWeekDaysMondayToSaturday() : getNextFiveDays(),
    [hasSaturdayClasses]
  )

  // state for class detail modal
  const [selectedClass, setSelectedClass] = useState<CompleteClass | null>(null)
  const [selectedDayLabel, setSelectedDayLabel] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // handle class click - opens class detail modal
  const handleClassClick = (classItem: CompleteClass, day: Date) => {
    const dayLabel = getRelativeDayLabel(day)
    
    setSelectedClass(classItem)
    setSelectedDayLabel(dayLabel)
    setIsModalOpen(true)
  }

  // close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedClass(null)
  }

  return (
    <>
      <div className="w-full">
        <div className={`grid ${hasSaturdayClasses ? 'grid-cols-7' : 'grid-cols-6'} gap-2`}>
          {/* first column: time slots */}
          <div className="col-span-1">
            {/* empty header spacer to align with day column headers */}
            <div className="text-center text-sm font-medium text-gray-300 mb-2">&nbsp;</div>
            <div className="space-y-2">
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center h-24 text-sm font-medium text-gray-400"
                >
                  <span>{slot.startTime.replace(':', 'h')}</span>
                  <span>{slot.endTime.replace(':', 'h')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* day columns */}
          {days.map((day, dayIndex) => {
            const label = getRelativeDayLabel(day)
            return (
              <div key={dayIndex} className="col-span-1">
                {/* day header */}
                <div className="text-center text-sm font-medium text-gray-300 mb-2">
                  {label}
                </div>
                {/* time slot cells */}
                <div className="space-y-2">
                  {timeSlots.map((slot, slotIndex) => {
                    const dayClasses = getClassesForTimeSlotAndDay(
                      relevantClasses,
                      slot.startTime,
                      slot.endTime,
                      day
                    )
                    const hasClasses = dayClasses.length > 0

                    return (
                      <button
                        key={slotIndex}
                        onClick={() => hasClasses && dayClasses[0] && handleClassClick(dayClasses[0], day)}
                        disabled={!hasClasses}
                        className={`
                          w-full min-h-24 h-24 rounded-lg border transition-all duration-200 relative overflow-hidden
                          flex items-center justify-center
                          ${hasClasses
                            ? 'bg-slate-700/50 border-slate-600/50 cursor-pointer hover:bg-slate-700/70 active:scale-[0.98] touch-manipulation'
                            : 'bg-slate-800/30 border-slate-700/50 cursor-default'
                          }
                        `}
                      >
                        {/* class content */}
                        {hasClasses ? (
                          <div className="p-2 w-full h-full flex flex-col justify-center">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-white line-clamp-1 text-center">
                                {dayClasses[0].title}
                              </p>
                              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-300">
                                <svg
                                  className="w-3 h-3 flex-shrink-0"
                                  style={{ color: courseColor }}
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
                                <span className="line-clamp-1">{dayClasses[0].room.name}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                                <svg
                                  className="w-3 h-3 flex-shrink-0"
                                  style={{ color: courseColor }}
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
                                <span className="line-clamp-1">{dayClasses[0].teacher.name}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 w-full h-full flex items-center justify-center">
                            <p className="text-[10px] text-gray-500 text-center leading-tight">
                              Nenhuma aula<br />programada
                            </p>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* class detail modal */}
      {selectedClass && (
        <ClassDetailModal
          classItem={selectedClass}
          dayLabel={selectedDayLabel}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}
