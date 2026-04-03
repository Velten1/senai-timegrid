import type { CompleteClass } from '../../types'
import { getDayName } from '../../utils/formatting'
import senaiWhiteLogo from '../../images/senaiWHITE.png'

interface ClassDetailModalProps {
  classItem: CompleteClass
  dayLabel: string
  isOpen: boolean
  onClose: () => void
}

/**
 * Modal de detalhes de uma aula.
 * Estilo SENAI: header vermelho forte, ícones vermelhos, botão vermelho.
 */
export function ClassDetailModal({ classItem, dayLabel, isOpen, onClose }: ClassDetailModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-50 animate-modal-overlay"
        onClick={onClose}
      />

      {/* Container do modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto pointer-events-auto animate-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header VERMELHO com logo branca */}
          <div className="bg-[#e30613] rounded-t-xl px-6 py-5">
            {/* Logo SENAI branca pequena */}
            <img src={senaiWhiteLogo} alt="SENAI" className="h-5 mb-3 opacity-80" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl lg:text-2xl font-black text-white mb-1">
                  {classItem.fullName || classItem.title}
                </h2>
                {classItem.fullName && (
                  <p className="text-white/80 text-sm font-medium mb-1">
                    {classItem.title}
                  </p>
                )}
                <p className="text-white/70 text-sm">
                  {dayLabel} — {getDayName(classItem.dayOfWeek)}
                </p>
              </div>
              {/* Botão fechar */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 active:scale-95 transition-all touch-manipulation"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            {classItem.description && (
              <div className="mb-6">
                <p className="text-gray-600 text-base leading-relaxed">
                  {classItem.description}
                </p>
              </div>
            )}

            {/* Detalhes da aula */}
            <div className="space-y-4">
              {/* Horário */}
              <div className="flex items-center gap-4 p-4 bg-[#ededed] rounded-lg">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#e30613]">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#878787] text-xs font-medium uppercase tracking-wider">Horário</p>
                  <p className="text-gray-800 font-bold text-lg">
                    {classItem.startTime} — {classItem.endTime}
                  </p>
                </div>
              </div>

              {/* Sala/Laboratório */}
              <div className="flex items-center gap-4 p-4 bg-[#ededed] rounded-lg">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#e30613]">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#878787] text-xs font-medium uppercase tracking-wider">Laboratório / Sala</p>
                  <p className="text-gray-800 font-bold text-lg">
                    {classItem.room.name}
                  </p>
                </div>
              </div>

              {/* Professor */}
              <div className="flex items-center gap-4 p-4 bg-[#ededed] rounded-lg">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#e30613]">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#878787] text-xs font-medium uppercase tracking-wider">Professor</p>
                  <p className="text-gray-800 font-bold text-lg">
                    {classItem.teacher.name}
                  </p>
                </div>
              </div>

              {/* Curso */}
              <div className="flex items-center gap-4 p-4 bg-[#ededed] rounded-lg">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#e30613]">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#878787] text-xs font-medium uppercase tracking-wider">Curso</p>
                  <p className="text-gray-800 font-bold text-lg">
                    {classItem.course.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-200 flex justify-end bg-[#f5f5f5]">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 rounded-lg font-bold text-white bg-[#e30613] hover:bg-[#9a1915] transition-all duration-200 active:scale-95 touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
