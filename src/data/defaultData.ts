import { ClassRoom, Student, TeacherCode, IpaGradeConfig } from '../types';

export const DEFAULT_IPA_CONFIG: IpaGradeConfig = {
  attitudeMeetingsCount: 8, // Pertemuan 1 s.d. 8 (dapat ditambah fleksibel)
  assignmentCount: 5,       // Tugas 1 s.d. 5
  examCount: 4,             // UH 1, UH 2, PTS, PAS
};

export const DEFAULT_CLASSES: ClassRoom[] = [
  {
    id: 'class-7a-ipa',
    name: '7A IPA',
    grade: '7',
    subject: 'IPA',
    homeroomTeacher: 'Guru Mapel IPA',
  },
  {
    id: 'class-7b-ipa',
    name: '7B IPA',
    grade: '7',
    subject: 'IPA',
    homeroomTeacher: 'Guru Mapel IPA',
  },
  {
    id: 'class-7c-ipa',
    name: '7C IPA',
    grade: '7',
    subject: 'IPA',
    homeroomTeacher: 'Guru Mapel IPA',
  },
  {
    id: 'class-7d-ipa',
    name: '7D IPA',
    grade: '7',
    subject: 'IPA',
    homeroomTeacher: 'Guru Mapel IPA',
  },
  {
    id: 'class-7d-tik',
    name: '7D TIK',
    grade: '7',
    subject: 'TIK',
    homeroomTeacher: 'Guru Mapel TIK',
  },
  {
    id: 'class-7e-tik',
    name: '7E TIK',
    grade: '7',
    subject: 'TIK',
    homeroomTeacher: 'Guru Mapel TIK',
  },
];

// Empty list - no dummy students initially
export const DEFAULT_STUDENTS: Student[] = [];

export const DEFAULT_TEACHER_CODES: TeacherCode[] = [
  {
    id: 'tc-admin123',
    code: 'ADMIN123',
    name: 'Administrator & Koordinator IPA & TIK',
    role: 'admin',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'tc-guru123',
    code: 'GURU123',
    name: 'Guru Mata Pelajaran IPA & TIK',
    role: 'teacher',
    createdAt: '2026-09-01T08:00:00Z',
  },
];
