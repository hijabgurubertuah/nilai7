import React, { useState } from 'react';
import { LogOut, Award, BookOpen, ClipboardList, GraduationCap, Sparkles, CheckCircle2 } from 'lucide-react';
import { Student } from '../types';
import { calculateStudentGrades, getIpaPredicate, getQuoteForIpaScore } from '../utils/gradeCalculations';

interface StudentPortalViewProps {
  student: Student;
  attitudeMeetingsCount?: number;
  assignmentCount?: number;
  examCount?: number;
  onLogout: () => void;
  isPreviewMode?: boolean;
  studentsList?: Student[];
  onSelectStudent?: (studentId: string) => void;
  onBackToAdmin?: () => void;
  onBackToTeacher?: () => void;
}

export const getScoreColorScheme = (score: number | null) => {
  if (score === null || score === undefined) {
    return {
      card: 'bg-slate-100 text-slate-400 border-slate-300 border-dashed',
      textScore: 'text-slate-300',
      label: 'text-slate-400',
      badge: 'bg-slate-200 text-slate-500 border-slate-300',
      heroBg: 'bg-slate-800 text-white border-slate-700',
      heroBadge: 'bg-slate-700 text-slate-300 border-slate-600',
      subtext: 'text-slate-400',
      predicate: '-',
    };
  }

  if (score >= 93) {
    // Emas / Gold (Sangat Baik / A)
    return {
      card: 'bg-amber-400 text-amber-950 border-amber-300 shadow-xs',
      textScore: 'text-amber-950 font-black',
      label: 'text-amber-900 font-bold',
      badge: 'bg-amber-950 text-amber-300 border-amber-400 font-extrabold',
      heroBg: 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-amber-950 border-2 border-amber-300 shadow-xl shadow-amber-400/20',
      heroBadge: 'bg-amber-950 text-amber-300 border border-amber-400',
      subtext: 'text-amber-900',
      predicate: 'Sangat Baik (A)',
    };
  }

  if (score >= 84) {
    // Hijau / Green (Baik / B)
    return {
      card: 'bg-emerald-600 text-white border-emerald-500 shadow-xs',
      textScore: 'text-white font-black',
      label: 'text-emerald-100 font-bold',
      badge: 'bg-emerald-950 text-emerald-200 border-emerald-400 font-extrabold',
      heroBg: 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white border-2 border-emerald-500 shadow-xl shadow-emerald-600/20',
      heroBadge: 'bg-emerald-950 text-emerald-200 border border-emerald-400',
      subtext: 'text-emerald-100',
      predicate: 'Baik (B)',
    };
  }

  if (score >= 75) {
    // Biru / Royal Blue (Cukup / C)
    return {
      card: 'bg-blue-600 text-white border-blue-500 shadow-xs',
      textScore: 'text-white font-black',
      label: 'text-blue-100 font-bold',
      badge: 'bg-blue-950 text-blue-200 border-blue-400 font-extrabold',
      heroBg: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border-2 border-blue-400 shadow-xl shadow-blue-600/20',
      heroBadge: 'bg-blue-950 text-blue-200 border border-blue-400',
      subtext: 'text-blue-100',
      predicate: 'Cukup (C)',
    };
  }

  // Merah / Red (<75)
  return {
    card: 'bg-rose-600 text-white border-rose-500 shadow-xs',
    textScore: 'text-white font-black',
    label: 'text-rose-100 font-bold',
    badge: 'bg-rose-950 text-rose-200 border-rose-400 font-extrabold',
    heroBg: 'bg-gradient-to-br from-rose-600 via-rose-700 to-rose-800 text-white border-2 border-rose-500 shadow-xl shadow-rose-600/20',
    heroBadge: 'bg-rose-950 text-rose-200 border border-rose-400',
    subtext: 'text-rose-100',
    predicate: 'Perlu Bimbingan (D)',
  };
};

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  student,
  attitudeMeetingsCount = 8,
  assignmentCount = 5,
  examCount = 4,
  onLogout,
  isPreviewMode = false,
  studentsList = [],
  onSelectStudent,
  onBackToAdmin,
  onBackToTeacher,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'attitude' | 'assignment' | 'exam'>('all');

  const grades = calculateStudentGrades(student);
  const heroStyle = getScoreColorScheme(grades.finalScore);
  const selectedQuote = getQuoteForIpaScore(grades.finalScore, student.nisn || student.id);

  // Dynamic meeting count (at least attitudeMeetingsCount or actual items)
  const actualAttitudeCount = Math.max(
    attitudeMeetingsCount,
    student.meetingScores?.length || 0
  );

  const actualAssignmentCount = Math.max(
    assignmentCount,
    student.assignmentScores?.length || 0
  );

  const actualExamCount = Math.max(
    examCount,
    student.examScores?.length || 0
  );

  const getExamTitle = (idx: number) => {
    if (idx === 0) return 'UH 1';
    if (idx === 1) return 'UH 2';
    if (idx === 2) return 'PTS';
    if (idx === 3) return 'PAS';
    return `Ulangan ${idx + 1}`;
  };

  const isTik = (student.className || '').toUpperCase().includes('TIK');
  const myClasses = studentsList && student.nisn
    ? studentsList.filter((s) => s.nisn.trim().toLowerCase() === student.nisn.trim().toLowerCase())
    : [];

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4 animate-fadeIn">
      {/* Banner Khusus Mode Pratinjau Siswa untuk Admin & Guru */}
      {isPreviewMode && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-3.5 sm:p-4 rounded-3xl border-2 border-emerald-500/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3 min-w-0 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
                  Mode Pratinjau Tampilan Siswa
                </span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Live View
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 leading-tight">
                Melihat tampilan persis seperti yang diakses siswa melalui nomor NISN.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
            {studentsList.length > 0 && onSelectStudent && (
              <div className="flex items-center space-x-1.5 w-full sm:w-auto">
                <label className="text-[11px] font-bold text-emerald-200 shrink-0 hidden xs:inline">
                  Siswa:
                </label>
                <select
                  value={student.id}
                  onChange={(e) => onSelectStudent(e.target.value)}
                  className="bg-emerald-950/90 text-white text-xs font-bold px-3 py-2 rounded-xl border border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-full sm:w-56 cursor-pointer shadow-inner"
                  title="Pilih siswa lain untuk dipratinjau"
                >
                  {studentsList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.className} - {st.nisn})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {onBackToAdmin && (
              <button
                type="button"
                onClick={onBackToAdmin}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
              >
                Panel Admin
              </button>
            )}
          </div>
        </div>
      )}

      {/* Subject switcher if student is enrolled in multiple classes (e.g. 7D IPA and 7D TIK) */}
      {myClasses.length > 1 && onSelectStudent && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-2xl border-2 border-emerald-300 shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Pilih Mata Pelajaran:
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              NISN: {student.nisn}
            </span>
          </div>
          <div className="flex items-center space-x-2 flex-wrap">
            {myClasses.map((cl) => {
              const clIsTik = (cl.className || '').toUpperCase().includes('TIK');
              const isSelected = cl.id === student.id;
              return (
                <button
                  key={cl.id}
                  type="button"
                  onClick={() => onSelectStudent(cl.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? (clIsTik ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-emerald-700 text-white ring-2 ring-emerald-400')
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{clIsTik ? '💻' : '🌿'}</span>
                  <span>{cl.className}</span>
                  {isSelected && <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">Aktif</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* PALING ATAS: KOTAK NILAI AKHIR MATA PELAJARAN IPA / TIK */}
      <div className={`rounded-3xl p-5 sm:p-7 pr-12 sm:pr-14 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4 relative overflow-hidden ${heroStyle.heroBg}`}>
        <div className="text-center sm:text-left space-y-1.5 z-10 min-w-0 flex-1">
          <div className={`leading-tight uppercase ${heroStyle.subtext}`}>
            <span className="text-sm sm:text-base font-black tracking-wide block">
              RAPOR PENILAIAN
            </span>
            <span className="text-[11px] sm:text-xs font-black tracking-wider block opacity-95">
              MATA PELAJARAN {isTik ? 'TIK (TEKNOLOGI INFORMASI & KOMUNIKASI)' : 'IPA (ILMU PENGETAHUAN ALAM)'}
            </span>
            <span className="text-[10px] font-bold tracking-widest block opacity-85 mt-0.5">
              SMP NEGERI 1 BENGKALIS
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black truncate leading-tight pt-1">
            {student.name}
          </h2>
          <div className={`text-xs font-mono truncate ${heroStyle.subtext}`}>
            NISN: <strong>{student.nisn}</strong> • {student.className}
          </div>
          <div className={`text-xs mt-1 font-semibold ${heroStyle.subtext}`}>
            Topik: {student.projectTitle || (isTik ? 'Informatika & Komputer' : 'IPA Terpadu')}
          </div>
        </div>

        {/* Kotak Nilai Akhir Besar */}
        <div className="flex flex-col items-center justify-center bg-black/15 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-white/20 min-w-[170px] z-10 shrink-0">
          <div className="text-[11px] font-black uppercase tracking-wider opacity-90 mb-0.5">
            Nilai Akhir {isTik ? 'TIK' : 'IPA'}
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tight">
            {grades.finalScore}
          </div>
          <div className={`mt-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${heroStyle.heroBadge}`}>
            {heroStyle.predicate}
          </div>
        </div>

        {/* UCAPAN MOTIVASI SAINS */}
        <div className="w-full z-10 pt-3 mt-1 border-t border-black/10 sm:border-white/20 flex items-center justify-center sm:justify-start">
          <p className={`text-xs sm:text-sm font-bold italic text-center sm:text-left ${heroStyle.subtext}`}>
            "{selectedQuote}"
          </p>
        </div>

        <button
          type="button"
          onClick={isPreviewMode && onBackToAdmin ? onBackToAdmin : onLogout}
          className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/30 rounded-xl transition-colors cursor-pointer text-white/90 hover:text-white"
          title={isPreviewMode ? 'Kembali ke Panel Admin' : 'Keluar / Switch Akun'}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* 3 KARTU RINGKASAN: TUGAS, ULANGAN, SIKAP */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* 1. Nilai Tugas */}
        <div className="bg-white p-3.5 rounded-2xl border-2 border-blue-200 text-center shadow-xs">
          <div className="flex items-center justify-center space-x-1 text-[10px] sm:text-xs text-blue-700 font-extrabold uppercase">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Nilai Tugas (30%)</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-800 mt-1">
            {grades.assignmentAvg}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            {grades.completedAssignments} tugas dinilai
          </div>
        </div>

        {/* 2. Nilai Ulangan */}
        <div className="bg-white p-3.5 rounded-2xl border-2 border-purple-200 text-center shadow-xs">
          <div className="flex items-center justify-center space-x-1 text-[10px] sm:text-xs text-purple-700 font-extrabold uppercase">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Nilai Ulangan (40%)</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-800 mt-1">
            {grades.examAvg}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            {grades.completedExams} ulangan dinilai
          </div>
        </div>

        {/* 3. Nilai Sikap */}
        <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-200 text-center shadow-xs">
          <div className="flex items-center justify-center space-x-1 text-[10px] sm:text-xs text-emerald-700 font-extrabold uppercase">
            <Award className="w-3.5 h-3.5" />
            <span>Nilai Sikap (30%)</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">
            {grades.attitudeAvg}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            {grades.completedAttitudeMeetings} pertemuan dinilai
          </div>
        </div>
      </div>

      {/* TABS TAMPILAN DETAIL */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua Rincian
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('attitude')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'attitude' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sikap ({actualAttitudeCount} Pertemuan)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('assignment')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'assignment' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tugas ({actualAssignmentCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exam')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'exam' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ulangan ({actualExamCount})
        </button>
      </div>

      {/* DETAIL 1: NILAI SIKAP PER PERTEMUAN (BISA DITAMBAH OLEH GURU) */}
      {(activeTab === 'all' || activeTab === 'attitude') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
            <span className="flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Nilai Sikap Ilmiah Per Pertemuan (1 s.d. {actualAttitudeCount})</span>
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold">
              Rata-rata: {grades.attitudeAvg}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-4">
            {Array.from({ length: actualAttitudeCount }, (_, idx) => {
              const meetingNum = idx + 1;
              let score: number | null = null;
              let note: string | null = null;

              if (student.meetingScores && student.meetingScores[idx] !== undefined && student.meetingScores[idx] !== null) {
                score = student.meetingScores[idx];
              } else if (idx === 0 && typeof student.score === 'number') {
                score = student.score;
              }

              if (student.meetingNotes && student.meetingNotes[idx]) {
                note = student.meetingNotes[idx];
              }

              const itemStyle = getScoreColorScheme(score);

              return (
                <div
                  key={meetingNum}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-between space-y-1.5 transition-all ${itemStyle.card}`}
                >
                  <div className="text-center py-0.5">
                    <div className={`text-2xl sm:text-3xl font-black tracking-tight ${itemStyle.textScore}`}>
                      {score !== null ? score : '-'}
                    </div>
                  </div>

                  {score !== null ? (
                    <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border shadow-2xs ${itemStyle.badge}`}>
                      {itemStyle.predicate}
                    </div>
                  ) : (
                    <div className="text-[10px] italic opacity-60">Belum Terisi</div>
                  )}

                  {note && (
                    <div className="text-[9px] italic opacity-90 truncate max-w-full">
                      "{note}"
                    </div>
                  )}

                  <div className={`text-[10px] font-bold uppercase tracking-wider text-center pt-1 border-t border-black/10 sm:border-white/20 w-full ${itemStyle.label}`}>
                    Pertemuan {meetingNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAIL 2: NILAI TUGAS IPA */}
      {(activeTab === 'all' || activeTab === 'assignment') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1 pt-2">
            <span className="flex items-center space-x-1.5">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <span>Nilai Tugas IPA (1 s.d. {actualAssignmentCount})</span>
            </span>
            <span className="text-[11px] text-blue-700 font-semibold">
              Rata-rata: {grades.assignmentAvg}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: actualAssignmentCount }, (_, idx) => {
              const taskNum = idx + 1;
              let score: number | null = null;
              if (student.assignmentScores && student.assignmentScores[idx] !== undefined && student.assignmentScores[idx] !== null) {
                score = student.assignmentScores[idx];
              }

              const itemStyle = getScoreColorScheme(score);

              return (
                <div
                  key={taskNum}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-between space-y-1.5 transition-all ${itemStyle.card}`}
                >
                  <div className={`text-2xl sm:text-3xl font-black tracking-tight ${itemStyle.textScore}`}>
                    {score !== null ? score : '-'}
                  </div>

                  {score !== null ? (
                    <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border shadow-2xs ${itemStyle.badge}`}>
                      {itemStyle.predicate}
                    </div>
                  ) : (
                    <div className="text-[10px] italic opacity-60">Belum Ada</div>
                  )}

                  <div className={`text-[10px] font-bold uppercase tracking-wider text-center pt-1 border-t border-black/10 sm:border-white/20 w-full ${itemStyle.label}`}>
                    Tugas {taskNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAIL 3: NILAI ULANGAN IPA */}
      {(activeTab === 'all' || activeTab === 'exam') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1 pt-2">
            <span className="flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>Nilai Ulangan IPA (UH / PTS / PAS)</span>
            </span>
            <span className="text-[11px] text-purple-700 font-semibold">
              Rata-rata: {grades.examAvg}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {Array.from({ length: actualExamCount }, (_, idx) => {
              let score: number | null = null;
              if (student.examScores && student.examScores[idx] !== undefined && student.examScores[idx] !== null) {
                score = student.examScores[idx];
              }

              const itemStyle = getScoreColorScheme(score);

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-between space-y-1.5 transition-all ${itemStyle.card}`}
                >
                  <div className={`text-2xl sm:text-3xl font-black tracking-tight ${itemStyle.textScore}`}>
                    {score !== null ? score : '-'}
                  </div>

                  {score !== null ? (
                    <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border shadow-2xs ${itemStyle.badge}`}>
                      {itemStyle.predicate}
                    </div>
                  ) : (
                    <div className="text-[10px] italic opacity-60">Belum Ada</div>
                  )}

                  <div className={`text-[10px] font-bold uppercase tracking-wider text-center pt-1 border-t border-black/10 sm:border-white/20 w-full ${itemStyle.label}`}>
                    {getExamTitle(idx)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Catatan Guru IPA */}
      {student.notes && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start space-x-3">
          <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700">
            <strong className="font-bold text-slate-900 block mb-0.5">Catatan Guru Pengampu IPA:</strong>
            <p className="italic">"{student.notes}"</p>
          </div>
        </div>
      )}
    </div>
  );
};
