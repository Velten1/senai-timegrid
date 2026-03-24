import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../components/header/Header'
import { CampusMap } from '../components/map/CampusMap'
import { useExcelDataContext } from '../contexts/ExcelDataContext'
import { useLivresDataContext } from '../contexts/LivresDataContext'
import { useSuperiorPosGradDataContext } from '../contexts/SuperiorPosGradDataContext'
import { courses as mockCourses, classes as mockClasses, getCompleteClasses } from '../data/mockData'
import type { Period } from '../utils/courseSchedule'
import type { Course } from '../types'
import senaiWhiteLogo from '../images/senaiWHITE.png'

const modalityNames: Record<string, string> = {
  superior: 'Cursos Superiores',
  tecnico: 'Cursos Técnicos',
  livre: 'Cursos Livres',
  'pos-graduacao': 'Cursos Pós-Graduação',
}

function CoursesByModality() {
  const { modality } = useParams<{ modality: string }>()
  const navigate = useNavigate()
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(null)

  // Dados de Cursos Técnicos (Excel manhã/tarde)
  const {
    courses: excelCourses,
    completeClasses: excelCompleteClasses,
    loading: excelLoading,
  } = useExcelDataContext()

  // Dados de Cursos Livres (Excel sábado)
  const {
    courses: livresCourses,
    completeClasses: livresCompleteClasses,
    loading: livresLoading,
  } = useLivresDataContext()

  // Dados de Cursos Superiores + Pos-Graduacao
  const {
    superiores,
    posGraduacao,
    loading: supPosGradLoading,
  } = useSuperiorPosGradDataContext()

  // Flags para determinar qual fonte de dados usar
  const isExcelModality = modality === 'tecnico' && excelCourses.length > 0
  const isLivresModality = modality === 'livre' && livresCourses.length > 0
  const isSuperioresModality = modality === 'superior' && superiores.courses.length > 0
  const isPosGradModality = modality === 'pos-graduacao' && posGraduacao.courses.length > 0

  const isLoading =
    (modality === 'tecnico' && excelLoading) ||
    (modality === 'livre' && livresLoading) ||
    (modality === 'superior' && supPosGradLoading) ||
    (modality === 'pos-graduacao' && supPosGradLoading)

  // Cursos Livres e Pos-Graduacao nao usam filtros de periodo
  const showHeader = modality !== 'livre' && modality !== 'pos-graduacao' && modality !== 'superior'

  const filteredCourses: Course[] = useMemo(() => {
    if (!modality) return []
    
    // ── Cursos Técnicos (dados do Excel manhã/tarde) ──
    if (isExcelModality) {
      if (selectedPeriod === 'manha' || selectedPeriod === 'tarde') {
        return excelCourses.filter((course) => {
          const parts = course.id.split('-')
          const coursePeriod = parts[parts.length - 1]
          return coursePeriod === selectedPeriod
        })
      }
      return excelCourses
    }

    // ── Cursos Livres (dados do Excel sábado) ──
    if (isLivresModality) {
      return livresCourses
    }

    // ── Cursos Superiores ──
    if (isSuperioresModality) {
      return superiores.courses
    }

    // ── Pos-Graduacao ──
    if (isPosGradModality) {
      return posGraduacao.courses
    }
    
    return mockCourses.filter((c) => c.modality === modality)
  }, [modality, isExcelModality, isLivresModality, isSuperioresModality, isPosGradModality, excelCourses, livresCourses, superiores.courses, posGraduacao.courses, selectedPeriod])

  const completeClasses = useMemo(() => {
    // ── Cursos Técnicos ──
    if (isExcelModality) {
      if (selectedPeriod === 'manha' || selectedPeriod === 'tarde') {
        return excelCompleteClasses.filter((classItem) => {
          const parts = classItem.courseId.split('-')
          const classPeriod = parts[parts.length - 1]
          return classPeriod === selectedPeriod
        })
      }
      return excelCompleteClasses
    }

    // ── Cursos Livres ──
    if (isLivresModality) {
      return livresCompleteClasses
    }

    // ── Cursos Superiores ──
    if (isSuperioresModality) {
      return superiores.completeClasses
    }

    // ── Pos-Graduacao ──
    if (isPosGradModality) {
      return posGraduacao.completeClasses
    }

    return getCompleteClasses(mockClasses)
  }, [isExcelModality, isLivresModality, isSuperioresModality, isPosGradModality, excelCompleteClasses, livresCompleteClasses, superiores.completeClasses, posGraduacao.completeClasses, selectedPeriod])

  if (!modality || (!isLoading && filteredCourses.length === 0)) {
    return (
      <div className="min-h-screen bg-[#ededed] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {isLoading ? 'Carregando...' : 'Modalidade não encontrada'}
          </h1>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#e30613] text-white rounded-lg hover:bg-[#9a1915] transition-colors font-semibold"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#ededed]">
      {/* Header com filtros de período — só para modalidades que precisam */}
      {showHeader && <Header onPeriodChange={setSelectedPeriod} />}

      {/* Barra vermelha com logo branca se não tem header */}
      {!showHeader && (
        <div className="bg-[#e30613] px-4 lg:px-6 py-3 flex items-center gap-4">
          <img src={senaiWhiteLogo} alt="SENAI" className="h-7 lg:h-8" />
          <span className="text-white/50">|</span>
          <span className="text-white/90 text-sm font-medium">Grade de Horários</span>
        </div>
      )}

      {/* Título + botão voltar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-800">
              {modalityNames[modality]}
            </h1>
            <div className="mt-2 h-1 w-14 bg-[#e30613] rounded-full" />
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-[#ededed] text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm border border-gray-300 active:scale-95 touch-manipulation"
          >
            ← Voltar
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="p-4 lg:p-8">
        {isLoading && (
          <div className="text-center text-[#878787] py-12">
            <div className="inline-flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#e30613] border-t-transparent rounded-full animate-spin" />
              <span className="text-lg">Carregando dados...</span>
            </div>
          </div>
        )}

        {!isLoading && filteredCourses.length > 0 && (
          <CampusMap
            courses={filteredCourses}
            period={selectedPeriod}
            completeClasses={completeClasses}
          />
        )}
      </main>
    </div>
  )
}

export default CoursesByModality
