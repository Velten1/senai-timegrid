/**
 * Hook React para carregar dados de Avisos/Eventos do Excel.
 *
 * Funcionalidades:
 * - Carrega dados na montagem do componente
 * - Faz polling automático a cada 30 segundos
 * - Mostra loading apenas na primeira carga
 * - Retorna dados, estado de loading, erros e função de refetch manual
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  parseExcelFileAvisos,
  type AvisosData,
} from '../services/excelServiceAvisos'

interface UseExcelDataAvisosOptions {
  pollingInterval?: number
  enabled?: boolean
}

export function useExcelDataAvisos(options: UseExcelDataAvisosOptions = {}) {
  const { pollingInterval = 30 * 1000, enabled = true } = options

  const [data, setData] = useState<AvisosData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const isMounted = useRef(true)
  const hasLoadedOnce = useRef(false)

  const loadData = useCallback(async () => {
    try {
      if (!hasLoadedOnce.current) setLoading(true)

      const result = await parseExcelFileAvisos()

      if (isMounted.current) {
        setData(result)
        setError(null)
        setLastUpdate(new Date())
        hasLoadedOnce.current = true
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
        console.error('Erro ao carregar dados do Excel (Avisos):', err)
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    if (enabled) loadData()
    return () => { isMounted.current = false }
  }, [loadData, enabled])

  useEffect(() => {
    if (!enabled || pollingInterval <= 0) return
    const id = setInterval(loadData, pollingInterval)
    return () => clearInterval(id)
  }, [loadData, pollingInterval, enabled])

  return { data, loading, error, lastUpdate, refetch: loadData }
}
