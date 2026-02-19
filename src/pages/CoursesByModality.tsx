import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../components/header/Header'
import { CampusMap } from '../components/map/CampusMap'
import { courses } from '../data/mockData'
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

  // Filtrar cursos pela modalidade
  const filteredCourses: Course[] = modality
    ? courses.filter((course) => course.modality === modality)
    : []

  if (!modality || !filteredCourses.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl text-white mb-4">Modalidade não encontrada</h1>
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
      {/* Header com filtros de período */}
      <Header onPeriodChange={setSelectedPeriod} />

      {/* Botão de voltar abaixo do header */}
      <div className="p-4 lg:p-6">
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold text-lg lg:text-xl touch-manipulation active:scale-95"
          style={{ minHeight: '56px', minWidth: '140px' }}
        >
          ← Voltar
        </button>
      </div>

      {/* Título da modalidade centralizado */}
      <div className="px-4 lg:px-6 pt-6 pb-4 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
          {modalityNames[modality]}
        </h1>
      </div>

      {/* Main content */}
      <main className="p-4 lg:p-8">
        <CampusMap courses={filteredCourses} period={selectedPeriod} />
      </main>
    </div>
  )
}

export default CoursesByModality
