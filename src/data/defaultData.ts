import { ClassRoom, Student, TeacherCode, IpaGradeConfig } from '../types';

export const DEFAULT_IPA_CONFIG: IpaGradeConfig = {
  attitudeMeetingsCount: 8, // Pertemuan 1 s.d. 8 (dapat ditambah fleksibel)
  assignmentCount: 5,       // Tugas 1 s.d. 5
  examCount: 4,             // UH 1, UH 2, PTS, PAS
};

export const DEFAULT_CLASSES: ClassRoom[] = [
  {
    id: 'class-7a',
    name: 'Kelas 7A',
    grade: '7',
    homeroomTeacher: 'Budi Santoso, S.Pd.',
  },
  {
    id: 'class-7b',
    name: 'Kelas 7B',
    grade: '7',
    homeroomTeacher: 'Siti Aminah, M.Pd.',
  },
  {
    id: 'class-7c',
    name: 'Kelas 7C',
    grade: '7',
    homeroomTeacher: 'Drs. Ahmad Fauzi',
  },
];

// Empty list - no dummy students initially
export const DEFAULT_STUDENTS: Student[] = [];

export const DEFAULT_TEACHER_CODES: TeacherCode[] = [
  {
    id: 'tc-admin123',
    code: 'ADMIN123',
    name: 'Administrator & Koordinator IPA',
    role: 'admin',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'tc-guru123',
    code: 'GURU123',
    name: 'Guru Mata Pelajaran IPA',
    role: 'teacher',
    createdAt: '2026-09-01T08:00:00Z',
  },
];
