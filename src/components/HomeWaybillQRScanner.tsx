import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  QrCode,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Flashlight,
  Volume2,
  VolumeX,
  FlipHorizontal,
  FileText,
  ArrowRight,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import jsQR from 'jsqr';
import { Language, TrackingItem } from '../types';

interface HomeWaybillQRScannerProps {
  language: Language;
  activeShipments: TrackingItem[];
  onSelectShipmentToTrack: (trackingNumber: string) => void;
  onNavigateTab: (tabId: 'track') => void;
  onNotify?: (message: string) => void;
  className?: string;
  defaultExpanded?: boolean;
}

// Clean helper to extract tracking code from QR text
export function parseWaybillTrackingCode(text: string): string {
  const trimmed = text.trim();

  // 1. JSON payload e.g. {"trackingNumber":"PP-882910-SR"} or {"id":"..."}
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.trackingNumber) return String(parsed.trackingNumber).trim();
      if (parsed.id) return String(parsed.id).trim();
      if (parsed.tracking) return String(parsed.tracking).trim();
      if (parsed.code) return String(parsed.code).trim();
    } catch {
      // Ignore JSON error and continue regex
    }
  }

  // 2. URL payload e.g. https://.../track?id=PP-882910-SR or ?tracking=...
  if (trimmed.includes('http://') || trimmed.includes('https://') || trimmed.includes('track?')) {
    try {
      const url = new URL(trimmed);
      const idParam = url.searchParams.get('id') || url.searchParams.get('tracking') || url.searchParams.get('code') || url.searchParams.get('q');
      if (idParam) return idParam.trim();
    } catch {
      const match = trimmed.match(/[?&](?:id|tracking|code)=([^&#]+)/i);
      if (match && match[1]) return decodeURIComponent(match[1]).trim();
    }
  }

  // 3. Fallback: extract uppercase alphanumeric with dashes e.g. PP-882910-SR
  const codeMatch = trimmed.match(/[A-Z0-9]{2,4}-[0-9]{4,8}-[A-Z0-9]{2,4}/i);
  if (codeMatch) return codeMatch[0].trim().toUpperCase();

  return trimmed;
}

export const HomeWaybillQRScanner: React.FC<HomeWaybillQRScannerProps> = ({
  language,
  activeShipments,
  onSelectShipmentToTrack,
  onNavigateTab,
  onNotify,
  className = '',
  defaultExpanded = true,
}) => {
  const isKm = language === 'km';
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'samples'>('camera');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Synthesize pleasant scan chime
  const playScanChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore audio error
    }
  }, [soundEnabled]);

  // Clean stop camera stream
  const stopCameraStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
  }, []);

  // Handle successful scan and navigate to live tracking details
  const handleScanSuccess = useCallback(
    (rawText: string) => {
      const code = parseWaybillTrackingCode(rawText);
      if (!code) return;

      playScanChime();
      setScannedResult(code);
      stopCameraStream();

      if (onNotify) {
        onNotify(
          isKm
            ? `បានស្កេន Waybill #${code} ជោគជ័យ! កំពុងផ្ទេរទៅកាន់ព័ត៌មានតាមដាន...`
            : `Waybill #${code} scanned! Navigating to tracking details...`
        );
      }

      // Small delay for visual success confirmation feedback
      setTimeout(() => {
        onSelectShipmentToTrack(code);
        onNavigateTab('track');
      }, 500);
    },
    [isKm, onNotify, onSelectShipmentToTrack, onNavigateTab, playScanChime, stopCameraStream]
  );

  // Scan video frame using jsQR
  const scanVideoFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (qrCode && qrCode.data) {
      handleScanSuccess(qrCode.data);
      return;
    }

    animFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [handleScanSuccess]);

  // Start Camera Stream
  const startCameraStream = useCallback(async () => {
    stopCameraStream();
    setCameraError(null);
    setScannedResult(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities?.() as { torch?: boolean };
        setHasTorch(Boolean(capabilities?.torch));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        animFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission')) {
        setCameraError(
          isKm
            ? 'ការអនុញ្ញាតកាមេរ៉ាត្រូវបានបដិសេធ។ សូមបើកសិទ្ធិកាមេរ៉ាក្នុង Browser settings។'
            : 'Camera permission denied. Please allow camera access in browser settings.'
        );
      } else {
        setCameraError(
          isKm
            ? 'មិនអាចបើកកាមេរ៉ាបានទេ៖ ' + errorMsg
            : 'Unable to start camera stream: ' + errorMsg
        );
      }
      setIsCameraActive(false);
    }
  }, [facingMode, isKm, scanVideoFrame, stopCameraStream]);

  // Toggle Torch
  const handleToggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !isTorchOn;
      // @ts-expect-error torch constraint
      await track.applyConstraints({ advanced: [{ torch: nextTorch }] });
      setIsTorchOn(nextTorch);
    } catch {
      // Ignore
    }
  };

  // Flip Camera
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Restart camera when facing mode changes and camera is active
  useEffect(() => {
    if (isCameraActive) {
      startCameraStream();
    }
  }, [facingMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Process uploaded image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessingImage(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setIsProcessingImage(false);
        if (code && code.data) {
          handleScanSuccess(code.data);
        } else {
          setCameraError(
            isKm
              ? 'មិនអាចរកឃើញ QR Code ឬបាកូដលើរូបភាពនេះទេ។ សូមសាកល្បងរូបភាពច្បាស់ជាងនេះ។'
              : 'No readable QR code or barcode found in this image. Please upload a clear label photo.'
          );
        }
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        setCameraError(isKm ? 'រូបភាពមិនត្រឹមត្រូវ' : 'Invalid image file');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Sample shipments available for 1-click test
  const sampleTrackingNumbers = activeShipments.length > 0 
    ? activeShipments.slice(0, 4) 
    : [
        { trackingNumber: 'PP-882910-SR', carrierName: 'J&T Express Cambodia', receiverCity: 'Siem Reap', statusKm: 'កំពុងឆ្លងកាត់' },
        { trackingNumber: 'BTB-771234-PP', carrierName: 'Virak Buntham Express', receiverCity: 'Phnom Penh', statusKm: 'ចេញដឹកដល់ផ្ទះ' },
        { trackingNumber: 'KMP-994321-PP', carrierName: 'Capitol Logistics', receiverCity: 'Phnom Penh', statusKm: 'បានមកដល់ឃ្លាំង' },
      ];

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden transition-all ${className}`}>
      {/* Header Accent Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-4 sm:p-5 text-white flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-lg shadow-emerald-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-white tracking-wide">
                {isKm ? 'ស្កេនបាកូដ ឬ QR តាមដានកញ្ចប់' : 'Quick Waybill QR Scanner'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-2xs">
                {isKm ? 'ស្វ័យប្រវត្ត' : 'Auto-Track'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isKm
                ? 'ស្កេនកូដ QR លើប័ណ្ណដឹកជញ្ជូន ដើម្បីចូលមើលស្ថានភាពកញ្ចប់ភ្លាមៗ'
                : 'Scan physical waybill QR code to navigate directly to live tracking details'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isExpanded && isCameraActive) stopCameraStream();
            setIsExpanded(!isExpanded);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/15 cursor-pointer"
        >
          <span>{isExpanded ? (isKm ? 'បង្រួម' : 'Collapse') : (isKm ? 'បើកម៉ាស៊ីនស្កេន' : 'Open Scanner')}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Navigation Sub-Tabs: Live Camera vs Photo Upload vs Samples */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('camera');
                  setCameraError(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeMode === 'camera'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isKm ? 'កាមេរ៉ាផ្ទាល់ (Camera)' : 'Live Camera'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setActiveMode('upload');
                  setCameraError(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeMode === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>{isKm ? 'បញ្ចូលរូបភាព (Upload)' : 'Upload Image'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setActiveMode('samples');
                  setCameraError(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeMode === 'samples'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isKm ? 'កូដគំរូ (Quick Test)' : 'Sample Waybills'}</span>
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title={soundEnabled ? 'Mute beep' : 'Enable scan sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          {/* Success Banner when scanned */}
          {scannedResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-emerald-950 block">
                    {isKm ? 'ស្កេនជោគជ័យ! កំពុងផ្ទេរទៅការតាមដាន...' : 'Scan Successful! Navigating...'}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-800">
                    Waybill #{scannedResult}
                  </span>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            </div>
          )}

          {/* Error Message if any */}
          {cameraError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{cameraError}</span>
              </div>
            </div>
          )}

          {/* TAB 1: LIVE CAMERA VIEWFINDER */}
          {activeMode === 'camera' && (
            <div className="space-y-3">
              <div className="relative w-full max-w-md mx-auto aspect-4/3 bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                />

                {/* Hidden canvas for jsQR analysis */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewfinder Overlay when Camera is Active */}
                {isCameraActive ? (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    {/* Targeting Box */}
                    <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-3xl border-2 border-emerald-400/90 shadow-2xl flex items-center justify-center">
                      {/* Corner Target Accents */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                      {/* Moving Laser Sweep Bar */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400 animate-pulse" />
                    </div>

                    <p className="text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-700 mt-4 shadow-md">
                      {isKm ? 'ដាក់បាកូដ ឬ QR ក្នុងប្រអប់ដើម្បីស្កេន' : 'Align Waybill QR code inside the box'}
                    </p>
                  </div>
                ) : (
                  /* Idle Camera Placeholder */
                  <div className="text-center p-6 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-200">
                        {isKm ? 'កាមេរ៉ាមិនទាន់បើក' : 'Camera is currently stopped'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto">
                        {isKm
                          ? 'ចុចប៊ូតុងខាងក្រោមដើម្បីបើកកាមេរ៉ា និងស្កេនកូដលើកញ្ចប់'
                          : 'Click below to activate device camera and scan physical waybill'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={startCameraStream}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-900/30 transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isKm ? 'បើកកាមេរ៉ាស្កេន' : 'Start Camera Scanner'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Active Controls Bar */}
              {isCameraActive && (
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CameraOff className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isKm ? 'បិទកាមេរ៉ា' : 'Stop Camera'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Flip camera"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isKm ? 'ប្តូរកាមេរ៉ា' : 'Flip Camera'}</span>
                  </button>

                  {hasTorch && (
                    <button
                      type="button"
                      onClick={handleToggleTorch}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isTorchOn
                          ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Toggle Flashlight"
                    >
                      <Flashlight className="w-3.5 h-3.5" />
                      <span>{isTorchOn ? (isKm ? 'ភ្លើង៖ បើក' : 'Torch ON') : (isKm ? 'ភ្លើង' : 'Torch')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE */}
          {activeMode === 'upload' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/60 hover:bg-emerald-50/20 group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 flex items-center justify-center mb-2 shadow-xs transition">
                  {isProcessingImage ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">
                  {isKm ? 'ចុចទីនេះដើម្បីជ្រើសរើសរូបភាព ឬថតប័ណ្ណ' : 'Click to upload waybill photo or screenshot'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {isKm
                    ? 'គាំទ្រទម្រង់ JPG, PNG ឬ WebP។ ប្រព័ន្ធនឹងទាញយកលេខកូដស្វ័យប្រវត្ត។'
                    : 'Supports JPG, PNG, WebP images. Tracking number will be parsed instantly.'}
                </p>
              </label>
            </div>
          )}

          {/* TAB 3: SAMPLE WAYBILLS FOR INSTANT TESTING */}
          {activeMode === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                {isKm 
                  ? 'ចុចលើលេខកូដកញ្ចប់គំរូណាមួយ ដើម្បីសាកល្បងការស្កេន និងផ្ទេរទៅ Live Tracking ភ្លាមៗ៖'
                  : 'Click any sample shipment to simulate a rapid scan and auto-navigate to its tracking details:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sampleTrackingNumbers.map((s) => (
                  <button
                    key={s.trackingNumber}
                    type="button"
                    onClick={() => handleScanSuccess(s.trackingNumber)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-slate-900 group-hover:text-emerald-700">
                          #{s.trackingNumber}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                          {s.statusKm || 'សកម្ម'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {s.carrierName} • {s.receiverCity}
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-slate-600 transition shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Input Fallback Strip */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualCodeInput.trim()) {
                    handleScanSuccess(manualCodeInput.trim());
                  }
                }}
                placeholder={isKm ? 'ឬបញ្ចូលលេខតាមដានដោយដៃ (ឧ. PP-882910-SR)...' : 'Or type tracking number manually (e.g. PP-882910-SR)...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <button
              type="button"
              disabled={!manualCodeInput.trim()}
              onClick={() => {
                if (manualCodeInput.trim()) handleScanSuccess(manualCodeInput.trim());
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>{isKm ? 'តាមដានឥឡូវ' : 'Track Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
