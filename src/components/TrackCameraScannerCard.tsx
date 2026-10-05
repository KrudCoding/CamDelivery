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
  Maximize2,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  ShieldCheck,
  Package
} from 'lucide-react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { Language, TrackingItem } from '../types';
import { parseTrackingCodeFromQR } from './WaybillQRScannerModal';

interface TrackCameraScannerCardProps {
  language: Language;
  activeShipments: TrackingItem[];
  onScanSuccess: (scannedCode: string) => void;
  onOpenFullModal: () => void;
}

export const TrackCameraScannerCard: React.FC<TrackCameraScannerCardProps> = ({
  language,
  activeShipments,
  onScanSuccess,
  onOpenFullModal,
}) => {
  const isKm = language === 'km';
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [sampleQrDataUrls, setSampleQrDataUrls] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'samples'>('camera');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Monitor camera permission status
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
        setPermissionStatus('unknown');
      }
    };
    queryPermission();
    return () => {
      if (permObj) permObj.onchange = null;
    };
  }, []);

  // Audio feedback helper
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio autoplay restrictions
    }
  };

  // Generate sample QR codes
  useEffect(() => {
    const generateQrs = async () => {
      const qrs: Record<string, string> = {};
      for (const ship of activeShipments.slice(0, 4)) {
        try {
          const url = await QRCode.toDataURL(ship.trackingNumber, {
            margin: 1,
            width: 140,
            color: { dark: '#0f172a', light: '#ffffff' },
          });
          qrs[ship.trackingNumber] = url;
        } catch {
          // ignore
        }
      }
      setSampleQrDataUrls(qrs);
    };
    generateQrs();
  }, [activeShipments]);

  // Clean up camera stream
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Handle detection
  const handleDetectedCode = useCallback(
    (rawCode: string) => {
      const normalizedCode = parseTrackingCodeFromQR(rawCode);
      setScannedResult(normalizedCode);
      playBeep();
      if (navigator.vibrate) {
        try {
          navigator.vibrate([60, 40, 60]);
        } catch {
          // ignore
        }
      }

      // Stop camera feed after success
      stopCamera();
      setIsCameraActive(false);

      // Trigger tracking update
      setTimeout(() => {
        onScanSuccess(normalizedCode);
        setScannedResult(null);
      }, 900);
    },
    [onScanSuccess, stopCamera, soundEnabled]
  );

  // Video scanning loop
  const scanVideoFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    // Try native BarcodeDetector API
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'data_matrix', 'upc_a'],
        });
        const detected = await detector.detect(video);
        if (detected && detected.length > 0 && detected[0].rawValue) {
          handleDetectedCode(detected[0].rawValue);
          return;
        }
      } catch {
        // Fallback to canvas
      }
    }

    if (!canvas) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    // Scale canvas to max 640px for silky smooth scanning without lag
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
      return;
    }

    animationFrameId.current = requestAnimationFrame(scanVideoFrame);
  }, [handleDetectedCode]);

  // Start live camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setScannedResult(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        isKm
          ? 'កម្មវិធីរុករកនេះមិនគាំទ្រការប្រើប្រាស់កាមេរ៉ាទេ។ សូមប្រើជម្រើសបង្ហោះរូបភាពប័ណ្ណ។'
          : 'Camera access is not supported by this browser. Please use photo upload or sample waybills.'
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
        console.warn('Initial facingMode camera constraint failed, retrying with basic video:', firstErr);
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
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      }

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
      } else {
        setCameraError(
          isKm
            ? 'មិនអាចបើកកាមេរ៉ាបានទេ (អាចដោយសារសិទ្ធិ iFrame)។ សូមប្រើជម្រើសបង្ហោះរូបភាព ឬប័ណ្ណគំរូ។'
            : 'Unable to start camera stream. You can upload a waybill photo or select a sample.'
        );
      }
    }
  }, [facingMode, isKm, scanVideoFrame, stopCamera]);

  // Toggle Camera
  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
      setIsCameraActive(false);
    } else {
      setIsCameraActive(true);
      setIsExpanded(true);
      setActiveTab('camera');
      startCamera();
    }
  };

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({ advanced: [{ torch: nextState }] });
        setIsTorchOn(nextState);
      } catch (err) {
        console.error('Torch error:', err);
      }
    }
  };

  // Flip Camera
  const toggleFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Photo Upload Handler
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
              ? 'រកមិនឃើញ QR Code ឬបាកូដលើរូបថតនេះទេ។ សូមសាកល្បងបង្ហោះរូបភាពច្បាស់ជាងនេះ។'
              : 'No QR code or barcode found in this image. Please upload a clear photo of the waybill.'
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Lifecycle when camera is activated
  useEffect(() => {
    if (isCameraActive && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isCameraActive, activeTab, facingMode, startCamera, stopCamera]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition">
      {/* Top Banner & Fast Actions */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white">
                {isKm ? 'ម៉ាស៊ីនស្កេនប័ណ្ណដឹកជញ្ជូនរហ័ស (Camera Scanner)' : 'Quick Waybill Camera Scanner'}
              </span>
              <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.2 rounded-full uppercase">
                Live AI
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isKm
                ? 'បើកកាមេរ៉ាស្កេនបាកូដ/QR លើប័ណ្ណផ្ញើឥវ៉ាន់ដើម្បីពិនិត្យស្ថានភាពកញ្ចប់ភ្លាមៗ'
                : 'Scan parcel waybill labels or QR stickers with camera to retrieve live status instantly'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleToggleCamera}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
              isCameraActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white'
            }`}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="w-3.5 h-3.5" />
                <span>{isKm ? 'បិទកាមេរ៉ា' : 'Close Camera'}</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-emerald-200" />
                <span>{isKm ? 'បើកកាមេរ៉ាស្កេន' : 'Open Camera Scanner'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenFullModal}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title={isKm ? 'បើកពេញអេក្រង់' : 'Full Screen Modal'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition sm:hidden cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Scanner Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-200 dark:text-slate-100">
          {/* Sub-Tabs: Live Camera | Upload Label Photo | Sample Waybills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                if (!isCameraActive) {
                  setIsCameraActive(true);
                  startCamera();
                }
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isKm ? 'កាមេរ៉ាផ្សាយផ្ទាល់' : 'Live Camera'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                stopCamera();
                setIsCameraActive(false);
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isKm ? 'បង្ហោះរូបថតប័ណ្ណ' : 'Upload Photo'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('samples');
                stopCamera();
                setIsCameraActive(false);
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'samples'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{isKm ? 'ប័ណ្ណគំរូសាកល្បង' : 'Sample Waybills'}</span>
            </button>
          </div>

          {/* TAB 1: LIVE CAMERA VIEW */}
          {activeTab === 'camera' && (
            <div>
              {permissionStatus === 'prompt' && !cameraError && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
                  <span>
                    {isKm
                      ? 'កម្មវិធីត្រូវការសិទ្ធិកាមេរ៉ាដើម្បីស្កេនបាកូដ។ សូមចុច "Allow" លើសារទាមទារសិទ្ធិ Browser។'
                      : 'Camera permission required to scan parcel labels. Please select "Allow" when prompted.'}
                  </span>
                </div>
              )}

              {cameraError ? (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 mx-auto flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-rose-900 dark:text-rose-200">
                      {isKm ? 'មិនអាចដំណើរការកាមេរ៉ាបានទេ' : 'Camera Stream Inactive'}
                    </h5>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 max-w-md mx-auto">{cameraError}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{isKm ? 'ព្យាយាមម្តងទៀត' : 'Retry Access'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('samples')}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isKm ? 'ប្រើប័ណ្ណគំរូ' : 'Use Sample Waybills'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-16/9 sm:aspect-21/9 max-h-80 flex items-center justify-center border-2 border-slate-800 shadow-inner">
                  {/* Real video feed */}
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  {/* Processing canvas */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning Viewfinder Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                    <div className="relative w-44 h-44 sm:w-52 sm:h-52 border-2 border-emerald-500/60 rounded-3xl flex items-center justify-center shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                      {/* Viewfinder brackets */}
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl -mt-1 -ml-1" />
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl -mt-1 -mr-1" />
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl -mb-1 -ml-1" />
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-xl -mb-1 -mr-1" />

                      {/* Moving Laser Line */}
                      {isScanning && !scannedResult && (
                        <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-bounce" />
                      )}

                      {/* Detected Confirmation Box */}
                      {scannedResult && (
                        <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center text-white p-3 animate-in zoom-in-95">
                          <CheckCircle2 className="w-10 h-10 text-white mb-1 animate-bounce" />
                          <span className="font-extrabold text-xs sm:text-sm">
                            {isKm ? 'ស្កេនជោគជ័យ!' : 'Scanned Successfully!'}
                          </span>
                          <span className="text-[11px] font-mono bg-slate-900/60 px-2 py-0.5 rounded-md mt-1 tracking-wider">
                            #{scannedResult}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-200 mt-2 text-center font-medium bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
                      {isKm ? 'តម្រង់កាមេរ៉ាលើ QR Code ឬបាកូដប័ណ្ណដឹក' : 'Position waybill QR code or barcode inside square'}
                    </p>
                  </div>

                  {/* Top-Right Camera Controls */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                    {hasTorch && (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className={`p-1.5 rounded-lg text-white transition cursor-pointer ${
                          isTorchOn ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/80 hover:bg-slate-800'
                        }`}
                        title="Flashlight"
                      >
                        <Flashlight className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={toggleFacing}
                      className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-white transition cursor-pointer"
                      title="Switch Camera"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-white transition cursor-pointer"
                      title="Mute/Unmute sound"
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD LABEL PHOTO */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label
                htmlFor="inline-label-upload"
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition"
              >
                <input
                  id="inline-label-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isKm ? 'ជ្រើសរើសរូបថតប័ណ្ណដឹកជញ្ជូន ឬបង្កាន់ដៃ' : 'Upload Waybill Photo or Receipt'}
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isKm ? 'ស្កេនដោយស្វ័យប្រវត្តិនូវ QR Code ឬបាកូដពីទូរស័ព្ទរបស់អ្នក' : 'Automatically decodes QR code or barcode from photos'}
                </p>
                <span className="mt-3 px-3 py-1.5 bg-slate-900 dark:bg-emerald-600 text-white text-xs font-bold rounded-xl">
                  {isKm ? 'ជ្រើសរើសរូបភាព' : 'Browse Photo'}
                </span>
              </label>

              {isProcessingImage && (
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-xl flex items-center gap-2 justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span>{isKm ? 'កំពុងស្កេនរូបភាព...' : 'Scanning label photo...'}</span>
                </div>
              )}

              {cameraError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-medium rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAMPLE WAYBILLS FOR INSTANT TESTING */}
          {activeTab === 'samples' && (
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {isKm
                    ? 'ចុចប៊ូតុង «ស្កេន» ដើម្បីសាកល្បងភ្លាមៗ ឬចង្អុលកាមេរ៉ាទូរស័ព្ទមកលើ QR ទាំងនេះ'
                    : 'Click "Test Scan" to load package status or point a camera at these real QR labels'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeShipments.slice(0, 4).map((ship) => {
                  const qr = sampleQrDataUrls[ship.trackingNumber];
                  return (
                    <div
                      key={`sample-${ship.trackingNumber}`}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xs transition flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-14 h-14 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 preserve-light">
                          {qr ? (
                            <img src={qr} alt={`QR for ${ship.trackingNumber}`} className="w-full h-full object-contain preserve-light" />
                          ) : (
                            <QrCode className="w-7 h-7 text-slate-400 animate-pulse" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ship.brandColor }} />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {isKm ? ship.carrierNameKm : ship.carrierName}
                            </span>
                          </div>
                          <div className="font-mono font-black text-xs text-slate-900 dark:text-white">
                            #{ship.trackingNumber}
                          </div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                            <span>{ship.senderCity}</span>
                            <span>➔</span>
                            <span>{ship.receiverCity}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDetectedCode(ship.trackingNumber)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                      >
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>{isKm ? 'ស្កេន' : 'Test Scan'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Privacy & Zero Cost Promise */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isKm ? 'ដំណើរការស្កេនក្នុងម៉ាស៊ីនផ្ទាល់ (Local Client Offline Scan)' : 'Client-side local camera scan (100% Private)'}</span>
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {isKm ? 'ឥតគិតថ្លៃ ១០០%' : '100% Free'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
