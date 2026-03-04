/**
 * Hook React para carregar dados de Cursos Técnicos (Manhã e Tarde) do Excel.
 * 
 * Funcionalidades:
 * - Carrega dados na montagem do componente
 * - Faz polling automático a cada 30 segundos
 * - Mostra loading apenas na primeira carga (refreshes são invisíveis)
 * - Retorna dados, estado de loading, erros e função de refetch manual
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { parseExcelFile, type ExcelData } from '../services/excelService'

interface UseExcelDataOptions {
  pollingInterval?: number // Intervalo de polling em ms (padrão: 30s)
  enabled?: boolean // Se false, não faz polling
}

/**
 * Hook principal: gerencia carregamento e polling de dados do Excel
 */
export function useExcelData(options: UseExcelDataOptions = {}) {
  const { pollingInterval = 30 * 1000, enabled = true } = options

  const [data, setData] = useState<ExcelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const isMounted = useRef(true)
  const hasLoadedOnce = useRef(false) // Flag para controlar quando mostrar loading

  /**
   * Função que carrega os dados do Excel
   * Mostra loading apenas na primeira execução
   */
  const loadData = useCallback(async () => {
    try {
      // Loading visível APENAS na primeira carga (quando não tem dados ainda)
      if (!hasLoadedOnce.current) {
        setLoading(true)
      }

      const result = await parseExcelFile()

      if (isMounted.current) {
        setData(result)
        setError(null)
        setLastUpdate(new Date())
        hasLoadedOnce.current = true
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
        console.error('Erro ao carregar dados do Excel:', err)
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  // Carga inicial quando o componente monta
  useEffect(() => {
    isMounted.current = true
    if (enabled) loadData()
    return () => { isMounted.current = false }
  }, [loadData, enabled])

  // Polling automático: recarrega dados a cada X segundos
  useEffect(() => {
    if (!enabled || pollingInterval <= 0) return
    const id = setInterval(loadData, pollingInterval)
    return () => clearInterval(id)
  }, [loadData, pollingInterval, enabled])

  return { data, loading, error, lastUpdate, refetch: loadData }
}
