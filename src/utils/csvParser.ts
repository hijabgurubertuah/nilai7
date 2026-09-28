import { Student, ClassRoom } from '../types';

export interface ParsedCsvResult {
  students: Student[];
  classes: ClassRoom[];
  errors: string[];
  totalRows: number;
}

export function parseStudentCsv(csvText: string): ParsedCsvResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      students: [],
      classes: [],
      errors: ['File CSV kosong atau tidak memiliki baris data setelah header.'],
      totalRows: 0,
    };
  }

  // Detect delimiter: comma or semicolon
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  // Helper to split row respecting quotes
  const splitRow = (rowText: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < rowText.length; i++) {
      const char = rowText[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = splitRow(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9_]/g, '')
  );

  const nisnIdx = headers.findIndex(
    (h) =>
      h.includes('nisn') ||
      h === 'nis' ||
      h.includes('no_induk') ||
      h.includes('nomorinduk') ||
      h.includes('noinduk') ||
      h.includes('kode') ||
      h.includes('id')
  );
  const namaIdx = headers.findIndex(
    (h) =>
      h.includes('nama') ||
      h.includes('siswa') ||
      h.includes('student') ||
      h.includes('name')
  );
  const kelasIdx = headers.findIndex(
    (h) =>
      h.includes('kelas') ||
      h.includes('class') ||
      h.includes('rombel') ||
      h.includes('tingkat') ||
      h.includes('grade')
  );

  // Separate detection for Tugas, Ulangan, and Sikap
  const tugasIdx = headers.findIndex(
    (h) => h.includes('tugas') || h.includes('assignment')
  );
  const ulanganIdx = headers.findIndex(
    (h) => h.includes('ulangan') || h.includes('exam') || h.includes('uh')
  );
  const sikapIdx = headers.findIndex(
    (h) => h.includes('sikap') || h.includes('attitude')
  );
  const generalScoreIdx = headers.findIndex(
    (h) => h.includes('nilai') || h.includes('score')
  );

  const materiIdx = headers.findIndex(
    (h) =>
      h.includes('materi') ||
      h.includes('topik') ||
      h.includes('judul') ||
      h.includes('kreasi') ||
      h.includes('proyek') ||
      h.includes('project')
  );
  const catatanIdx = headers.findIndex(
    (h) => h.includes('catatan') || h.includes('notes') || h.includes('keterangan')
  );

  if (nisnIdx === -1 || namaIdx === -1) {
    return {
      students: [],
      classes: [],
      errors: [
        'Format header CSV harus minimal memiliki kolom "nisn" dan "nama" (dan disarankan "kelas", "nilai_tugas", "nilai_ulangan", "nilai_sikap").',
      ],
      totalRows: lines.length - 1,
    };
  }

  const studentMap = new Map<string, Student>();
  const classMap = new Map<string, ClassRoom>();
  const errors: string[] = [];

  const parseScore = (val: string | undefined, defaultVal: number = 80): number => {
    if (!val) return defaultVal;
    const parsed = parseInt(val.trim(), 10);
    if (isNaN(parsed)) return defaultVal;
    return Math.max(0, Math.min(100, parsed));
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = splitRow(line);

    const nisn = cells[nisnIdx]?.trim() || '';
    const name = cells[namaIdx]?.trim() || '';
    const rawKelas = (kelasIdx !== -1 ? cells[kelasIdx] : '')?.trim() || 'Kelas 7A';

    // Parse sub-scores
    const rawSikap = sikapIdx !== -1 ? cells[sikapIdx] : (generalScoreIdx !== -1 ? cells[generalScoreIdx] : '');
    const rawTugas = tugasIdx !== -1 ? cells[tugasIdx] : (generalScoreIdx !== -1 ? cells[generalScoreIdx] : '');
    const rawUlangan = ulanganIdx !== -1 ? cells[ulanganIdx] : (generalScoreIdx !== -1 ? cells[generalScoreIdx] : '');

    const scoreSikap = parseScore(rawSikap, 80);
    const scoreTugas = parseScore(rawTugas, 80);
    const scoreUlangan = parseScore(rawUlangan, 80);

    const projectTitle = (materiIdx !== -1 ? cells[materiIdx] : '')?.trim() || 'IPA Terpadu SMP';
    const notes = (catatanIdx !== -1 ? cells[catatanIdx] : '')?.trim() || '';

    if (!nisn && !name) continue;

    if (!nisn) {
      errors.push(`Baris ${i + 1}: NISN kosong untuk siswa "${name}"`);
      continue;
    }
    if (!name) {
      errors.push(`Baris ${i + 1}: Nama kosong untuk NISN "${nisn}"`);
      continue;
    }

    // Standardize class name & class ID consistently
    const cleanClassRaw = rawKelas.replace(/^(kelas|class)\s*/i, '').trim();
    const sanitizedClassName = cleanClassRaw
      ? (cleanClassRaw.toLowerCase().startsWith('kelas ') ? cleanClassRaw : `Kelas ${cleanClassRaw.toUpperCase()}`)
      : 'Kelas 7A';
    const cleanClassKey = (cleanClassRaw.toLowerCase().replace(/[^a-z0-9]/g, '')) || '7a';
    const classId = `class-${cleanClassKey}`;

    if (!classMap.has(classId)) {
      const gradeMatch = sanitizedClassName.match(/\d+/);
      const grade = gradeMatch ? gradeMatch[0] : '7';
      classMap.set(classId, {
        id: classId,
        name: sanitizedClassName,
        grade,
      });
    }

    const cleanNisn = nisn.replace(/[^a-zA-Z0-9]/g, '');
    const studentId = `std-${cleanNisn || `row-${i}`}`;
    const nisnKey = cleanNisn.toLowerCase();

    const existingStudent = studentMap.get(nisnKey);
    if (existingStudent) {
      studentMap.set(nisnKey, {
        ...existingStudent,
        name,
        classId,
        className: sanitizedClassName,
        score: rawSikap ? scoreSikap : existingStudent.score,
        meetingScores: [rawSikap ? scoreSikap : (existingStudent.meetingScores?.[0] ?? scoreSikap)],
        assignmentScores: [rawTugas ? scoreTugas : (existingStudent.assignmentScores?.[0] ?? scoreTugas)],
        examScores: [rawUlangan ? scoreUlangan : (existingStudent.examScores?.[0] ?? scoreUlangan)],
        projectTitle: projectTitle || existingStudent.projectTitle,
        notes: notes || existingStudent.notes,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      studentMap.set(nisnKey, {
        id: studentId,
        nisn,
        name,
        classId,
        className: sanitizedClassName,
        score: scoreSikap,
        meetingScores: [scoreSikap],
        assignmentScores: [scoreTugas],
        examScores: [scoreUlangan],
        projectTitle,
        notes,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  return {
    students: Array.from(studentMap.values()),
    classes: Array.from(classMap.values()),
    errors,
    totalRows: lines.length - 1,
  };
}
