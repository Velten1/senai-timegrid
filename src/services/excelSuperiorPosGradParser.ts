/**
 * Parser detalhado de abas Excel para Cursos Superiores e Pós-Graduação.
 * 
 * Este arquivo:
 * - Detecta blocos de cabeçalho (T1/T2 ou Trimestres)
 * - Extrai informações de aulas (turma, disciplina, professor, sala, horário)
 * - Processa blocos de aulas agrupadas
 * - Distribui horários quando há múltiplas aulas no mesmo intervalo
 */

import type { ParsedClass } from './excelService'
import {
  parseTimeString,
  parseTimeRange,
  isTurmaName,
  getDayNumberFromText,
  calculateHourlyTimes,
} from './excelParseHelpers'

// ── Tipos internos ────────────────────────────────────────

export interface HeaderBlock {
  subHeaderRow: number // Linha onde está o cabeçalho T1/T2 ou Trimestre
  classeCol: number    // Coluna com nome da classe/turma
  aulaCol: number      // Coluna com número da aula
  horarioCol: number   // Coluna com horário
  infoCol: number      // Coluna com informações adicionais
  type: 'T1T2' | 'trimestre' // Tipo de cabeçalho encontrado
  dayMapping: { day: number; col1: number; col2: number }[] // Mapeia dias para colunas T1/T2
}

interface AulaBlock {
  aulaNum: number      // Número da aula
  disciplinaRow: any[] // Linha com siglas das disciplinas
  professorRow: any[]  // Linha com nomes dos professores
  localRow: any[]      // Linha com salas/laboratórios
  horarioStr: string   // String com horário
}

// ── Detecção de blocos de cabeçalho ───────────────────────

/**
 * Encontra todos os blocos de cabeçalho na planilha
 * Procura por T1/T2 ou Trimestres e mapeia para dias da semana
 */
export function findHeaderBlocks(data: any[][]): HeaderBlock[] {
  const blocks: HeaderBlock[] = []

  for (let ri = 0; ri < data.length; ri++) {
    const row = data[ri]
    if (!row || row.length === 0) continue

    // Procurar colunas com T1/T2 e Trimestres
    const t1Cols: number[] = []
    const t2Cols: number[] = []
    const trim1Cols: number[] = []
    const trim2Cols: number[] = []
    let hasTrimestre = false

    for (let ci = 0; ci < row.length; ci++) {
      const v = String(row[ci] || '').trim()
      if (v.toUpperCase() === 'T1') t1Cols.push(ci)
      if (v.toUpperCase() === 'T2') t2Cols.push(ci)
      if (/1[ºo°]\s*Trimestre/i.test(v)) { trim1Cols.push(ci); hasTrimestre = true }
      if (/2[ºo°]\s*Trimestre/i.test(v)) { trim2Cols.push(ci); hasTrimestre = true }
    }

    // Determinar tipo de cabeçalho
    let type: 'T1T2' | 'trimestre' | null = null
    let col1List: number[] = []
    let col2List: number[] = []

    if (t1Cols.length >= 1 && t2Cols.length >= 1 && !hasTrimestre) {
      type = 'T1T2'
      col1List = t1Cols
      col2List = t2Cols
    } else if (hasTrimestre && trim1Cols.length > 0 && trim2Cols.length > 0) {
      type = 'trimestre'
      col1List = trim1Cols
      col2List = trim2Cols
    }

    if (!type) continue

    // Detectar colunas de cabeçalho (CLASSE, AULA, HORARIO, INFO) nas linhas acima
    let classeCol = 0, aulaCol = 1, horarioCol = 2, infoCol = 3

    for (let offset = 1; offset <= 3 && ri - offset >= 0; offset++) {
      const headerRow = data[ri - offset] || []
      for (let c = 0; c < headerRow.length; c++) {
        const cell = String(headerRow[c] || '').toLowerCase().trim()
        if (cell === 'classe' || cell === 'turma') classeCol = c
        if (cell === 'aula') aulaCol = c
        if (cell.includes('horário') || cell.includes('horario')) horarioCol = c
        if (cell === 'info' || cell === 'informação' || cell === 'informacao') infoCol = c
      }
      if (horarioCol !== 2 || (classeCol !== 0 && aulaCol !== 1)) break
    }

    // Detectar dias da semana nas linhas acima
    const dayPositions: { day: number; startCol: number }[] = []
    for (let offset = 1; offset <= 3 && ri - offset >= 0; offset++) {
      const dayRow = data[ri - offset] || []
      for (let c = 0; c < dayRow.length; c++) {
        const dayNum = getDayNumberFromText(String(dayRow[c] || '').trim())
        if (dayNum !== null && !dayPositions.some(dp => dp.day === dayNum && dp.startCol === c)) {
          dayPositions.push({ day: dayNum, startCol: c })
        }
      }
    }
    dayPositions.sort((a, b) => a.startCol - b.startCol)

    // Mapear cada par de colunas (T1/T2) para um dia da semana
    const dayMapping: HeaderBlock['dayMapping'] = []
    for (let i = 0; i < Math.min(col1List.length, col2List.length); i++) {
      const colPos = col1List[i]
      let matchedDay = dayPositions.length > 0 ? dayPositions[0].day : (i + 1)
      for (const dp of dayPositions) {
        if (dp.startCol <= colPos) matchedDay = dp.day
        else break
      }
      dayMapping.push({ day: matchedDay, col1: col1List[i], col2: col2List[i] })
    }

    blocks.push({ subHeaderRow: ri, classeCol, aulaCol, horarioCol, infoCol, type, dayMapping })

    if (dayMapping.length > 0) {
      console.log(`   Bloco L${ri}: tipo=${type}, ${dayMapping.length} dia(s)`)
    }
  }

  return blocks
}

// ── Processamento de blocos de aulas agrupadas ───────────

/**
 * Processa um grupo de aulas agrupadas
 * Distribui horários quando há múltiplas aulas no mesmo intervalo
 */
function processAulaBlocks(
  aulaBlocks: AulaBlock[],
  headerBlock: HeaderBlock,
  currentTurma: string,
  period: ParsedClass['period'],
): ParsedClass[] {
  if (aulaBlocks.length === 0) return []

  const classes: ParsedClass[] = []
  aulaBlocks.sort((a, b) => a.aulaNum - b.aulaNum)

  // Encontrar primeiro e último horário válido
  let firstTime: { start: string; end: string } | null = null
  let lastTime: { start: string; end: string } | null = null

  for (const ab of aulaBlocks) {
    const time = extractTime(ab.horarioStr)
    if (time && time.start !== '00:00') {
      if (!firstTime) firstTime = time
      lastTime = time
    }
  }

  // Se há múltiplas aulas e horários diferentes, distribuir em intervalos de 1h
  const shouldDistribute =
    firstTime && lastTime &&
    firstTime.start !== lastTime.start &&
    aulaBlocks.length > 1

  const distributedTimes = shouldDistribute
    ? calculateHourlyTimes(firstTime!.start, lastTime!.end, aulaBlocks.length)
    : null

  // Processar cada aula do bloco
  for (let i = 0; i < aulaBlocks.length; i++) {
    const ab = aulaBlocks[i]
    const time = distributedTimes?.[i]
      ?? extractTime(ab.horarioStr)
      ?? firstTime
      ?? { start: '00:00', end: '00:00' }

    // Criar aulas para cada dia da semana (T1 e T2)
    for (const { day, col1, col2 } of headerBlock.dayMapping) {
      pushIfValid(classes, ab.disciplinaRow, ab.professorRow, ab.localRow, col1, 'T1', currentTurma, day, time, period)
      pushIfValid(classes, ab.disciplinaRow, ab.professorRow, ab.localRow, col2, 'T2', currentTurma, day, time, period)
    }
  }

  return classes
}

/**
 * Extrai horário de início e fim de uma string
 * Aceita formato "8h - 9h" ou apenas "8h" (assume 1h de duração)
 */
function extractTime(horarioStr: string): { start: string; end: string } | null {
  if (!horarioStr) return null
  if (horarioStr.includes('-') || horarioStr.includes('–')) {
    return parseTimeRange(horarioStr)
  }
  if (/\d/.test(horarioStr)) {
    const s = parseTimeString(horarioStr)
    const [h, m] = s.split(':').map(Number)
    const endMin = h * 60 + m + 60
    const eH = Math.min(Math.floor(endMin / 60), 23)
    const eM = endMin % 60
    return { start: s, end: `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}` }
  }
  return null
}

// Palavras reservadas que não devem ser tratadas como siglas de disciplina
const RESERVED_RE = /^(disciplina|professor|local|info|turma)$/i

/**
 * Adiciona uma aula à lista se a célula contém uma sigla válida
 */
function pushIfValid(
  classes: ParsedClass[],
  discRow: any[], profRow: any[], locRow: any[],
  col: number, group: 'T1' | 'T2',
  turma: string, day: number,
  time: { start: string; end: string },
  period: ParsedClass['period'],
) {
  const code = String(discRow[col] || '').trim()
  // Pular células vazias ou palavras reservadas
  if (!code || RESERVED_RE.test(code)) return
  classes.push({
    turma,
    dayOfWeek: day,
    startTime: time.start,
    endTime: time.end,
    group,
    courseCode: code,
    teacherName: String(profRow[col] || '').trim(),
    labRoom: String(locRow[col] || '').trim(),
    period,
  })
}

// ── Parser principal de uma aba ────────────────────────────

/**
 * Parseia uma aba Excel e extrai todas as aulas
 * 
 * @param data Dados da planilha (array de linhas)
 * @param sheetName Nome da aba (para logs)
 * @param period Período do dia (manha, tarde, noite, sabado)
 */
export function parseSheetData(
  data: any[][],
  sheetName: string,
  period: ParsedClass['period'],
): ParsedClass[] {
  // Encontrar blocos de cabeçalho
  const blocks = findHeaderBlocks(data)
  if (blocks.length === 0) {
    console.log(`   Nenhum bloco de cabecalho em "${sheetName}" - pulando`)
    return []
  }

  const allClasses: ParsedClass[] = []

  // Processar cada bloco
  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi]
    const startRow = block.subHeaderRow + 1
    const endRow = bi + 1 < blocks.length ? blocks[bi + 1].subHeaderRow - 3 : data.length

    let currentTurma: string | null = null
    let ri = startRow
    const aulaBlocks: AulaBlock[] = []

    // Processar linhas do bloco
    while (ri < endRow) {
      const row = data[ri]
      if (!row || row.length === 0) { ri++; continue }

      // Detectar nome da turma
      const classeCell = String(row[block.classeCol] || '').trim()
      if (classeCell && isTurmaName(classeCell)) {
        currentTurma = classeCell
      }

      const infoCell = String(row[block.infoCol] || '').trim().toLowerCase()

      // Pular linhas de intervalo
      if (/intervalo/i.test(infoCell) || /intervalo/i.test(String(row[block.aulaCol] || ''))) {
        ri++; continue
      }

      // Detectar bloco de 3 linhas: Disciplina/Professor/Local
      if (infoCell === 'disciplina' && currentTurma) {
        const disciplinaRow = row
        const professorRow = data[ri + 1] || []
        const localRow = data[ri + 2] || []

        // Verificar se há turma na linha do Professor
        const profTurma = String(professorRow[block.classeCol] || '').trim()
        if (profTurma && isTurmaName(profTurma)) currentTurma = profTurma

        // Extrair número da aula da linha anterior
        const aulaRow = data[ri - 1] || []
        const aulaMatch = String(aulaRow[block.aulaCol] || '').match(/(\d+)[ª°º]/i)
        const aulaNum = aulaMatch ? parseInt(aulaMatch[1], 10) : 0

        // Extrair horário (tentar várias posições)
        let horarioStr = String(aulaRow[block.horarioCol] || '').trim()
        if (!horarioStr || /^(Info|HORÁRIO|HORARIO|AULA)$/i.test(horarioStr)) {
          horarioStr = String(disciplinaRow[block.horarioCol] || '').trim()
        }
        if (!horarioStr || /^(Info|AULA)$/i.test(horarioStr)) {
          horarioStr = String(aulaRow[block.aulaCol] || '').trim()
        }

        aulaBlocks.push({ aulaNum, disciplinaRow, professorRow, localRow, horarioStr })
        ri += 3
        continue
      }

      // Padrão legado: "Aula" + dígito (formato usado em Cursos Técnicos)
      const aulaCell = String(row[block.aulaCol] || '').trim()
      if (/^aula\s*\d/i.test(aulaCell) && currentTurma) {
        const time = parseTimeRange(String(row[block.horarioCol] || ''))
        const teacherRow = data[ri + 1] || []
        const roomRow = data[ri + 2] || []

        // Criar aulas para cada dia (T1 e T2)
        for (const { day, col1, col2 } of block.dayMapping) {
          pushIfValid(allClasses, row, teacherRow, roomRow, col1, 'T1', currentTurma, day, time, period)
          pushIfValid(allClasses, row, teacherRow, roomRow, col2, 'T2', currentTurma, day, time, period)
        }
        ri += 3
        continue
      }

      ri++
    }

    // Processar blocos de aulas agrupadas
    if (currentTurma && aulaBlocks.length > 0) {
      allClasses.push(...processAulaBlocks(aulaBlocks, block, currentTurma, period))
    }
  }

  return allClasses
}
