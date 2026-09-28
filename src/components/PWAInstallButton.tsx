import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'login' | 'floating';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Common button styling based on variant
  const getButtonClass = () => {
    if (variant === 'login') {
      return 'inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md border border-emerald-400/40 transition-all cursor-pointer active:scale-95';
    }
    if (variant === 'floating') {
      return 'fixed bottom-4 right-4 z-40 flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-xl border border-white/20 text-xs font-black hover:scale-105 active:scale-95 transition-all cursor-pointer';
    }
    // Default navbar
    return 'inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer bg-amber-400 hover:bg-amber-300 text-slate-950 ring-2 ring-amber-300/80 active:scale-95';
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={getButtonClass()}
        title="Instal aplikasi ini di perangkat Anda untuk akses cepat & offline"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Instal Aplikasi</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={getButtonClass()}
          title="Petunjuk instal aplikasi di iPhone / iPad"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Instal di HP</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-emerald-500/30 p-6 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <img
                    src="https://i.ibb.co.com/fYM6GQ11/ipa7.png"
                    alt="Logo Nilai IPA7"
                    className="w-8 h-8 rounded-lg object-contain"
                  />
                  <h3 className="text-sm font-black text-white">Instal Nilai IPA7</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div className="p-2 bg-emerald-600/30 rounded-lg text-emerald-400 shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">1. Ketuk tombol Bagikan (Share)</strong>
                    <span className="text-[11px] text-slate-400">Di bilah bawah browser Safari iPhone Anda.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div className="p-2 bg-amber-500/30 rounded-lg text-amber-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">2. Pilih "Tambah ke Layar Utama"</strong>
                    <span className="text-[11px] text-slate-400">(Add to Home Screen) untuk menginstal aplikasi.</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
