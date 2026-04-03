/**
 * Hook genérico de carregamento com polling automático.
 *
 * Usado por useExcelData, useExcelDataLivres, useExcelDataSuperiorPosGrad e
 * useExcelDataAvisos para eliminar código duplicado entre eles.
 *
 * Comportamento:
 * - Chama `fetchFn` na montagem do componente
 * - Faz polling automático a cada `pollingInterval` ms
 * - Exibe `loading = true` apenas na primeira carga (refreshes são invisíveis)
 * - Guarda estado de erro, data do último update e função de refetch manual
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export interface PollingOptions {
  pollingInterval?: number
  enabled?: boolean
}

export function usePollingData<T>(
  fetchFn: () => Promise<T>,
  errorLabel: string,
  options: PollingOptions = {},
) {
  const { pollingInterval = 30 * 1000, enabled = true } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const isMounted = useRef(true)
  const hasLoadedOnce = useRef(false)
  // Ref para sempre chamar a versão mais recente de fetchFn sem adicioná-la às deps do useCallback
  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn

  const loadData = useCallback(async () => {
    try {
      if (!hasLoadedOnce.current) setLoading(true)

      const result = await fetchFnRef.current()

      if (isMounted.current) {
        setData(result)
        setError(null)
        setLastUpdate(new Date())
        hasLoadedOnce.current = true
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
        console.error(errorLabel, err)
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [errorLabel])

  useEffect(() => {
    isMounted.current = true
    if (enabled) loadData()
    return () => {
      isMounted.current = false
    }
  }, [loadData, enabled])

  useEffect(() => {
    if (!enabled || pollingInterval <= 0) return
    const id = setInterval(loadData, pollingInterval)
    return () => clearInterval(id)
  }, [loadData, pollingInterval, enabled])

  return { data, loading, error, lastUpdate, refetch: loadData }
}
