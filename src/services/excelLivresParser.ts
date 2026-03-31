/**
 * Parser dedicado para planilhas de Cursos Livres/FIC.
 *
 * Formato esperado (sem T1/T2 — uma coluna por dia):
 *   CLASSE | AULA | HORÁRIO | Info | SEGUNDA | TERÇA | QUARTA | QUINTA | SEXTA | SÁBADO
 *
 * Cada aula = 2 linhas:
 *   Info = "Professor" → nomes dos professores em cada dia
 *   Info = "Local"     → sala/lab em cada dia
 *
 * CLASSE (mesclada) = nome do curso (ex.: "FRONTEND", "CCNA V7").
 * Dias sem aula ficam em branco.
 */

import type { ParsedClass } from './excelService'
import {
  parseTimeRange,
  getDayNumberFromText,
  calculateHourlyTimes,
  parseTimeString,
} from './excelParseHelpers'

// ── Tipos internos ────────────────────────────────────────

interface LivresHeaderBlock {
  headerRow: number
  classeCol: number
  aulaCol: number
  horarioCol: number
  infoCol: number
  dayMapping: { day: number; col: number }[]
}

// ── Detecção de blocos de cabeçalho ───────────────────────

function findLivresHeaderBlocks(data: any[][]): LivresHeaderBlock[] {
  const blocks: LivresHeaderBlock[] = []

  for (let ri = 0; ri < data.length; ri++) {
    const row = data[ri]
    if (!row || row.length === 0) continue

    const dayPositions: { day: number; col: number }[] = []
    for (let ci = 0; ci < row.length; ci++) {
      const text = String(row[ci] || '').trim()
      const dayNum = getDayNumberFromText(text)
      if (dayNum !== null && !dayPositions.some(dp => dp.day === dayNum)) {
        dayPositions.push({ day: dayNum, col: ci })
      }
    }

    if (dayPositions.length < 2) continue

    // Verificar que NÃO tem T1/T2 na linha abaixo (senão é formato Superior/PosGrad)
    const nextRow = data[ri + 1] || []
    let hasT1T2 = false
    for (let ci = 0; ci < nextRow.length; ci++) {
      const v = String(nextRow[ci] || '').trim().toUpperCase()
      if (v === 'T1' || v === 'T2') { hasT1T2 = true; break }
    }
    if (hasT1T2) continue

    dayPositions.sort((a, b) => a.col - b.col)

    // Detectar colunas meta (CLASSE, AULA, HORÁRIO, Info) na mesma linha ou adjacentes
    let classeCol = 0, aulaCol = 1, horarioCol = 2, infoCol = 3

    const scanRows = [row]
    if (ri > 0) scanRows.push(data[ri - 1] || [])

    for (const sRow of scanRows) {
      for (let c = 0; c < sRow.length; c++) {
        const cell = String(sRow[c] || '').toLowerCase().trim()
        if (cell === 'classe' || cell === 'turma' || cell === 'curso') classeCol = c
        if (cell === 'aula') aulaCol = c
        if (cell.includes('horário') || cell.includes('horario')) horarioCol = c
        if (cell === 'info' || cell === 'informação' || cell === 'informacao') infoCol = c
      }
    }

    blocks.push({
      headerRow: ri,
      classeCol,
      aulaCol,
      horarioCol,
      infoCol,
      dayMapping: dayPositions,
    })

    console.log(`   [Livres] Bloco L${ri}: ${dayPositions.length} dia(s) (sem T1/T2)`)
  }

  return blocks
}

// ── Extração de horário ───────────────────────────────────

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

const RESERVED_RE = /^(disciplina|professor|local|info|turma|intervalo|hor[áa]rio|aula|classe|curso|data)$/i

/**
 * Verifica se o texto parece ser um nome de curso para Livres/FIC.
 * Mais permissivo que isTurmaName (aceita espaços, ex.: "CCNA V7", "AWS Cloud").
 */
function isLivresCourseName(value: string): boolean {
  if (!value || value.length > 40 || value.length < 2) return false
  if (RESERVED_RE.test(value)) return false
  if (/segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|semestre|manh[ãa]|tarde|noite|trimestre/i.test(value)) return false
  if (/^(1[ºo]|2[ºo])\s/i.test(value)) return false
  if (/^\d+[ªº°]$/i.test(value)) return false
  return /^[\dA-Z][\dA-Za-zÀ-ÿ\s\-\.\/\+\#]+$/i.test(value)
}

// ── Parser principal ──────────────────────────────────────

export function parseLivresSheetData(
  data: any[][],
  sheetName: string,
  period: ParsedClass['period'],
): ParsedClass[] {
  const blocks = findLivresHeaderBlocks(data)
  if (blocks.length === 0) {
    console.log(`   [Livres] Nenhum bloco de cabeçalho em "${sheetName}" — pulando`)
    return []
  }

  const allClasses: ParsedClass[] = []

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi]
    const startRow = block.headerRow + 1
    const endRow = bi + 1 < blocks.length ? blocks[bi + 1].headerRow - 1 : data.length

    let currentCurso: string | null = null
    let ri = startRow

    interface AulaAccum {
      aulaNum: number
      horarioStr: string
      professorRow: any[]
      localRow: any[]
    }
    const aulaAccum: AulaAccum[] = []

    const flushAulas = () => {
      if (!currentCurso || aulaAccum.length === 0) return

      // Calcular distribuição de horários se necessário
      let firstTime: { start: string; end: string } | null = null
      let lastTime: { start: string; end: string } | null = null
      let aulasWithTime = 0

      for (const a of aulaAccum) {
        const t = extractTime(a.horarioStr)
        if (t && t.start !== '00:00') {
          if (!firstTime) firstTime = t
          lastTime = t
          aulasWithTime++
        }
      }

      const shouldDistribute =
        firstTime && lastTime &&
        firstTime.start !== lastTime.start &&
        aulaAccum.length > 1 &&
        aulasWithTime < aulaAccum.length

      const distributedTimes = shouldDistribute
        ? calculateHourlyTimes(firstTime!.start, lastTime!.end, aulaAccum.length)
        : null

      for (let i = 0; i < aulaAccum.length; i++) {
        const a = aulaAccum[i]
        const time = extractTime(a.horarioStr)
          ?? distributedTimes?.[i]
          ?? firstTime
          ?? { start: '00:00', end: '00:00' }

        for (const { day, col } of block.dayMapping) {
          const professor = String(a.professorRow[col] || '').trim()
          const local = String(a.localRow[col] || '').trim()

          if (!professor && !local) continue
          if (RESERVED_RE.test(professor)) continue

          allClasses.push({
            turma: currentCurso!,
            dayOfWeek: day,
            startTime: time.start,
            endTime: time.end,
            group: 'T1',
            courseCode: currentCurso!,
            teacherName: professor,
            labRoom: local,
            period,
          })
        }
      }

      aulaAccum.length = 0
    }

    while (ri < endRow) {
      const row = data[ri]
      if (!row || row.length === 0) { ri++; continue }

      // Detectar nome do curso (coluna CLASSE)
      const classeCell = String(row[block.classeCol] || '').trim()
      if (classeCell && isLivresCourseName(classeCell) && classeCell !== currentCurso) {
        flushAulas()
        currentCurso = classeCell
        console.log(`   [Livres] Curso: ${currentCurso}`)
      }

      const infoCell = String(row[block.infoCol] || '').trim().toLowerCase()

      // Pular linhas de intervalo
      if (/intervalo/i.test(infoCell) || /intervalo/i.test(String(row[block.aulaCol] || ''))) {
        ri++; continue
      }

      // Detectar bloco de 2 linhas: Professor / Local
      if (infoCell === 'professor' && currentCurso) {
        const professorRow = row
        const localRow = data[ri + 1] || []

        // Extrair número da aula
        const aulaCell = String(row[block.aulaCol] || '').trim()
        const aulaMatch = aulaCell.match(/(\d+)/)
        const aulaNum = aulaMatch ? parseInt(aulaMatch[1], 10) : aulaAccum.length + 1

        // Extrair horário
        const horarioStr = String(row[block.horarioCol] || '').trim()

        aulaAccum.push({ aulaNum, horarioStr, professorRow, localRow })
        ri += 2
        continue
      }

      // Fallback: detectar "Disciplina" row (3-row format, for compat)
      if (infoCell === 'disciplina' && currentCurso) {
        const professorRow = data[ri + 1] || []
        const localRow = data[ri + 2] || []

        const aulaCell = String(row[block.aulaCol] || '').trim()
        const aulaMatch = aulaCell.match(/(\d+)/)
        const aulaNum = aulaMatch ? parseInt(aulaMatch[1], 10) : aulaAccum.length + 1

        const horarioStr = String(row[block.horarioCol] || '').trim()

        aulaAccum.push({ aulaNum, horarioStr, professorRow, localRow })
        ri += 3
        continue
      }

      ri++
    }

    flushAulas()
  }

  return allClasses
}
