/**
 * Context React: Cursos Superiores (abas SUP_*), MBA (MBA_*) e Pós (POS_*).
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useExcelDataSuperiorPosGrad } from '../hooks/useExcelDataSuperiorPosGrad'
import { adaptExcelData } from '../utils/excelAdapter'
import type { Course, Teacher, Room, Class, CompleteClass } from '../types'

export interface SheetModalityBlock {
  sheetName: string
  label: string
  courses: Course[]
  teachers: Teacher[]
  rooms: Room[]
  classes: Class[]
  completeClasses: CompleteClass[]
  announcements: string[]
}

interface SuperiorPosGradDataContextType {
  superiorSheets: SheetModalityBlock[]
  mbaSheets: SheetModalityBlock[]
  posSheets: SheetModalityBlock[]
  loading: boolean
  error: Error | null
  lastUpdate: Date | null
  refetch: () => void
}

function toBlock(
  sheetName: string,
  label: string,
  adapted: ReturnType<typeof adaptExcelData>,
): SheetModalityBlock {
  return {
    sheetName,
    label,
    courses: adapted.courses,
    teachers: adapted.teachers,
    rooms: adapted.rooms,
    classes: adapted.classes,
    completeClasses: adapted.completeClasses,
    announcements: adapted.announcements,
  }
}

const SuperiorPosGradDataContext = createContext<
  SuperiorPosGradDataContextType | undefined
>(undefined)

export function SuperiorPosGradDataProvider({
  children,
}: {
  children: ReactNode
}) {
  const { data, loading, error, lastUpdate, refetch } =
    useExcelDataSuperiorPosGrad({
      pollingInterval: 30 * 1000,
    })

  const superiorSheets = useMemo((): SheetModalityBlock[] => {
    if (!data?.superiorSheets?.length) return []
    return data.superiorSheets.map((s) =>
      toBlock(
        s.sheetName,
        s.label,
        adaptExcelData(s.data, 'superior', data.courseNameMap),
      ),
    )
  }, [data])

  const mbaSheets = useMemo((): SheetModalityBlock[] => {
    if (!data?.mbaSheets?.length) return []
    return data.mbaSheets.map((s) =>
      toBlock(
        s.sheetName,
        s.label,
        adaptExcelData(s.data, 'pos-graduacao', data.courseNameMap),
      ),
    )
  }, [data])

  const posSheets = useMemo((): SheetModalityBlock[] => {
    if (!data?.posSheets?.length) return []
    return data.posSheets.map((s) =>
      toBlock(
        s.sheetName,
        s.label,
        adaptExcelData(s.data, 'pos-graduacao', data.courseNameMap),
      ),
    )
  }, [data])

  return (
    <SuperiorPosGradDataContext.Provider
      value={{
        superiorSheets,
        mbaSheets,
        posSheets,
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

export function useSuperiorPosGradDataContext(): SuperiorPosGradDataContextType {
  const ctx = useContext(SuperiorPosGradDataContext)
  if (!ctx) {
    throw new Error(
      'useSuperiorPosGradDataContext deve ser usado dentro de <SuperiorPosGradDataProvider>',
    )
  }
  return ctx
}
