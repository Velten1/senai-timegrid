import * as XLSX from 'xlsx'

// URLs das planilhas
const EXCEL_MANHA_URL =
  'https://fiapcom-my.sharepoint.com/personal/rm572913_fiap_com_br/_layouts/15/download.aspx?share=IQAGYx9pSpz3QaP_8kCZ70VoATRNCdNttGnAZ0KTp2fYjuk'

const EXCEL_TARDE_URL =
  'https://fiapcom-my.sharepoint.com/personal/rm572913_fiap_com_br/_layouts/15/download.aspx?share=IQBm3Xp-sKjfTYEiwiGLcx8KARrghayT1ba_suBXXAhfF9M'

// ── Tipos ──────────────────────────────────────────────

export interface ParsedClass {
  turma: string
  dayOfWeek: number // 1=Segunda … 5=Sexta
  startTime: string // "HH:MM"
  endTime: string   // "HH:MM"
  group: 'T1' | 'T2'
  courseCode: string
  teacherName: string
  labRoom: string
  period: 'manha' | 'tarde' | 'noite' | 'sabado' // Período do dia
}

export interface ExcelData {
  classes: ParsedClass[]
  announcements: string[]
}

// ── Helpers ────────────────────────────────────────────

async function downloadExcel(url: string, period: string): Promise<ArrayBuffer> {
  console.log(`Baixando Excel do SharePoint (${period})...`)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Erro ao baixar Excel (${period}): ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  console.log(`Excel baixado (${period}): ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`)
  return arrayBuffer
}

/**
 * "8h45" → "08:45"  |  "10h15" → "10:15"  |  "8h" → "08:00"
 */
function parseTimeString(raw: string): string {
  const m = raw.trim().match(/(\d{1,2})h(\d{0,2})/)
  if (!m) return '00:00'
  const hour = m[1].padStart(2, '0')
  const min = (m[2] || '00').padStart(2, '0')
  return `${hour}:${min}`
}

/**
 * "8h - 8h45" → { start: "08:00", end: "08:45" }
 */
function parseTimeRange(horario: string): { start: string; end: string } {
  const parts = horario.split(/\s*[-–]\s*/)
  if (parts.length === 2) {
    return { start: parseTimeString(parts[0]), end: parseTimeString(parts[1]) }
  }
  return { start: '00:00', end: '00:00' }
}

/**
 * Verifica se um valor parece nome de turma (ex: "2MB", "3MB", "4DEVM-A")
 */
function isTurmaName(value: string): boolean {
  if (!value || value.length > 20 || value.length < 2) return false
  const low = value.toLowerCase()
  const reserved = [
    'turma', 'aula', 'horário', 'horario', 'intervalo',
    't1', 't2', 'cai', 'cursos',
  ]
  if (reserved.some((r) => low === r)) return false
  if (/segunda|ter[çc]a|quarta|quinta|sexta|semestre|manh[ãa]|tarde|noite/i.test(value)) return false
  // Turma: começa com dígito ou letra, alfanumérico + hífens/pontos
  return /^[\dA-Z][\dA-Za-z\-\.]*$/i.test(value)
}

// ── Detecção de blocos de cabeçalho (T1/T2) ───────────

interface HeaderBlock {
  subHeaderRow: number // índice da linha T1/T2
  turmaCol: number
  aulaCol: number
  horarioCol: number
  dayMapping: { day: number; t1Col: number; t2Col: number }[]
}

function findHeaderBlocks(data: any[][]): HeaderBlock[] {
  const blocks: HeaderBlock[] = []

  for (let ri = 0; ri < data.length; ri++) {
    const row = data[ri]
    if (!row || row.length === 0) continue

    const t1Cols: number[] = []
    const t2Cols: number[] = []

    for (let ci = 0; ci < row.length; ci++) {
      const v = String(row[ci] || '').trim().toUpperCase()
      if (v === 'T1') t1Cols.push(ci)
      if (v === 'T2') t2Cols.push(ci)
    }

    // Precisamos de pelo menos 5 pares T1/T2 (Seg–Sex)
    if (t1Cols.length >= 5 && t2Cols.length >= 5) {
      // Detectar colunas de Turma / Aula / Horário na linha acima
      let turmaCol = 0
      let aulaCol = 1
      let horarioCol = 2

      if (ri > 0) {
        const headerRow = data[ri - 1] || []
        for (let c = 0; c < headerRow.length; c++) {
          const cell = String(headerRow[c] || '').toLowerCase().trim()
          if (cell === 'turma') turmaCol = c
          if (cell === 'aula') aulaCol = c
          if (cell.includes('horário') || cell.includes('horario')) horarioCol = c
        }
      }

      // Mapear T1/T2 → dias da semana (1=Seg … 5=Sex)
      const dayMapping: HeaderBlock['dayMapping'] = []
      for (let i = 0; i < Math.min(t1Cols.length, t2Cols.length, 5); i++) {
        dayMapping.push({ day: i + 1, t1Col: t1Cols[i], t2Col: t2Cols[i] })
      }

      blocks.push({ subHeaderRow: ri, turmaCol, aulaCol, horarioCol, dayMapping })
    }
  }

  return blocks
}

// ── Parser de uma planilha específica ───────────────────

async function parseSingleExcelFile(url: string, periodLabel: string): Promise<ExcelData> {
  const arrayBuffer = await downloadExcel(url, periodLabel)
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })

  // Converter "MANHÃ" → "manha", "TARDE" → "tarde"
  const period: 'manha' | 'tarde' = periodLabel.toUpperCase().includes('MANH') ? 'manha' : 'tarde'

  console.log(`Abas disponíveis (${periodLabel}):`, workbook.SheetNames)

  const allClasses: ParsedClass[] = []
  const announcements: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName]
    const data: any[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: '',
      raw: false,
    })

    console.log(`\nAba "${sheetName}" (${period}) — ${data.length} linhas`)

    const blocks = findHeaderBlocks(data)
    if (blocks.length === 0) {
      console.log('   Nenhum cabeçalho T1/T2 encontrado — pulando aba')
      continue
    }

    console.log(`   ${blocks.length} bloco(s) de turma`)

    for (let bi = 0; bi < blocks.length; bi++) {
      const block = blocks[bi]
      const startRow = block.subHeaderRow + 1
      // Parar 3 linhas antes do próximo bloco (título + cabeçalho + T1/T2)
      const endRow = bi + 1 < blocks.length ? blocks[bi + 1].subHeaderRow - 3 : data.length

      let currentTurma: string | null = null
      let ri = startRow

      while (ri < endRow) {
        const row = data[ri]
        if (!row || row.length === 0) { ri++; continue }

        // ── Detectar turma ──
        const turmaCell = String(row[block.turmaCol] || '').trim()
        if (turmaCell && isTurmaName(turmaCell)) {
          currentTurma = turmaCell
          console.log(`   Turma: ${currentTurma}`)
        }

        // ── Ler coluna "Aula" ──
        const aulaCell = String(row[block.aulaCol] || '').trim()

        // Pular INTERVALO
        if (aulaCell.toLowerCase().includes('intervalo')) { ri++; continue }

        // ── Processar aula (3 linhas: curso, professor, sala) ──
        // Exigimos "Aula" + dígito para não confundir com o header de coluna "Aula"
        if (/^aula\s*\d/i.test(aulaCell) && currentTurma) {
          const horarioStr = String(row[block.horarioCol] || '').trim()
          const time = parseTimeRange(horarioStr)

          const teacherRow = data[ri + 1] || []
          const roomRow = data[ri + 2] || []

          for (const { day, t1Col, t2Col } of block.dayMapping) {
            // T1
            const t1Code = String(row[t1Col] || '').trim()
            const t1Teacher = String(teacherRow[t1Col] || '').trim()
            const t1Room = String(roomRow[t1Col] || '').trim()
            if (t1Code) {
              allClasses.push({
                turma: currentTurma,
                dayOfWeek: day,
                startTime: time.start,
                endTime: time.end,
                group: 'T1',
                courseCode: t1Code,
                teacherName: t1Teacher,
                labRoom: t1Room,
                period,
              })
            }

            // T2
            const t2Code = String(row[t2Col] || '').trim()
            const t2Teacher = String(teacherRow[t2Col] || '').trim()
            const t2Room = String(roomRow[t2Col] || '').trim()
            if (t2Code) {
              allClasses.push({
                turma: currentTurma,
                dayOfWeek: day,
                startTime: time.start,
                endTime: time.end,
                group: 'T2',
                courseCode: t2Code,
                teacherName: t2Teacher,
                labRoom: t2Room,
                period,
              })
            }
          }

          ri += 3 // pular as 3 linhas (curso + professor + sala)
          continue
        }

        ri++
      }
    }
  }

  return { classes: allClasses, announcements }
}

// ── Parser principal (combina Manhã + Tarde) ─────────────

export async function parseExcelFile(): Promise<ExcelData> {
  console.log('Iniciando parse de MANHÃ + TARDE...\n')

  // Baixar e parsear ambas as planilhas em paralelo
  const [manhaData, tardeData] = await Promise.all([
    parseSingleExcelFile(EXCEL_MANHA_URL, 'MANHÃ'),
    parseSingleExcelFile(EXCEL_TARDE_URL, 'TARDE'),
  ])

  // Combinar os dados
  const allClasses = [...manhaData.classes, ...tardeData.classes]
  const allAnnouncements = [...manhaData.announcements, ...tardeData.announcements]

  const turmas = [...new Set(allClasses.map((c) => c.turma))]
  const profs = [...new Set(allClasses.map((c) => c.teacherName).filter(Boolean))]
  const salas = [...new Set(allClasses.map((c) => c.labRoom).filter(Boolean))]

  console.log(`\nParse concluído (MANHÃ + TARDE):`)
  console.log(`   Aulas: ${allClasses.length} (${manhaData.classes.length} manhã + ${tardeData.classes.length} tarde)`)
  console.log(`   Turmas (${turmas.length}): ${turmas.join(', ')}`)
  console.log(`   Professores (${profs.length}): ${profs.join(', ')}`)
  console.log(`   Salas (${salas.length}): ${salas.join(', ')}`)

  return {
    classes: allClasses,
    announcements: allAnnouncements,
  }
}
