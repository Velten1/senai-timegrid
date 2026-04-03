import { usePollingData, type PollingOptions } from './usePollingData'
import { parseExcelFile, type ExcelData } from '../services/excelServiceTecnicos'

export function useExcelData(options: PollingOptions = {}) {
  return usePollingData<ExcelData>(
    parseExcelFile,
    'Erro ao carregar dados do Excel (Técnicos):',
    options,
  )
}
