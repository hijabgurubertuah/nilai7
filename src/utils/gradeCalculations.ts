import { Student } from '../types';

export interface CalculatedGrades {
  attitudeAvg: number;
  assignmentAvg: number;
  examAvg: number;
  finalScore: number;
  completedAttitudeMeetings: number;
  completedAssignments: number;
  completedExams: number;
}

/**
 * Calculate Nilai Sikap, Nilai Tugas, Nilai Ulangan, and Nilai Akhir IPA for a student.
 * Weights: Tugas 30%, Ulangan 40%, Sikap 30%
 */
export function calculateStudentGrades(student: Student): CalculatedGrades {
  // 1. Nilai Sikap per Pertemuan
  const mScores = student.meetingScores || [];
  const validAttitude = mScores.filter(
    (s): s is number => typeof s === 'number' && s !== null && !isNaN(s)
  );
  const attitudeAvg =
    validAttitude.length > 0
      ? Math.round(validAttitude.reduce((a, b) => a + b, 0) / validAttitude.length)
      : typeof student.score === 'number' && !isNaN(student.score)
      ? student.score
      : 80;

  // 2. Nilai Tugas (Tugas 1, 2, 3...)
  const aScores = student.assignmentScores || [];
  const validAssignments = aScores.filter(
    (s): s is number => typeof s === 'number' && s !== null && !isNaN(s)
  );
  const assignmentAvg =
    validAssignments.length > 0
      ? Math.round(validAssignments.reduce((a, b) => a + b, 0) / validAssignments.length)
      : typeof student.score === 'number' && !isNaN(student.score)
      ? student.score
      : 80;

  // 3. Nilai Ulangan (UH 1, UH 2, PTS, PAS...)
  const eScores = student.examScores || [];
  const validExams = eScores.filter(
    (s): s is number => typeof s === 'number' && s !== null && !isNaN(s)
  );
  const examAvg =
    validExams.length > 0
      ? Math.round(validExams.reduce((a, b) => a + b, 0) / validExams.length)
      : typeof student.score === 'number' && !isNaN(student.score)
      ? student.score
      : 80;

  // 4. Nilai Akhir IPA: 30% Tugas + 40% Ulangan + 30% Sikap
  const finalScore = Math.round(0.3 * assignmentAvg + 0.4 * examAvg + 0.3 * attitudeAvg);

  return {
    attitudeAvg,
    assignmentAvg,
    examAvg,
    finalScore,
    completedAttitudeMeetings: validAttitude.length,
    completedAssignments: validAssignments.length,
    completedExams: validExams.length,
  };
}

export function getIpaPredicate(score: number): {
  text: string;
  code: string;
  color: string;
  description: string;
} {
  if (score >= 93) {
    return {
      text: 'Sangat Baik',
      code: 'A',
      color: 'gold',
      description: 'Penguasaan konsep IPA dan penerapan sikap ilmiah sangat unggul',
    };
  }
  if (score >= 84) {
    return {
      text: 'Baik',
      code: 'B',
      color: 'green',
      description: 'Penguasaan konsep IPA dan sikap ilmiah baik dan konsisten',
    };
  }
  if (score >= 75) {
    return {
      text: 'Cukup',
      code: 'C',
      color: 'yellow',
      description: 'Mencapai kriteria ketuntasan minimal, perlu penguatan materi IPA',
    };
  }
  return {
    text: 'Perlu Bimbingan',
    code: 'D',
    color: 'red',
    description: 'Belum mencapai ketuntasan, perlu bimbingan dan remidial',
  };
}

// Science quotes for students
export const IPA_QUOTES: Record<string, string[]> = {
  high: [
    'Luar biasa! Pemahaman konsep sains dan sikap ilmiahmu sangat menginspirasi.',
    'Hebat, daya analisis dan ketekunanmu dalam belajar IPA sangat membanggakan.',
    'Terus asah rasa ingin tahu sainsmu, jadilah ilmuwan muda penerus bangsa!',
  ],
  medium: [
    'Bagus sekali! Pertahankan ketelitian dalam praktikum dan pengerjaan tugas IPA.',
    'Pemahaman IPA kamu sudah baik, terus eksplorasi fenomena alam sekitar.',
    'Rajin mengulang materi dan aktif berdiskusi akan membuat nilaimu makin gemilang.',
  ],
  low: [
    'Ayo tetap semangat! Belajar sains itu menyenangkan jika dipelajari perlahan.',
    'Jangan ragu bertanya pada guru saat praktikum dan konsep IPA belum dipahami.',
    'Tingkatkan kedisiplinan mengumpulkan tugas dan ulangan harian IPA.',
  ],
};

export function getQuoteForIpaScore(score: number, seed: string): string {
  let list = IPA_QUOTES.medium;
  if (score >= 85) list = IPA_QUOTES.high;
  else if (score < 75) list = IPA_QUOTES.low;

  let sum = 0;
  for (let i = 0; i < seed.length; i++) {
    sum += seed.charCodeAt(i);
  }
  return list[sum % list.length];
}
