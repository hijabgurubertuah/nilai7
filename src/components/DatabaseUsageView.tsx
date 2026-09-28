import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Database,
  HardDrive,
  PenTool,
  BookOpen,
  Trash2,
  RefreshCw,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { Student, ClassRoom, TeacherCode } from '../types';
import {
  getQuotaStats,
  QuotaStats,
  calculateRealtimeStorageSize,
  FIREBASE_LIMITS,
} from '../services/quotaService';

interface DatabaseUsageViewProps {
  students: Student[];
  classes: ClassRoom[];
  teacherCodes: TeacherCode[];
  firebaseConnected: boolean;
  onClearStudents: () => Promise<number>;
  onClearTeacherCodes: () => Promise<number>;
  onResetDatabase: () => Promise<void>;
  onDeduplicateStudents: () => Promise<{
    mergedCount: number;
    removedDuplicates: number;
    totalUnique: number;
    removedClassDuplicates?: number;
    removedEmptyClasses?: number;
  }>;
}

interface CompactPieChartProps {
  used: number;
  max: number;
  title: string;
  unit: string;
  colorHex: string;
  subtext?: string;
}

const CompactPieChart: React.FC<CompactPieChartProps> = ({
  used,
  max,
  title,
  unit,
  colorHex,
  subtext,
}) => {
  const percent = Math.min(100, Math.max(0, (used / max) * 100));
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-between text-center space-y-2">
      {/* Judul di atasnya */}
      <div>
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
          {title}
        </h4>
        {subtext && <p className="text-[10px] text-slate-500 font-medium">{subtext}</p>}
      </div>

      {/* Grafik Pai bentuk Donut Compact & Minimalis */}
      <div className="relative w-32 h-32 flex items-center justify-center my-0.5">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-slate-100"
            strokeWidth="11"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={colorHex}
            strokeWidth="11"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Tanpa Icon di Tengah Pai - Hanya Kuota Berapa Persen Terpakai */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-base font-black text-slate-900 tracking-tight leading-none">
            {percent < 0.1 && percent > 0 ? '< 0.1%' : `${percent.toFixed(1)}%`}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            terpakai
          </span>
        </div>
      </div>

      {/* Rincian Angka Bawah */}
      <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <div className="text-left">
          <span className="text-slate-400 block text-[9px] font-bold uppercase">Terpakai</span>
          <span className="font-extrabold text-slate-900">
            {used >= 1000 ? used.toLocaleString('id-ID') : used} {unit}
          </span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block text-[9px] font-bold uppercase">Batas Harian</span>
          <span className="font-extrabold text-slate-700">
            {max >= 1000 ? max.toLocaleString('id-ID') : max} {unit}
          </span>
        </div>
      </div>
    </div>
  );
};

export const DatabaseUsageView: React.FC<DatabaseUsageViewProps> = ({
  students,
  classes,
  teacherCodes,
  firebaseConnected,
  onClearStudents,
  onClearTeacherCodes,
  onResetDatabase,
  onDeduplicateStudents,
}) => {
  const [stats, setStats] = useState<QuotaStats>(getQuotaStats());
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Update stats on custom event and periodically
  useEffect(() => {
    const handleUpdate = () => setStats(getQuotaStats());
    window.addEventListener('quota_stats_updated', handleUpdate);
    const interval = setInterval(handleUpdate, 3000);
    return () => {
      window.removeEventListener('quota_stats_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Compute storage
  const currentBytes = calculateRealtimeStorageSize(
    students.length,
    classes.length,
    teacherCodes.length
  );
  const currentKB = (currentBytes / 1024).toFixed(2);
  const currentMB = (currentBytes / (1024 * 1024)).toFixed(3);
  const storageLimitMB = 1024; // 1 GB
  const storagePercent = Math.max(0.01, Math.min(100, (currentBytes / FIREBASE_LIMITS.MAX_STORAGE_BYTES) * 100));

  // Compute writes
  const writesUsed = stats.writesToday || 0;
  const writesRemaining = Math.max(0, FIREBASE_LIMITS.MAX_WRITES_DAILY - writesUsed);
  const writesPercent = Math.min(100, (writesUsed / FIREBASE_LIMITS.MAX_WRITES_DAILY) * 100);

  // Compute reads
  const readsUsed = stats.readsToday || 0;
  const readsRemaining = Math.max(0, FIREBASE_LIMITS.MAX_READS_DAILY - readsUsed);
  const readsPercent = Math.min(100, (readsUsed / FIREBASE_LIMITS.MAX_READS_DAILY) * 100);

  // Compute deletes
  const deletesUsed = stats.deletesToday || 0;
  const deletesRemaining = Math.max(0, FIREBASE_LIMITS.MAX_DELETES_DAILY - deletesUsed);
  const deletesPercent = Math.min(100, (deletesUsed / FIREBASE_LIMITS.MAX_DELETES_DAILY) * 100);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    isDanger?: boolean;
    actionType: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const handleRunClearStudents = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kosongkan Seluruh Data Siswa?',
      message: `PERINGATAN: Anda akan menghapus SELURUH ${students.length} data siswa di database Firebase Firestore seketika! Tindakan ini langsung menghapus data di seluruh perangkat.`,
      confirmLabel: 'Ya, Kosongkan Semua',
      isDanger: true,
      actionType: 'clear-students',
      onConfirm: async () => {
        setIsActionRunning(true);
        setActionType('clear-students');
        setErrorMsg('');
        try {
          const count = await onClearStudents();
          setSuccessMsg(`Berhasil mengosongkan ${count} data siswa dari database Firebase secara real-time.`);
        } catch (err: any) {
          setErrorMsg(`Gagal membersihkan data siswa: ${err.message}`);
        } finally {
          setIsActionRunning(false);
          setActionType(null);
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleRunClearTeachers = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Bersihkan Kode Guru Tambahan?',
      message: 'Hapus semua kode login guru tambahan di Firebase? (Akun ADMIN123 dan GURU123 akan tetap tersimpan).',
      confirmLabel: 'Ya, Bersihkan Kode',
      isDanger: true,
      actionType: 'clear-teachers',
      onConfirm: async () => {
        setIsActionRunning(true);
        setActionType('clear-teachers');
        setErrorMsg('');
        try {
          const count = await onClearTeacherCodes();
          setSuccessMsg(`Berhasil membersihkan ${count} kode login guru tambahan.`);
        } catch (err: any) {
          setErrorMsg(`Gagal membersihkan kode guru: ${err.message}`);
        } finally {
          setIsActionRunning(false);
          setActionType(null);
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleRunDeduplication = async () => {
    setIsActionRunning(true);
    setActionType('deduplicate');
    setErrorMsg('');
    try {
      const res = await onDeduplicateStudents();
      const details: string[] = [];
      if (res.removedDuplicates > 0) details.push(`${res.removedDuplicates} NISN ganda dibersihkan`);
      if (res.removedClassDuplicates && res.removedClassDuplicates > 0) details.push(`${res.removedClassDuplicates} kelas ganda digabung`);
      if (res.removedEmptyClasses && res.removedEmptyClasses > 0) details.push(`${res.removedEmptyClasses} kelas kosong dihapus`);

      if (details.length > 0) {
        setSuccessMsg(`Pembersihan sukses: ${details.join(', ')}. Database sekarang rapi!`);
      } else {
        setSuccessMsg(`Database bersih: Tidak ada NISN/Kelas ganda atau kelas kosong.`);
      }
    } catch (err: any) {
      setErrorMsg(`Gagal deduplikasi: ${err.message}`);
    } finally {
      setIsActionRunning(false);
      setActionType(null);
    }
  };

  const handleRunReset = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Database ke Bawaan Modul?',
      message: 'Database akan direset ke konfigurasi awal (4 kelas dan akun guru/admin default, daftar siswa bersih). Lanjutkan?',
      confirmLabel: 'Ya, Reset Database',
      isDanger: false,
      actionType: 'reset',
      onConfirm: async () => {
        setIsActionRunning(true);
        setActionType('reset');
        setErrorMsg('');
        try {
          await onResetDatabase();
          setSuccessMsg('Database berhasil direset kembali ke konfigurasi awal modul!');
        } catch (err: any) {
          setErrorMsg(`Gagal reset database: ${err.message}`);
        } finally {
          setIsActionRunning(false);
          setActionType(null);
          setConfirmDialog(null);
        }
      },
    });
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grafik Pai Compact dan Minimalis Kuota Database */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Pai Kuota Baca Firestore */}
        <CompactPieChart
          title="KUOTA BACA FIRESTORE"
          subtext="Batas 50.000 Reads / Hari"
          used={readsUsed}
          max={FIREBASE_LIMITS.MAX_READS_DAILY}
          unit="reads"
          colorHex="#059669"
        />

        {/* 2. Pai Kuota Tulis Firestore */}
        <CompactPieChart
          title="KUOTA TULIS FIRESTORE"
          subtext="Batas 20.000 Writes / Hari"
          used={writesUsed}
          max={FIREBASE_LIMITS.MAX_WRITES_DAILY}
          unit="writes"
          colorHex="#d97706"
        />

        {/* 3. Pai Kapasitas Penyimpanan */}
        <CompactPieChart
          title="KAPASITAS PENYIMPANAN"
          subtext="Batas 1 GB (1.024 MB)"
          used={parseFloat(currentMB)}
          max={storageLimitMB}
          unit="MB"
          colorHex="#2563eb"
        />
      </div>

      {/* Pemeliharaan & Utilitas Database */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Server className="w-4 h-4 text-slate-700" />
          <span>Utilitas & Pemeliharaan Database Firebase</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Tombol 1: Bersihkan NISN & Kelas Ganda */}
          <button
            type="button"
            onClick={handleRunDeduplication}
            disabled={isActionRunning}
            className="flex items-center justify-center space-x-2 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{isActionRunning && actionType === 'deduplicate' ? 'Memindai...' : 'Bersihkan NISN & Kelas Ganda/Kosong'}</span>
          </button>

          {/* Tombol 2: Kosongkan Semua Siswa */}
          <button
            type="button"
            onClick={handleRunClearStudents}
            disabled={isActionRunning}
            className="flex items-center justify-center space-x-2 py-3 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>{isActionRunning && actionType === 'clear-students' ? 'Menghapus...' : 'Kosongkan Semua Siswa'}</span>
          </button>

          {/* Tombol 3: Bersihkan Kode Guru Tambahan */}
          <button
            type="button"
            onClick={handleRunClearTeachers}
            disabled={isActionRunning}
            className="flex items-center justify-center space-x-2 py-3 px-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>{isActionRunning && actionType === 'clear-teachers' ? 'Membersihkan...' : 'Bersihkan Kode Guru Tambahan'}</span>
          </button>
        </div>
      </div>

      {/* MODAL KONFIRMASI UTILITY DATABASE (Tampil di Layar HP & Desktop Tanpa Terhalang Iframe) */}
      {confirmDialog && confirmDialog.isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto border border-slate-200">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-xs border ${
              confirmDialog.isDanger ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}>
              {confirmDialog.isDanger ? <Trash2 className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-base text-slate-900">
                {confirmDialog.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                disabled={isActionRunning}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                disabled={isActionRunning}
                className={`w-full py-2.5 px-3 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95 disabled:opacity-50 ${
                  confirmDialog.isDanger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <span className={isActionRunning ? 'animate-spin' : ''}>
                  {confirmDialog.isDanger ? <Trash2 className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                </span>
                <span>{isActionRunning ? 'Memproses...' : confirmDialog.confirmLabel}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
