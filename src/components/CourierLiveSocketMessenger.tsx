import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Radio,
  CheckCheck,
  Check,
  ShieldCheck,
  Truck,
  Phone,
  MessageSquare,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { Language, TrackingItem } from '../types';
import { MockCourierSocket, CourierSocketMessage, SocketStatus } from '../services/mockCourierSocket';

interface CourierLiveSocketMessengerProps {
  shipment: TrackingItem;
  language: Language;
  onCallDriver?: () => void;
  isCollapsible?: boolean;
}

// Subtle audio chime
function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore autoplay restriction
  }
}

export const CourierLiveSocketMessenger: React.FC<CourierLiveSocketMessengerProps> = ({
  shipment,
  language,
  onCallDriver,
  isCollapsible = true,
}) => {
  const isKm = language === 'km';
  const driverName = shipment.driverName || (isKm ? 'អ្នកដឹកជញ្ជូនសហគមន៍' : 'Courier Rider');
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('connecting');
  const [latency, setLatency] = useState<number>(24);
  const [socketUrl, setSocketUrl] = useState<string>('');
  const [messages, setMessages] = useState<CourierSocketMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isCourierTyping, setIsCourierTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const socketRef = useRef<MockCourierSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize and connect socket on mount or shipment change
  useEffect(() => {
    const socket = new MockCourierSocket(shipment.trackingNumber, driverName);
    socketRef.current = socket;

    // Initial greeting message
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'msg-init-system',
        sender: 'system',
        text: isKm
          ? `ប្រព័ន្ធបានភ្ជាប់ Socket ផ្ទាល់ជាមួយអ្នកដឹក ${driverName} (#${shipment.trackingNumber})`
          : `Live Socket tunnel connected with courier ${driverName} (#${shipment.trackingNumber})`,
        timestamp: nowTime,
        status: 'read',
      },
      {
        id: 'msg-init-courier',
        sender: 'courier',
        text: isKm
          ? `ជម្រាបសួរអតិថិជន! ខ្ញុំបាទ ${driverName} កំពុងដឹកកញ្ចប់របស់អ្នកទៅកាន់ ${shipment.receiverCityKm}។ ប្រសិនបើមានការណែនាំពីទីតាំងទម្លាក់ ឬទ្វារផ្ទះ សូមផ្ញើមកទីនេះបានបាទ!`
          : `Hello! I am ${driverName}, on the way to ${shipment.receiverCity}. Please send any drop-off instructions or gate details here!`,
        timestamp: nowTime,
        status: 'read',
      },
    ]);

    // Socket Event Listeners
    socket.on('status_change', (data: any) => {
      setSocketStatus(data.status);
      if (data.latency) setLatency(data.latency);
      if (data.socketUrl) setSocketUrl(data.socketUrl);
    });

    socket.on('message_sent', (newMsg: CourierSocketMessage) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    socket.on('message_status_update', (update: { id: string; status: 'delivered' | 'read' }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === update.id ? { ...m, status: update.status } : m))
      );
    });

    socket.on('courier_typing', (data: { isTyping: boolean }) => {
      setIsCourierTyping(data.isTyping);
    });

    socket.on('courier_message', (courierMsg: CourierSocketMessage) => {
      setMessages((prev) => [...prev, courierMsg]);
      if (soundEnabled) playChime();
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [shipment.trackingNumber, driverName, isKm, soundEnabled]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isCourierTyping]);

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current) return;

    socketRef.current.sendInstruction(inputText.trim(), 'custom', language);
    setInputText('');
  };

  const handleQuickInstruction = (
    text: string,
    type: CourierSocketMessage['instructionType']
  ) => {
    if (!socketRef.current) return;
    socketRef.current.sendInstruction(text, type, language);
  };

  const quickInstructions = isKm
    ? [
        {
          id: 'door',
          type: 'door' as const,
          label: '🚪 ដាក់មុខទ្វារផ្ទះ',
          text: 'បងពេលមកដល់ សូមជួយដាក់កញ្ចប់ឥវ៉ាន់នៅមុខទ្វារផ្ទះខ្ញុំផងបាទ/ចាស។',
        },
        {
          id: 'bell',
          type: 'bell' as const,
          label: '🔔 ចុចកណ្ដឹងពេលដល់',
          text: 'ពេលមកដល់មុខផ្ទះ សូមជួយចុចកណ្ដឹងទ្វារផងបង។',
        },
        {
          id: 'call',
          type: 'call' as const,
          label: '📞 ខលមុន ៥ នាទី',
          text: 'បងពេលធ្វើដំណើរជិតដល់ សូមជួយខលមកលេខខ្ញុំមុនប្រហែល ៥ នាទីណា!',
        },
        {
          id: 'security',
          type: 'security' as const,
          label: '🛡️ ផ្ញើទុកនៅសន្តិសុខ',
          text: 'បើខ្ញុំមិននៅ សូមជួយផ្ញើកញ្ចប់ទុកនៅបុស្តិ៍សន្តិសុខ ឬតុ Reception ផងបង។',
        },
        {
          id: 'fragile',
          type: 'fragile' as const,
          label: '⚠️ ឥវ៉ាន់ងាយបែក ប្រយ័ត្ន',
          text: 'កញ្ចប់នេះជាទំនិញងាយបែក សូមជួយលើកដាក់ថ្នមៗបន្តិចណាអរគុណបង!',
        },
        {
          id: 'cod',
          type: 'cod' as const,
          label: '💵 ត្រៀមលុយ COD រួចរាល់',
          text: `ខ្ញុំបានត្រៀមប្រាក់ COD ${shipment.isCod ? shipment.codAmountKHR.toLocaleString() + ' ៛' : ''} រួចជាស្រេចហើយបង។`,
        },
        {
          id: 'gate',
          type: 'gate' as const,
          label: '🏢 លេខកូដទ្វារ #4812',
          text: 'លេខកូដទ្វាររបងចូលអគារគឺ #4812 បងអាចចុចចូលបាន។',
        },
      ]
    : [
        {
          id: 'door',
          type: 'door' as const,
          label: '🚪 Leave at Front Door',
          text: 'Please leave the parcel safely right in front of the door.',
        },
        {
          id: 'bell',
          type: 'bell' as const,
          label: '🔔 Ring Doorbell Upon Arrival',
          text: 'Please ring the doorbell as soon as you arrive downstairs.',
        },
        {
          id: 'call',
          type: 'call' as const,
          label: '📞 Call 5 Mins Before Arrival',
          text: 'Please give me a call roughly 5 minutes before arriving.',
        },
        {
          id: 'security',
          type: 'security' as const,
          label: '🛡️ Leave with Guard / Reception',
          text: 'If I am not downstairs, please leave it with security/reception.',
        },
        {
          id: 'fragile',
          type: 'fragile' as const,
          label: '⚠️ Fragile - Handle with Care',
          text: 'This parcel contains delicate items, please handle with extra care!',
        },
        {
          id: 'cod',
          type: 'cod' as const,
          label: '💵 Cash / COD Payment Ready',
          text: `I have prepared the cash COD payment of ${shipment.isCod ? shipment.codAmountKHR.toLocaleString() + ' KHR' : 'the parcel'} ready.`,
        },
        {
          id: 'gate',
          type: 'gate' as const,
          label: '🏢 Gate Access Code: #4812',
          text: 'Building access gate PIN code is #4812.',
        },
      ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Top Messenger Bar with Live Socket Status */}
      <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <Truck className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">
                {driverName}
              </h4>
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Mock WebSocket</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 truncate">
              <span className="text-emerald-400 font-mono font-bold">
                ● {socketStatus === 'connected' ? (isKm ? 'បានភ្ជាប់ Socket' : 'Socket Live') : socketStatus}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-300">{latency}ms ping</span>
              {shipment.driverPlate && (
                <>
                  <span>•</span>
                  <span className="font-mono text-amber-400">{shipment.driverPlate}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right header controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {shipment.driverPhone && (
            <a
              href={`tel:${shipment.driverPhone}`}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
              title={`Call ${shipment.driverPhone}`}
            >
              <Phone className="w-4 h-4" />
            </a>
          )}

          {isCollapsible && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title={isCollapsed ? 'Expand Chat' : 'Collapse Chat'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Quick Delivery Instructions Bar */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{isKm ? 'ការណែនាំដឹកជញ្ជូនរហ័ស (1-Tap Delivery Instructions)' : 'Quick Delivery Instructions'}</span>
              </span>
              <span className="text-[9px] text-slate-400">
                {isKm ? 'ចុចដើម្បីផ្ញើតាម Socket ភ្លាមៗ' : 'Instant 1-tap dispatch'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {quickInstructions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleQuickInstruction(item.text, item.type)}
                  className="px-2.5 py-1.2 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 transition whitespace-nowrap shadow-2xs shrink-0 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Message Stream */}
          <div className="p-3 sm:p-4 space-y-3 max-h-64 sm:max-h-72 overflow-y-auto bg-slate-100/50 dark:bg-[#070b12]/50">
            {messages.map((msg) => {
              if (msg.sender === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center my-1">
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-center">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-in fade-in`}
                >
                  <div className="flex items-end gap-1.5 max-w-[85%] sm:max-w-[78%]">
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0 border border-emerald-500/30">
                        {driverName.slice(0, 1)}
                      </div>
                    )}

                    <div
                      className={`p-2.5 sm:p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                          isUser ? 'text-emerald-100' : 'text-slate-400'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {isUser && (
                          <span title={msg.status === 'read' ? 'Read by courier' : msg.status === 'delivered' ? 'Delivered via socket' : 'Sent to server'}>
                            {msg.status === 'read' ? (
                              <CheckCheck className="w-3 h-3 text-sky-200" />
                            ) : msg.status === 'delivered' ? (
                              <CheckCheck className="w-3 h-3 text-emerald-200" />
                            ) : (
                              <Check className="w-3 h-3 text-emerald-200" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Courier Typing Indicator */}
            {isCourierTyping && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs pl-8 animate-in fade-in">
                <span className="font-semibold text-[11px]">{driverName} {isKm ? 'កំពុងវាយអក្សរ...' : 'is typing...'}</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendCustomMessage} className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isKm
                  ? `ផ្ញើសារណែនាំទៅកាន់អ្នកដឹក ${driverName}...`
                  : `Type delivery instructions for ${driverName}...`
              }
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isKm ? 'ផ្ញើ' : 'Send'}</span>
            </button>
          </form>
        </>
      )}
    </div>
  );
};
