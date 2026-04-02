/**
 * Serviço de parsing de planilhas Excel para Cursos Técnicos (Manhã e Tarde).
 *
 * Este arquivo:
 * - Baixa as planilhas (.xlsx — Google Sheets export ou URL via env)
 * - Detecta blocos de cabeçalho T1/T2 nas planilhas
 * - Extrai informações de aulas (turma, horário, professor, sala, matéria)
 * - Lê células com sheetToMatrix (mesclagens resolvidas, compatível com Google)
 * - Usa cache com hash para evitar re-parse quando a planilha não mudou
 */

import * as XLSX from 'xlsx'
import { hashArrayBuffer } from '../utils/hashUtils'
import { parseTimeRange, isTurmaName } from './excelParseHelpers'
import { sheetToMatrix } from './excelSheetMatrix'

// Google Sheets → export .xlsx (Horários Manhã / Tarde — CAI e Cursos Técnicos)
const EXCEL_MANHA_URL_DEFAULT =
  'https://docs.google.com/spreadsheets/d/1fS68_Lc-B2qryadmdY-Fld8vlQN_Zloz/export?format=xlsx&gid=1460763838'

const EXCEL_TARDE_URL_DEFAULT =
  'https://docs.google.com/spreadsheets/d/1jJupddrUKqZtS14xmvdf8O8uXBhEgUmT/export?format=xlsx'

const _manhaOverride = import.meta.env.VITE_EXCEL_TECNICOS_MANHA_URL?.trim() ?? ''
const _tardeOverride = import.meta.env.VITE_EXCEL_TECNICOS_TARDE_URL?.trim() ?? ''

const EXCEL_MANHA_URL =
  _manhaOverride.length > 0 ? _manhaOverride : EXCEL_MANHA_URL_DEFAULT
const EXCEL_TARDE_URL =
  _tardeOverride.length > 0 ? _tardeOverride : EXCEL_TARDE_URL_DEFAULT

// Cache em memória: guarda o hash e o resultado parseado para evitar re-parse desnecessário
let _cache: { hash: string; result: ExcelData } | null = null

// ── Tipos ──────────────────────────────────────────────

export interface ParsedClass {
  turma: string
  dayOfWeek: number // 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta
  startTime: string // Formato "HH:MM"
  endTime: string   // Formato "HH:MM"
  group: 'T1' | 'T2'
  courseCode: string // Sigla da matéria (ex: "PMEC", "SEMB1")
  teacherName: string
  labRoom: string
  period: 'manha' | 'tarde' | 'noite' | 'sabado'
}

export interface ExcelData {
  classes: ParsedClass[]
  announcements: string[]
}

// ── Funções auxiliares ────────────────────────────────────────────

/**
 * Baixa uma planilha (.xlsx) e retorna como ArrayBuffer
 */
async function downloadExcel(url: string, period: string): Promise<ArrayBuffer> {
  console.log(`Baixando planilha (${period})...`)
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  })

  if (!response.ok) {
    throw new Error(`Erro ao baixar planilha (${period}): ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  console.log(`Planilha baixada (${period}): ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`)
  return arrayBuffer
}

// ── Detecção de blocos de cabeçalho (T1/T2) ───────────

interface HeaderBlock {
  subHeaderRow: number // Linha onde está o cabeçalho T1/T2
  turmaCol: number     // Coluna com nome da turma
  aulaCol: number      // Coluna com número da aula
  horarioCol: number   // Coluna com horário
  dayMapping: { day: number; t1Col: number; t2Col: number }[] // Mapeia dias da semana para colunas T1/T2
}

/**
 * Encontra todos os blocos de cabeçalho T1/T2 na planilha
 * Cada bloco representa uma seção de horários de uma ou mais turmas
 */
function findHeaderBlocks(data: any[][]): HeaderBlock[] {
  const blocks: HeaderBlock[] = []

  for (let ri = 0; ri < data.length; ri++) {
    const row = data[ri]
    if (!row || row.length === 0) continue

    // Procurar colunas com T1 e T2
    const t1Cols: number[] = []
    const t2Cols: number[] = []

    for (let ci = 0; ci < row.length; ci++) {
      const v = String(row[ci] || '').trim().toUpperCase()
      if (v === 'T1') t1Cols.push(ci)
      if (v === 'T2') t2Cols.push(ci)
    }

    // Precisa ter pelo menos 5 pares T1/T2 (Segunda a Sexta)
    if (t1Cols.length >= 5 && t2Cols.length >= 5) {
      // Detectar colunas de Turma, Aula e Horário na linha acima
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

      // Mapear cada par T1/T2 para um dia da semana (1=Segunda, 2=Terça, etc)
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

/**
 * Parseia uma planilha Excel (Manhã ou Tarde) e extrai todas as aulas
 */
function parseSingleExcelData(arrayBuffer: ArrayBuffer, periodLabel: string): ExcelData {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })

  // Determinar período: "MANHÃ" → "manha", "TARDE" → "tarde"
  const period: 'manha' | 'tarde' = periodLabel.toUpperCase().includes('MANH') ? 'manha' : 'tarde'

  console.log(`Abas disponíveis (${periodLabel}):`, workbook.SheetNames)

  const allClasses: ParsedClass[] = []
  const announcements: string[] = []

  // Processar cada aba da planilha
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName]
    const data = sheetToMatrix(ws)

    console.log(`\nAba "${sheetName}" (${period}) — ${data.length} linhas`)

    // Encontrar blocos de cabeçalho T1/T2
    const blocks = findHeaderBlocks(data)
    if (blocks.length === 0) {
      console.log('   Nenhum cabeçalho T1/T2 encontrado — pulando aba')
      continue
    }

    console.log(`   ${blocks.length} bloco(s) de turma`)

    // Processar cada bloco de turma
    for (let bi = 0; bi < blocks.length; bi++) {
      const block = blocks[bi]
      const startRow = block.subHeaderRow + 1
      // Parar 3 linhas antes do próximo bloco (título + cabeçalho + T1/T2)
      const endRow = bi + 1 < blocks.length ? blocks[bi + 1].subHeaderRow - 3 : data.length

      let currentTurma: string | null = null
      let ri = startRow

      // Processar linhas do bloco
      while (ri < endRow) {
        const row = data[ri]
        if (!row || row.length === 0) { ri++; continue }

        // Detectar nome da turma
        const turmaCell = String(row[block.turmaCol] || '').trim()
        if (turmaCell && isTurmaName(turmaCell)) {
          currentTurma = turmaCell
          console.log(`   Turma: ${currentTurma}`)
        }

        // Ler coluna "Aula"
        const aulaCell = String(row[block.aulaCol] || '').trim()

        // Pular linhas de intervalo
        if (aulaCell.toLowerCase().includes('intervalo')) { ri++; continue }

        // Processar aula: formato é 3 linhas (curso, professor, sala)
        // Procura por "Aula" + dígito para não confundir com header
        if (/^aula\s*\d/i.test(aulaCell) && currentTurma) {
          const horarioStr = String(row[block.horarioCol] || '').trim()
          const time = parseTimeRange(horarioStr)

          // Linhas seguintes: professor e sala
          const teacherRow = data[ri + 1] || []
          const roomRow = data[ri + 2] || []

          // Processar cada dia da semana (T1 e T2)
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

          ri += 3 // Pular as 3 linhas (curso + professor + sala)
          continue
        }

        ri++
      }
    }
  }

  return { classes: allClasses, announcements }
}

// ── Função principal exportada ─────────────────────────────

/**
 * Função principal: baixa e parseia as planilhas de Manhã e Tarde
 * Usa cache com hash para evitar re-parse quando as planilhas não mudaram
 */
export async function parseExcelFile(): Promise<ExcelData> {
  // 1. Baixar ambas as planilhas em paralelo
  const [manhaBuf, tardeBuf] = await Promise.all([
    downloadExcel(EXCEL_MANHA_URL, 'MANHÃ'),
    downloadExcel(EXCEL_TARDE_URL, 'TARDE'),
  ])

  // 2. Calcular hash de cada planilha
  const [manhaHash, tardeHash] = await Promise.all([
    hashArrayBuffer(manhaBuf),
    hashArrayBuffer(tardeBuf),
  ])
  const combinedHash = manhaHash + tardeHash

  // 3. Se nada mudou, retornar cache (evita re-parse completo)
  if (_cache && _cache.hash === combinedHash) {
    console.log('[Técnicos] Planilhas não mudaram — usando cache')
    return _cache.result
  }

  console.log('[Técnicos] Planilha(s) mudou(aram) — re-parseando...\n')

  // 4. Parsear ambas as planilhas
  const [manhaData, tardeData] = [
    parseSingleExcelData(manhaBuf, 'MANHÃ'),
    parseSingleExcelData(tardeBuf, 'TARDE'),
  ]

  // 5. Combinar os dados de manhã e tarde
  const allClasses = [...manhaData.classes, ...tardeData.classes]
  const allAnnouncements = [...manhaData.announcements, ...tardeData.announcements]

  // Estatísticas para log
  const turmas = [...new Set(allClasses.map((c) => c.turma))]
  const profs = [...new Set(allClasses.map((c) => c.teacherName).filter(Boolean))]
  const salas = [...new Set(allClasses.map((c) => c.labRoom).filter(Boolean))]

  console.log(`\nParse concluído (MANHÃ + TARDE):`)
  console.log(`   Aulas: ${allClasses.length} (${manhaData.classes.length} manhã + ${tardeData.classes.length} tarde)`)
  console.log(`   Turmas (${turmas.length}): ${turmas.join(', ')}`)
  console.log(`   Professores (${profs.length}): ${profs.join(', ')}`)
  console.log(`   Salas (${salas.length}): ${salas.join(', ')}`)

  const result: ExcelData = { classes: allClasses, announcements: allAnnouncements }

  // 6. Atualizar cache com novo hash e resultado
  _cache = { hash: combinedHash, result }

  return result
}
