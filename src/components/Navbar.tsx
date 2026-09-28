import React from 'react';
import {
  User,
  LogOut,
  FileSpreadsheet,
  ShieldCheck,
  LayoutDashboard,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { CurrentUser, ActivePage } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentUser: CurrentUser | null;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onLogout: () => void;
  onExportAll: () => void;
  firebaseConnected: boolean;
  hasPendingChanges?: boolean;
  pendingChangesCount?: number;
  onSaveToFirebase?: () => Promise<void>;
  isSavingToFirebase?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activePage,
  onNavigate,
  onLogout,
  onExportAll,
  firebaseConnected,
  hasPendingChanges = false,
  pendingChangesCount = 0,
  onSaveToFirebase,
  isSavingToFirebase = false,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 sm:flex-initial">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center p-0.5 shadow-inner shrink-0 overflow-hidden">
              <img
                src="https://i.ibb.co.com/fYM6GQ11/ipa7.png"
                alt="Logo Penilaian IPA"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-900/90 text-emerald-200 border border-emerald-600/50 shrink-0">
                  {activePage === 'admin-portal' ? 'Panel Admin' : 'Guru Mapel IPA'}
                </span>
                <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] text-emerald-200">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      firebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>{firebaseConnected ? 'Online' : 'Offline'}</span>
                </span>
              </div>
              <h1 className="text-xs sm:text-base font-black tracking-tight text-white leading-tight truncate pt-0.5">
                E-Penilaian IPA
              </h1>
            </div>
          </div>

          {/* Action buttons & User profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {currentUser && currentUser.role === 'admin' && (
              <div className="flex items-center space-x-1 bg-emerald-900/70 p-0.5 sm:p-1 rounded-xl border border-emerald-700">
                <button
                  type="button"
                  onClick={() => onNavigate('admin-portal')}
                  className={`flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                    activePage === 'admin-portal'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-700/50'
                  }`}
                  title="Portal Admin"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline">Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className={`flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                    activePage === 'dashboard' || activePage === 'class-detail'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-700/50'
                  }`}
                  title="Dashboard Kelas"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline">Kelas</span>
                </button>
              </div>
            )}

            {/* Status Real-time Firebase Sync */}
            {currentUser && currentUser.role !== 'student' && !onSaveToFirebase && (
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-900/70 rounded-xl border border-emerald-600/40 text-[11px] font-bold text-emerald-200">
                <span className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{firebaseConnected ? 'Live Real-time' : 'Offline'}</span>
              </div>
            )}

            {/* Tombol Simpan ke Firebase (opsional jika staging) */}
            {currentUser && currentUser.role !== 'student' && onSaveToFirebase && (
              <button
                type="button"
                onClick={onSaveToFirebase}
                disabled={isSavingToFirebase || !hasPendingChanges}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  hasPendingChanges
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-2 ring-amber-300/80 active:scale-95'
                    : 'bg-emerald-700/60 text-emerald-200 border border-emerald-600/50 hover:bg-emerald-700'
                }`}
                title={
                  hasPendingChanges
                    ? `Ada ${pendingChangesCount} perubahan data belum disimpan ke Firebase.`
                    : 'Data telah tersimpan di Firebase'
                }
              >
                <Save className={`w-3.5 h-3.5 ${isSavingToFirebase ? 'animate-spin' : ''}`} />
                <span>
                  {isSavingToFirebase
                    ? 'Menyimpan...'
                    : hasPendingChanges
                    ? `Simpan (${pendingChangesCount})`
                    : 'Tersimpan'}
                </span>
              </button>
            )}

            {/* PWA Install Button */}
            <PWAInstallButton variant="navbar" />

            {currentUser && currentUser.role !== 'student' && (
              <button
                type="button"
                onClick={onExportAll}
                className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl transition-colors border border-emerald-500/40 shadow-xs cursor-pointer"
                title="Unduh rekapitulasi semua kelas dalam file Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Ekspor (.xlsx)</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-emerald-700">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-300 capitalize">
                    {currentUser.role === 'admin'
                      ? 'Administrator'
                      : currentUser.role === 'teacher'
                      ? 'Guru Pembina'
                      : `Siswa (${currentUser.identifier})`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/80 transition-colors cursor-pointer"
                  title="Keluar / Ganti Akun"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
