/**
 * Parser detalhado de abas Excel para Cursos Superiores e Pós-Graduação.
 * 
 * Este arquivo:
 * - Detecta blocos de cabeçalho (T1/T2 ou Trimestres)
 * - Extrai informações de aulas (turma, disciplina, professor, sala, horário)
 * - Processa blocos de aulas agrupadas
 * - Distribui horários quando há múltiplas aulas no mesmo intervalo
 */

import type { ParsedClass } from './excelServiceTecnicos'
import {
  parseTimeRange,
  isTurmaName,
  getDayNumberFromText,
  calculateHourlyTimes,
  extractTimeFromCell,
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
  aulaNum: number       // Número da aula
  disciplinaRow: any[]  // Linha com siglas das disciplinas
  professorRow: any[]   // Linha com nomes dos professores
  localRow: any[]       // Linha com salas/laboratórios
  horarioStr: string    // String com horário
  afterLocalRow: any[]  // Linha logo após Local (usada para INTERVALO deslocado)
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

    // Determinar tipo de cabeçalho — aceita T1 sozinho (sem T2 obrigatório)
    let type: 'T1T2' | 'trimestre' | null = null
    let col1List: number[] = []
    let col2List: number[] = []

    if (t1Cols.length >= 1 && !hasTrimestre) {
      type = 'T1T2'
      col1List = t1Cols
      col2List = t2Cols // pode ser vazio se não houver T2
    } else if (hasTrimestre && trim1Cols.length > 0) {
      type = 'trimestre'
      col1List = trim1Cols
      col2List = trim2Cols // pode ser vazio
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

    // Detectar dias da semana nas linhas acima (deduplicar por dia)
    const dayPositions: { day: number; startCol: number }[] = []
    for (let offset = 1; offset <= 3 && ri - offset >= 0; offset++) {
      const dayRow = data[ri - offset] || []
      for (let c = 0; c < dayRow.length; c++) {
        const dayNum = getDayNumberFromText(String(dayRow[c] || '').trim())
        if (dayNum !== null && !dayPositions.some(dp => dp.day === dayNum)) {
          dayPositions.push({ day: dayNum, startCol: c })
        }
      }
    }
    dayPositions.sort((a, b) => a.startCol - b.startCol)

    // Mapear colunas para cada dia da semana
    // Para cada dia, verifica se existem T1/T2 labels dentro do range.
    // Se não existem labels, deduz colunas pela posição e span até o próximo dia.
    const dayMapping: HeaderBlock['dayMapping'] = []
    for (let di = 0; di < dayPositions.length; di++) {
      const dp = dayPositions[di]
      const nextCol = dayPositions[di + 1]?.startCol ?? (row.length)

      // Procurar T1 e T2 dentro do range deste dia [dp.startCol, nextCol)
      const t1InDay = col1List.find(c => c >= dp.startCol && c < nextCol)
      const t2InDay = col2List.find(c => c >= dp.startCol && c < nextCol)

      if (t1InDay !== undefined && t2InDay !== undefined) {
        // Dia com T1 + T2 labels
        dayMapping.push({ day: dp.day, col1: t1InDay, col2: t2InDay })
      } else if (t1InDay !== undefined) {
        // Dia com T1 apenas (sem T2)
        dayMapping.push({ day: dp.day, col1: t1InDay, col2: -1 })
      } else {
        // Dia sem labels T1/T2 — deduzir pela posição
        const span = nextCol - dp.startCol
        if (span >= 2) {
          // 2+ colunas sem label → tratar como col1 e col2
          dayMapping.push({ day: dp.day, col1: dp.startCol, col2: dp.startCol + 1 })
        } else {
          // 1 coluna só
          dayMapping.push({ day: dp.day, col1: dp.startCol, col2: -1 })
        }
      }
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

  // Encontrar primeiro e último horário válido e contar aulas com horário individual
  let firstTime: { start: string; end: string } | null = null
  let lastTime: { start: string; end: string } | null = null
  let aulasWithTime = 0

  for (const ab of aulaBlocks) {
    const time = extractTime(ab.horarioStr)
    if (time && time.start !== '00:00') {
      if (!firstTime) firstTime = time
      lastTime = time
      aulasWithTime++
    }
  }

  // Distribuir horários APENAS quando há aulas sem horário individual
  // Se todas as aulas já têm horário, usa o individual (evita sobrescrever com cálculo errado)
  const shouldDistribute =
    firstTime && lastTime &&
    firstTime.start !== lastTime.start &&
    aulaBlocks.length > 1 &&
    aulasWithTime < aulaBlocks.length

  const distributedTimes = shouldDistribute
    ? calculateHourlyTimes(firstTime!.start, lastTime!.end, aulaBlocks.length)
    : null

  // Processar cada aula do bloco
  for (let i = 0; i < aulaBlocks.length; i++) {
    const ab = aulaBlocks[i]
    // Prioridade: horário individual → distribuído → primeiro horário → fallback
    const time = extractTime(ab.horarioStr)
      ?? distributedTimes?.[i]
      ?? firstTime
      ?? { start: '00:00', end: '00:00' }

    // Criar aulas para cada dia da semana (T1 e, se existir, T2)
    for (const { day, col1, col2 } of headerBlock.dayMapping) {
      pushIfValid(classes, ab.disciplinaRow, ab.professorRow, ab.localRow, col1, 'T1', currentTurma, day, time, period, ab.afterLocalRow)
      if (col2 >= 0) {
        pushIfValid(classes, ab.disciplinaRow, ab.professorRow, ab.localRow, col2, 'T2', currentTurma, day, time, period, ab.afterLocalRow)
      }
    }
  }

  return classes
}

const extractTime = extractTimeFromCell

// Palavras reservadas que não devem ser tratadas como siglas de disciplina
const RESERVED_RE = /^(disciplina|professor|local|info|turma|intervalo|hor[áa]rio|aula|classe|data)$/i

/**
 * Adiciona uma aula à lista se a célula contém uma sigla válida.
 *
 * Trata o padrão "INTERVALO deslocado": quando a célula de disciplina
 * contém INTERVALO (ou está vazia — ex: célula mesclada do Excel) mas as
 * linhas abaixo contêm dados de uma aula real. Isso ocorre quando um dia
 * (ex: sexta) tem intervalo mais cedo que os demais dias.
 */
function pushIfValid(
  classes: ParsedClass[],
  discRow: any[], profRow: any[], locRow: any[],
  col: number, group: 'T1' | 'T2',
  turma: string, day: number,
  time: { start: string; end: string },
  period: ParsedClass['period'],
  afterLocalRow?: any[],
) {
  const code = String(discRow[col] || '').trim()

  // Tratar INTERVALO deslocado OU célula vazia (merge do Excel):
  // Se disciplina = "INTERVALO" ou vazia, verificar se as linhas abaixo
  // contêm dados deslocados (disciplina em profRow, professor em locRow)
  if (/^intervalo$/i.test(code) || !code) {
    const shiftedDisc = String(profRow[col] || '').trim()
    const shiftedProf = String(locRow[col] || '').trim()
    // Só criar aula se AMBOS (disc e prof deslocados) existirem e não forem
    // palavras reservadas — evita falsos positivos em células legitimamente vazias
    if (shiftedDisc && !RESERVED_RE.test(shiftedDisc) && shiftedProf && !RESERVED_RE.test(shiftedProf)) {
      const shiftedRoom = afterLocalRow ? String(afterLocalRow[col] || '').trim() : ''
      classes.push({
        turma,
        dayOfWeek: day,
        startTime: time.start,
        endTime: time.end,
        group,
        courseCode: shiftedDisc,
        teacherName: shiftedProf,
        labRoom: /^intervalo$/i.test(shiftedRoom) ? '' : shiftedRoom,
        period,
      })
    }
    return
  }

  // Pular palavras reservadas
  if (RESERVED_RE.test(code)) return
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
      if (classeCell && isTurmaName(classeCell) && classeCell !== currentTurma) {
        // Se mudou de turma, processar aulas acumuladas da turma anterior
        if (currentTurma && aulaBlocks.length > 0) {
          allClasses.push(...processAulaBlocks(aulaBlocks, block, currentTurma, period))
          aulaBlocks.length = 0
        }
        currentTurma = classeCell
      }

      const infoCell = String(row[block.infoCol] || '').trim().toLowerCase()

      // Pular linhas de intervalo (coluna Info ou Aula)
      // Nota: NÃO checar colunas de dia aqui — uma linha de Disciplina pode ter
      // "INTERVALO" em 1 dia e disciplinas válidas nos outros. O RESERVED_RE
      // já cuida de pular células individuais com "INTERVALO" no pushIfValid.
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

        // Extrair número da aula: tentar linha anterior, depois mesma linha
        const aulaRowAbove = data[ri - 1] || []
        let aulaMatch = String(aulaRowAbove[block.aulaCol] || '').match(/(\d+)[ª°º]/i)
        if (!aulaMatch) {
          // Formato onde aula e disciplina estão na mesma linha
          aulaMatch = String(disciplinaRow[block.aulaCol] || '').match(/(\d+)[ª°º]/i)
        }
        const aulaNum = aulaMatch ? parseInt(aulaMatch[1], 10) : 0

        // Extrair horário: prioridade para a PRÓPRIA linha Disciplina (que contém aula+horário+info),
        // porque a linha anterior pode ser INTERVALO ou Local de outra aula.
        // Só usa aulaRowAbove se a linha atual não tiver horário válido.
        const isAboveIntervalo = aulaRowAbove.some(
          (cell: unknown) => /^intervalo$/i.test(String(cell ?? '').trim()),
        )

        let horarioStr = String(disciplinaRow[block.horarioCol] || '').trim()
        if (!horarioStr || /^(Info|HORÁRIO|HORARIO|AULA|Disciplina)$/i.test(horarioStr)) {
          // Tenta linha acima apenas se não for INTERVALO
          if (!isAboveIntervalo) {
            horarioStr = String(aulaRowAbove[block.horarioCol] || '').trim()
          }
        }
        // Último recurso: coluna de aula da linha acima
        if (!horarioStr || /^(Info|AULA|HORÁRIO|HORARIO)$/i.test(horarioStr)) {
          horarioStr = String(aulaRowAbove[block.aulaCol] || '').trim()
        }

        aulaBlocks.push({
          aulaNum, disciplinaRow, professorRow, localRow, horarioStr,
          afterLocalRow: data[ri + 3] || [],
        })
        ri += 3
        continue
      }

      // Padrão legado: "Aula" + dígito (formato usado em Cursos Técnicos)
      const aulaCell = String(row[block.aulaCol] || '').trim()
      if (/^aula\s*\d/i.test(aulaCell) && currentTurma) {
        const time = parseTimeRange(String(row[block.horarioCol] || ''))
        const teacherRow = data[ri + 1] || []
        const roomRow = data[ri + 2] || []

        // Criar aulas para cada dia (T1 e, se existir, T2)
        const afterRoomRow = data[ri + 3] || []
        for (const { day, col1, col2 } of block.dayMapping) {
          pushIfValid(allClasses, row, teacherRow, roomRow, col1, 'T1', currentTurma, day, time, period, afterRoomRow)
          if (col2 >= 0) {
            pushIfValid(allClasses, row, teacherRow, roomRow, col2, 'T2', currentTurma, day, time, period, afterRoomRow)
          }
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
