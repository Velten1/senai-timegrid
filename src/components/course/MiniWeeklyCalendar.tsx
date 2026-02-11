import { useMemo } from 'react'
import type { CompleteClass } from '../../types'
import { getNextFiveDays, getRelativeDayLabel, getClassesForDay } from '../../utils/courseSchedule'

interface MiniWeeklyCalendarProps {
  classes: CompleteClass[]
  courseColor: string
  onCellClick?: (day: Date, dayClasses: CompleteClass[]) => void
}

// mini weekly calendar component
// displays 5 days with visual indication of classes
// clean design aligned with site UI/UX
export function MiniWeeklyCalendar({ classes, courseColor, onCellClick }: MiniWeeklyCalendarProps) {
  // get next 5 days starting from today
  const days = useMemo(() => getNextFiveDays(), [])


  return (
    <div className="w-full">
      {/* day labels row */}
      <div className="grid grid-cols-5 gap-2 mb-2">
        {days.map((day, index) => {
          const label = getRelativeDayLabel(day, index)
          return (
            <div
              key={index}
              className="text-center font-semibold text-white text-sm"
            >
              {label}
            </div>
          )
        })}
      </div>

      {/* calendar cells row */}
      <div className="grid grid-cols-5 gap-2">
        {days.map((day, index) => {
          const dayClasses = getClassesForDay(classes, day)
          const hasClasses = dayClasses.length > 0

          return (
            <button
              key={index}
              onClick={() => hasClasses && onCellClick && onCellClick(day, dayClasses)}
              disabled={!hasClasses}
              className={`
                rounded-lg border min-h-[140px] flex flex-col items-start justify-start p-3 transition-all duration-200
                ${hasClasses 
                  ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 hover:border-slate-600 cursor-pointer active:scale-[0.98] touch-manipulation' 
                  : 'bg-slate-800/30 border-slate-700/50 cursor-default'
                }
              `}
            >
              {hasClasses ? (
                <div className="w-full space-y-2">
                  {dayClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50 hover:bg-slate-700/70 transition-colors"
                    >
                      <p className="text-sm font-bold text-white mb-2 line-clamp-1">
                        {classItem.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-300 mb-1">
                        <svg
                          className="w-4 h-4"
                          style={{ color: courseColor }}
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
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <svg
                          className="w-4 h-4"
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
                        <span className="line-clamp-1">{classItem.room.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center px-2 w-full flex flex-col items-center justify-center h-full">
                  <svg
                    className="w-10 h-10 text-gray-500 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-400 text-xs font-medium">
                    Nenhuma aula neste dia
                  </p>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
