import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Users,
  TrendingUp,
  Award,
  MessageSquare,
  Sparkles,
  X,
  Save,
  Calendar,
  Plus,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Calculator,
} from 'lucide-react';
import { ClassRoom, Student, MeetingSchedule } from '../types';
import { exportClassToExcel } from '../utils/excelExport';
import { getScoreColorScheme } from './StudentPortalView';
import { calculateStudentGrades, getIpaPredicate } from '../utils/gradeCalculations';

const CLASS_GRADIENTS = [
  {
    gradient: "from-emerald-600 via-teal-700 to-emerald-900",
    border: "border-emerald-400/40",
    glow: "bg-emerald-400/15"
  },
  {
    gradient: "from-blue-600 via-indigo-700 to-sky-900",
    border: "border-blue-400/40",
    glow: "bg-blue-400/15"
  },
  {
    gradient: "from-purple-600 via-indigo-600 to-purple-900",
    border: "border-purple-400/40",
    glow: "bg-purple-400/15"
  },
  {
    gradient: "from-teal-600 via-cyan-700 to-teal-900",
    border: "border-teal-400/40",
    glow: "bg-teal-400/15"
  },
  {
    gradient: "from-amber-600 via-orange-600 to-amber-900",
    border: "border-amber-400/40",
    glow: "bg-amber-300/15"
  },
];

type ScoringCategory = 'attitude' | 'assignment' | 'exam' | 'summary';

interface ClassDetailViewProps {
  classroom: ClassRoom;
  students: Student[];
  classes?: ClassRoom[];
  schedules?: MeetingSchedule[];
  attitudeMeetingsCount?: number;
  assignmentCount?: number;
  examCount?: number;
  onBack: () => void;
  onUpdateScore: (studentId: string, newScore: number) => void;
  onUpdateNotes: (studentId: string, notes: string) => void;
  onUpdateMeetingScore?: (studentId: string, meetingIndex: number, newScore: number, notes?: string) => void;
  onUpdateAssignmentScore?: (studentId: string, assignmentIndex: number, newScore: number, notes?: string) => void;
  onUpdateExamScore?: (studentId: string, examIndex: number, newScore: number, notes?: string) => void;
  onAddAttitudeMeeting?: () => Promise<void> | void;
  onAddAssignment?: () => Promise<void> | void;
  onAddExam?: () => Promise<void> | void;
  hasPendingChanges?: boolean;
  pendingChangesCount?: number;
  onSaveToFirebase?: () => Promise<void>;
  isSavingToFirebase?: boolean;
}

export const ClassDetailView: React.FC<ClassDetailViewProps> = ({
  classroom,
  students,
  classes = [],
  schedules = [],
  attitudeMeetingsCount = 8,
  assignmentCount = 5,
  examCount = 4,
  onBack,
  onUpdateScore,
  onUpdateNotes,
  onUpdateMeetingScore,
  onUpdateAssignmentScore,
  onUpdateExamScore,
  onAddAttitudeMeeting,
  onAddAssignment,
  onAddExam,
}) => {
  const [activeCategory, setActiveCategory] = useState<ScoringCategory>('attitude');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [recentUpdatedId, setRecentUpdatedId] = useState<string | null>(null);

  // Active indexes for each category
  const [selectedMeetingIndex, setSelectedMeetingIndex] = useState<number>(0);
  const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState<number>(0);
  const [selectedExamIndex, setSelectedExamIndex] = useState<number>(0);

  // Find index of classroom in classes to match color scheme
  const colorScheme = useMemo(() => {
    const classIdx = classes.findIndex((c) => c.id === classroom.id);
    return CLASS_GRADIENTS[classIdx !== -1 ? classIdx % CLASS_GRADIENTS.length : 0];
  }, [classes, classroom]);

  // Filter students for this class
  const classStudents = useMemo(() => {
    const classIdStr = (classroom.id || '').trim().toLowerCase();
    const classNameStr = (classroom.name || '').replace(/^Kelas\s+/i, '').trim().toLowerCase();

    return students
      .filter((s) => {
        if (!s) return false;
        const sClassId = (s.classId || '').trim().toLowerCase();
        const sClassName = (s.className || '').trim().toLowerCase();
        const sCleanClassName = (s.className || '').replace(/^Kelas\s+/i, '').trim().toLowerCase();

        return (
          sClassId === classIdStr ||
          sClassName === (classroom.name || '').trim().toLowerCase() ||
          sCleanClassName === classNameStr ||
          sClassId === classNameStr
        );
      })
      .sort((a, b) => (a.name || '').trim().localeCompare((b.name || '').trim(), 'id', { sensitivity: 'base' }));
  }, [students, classroom]);

  // Filter by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.toLowerCase();
    return classStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nisn.includes(q) ||
        (s.projectTitle && s.projectTitle.toLowerCase().includes(q))
    );
  }, [classStudents, searchQuery]);

  // Helper getters
  const getMeetingScore = (student: Student, idx: number): number => {
    if (student.meetingScores && student.meetingScores[idx] !== undefined && student.meetingScores[idx] !== null) {
      return student.meetingScores[idx] as number;
    }
    if (idx === 0 && typeof student.score === 'number') return student.score;
    return 80;
  };

  const getMeetingNotes = (student: Student, idx: number): string => {
    if (student.meetingNotes && student.meetingNotes[idx] !== undefined && student.meetingNotes[idx] !== null) {
      return student.meetingNotes[idx] as string;
    }
    if (idx === 0) return student.notes || '';
    return '';
  };

  const getAssignmentScore = (student: Student, idx: number): number => {
    if (student.assignmentScores && student.assignmentScores[idx] !== undefined && student.assignmentScores[idx] !== null) {
      return student.assignmentScores[idx] as number;
    }
    return 80;
  };

  const getAssignmentNotes = (student: Student, idx: number): string => {
    if (student.assignmentNotes && student.assignmentNotes[idx] !== undefined && student.assignmentNotes[idx] !== null) {
      return student.assignmentNotes[idx] as string;
    }
    return '';
  };

  const getExamScore = (student: Student, idx: number): number => {
    if (student.examScores && student.examScores[idx] !== undefined && student.examScores[idx] !== null) {
      return student.examScores[idx] as number;
    }
    return 80;
  };

  const getExamNotes = (student: Student, idx: number): string => {
    if (student.examNotes && student.examNotes[idx] !== undefined && student.examNotes[idx] !== null) {
      return student.examNotes[idx] as string;
    }
    return '';
  };

  // Exam labels
  const getExamLabel = (idx: number): string => {
    if (idx === 0) return 'UH 1 (Ulangan Harian 1)';
    if (idx === 1) return 'UH 2 (Ulangan Harian 2)';
    if (idx === 2) return 'PTS (Tengah Semester)';
    if (idx === 3) return 'PAS (Akhir Semester)';
    return `Ulangan ${idx + 1}`;
  };

  // Class averages
  const classAverages = useMemo(() => {
    if (classStudents.length === 0) {
      return { final: 0, attitude: 0, assignment: 0, exam: 0 };
    }
    let totalFinal = 0;
    let totalAtt = 0;
    let totalAsg = 0;
    let totalExm = 0;

    classStudents.forEach((s) => {
      const g = calculateStudentGrades(s);
      totalFinal += g.finalScore;
      totalAtt += g.attitudeAvg;
      totalAsg += g.assignmentAvg;
      totalExm += g.examAvg;
    });

    const count = classStudents.length;
    return {
      final: Math.round(totalFinal / count),
      attitude: Math.round(totalAtt / count),
      assignment: Math.round(totalAsg / count),
      exam: Math.round(totalExm / count),
    };
  }, [classStudents]);

  // Handle score changes depending on activeCategory
  const handleScoreChange = (student: Student, delta: number) => {
    if (activeCategory === 'attitude') {
      const current = getMeetingScore(student, selectedMeetingIndex);
      const newScore = Math.max(0, Math.min(100, current + delta));
      if (newScore !== current) {
        if (onUpdateMeetingScore) {
          onUpdateMeetingScore(
            student.id,
            selectedMeetingIndex,
            newScore,
            getMeetingNotes(student, selectedMeetingIndex)
          );
        } else {
          onUpdateScore(student.id, newScore);
        }
        triggerRecentUpdate(student.id);
      }
    } else if (activeCategory === 'assignment') {
      const current = getAssignmentScore(student, selectedAssignmentIndex);
      const newScore = Math.max(0, Math.min(100, current + delta));
      if (newScore !== current) {
        if (onUpdateAssignmentScore) {
          onUpdateAssignmentScore(
            student.id,
            selectedAssignmentIndex,
            newScore,
            getAssignmentNotes(student, selectedAssignmentIndex)
          );
        }
        triggerRecentUpdate(student.id);
      }
    } else if (activeCategory === 'exam') {
      const current = getExamScore(student, selectedExamIndex);
      const newScore = Math.max(0, Math.min(100, current + delta));
      if (newScore !== current) {
        if (onUpdateExamScore) {
          onUpdateExamScore(
            student.id,
            selectedExamIndex,
            newScore,
            getExamNotes(student, selectedExamIndex)
          );
        }
        triggerRecentUpdate(student.id);
      }
    }
  };

  const triggerRecentUpdate = (studentId: string) => {
    setRecentUpdatedId(studentId);
    setTimeout(() => {
      setRecentUpdatedId((prev) => (prev === studentId ? null : prev));
    }, 1000);
  };

  const handleOpenNoteModal = (student: Student) => {
    setEditingStudentId(student.id);
    if (activeCategory === 'attitude') {
      setTempNotes(getMeetingNotes(student, selectedMeetingIndex));
    } else if (activeCategory === 'assignment') {
      setTempNotes(getAssignmentNotes(student, selectedAssignmentIndex));
    } else if (activeCategory === 'exam') {
      setTempNotes(getExamNotes(student, selectedExamIndex));
    } else {
      setTempNotes(student.notes || '');
    }
  };

  const handleSaveNotes = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      if (activeCategory === 'attitude') {
        const score = getMeetingScore(student, selectedMeetingIndex);
        if (onUpdateMeetingScore) {
          onUpdateMeetingScore(studentId, selectedMeetingIndex, score, tempNotes);
        } else {
          onUpdateNotes(studentId, tempNotes);
        }
      } else if (activeCategory === 'assignment') {
        const score = getAssignmentScore(student, selectedAssignmentIndex);
        if (onUpdateAssignmentScore) {
          onUpdateAssignmentScore(studentId, selectedAssignmentIndex, score, tempNotes);
        }
      } else if (activeCategory === 'exam') {
        const score = getExamScore(student, selectedExamIndex);
        if (onUpdateExamScore) {
          onUpdateExamScore(studentId, selectedExamIndex, score, tempNotes);
        }
      } else {
        onUpdateNotes(studentId, tempNotes);
      }
    }
    setEditingStudentId(null);
  };

  const handleAddNewMeeting = async () => {
    if (onAddAttitudeMeeting) {
      await onAddAttitudeMeeting();
      setSelectedMeetingIndex(attitudeMeetingsCount);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-4 animate-fadeIn">
      {/* Banner Header Kelas */}
      <div className={`bg-gradient-to-r ${colorScheme.gradient} text-white p-4 sm:p-6 rounded-3xl shadow-md border ${colorScheme.border} flex items-center justify-between gap-3`}>
        <div className="flex items-center space-x-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-1 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-2xl border border-white/30 font-extrabold text-xs shadow-xs transition-colors shrink-0 cursor-pointer active:scale-95 backdrop-blur-xs"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Kembali</span>
          </button>

          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-200 block mb-0.5 opacity-90">
              PENILAIAN MATA PELAJARAN {(classroom.name || '').toUpperCase().includes('TIK') ? 'TIK' : 'IPA'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase drop-shadow-xs truncate">
              {classroom.name.toUpperCase()}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium truncate pt-0.5">
              {classStudents.length} Siswa • Guru: {classroom.homeroomTeacher || ((classroom.name || '').toUpperCase().includes('TIK') ? 'Guru TIK' : 'Guru IPA')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => exportClassToExcel(classroom, students)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-2xl border border-emerald-400/50 text-xs font-bold shadow-xs cursor-pointer active:scale-95"
            title="Ekspor Nilai Kelas Ini ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span className="hidden sm:inline">Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Ringkas: Nilai Akhir, Tugas, Ulangan, Sikap */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
          <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase truncate">Rata Nilai Akhir</div>
          <div className="text-base sm:text-2xl font-black text-emerald-700 mt-0.5">
            {classAverages.final}
          </div>
        </div>
        <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
          <div className="text-[9px] sm:text-[10px] text-blue-600 font-bold uppercase truncate">Tugas (30%)</div>
          <div className="text-base sm:text-xl font-black text-blue-700 mt-0.5">
            {classAverages.assignment}
          </div>
        </div>
        <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
          <div className="text-[9px] sm:text-[10px] text-purple-600 font-bold uppercase truncate">Ulangan (40%)</div>
          <div className="text-base sm:text-xl font-black text-purple-700 mt-0.5">
            {classAverages.exam}
          </div>
        </div>
        <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
          <div className="text-[9px] sm:text-[10px] text-teal-600 font-bold uppercase truncate">Sikap (30%)</div>
          <div className="text-base sm:text-xl font-black text-teal-700 mt-0.5">
            {classAverages.attitude}
          </div>
        </div>
      </div>

      {/* 4 TAB KATEGORI PENILAIAN IPA: SIKAP, TUGAS, ULANGAN, REKAP */}
      <div className="grid grid-cols-4 bg-slate-200/80 p-1.5 rounded-2xl gap-1 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveCategory('attitude')}
          className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeCategory === 'attitude'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/50'
          }`}
        >
          <Award className="w-3.5 h-3.5 hidden xs:inline" />
          <span>Sikap ({attitudeMeetingsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('assignment')}
          className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeCategory === 'assignment'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/50'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 hidden xs:inline" />
          <span>Tugas ({assignmentCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('exam')}
          className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeCategory === 'exam'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 hidden xs:inline" />
          <span>Ulangan ({examCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('summary')}
          className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeCategory === 'summary'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/50'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 hidden xs:inline" />
          <span>Rekap IPA</span>
        </button>
      </div>

      {/* SUB-HEADER KONTROL PER KATEGORI */}
      {activeCategory === 'attitude' && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wide">
              Pilih Pertemuan Sikap:
            </label>
            <select
              value={selectedMeetingIndex}
              onChange={(e) => setSelectedMeetingIndex(Number(e.target.value))}
              className="px-3 py-1.5 bg-emerald-50 border-2 border-emerald-600 rounded-xl text-xs sm:text-sm font-black text-emerald-950 shadow-2xs cursor-pointer"
            >
              {Array.from({ length: attitudeMeetingsCount }, (_, idx) => (
                <option key={idx} value={idx}>
                  Pertemuan {idx + 1}
                </option>
              ))}
            </select>

            {/* TOMBOL TAMBAH PERTEMUAN SIKAP */}
            <button
              type="button"
              onClick={handleAddNewMeeting}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Tambah pertemuan baru untuk penilaian sikap IPA"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Pertemuan</span>
            </button>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Total Pertemuan Sikap: <strong className="text-emerald-700">{attitudeMeetingsCount}</strong>
          </div>
        </div>
      )}

      {activeCategory === 'assignment' && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wide">
              Pilih Tugas IPA:
            </label>
            <select
              value={selectedAssignmentIndex}
              onChange={(e) => setSelectedAssignmentIndex(Number(e.target.value))}
              className="px-3 py-1.5 bg-blue-50 border-2 border-blue-600 rounded-xl text-xs sm:text-sm font-black text-blue-950 shadow-2xs cursor-pointer"
            >
              {Array.from({ length: assignmentCount }, (_, idx) => (
                <option key={idx} value={idx}>
                  Tugas {idx + 1}
                </option>
              ))}
            </select>

            {onAddAssignment && (
              <button
                type="button"
                onClick={onAddAssignment}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Tugas</span>
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-slate-500">
            Bobot: <strong className="text-blue-700">30% Nilai Akhir</strong>
          </div>
        </div>
      )}

      {activeCategory === 'exam' && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wide">
              Pilih Ulangan IPA:
            </label>
            <select
              value={selectedExamIndex}
              onChange={(e) => setSelectedExamIndex(Number(e.target.value))}
              className="px-3 py-1.5 bg-purple-50 border-2 border-purple-600 rounded-xl text-xs sm:text-sm font-black text-purple-950 shadow-2xs cursor-pointer"
            >
              {Array.from({ length: examCount }, (_, idx) => (
                <option key={idx} value={idx}>
                  {getExamLabel(idx)}
                </option>
              ))}
            </select>

            {onAddExam && (
              <button
                type="button"
                onClick={onAddExam}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Ulangan</span>
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-slate-500">
            Bobot: <strong className="text-purple-700">40% Nilai Akhir</strong>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama, NISN, atau materi IPA..."
          className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs"
        />
      </div>

      {/* TABEL ATAU LIST SISWA */}
      {activeCategory === 'summary' ? (
        /* TAB REKAP LENGKAP SEMUA NILAI IPA */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3 min-w-[160px]">Nama Siswa & NISN</th>
                <th className="p-3 text-center min-w-[80px] text-blue-700">Tugas (30%)</th>
                <th className="p-3 text-center min-w-[80px] text-purple-700">Ulangan (40%)</th>
                <th className="p-3 text-center min-w-[80px] text-teal-700">Sikap (30%)</th>
                <th className="p-3 text-center min-w-[90px] text-emerald-800 bg-emerald-50">Nilai Akhir</th>
                <th className="p-3 text-center min-w-[90px]">Predikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.map((st, idx) => {
                const grades = calculateStudentGrades(st);
                const pred = getIpaPredicate(grades.finalScore);
                const scoreStyle = getScoreColorScheme(grades.finalScore);

                return (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{st.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{st.nisn}</div>
                    </td>
                    <td className="p-3 text-center font-bold text-blue-800">
                      {grades.assignmentAvg}
                    </td>
                    <td className="p-3 text-center font-bold text-purple-800">
                      {grades.examAvg}
                    </td>
                    <td className="p-3 text-center font-bold text-teal-800">
                      {grades.attitudeAvg}
                    </td>
                    <td className="p-3 text-center font-black text-sm text-emerald-950 bg-emerald-50/70">
                      {grades.finalScore}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${scoreStyle.badge}`}>
                        {pred.code} ({pred.text})
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              Tidak ada siswa ditemukan pada kelas ini.
            </div>
          )}
        </div>
      ) : (
        /* LIST PENILAIAN AKTIF (SIKAP / TUGAS / ULANGAN) */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, idx) => {
              let currentVal = 80;
              let currentNotes = '';
              let categoryLabel = '';

              if (activeCategory === 'attitude') {
                currentVal = getMeetingScore(student, selectedMeetingIndex);
                currentNotes = getMeetingNotes(student, selectedMeetingIndex);
                categoryLabel = `Pertemuan ${selectedMeetingIndex + 1}`;
              } else if (activeCategory === 'assignment') {
                currentVal = getAssignmentScore(student, selectedAssignmentIndex);
                currentNotes = getAssignmentNotes(student, selectedAssignmentIndex);
                categoryLabel = `Tugas ${selectedAssignmentIndex + 1}`;
              } else {
                currentVal = getExamScore(student, selectedExamIndex);
                currentNotes = getExamNotes(student, selectedExamIndex);
                categoryLabel = getExamLabel(selectedExamIndex);
              }

              const predicate = getIpaPredicate(currentVal);
              const isUpdatedRecently = recentUpdatedId === student.id;
              const scoreStyle = getScoreColorScheme(currentVal);

              return (
                <div
                  key={student.id}
                  className={`p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors ${
                    isUpdatedRecently ? 'bg-emerald-50/80 ring-1 ring-emerald-300' : ''
                  }`}
                >
                  {/* Kolom Kiri: Nomor, Nama, NISN, Topik & Catatan */}
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-400 w-5 shrink-0 text-center">
                      {idx + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-1.5">
                        <span className="truncate">{student.name}</span>
                        {currentVal >= 95 && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 shrink-0">
                            ★ Unggul
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 truncate mt-0.5">
                        <span className="font-mono text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60 shrink-0">
                          {student.nisn}
                        </span>
                        <span className="truncate text-slate-500 text-[10px] sm:text-xs">
                          {student.projectTitle || 'IPA Terpadu'}
                        </span>
                      </div>

                      {currentNotes && (
                        <div className="text-[10px] text-slate-500 italic truncate mt-0.5">
                          "{currentNotes}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kolom Kanan: Tombol Catatan + [▼] [ Nilai ] [▲] */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="hidden md:inline text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {predicate.code}
                    </span>

                    {/* Tombol Catatan */}
                    <button
                      type="button"
                      onClick={() => handleOpenNoteModal(student)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Tambah Catatan Penilaian"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* Kontrol Nilai: [▼] Nilai [▲] */}
                    <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => handleScoreChange(student, -5)}
                        disabled={currentVal <= 0}
                        aria-label="Kurangi nilai 5"
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs select-none transition-all ${
                          currentVal <= 0
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white shadow-xs cursor-pointer active:scale-90'
                        }`}
                      >
                        ▼
                      </button>

                      <div
                        className={`w-9 sm:w-11 px-1 py-1 rounded-lg border text-center flex items-center justify-center font-black text-xs sm:text-sm tracking-tight transition-all duration-300 shadow-2xs ${scoreStyle.card}`}
                        title={`Nilai ${categoryLabel}: ${currentVal}`}
                      >
                        {currentVal}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleScoreChange(student, 5)}
                        disabled={currentVal >= 100}
                        aria-label="Tambah nilai 5"
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs select-none transition-all ${
                          currentVal >= 100
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs cursor-pointer active:scale-90'
                        }`}
                      >
                        ▲
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Tidak ada siswa ditemukan pada kelas ini.
            </div>
          )}
        </div>
      )}

      {/* Modal Edit Catatan Siswa */}
      {editingStudentId && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 my-auto max-h-[88vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                Catatan Penilaian Guru IPA
              </h3>
              <button
                type="button"
                onClick={() => setEditingStudentId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              rows={3}
              placeholder="Tuliskan catatan kemampuan sains atau sikap ilmiah..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingStudentId(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSaveNotes(editingStudentId)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
