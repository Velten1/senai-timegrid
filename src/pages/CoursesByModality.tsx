import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../components/header/Header'
import { CampusMap } from '../components/map/CampusMap'
import { useExcelDataContext } from '../contexts/ExcelDataContext'
import { useLivresDataContext } from '../contexts/LivresDataContext'
import { courses as mockCourses, classes as mockClasses, getCompleteClasses } from '../data/mockData'
import type { Period } from '../utils/courseSchedule'
import type { Course } from '../types'

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

  // Flags para determinar qual fonte de dados usar
  const isExcelModality = modality === 'tecnico' && excelCourses.length > 0
  const isLivresModality = modality === 'livre' && livresCourses.length > 0
  const isLoading = (modality === 'tecnico' && excelLoading) || (modality === 'livre' && livresLoading)

  // Cursos Livres não usam filtros de período
  const showHeader = modality !== 'livre'

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
      // Mostrar todos os cursos livres, sem filtragem
      return livresCourses
    }
    
    return mockCourses.filter((c) => c.modality === modality)
  }, [modality, isExcelModality, isLivresModality, excelCourses, livresCourses, selectedPeriod])

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

    return getCompleteClasses(mockClasses)
  }, [isExcelModality, isLivresModality, excelCompleteClasses, livresCompleteClasses, selectedPeriod])

  if (!modality || (!isLoading && filteredCourses.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl text-white mb-4">
            {isLoading ? 'Carregando...' : 'Modalidade não encontrada'}
          </h1>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header com filtros de período — só para modalidades que precisam de filtro */}
      {showHeader && <Header onPeriodChange={setSelectedPeriod} />}

      {/* Botão de voltar */}
      <div className="p-4 lg:p-6">
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold text-lg lg:text-xl touch-manipulation active:scale-95"
          style={{ minHeight: '56px', minWidth: '140px' }}
        >
          ← Voltar
        </button>
      </div>

      {/* Título da modalidade */}
      <div className="px-4 lg:px-6 pt-6 pb-4 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
          {modalityNames[modality]}
        </h1>
      </div>

      {/* Main content */}
      <main className="p-4 lg:p-8">
        {isLoading && (
          <div className="text-center text-gray-400 py-12">
            Carregando dados do Excel...
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
