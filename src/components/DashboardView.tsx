import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Award,
  ChevronRight,
  Layers,
  X,
  MessageSquare,
  Sparkles,
  ClipboardList,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { ClassRoom, Student } from '../types';
import { getScoreColorScheme } from './StudentPortalView';
import { calculateStudentGrades, getIpaPredicate, getQuoteForIpaScore } from '../utils/gradeCalculations';

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

interface DashboardViewProps {
  classes: ClassRoom[];
  students: Student[];
  attitudeMeetingsCount?: number;
  assignmentCount?: number;
  examCount?: number;
  onSelectClass: (classroom: ClassRoom) => void;
  onOpenAdminModal: (defaultTab?: 'csv' | 'codes') => void;
  onUpdateScore?: (studentId: string, newScore: number) => void;
  onUpdateNotes?: (studentId: string, notes: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  classes,
  students,
  attitudeMeetingsCount = 8,
  assignmentCount = 5,
  examCount = 4,
  onSelectClass,
}) => {
  const [teacherTab, setTeacherTab] = useState<'classes' | 'all-scores'>('classes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [selectedMeetingIndex, setSelectedMeetingIndex] = useState<number>(0);

  // Auto-select first class if none selected
  React.useEffect(() => {
    if (!selectedClassFilter && classes.length > 0) {
      setSelectedClassFilter(classes[0].name);
    }
  }, [classes, selectedClassFilter]);

  // Statistics per class
  const classStats = useMemo(() => {
    return classes.map((c) => {
      const classStudents = students.filter((s) => s.classId === c.id);
      const studentCount = classStudents.length;
      const finalScores = classStudents.map((s) => calculateStudentGrades(s).finalScore);
      const avgScore =
        studentCount > 0
          ? Math.round(finalScores.reduce((sum, val) => sum + val, 0) / studentCount)
          : 0;
      const pred = getIpaPredicate(avgScore);

      return {
        ...c,
        studentCount,
        averageScore: avgScore,
        predicate: pred,
      };
    });
  }, [classes, students]);

  // Filtered & Sorted Students for Tab 2
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        return selectedClassFilter ? s.className === selectedClassFilter : true;
      })
      .sort((a, b) => {
        const classA = (a.className || '').trim();
        const classB = (b.className || '').trim();
        const classComp = classA.localeCompare(classB, 'id', { numeric: true, sensitivity: 'base' });
        if (classComp !== 0) return classComp;

        const nameA = (a.name || '').trim();
        const nameB = (b.name || '').trim();
        return nameA.localeCompare(nameB, 'id', { sensitivity: 'base' });
      });
  }, [students, selectedClassFilter]);

  const activeClassColorScheme = useMemo(() => {
    if (!selectedClassFilter) return CLASS_GRADIENTS[0];
    const classIdx = classes.findIndex(
      (c) => c.name.toLowerCase().trim() === selectedClassFilter.toLowerCase().trim()
    );
    return CLASS_GRADIENTS[classIdx !== -1 ? classIdx % CLASS_GRADIENTS.length : 0];
  }, [classes, selectedClassFilter]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-4 animate-fadeIn">
      {/* 2 MAIN TABS ON TEACHER PAGE */}
      <div className="grid grid-cols-2 bg-slate-200/80 p-1.5 rounded-2xl gap-1 max-w-xl mx-auto shadow-inner">
        <button
          type="button"
          onClick={() => setTeacherTab('classes')}
          className={`flex items-center justify-center py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
            teacherTab === 'classes'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>MENILAI PER KELAS</span>
        </button>

        <button
          type="button"
          onClick={() => setTeacherTab('all-scores')}
          className={`flex items-center justify-center py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
            teacherTab === 'all-scores'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>REKAP NILAI IPA & TIK</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR SEMUA KELAS */}
      {teacherTab === 'classes' && (
        <div className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {classStats.map((cls, idx) => {
              const shortName = cls.name.replace(/^Kelas\s+/i, '').trim();
              const isTik = shortName.toUpperCase().includes('TIK');
              const colorScheme = isTik
                ? {
                    gradient: 'from-blue-700 via-indigo-700 to-cyan-900',
                    border: 'border-cyan-400/50',
                    glow: 'bg-cyan-400/20',
                  }
                : CLASS_GRADIENTS[idx % CLASS_GRADIENTS.length];

              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => onSelectClass(cls)}
                  className={`w-full aspect-[2.1/1] sm:aspect-square bg-gradient-to-br ${colorScheme.gradient} text-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col items-center justify-center shadow-lg hover:shadow-2xl hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white/80 relative overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
                  <div className={`absolute -right-4 -bottom-4 w-20 h-20 ${colorScheme.glow} rounded-full blur-xl pointer-events-none`} />

                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/25 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-xs">
                    {isTik ? '💻 TIK' : '🌿 IPA'}
                  </div>

                  <span className="font-black text-xl sm:text-2xl lg:text-3xl tracking-tight drop-shadow-xs group-hover:scale-105 transition-transform mt-2">
                    {shortName || cls.name}
                  </span>

                  <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] sm:text-xs font-bold backdrop-blur-xs">
                    Rata: {cls.averageScore}
                  </div>
                </button>
              );
            })}
          </div>

          {classes.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-700">Belum ada kelas terdaftar</h4>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DAFTAR NILAI SEMUA KELAS */}
      {teacherTab === 'all-scores' && (
        <div className="space-y-4">
          {/* BANNER KELAS TERPILIH */}
          <div className={`bg-gradient-to-r ${activeClassColorScheme.gradient} text-white p-4 sm:p-6 rounded-3xl shadow-md border ${activeClassColorScheme.border} flex items-center justify-between gap-4`}>
            <div>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-200 block mb-1 opacity-90">
                REKAP NILAI MATA PELAJARAN IPA
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase drop-shadow-xs">
                {selectedClassFilter ? `KELAS ${selectedClassFilter.replace(/^Kelas\s+/i, '')}` : 'SEMUA KELAS'}
              </h2>
            </div>
            <div className="text-right shrink-0 bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/20">
              <div className="text-2xl sm:text-3xl font-black">{filteredStudents.length}</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-white/80 uppercase tracking-wider">Siswa</div>
            </div>
          </div>

          {/* Controls Bar: Pilih Kelas */}
          <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <label className="text-xs sm:text-sm font-extrabold text-slate-800 shrink-0">Pilih Kelas:</label>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-50 border-2 border-emerald-600 rounded-xl text-xs sm:text-sm font-black text-emerald-950 shadow-xs cursor-pointer"
                >
                  <option value="">Semua Kelas ({classes.length} Kelas)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Legend Bobot */}
              <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-600">
                <span className="text-blue-700">Tugas: 30%</span>
                <span>•</span>
                <span className="text-purple-700">Ulangan: 40%</span>
                <span>•</span>
                <span className="text-teal-700">Sikap: 30%</span>
              </div>
            </div>
          </div>

          {/* Grid Kotak Nilai Siswa */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span>Menampilkan {filteredStudents.length} Siswa</span>
            </div>

            {filteredStudents.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {filteredStudents.map((st, idx) => {
                  const grades = calculateStudentGrades(st);
                  const style = getScoreColorScheme(grades.finalScore);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStudentForModal(st)}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all p-3 flex flex-col justify-between space-y-2 text-left cursor-pointer active:scale-95 group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 truncate max-w-[85%]">
                            {st.className}
                          </span>
                        </div>

                        <h4
                          className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2"
                          title={st.name}
                        >
                          {idx + 1}. {st.name}
                        </h4>
                      </div>

                      {/* Kotak Nilai Akhir */}
                      <div className={`p-2.5 rounded-xl text-center border ${style.card}`}>
                        <div className="text-2xl sm:text-3xl font-black tracking-tight">
                          {grades.finalScore}
                        </div>
                        <div className="text-[9px] font-extrabold uppercase mt-0.5 tracking-wider opacity-90 truncate">
                          {style.predicate}
                        </div>
                      </div>

                      {/* Mini Pills: Tugas, Ulangan, Sikap */}
                      <div className="grid grid-cols-3 gap-1 text-[9px] font-black text-center pt-1 border-t border-slate-100">
                        <div className="bg-blue-50 text-blue-800 rounded p-0.5" title="Nilai Tugas">
                          T: {grades.assignmentAvg}
                        </div>
                        <div className="bg-purple-50 text-purple-800 rounded p-0.5" title="Nilai Ulangan">
                          U: {grades.examAvg}
                        </div>
                        <div className="bg-teal-50 text-teal-800 rounded p-0.5" title="Nilai Sikap">
                          S: {grades.attitudeAvg}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
                <Award className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Tidak ada data penilaian siswa ditemukan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Popup Detail Siswa */}
      {selectedStudentForModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 bg-slate-900/75 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 p-4 sm:p-5 relative space-y-3 my-auto max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedStudentForModal(null)}
                className="absolute right-3 top-3 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="pr-7 space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
                  {selectedStudentForModal.className}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 truncate leading-tight pt-0.5">
                  {selectedStudentForModal.name}
                </h3>
                <div className="text-xs text-slate-500 font-mono">
                  NISN: {selectedStudentForModal.nisn}
                </div>
              </div>

              {(() => {
                const grades = calculateStudentGrades(selectedStudentForModal);
                const style = getScoreColorScheme(grades.finalScore);
                const quote = getQuoteForIpaScore(
                  grades.finalScore,
                  selectedStudentForModal.nisn || selectedStudentForModal.id
                );

                return (
                  <div className="space-y-3">
                    {/* Nilai Akhir Card */}
                    <div className={`p-3 rounded-2xl text-center border shadow-2xs ${style.card}`}>
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                        Nilai Akhir Rapor IPA
                      </div>
                      <div className="text-3xl font-black tracking-tight my-0.5">
                        {grades.finalScore}
                      </div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider">
                        Predikat: {style.predicate}
                      </div>
                    </div>

                    {/* 3 Rincian Komponen */}
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-blue-50 border border-blue-200 p-2 rounded-xl">
                        <div className="text-[9px] font-bold text-blue-700 uppercase">Tugas (30%)</div>
                        <div className="text-lg font-black text-blue-900 mt-0.5">{grades.assignmentAvg}</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 p-2 rounded-xl">
                        <div className="text-[9px] font-bold text-purple-700 uppercase">Ulangan (40%)</div>
                        <div className="text-lg font-black text-purple-900 mt-0.5">{grades.examAvg}</div>
                      </div>
                      <div className="bg-teal-50 border border-teal-200 p-2 rounded-xl">
                        <div className="text-[9px] font-bold text-teal-700 uppercase">Sikap (30%)</div>
                        <div className="text-lg font-black text-teal-900 mt-0.5">{grades.attitudeAvg}</div>
                      </div>
                    </div>

                    {/* Sikap Per Pertemuan */}
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-1.5">
                      <div className="text-[11px] font-extrabold text-slate-800">
                        Nilai Sikap Ilmiah ({attitudeMeetingsCount} Pertemuan):
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {Array.from({ length: attitudeMeetingsCount }, (_, idx) => {
                          const mScore = selectedStudentForModal.meetingScores?.[idx] ?? (idx === 0 ? selectedStudentForModal.score : null);
                          const mStyle = getScoreColorScheme(mScore);
                          return (
                            <div key={idx} className={`p-1 rounded-lg border text-center ${mStyle.card}`}>
                              <div className="text-[8px] font-bold opacity-80">P{idx + 1}</div>
                              <div className="text-xs font-black">{mScore ?? '-'}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-xs italic text-slate-600 border-l-2 border-emerald-500 pl-2">
                      "{quote}"
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
