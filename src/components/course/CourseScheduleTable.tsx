import { useMemo, useState } from 'react'
import type { CompleteClass } from '../../types'
import {
  getNextFiveDays,
  getRelativeDayLabel,
  getNextThreeDaysDynamic,
  getRelativeDayLabelDynamic,
  getTimeSlots,
  getTechnicalDisplayTimeSlots,
  getClassesForTimeSlotAndDay,
} from '../../utils/courseSchedule'
import { ClassDetailModal } from './ClassDetailModal'

export type CourseScheduleLayout = 'classic' | 'technical' | 'mba'

interface CourseScheduleTableProps {
  classes: CompleteClass[]
  courseColor: string
  /** Cursos técnicos: dias na vertical (3), horários no topo (5) — mais compacto. */
  layout?: CourseScheduleLayout
}

/**
 * Tabela semanal — classic: horários nas linhas, dias nas colunas.
 * technical: dias na esquerda (3), horários no topo (5), só cursos técnicos.
 * mba: mesma faixa de horário em todas as linhas; uma linha por aula (1ª, 2ª, 3ª…).
 */
export function CourseScheduleTable({ classes, layout = 'classic' }: CourseScheduleTableProps) {
  if (layout === 'technical') {
    return <CourseScheduleTableTechnical classes={classes} />
  }
  if (layout === 'mba') {
    return <CourseScheduleTableMba classes={classes} />
  }
  return <CourseScheduleTableClassic classes={classes} />
}

/** MBA: várias aulas no mesmo período (ex. 19h–22h), uma célula por aula — sem fundir disciplinas. */
function CourseScheduleTableMba({ classes }: { classes: CompleteClass[] }) {
  const days = useMemo(() => getNextFiveDays(), [])

  const { maxRows, byDay, displaySlot } = useMemo(() => {
    const m = new Map<number, CompleteClass[]>()
    for (const c of classes) {
      const arr = m.get(c.dayOfWeek) ?? []
      arr.push(c)
      m.set(c.dayOfWeek, arr)
    }
    let max = 0
    for (const arr of m.values()) max = Math.max(max, arr.length)
    const slot =
      classes.length > 0
        ? { startTime: classes[0].startTime, endTime: classes[0].endTime }
        : { startTime: '00:00', endTime: '00:00' }
    return { maxRows: Math.max(max, 1), byDay: m, displaySlot: slot }
  }, [classes])

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

  const rowIndices = Array.from({ length: maxRows }, (_, i) => i)

  return (
    <>
      <div className="w-full">
        <div className="grid grid-cols-7 gap-1.5">
          <div className="col-span-1">
            <div className="text-center text-xs font-bold text-[#878787] mb-1.5 uppercase tracking-wider">
              &nbsp;
            </div>
          </div>
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="col-span-1">
              <div className="text-center text-xs font-bold text-[#e30613] mb-1.5 uppercase tracking-wider">
                {getRelativeDayLabel(day)}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          {rowIndices.map((rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-7 gap-1.5">
              <div className="col-span-1 flex flex-col items-center justify-center h-24 text-xs font-bold text-[#878787]">
                <span>{displaySlot.startTime.replace(':', 'h')}</span>
                <span className="text-[10px] text-gray-400">até</span>
                <span>{displaySlot.endTime.replace(':', 'h')}</span>
              </div>
              {days.map((day, dayIndex) => {
                const dow = day.getDay()
                const dayList = byDay.get(dow) ?? []
                const cls = dayList[rowIndex]
                const hasClass = Boolean(cls)
                const dayHasSomeClasses = dayList.length > 0

                return (
                  <div key={dayIndex} className="col-span-1">
                    <button
                      type="button"
                      onClick={() => hasClass && cls && handleClassClick(cls, day)}
                      disabled={!hasClass}
                      className={`
                        w-full min-h-24 h-24 rounded-lg border transition-all duration-200 relative overflow-hidden
                        flex items-center justify-center
                        ${
                          hasClass
                            ? 'bg-[#e30613] border-[#9a1915] cursor-pointer hover:bg-[#9a1915] active:scale-[0.97] touch-manipulation shadow-sm'
                            : 'bg-white border-red-300 cursor-default'
                        }
                      `}
                    >
                      {hasClass && cls ? (
                        <div className="p-1.5 w-full h-full flex flex-col justify-center">
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-bold text-white line-clamp-2 text-center leading-tight">
                              {cls.title}
                            </p>
                            <div className="flex items-center justify-center gap-1 text-[9px] text-white/80">
                              <svg
                                className="w-2.5 h-2.5 flex-shrink-0"
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
                              <span className="line-clamp-1">{cls.room.name}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1 text-[9px] text-white/70">
                              <svg
                                className="w-2.5 h-2.5 flex-shrink-0"
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
                              <span className="line-clamp-1">{cls.teacher.name}</span>
                            </div>
                          </div>
                        </div>
                      ) : dayHasSomeClasses ? (
                        <div className="p-1.5 w-full h-full flex items-center justify-center">
                          <span className="text-[10px] font-medium text-[#878787]">—</span>
                        </div>
                      ) : (
                        <div className="p-1.5 w-full h-full flex items-center justify-center">
                          <p className="text-[8px] font-medium text-[#e30613] text-center leading-tight px-1 line-clamp-3">
                            Nenhuma aula programada para este dia
                          </p>
                        </div>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

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

function CourseScheduleTableClassic({ classes }: { classes: CompleteClass[] }) {
  const timeSlots = useMemo(() => getTimeSlots(classes), [classes])

  /** Sempre 6 colunas fixas: Segunda a Sábado. */
  const days = useMemo(() => getNextFiveDays(), [])

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
        <div className="grid grid-cols-7 gap-1.5">
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

          {days.map((day, dayIndex) => {
            const label = getRelativeDayLabel(day)
            return (
              <div key={dayIndex} className="col-span-1">
                <div className="text-center text-xs font-bold text-[#e30613] mb-1.5 uppercase tracking-wider">
                  {label}
                </div>
                <div className="space-y-1.5">
                  {timeSlots.map((slot, slotIndex) => {
                    const dayClasses = getClassesForTimeSlotAndDay(
                      classes,
                      slot.startTime,
                      slot.endTime,
                      day,
                    )
                    const hasClasses = dayClasses.length > 0

                    return (
                      <button
                        key={slotIndex}
                        type="button"
                        onClick={() => hasClasses && dayClasses[0] && handleClassClick(dayClasses[0], day)}
                        disabled={!hasClasses}
                        className={`
                          w-full min-h-24 h-24 rounded-lg border transition-all duration-200 relative overflow-hidden
                          flex items-center justify-center
                          ${
                            hasClasses
                              ? 'bg-[#e30613] border-[#9a1915] cursor-pointer hover:bg-[#9a1915] active:scale-[0.97] touch-manipulation shadow-sm'
                              : 'bg-white border-red-300 cursor-default'
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
                          <div className="p-1.5 w-full h-full flex items-center justify-center">
                            <p className="text-[8px] font-medium text-[#e30613] text-center leading-tight px-1 line-clamp-3">
                              Nenhuma aula programada para este dia
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

function CourseScheduleTableTechnical({ classes }: { classes: CompleteClass[] }) {
  const timeSlots = useMemo(() => getTechnicalDisplayTimeSlots(classes), [classes])
  const days = useMemo(() => getNextThreeDaysDynamic(), [])

  const [selectedClass, setSelectedClass] = useState<CompleteClass | null>(null)
  const [selectedDayLabel, setSelectedDayLabel] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClassClick = (classItem: CompleteClass, day: Date) => {
    setSelectedClass(classItem)
    setSelectedDayLabel(getRelativeDayLabelDynamic(day))
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedClass(null)
  }

  return (
    <>
      <div className="w-full">
        {/* Cabeçalho: canto + 5 horários */}
        <div className="grid grid-cols-6 gap-1.5 mb-1.5">
          <div className="min-h-[3rem] flex items-end justify-center pb-1">
            <span className="text-[10px] font-bold text-[#878787] uppercase tracking-wider">&nbsp;</span>
          </div>
          {timeSlots.map((slot, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-end pb-1 min-h-[3rem] text-[10px] font-bold text-[#878787] text-center leading-tight px-0.5"
            >
              {slot ? (
                <>
                  <span>{slot.startTime.replace(':', 'h')}</span>
                  <span className="text-[9px] font-normal text-gray-400">até</span>
                  <span>{slot.endTime.replace(':', 'h')}</span>
                </>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </div>
          ))}
        </div>

        {/* 3 linhas: dia + 5 células */}
        {days.map((day, dayIndex) => {
          const label = getRelativeDayLabelDynamic(day)
          return (
            <div key={dayIndex} className="grid grid-cols-6 gap-1.5 mb-1.5 last:mb-0">
              <div className="flex items-center justify-center min-h-24 px-1">
                <span className="text-[11px] font-bold text-[#e30613] text-center uppercase tracking-wide leading-tight">
                  {label}
                </span>
              </div>
              {timeSlots.map((slot, slotIndex) => {
                if (!slot) {
                  return (
                    <div
                      key={slotIndex}
                      className="min-h-24 h-24 rounded-lg border border-gray-100 bg-[#fafafa]"
                    />
                  )
                }
                const dayClasses = getClassesForTimeSlotAndDay(
                  classes,
                  slot.startTime,
                  slot.endTime,
                  day,
                )
                const hasClasses = dayClasses.length > 0

                return (
                  <button
                    key={slotIndex}
                    type="button"
                    onClick={() => hasClasses && dayClasses[0] && handleClassClick(dayClasses[0], day)}
                    disabled={!hasClasses}
                    className={`
                      w-full min-h-24 h-24 rounded-lg border transition-all duration-200 overflow-hidden
                      flex items-center justify-center
                      ${
                        hasClasses
                          ? 'bg-[#e30613] border-[#9a1915] cursor-pointer hover:bg-[#9a1915] active:scale-[0.97] touch-manipulation shadow-sm'
                          : 'bg-white border-red-200 cursor-default'
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
                      <div className="p-1 flex items-center justify-center">
                        <p className="text-[8px] font-medium text-[#e30613]/80 text-center leading-tight px-0.5 line-clamp-3">
                          Sem aula
                        </p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

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
