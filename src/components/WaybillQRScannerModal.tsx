import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Flashlight, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  FlipHorizontal
} from 'lucide-react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { Language, TrackingItem } from '../types';

interface WaybillQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (trackingNumber: string) => void;
  language: Language;
  activeShipments: TrackingItem[];
}

// Simple audio beep helper for scan feedback
function playScanBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

// Helper to extract tracking code from QR text (handles plain code, JSON, or CamDelivery URLs)
export function parseTrackingCodeFromQR(rawText: string): string {
  if (!rawText) return '';
  const clean = rawText.trim();
  
  // 1. Check if it's a URL like https://camdelivery.kh/track/KH-VAN-882910 or ?track=KH-VAN-882910 or ?code=...
  const urlMatch = clean.match(/(?:track\/|code=|track=|id=|waybill=)([A-Za-z0-9_-]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toUpperCase();
  }

  // 2. Check if it's a JSON payload
  try {
    const parsed = JSON.parse(clean);
    if (parsed.trackingNumber) return String(parsed.trackingNumber).toUpperCase();
    if (parsed.tracking_number) return String(parsed.tracking_number).toUpperCase();
    if (parsed.code) return String(parsed.code).toUpperCase();
    if (parsed.waybill) return String(parsed.waybill).toUpperCase();
    if (parsed.waybill_number) return String(parsed.waybill_number).toUpperCase();
  } catch {
    // Not JSON, continue
  }

  // 3. Match typical Cambodia waybill code formats (e.g., KH-VAN-882910, KH-EX-492011, CD-..., JT-..., VET-...)
  const patternMatch = clean.match(/\b([A-Za-z]{2,5}-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)?)\b/);
  if (patternMatch && patternMatch[1]) {
    return patternMatch[1].toUpperCase();
  }

  return clean.replace(/[\r\n]+/g, ' ').trim().toUpperCase();
}

export const WaybillQRScannerModal: React.FC<WaybillQRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  language,
  activeShipments,
}) => {
  const isKm = language === 'km';
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'sample'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sampleQrDataUrls, setSampleQrDataUrls] = useState<Record<string, string>>({});
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Monitor camera permission status if supported
  useEffect(() => {
    let permObj: PermissionStatus | null = null;
    const queryPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          permObj = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setPermissionStatus(permObj.state as 'prompt' | 'granted' | 'denied');
          permObj.onchange = () => {
            if (permObj) {
              setPermissionStatus(permObj.state as 'prompt' | 'granted' | 'denied');
            }
          };
        }
      } catch {
        // Querying 'camera' is not supported in some browsers
        setPermissionStatus('unknown');
      }
    };
    queryPermission();
    return () => {
      if (permObj) permObj.onchange = null;
    };
  }, []);

  // Generate QR images for sample waybills
  useEffect(() => {
    const generateSampleQrs = async () => {
      const generated: Record<string, string> = {};
      for (const ship of activeShipments) {
        try {
          const url = await QRCode.toDataURL(ship.trackingNumber, {
            margin: 1,
            width: 180,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          generated[ship.trackingNumber] = url;
        } catch (err) {
          console.error('Failed to generate sample QR for', ship.trackingNumber, err);
        }
      }
      setSampleQrDataUrls(generated);
    };

    if (isOpen) {
      generateSampleQrs();
    }
  }, [isOpen, activeShipments]);

  // Handle successful detection
  const handleDetectedCode = useCallback((rawCode: string) => {
    const normalizedCode = parseTrackingCodeFromQR(rawCode);
    setScannedResult(normalizedCode);
    if (soundEnabled) {
      playScanBeep();
    }
    if (navigator.vibrate) {
      try {
        navigator.vibrate([60, 40, 60]);
      } catch {
        // Ignore
      }
    }

    // Stop scanning
    stopCameraStream();

    // Auto-apply after short celebratory pause
    setTimeout(() => {
      onScanSuccess(normalizedCode);
      onClose();
    }, 1200);
  }, [soundEnabled, onScanSuccess, onClose]);

  // Stop camera stream cleanly
  const stopCameraStream = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Scan frame loop using BarcodeDetector if available, falling back to jsQR
  const scanVideoFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    // 1. Try native BarcodeDetector API if available in modern browsers (Chrome/Edge/Android/Safari)
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'data_matrix', 'upc_a'],
        });
        const detected = await barcodeDetector.detect(video);
        if (detected && detected.length > 0 && detected[0].rawValue) {
          handleDetectedCode(detected[0].rawValue);
          return;
        }
      } catch {
        // Fallback to canvas below
      }
    }

    // 2. Universal fallback with jsQR on canvas
    if (!canvas) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    // Scale canvas to max 640px for rapid 60 FPS scanning without lag
    const maxDimension = 640;
    const scale = Math.min(1, maxDimension / Math.max(video.videoWidth || 640, video.videoHeight || 480));
    canvas.width = Math.round((video.videoWidth || 640) * scale);
    canvas.height = Math.round((video.videoHeight || 480) * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code && code.data && code.data.trim().length > 0) {
      handleDetectedCode(code.data);
      return; // Stop scanning loop
    }

    animationFrameId.current = requestAnimationFrame(scanVideoFrame);
  }, [handleDetectedCode]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCameraStream();
    setCameraError(null);
    setScannedResult(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        isKm 
          ? 'កម្មវិធីរុករកនេះមិនគាំទ្រការប្រើប្រាស់កាមេរ៉ាទេ។ សូមប្រើជម្រើសបង្ហោះរូបភាព ឬប័ណ្ណសាកល្បង។' 
          : 'Camera access is not supported by this browser. Please use Image Upload or Sample Waybills.'
      );
      return;
    }

    try {
      let stream: MediaStream;
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        console.warn('Initial facingMode camera constraint failed, retrying with general video:', firstErr);
        // Fallback constraint works on laptops and single-camera devices
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setPermissionStatus('granted');
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
        setIsScanning(true);
        animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      }

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : {};
      setHasTorch(Boolean(capabilities.torch));
    } catch (err: unknown) {
      console.warn('Camera error:', err);
      const errName = (err as Error)?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setCameraError(
          isKm 
            ? 'ការអនុញ្ញាតប្រើកាមេរ៉ាត្រូវបានបដិសេធ (Denied)។ សូមចុចលើរូបសោរ 🔒 ក្នុងរបារអាសយដ្ឋាន Browser ដើម្បីអនុញ្ញាត «Camera: Allow» ឬប្រើជម្រើសបង្ហោះរូបភាព។' 
            : 'Camera permission denied. Please click the lock 🔒 icon in your browser address bar and set Camera to "Allow", or upload a waybill photo.'
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraError(
          isKm 
            ? 'រកមិនឃើញកាមេរ៉ានៅលើឧបករណ៍នេះទេ។ សូមជ្រើសរើសការបង្ហោះរូបភាព ឬប័ណ្ណសាកល្បង។' 
            : 'No camera hardware found. Please upload a waybill photo or select a sample.'
        );
      } else {
        setCameraError(
          isKm 
            ? 'មិនអាចបើកកាមេរ៉ាបានទេ (អាចដោយសារសិទ្ធិ iFrame ឬសុវត្ថិភាព)។ សូមប្រើជម្រើសបង្ហោះរូបភាពប័ណ្ណ ឬប័ណ្ណគំរូ។' 
            : 'Unable to start camera stream. You can upload a waybill photo or test with sample waybills.'
        );
      }
    }
  }, [facingMode, isKm, scanVideoFrame, stopCameraStream]);

  // Torch toggle
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (err) {
        console.error('Torch toggle failed:', err);
      }
    }
  };

  // Flip camera (front / rear)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Switch modes or open/close lifecycle
  useEffect(() => {
    if (isOpen && activeMode === 'camera') {
      startCamera();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeMode, facingMode, startCamera, stopCameraStream]);

  // Image Upload Processing
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setIsProcessingImage(false);
          return;
        }

        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setIsProcessingImage(false);

        if (code && code.data) {
          handleDetectedCode(code.data);
        } else {
          setCameraError(
            isKm 
              ? 'រកមិនឃើញ QR Code ឬបាកូដនៅលើរូបភាពនេះទេ។ សូមព្យាយាមបង្ហោះរូបភាពច្បាស់ជាងនេះ។' 
              : 'No QR code detected in this image. Please upload a clear photo of the waybill.'
          );
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {isKm ? 'ស្កេនបាកូដ / QR Code ប័ណ្ណដឹកជញ្ជូន' : 'Scan Waybill Barcode / QR'}
                </h3>
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                  Instant
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isKm ? 'ស្កេនប័ណ្ណឡានវ៉ែន បញ្ញើខេត្ត និងកញ្ចប់ឥវ៉ាន់ ២៥ ខេត្ត-ក្រុង' : 'Instant live tracking for Cambodian provincial waybills'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 flex items-center border-b border-slate-200 dark:border-slate-800 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveMode('camera');
              setCameraError(null);
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeMode === 'camera'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isKm ? 'កាមេរ៉ាស្កេន' : 'Live Camera'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('upload');
              stopCameraStream();
              setCameraError(null);
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeMode === 'upload'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{isKm ? 'បង្ហោះរូបភាពប័ណ្ណ' : 'Upload Photo'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('sample');
              stopCameraStream();
              setCameraError(null);
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeMode === 'sample'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{isKm ? 'ប័ណ្ណសាកល្បង' : 'Sample Waybills'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 dark:text-slate-100">
          {/* CAMERA MODE */}
          {activeMode === 'camera' && (
            <div className="space-y-3">
              {permissionStatus === 'prompt' && !cameraError && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
                  <span>
                    {isKm
                      ? 'កម្មវិធីត្រូវការសិទ្ធិកាមេរ៉ាដើម្បីស្កេនបាកូដ។ សូមចុច "Allow" លើផ្ទាំង Browser។'
                      : 'Camera permission required to scan labels. Please select "Allow" when prompted.'}
                  </span>
                </div>
              )}

              {cameraError ? (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 space-y-3 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-300">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">{isKm ? 'មិនអាចបើកកាមេរ៉ាស្កេនបានទេ' : 'Camera Unavailable'}</h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">{cameraError}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{isKm ? 'ព្យាយាមម្តងទៀត' : 'Retry Camera'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMode('sample')}
                      className="px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isKm ? 'សាកល្បងជាមួយប័ណ្ណគំរូ' : 'Use Sample Waybill'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center border-2 border-slate-800 shadow-inner">
                  {/* Real video stream */}
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  {/* Hidden processing canvas */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Viewfinder Target Box overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-emerald-500/60 rounded-3xl flex items-center justify-center shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                      {/* Viewfinder corner brackets */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl -mt-1 -ml-1" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl -mt-1 -mr-1" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl -mb-1 -ml-1" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl -mb-1 -mr-1" />

                      {/* Animated Laser Scanning Line */}
                      {isScanning && !scannedResult && (
                        <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-bounce" />
                      )}

                      {/* Scanned Confirmation Overlay */}
                      {scannedResult && (
                        <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center text-white p-4 animate-in zoom-in-95">
                          <CheckCircle2 className="w-12 h-12 text-white mb-2 animate-bounce" />
                          <span className="font-extrabold text-sm">{isKm ? 'ស្កេនជោគជ័យ!' : 'Scanned Successfully!'}</span>
                          <span className="text-xs font-mono bg-slate-900/60 px-2.5 py-1 rounded-lg mt-1 tracking-wider">
                            #{scannedResult}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-200 mt-4 text-center font-medium bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700">
                      {isKm ? 'តម្រង់កាមេរ៉ាទៅលើ QR Code នៃប័ណ្ណដឹកជញ្ជូន' : 'Align camera over waybill QR code to scan'}
                    </p>
                  </div>

                  {/* Camera Controls Overlay (Top right & bottom) */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {hasTorch && (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className={`p-2 rounded-xl text-white transition cursor-pointer ${
                          isTorchOn ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/80 hover:bg-slate-800'
                        }`}
                        title={isTorchOn ? 'Turn off light' : 'Turn on light'}
                      >
                        <Flashlight className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white transition cursor-pointer"
                      title="Flip camera"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white transition cursor-pointer"
                      title={soundEnabled ? 'Mute sound' : 'Enable beep sound'}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UPLOAD MODE */}
          {activeMode === 'upload' && (
            <div className="space-y-4">
              <label 
                htmlFor="waybill-file-upload"
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group"
              >
                <input 
                  id="waybill-file-upload"
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden" 
                />
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isKm ? 'ជ្រើសរើស ឬទម្លាក់រូបភាពប័ណ្ណដឹកជញ្ជូននៅទីនេះ' : 'Select or drag waybill image here'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  {isKm ? 'គាំទ្ររូបថតប័ណ្ណដឹកជញ្ជូន បង្កាន់ដៃផ្ញើ ឬ Screenshot (JPG, PNG, WebP)' : 'Supports waybill photos, receipts, or screenshots with QR/Barcode'}
                </p>

                <div className="mt-4 px-4 py-2 bg-slate-900 dark:bg-emerald-600 text-white text-xs font-bold rounded-xl group-hover:bg-emerald-600 transition">
                  {isKm ? 'ជ្រើសរើសរូបភាពពីទូរស័ព្ទ/កុំព្យូទ័រ' : 'Browse Photo File'}
                </div>
              </label>

              {isProcessingImage && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-xl flex items-center gap-2 justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span>{isKm ? 'កំពុងស្កេន និងស្វែងរក QR Code លើរូបភាព...' : 'Scanning and decoding QR from image...'}</span>
                </div>
              )}

              {cameraError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-medium rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* SAMPLE WAYBILLS MODE */}
          {activeMode === 'sample' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {isKm 
                    ? 'គំរូប័ណ្ណដឹកជញ្ជូនផ្លូវការកម្ពុជា៖ ចុចប៊ូតុង «ស្កេនប័ណ្ណនេះ» ដើម្បីសាកល្បង ឬចង្អុលកាមេរ៉ាទូរស័ព្ទរបស់អ្នកមកកាន់ QR Code នេះ។' 
                    : 'Official Cambodian waybill samples: Click "Scan This Waybill" to test instantly or point another phone camera at these QR codes.'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {activeShipments.map((ship) => {
                  const qrUrl = sampleQrDataUrls[ship.trackingNumber];
                  return (
                    <div 
                      key={ship.trackingNumber}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {/* Rendered Scannable QR Code - Kept pure white background for QR contrast */}
                        <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs preserve-light">
                          {qrUrl ? (
                            <img 
                              src={qrUrl} 
                              alt={`QR for ${ship.trackingNumber}`} 
                              className="w-full h-full object-contain preserve-light"
                            />
                          ) : (
                            <QrCode className="w-8 h-8 text-slate-400 animate-pulse" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: ship.brandColor }} 
                            />
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {isKm ? ship.carrierNameKm : ship.carrierName}
                            </span>
                          </div>

                          <div className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">
                            #{ship.trackingNumber}
                          </div>

                          <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                            <span className="font-semibold">{ship.senderCity}</span>
                            <span>➔</span>
                            <span className="font-semibold">{ship.receiverCity}</span>
                            <span>•</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{isKm ? ship.statusKm : ship.status}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDetectedCode(ship.trackingNumber)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>{isKm ? 'ស្កេនប័ណ្ណនេះ' : 'Scan'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guaranteed 100% Free & Privacy statement */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isKm ? 'ដំណើរការស្កេនក្នុងម៉ាស៊ីនផ្ទាល់ (Local Client Offline Scan)' : 'Client-side local QR scan'}</span>
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {isKm ? 'ឥតគិតថ្លៃ ១០០%' : '100% Free'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
