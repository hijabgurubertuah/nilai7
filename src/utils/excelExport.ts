import * as XLSX from 'xlsx';
import { ClassRoom, Student } from '../types';
import { calculateStudentGrades, getIpaPredicate } from './gradeCalculations';

export function getPredicate(score: number): { text: string; code: string; color: string } {
  const p = getIpaPredicate(score);
  return {
    text: p.text,
    code: p.code,
    color: p.color,
  };
}

/**
 * Export single class to Excel (.xlsx) with Nilai Tugas, Nilai Ulangan, Nilai Sikap, & Nilai Akhir IPA
 */
export function exportClassToExcel(
  classroom: ClassRoom,
  students: Student[]
) {
  const classStudents = students.filter((s) => s.classId === classroom.id);

  const rows = classStudents.map((s, index) => {
    const grades = calculateStudentGrades(s);
    const pred = getPredicate(grades.finalScore);
    return {
      'No': index + 1,
      'NISN': s.nisn,
      'Nama Siswa': s.name,
      'Kelas': s.className || classroom.name,
      'Nilai Tugas (30%)': grades.assignmentAvg,
      'Nilai Ulangan (40%)': grades.examAvg,
      'Nilai Sikap (30%)': grades.attitudeAvg,
      'Nilai Akhir IPA': grades.finalScore,
      'Predikat': pred.text,
      'Materi / Topik IPA': s.projectTitle || 'IPA Terpadu SMP',
      'Catatan Guru': s.notes || 'Aktif dan tekun',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 15 }, // NISN
    { wch: 30 }, // Nama Siswa
    { wch: 12 }, // Kelas
    { wch: 18 }, // Nilai Tugas
    { wch: 18 }, // Nilai Ulangan
    { wch: 18 }, // Nilai Sikap
    { wch: 18 }, // Nilai Akhir IPA
    { wch: 16 }, // Predikat
    { wch: 30 }, // Topik IPA
    { wch: 35 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, classroom.name);

  // Generate file name
  const safeClassName = classroom.name.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Nilai_Mata_Pelajaran_IPA_${safeClassName}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Export all classes to Excel workbook with multiple sheets + summary
 */
export function exportAllClassesToExcel(
  classes: ClassRoom[],
  students: Student[]
) {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryRows = classes.map((c, index) => {
    const classStudents = students.filter((s) => s.classId === c.id);
    const finalScores = classStudents.map((s) => calculateStudentGrades(s).finalScore);
    const avgScore =
      finalScores.length > 0
        ? Math.round(finalScores.reduce((acc, curr) => acc + curr, 0) / finalScores.length)
        : 0;

    const highestScore = finalScores.length > 0 ? Math.max(...finalScores) : 0;
    const lowestScore = finalScores.length > 0 ? Math.min(...finalScores) : 0;

    return {
      'No': index + 1,
      'Nama Kelas': c.name,
      'Guru Pengampu IPA': c.homeroomTeacher || 'Guru IPA',
      'Jumlah Siswa': classStudents.length,
      'Rata-rata Nilai Akhir IPA': avgScore,
      'Nilai Tertinggi': highestScore,
      'Nilai Terendah': lowestScore,
      'Predikat Rata-rata': getPredicate(avgScore).text,
    };
  });

  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryRows);
  summaryWorksheet['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'REKAP_SEMUA_KELAS');

  // Sheet for each class
  classes.forEach((c) => {
    const classStudents = students.filter((s) => s.classId === c.id);
    const rows = classStudents.map((s, index) => {
      const grades = calculateStudentGrades(s);
      const pred = getPredicate(grades.finalScore);
      return {
        'No': index + 1,
        'NISN': s.nisn,
        'Nama Siswa': s.name,
        'Kelas': s.className || c.name,
        'Nilai Tugas': grades.assignmentAvg,
        'Nilai Ulangan': grades.examAvg,
        'Nilai Sikap': grades.attitudeAvg,
        'Nilai Akhir IPA': grades.finalScore,
        'Predikat': pred.text,
        'Materi / Topik IPA': s.projectTitle || 'IPA Terpadu',
        'Catatan Guru': s.notes || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 16 },
      { wch: 25 },
      { wch: 30 },
    ];
    // sheet name max 31 chars
    const sheetName = c.name.slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  });

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Rekap_Nilai_Mata_Pelajaran_IPA_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Download sample CSV template for teachers to fill in Google Sheets / Excel
 */
export function downloadSampleCsvTemplate() {
  const headers = ['nisn', 'nama', 'kelas', 'nilai_tugas', 'nilai_ulangan', 'nilai_sikap', 'materi_ipa', 'catatan'];
  const sampleRows = [
    ['0081234001', 'Aditya Pratama Putra', 'Kelas 7A', '85', '88', '90', 'Klasifikasi Makhluk Hidup', 'Sangat teliti saat praktikum mikroskop'],
    ['0081234002', 'Aisyah Nur Salsabila', 'Kelas 7A', '90', '92', '95', 'Zat dan Perubahannya', 'Memahami konsep fisika & kimia dengan baik'],
    ['0082345001', 'Hafiz Al-Fikri', 'Kelas 7B', '80', '82', '85', 'Suhu, Kalor, dan Pemuaian', 'Aktif dalam percobaan kelompok'],
    ['0073456001', 'Oki Kurniawan', 'Kelas 7C', '85', '80', '85', 'Tata Surya dan Bumi', 'Bagus dalam pembuatan model planet'],
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map((r) => r.map((field) => `"${field}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_nilai_mata_pelajaran_ipa.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
