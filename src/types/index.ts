export interface Course {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Room {
  id: string;
  name: string;
  type: "classroom" | "laboratory" | "workshop";
  capacity?: number;
}

export type ClassStatus = "scheduled" | "in_progress" | "finished" | "cancelled";

export interface Class {
  id: string;
  courseId: string;
  teacherId: string;
  roomId: string;
  title: string;
  description?: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = sunday, 1 = monday, etc.
  startTime: string; // format "HH:MM"
  endTime: string; // format "HH:MM"
  date?: string; // format "YYYY-MM-DD" for specific classes
  period?: string; // example: "2026.1" .1 is the first period of the year 2026
  status?: ClassStatus;
}

export interface CompleteClass extends Class {
  course: Course;
  teacher: Teacher;
  room: Room;
}

export type CalendarView = "weekly" | "monthly" | "grid";

export interface Filters {
  courseId?: string;
  teacherId?: string;
  period?: string;
  search?: string;
}




