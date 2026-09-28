import React, { useState } from 'react';
import { ScanLine, Leaf, Sparkles, RefreshCw } from 'lucide-react';
import { Student, TeacherCode, CurrentUser } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginViewProps {
  students: Student[];
  teacherCodes: TeacherCode[];
  onLoginSuccess: (user: CurrentUser) => void;
  isPreloaded?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({
  students,
  teacherCodes,
  onLoginSuccess,
}) => {
  const [inputValue, setInputValue] = useState(() => {
    try {
      return localStorage.getItem('smpn1bks_saved_code') || '';
    } catch (_) {
      return '';
    }
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const saveLastCode = (code: string) => {
    try {
      localStorage.setItem('smpn1bks_saved_code', code);
    } catch (_) {}
  };

  const attemptLogin = (rawValue: string) => {
    setErrorMessage('');
    const clean = rawValue.trim();

    if (!clean) {
      setErrorMessage('Masukkan NISN siswa atau kode login.');
      return;
    }

    const cleanLower = clean.toLowerCase();

    // 1. Kode Khusus Masuk Portal Admin (admin123)
    if (cleanLower === 'admin123') {
      saveLastCode(clean);
      onLoginSuccess({
        role: 'admin',
        identifier: 'ADMIN123',
        name: 'Administrator & Koordinator IPA',
      });
      return;
    }

    // 2. Kode Khusus Masuk Sebagai Guru (guru123)
    if (cleanLower === 'guru123') {
      saveLastCode(clean);
      onLoginSuccess({
        role: 'teacher',
        identifier: 'GURU123',
        name: 'Guru Mata Pelajaran IPA',
      });
      return;
    }

    // 3. Kode Khusus Uji Coba Halaman Siswa (siswa123)
    if (cleanLower === 'siswa123') {
      saveLastCode(clean);
      const demoStudent = students[0] || {
        id: 'std-trial-01',
        nisn: 'SISWA123',
        name: 'Siswa Uji Coba (Demo 7A)',
        classId: 'class-7a',
        className: 'Kelas 7A',
        score: 85,
        meetingScores: [85, 90, 85, 90],
        assignmentScores: [88, 85, 90, 85],
        examScores: [85, 90, 88, 92],
        projectTitle: 'Klasifikasi Makhluk Hidup & Ekosistem',
        notes: 'Akun uji coba untuk memantau nilai IPA (Ulangan, Tugas, Sikap).',
      };
      onLoginSuccess({
        role: 'student',
        identifier: demoStudent.nisn,
        name: demoStudent.name,
        studentData: demoStudent,
      });
      return;
    }

    // 4. Cek NISN Siswa dari database
    const foundStudent = students.find(
      (s) => s.nisn.toLowerCase() === cleanLower
    );
    if (foundStudent) {
      saveLastCode(clean);
      onLoginSuccess({
        role: 'student',
        identifier: foundStudent.nisn,
        name: foundStudent.name,
        studentData: foundStudent,
      });
      return;
    }

    // 5. Cek Kode Akses Guru / Admin dari database
    const cleanUpper = clean.toUpperCase();
    const foundTeacher = teacherCodes.find(
      (tc) => tc.code.toUpperCase() === cleanUpper
    );
    if (foundTeacher) {
      saveLastCode(clean);
      onLoginSuccess({
        role: foundTeacher.role,
        identifier: foundTeacher.code,
        name: foundTeacher.name,
        teacherData: foundTeacher,
      });
      return;
    }

    setErrorMessage('NISN atau Kode tidak terdaftar.');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    attemptLogin(inputValue);
  };

  const handleScanSuccess = (scannedText: string) => {
    setInputValue(scannedText);
    attemptLogin(scannedText);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center px-4 py-8 bg-gradient-to-br from-teal-500 via-teal-700 to-blue-900 text-white overflow-hidden select-none">
      {/* Styles for slow-floating particles & 3D Rotate Y */}
      <style>{`
        @keyframes rotateY3D {
          0% { transform: perspective(900px) rotateY(0deg); }
          50% { transform: perspective(900px) rotateY(180deg); }
          100% { transform: perspective(900px) rotateY(360deg); }
        }
        .anim-rotate-y {
          animation: rotateY3D 20s linear infinite;
          transform-style: preserve-3d;
          will-change: transform;
        }
        @keyframes floatSlow {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }
        @keyframes floatFast {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-90deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .anim-float-1 { animation: floatSlow 18s ease-in-out infinite; }
        .anim-float-2 { animation: floatSlow 24s ease-in-out infinite 2s; }
        .anim-float-3 { animation: floatSlow 28s ease-in-out infinite 4s; }
        .anim-float-4 { animation: floatFast 14s ease-in-out infinite 1s; }
        .anim-float-5 { animation: floatFast 20s ease-in-out infinite 3s; }
      `}</style>

      {/* Floating subtle science organic particles in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.10] z-0">
        <div className="absolute top-[12%] left-[8%] anim-float-1 text-teal-200">
          <Sparkles className="w-24 h-24 stroke-[1]" />
        </div>
        <div className="absolute top-[60%] left-[6%] anim-float-2 text-cyan-200">
          <Leaf className="w-20 h-20 stroke-[1]" />
        </div>
        <div className="absolute top-[20%] right-[10%] anim-float-3 text-sky-200">
          <RefreshCw className="w-24 h-24 stroke-[1]" />
        </div>
        <div className="absolute bottom-[18%] right-[8%] anim-float-4 text-amber-200">
          <Sparkles className="w-20 h-20 stroke-[1]" />
        </div>
        <div className="absolute top-[48%] left-[46%] anim-float-5 text-white">
          <Sparkles className="w-16 h-16 stroke-[1]" />
        </div>
      </div>

      {/* Spacer top */}
      <div />

      {/* Main Login Container */}
      <div className="w-full max-w-sm flex flex-col items-center space-y-4 z-10">
        {/* LOGO ROTATE Y DI ATAS HALAMAN LOGIN (Besar & Rotate Y Lebih Pelan) */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative group p-2">
            {/* Ambient soft glow */}
            <div className="absolute inset-0 bg-teal-300/35 rounded-full blur-3xl scale-150 pointer-events-none" />
            <img
              src="https://i.ibb.co.com/fYM6GQ11/ipa7.png"
              alt="Logo Penilaian IPA"
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] anim-rotate-y relative z-10"
              loading="eager"
            />
          </div>
        </div>

        {/* Judul di atas kolom login - 2 Baris untuk Mata Pelajaran IPA & Ulangan Tugas Sikap */}
        <div className="text-center px-2 space-y-1.5">
          <h1 className="font-extrabold tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-amber-300 uppercase text-3xl sm:text-4xl drop-shadow-md">
            Penilaian
          </h1>
          
          <div className="font-extrabold tracking-wider uppercase block leading-snug max-w-xs mx-auto">
            <div className="text-xs sm:text-sm text-teal-100 font-black">
              Mata Pelajaran IPA
            </div>
            <div className="text-[11px] sm:text-xs text-amber-300 font-extrabold mt-0.5 tracking-wide">
              Ulangan • Tugas • Sikap
            </div>
          </div>
          
          <div className="w-10 h-1 bg-amber-400 mx-auto rounded-full my-2 opacity-80" />
          
          <h3 className="font-semibold text-xs sm:text-xs text-teal-100/90 tracking-widest uppercase block">
            SMP Negeri 1 Bengkalis
          </h3>
        </div>

        {/* Kolom yang di tengah jadi TOSKA */}
        <div className="w-full bg-[#0d5c63]/95 sm:bg-[#0d5c63]/92 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-teal-300/45 p-5 sm:p-7 space-y-4 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              {/* Keterangan di atas kolom */}
              <label className="block text-[10px] font-black text-teal-100 uppercase tracking-widest mb-2.5">
                MASUKKAN NISN
              </label>

              {/* UNIFIED INPUT + SCAN BUTTON IN ONE SINGLE FIELD */}
              <div className="relative flex items-center bg-[#063b40]/90 rounded-2xl border-2 border-teal-300/50 focus-within:border-teal-200 focus-within:ring-2 focus-within:ring-teal-200/40 overflow-hidden shadow-inner transition-all">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="NISN"
                  autoFocus
                  className="w-full pl-4 pr-12 py-3.5 text-sm font-black text-white placeholder:text-teal-200/50 bg-transparent uppercase border-none outline-none focus:outline-none focus:ring-0"
                />

                {/* Tombol Scan Barcode di satukan di ujung kanan kolom */}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute right-2 p-2 bg-gradient-to-r from-teal-700 to-cyan-800 text-teal-100 hover:from-teal-600 hover:to-cyan-700 rounded-xl transition-all cursor-pointer shrink-0 active:scale-90 shadow-sm border border-teal-400/40"
                  title="Scan Barcode / QR Kamera"
                >
                  <ScanLine className="w-4 h-4" />
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="text-xs text-rose-200 font-bold px-3 bg-rose-950/80 border border-rose-500/60 py-2.5 rounded-xl flex items-center space-x-1.5 animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Tombol Masuk: Warna TOSKA GELAP, Tulisan "MASUK" & Font Menyesuaikan */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-[#053238] hover:bg-[#074149] active:bg-[#032328] text-teal-50 font-black rounded-2xl text-sm sm:text-base tracking-wider uppercase border-2 border-teal-400/60 shadow-lg shadow-[#053238]/50 transition-all cursor-pointer active:scale-95"
            >
              MASUK
            </button>
          </form>

          {/* Quick PWA Install Option */}
          <div className="pt-1 flex justify-center">
            <PWAInstallButton variant="login" />
          </div>
        </div>
      </div>

      {/* Footer By : PAK MUSLIM, S.Pd (Miring / Italic) */}
      <footer className="text-center pt-8 pb-3 z-10">
        <p className="text-xs sm:text-sm text-white font-extrabold tracking-widest flex items-center justify-center space-x-1.5 drop-shadow-sm">
          <span className="text-amber-300 font-black italic">By : PAK MUSLIM, S.Pd</span>
        </p>
      </footer>

      {/* Modal Scanner Kamera Barcode */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};


