import { useState, useEffect, useCallback, useRef } from 'react'
import { parseExcelFileLivres } from '../services/excelServiceLivres'
import type { ExcelData } from '../services/excelService'

interface UseExcelDataLivresOptions {
  pollingInterval?: number // ms – padrão 5 min
  enabled?: boolean
}

export function useExcelDataLivres(options: UseExcelDataLivresOptions = {}) {
  const { pollingInterval = 5 * 60 * 1000, enabled = true } = options

  const [data, setData] = useState<ExcelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const isMounted = useRef(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await parseExcelFileLivres()
      if (isMounted.current) {
        setData(result)
        setError(null)
        setLastUpdate(new Date())
        console.log('Dados do Excel (Cursos Livres) carregados com sucesso')
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
        console.error('Erro ao carregar dados do Excel (Cursos Livres):', err)
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  // Carga inicial
  useEffect(() => {
    isMounted.current = true
    if (enabled) loadData()
    return () => { isMounted.current = false }
  }, [loadData, enabled])

  // Polling
  useEffect(() => {
    if (!enabled || pollingInterval <= 0) return
    const id = setInterval(loadData, pollingInterval)
    return () => clearInterval(id)
  }, [loadData, pollingInterval, enabled])

  return { data, loading, error, lastUpdate, refetch: loadData }
}
