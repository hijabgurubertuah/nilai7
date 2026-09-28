import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera, X, RefreshCw, Zap } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (resultText: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
      return;
    }

    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    codeReader
      .listVideoInputDevices()
      .then((videoInputDevices) => {
        setCameras(videoInputDevices);
        if (videoInputDevices.length > 0) {
          // Prefer environment / back camera
          const backCamera = videoInputDevices.find(
            (device) =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
          );
          const chosenId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;
          setSelectedCameraId(chosenId);
          startScanning(chosenId);
        } else {
          setCameraError('Kamera tidak ditemukan pada perangkat ini.');
        }
      })
      .catch((err) => {
        console.error('Error listing cameras:', err);
        setCameraError('Izin akses kamera ditolak atau tidak tersedia.');
      });

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
    };
  }, [isOpen]);

  const startScanning = (deviceId: string) => {
    if (!codeReaderRef.current || !videoRef.current) return;
    setCameraError('');

    codeReaderRef.current.reset();

    // High resolution and focus constraints for close-up scanning
    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        // Advanced focus mode for close-up scanning if browser supports it
        // @ts-ignore
        focusMode: { ideal: 'continuous' },
      },
    };

    navigator.mediaDevices
      ?.getUserMedia(constraints)
      .then((stream) => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();

        // Check torch capability
        const track = stream.getVideoTracks()[0];
        // @ts-ignore
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }

        // Start decode from video element
        codeReaderRef.current?.decodeFromStream(
          stream,
          videoRef.current,
          (result, err) => {
            if (result) {
              const text = result.getText().trim();
              if (text) {
                // Audio beep feedback if supported
                try {
                  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const osc = audioCtx.createOscillator();
                  const gain = audioCtx.createGain();
                  osc.connect(gain);
                  gain.connect(audioCtx.destination);
                  osc.frequency.value = 880;
                  gain.gain.value = 0.2;
                  osc.start();
                  setTimeout(() => {
                    osc.stop();
                    audioCtx.close();
                  }, 120);
                } catch (e) {}

                onScanSuccess(text);
                onClose();
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              // Ignore standard frame not found error
            }
          }
        );
      })
      .catch((err) => {
        console.warn('getUserMedia error:', err);
        // Fallback to simpler decodeFromVideoDevice
        codeReaderRef.current?.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, err) => {
            if (result) {
              const text = result.getText().trim();
              if (text) {
                onScanSuccess(text);
                onClose();
              }
            }
          }
        );
      });
  };

  const toggleTorch = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    if (track) {
      const nextTorch = !torchOn;
      // Use any cast for non-standard track constraints like torch
      (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    }
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextDevice = cameras[nextIndex];
    setSelectedCameraId(nextDevice.deviceId);
    startScanning(nextDevice.deviceId);
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col items-center my-auto max-h-[90vh]">
        {/* Header Action */}
        <div className="w-full flex items-center justify-between p-4 z-10 text-white">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Scan Barcode / QR
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Viewport with Close-up Focus Reticle */}
        <div className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />

          {/* Scanner Overlay Box */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened borders around scan area */}
            <div className="relative w-64 h-64 border-2 border-emerald-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

              {/* Animated Red Laser Scan Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_red] animate-scan" />
            </div>
          </div>

          {cameraError && (
            <div className="absolute inset-x-4 bg-rose-600/90 text-white p-3 rounded-xl text-xs text-center">
              {cameraError}
            </div>
          )}
        </div>

        {/* Controls Toolbar: Torch & Switch Camera */}
        <div className="w-full p-4 flex items-center justify-center space-x-4 bg-slate-900 border-t border-slate-800">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-3 rounded-full border transition-colors ${
                torchOn
                  ? 'bg-amber-400 border-amber-300 text-slate-950'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Lampu Kilat / Flash"
            >
              <Zap className="w-5 h-5" />
            </button>
          )}

          {cameras.length > 1 && (
            <button
              type="button"
              onClick={switchCamera}
              className="p-3 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Ganti Kamera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
