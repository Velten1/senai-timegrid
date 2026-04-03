import { usePollingData, type PollingOptions } from './usePollingData'
import {
  parseExcelFileSuperiorPosGrad,
  type SuperiorPosGradData,
} from '../services/excelServiceSuperiorPosGrad'

export function useExcelDataSuperiorPosGrad(options: PollingOptions = {}) {
  return usePollingData<SuperiorPosGradData>(
    parseExcelFileSuperiorPosGrad,
    'Erro ao carregar dados do Excel (Superior + Pós-Grad):',
    options,
  )
}
