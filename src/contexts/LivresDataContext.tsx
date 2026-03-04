/**
 * Context React que fornece dados de Cursos Livres (Sábado) para toda a aplicação.
 * 
 * Este contexto:
 * - Usa o hook useExcelDataLivres para carregar dados do Excel
 * - Adapta os dados parseados para o formato da aplicação
 * - Fornece dados, loading, erros e função de refetch para componentes filhos
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useExcelDataLivres } from '../hooks/useExcelDataLivres'
import { adaptExcelData } from '../utils/excelAdapter'
import type { Course, Teacher, Room, Class, CompleteClass } from '../types'

interface LivresDataContextType {
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

const LivresDataContext = createContext<LivresDataContextType | undefined>(undefined)

/**
 * Provider: envolve a aplicação e fornece dados de Cursos Livres
 */
export function LivresDataProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, lastUpdate, refetch } = useExcelDataLivres({
    pollingInterval: 30 * 1000, // 30 segundos
  })

  // Adapta os dados do Excel para o formato da aplicação (modalidade: 'livre')
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
    return adaptExcelData(data, 'livre')
  }, [data])

  return (
    <LivresDataContext.Provider
      value={{
        ...adapted,
        loading,
        error,
        lastUpdate,
        refetch,
      }}
    >
      {children}
    </LivresDataContext.Provider>
  )
}

/**
 * Hook para usar o contexto de dados de Cursos Livres
 */
export function useLivresDataContext(): LivresDataContextType {
  const ctx = useContext(LivresDataContext)
  if (!ctx) {
    throw new Error('useLivresDataContext deve ser usado dentro de <LivresDataProvider>')
  }
  return ctx
}
