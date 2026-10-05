import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { Language } from '../types';

interface VoiceSearchButtonProps {
  language: Language;
  onTranscript: (text: string) => void;
  className?: string;
  onNotify?: (message: string) => void;
}

// Format transcribed speech into tracking code conventions
const formatTrackingTranscript = (rawText: string): string => {
  let cleaned = rawText.trim().toUpperCase();

  // Normalize spoken Khmer numbers if any
  const khmerNumerals: Record<string, string> = {
    '០': '0', '១': '1', '២': '2', '៣': '3', '៤': '4',
    '៥': '5', '៦': '6', '៧': '7', '៨': '8', '៩': '9',
  };
  cleaned = cleaned.replace(/[០-៩]/g, (char) => khmerNumerals[char] || char);

  // Common spoken prefix patterns
  // e.g. "K H VAN 882910" -> "KH-VAN-882910"
  cleaned = cleaned.replace(/\bK\s*H\b/g, 'KH');
  cleaned = cleaned.replace(/KH\s*VAN/g, 'KH-VAN');
  cleaned = cleaned.replace(/KH\s*EX/g, 'KH-EX');
  cleaned = cleaned.replace(/KH\s*SCH/g, 'KH-SCH');
  cleaned = cleaned.replace(/(\w+)\s+(\d+)/g, '$1-$2');

  return cleaned.replace(/\s+/g, '-').replace(/-+/g, '-');
};

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  language,
  onTranscript,
  className = '',
  onNotify,
}) => {
  const isKm = language === 'km';
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check SpeechRecognition API presence
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const handleStartListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Speech recognition not supported by browser -> fallback to sample dictation
      const sampleCodes = ['KH-VAN-882910', 'KH-EX-419082', 'KH-SCH-771203', 'Keo Sophea'];
      const picked = sampleCodes[Math.floor(Math.random() * sampleCodes.length)];
      if (onNotify) {
        onNotify(
          isKm
            ? `🎙️ (សាកល្បងសំឡេង) បានបញ្ចូលលេខកូដ៖ ${picked}`
            : `🎙️ (Voice Simulated) Dictated tracking code: ${picked}`
        );
      }
      onTranscript(picked);
      return;
    }

    try {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = false;
      // Speech recognition language: km-KH or en-US
      recognition.lang = isKm ? 'km-KH' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        if (onNotify) {
          onNotify(
            isKm
              ? '🎙️ កំពុងស្តាប់សំឡេង... សូមនិយាយលេខកូដតាមដាន (ឧ. KH-VAN 882910)'
              : '🎙️ Listening... Please speak your tracking number (e.g. KH-VAN 882910)'
          );
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const formatted = formatTrackingTranscript(transcript);
        setIsListening(false);

        if (onNotify) {
          onNotify(
            isKm
              ? `✅ បានស្តាប់ឃើញ៖ "${formatted}"`
              : `✅ Heard: "${formatted}"`
          );
        }
        onTranscript(formatted);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          if (onNotify) {
            onNotify(
              isKm
                ? '⚠️ សូមអនុញ្ញាត Microphone ក្នុង Browser ដើម្បីប្រើមុខងារសំឡេង'
                : '⚠️ Microphone access denied in browser settings'
            );
          }
        } else {
          // Provide fallback speech sample
          const fallback = 'KH-VAN-882910';
          onTranscript(fallback);
          if (onNotify) {
            onNotify(
              isKm
                ? `🎙️ បានបញ្ចូលកូដលំនាំដើម៖ ${fallback}`
                : `🎙️ Auto-filled sample code: ${fallback}`
            );
          }
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
      setIsListening(false);
      // Fallback
      const fallback = 'KH-VAN-882910';
      onTranscript(fallback);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleStartListening}
        className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
          isListening
            ? 'bg-rose-600 text-white shadow-lg ring-4 ring-rose-500/40 animate-pulse'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
        } ${className}`}
        title={
          isListening
            ? (isKm ? 'កំពុងស្តាប់សំឡេង... (ចុចដើម្បីបញ្ឈប់)' : 'Listening... (Click to stop)')
            : (isKm ? 'ស្វែងរកតាមសំឡេង (Voice-to-Text)' : 'Voice-to-Text Search')
        }
        aria-label="Voice Search"
      >
        {isListening ? (
          <>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <Mic className="w-4 h-4 text-white" />
          </>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Floating Listening Indicator Pill */}
      {isListening && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-slate-950 text-white px-3 py-1.5 rounded-xl shadow-2xl border border-rose-500/60 flex items-center gap-2 whitespace-nowrap text-[11px] font-bold animate-in fade-in slide-in-from-top-1 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>{isKm ? 'កំពុងស្តាប់សំឡេង...' : 'Listening to speech...'}</span>
        </div>
      )}
    </div>
  );
};
