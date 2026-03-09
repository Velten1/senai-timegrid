import { useMemo, useState } from 'react'
import type { CompleteClass } from '../../types'
import { getNextFiveDays, getWeekDaysMondayToSaturday, getRelativeDayLabel, getTimeSlots, getClassesForTimeSlotAndDay } from '../../utils/courseSchedule'
import { ClassDetailModal } from './ClassDetailModal'

interface CourseScheduleTableProps {
  classes: CompleteClass[]
  courseColor: string
}

/**
 * Tabela semanal compacta — horários como linhas, dias como colunas.
 * Estilo SENAI: células com aula em vermelho forte, texto branco.
 */
export function CourseScheduleTable({ classes }: CourseScheduleTableProps) {
  const timeSlots = useMemo(() => getTimeSlots(classes), [classes])
  
  const hasSaturdayClasses = useMemo(
    () => classes.some((c) => c.dayOfWeek === 6),
    [classes]
  )

  const days = useMemo(
    () => hasSaturdayClasses ? getWeekDaysMondayToSaturday() : getNextFiveDays(),
    [hasSaturdayClasses]
  )

  const [selectedClass, setSelectedClass] = useState<CompleteClass | null>(null)
  const [selectedDayLabel, setSelectedDayLabel] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClassClick = (classItem: CompleteClass, day: Date) => {
    setSelectedClass(classItem)
    setSelectedDayLabel(getRelativeDayLabel(day))
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedClass(null)
  }

  return (
    <>
      <div className="w-full">
        <div className={`grid ${hasSaturdayClasses ? 'grid-cols-7' : 'grid-cols-6'} gap-1.5`}>
          {/* Coluna de horários */}
          <div className="col-span-1">
            <div className="text-center text-xs font-bold text-[#878787] mb-1.5 uppercase tracking-wider">&nbsp;</div>
            <div className="space-y-1.5">
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center h-24 text-xs font-bold text-[#878787]"
                >
                  <span>{slot.startTime.replace(':', 'h')}</span>
                  <span className="text-[10px] text-gray-400">até</span>
                  <span>{slot.endTime.replace(':', 'h')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Colunas de dias */}
          {days.map((day, dayIndex) => {
            const label = getRelativeDayLabel(day)
            return (
              <div key={dayIndex} className="col-span-1">
                {/* Cabeçalho do dia — vermelho */}
                <div className="text-center text-xs font-bold text-[#e30613] mb-1.5 uppercase tracking-wider">
                  {label}
                </div>
                {/* Células de horários */}
                <div className="space-y-1.5">
                  {timeSlots.map((slot, slotIndex) => {
                    const dayClasses = getClassesForTimeSlotAndDay(
                      classes,
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
                            ? 'bg-[#e30613] border-[#9a1915] cursor-pointer hover:bg-[#9a1915] active:scale-[0.97] touch-manipulation shadow-sm'
                            : 'bg-[#f5f5f5] border-gray-200 cursor-default'
                          }
                        `}
                      >
                        {hasClasses ? (
                          <div className="p-1.5 w-full h-full flex flex-col justify-center">
                            <div className="space-y-0.5">
                              <p className="text-[11px] font-bold text-white line-clamp-2 text-center leading-tight">
                                {dayClasses[0].title}
                              </p>
                              <div className="flex items-center justify-center gap-1 text-[9px] text-white/80">
                                <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span className="line-clamp-1">{dayClasses[0].room.name}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1 text-[9px] text-white/70">
                                <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="line-clamp-1">{dayClasses[0].teacher.name}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-1 w-full h-full flex items-center justify-center">
                            <p className="text-[9px] text-gray-400 text-center leading-tight">
                              —
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

      {/* Modal de detalhe */}
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
