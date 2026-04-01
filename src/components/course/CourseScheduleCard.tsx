import { useState } from 'react'
import type { Course, CompleteClass } from '../../types'
import { CourseIcon } from '../map/CourseIcon'
import { CourseScheduleTable, type CourseScheduleLayout } from './CourseScheduleTable'
import { CourseModal } from '../map/CourseModal'

interface CourseScheduleCardProps {
  course: Course
  classes: CompleteClass[]
  scheduleLayout?: CourseScheduleLayout
}

/**
 * Card de grade horária de um curso.
 * Estilo SENAI: fundo branco, borda vermelha lateral esquerda, botão vermelho.
 */
export function CourseScheduleCard({ course, classes, scheduleLayout = 'classic' }: CourseScheduleCardProps) {
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)

  return (
    <>
      <div className="relative bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
        {/* Borda vermelha lateral esquerda — assinatura visual SENAI */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#e30613]" />

        <div className="pl-5 pr-4 py-4">
          {/* Header — ícone vermelho, nome, descrição */}
          <div className="mb-3">
            <div className="flex items-start gap-3">
              {/* Ícone com fundo vermelho */}
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#e30613]">
                <CourseIcon iconName={course.icon} size={24} color="#ffffff" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-800 mb-0.5">
                  {course.name}
                </h3>
                {course.description && (
                  <p className="text-xs text-[#878787]">{course.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-[#e30613] rounded-full" />
            <h4 className="text-sm font-bold text-gray-700">Aulas da semana</h4>
          </div>

          {/* Tabela de grade */}
          <div className="flex-1 mb-4 overflow-hidden">
            <CourseScheduleTable classes={classes} courseColor="#e30613" layout={scheduleLayout} />
          </div>

          {/* Botão ver calendário — vermelho sólido */}
          <div className="mt-auto">
            <button
              onClick={() => setIsCourseModalOpen(true)}
              className="w-full px-6 py-3.5 rounded-lg text-base font-bold text-white bg-[#e30613] hover:bg-[#9a1915] transition-all duration-200 active:scale-95 touch-manipulation shadow-sm"
              style={{ minHeight: '48px' }}
            >
              Ver Calendário
            </button>
          </div>
        </div>
      </div>

      {/* Modal do curso */}
      <CourseModal
        course={course}
        classes={classes}
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
      />
    </>
  )
}
