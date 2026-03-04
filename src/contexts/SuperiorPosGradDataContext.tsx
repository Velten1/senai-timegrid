/**
 * Context React que fornece dados de Cursos Superiores e Pós-Graduação para toda a aplicação.
 * 
 * Este contexto:
 * - Usa o hook useExcelDataSuperiorPosGrad para carregar dados do Excel
 * - Adapta os dados parseados para o formato da aplicação
 * - Separa dados de superiores e pós-graduação
 * - Fornece dados, loading, erros e função de refetch para componentes filhos
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useExcelDataSuperiorPosGrad } from '../hooks/useExcelDataSuperiorPosGrad'
import { adaptExcelData } from '../utils/excelAdapter'
import type { Course, Teacher, Room, Class, CompleteClass } from '../types'

interface ModalityData {
  courses: Course[]
  teachers: Teacher[]
  rooms: Room[]
  classes: Class[]
  completeClasses: CompleteClass[]
  announcements: string[]
}

interface SuperiorPosGradDataContextType {
  superiores: ModalityData
  posGraduacao: ModalityData
  loading: boolean
  error: Error | null
  lastUpdate: Date | null
  refetch: () => void
}

const emptyData: ModalityData = {
  courses: [],
  teachers: [],
  rooms: [],
  classes: [],
  completeClasses: [],
  announcements: [],
}

const SuperiorPosGradDataContext = createContext<
  SuperiorPosGradDataContextType | undefined
>(undefined)

/**
 * Provider: envolve a aplicação e fornece dados de Cursos Superiores e Pós-Graduação
 */
export function SuperiorPosGradDataProvider({
  children,
}: {
  children: ReactNode
}) {
  const { data, loading, error, lastUpdate, refetch } =
    useExcelDataSuperiorPosGrad({
      pollingInterval: 30 * 1000, // 30 segundos
    })

  // Adapta dados de Cursos Superiores (usa courseNameMap para nomes completos)
  const superiores = useMemo(() => {
    if (!data?.superiores) return emptyData
    return adaptExcelData(data.superiores, 'superior', data.courseNameMap)
  }, [data])

  // Adapta dados de Pós-Graduação (usa courseNameMap para nomes completos)
  const posGraduacao = useMemo(() => {
    if (!data?.posGraduacao) return emptyData
    return adaptExcelData(data.posGraduacao, 'pos-graduacao', data.courseNameMap)
  }, [data])

  return (
    <SuperiorPosGradDataContext.Provider
      value={{
        superiores,
        posGraduacao,
        loading,
        error,
        lastUpdate,
        refetch,
      }}
    >
      {children}
    </SuperiorPosGradDataContext.Provider>
  )
}

/**
 * Hook para usar o contexto de dados de Cursos Superiores e Pós-Graduação
 */
export function useSuperiorPosGradDataContext(): SuperiorPosGradDataContextType {
  const ctx = useContext(SuperiorPosGradDataContext)
  if (!ctx) {
    throw new Error(
      'useSuperiorPosGradDataContext deve ser usado dentro de <SuperiorPosGradDataProvider>',
    )
  }
  return ctx
}
