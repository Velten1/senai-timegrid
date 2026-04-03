import { usePollingData, type PollingOptions } from './usePollingData'
import { parseExcelFileAvisos, type AvisosData } from '../services/excelServiceAvisos'

export function useExcelDataAvisos(options: PollingOptions = {}) {
  return usePollingData<AvisosData>(
    parseExcelFileAvisos,
    'Erro ao carregar dados do Excel (Avisos):',
    options,
  )
}
