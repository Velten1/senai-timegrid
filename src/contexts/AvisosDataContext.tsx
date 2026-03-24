/**
 * Context React que fornece dados de Avisos/Eventos para toda a aplicação.
 *
 * - Usa o hook useExcelDataAvisos para carregar dados do Excel
 * - Fornece lista de avisos, loading, erros e função de refetch
 */

import { createContext, useContext, type ReactNode } from 'react'
import { useExcelDataAvisos } from '../hooks/useExcelDataAvisos'
import type { Aviso } from '../services/excelServiceAvisos'

interface AvisosDataContextType {
  avisos: Aviso[]
  loading: boolean
  error: Error | null
  lastUpdate: Date | null
  refetch: () => void
}

const AvisosDataContext = createContext<AvisosDataContextType | undefined>(undefined)

export function AvisosDataProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, lastUpdate, refetch } = useExcelDataAvisos({
    pollingInterval: 30 * 1000,
  })

  return (
    <AvisosDataContext.Provider
      value={{
        avisos: data?.avisos ?? [],
        loading,
        error,
        lastUpdate,
        refetch,
      }}
    >
      {children}
    </AvisosDataContext.Provider>
  )
}

export function useAvisosDataContext(): AvisosDataContextType {
  const ctx = useContext(AvisosDataContext)
  if (!ctx) {
    throw new Error('useAvisosDataContext deve ser usado dentro de <AvisosDataProvider>')
  }
  return ctx
}
