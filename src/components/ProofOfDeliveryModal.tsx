import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  User, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  FileCheck,
  Package
} from 'lucide-react';
import { Language, TrackingItem, ProofOfDeliveryRecord } from '../types';

interface ProofOfDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: TrackingItem;
  language: Language;
  onSaveProof: (proof: ProofOfDeliveryRecord) => void;
}

// Preset realistic Cambodian doorstep parcel proof photos for instant testing
const SAMPLE_POD_PHOTOS = [
  {
    title: 'Front Porch / Gate Delivery',
    titleKm: 'ប្រគល់នៅមុខផ្ទះ / មុខរបង',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=700&q=80',
    notes: 'Parcel placed securely on front porch step behind gate pillar.',
    notesKm: 'កញ្ចប់ទំនិញត្រូវបានដាក់ដោយសុវត្ថិភាពលើកាំជណ្តើរមុខផ្ទះ ខាងក្នុងរបង។',
  },
  {
    title: 'Direct Handover to Recipient',
    titleKm: 'ប្រគល់ជូនផ្ទាល់ដៃអ្នកទទួល',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=700&q=80',
    notes: 'Package handed directly to recipient at doorstep.',
    notesKm: 'បានប្រគល់ជូនអ្នកទទួលផ្ទាល់ដៃនៅមាត់ទ្វារផ្ទះ។',
  },
  {
    title: 'Apartment / Office Reception Desk',
    titleKm: 'តុរដ្ឋបាលខុនដូ / ការិយាល័យ',
    url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=700&q=80',
    notes: 'Delivered to building reception security counter.',
    notesKm: 'បានប្រគល់ជូនតុសន្តិសុខ/ទទួលភ្ញៀវអគារតាមការស្នើសុំ។',
  },
];

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({
  isOpen,
  onClose,
  shipment,
  language,
  onSaveProof,
}) => {
  const isKm = language === 'km';
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'presets'>('presets');
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    shipment.proofOfDelivery?.photoUrl || SAMPLE_POD_PHOTOS[0].url
  );
  const [courierNotes, setCourierNotes] = useState<string>(
    shipment.proofOfDelivery?.courierNotes || SAMPLE_POD_PHOTOS[0].notes
  );
  const [courierNotesKm, setCourierNotesKm] = useState<string>(
    shipment.proofOfDelivery?.courierNotesKm || SAMPLE_POD_PHOTOS[0].notesKm
  );
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize or stop live camera stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      setCameraError(
        isKm
          ? 'មិនអាចបើកកាមេរ៉ាបានទេ (សូមអនុញ្ញាត Camera Permission ឬជ្រើសរើសរូបថតគំរូ)'
          : 'Unable to access camera. Please allow camera permissions or select a sample photo.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Capture still photo from live video stream
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoPreview(dataUrl);
    stopCamera();
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit and save Proof of Delivery
  const handleSubmit = () => {
    if (!photoPreview) return;
    setIsSubmitting(true);

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

    const podRecord: ProofOfDeliveryRecord = {
      id: `pod-${Date.now()}`,
      photoUrl: photoPreview,
      capturedAt: `${dateFormatted}, ${timeFormatted}`,
      capturedAtKm: `ថ្ងៃទី ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ម៉ោង ${timeFormatted}`,
      location: `${shipment.receiverCity} Destination Doorstep`,
      locationKm: `អាសយដ្ឋានអ្នកទទួល ${shipment.receiverCityKm}`,
      deliveredByCourier: shipment.driverName || 'Verified Community Courier',
      recipientName: shipment.receiverName,
      courierNotes: courierNotes || 'Delivered safely at recipient doorstep.',
      courierNotesKm: courierNotesKm || 'បានប្រគល់ជូនអ្នកទទួលដោយសុវត្ថិភាពនៅមាត់ទ្វារ។',
    };

    setTimeout(() => {
      onSaveProof(podRecord);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isKm ? 'ថតរូបភស្តុតាងប្រគល់ទំនិញ (Proof of Delivery)' : 'Proof of Delivery Photo Capture'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isKm 
                  ? `សម្រាប់កញ្ចប់ #${shipment.trackingNumber} ជូនអ្នកទទួល ${shipment.receiverName}` 
                  : `Waybill #${shipment.trackingNumber} • Handover to ${shipment.receiverName}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isKm ? 'រូបថតគំរូជាក់ស្តែង' : 'Sample Photos'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isKm ? 'បើកកាមេរ៉ាផ្ទាល់' : 'Live Camera'}</span>
          </button>

          <label
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isKm ? 'ផ្ទុករូបឡើង' : 'Upload File'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                setActiveTab('upload');
                handleFileUpload(e);
              }}
            />
          </label>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Live Camera Viewport */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Camera Viewfinder Crosshair Overlay */}
                <div className="absolute inset-6 border-2 border-dashed border-emerald-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between text-[10px] text-emerald-300 font-mono font-bold bg-slate-950/70 px-2 py-0.5 rounded-md self-start">
                    <span>POD CAPTURE • #{shipment.trackingNumber}</span>
                  </div>
                  <div className="text-[10px] text-white/80 text-center bg-slate-950/70 py-1 rounded-md">
                    {isKm ? 'ដាក់កញ្ចប់ទំនិញ និងទ្វារមុខផ្ទះឲ្យចំក្នុងប្រអប់' : 'Position parcel and doorstep clearly in frame'}
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/90 p-4 flex flex-col items-center justify-center text-center text-xs text-rose-300 space-y-2">
                    <AlertCircle className="w-8 h-8 text-rose-400" />
                    <span>{cameraError}</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('presets')}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer"
                    >
                      {isKm ? 'ប្រើរូបថតគំរូជំនួសវិញ' : 'Switch to Sample Photos'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSnapPhoto}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-700/30 transition flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <span>{isKm ? 'ថតយករូបភាព (Snap Photo)' : 'Capture Proof Photo'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Preset Sample Photos */}
          {activeTab === 'presets' && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {isKm ? 'ជ្រើសរើសរូបថតគំរូនៃការប្រគល់ទំនិញ' : 'Select Doorstep Proof of Delivery Snapshot:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SAMPLE_POD_PHOTOS.map((sample, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setPhotoPreview(sample.url);
                      setCourierNotes(sample.notes);
                      setCourierNotesKm(sample.notesKm);
                    }}
                    className={`rounded-2xl border p-2 cursor-pointer transition flex flex-col space-y-1.5 ${
                      photoPreview === sample.url
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                      <img
                        src={sample.url}
                        alt={sample.title}
                        className="w-full h-full object-cover"
                      />
                      {photoPreview === sample.url && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {isKm ? sample.titleKm : sample.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Photo Preview & GPS Security Verification Stamp */}
          {photoPreview && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {isKm ? 'រូបភាពដែលត្រូវបង្ហាញក្នុង Timeline របស់អតិថិជន' : 'Proof of Delivery Attachment:'}
              </span>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner group">
                <img
                  src={photoPreview}
                  alt="Proof of Delivery"
                  className="w-full h-48 sm:h-56 object-cover"
                />

                {/* Digital Watermark Security Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent text-white text-[10px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-emerald-300 uppercase tracking-wider font-black">
                      {isKm ? 'ភស្តុតាងប្រគល់ទំនិញផ្លូវការ' : 'Verified Proof of Delivery'}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="font-mono text-amber-300">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span>{isKm ? shipment.receiverCityKm : shipment.receiverCity}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-400" />
                      <span>{shipment.driverName || 'Courier'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Courier Delivery Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{isKm ? 'កំណត់សម្គាល់បន្ថែមរបស់អ្នកដឹក (Delivery Notes)' : 'Courier Handover Notes:'}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {isKm ? 'បង្ហាញលើ Timeline' : 'Visible on customer timeline'}
              </span>
            </label>
            <input
              type="text"
              value={isKm ? courierNotesKm : courierNotes}
              onChange={(e) => {
                if (isKm) {
                  setCourierNotesKm(e.target.value);
                } else {
                  setCourierNotes(e.target.value);
                }
              }}
              placeholder={isKm ? 'ឧ. បានប្រគល់ជូនអ្នកទទួលផ្ទាល់ដៃ ឬទុកក្នុងរបង' : 'e.g., Left at front gate securely'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
          >
            {isKm ? 'បោះបង់' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!photoPreview || isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-emerald-700/25 transition flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            )}
            <span>
              {isSubmitting
                ? (isKm ? 'កំពុងរក្សាទុក...' : 'Attaching Proof...')
                : (isKm ? 'រក្សាទុក & បង្ហាញក្នុង Timeline' : 'Attach Proof to Timeline')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
