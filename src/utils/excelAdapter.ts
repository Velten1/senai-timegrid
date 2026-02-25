import type { Course, Teacher, Room, Class, CompleteClass, ClassStatus } from '../types'
import type { ExcelData } from '../services/excelService'

// ── Paletas de cores e ícones para turmas ──────────────

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

// ── Adaptador principal ────────────────────────────────
//
// HIERARQUIA:
//   Grid (cards)  →  TURMAS   (2MB T1, 4DEVM-A T1, …)
//   Slots (aulas) →  MATÉRIAS (PMEC, SEMB1, ITCOI, …)
//
// Aluno encontra SUA turma no grid e vê as matérias dentro.

export function adaptExcelData(excelData: ExcelData): {
  courses: Course[]
  teachers: Teacher[]
  rooms: Room[]
  classes: Class[]
  completeClasses: CompleteClass[]
  announcements: string[]
} {
  const parsed = excelData.classes

  // ── "Courses" = Turma + Grupo + Período (aparecem como cards no grid) ──
  // Se a mesma turma tiver aulas de manhã E tarde, cria duas turmas separadas
  const turmaMap = new Map<string, Course>()
  let ci = 0
  for (const pc of parsed) {
    // Chave única: turma-grupo-período (ex: "2MB-T1-manha", "2MB-T1-tarde")
    const key = `${pc.turma}-${pc.group}-${pc.period}`
    if (!turmaMap.has(key)) {
      turmaMap.set(key, {
        id: key,
        name: `${pc.turma} ${pc.group}`,
        color: colorPalette[ci % colorPalette.length],
        icon: iconOptions[ci % iconOptions.length],
        modality: 'tecnico',
      })
      ci++
    }
  }
  const courses = Array.from(turmaMap.values())

  // ── Professores únicos (por nome) ──
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

  // ── Salas únicas (por nome) ──
  const roomMap = new Map<string, Room>()
  let ri = 0
  for (const pc of parsed) {
    if (pc.labRoom && !roomMap.has(pc.labRoom)) {
      const t = pc.labRoom.toLowerCase().includes('lab') ? 'laboratory' as const : 'classroom' as const
      roomMap.set(pc.labRoom, { id: `room-${ri}`, name: pc.labRoom, type: t })
      ri++
    }
  }
  const rooms = Array.from(roomMap.values())

  // ── Aulas (matéria/sigla aparece DENTRO do slot) ──
  const classes: Class[] = parsed.map((pc, idx) => {
    const teacher = teacherMap.get(pc.teacherName)
    const room = roomMap.get(pc.labRoom)

    return {
      id: `excel-${idx}-${pc.period}`,
      courseId: `${pc.turma}-${pc.group}-${pc.period}`,  // liga à turma+grupo+período
      teacherId: teacher?.id || '',
      roomId: room?.id || '',
      title: pc.courseCode,                          // sigla da matéria no slot
      description: `Prof. ${pc.teacherName || 'N/A'} | ${pc.labRoom || 'N/A'}`,
      dayOfWeek: pc.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      startTime: pc.startTime,
      endTime: pc.endTime,
      period: '2026.1',
      status: 'scheduled' as ClassStatus,
    }
  })

  // ── CompleteClass (Class + referências embutidas) ──
  const completeClasses: CompleteClass[] = classes.map((c) => {
    const course = turmaMap.get(c.courseId) || {
      id: c.courseId, name: c.courseId, color: '#666', icon: 'Code', modality: 'tecnico' as const,
    }
    const teacher = teachers.find((t) => t.id === c.teacherId) || { id: '', name: 'N/A' }
    const room = rooms.find((r) => r.id === c.roomId) || { id: '', name: 'N/A', type: 'classroom' as const }

    return { ...c, course, teacher, room }
  })

  return { courses, teachers, rooms, classes, completeClasses, announcements: excelData.announcements }
}
