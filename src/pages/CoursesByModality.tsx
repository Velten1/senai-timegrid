import { useMemo, useEffect } from 'react'
import { useParams, useNavigate, useMatch, useLocation } from 'react-router-dom'
import { Sun, Sunset, ChevronRight } from 'lucide-react'
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
  tecnico: 'CAI e Cursos Técnicos',
  livre: 'Cursos Livres',
  'pos-graduacao': 'Cursos Pós-Graduação',
}

const TECNICO_PERIOD_OPTIONS = [
  {
    id: 'manha' as const,
    name: 'Manhã',
    description: 'Turmas e horários do período da manhã',
    icon: Sun,
  },
  {
    id: 'tarde' as const,
    name: 'Tarde',
    description: 'Turmas e horários do período da tarde',
    icon: Sunset,
  },
]

function CoursesByModality() {
  const params = useParams<{ modality?: string; period?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const matchTecnicoPeriod = useMatch({ path: '/cursos/tecnico/:period', end: true })

  const modality =
    location.pathname.startsWith('/cursos/tecnico') ? 'tecnico' : params.modality

  const tecnicoPeriodSlug = matchTecnicoPeriod?.params.period

  useEffect(() => {
    if (modality !== 'tecnico' || !tecnicoPeriodSlug) return
    if (tecnicoPeriodSlug !== 'manha' && tecnicoPeriodSlug !== 'tarde') {
      navigate('/cursos/tecnico', { replace: true })
    }
  }, [modality, tecnicoPeriodSlug, navigate])

  const tecnicoSelectedPeriod: Period =
    tecnicoPeriodSlug === 'manha' || tecnicoPeriodSlug === 'tarde' ? tecnicoPeriodSlug : null

  const isTecnicoPicker = modality === 'tecnico' && !tecnicoSelectedPeriod

  const {
    courses: excelCourses,
    completeClasses: excelCompleteClasses,
    loading: excelLoading,
  } = useExcelDataContext()

  const {
    courses: livresCourses,
    completeClasses: livresCompleteClasses,
    loading: livresLoading,
  } = useLivresDataContext()

  const {
    superiores,
    posGraduacao,
    loading: supPosGradLoading,
  } = useSuperiorPosGradDataContext()

  const isExcelModality = modality === 'tecnico' && excelCourses.length > 0
  const isLivresModality = modality === 'livre' && livresCourses.length > 0
  const isSuperioresModality = modality === 'superior' && superiores.courses.length > 0
  const isPosGradModality = modality === 'pos-graduacao' && posGraduacao.courses.length > 0

  const isLoading =
    (modality === 'tecnico' && excelLoading) ||
    (modality === 'livre' && livresLoading) ||
    (modality === 'superior' && supPosGradLoading) ||
    (modality === 'pos-graduacao' && supPosGradLoading)

  const filteredCourses: Course[] = useMemo(() => {
    if (!modality) return []

    if (isExcelModality) {
      if (tecnicoSelectedPeriod === 'manha' || tecnicoSelectedPeriod === 'tarde') {
        return excelCourses.filter((course) => {
          const parts = course.id.split('-')
          const coursePeriod = parts[parts.length - 1]
          return coursePeriod === tecnicoSelectedPeriod
        })
      }
      return excelCourses
    }

    if (isLivresModality) {
      return livresCourses
    }

    if (isSuperioresModality) {
      return superiores.courses
    }

    if (isPosGradModality) {
      return posGraduacao.courses
    }

    return mockCourses.filter((c) => c.modality === modality)
  }, [
    modality,
    isExcelModality,
    isLivresModality,
    isSuperioresModality,
    isPosGradModality,
    excelCourses,
    livresCourses,
    superiores.courses,
    posGraduacao.courses,
    tecnicoSelectedPeriod,
  ])

  const completeClasses = useMemo(() => {
    if (isExcelModality) {
      if (tecnicoSelectedPeriod === 'manha' || tecnicoSelectedPeriod === 'tarde') {
        return excelCompleteClasses.filter((classItem) => {
          const parts = classItem.courseId.split('-')
          const classPeriod = parts[parts.length - 1]
          return classPeriod === tecnicoSelectedPeriod
        })
      }
      return excelCompleteClasses
    }

    if (isLivresModality) {
      return livresCompleteClasses
    }

    if (isSuperioresModality) {
      return superiores.completeClasses
    }

    if (isPosGradModality) {
      return posGraduacao.completeClasses
    }

    return getCompleteClasses(mockClasses)
  }, [
    isExcelModality,
    isLivresModality,
    isSuperioresModality,
    isPosGradModality,
    excelCompleteClasses,
    livresCompleteClasses,
    superiores.completeClasses,
    posGraduacao.completeClasses,
    tecnicoSelectedPeriod,
  ])

  const showMapForTecnico =
    modality === 'tecnico' && (tecnicoSelectedPeriod === 'manha' || tecnicoSelectedPeriod === 'tarde')

  if (!modality || (!isLoading && filteredCourses.length === 0 && !isTecnicoPicker)) {
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

  const handleTecnicoBack = () => {
    if (modality === 'tecnico' && tecnicoSelectedPeriod) {
      navigate('/cursos/tecnico')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#ededed]">
      <div className="bg-[#e30613] px-4 lg:px-6 py-3 flex items-center gap-4">
        <img src={senaiWhiteLogo} alt="SENAI" className="h-7 lg:h-8" />
        <span className="text-white/50">|</span>
        <span className="text-white/90 text-sm font-medium">Grade de Horários</span>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-800">
              {modalityNames[modality] ?? modality}
            </h1>
            {modality === 'tecnico' && tecnicoSelectedPeriod && (
              <p className="text-sm text-[#878787] mt-1.5">
                Período:{' '}
                <span className="font-bold text-gray-800">
                  {tecnicoSelectedPeriod === 'manha' ? 'Manhã' : 'Tarde'}
                </span>
              </p>
            )}
            {modality === 'tecnico' && isTecnicoPicker && (
              <p className="text-sm text-[#878787] mt-1.5">
                Selecione o período para ver as turmas no mapa
              </p>
            )}
            <div className="mt-2 h-1 w-14 bg-[#e30613] rounded-full" />
          </div>
          <button
            onClick={handleTecnicoBack}
            className="px-5 py-2.5 bg-[#ededed] text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm border border-gray-300 active:scale-95 touch-manipulation"
          >
            ← Voltar
          </button>
        </div>
      </div>

      <main className="p-4 lg:p-8 max-w-7xl mx-auto">
        {isLoading && (
          <div className="text-center text-[#878787] py-12">
            <div className="inline-flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#e30613] border-t-transparent rounded-full animate-spin" />
              <span className="text-lg">Carregando dados...</span>
            </div>
          </div>
        )}

        {!isLoading && isTecnicoPicker && (
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-black text-gray-800">Período</h2>
              <div className="mt-2 flex justify-center">
                <ChevronRight size={28} className="text-[#e30613] rotate-90" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5 max-w-4xl mx-auto">
              {TECNICO_PERIOD_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => navigate(`/cursos/tecnico/${opt.id}`)}
                    className="
                      group relative bg-white rounded-lg overflow-hidden
                      border border-gray-200 shadow-sm
                      hover:shadow-lg hover:shadow-[#e30613]/10
                      text-left transition-all duration-300 ease-out
                      hover:-translate-y-0.5
                      active:scale-[0.98]
                      touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e30613]
                    "
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#e30613] group-hover:w-2 transition-all duration-300" />

                    <div className="flex items-center gap-4 p-5 lg:p-6 pl-6 lg:pl-7">
                      <div className="w-14 h-14 rounded-lg bg-[#e30613] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Icon size={26} className="text-white" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg lg:text-xl font-bold text-gray-800 group-hover:text-[#e30613] transition-colors">
                          {opt.name}
                        </h3>
                        <p className="text-sm text-[#878787] mt-0.5 leading-relaxed">{opt.description}</p>
                      </div>

                      <ChevronRight
                        size={20}
                        className="text-gray-300 group-hover:text-[#e30613] transition-colors flex-shrink-0"
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {!isLoading && showMapForTecnico && filteredCourses.length > 0 && (
          <CampusMap
            courses={filteredCourses}
            period={tecnicoSelectedPeriod}
            completeClasses={completeClasses}
            isTechnicalModality
          />
        )}

        {!isLoading && showMapForTecnico && filteredCourses.length === 0 && (
          <div className="text-center text-[#878787] py-12 text-base">
            Nenhuma turma encontrada para este período.
          </div>
        )}

        {!isLoading && modality !== 'tecnico' && filteredCourses.length > 0 && (
          <CampusMap
            courses={filteredCourses}
            period={null}
            completeClasses={completeClasses}
            isTechnicalModality={false}
          />
        )}
      </main>
    </div>
  )
}

export default CoursesByModality
