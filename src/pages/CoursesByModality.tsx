import { useMemo, useEffect } from 'react'
import { useParams, useNavigate, useMatch, useLocation } from 'react-router-dom'
import { Sun, Sunset, ChevronRight, Briefcase, Award, GraduationCap } from 'lucide-react'
import { CampusMap } from '../components/map/CampusMap'
import { useExcelDataContext } from '../contexts/ExcelDataContext'
import { useLivresDataContext } from '../contexts/LivresDataContext'
import { useSuperiorPosGradDataContext } from '../contexts/SuperiorPosGradDataContext'
import type { SheetModalityBlock } from '../contexts/SuperiorPosGradDataContext'
import { courses as mockCourses, classes as mockClasses, getCompleteClasses } from '../data/mockData'
import type { Period } from '../utils/courseSchedule'
import type { Course } from '../types'
import senaiWhiteLogo from '../images/senaiWHITE.png'

const modalityNames: Record<string, string> = {
  superior: 'Cursos Superiores',
  tecnico: 'CAI e Cursos Técnicos',
  livre: 'Cursos Livres',
  especializacao: 'Cursos de Especialização',
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

const ESP_TRACK_OPTIONS = [
  {
    id: 'mba' as const,
    name: 'MBA',
    description: 'Grades dos cursos de MBA',
    icon: Briefcase,
  },
  {
    id: 'pos' as const,
    name: 'Pós-Graduação',
    description: 'Grades da pós-graduação',
    icon: Award,
  },
]

function findSheetBlock(
  sheets: SheetModalityBlock[],
  rawKey: string | undefined,
): SheetModalityBlock | null {
  if (!rawKey) return null
  let decoded = rawKey
  try {
    decoded = decodeURIComponent(rawKey)
  } catch {
    /* manter rawKey */
  }
  return sheets.find((s) => s.sheetName === decoded) ?? null
}

function CoursesByModality() {
  const params = useParams<{ modality?: string; period?: string; track?: string; sheetKey?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const matchTecnicoPeriod = useMatch({ path: '/cursos/tecnico/:period', end: true })
  const matchSuperiorSheet = useMatch({ path: '/cursos/superior/:sheetKey', end: true })
  const matchEspSheet = useMatch({ path: '/cursos/especializacao/:track/:sheetKey', end: true })
  const matchEspTrack = useMatch({ path: '/cursos/especializacao/:track', end: true })
  const matchEspRoot = useMatch({ path: '/cursos/especializacao', end: true })

  const modality =
    location.pathname.startsWith('/cursos/tecnico') ? 'tecnico' : params.modality

  const tecnicoPeriodSlug = matchTecnicoPeriod?.params.period

  useEffect(() => {
    if (modality !== 'tecnico' || !tecnicoPeriodSlug) return
    if (tecnicoPeriodSlug !== 'manha' && tecnicoPeriodSlug !== 'tarde') {
      navigate('/cursos/tecnico', { replace: true })
    }
  }, [modality, tecnicoPeriodSlug, navigate])

  useEffect(() => {
    if (!matchEspTrack || matchEspSheet) return
    const t = (matchEspTrack.params.track ?? '').toLowerCase()
    if (t !== 'mba' && t !== 'pos') {
      navigate('/cursos/especializacao', { replace: true })
    }
  }, [matchEspTrack, matchEspSheet, navigate])

  const tecnicoSelectedPeriod: Period =
    tecnicoPeriodSlug === 'manha' || tecnicoPeriodSlug === 'tarde' ? tecnicoPeriodSlug : null

  const isTecnicoPicker = modality === 'tecnico' && !tecnicoSelectedPeriod

  const path = location.pathname
  const isSuperiorPicker = path === '/cursos/superior'
  const isEspecializacaoRoot = Boolean(matchEspRoot)
  const isEspTrackList =
    Boolean(matchEspTrack) &&
    !matchEspSheet &&
    (path === '/cursos/especializacao/mba' || path === '/cursos/especializacao/pos')
  const espTrack = (matchEspSheet?.params.track ?? matchEspTrack?.params.track ?? '').toLowerCase() as
    | 'mba'
    | 'pos'
    | ''

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
    superiorSheets,
    mbaSheets,
    posSheets,
    loading: supPosGradLoading,
  } = useSuperiorPosGradDataContext()

  const isExcelModality = modality === 'tecnico' && excelCourses.length > 0
  const isLivresModality = modality === 'livre' && livresCourses.length > 0

  const superiorBlock = useMemo(
    () => findSheetBlock(superiorSheets, matchSuperiorSheet?.params.sheetKey),
    [superiorSheets, matchSuperiorSheet?.params.sheetKey],
  )

  const espSheets = useMemo(
    () => (espTrack === 'mba' ? mbaSheets : espTrack === 'pos' ? posSheets : []),
    [espTrack, mbaSheets, posSheets],
  )
  const espBlock = useMemo(
    () => findSheetBlock(espSheets, matchEspSheet?.params.sheetKey),
    [espSheets, matchEspSheet?.params.sheetKey],
  )

  const isSuperiorMap = Boolean(matchSuperiorSheet && superiorBlock)
  const isEspMap = Boolean(matchEspSheet && espBlock && (espTrack === 'mba' || espTrack === 'pos'))

  const needsSupPosData =
    isSuperiorPicker ||
    Boolean(matchSuperiorSheet) ||
    isEspecializacaoRoot ||
    isEspTrackList ||
    Boolean(matchEspSheet)

  const isLoading =
    (modality === 'tecnico' && excelLoading) ||
    (modality === 'livre' && livresLoading) ||
    (needsSupPosData && supPosGradLoading)

  const filteredCourses: Course[] = useMemo(() => {
    if (isSuperiorMap && superiorBlock) return superiorBlock.courses
    if (isEspMap && espBlock) return espBlock.courses

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

    return mockCourses.filter((c) => c.modality === modality)
  }, [
    modality,
    isExcelModality,
    isLivresModality,
    isSuperiorMap,
    isEspMap,
    superiorBlock,
    espBlock,
    excelCourses,
    livresCourses,
    tecnicoSelectedPeriod,
  ])

  const completeClasses = useMemo(() => {
    if (isSuperiorMap && superiorBlock) return superiorBlock.completeClasses
    if (isEspMap && espBlock) return espBlock.completeClasses

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

    return getCompleteClasses(mockClasses)
  }, [
    isExcelModality,
    isLivresModality,
    isSuperiorMap,
    isEspMap,
    superiorBlock,
    espBlock,
    excelCompleteClasses,
    livresCompleteClasses,
    tecnicoSelectedPeriod,
  ])

  const showMapForTecnico =
    modality === 'tecnico' && (tecnicoSelectedPeriod === 'manha' || tecnicoSelectedPeriod === 'tarde')

  const showSuperiorMap = isSuperiorMap && superiorBlock && filteredCourses.length > 0
  const showEspMap = isEspMap && espBlock && filteredCourses.length > 0

  const invalidSuperiorSheet =
    Boolean(matchSuperiorSheet) && !supPosGradLoading && !superiorBlock
  const invalidEspSheet =
    Boolean(matchEspSheet) && !supPosGradLoading && !espBlock && (espTrack === 'mba' || espTrack === 'pos')

  if (invalidSuperiorSheet || invalidEspSheet) {
    return (
      <div className="min-h-screen bg-[#ededed] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Curso não encontrado</h1>
          <p className="text-[#878787] mb-6 text-sm">
            A aba deste curso não existe na planilha ou o nome na URL está incorreto.
          </p>
          <button
            type="button"
            onClick={() =>
              invalidSuperiorSheet
                ? navigate('/cursos/superior')
                : navigate(`/cursos/especializacao/${espTrack}`)
            }
            className="px-6 py-3 bg-[#e30613] text-white rounded-lg hover:bg-[#9a1915] transition-colors font-semibold"
          >
            Voltar à lista
          </button>
        </div>
      </div>
    )
  }

  const knownModalities = ['tecnico', 'livre', 'superior', 'especializacao']
  const isKnownFlow =
    path.startsWith('/cursos/tecnico') ||
    path.startsWith('/cursos/livre') ||
    path.startsWith('/cursos/superior') ||
    path.startsWith('/cursos/especializacao')

  if (
    modality &&
    !knownModalities.includes(modality) &&
    !isLoading &&
    filteredCourses.length === 0 &&
    !isTecnicoPicker
  ) {
    return (
      <div className="min-h-screen bg-[#ededed] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Modalidade não encontrada</h1>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#e30613] text-white rounded-lg hover:bg-[#9a1915] transition-colors font-semibold"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  if (!modality && !isKnownFlow && path.startsWith('/cursos/')) {
    return (
      <div className="min-h-screen bg-[#ededed] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Página não encontrada</h1>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#e30613] text-white rounded-lg hover:bg-[#9a1915] transition-colors font-semibold"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  const pageTitle = (() => {
    if (isSuperiorMap && superiorBlock) return superiorBlock.label
    if (showEspMap && espBlock) return espBlock.label
    if (isSuperiorPicker) return modalityNames.superior
    if (isEspecializacaoRoot) return modalityNames.especializacao
    if (isEspTrackList && espTrack === 'mba') return 'MBA - escolha o curso'
    if (isEspTrackList && espTrack === 'pos') return 'Pós-Graduação - escolha o curso'
    return modalityNames[modality ?? ''] ?? modality ?? 'Grade de Horários'
  })()

  const handleBack = () => {
    if (isSuperiorMap) navigate('/cursos/superior')
    else if (isSuperiorPicker) navigate('/')
    else if (showEspMap && (espTrack === 'mba' || espTrack === 'pos'))
      navigate(`/cursos/especializacao/${espTrack}`)
    else if (isEspTrackList) navigate('/cursos/especializacao')
    else if (isEspecializacaoRoot) navigate('/')
    else if (modality === 'tecnico' && tecnicoSelectedPeriod) navigate('/cursos/tecnico')
    else navigate('/')
  }

  const renderSheetPicker = (sheets: SheetModalityBlock[], basePath: string) => (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-2xl lg:text-3xl font-black text-gray-800">Escolha o curso</h2>
        <div className="mt-2 flex justify-center">
          <ChevronRight size={28} className="text-[#e30613] rotate-90" />
        </div>
      </div>

      {sheets.length === 0 ? (
        <p className="text-center text-[#878787] py-8">
          Nenhuma aba cadastrada na planilha para esta categoria (use prefixo SUP_, MBA_ ou POS_ no nome da
          aba).
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5 max-w-4xl mx-auto">
          {sheets.map((s) => (
            <button
              key={s.sheetName}
              type="button"
              onClick={() =>
                navigate(`${basePath}/${encodeURIComponent(s.sheetName)}`)
              }
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
                  <GraduationCap size={26} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg lg:text-xl font-bold text-gray-800 group-hover:text-[#e30613] transition-colors">
                    {s.label}
                  </h3>
                </div>
                <ChevronRight
                  size={20}
                  className="text-gray-300 group-hover:text-[#e30613] transition-colors flex-shrink-0"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )

  return (
    <div className="min-h-screen bg-[#ededed]">
      <div className="bg-[#e30613] px-4 lg:px-6 py-3 flex items-center gap-4">
        <img src={senaiWhiteLogo} alt="SENAI" className="h-7 lg:h-8" />
        <span className="text-white/50">|</span>
        <span className="text-white/90 text-sm font-medium">Grade de Horários</span>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-black text-gray-800 break-words">{pageTitle}</h1>
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
            {(isSuperiorPicker || isEspTrackList) && (
              <p className="text-sm text-[#878787] mt-1.5">Selecione um curso para ver a grade no mapa</p>
            )}
            {isEspecializacaoRoot && (
              <p className="text-sm text-[#878787] mt-1.5">Escolha MBA ou Pós-Graduação</p>
            )}
            <div className="mt-2 h-1 w-14 bg-[#e30613] rounded-full" />
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="shrink-0 px-5 py-2.5 bg-[#ededed] text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm border border-gray-300 active:scale-95 touch-manipulation"
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

        {!isLoading && isEspecializacaoRoot && (
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-black text-gray-800">Tipo de especialização</h2>
              <div className="mt-2 flex justify-center">
                <ChevronRight size={28} className="text-[#e30613] rotate-90" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5 max-w-4xl mx-auto">
              {ESP_TRACK_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => navigate(`/cursos/especializacao/${opt.id}`)}
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

        {!isLoading && isSuperiorPicker && renderSheetPicker(superiorSheets, '/cursos/superior')}

        {!isLoading && isEspTrackList && espTrack === 'mba' && renderSheetPicker(mbaSheets, '/cursos/especializacao/mba')}

        {!isLoading && isEspTrackList && espTrack === 'pos' && renderSheetPicker(posSheets, '/cursos/especializacao/pos')}

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

        {!isLoading && (showSuperiorMap || showEspMap) && (
          <CampusMap
            courses={filteredCourses}
            period={null}
            completeClasses={completeClasses}
            isTechnicalModality={false}
            scheduleLayout={
              showEspMap && (espTrack === 'mba' || espTrack === 'pos') ? 'mba' : 'classic'
            }
          />
        )}

        {!isLoading &&
          modality === 'livre' &&
          filteredCourses.length > 0 &&
          !isSuperiorPicker &&
          !isEspecializacaoRoot &&
          !isEspTrackList &&
          !showSuperiorMap &&
          !showEspMap && (
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
