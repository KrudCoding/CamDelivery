import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  MapPin, 
  Image as ImageIcon, 
  CheckCheck, 
  Check, 
  Smile, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  Volume2, 
  VolumeX, 
  Truck, 
  Info,
  Navigation,
  ShieldCheck,
  Paperclip
} from 'lucide-react';
import { Language, TrackingItem } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'driver' | 'system';
  text: string;
  timestamp: string;
  isLocation?: boolean;
  status: 'sent' | 'delivered' | 'read';
}

interface DriverChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: TrackingItem;
  language: Language;
}

// Subtle audio chime for incoming driver messages
function playMessageChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export const DriverChatModal: React.FC<DriverChatModalProps> = ({
  isOpen,
  onClose,
  shipment,
  language,
}) => {
  const isKm = language === 'km';
  const storageKey = `camdelivery_driver_chat_${shipment.trackingNumber}`;

  // Default initial greeting from driver if first time opening
  const getInitialMessages = (): ChatMessage[] => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return [
      {
        id: 'msg-init-1',
        sender: 'system',
        text: isKm 
          ? `ការសន្ទនាផ្ទាល់ដោយសុវត្ថិភាពសម្រាប់កញ្ចប់ #${shipment.trackingNumber} (០% កម្រៃជើងសារ)` 
          : `Direct encrypted communication for waybill #${shipment.trackingNumber} (0% fee platform)`,
        timestamp: timeStr,
        status: 'read',
      },
      {
        id: 'msg-init-2',
        sender: 'driver',
        text: isKm
          ? `ជម្រាបសួរអតិថិជន! ខ្ញុំបាទ ${shipment.driverName || 'អ្នកដឹកសហគមន៍'} ជាអ្នកដឹកកញ្ចប់ឥវ៉ាន់របស់អ្នក។ ខ្ញុំកំពុងធ្វើដំណើរទៅកាន់ ${shipment.receiverCity}។ ប្រសិនបើមានព័ត៌មានបន្ថែម ឬទីតាំងលម្អិត សូមផ្ញើមកទីនេះបានបាទ!`
          : `Hello! I am ${shipment.driverName || 'your courier'}, delivering your parcel to ${shipment.receiverCity}. Feel free to message me your exact drop-off spot or instructions!`,
        timestamp: timeStr,
        status: 'read',
      }
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore storage read error
    }
    return getInitialMessages();
  });

  const [inputText, setInputText] = useState('');
  const [isDriverTyping, setIsDriverTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Quick delivery instruction preset pills in Khmer & English
  const quickPillPresets = isKm
    ? [
        { label: '🚪 ទុកនៅមុខផ្ទះ / ក្នុងរបង', text: 'សូមជួយទុកកញ្ចប់ឥវ៉ាន់នៅខាងក្នុងរបង ឬមុខទ្វារផ្ទះដោយសុវត្ថិភាពបាទ។' },
        { label: '📞 មកដល់ជិត ៥ នាទីសូមខល', text: 'បងពេលមកជិតដល់ប្រហែល ៥ នាទីទៀត សូមខលមកខ្ញុំតាមលេខទូរស័ព្ទណា!' },
        { label: '🏢 ផ្ញើជាមួយសន្តិសុខ/រដ្ឋបាល', text: 'បើខ្ញុំមិនទាន់ចុះមកទាន់ សូមជួយផ្ញើទុកនៅតុសន្តិសុខ ឬរដ្ឋបាលអគារផងបង។' },
        { label: '🔔 ចុចកណ្ដឹងទ្វារ ២ ដង', text: 'ពេលមកដល់មុខផ្ទះ សូមជួយចុចកណ្ដឹងទ្វារមុខ ២ ដងផងបាទ។' },
        { label: '📦 កញ្ចប់ឥវ៉ាន់ងាយបែក', text: 'កញ្ចប់ឥវ៉ាន់នេះមានរបស់ងាយបែក សូមជួយប្រុងប្រយ័ត្នកុំឲ្យប៉ះទង្គិចខ្លាំង។' },
        { label: '💵 ត្រៀមលុយ COD រួចរាល់', text: `ខ្ញុំបានត្រៀមលុយទូទាត់ COD ${shipment.isCod ? shipment.codAmountKHR.toLocaleString() + ' ៛' : ''} រួចហើយបង។` },
      ]
    : [
        { label: '🚪 Leave at front door/gate', text: 'Delivery instruction: Please place the parcel securely inside the front gate/doorstep.' },
        { label: '📞 Call 5 mins before arrival', text: 'Delivery instruction: Please give me a phone call 5 minutes before arriving!' },
        { label: '🏢 Leave with building security', text: 'Delivery instruction: If I am not down yet, please leave it with reception/security desk.' },
        { label: '🔔 Ring doorbell twice', text: 'Delivery instruction: Please ring the front doorbell twice upon arrival.' },
        { label: '📦 Fragile package - take care', text: 'Delivery instruction: Contains fragile items, please handle with extra care.' },
        { label: '💵 Cash/COD ready', text: `I have prepared the payment of ${shipment.isCod ? shipment.codAmountKHR.toLocaleString() + ' KHR' : 'the order'} ready.` },
      ];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isDriverTyping]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // Ignore
    }
  }, [messages, storageKey]);

  // Handle Driver's dynamic responses
  const triggerDriverReply = (userMsg: string) => {
    setIsDriverTyping(true);

    const lower = userMsg.toLowerCase();
    let replyText = '';

    if (lower.includes('នាទី') || lower.includes('minute') || lower.includes('ម៉ោង') || lower.includes('time') || lower.includes('when')) {
      replyText = isKm
        ? `បាទបង! ខ្ញុំកំពុងជិះតាមផ្លូវ ស្ថានភាពចរាចរណ៍រលូនល្អ ប្រហែល ១៥ ទៅ ២០ នាទីទៀតខ្ញុំទៅដល់ទីតាំងបងហើយបាទ។`
        : `Yes! Traffic is flowing smoothly. I should arrive in about 15 to 20 minutes.`;
    } else if (lower.includes('ខល') || lower.includes('call') || lower.includes('phone') || lower.includes('លេខ')) {
      replyText = isKm
        ? `បាទបង មិនអីទេ! ពេលជិតដល់ចម្ងាយ ៥០០ ម៉ែត្រ ខ្ញុំនឹងខលរោទិ៍ប្រាប់បងភ្លាម។`
        : `Understood! I will give you a phone ring when I am 500m away.`;
    } else if (lower.includes('លុយ') || lower.includes('cod') || lower.includes('cash') || lower.includes('khqr') || lower.includes('បាគង')) {
      replyText = isKm
        ? `អរគុណច្រើនបង! ខ្ញុំមានទាំង QR បាគង (Bakong KHQR) និងលុយអាប់គ្រប់ចំនួន មិនបាច់បារម្ភទេបាទ។`
        : `Thank you! I accept both cash with exact change and Bakong KHQR scan directly.`;
    } else if (lower.includes('មុខផ្ទះ') || lower.includes('waiting') || lower.includes('front')) {
      replyText = isKm
        ? `បាទអរគុណបង! ខ្ញុំជិតដល់ហើយ ឃើញម៉ូតូ/ឡានស្លាកលេខ ${shipment.driverPlate || 'CamDelivery'} គឺខ្ញុំហើយបាទ។`
        : `Great! Look out for my vehicle plate ${shipment.driverPlate || 'CamDelivery'}. Almost there!`;
    } else if (lower.includes('សន្តិសុខ') || lower.includes('security') || lower.includes('neighbor') || lower.includes('អ្នកជិតខាង')) {
      replyText = isKm
        ? `បាទទទួលដំណឹង! ពេលប្រគល់ជូនសន្តិសុខ ខ្ញុំនឹងថតរូបបង្កាន់ដៃផ្ញើជូនបងក្នុងឆាតនេះភ្លាម។`
        : `Noted! I will hand it to security and take a clear drop-off photo for you.`;
    } else if (lower.includes('ទីតាំង') || lower.includes('location') || lower.includes('gps')) {
      replyText = isKm
        ? `បាទ! ខ្ញុំបានទទួលទីតាំង GPS របស់បងហើយ ខ្ញុំកំពុងរត់តាមផែនទី Google Maps នេះបាទ។`
        : `Got your GPS pin! Following the exact navigation route now.`;
    } else {
      replyText = isKm
        ? `បាទបង! ខ្ញុំបានទទួលសារហើយ ខ្ញុំកំពុងផ្ចិតផ្ចង់ដឹកជញ្ជូនឱ្យបានលឿននិងមានសុវត្ថិភាពបំផុតជូនបង។`
        : `Thank you for the update! I have noted your message and am making haste safely to your location.`;
    }

    // Realistic typing delay of 1.5 - 2.8 seconds
    const delay = Math.floor(Math.random() * 1000) + 1600;
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newDriverMsg: ChatMessage = {
        id: `driver-msg-${Date.now()}`,
        sender: 'driver',
        text: replyText,
        timestamp: timeStr,
        status: 'read',
      };

      setMessages((prev) => [...prev, newDriverMsg]);
      setIsDriverTyping(false);

      if (soundEnabled) {
        playMessageChime();
      }
    }, delay);
  };

  // Handle user send
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: timeStr,
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Mark as delivered
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'read' } : m))
      );
    }, 800);

    // Trigger driver auto reply
    triggerDriverReply(text);
  };

  // Quick share live location
  const handleShareCurrentLocation = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const locationText = isKm
      ? `📍 ខ្ញុំបានផ្ញើទីតាំង GPS របស់ខ្ញុំ៖ [11.5564° N, 104.9282° E - ${shipment.receiverCity}]`
      : `📍 Shared GPS drop-off pin: [11.5564° N, 104.9282° E - ${shipment.receiverCity}]`;

    const userMsg: ChatMessage = {
      id: `user-loc-${Date.now()}`,
      sender: 'user',
      text: locationText,
      timestamp: timeStr,
      isLocation: true,
      status: 'read',
    };

    setMessages((prev) => [...prev, userMsg]);
    triggerDriverReply('ទីតាំង location');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[640px] max-h-[94vh]">
        {/* Chat Header Bar */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800 shadow-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Driver Avatar with Online Indicator */}
            <div className="relative shrink-0">
              <div 
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-sm"
                style={{ backgroundColor: shipment.brandColor || '#059669' }}
              >
                {shipment.driverName ? shipment.driverName.slice(0, 2).toUpperCase() : 'DR'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            {/* Driver Names & Vehicle Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {shipment.driverName || (isKm ? 'អ្នកដឹកជញ្ជូន' : 'Courier Driver')}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded-md font-bold shrink-0">
                  {isKm ? 'កំពុងដឹក' : 'On Trip'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {shipment.driverVehicle} {shipment.driverPlate && `(${shipment.driverPlate})`} • #{shipment.trackingNumber}
              </p>
            </div>
          </div>

          {/* Action buttons (Direct Phone Call, Mute Sound, Close) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {shipment.driverPhone && (
              <a
                href={`tel:${shipment.driverPhone}`}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 text-xs font-bold shadow-xs"
                title="Call Driver"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">{shipment.driverPhone}</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title={soundEnabled ? 'Mute chimes' : 'Enable chimes'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Waybill Status Quick Subheader */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold truncate">
              {shipment.senderCity} ➔ {shipment.receiverCity}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-700 font-bold truncate">
              {isKm ? shipment.statusKm : shipment.status}
            </span>
          </div>
          {shipment.isCod && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black px-2 py-0.5 rounded-full text-[10px] shrink-0">
              COD: {shipment.codAmountKHR.toLocaleString()} ៛
            </span>
          )}
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-slate-50/70">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="px-3 py-1 rounded-full bg-slate-200/80 text-slate-600 text-[11px] font-medium flex items-center gap-1.5 text-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
              >
                <div className="flex items-end gap-1.5 max-w-[85%] sm:max-w-[75%]">
                  {!isUser && (
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 mb-1"
                      style={{ backgroundColor: shipment.brandColor || '#059669' }}
                    >
                      {shipment.driverName ? shipment.driverName.slice(0, 1) : 'D'}
                    </div>
                  )}

                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                    } ${msg.isLocation ? 'border border-emerald-400 bg-emerald-950 text-white' : ''}`}
                  >
                    {msg.text}

                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                        isUser ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isUser && (
                        <span>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Check className="w-3 h-3 text-slate-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isDriverTyping && (
            <div className="flex items-center gap-2 text-slate-500 text-xs pl-8">
              <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-bl-xs shadow-xs flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-600">
                  {shipment.driverName || 'Driver'} {isKm ? 'កំពុងវាយអក្សរ...' : 'is typing...'}
                </span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Response Preset Pills */}
        <div className="bg-white border-t border-slate-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            {isKm ? 'ឆ្លើយតបរហ័ស៖' : 'Quick:'}
          </span>
          {quickPillPresets.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(pill.text)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-[11px] font-semibold text-slate-700 transition shrink-0 whitespace-nowrap shadow-2xs"
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-1.5"
          >
            {/* Quick Share GPS Pin Button */}
            <button
              type="button"
              onClick={handleShareCurrentLocation}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition shrink-0 border border-slate-200"
              title={isKm ? 'ផ្ញើទីតាំង GPS របស់ខ្ញុំ' : 'Share GPS drop-off pin'}
            >
              <MapPin className="w-4 h-4 text-rose-500" />
            </button>

            {/* Main Text Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isKm
                    ? `ផ្ញើសារទៅកាន់ ${shipment.driverName || 'អ្នកដឹក'}...`
                    : `Message ${shipment.driverName || 'driver'}...`
                }
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-xl text-white font-bold transition flex items-center justify-center shrink-0 shadow-sm ${
                inputText.trim()
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>{isKm ? 'សារផ្ទាល់ឥតគិតថ្លៃ 0% (Direct Courier Line)' : 'Direct 0% fee courier line'}</span>
            <span className="text-emerald-600 font-bold">{isKm ? 'ឆ្លើយតបភ្លាមៗ' : 'Instant Reply'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
