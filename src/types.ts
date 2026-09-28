export interface Student {
  id: string;
  nisn: string;
  name: string;
  classId: string;
  className: string;
  score: number; // 0 - 100, default base/score
  // Nilai Sikap per Pertemuan (dinamis, bisa ditambah pertemuannya)
  meetingScores?: (number | null)[];
  meetingNotes?: (string | null)[];
  // Nilai Tugas IPA (Tugas 1, Tugas 2, Praktikum...)
  assignmentScores?: (number | null)[];
  assignmentNotes?: (string | null)[];
  // Nilai Ulangan IPA (UH 1, UH 2, PTS, PAS...)
  examScores?: (number | null)[];
  examNotes?: (string | null)[];
  // Topik / Proyek IPA
  projectTitle?: string; // e.g. "Klasifikasi Makhluk Hidup & Ekosistem"
  notes?: string;
  aspects?: {
    creativity: number;
    cooperation: number;
    responsibility: number;
  };
  lastUpdated?: string;
}

export interface IpaGradeConfig {
  attitudeMeetingsCount: number; // Jumlah pertemuan sikap (bisa ditambah: 1, 2, 3...)
  assignmentCount: number;       // Jumlah tugas IPA (default: 5)
  examCount: number;             // Jumlah ulangan IPA (default: 4)
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  homeroomTeacher?: string;
  studentCount?: number;
  averageScore?: number;
}

export interface TeacherCode {
  id: string;
  code: string;
  name: string;
  role: 'teacher' | 'admin';
  assignedClass?: string;
  createdAt: string;
}

export interface MeetingSchedule {
  id: string;
  meetingNumber: number;
  activeDate: string; // YYYY-MM-DD or empty
  topic?: string;     // Topik materi pertemuan IPA
}

export type UserRole = 'student' | 'teacher' | 'admin' | null;

export interface CurrentUser {
  role: UserRole;
  identifier: string; // NISN for student, Code for teacher/admin
  name: string;
  studentData?: Student;
  teacherData?: TeacherCode;
}

export type ActivePage = 'login' | 'dashboard' | 'class-detail' | 'student-view' | 'admin-portal';

export interface SystemLog {
  id: string;
  action: string;
  description: string;
  operator: string;
  timestamp: string;
}
