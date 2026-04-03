import { usePollingData, type PollingOptions } from './usePollingData'
import { parseExcelFileLivres } from '../services/excelServiceLivres'
import type { ExcelData } from '../services/excelServiceTecnicos'

export function useExcelDataLivres(options: PollingOptions = {}) {
  return usePollingData<ExcelData>(
    parseExcelFileLivres,
    'Erro ao carregar dados do Excel (Cursos Livres):',
    options,
  )
}
