import { AudioPlayerQueue, MicStreamRecorder, sanitizeForVoice } from './audioStream';
import { voiceEngine } from './voiceEngine';

export interface LiveMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
}

export type LiveSessionStatus = 
  | 'idle' 
  | 'connecting' 
  | 'connected' 
  | 'listening' 
  | 'speaking' 
  | 'processing' 
  | 'error';

export interface LiveConversationCallbacks {
  onStatusChange?: (status: LiveSessionStatus) => void;
  onMessage?: (message: LiveMessage) => void;
  onTranscriptUpdate?: (transcript: string, isUser: boolean) => void;
  onError?: (error: string) => void;
}

export class LiveConversationClient {
  private ws: WebSocket | null = null;
  private audioQueue: AudioPlayerQueue;
  private micRecorder: MicStreamRecorder;
  private currentAudio: HTMLAudioElement | null = null;
  private status: LiveSessionStatus = 'idle';
  private callbacks: LiveConversationCallbacks = {};
  private currentLanguage: string = 'en';
  private isMuted: boolean = false;
  private fallbackActive: boolean = false;
  private isConnecting: boolean = false;

  constructor() {
    this.audioQueue = new AudioPlayerQueue(24000);
    this.micRecorder = new MicStreamRecorder();

    // Kill Acoustic Feedback Loop: Automatically duck mic (hardware track disable) while AI is speaking
    this.audioQueue.onPlayStateChange = (isPlaying) => {
      this.micRecorder.setDucked(isPlaying);
      if (isPlaying) {
        this.updateStatus('speaking');
      } else {
        if (this.status === 'speaking') {
          this.updateStatus('listening');
        }
      }
    };
  }

  public setCallbacks(callbacks: LiveConversationCallbacks) {
    this.callbacks = callbacks;
  }

  public getStatus(): LiveSessionStatus {
    return this.status;
  }

  private updateStatus(newStatus: LiveSessionStatus) {
    this.status = newStatus;
    this.callbacks.onStatusChange?.(newStatus);
  }

  public async startSession(language: string = 'en'): Promise<void> {
    if (this.isConnecting) {
      console.log('[LiveClient] Already connecting, ignoring concurrent request');
      return;
    }
    this.isConnecting = true;

    // 1. Immediately abort & stop any previous session, voice engine scenario, or audio playback
    this.endSession();
    voiceEngine.stop();

    this.currentLanguage = language;
    this.updateStatus('connecting');

    try {
      // 2. Initialize microphone with hardware AEC, noise suppression, and feedback-proof sink
      await this.micRecorder.start((base64Pcm16k) => {
        // Do not forward mic chunks if muted or if AI is currently playing
        if (this.isMuted || this.audioQueue.isPlaying() || this.micRecorder.getIsDucked()) return;
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'audio',
            audio: base64Pcm16k
          }));
        }
      });

      // 3. Establish singleton WebSocket connection to server Live API bridge
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?lang=${encodeURIComponent(language)}`;

      const ws = new WebSocket(wsUrl);
      this.ws = ws;
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        this.updateStatus('connected');
        this.fallbackActive = false;
        this.isConnecting = false;
      };

      ws.onmessage = (event) => {
        // Support binary ArrayBuffer chunks directly
        if (event.data instanceof ArrayBuffer) {
          this.audioQueue.playRawAudioChunk(event.data);
          return;
        }

        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ready') {
            this.updateStatus('listening');
          } else if (data.type === 'audio' && data.audio) {
            this.audioQueue.playBase64Chunk(data.audio);
          } else if (data.type === 'outputTranscription' && data.transcript) {
            const cleanTranscript = sanitizeForVoice(data.transcript);
            if (cleanTranscript) {
              this.callbacks.onTranscriptUpdate?.(cleanTranscript, false);
              this.callbacks.onMessage?.({
                id: 'ai-' + Date.now(),
                sender: 'ai',
                text: cleanTranscript,
                timestamp: Date.now()
              });
            }
          } else if (data.type === 'inputTranscription' && data.transcript) {
            const cleanTranscript = sanitizeForVoice(data.transcript);
            if (cleanTranscript) {
              this.callbacks.onTranscriptUpdate?.(cleanTranscript, true);
              this.callbacks.onMessage?.({
                id: 'user-' + Date.now(),
                sender: 'user',
                text: cleanTranscript,
                timestamp: Date.now()
              });
            }
          } else if (data.type === 'interrupted') {
            this.audioQueue.clearQueue();
            this.updateStatus('listening');
          } else if (data.type === 'turnComplete') {
            this.updateStatus('listening');
          } else if (data.type === 'error') {
            console.warn('[LiveClient] Server reported error:', data.message);
            if (data.fallbackReady) {
              this.fallbackActive = true;
            }
          }
        } catch (err) {
          console.warn('[LiveClient] Error parsing message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[LiveClient] WebSocket error, enabling HTTP voice fallback:', err);
        this.fallbackActive = true;
        this.isConnecting = false;
      };

      ws.onclose = () => {
        this.isConnecting = false;
        if (this.status !== 'idle') {
          this.updateStatus('idle');
        }
      };
    } catch (err: any) {
      console.warn('[LiveClient] Failed to start live session:', err);
      this.isConnecting = false;
      this.updateStatus('error');
      this.callbacks.onError?.(err?.message || 'Could not connect microphone or live server');
    }
  }

  // Fallback direct text/voice turn using gemini-3.8-flash
  public async sendChatMessage(text: string): Promise<void> {
    const cleanUserText = sanitizeForVoice(text);
    if (!cleanUserText) return;

    this.callbacks.onMessage?.({
      id: 'user-' + Date.now(),
      sender: 'user',
      text: cleanUserText,
      timestamp: Date.now()
    });

    if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.fallbackActive) {
      this.ws.send(JSON.stringify({ type: 'text', text: cleanUserText }));
      return;
    }

    // HTTP fallback with gemini-3.8-flash
    this.updateStatus('processing');
    try {
      const res = await fetch('/api/live/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanUserText,
          lang: this.currentLanguage
        })
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data = await res.json();
      const cleanAiReply = sanitizeForVoice(data.reply || data.text || '');

      if (cleanAiReply) {
        this.callbacks.onMessage?.({
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text: cleanAiReply,
          timestamp: Date.now()
        });
      }

      if (data.audioBase64) {
        this.updateStatus('speaking');
        this.audioQueue.playBase64Chunk(data.audioBase64);
      } else if (data.audioUrl) {
        this.updateStatus('speaking');
        // Stop any previously playing audio element
        if (this.currentAudio) {
          try {
            this.currentAudio.pause();
            this.currentAudio.src = '';
          } catch {}
          this.currentAudio = null;
        }

        // Programmatically mute microphone hardware track while fallback audio plays
        this.micRecorder.setDucked(true);
        const audio = new Audio(data.audioUrl);
        this.currentAudio = audio;

        const onAudioDone = () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            setTimeout(() => {
              this.micRecorder.setDucked(false);
              this.updateStatus('listening');
            }, 220);
          }
        };

        audio.onended = onAudioDone;
        audio.onerror = onAudioDone;
        audio.play().catch(onAudioDone);
      } else {
        this.updateStatus('listening');
      }
    } catch (httpErr: any) {
      console.warn('[LiveClient] Chat fallback error:', httpErr);
      this.micRecorder.setDucked(false);
      this.updateStatus('listening');
    }
  }

  public endSession() {
    this.isConnecting = false;
    this.micRecorder.stop();
    this.audioQueue.stop();

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.src = '';
      } catch {}
      this.currentAudio = null;
    }

    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.updateStatus('idle');
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const liveConversationClient = new LiveConversationClient();
