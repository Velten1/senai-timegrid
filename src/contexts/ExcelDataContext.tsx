/**
 * Context React que fornece dados de Cursos Técnicos (Manhã e Tarde) para toda a aplicação.
 * 
 * Este contexto:
 * - Usa o hook useExcelData para carregar dados do Excel
 * - Adapta os dados parseados para o formato da aplicação
 * - Fornece dados, loading, erros e função de refetch para componentes filhos
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useExcelData } from '../hooks/useExcelData'
import { adaptExcelData } from '../utils/excelAdapter'
import type { Course, Teacher, Room, Class, CompleteClass } from '../types'

interface ExcelDataContextType {
  courses: Course[]
  teachers: Teacher[]
  rooms: Room[]
  classes: Class[]
  completeClasses: CompleteClass[]
  announcements: string[]
  loading: boolean
  error: Error | null
  lastUpdate: Date | null
  refetch: () => void
}

const ExcelDataContext = createContext<ExcelDataContextType | undefined>(undefined)

/**
 * Provider: envolve a aplicação e fornece dados de Cursos Técnicos
 */
export function ExcelDataProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, lastUpdate, refetch } = useExcelData({
    pollingInterval: 30 * 1000, // 30 segundos
  })

  // Adapta os dados do Excel para o formato da aplicação
  const adapted = useMemo(() => {
    if (!data) {
      return {
        courses: [] as Course[],
        teachers: [] as Teacher[],
        rooms: [] as Room[],
        classes: [] as Class[],
        completeClasses: [] as CompleteClass[],
        announcements: [] as string[],
      }
    }
    return adaptExcelData(data)
  }, [data])

  return (
    <ExcelDataContext.Provider
      value={{
        ...adapted,
        loading,
        error,
        lastUpdate,
        refetch,
      }}
    >
      {children}
    </ExcelDataContext.Provider>
  )
}

/**
 * Hook para usar o contexto de dados de Cursos Técnicos
 */
export function useExcelDataContext(): ExcelDataContextType {
  const ctx = useContext(ExcelDataContext)
  if (!ctx) {
    throw new Error('useExcelDataContext deve ser usado dentro de <ExcelDataProvider>')
  }
  return ctx
}
