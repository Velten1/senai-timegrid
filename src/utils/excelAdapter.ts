/**
 * Adaptador que converte dados parseados do Excel para o formato usado pela aplicação.
 * 
 * Este arquivo:
 * - Transforma ParsedClass em Class, Course, Teacher, Room
 * - Cria CompleteClass (Class com referências completas)
 * - Aplica cores e ícones às turmas
 * - Usa o mapeamento de siglas para preencher nomes completos das disciplinas
 */

import type { Course, Teacher, Room, Class, CompleteClass, ClassStatus } from '../types'
import type { ExcelData } from '../services/excelServiceTecnicos'

// Paletas de cores e ícones para turmas (distribuídas automaticamente)
const colorPalette = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6',
  '#E11D48', '#0EA5E9', '#A855F7', '#22C55E', '#EAB308',
  '#D946EF', '#2DD4BF', '#FB923C', '#818CF8', '#34D399',
]

const iconOptions = [
  'Code', 'Zap', 'Cog', 'Settings', 'Cpu', 'Database',
  'Monitor', 'Wrench', 'Book', 'Briefcase', 'FileText',
  'Layers', 'Shield', 'Globe', 'Terminal',
]

/**
 * Função principal: adapta dados do Excel para o formato da aplicação
 * 
 * Hierarquia:
 * - Courses (cards no grid) = Turmas (ex: "2MB T1", "4DEVM-A T1")
 * - Classes (slots de aula) = Matérias (ex: "PMEC", "SEMB1", "ITCOI")
 * 
 * @param excelData Dados parseados do Excel
 * @param modality Modalidade do curso (tecnico, livre, superior, pos-graduacao)
 * @param courseNameMap Mapeamento opcional de sigla → nome completo (para superior/pos-grad)
 */
export function adaptExcelData(
  excelData: ExcelData,
  modality: Course['modality'] = 'tecnico',
  courseNameMap?: Record<string, string>
): {
  courses: Course[]
  teachers: Teacher[]
  rooms: Room[]
  classes: Class[]
  completeClasses: CompleteClass[]
  announcements: string[]
} {
  const parsed = excelData.classes

  // Criar Courses (turmas): cada combinação turma+grupo+período vira um Course
  // Se a mesma turma tiver aulas de manhã E tarde, cria duas turmas separadas
  const turmaMap = new Map<string, Course>()
  let ci = 0
  for (const pc of parsed) {
    // Chave única: turma-grupo-período (ex: "2MB-T1-manha", "2MB-T1-tarde")
    const key = `${pc.turma}-${pc.group}-${pc.period}`
    if (!turmaMap.has(key)) {
      // Nome de exibição varia por modalidade
      let displayName: string
      if (modality === 'livre') {
        displayName = pc.turma // Cursos livres: apenas nome do curso
      } else if (modality === 'pos-graduacao') {
        const trimLabel = pc.group === 'T1' ? '1º Trim' : '2º Trim'
        displayName = `${pc.turma} ${trimLabel}` // Pós-grad: turma + trimestre
      } else {
        displayName = `${pc.turma} ${pc.group}` // Demais: turma + grupo (T1/T2)
      }
      turmaMap.set(key, {
        id: key,
        name: displayName,
        color: colorPalette[ci % colorPalette.length],
        icon: iconOptions[ci % iconOptions.length],
        modality,
      })
      ci++
    }
  }
  const courses = Array.from(turmaMap.values())

  // Criar Teachers (professores únicos, por nome)
  const teacherMap = new Map<string, Teacher>()
  let ti = 0
  for (const pc of parsed) {
    if (pc.teacherName && !teacherMap.has(pc.teacherName)) {
      teacherMap.set(pc.teacherName, {
        id: `teacher-${ti}`,
        name: pc.teacherName,
      })
      ti++
    }
  }
  const teachers = Array.from(teacherMap.values())

  // Criar Rooms (salas únicas, por nome)
  const roomMap = new Map<string, Room>()
  let ri = 0
  for (const pc of parsed) {
    if (pc.labRoom && !roomMap.has(pc.labRoom)) {
      // Determinar tipo: se contém "lab" é laboratório, senão é sala de aula
      const t = pc.labRoom.toLowerCase().includes('lab') ? 'laboratory' as const : 'classroom' as const
      roomMap.set(pc.labRoom, { id: `room-${ri}`, name: pc.labRoom, type: t })
      ri++
    }
  }
  const rooms = Array.from(roomMap.values())

  // Criar Classes (aulas): cada ParsedClass vira uma Class
  const classes: Class[] = parsed.map((pc, idx) => {
    const teacher = teacherMap.get(pc.teacherName)
    const room = roomMap.get(pc.labRoom)

    // Converter dayOfWeek: Excel usa 1-5 (Seg-Sex), JS usa 0-6 (Dom-Sab)
    // Como Excel só tem Seg-Sex, mapeamos diretamente: Excel 1 → JS 1
    const jsDayOfWeek = pc.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6

    // Buscar nome completo da disciplina no mapeamento (se disponível)
    const fullName = courseNameMap?.[pc.courseCode.toUpperCase()]

    return {
      id: `excel-${idx}-${pc.period}`,
      courseId: `${pc.turma}-${pc.group}-${pc.period}`, // Liga à turma+grupo+período
      teacherId: teacher?.id || '',
      roomId: room?.id || '',
      title: pc.courseCode, // Sigla da matéria (ex: "LOGPRO")
      fullName, // Nome completo (se disponível, ex: "Lógica de Programação...")
      description: `Prof. ${pc.teacherName || 'N/A'} | ${pc.labRoom || 'N/A'}`,
      dayOfWeek: jsDayOfWeek,
      startTime: pc.startTime,
      endTime: pc.endTime,
      period: '2026.1',
      status: 'scheduled' as ClassStatus,
    }
  })

  // Criar CompleteClass: Class com referências completas (course, teacher, room)
  const completeClasses: CompleteClass[] = classes.map((c) => {
    const course = turmaMap.get(c.courseId) || {
      id: c.courseId, name: c.courseId, color: '#666', icon: 'Code', modality,
    }
    const teacher = teachers.find((t) => t.id === c.teacherId) || { id: '', name: 'N/A' }
    const room = rooms.find((r) => r.id === c.roomId) || { id: '', name: 'N/A', type: 'classroom' as const }

    return { ...c, course, teacher, room }
  })

  return { courses, teachers, rooms, classes, completeClasses, announcements: excelData.announcements }
}
