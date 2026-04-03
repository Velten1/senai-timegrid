import { useState, useEffect, useMemo } from 'react'
import type { Course, CompleteClass } from '../../types'
import { CourseIcon } from './CourseIcon'
import senaiWhiteLogo from '../../images/senaiWHITE.png'

interface CourseModalProps {
  course: Course
  classes: CompleteClass[]
  isOpen: boolean
  onClose: () => void
}

/**
 * Modal de calendário completo do curso.
 * Estilo SENAI: header vermelho sólido, abas vermelhas, cards de aula com ícones vermelhos.
 */
export function CourseModal({ course, classes, isOpen, onClose }: CourseModalProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1)

  // Auto-seleciona dia atual quando abre
  useEffect(() => {
    if (isOpen) {
      const today = new Date().getDay()
      const adjustedDay = today === 0 ? 1 : today
      if (adjustedDay >= 1 && adjustedDay <= 6) {
        setSelectedDay(adjustedDay)
      }
    }
  }, [isOpen])

  const classesByDayOfWeek = useMemo(
    () =>
      classes.reduce<Record<number, CompleteClass[]>>((acc, classItem) => {
        const list = acc[classItem.dayOfWeek] ?? []
        list.push(classItem)
        acc[classItem.dayOfWeek] = list
        return acc
      }, {}),
    [classes],
  )

  if (!isOpen) return null

  const weekDays = [
    { dayOfWeek: 1, name: 'Segunda-feira', shortName: 'Seg' },
    { dayOfWeek: 2, name: 'Terça-feira', shortName: 'Ter' },
    { dayOfWeek: 3, name: 'Quarta-feira', shortName: 'Qua' },
    { dayOfWeek: 4, name: 'Quinta-feira', shortName: 'Qui' },
    { dayOfWeek: 5, name: 'Sexta-feira', shortName: 'Sex' },
    { dayOfWeek: 6, name: 'Sábado', shortName: 'Sáb' },
  ]

  const selectedDayClasses = classesByDayOfWeek[selectedDay] || []
  const selectedDayName = weekDays.find((d) => d.dayOfWeek === selectedDay)?.name || ''

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-50 animate-modal-overlay"
        onClick={onClose}
      />

      {/* Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ══ HEADER VERMELHO com logo SENAI branca ══ */}
          <div className="bg-[#e30613] rounded-t-xl px-6 lg:px-8 py-6">
            {/* Logo SENAI branca pequena */}
            <img src={senaiWhiteLogo} alt="SENAI" className="h-5 mb-4 opacity-80" />
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-5 flex-1">
                {/* Ícone do curso */}
                <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/20">
                  <CourseIcon iconName={course.icon} size={28} color="#ffffff" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h2 className="text-2xl lg:text-3xl font-black text-white mb-1">
                    {course.name}
                  </h2>
                  {course.description && (
                    <p className="text-white/80 text-sm leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>
              </div>
              {/* Fechar */}
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

          {/* ══ CONTEÚDO ══ */}
          <div className="p-6 lg:p-8">
            {/* Abas de dias — vermelho ativo, cinza inativo */}
            <div className="flex flex-wrap gap-2 mb-6 pb-5 border-b border-gray-200">
              {weekDays.map((day) => {
                const isSelected = selectedDay === day.dayOfWeek
                return (
                  <button
                    key={day.dayOfWeek}
                    type="button"
                    onClick={() => setSelectedDay(day.dayOfWeek)}
                    className={`
                      px-4 lg:px-8 py-3 lg:py-3.5 rounded-lg font-bold text-sm lg:text-base transition-all duration-200
                      active:scale-95 touch-manipulation
                      ${isSelected
                        ? 'bg-[#e30613] text-white shadow-md shadow-[#e30613]/30'
                        : 'bg-[#ededed] text-gray-500 hover:bg-[#e30613]/10 hover:text-[#e30613] border border-gray-200'
                      }
                    `}
                    style={{ minHeight: '44px' }}
                  >
                    <span className="hidden sm:inline">{day.name}</span>
                    <span className="sm:hidden">{day.shortName}</span>
                  </button>
                )
              })}
            </div>

            {/* Aulas do dia selecionado */}
            <section>
              <h3 className="text-xl lg:text-2xl font-black text-gray-800 mb-5 flex items-center gap-3">
                <div className="w-1.5 h-7 rounded-full bg-[#e30613]" />
                {selectedDayName}
              </h3>

              {selectedDayClasses.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                    >
                      {/* Borda vermelha lateral */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#e30613]" />

                      <div className="pl-5 pr-4 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-base lg:text-lg font-bold text-gray-800 mb-2">
                              {classItem.title}
                            </h4>
                            {classItem.description && (
                              <p className="text-gray-500 text-sm mb-3">
                                {classItem.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              {/* Horário */}
                              <div className="flex items-center gap-2 text-gray-600">
                                <div className="w-7 h-7 rounded flex items-center justify-center bg-[#e30613]">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <span className="font-semibold">
                                  {classItem.startTime} — {classItem.endTime}
                                </span>
                              </div>
                              {/* Sala */}
                              <div className="flex items-center gap-2 text-gray-600">
                                <div className="w-7 h-7 rounded flex items-center justify-center bg-[#e30613]">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <span className="font-semibold">{classItem.room.name}</span>
                              </div>
                              {/* Professor */}
                              <div className="flex items-center gap-2 text-gray-600">
                                <div className="w-7 h-7 rounded flex items-center justify-center bg-[#e30613]">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <span className="font-semibold">{classItem.teacher.name}</span>
                              </div>
                            </div>
                          </div>
                          {classItem.status && (
                            <div className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 bg-[#e30613] text-white">
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-lg bg-white border border-red-300 text-center">
                  <p className="text-[#e30613] text-lg font-medium">
                    Nenhuma aula programada para este dia
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-200 flex justify-end bg-[#f5f5f5]">
            <button
              type="button"
              onClick={onClose}
              className="px-10 py-3.5 rounded-lg font-bold text-base text-white bg-[#e30613] hover:bg-[#9a1915] transition-all duration-200 active:scale-95 touch-manipulation"
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
