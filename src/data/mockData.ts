import type { Course, Teacher, Room, Class, CompleteClass } from '../types'

export const courses: Course[] = [
  {
    id: '1',
    name: 'Desenvolvimento de Sistemas',
    color: '#3B82F6',
    icon: 'Code',
    description: 'Curso técnico em Desenvolvimento de Sistemas',
  },
  {
    id: '2',
    name: 'Eletrônica',
    color: '#10B981',
    icon: 'Zap',
    description: 'Curso técnico em Eletrônica',
  },
  {
    id: '3',
    name: 'Mecânica',
    color: '#F59E0B',
    icon: 'Cog',
    description: 'Curso técnico em Mecânica',
  },
  {
    id: '4',
    name: 'Automação Industrial',
    color: '#8B5CF6',
    icon: 'Settings',
    description: 'Curso técnico em Automação Industrial',
  },
]

export const teachers: Teacher[] = [
  {
    id: '1',
    name: 'Prof. João Silva',
    email: 'joao.silva@senai.br',
  },
  {
    id: '2',
    name: 'Prof. Maria Santos',
    email: 'maria.santos@senai.br',
  },
  {
    id: '3',
    name: 'Prof. Carlos Oliveira',
    email: 'carlos.oliveira@senai.br',
  },
  {
    id: '4',
    name: 'Prof. Ana Costa',
    email: 'ana.costa@senai.br',
  },
]

export const rooms: Room[] = [
  { id: '1', name: 'Sala 101', type: 'classroom', capacity: 30 },
  { id: '2', name: 'Sala 102', type: 'classroom', capacity: 30 },
  { id: '3', name: 'Lab. Informática 1', type: 'laboratory', capacity: 20 },
  { id: '4', name: 'Lab. Informática 2', type: 'laboratory', capacity: 20 },
  { id: '5', name: 'Oficina Mecânica', type: 'workshop', capacity: 15 },
  { id: '6', name: 'Sala 201', type: 'classroom', capacity: 40 },
]

export const classes: Class[] = [
  {
    id: '1',
    courseId: '1',
    teacherId: '1',
    roomId: '3',
    title: 'Programação Web',
    description: 'Introduction to HTML, CSS and JavaScript',
    dayOfWeek: 1, // Monday
    startTime: '08:00',
    endTime: '10:00',
    period: '2026.1',
    status: 'finished',
  },
  {
    id: '2',
    courseId: '1',
    teacherId: '1',
    roomId: '3',
    title: 'Banco de Dados',
    description: 'SQL and data modeling',
    dayOfWeek: 1, // Monday
    startTime: '10:15',
    endTime: '12:15',
    period: '2026.1',
    status: 'finished',
  },
  {
    id: '3',
    courseId: '1',
    teacherId: '2',
    roomId: '4',
    title: 'Desenvolvimento Mobile',
    description: 'React Native and mobile development',
    dayOfWeek: 2, // Tuesday
    startTime: '08:00',
    endTime: '11:00',
    period: '2026.1',
    status: 'finished',
  },
  {
    id: '4',
    courseId: '1',
    teacherId: '1',
    roomId: '3',
    title: 'Projeto Integrador',
    description: 'Final project development',
    dayOfWeek: 2, // Tuesday
    startTime: '14:00',
    endTime: '17:00',
    period: '2026.1',
    status: 'finished',
  },
  {
    id: '5',
    courseId: '2',
    teacherId: '3',
    roomId: '5',
    title: 'Circuitos Eletrônicos',
    description: 'Basic circuit analysis',
    dayOfWeek: 3, // Wednesday
    startTime: '14:00',
    endTime: '17:00',
    period: '2026.1',
    status: 'finished',
  },
  {
    id: '6',
    courseId: '3',
    teacherId: '4',
    roomId: '5',
    title: 'Mecânica Aplicada',
    description: 'Mechanics principles',
    dayOfWeek: 4, // Thursday
    startTime: '08:00',
    endTime: '12:00',
    period: '2026.1',
    status: 'finished',
  },
  {
    id: '7',
    courseId: '4',
    teacherId: '3',
    roomId: '6',
    title: 'Automação Industrial',
    description: 'PLC and automated systems',
    dayOfWeek: 5, // Friday
    startTime: '13:00',
    endTime: '17:00',
    period: '2026.1',
    status: 'in_progress',
  },
]

export function getCompleteClasses(classesList: Class[]): CompleteClass[] {
  return classesList.map((classItem) => ({
    ...classItem,
    course: courses.find((c) => c.id === classItem.courseId)!,
    teacher: teachers.find((t) => t.id === classItem.teacherId)!,
    room: rooms.find((r) => r.id === classItem.roomId)!,
  }))
}
