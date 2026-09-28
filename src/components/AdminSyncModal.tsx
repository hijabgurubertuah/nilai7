import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  Link as LinkIcon,
  Save,
} from 'lucide-react';
import { ClassRoom, Student, TeacherCode } from '../types';
import { parseStudentCsv, ParsedCsvResult } from '../utils/csvParser';
import { downloadSampleCsvTemplate } from '../utils/excelExport';
import {
  parseGoogleSheetsUrl,
  fetchGoogleSheetCsv,
} from '../utils/googleSheetsSync';
import {
  getSpreadsheetUrlFromDb,
  saveSpreadsheetUrlInDb,
  deleteSpreadsheetUrlInDb,
} from '../services/firestoreService';

interface AdminSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'csv' | 'codes';
  classes: ClassRoom[];
  teacherCodes: TeacherCode[];
  onSyncCsvData: (students: Student[], classes: ClassRoom[]) => Promise<void>;
  onCreateTeacherCode: (newCode: TeacherCode) => Promise<void>;
  onDeleteTeacherCode: (codeId: string) => Promise<void>;
}

export const AdminSyncModal: React.FC<AdminSyncModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'csv',
  classes,
  teacherCodes,
  onSyncCsvData,
  onCreateTeacherCode,
  onDeleteTeacherCode,
}) => {
  const [activeTab, setActiveTab] = useState<'csv' | 'codes'>(defaultTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Sheets state
  const [sheetUrl, setSheetUrl] = useState('');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [isDeletingUrl, setIsDeletingUrl] = useState(false);

  // CSV states
  const [parsedData, setParsedData] = useState<ParsedCsvResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Teacher Code states
  const [newCodeInput, setNewCodeInput] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newRole, setNewRole] = useState<'teacher' | 'admin'>('teacher');
  const [assignedClassId, setAssignedClassId] = useState('');
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getSpreadsheetUrlFromDb().then((url) => {
        if (url) setSheetUrl(url);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // Handle pull data from online sheet link
  const handleFetchOnlineSheet = async () => {
    const cleanUrl = sheetUrl.trim();
    if (!cleanUrl) {
      setErrorMessage('Masukkan link Google Spreadsheet terlebih dahulu.');
      return;
    }

    setIsFetchingSheet(true);
    setErrorMessage('');
    setSyncSuccessMsg('');

    try {
      await saveSpreadsheetUrlInDb(cleanUrl);
      const csvText = await fetchGoogleSheetCsv(cleanUrl);
      const result = parseStudentCsv(csvText);

      if (result.students.length === 0) {
        throw new Error(result.errors.join('; ') || 'Tidak ada data siswa ditemukan.');
      }

      await onSyncCsvData(result.students, result.classes);
      setSyncSuccessMsg(
        `Berhasil memuat ${result.students.length} siswa ke memori lokal. Belum disimpan ke Firebase untuk menghemat kuota tulis harian. Klik tombol "Simpan ke Firebase" untuk menyimpan permanen ke cloud.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menarik data dari Google Spreadsheet.');
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleOpenEditLink = () => {
    const parsed = parseGoogleSheetsUrl(sheetUrl);
    const target = parsed.editUrl || sheetUrl.trim();
    if (target) window.open(target, '_blank', 'noopener,noreferrer');
  };

  const handleSaveUrl = async () => {
    const cleanUrl = sheetUrl.trim();
    if (!cleanUrl) {
      setErrorMessage('Masukkan link spreadsheet terlebih dahulu.');
      return;
    }
    setIsSavingUrl(true);
    setErrorMessage('');
    try {
      await saveSpreadsheetUrlInDb(cleanUrl);
      setSyncSuccessMsg('✓ Link Spreadsheet berhasil disimpan ke Firebase!');
    } catch {
      setErrorMessage('Gagal menyimpan link spreadsheet ke Firebase.');
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleDeleteUrl = async () => {
    setIsDeletingUrl(true);
    setErrorMessage('');
    try {
      await deleteSpreadsheetUrlInDb();
      setSheetUrl('');
      setSyncSuccessMsg('✓ Link Spreadsheet berhasil dihapus dari Firebase.');
    } catch {
      setErrorMessage('Gagal menghapus link spreadsheet dari Firebase.');
    } finally {
      setIsDeletingUrl(false);
    }
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setSyncSuccessMsg('');
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = parseStudentCsv(text);
        setParsedData(result);
        if (result.errors.length > 0 && result.students.length === 0) {
          setErrorMessage(result.errors.join(', '));
        }
      } catch (err: any) {
        setErrorMessage(`Gagal memproses file CSV: ${err.message}`);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Terjadi kesalahan saat membaca file.');
      setIsParsing(false);
    };
    reader.readAsText(file);
  };

  // Handle Sync to Firebase from manual file
  const handleSyncToFirebase = async () => {
    if (!parsedData || parsedData.students.length === 0) return;

    setIsSyncing(true);
    setErrorMessage('');
    setSyncSuccessMsg('');

    try {
      await onSyncCsvData(parsedData.students, parsedData.classes);
      setSyncSuccessMsg(
        `Berhasil menyinkronkan ${parsedData.students.length} siswa ke Firebase Firestore!`
      );
      setParsedData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setErrorMessage(`Gagal sinkronisasi ke Firebase: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Create Teacher Code
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCodeInput.trim().toUpperCase();
    const cleanName = newTeacherName.trim();

    if (!cleanCode || !cleanName) {
      setErrorMessage('Kode akses dan nama wajib diisi.');
      return;
    }

    if (teacherCodes.some((tc) => tc.code.toUpperCase() === cleanCode)) {
      setErrorMessage(`Kode akses "${cleanCode}" sudah digunakan.`);
      return;
    }

    setIsCreatingCode(true);
    setErrorMessage('');

    try {
      const newTeacher: TeacherCode = {
        id: `tc-${Date.now()}`,
        code: cleanCode,
        name: cleanName,
        role: newRole,
        assignedClass: assignedClassId || undefined,
        createdAt: new Date().toISOString(),
      };
      await onCreateTeacherCode(newTeacher);
      setNewCodeInput('');
      setNewTeacherName('');
      setAssignedClassId('');
      setSyncSuccessMsg(`Kode akses "${cleanCode}" berhasil disimpan.`);
    } catch (err: any) {
      setErrorMessage(`Gagal menyimpan kode: ${err.message}`);
    } finally {
      setIsCreatingCode(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 1500);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[88vh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black truncate leading-tight">
                Sinkronisasi Spreadsheet & Kode Guru
              </h3>
              <p className="text-[11px] text-slate-300 truncate">
                Tarik data Google Spreadsheet atau impor file CSV
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('csv');
              setErrorMessage('');
              setSyncSuccessMsg('');
            }}
            className={`flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'csv'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Spreadsheet / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('codes');
              setErrorMessage('');
              setSyncSuccessMsg('');
            }}
            className={`flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'codes'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Kode Guru</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="break-words">{errorMessage}</span>
            </div>
          )}

          {syncSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="break-words">{syncSuccessMsg}</span>
            </div>
          )}

          {activeTab === 'csv' ? (
            <div className="space-y-4">
              {/* Online Google Spreadsheet Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Link Google Spreadsheet</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">nama, kelas, nisn</span>
                </div>

                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSaveUrl}
                    disabled={isSavingUrl || !sheetUrl.trim()}
                    className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className={`w-3.5 h-3.5 ${isSavingUrl ? 'animate-spin' : ''}`} />
                    <span>{isSavingUrl ? 'Menyimpan...' : 'Simpan Link ke Firebase'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteUrl}
                    disabled={isDeletingUrl || !sheetUrl.trim()}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFetchOnlineSheet}
                    disabled={isFetchingSheet || !sheetUrl.trim()}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSheet ? 'animate-spin' : ''}`} />
                    <span>{isFetchingSheet ? 'Menarik data...' : 'Tarik & Update ke Firebase'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenEditLink}
                    disabled={!sheetUrl.trim()}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Buka Spreadsheet</span>
                  </button>
                </div>
              </div>

              {/* Upload File Box */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Atau Unggah File CSV:</span>
                  <button
                    type="button"
                    onClick={downloadSampleCsvTemplate}
                    className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Download className="w-3 h-3" />
                    <span>Unduh Contoh</span>
                  </button>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-xs font-semibold text-slate-700">
                    {isParsing ? 'Memproses File...' : 'Pilih File CSV (.csv)'}
                  </p>
                </div>

                {parsedData && (
                  <button
                    type="button"
                    onClick={handleSyncToFirebase}
                    disabled={isSyncing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs"
                  >
                    {isSyncing ? 'Menyinkronkan...' : `Simpan ${parsedData.students.length} Siswa ke Firebase`}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleCreateCode} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newCodeInput}
                    onChange={(e) => setNewCodeInput(e.target.value.toUpperCase())}
                    placeholder="Kode (misal: GURUIPA)"
                    className="w-full px-3 py-2 text-xs uppercase font-mono font-bold rounded-xl border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingCode}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    {isCreatingCode ? 'Menyimpan...' : 'Simpan Kode'}
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-48 overflow-y-auto">
                {teacherCodes.map((tc) => (
                  <div key={tc.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded mr-2">
                        {tc.code}
                      </span>
                      <span className="font-semibold text-slate-800">{tc.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(tc.code, tc.id)}
                      className="p-1 text-slate-500 hover:text-slate-800"
                    >
                      {copiedCodeId === tc.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
