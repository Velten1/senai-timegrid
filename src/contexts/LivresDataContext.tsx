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

export function LivresDataProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, lastUpdate, refetch } = useExcelDataLivres({
    pollingInterval: 5 * 60 * 1000, // 5 minutos
  })

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
    // Usar 'livre' como modality para Cursos Livres
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

export function useLivresDataContext(): LivresDataContextType {
  const ctx = useContext(LivresDataContext)
  if (!ctx) {
    throw new Error('useLivresDataContext deve ser usado dentro de <LivresDataProvider>')
  }
  return ctx
}
