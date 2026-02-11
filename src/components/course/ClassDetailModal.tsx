import type { CompleteClass } from '../../types'
import { getDayName } from '../../utils/formatting'

interface ClassDetailModalProps {
  classItem: CompleteClass
  dayLabel: string
  isOpen: boolean
  onClose: () => void
}

// modal component that displays class details
// shows when user clicks on a calendar cell with classes
export function ClassDetailModal({ classItem, dayLabel, isOpen, onClose }: ClassDetailModalProps) {
  if (!isOpen) return null

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
          className="bg-slate-900 rounded-xl border border-slate-700 shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto pointer-events-auto animate-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {classItem.title}
                </h2>
                <p className="text-gray-400 text-sm">
                  {dayLabel} - {getDayName(classItem.dayOfWeek)}
                </p>
              </div>
              {/* close button */}
              <button
                onClick={onClose}
                className="p-3 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all touch-manipulation"
                style={{ minWidth: '44px', minHeight: '44px' }}
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

          {/* content */}
          <div className="p-6">
            {/* description */}
            {classItem.description && (
              <div className="mb-6">
                <p className="text-gray-300 text-base leading-relaxed">
                  {classItem.description}
                </p>
              </div>
            )}

            {/* class details */}
            <div className="space-y-4">
              {/* time */}
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${classItem.course.color}15`,
                  }}
                >
                  <svg
                    className="w-6 h-6"
                    style={{ color: classItem.course.color }}
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
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Horário</p>
                  <p className="text-white font-semibold text-lg">
                    {classItem.startTime} - {classItem.endTime}
                  </p>
                </div>
              </div>

              {/* room/laboratory */}
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${classItem.course.color}15`,
                  }}
                >
                  <svg
                    className="w-6 h-6"
                    style={{ color: classItem.course.color }}
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
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Laboratório/Sala</p>
                  <p className="text-white font-semibold text-lg">
                    {classItem.room.name}
                  </p>
                </div>
              </div>

              {/* teacher */}
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${classItem.course.color}15`,
                  }}
                >
                  <svg
                    className="w-6 h-6"
                    style={{ color: classItem.course.color }}
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
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Professor</p>
                  <p className="text-white font-semibold text-lg">
                    {classItem.teacher.name}
                  </p>
                </div>
              </div>

              {/* course */}
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${classItem.course.color}15`,
                  }}
                >
                  <svg
                    className="w-6 h-6"
                    style={{ color: classItem.course.color }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Curso</p>
                  <p className="text-white font-semibold text-lg">
                    {classItem.course.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="p-6 border-t border-slate-700 flex justify-end bg-slate-900/50">
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 touch-manipulation bg-slate-700 hover:bg-slate-600"
              style={{ minHeight: '48px', minWidth: '120px' }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
