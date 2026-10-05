// Mock Socket Service simulating a WebSocket connection between customer and courier
// Supports real-time delivery instructions, acknowledgments, read receipts, and typing indicators

export type SocketStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface CourierSocketMessage {
  id: string;
  sender: 'user' | 'courier' | 'system';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  instructionType?: 'door' | 'bell' | 'call' | 'security' | 'fragile' | 'cod' | 'gate' | 'custom';
}

type EventCallback = (data: any) => void;

export class MockCourierSocket {
  private trackingNumber: string;
  private courierName: string;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private status: SocketStatus = 'disconnected';
  private latencyMs: number = 28;
  private reconnectTimer: any = null;

  constructor(trackingNumber: string, courierName: string = 'Courier Rider') {
    this.trackingNumber = trackingNumber;
    this.courierName = courierName;
  }

  public connect(): void {
    if (this.status === 'connected' || this.status === 'connecting') return;

    this.setStatus('connecting');
    this.emit('status_change', { status: 'connecting', latency: this.latencyMs });

    setTimeout(() => {
      this.setStatus('connected');
      this.latencyMs = Math.floor(22 + Math.random() * 15);
      this.emit('status_change', {
        status: 'connected',
        latency: this.latencyMs,
        socketUrl: `wss://socket.camdelivery.kh/v2/courier-live/${this.trackingNumber}`,
      });
      this.emit('connection_established', {
        courierName: this.courierName,
        trackingNumber: this.trackingNumber,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }, 450);
  }

  public disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.setStatus('disconnected');
    this.emit('status_change', { status: 'disconnected', latency: 0 });
  }

  public getStatus(): SocketStatus {
    return this.status;
  }

  public getLatency(): number {
    return this.latencyMs;
  }

  public on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: string, callback: EventCallback): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  private setStatus(status: SocketStatus): void {
    this.status = status;
  }

  // Send message or quick delivery instruction across mock socket
  public sendInstruction(
    text: string,
    instructionType: CourierSocketMessage['instructionType'] = 'custom',
    language: 'km' | 'en' = 'km'
  ): CourierSocketMessage {
    const isKm = language === 'km';
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const userMessage: CourierSocketMessage = {
      id: msgId,
      sender: 'user',
      text,
      timestamp: timeStr,
      status: 'sent',
      instructionType,
    };

    // Emit immediate message sent
    this.emit('message_sent', userMessage);

    // 1. Simulate courier socket received (Status: delivered)
    setTimeout(() => {
      this.emit('message_status_update', { id: msgId, status: 'delivered' });
    }, 600);

    // 2. Simulate courier read receipt (Status: read)
    setTimeout(() => {
      this.emit('message_status_update', { id: msgId, status: 'read' });
      // 3. Courier starts typing
      this.emit('courier_typing', { isTyping: true });
    }, 1300);

    // 4. Courier dynamic intelligent reply via socket
    setTimeout(() => {
      this.emit('courier_typing', { isTyping: false });

      const replyText = this.generateCourierResponse(text, instructionType, isKm);
      const replyMessage: CourierSocketMessage = {
        id: `reply-${Date.now()}`,
        sender: 'courier',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      };

      this.emit('courier_message', replyMessage);
    }, 2800);

    return userMessage;
  }

  private generateCourierResponse(
    userText: string,
    instructionType: CourierSocketMessage['instructionType'],
    isKm: boolean
  ): string {
    const lower = userText.toLowerCase();

    if (instructionType === 'door' || lower.includes('ទ្វារ') || lower.includes('door')) {
      return isKm
        ? `បាទបង! ខ្ញុំបានទទួលការណែនាំហើយ។ ពេលមកដល់ខ្ញុំនឹងដាក់កញ្ចប់ឥវ៉ាន់នៅមុខទ្វារផ្ទះបងដោយប្រុងប្រយ័ត្ន និងថតរូបផ្ញើជូនបាទ។`
        : `Understood! I will place your parcel safely in front of your door and take a confirmation photo.`;
    }

    if (instructionType === 'bell' || lower.includes('កណ្ដឹង') || lower.includes('bell')) {
      return isKm
        ? `បាទបង! ពេលមកដល់ខ្ញុំនឹងចុចកណ្ដឹងមុខផ្ទះភ្លាមបាទ។`
        : `Got it! I will ring the doorbell as soon as I arrive at your location.`;
    }

    if (instructionType === 'call' || lower.includes('ខល') || lower.includes('call') || lower.includes('ទូរស័ព្ទ')) {
      return isKm
        ? `បាទបង! នៅសល់ប្រហែល ៥ នាទីទៀតខ្ញុំនឹងទូរស័ព្ទជូនដំណឹងបងជាមុនបាទ។`
        : `Sure! I will give you a phone call roughly 5 minutes before arriving.`;
    }

    if (instructionType === 'security' || lower.includes('សន្តិសុខ') || lower.includes('guard')) {
      return isKm
        ? `បាទបង! ខ្ញុំនឹងផ្ញើទុកនៅបុស្តិ៍សន្តិសុខ ឬ Reception ហើយកត់ឈ្មោះអ្នកទទួលទុកបាទ។`
        : `Will do! I will leave it with building security/reception and note their name down.`;
    }

    if (instructionType === 'fragile' || lower.includes('បែក') || lower.includes('fragile')) {
      return isKm
        ? `បាទបង! ខ្ញុំបានកត់ចំណាំថាកញ្ចប់នេះងាយបែក ខ្ញុំនឹងលើកដាក់ដោយដៃថ្នមៗបំផុតបាទ។`
        : `Understood! I have marked this parcel as Fragile and will handle it with extra gentle care.`;
    }

    if (instructionType === 'cod' || lower.includes('cod') || lower.includes('លុយ') || lower.includes('cash')) {
      return isKm
        ? `អរគុណបង! ខ្ញុំមានត្រៀមក្រដាសប្រាក់អាប់ និង Bakong KHQR សម្រាប់បងទូទាត់ផងដែរ។`
        : `Thank you! I have change ready and also accept Bakong KHQR scan upon delivery.`;
    }

    if (instructionType === 'gate' || lower.includes('gate') || lower.includes('កូដ')) {
      return isKm
        ? `បាទបង! ខ្ញុំបានកត់ទុកកូដទ្វារហើយ អរគុណច្រើនបង។`
        : `Received the gate code! Thank you for the detailed delivery instruction.`;
    }

    return isKm
      ? `បាទបង! ខ្ញុំ ${this.courierName} បានទទួលដំណឹងរួចរាល់ហើយ កំពុងធ្វើដំណើរចេញដឹកជូនបាទ!`
      : `Message received! I'm en route and will deliver according to your instructions.`;
  }
}
