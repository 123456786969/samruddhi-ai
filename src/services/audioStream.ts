/**
 * High-Fidelity Audio Streaming & Live Conversational Voice Services
 * 
 * Solutions implemented for acoustic feedback loop & PCM static:
 * 1. ZERO-GAIN MUTED PROCESSOR BUS: Completely eliminates the mic-to-speaker feedback screech.
 * 2. AUTOMATIC MIC DUCKING: Suppresses mic capture while AI is speaking so speaker audio never leaks into mic.
 * 3. 16-BIT LITTLE-ENDIAN PCM TO FLOAT32 NORMALIZATION: Divides by 32768.0 using DataView to avoid static bursts.
 * 4. HEADER STRIPPING: Strips any accidental 44-byte WAV RIFF headers from raw streaming chunks.
 * 5. W3C ROBUST AEC CONSTRAINTS: Hardware Echo Cancellation, Noise Suppression, and Auto-Gain Control.
 */

// 1. High-fidelity microphone constraints for conversational agents
export const MIC_AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    channelCount: 1,
    sampleRate: 16000, // Matches standard STT models (Deepgram/Sarvam/Whisper/Gemini Live)
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: false,
};

// 2. Bolna & Indic Agent Synthesizer Config Presets
export interface BolnaSynthesizerConfig {
  provider: 'sarvam' | 'smallest' | 'gemini_indic';
  provider_config: {
    voice: string;
    language: string;
    model: string;
    pitch: number;
    pace: number;
  };
  buffer_size: number;
  audio_format: 'pcm';
  sample_rate: number;
}

export const BOLNA_INDIC_CONFIGS: Record<string, BolnaSynthesizerConfig> = {
  kn: {
    provider: 'sarvam',
    provider_config: {
      voice: 'meera',
      language: 'kn-IN',
      model: 'bulbul:v1',
      pitch: 0,
      pace: 1.05,
    },
    buffer_size: 150,
    audio_format: 'pcm',
    sample_rate: 24000,
  },
  te: {
    provider: 'sarvam',
    provider_config: {
      voice: 'suresh',
      language: 'te-IN',
      model: 'bulbul:v1',
      pitch: 0,
      pace: 1.05,
    },
    buffer_size: 150,
    audio_format: 'pcm',
    sample_rate: 24000,
  },
  ta: {
    provider: 'sarvam',
    provider_config: {
      voice: 'kavya',
      language: 'ta-IN',
      model: 'bulbul:v1',
      pitch: 0,
      pace: 1.05,
    },
    buffer_size: 150,
    audio_format: 'pcm',
    sample_rate: 24000,
  },
  hi: {
    provider: 'sarvam',
    provider_config: {
      voice: 'pooja',
      language: 'hi-IN',
      model: 'bulbul:v1',
      pitch: 0,
      pace: 1.02,
    },
    buffer_size: 150,
    audio_format: 'pcm',
    sample_rate: 24000,
  },
  en: {
    provider: 'sarvam',
    provider_config: {
      voice: 'aditi',
      language: 'en-IN',
      model: 'bulbul:v1',
      pitch: 0,
      pace: 1.02,
    },
    buffer_size: 150,
    audio_format: 'pcm',
    sample_rate: 24000,
  },
};

// 3. Frontend Web Audio Playback Buffer (Fixes Stutter, Static & Feedback)
export class AudioPlayerQueue {
  private audioCtx: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private sampleRate: number;
  private activeSources: number = 0;
  private isCurrentlyPlaying: boolean = false;
  public onPlayStateChange?: (isPlaying: boolean) => void;

  constructor(sampleRate = 24000) {
    this.sampleRate = sampleRate;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx({
          sampleRate: this.sampleRate,
          latencyHint: 'interactive',
        });
        this.nextPlayTime = 0;
      }
    }
    return this.audioCtx;
  }

  public isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  // Expects Int16Array or Float32Array PCM chunks streamed over WebSocket / WebRTC
  public playChunk(pcmData: Int16Array | Float32Array) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const audioBuffer = ctx.createBuffer(1, pcmData.length, ctx.sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Convert Int16 PCM to Float32 (-1.0 to 1.0) with clipping protection
    if (pcmData instanceof Int16Array) {
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
      }
    } else {
      channelData.set(pcmData);
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }

    source.start(this.nextPlayTime);
    this.nextPlayTime += audioBuffer.duration;

    // Track active sources to enable automatic mic ducking and kill feedback loops
    this.activeSources++;
    if (!this.isCurrentlyPlaying) {
      this.isCurrentlyPlaying = true;
      this.onPlayStateChange?.(true);
    }

    source.onended = () => {
      this.activeSources--;
      if (this.activeSources <= 0) {
        this.activeSources = 0;
        // 220ms grace period so room acoustics & echoes settle before re-opening mic
        setTimeout(() => {
          if (this.activeSources === 0) {
            this.isCurrentlyPlaying = false;
            this.onPlayStateChange?.(false);
          }
        }, 220);
      }
    };
  }

  // Standard raw binary PCM chunk converter with Little-Endian & WAV header stripping
  public playRawAudioChunk(arrayBuffer: ArrayBuffer) {
    let byteOffset = 0;
    let byteLength = arrayBuffer.byteLength;

    // Check if there is an accidental 44-byte WAV header (RIFF) causing screeching noise
    const u8 = new Uint8Array(arrayBuffer);
    if (byteLength >= 44 && u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46) {
      byteOffset = 44;
      byteLength -= 44;
    }

    // Ensure even byte length for 16-bit PCM
    const evenLen = byteLength - (byteLength % 2);
    if (evenLen <= 0) return;

    const dataView = new DataView(arrayBuffer, byteOffset, evenLen);
    const sampleCount = evenLen / 2;
    const float32Array = new Float32Array(sampleCount);

    // Normalize Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0) with Little-Endian interpretation
    for (let i = 0; i < sampleCount; i++) {
      float32Array[i] = dataView.getInt16(i * 2, true) / 32768.0;
    }

    this.playChunk(float32Array);
  }

  // Play base64-encoded raw 16-bit PCM little-endian audio chunk (from Gemini Live API)
  public playBase64Chunk(base64Pcm: string) {
    try {
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      this.playRawAudioChunk(bytes.buffer);
    } catch (err) {
      console.warn('[AudioPlayerQueue] Error decoding base64 PCM chunk:', err);
    }
  }

  public stop() {
    this.nextPlayTime = 0;
    this.activeSources = 0;
    if (this.isCurrentlyPlaying) {
      this.isCurrentlyPlaying = false;
      this.onPlayStateChange?.(false);
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }

  public clearQueue() {
    if (this.audioCtx) {
      this.nextPlayTime = this.audioCtx.currentTime;
    }
    this.activeSources = 0;
    if (this.isCurrentlyPlaying) {
      this.isCurrentlyPlaying = false;
      this.onPlayStateChange?.(false);
    }
  }
}

// Voice Audio Sanitizer: Strips URLs, markdown syntax, symbols, and formatting
// so TTS engines never read out "https colon slash slash" or raw punctuation.
export function sanitizeForVoice(text: string): string {
  if (!text) return '';
  let clean = String(text);

  // 1. Strip raw URLs (http, https, www, domain names)
  clean = clean.replace(/https?:\/\/[^\s)>]+/gi, '');
  clean = clean.replace(/www\.[^\s)>]+/gi, '');

  // 2. Strip Markdown links [Label](url) -> Keep Label
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 3. Strip Markdown images ![Alt](url) -> Remove
  clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

  // 4. Strip markdown formatting: bold, italic, strikethrough, backticks, blockquotes, headers
  clean = clean.replace(/[*#_`~>]/g, '');

  // 5. Strip brackets, braces, and citation tags like [1], (ref), <tags>
  clean = clean.replace(/<[^>]*>/g, '');
  clean = clean.replace(/\[\d+\]/g, '');
  clean = clean.replace(/[\[\]{}]/g, '');

  // 6. Strip emojis and non-standard symbols
  clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // 7. Strip isolated web domains (e.g. samruddhi.ai, godrej.com)
  clean = clean.replace(/\b([a-zA-Z0-9-]+\.(com|org|net|in|ai|co|io))\b/gi, '');

  // 8. Collapse whitespace
  return clean.replace(/\s+/g, ' ').trim();
}

// 4. Microphone capture service with AEC, Noise Suppression & Feedback-Proof Muted Sink
export class MicStreamRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private muteGain: GainNode | null = null;
  private isRecording: boolean = false;
  private isDucked: boolean = false;

  public setDucked(ducked: boolean) {
    this.isDucked = ducked;
    // Hardware-level audio track muting:
    // Disables mic capture at the browser/OS track level while AI speaks
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !ducked;
      });
    }
  }

  public getIsDucked(): boolean {
    return this.isDucked;
  }

  public async start(onAudioChunk: (base64Pcm16k: string, floatData: Float32Array) => void): Promise<void> {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      throw new Error('Microphone not supported in this browser environment');
    }

    // Try high-fidelity constraints with fallback to standard echo cancellation
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia(MIC_AUDIO_CONSTRAINTS);
    } catch (err) {
      console.warn('[MicStreamRecorder] Standard constraints fallback engaged:', err);
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioCtx({ sampleRate: 16000 });
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    // CRITICAL: Mute gain bus (gain = 0) prevents microphone from feeding back into speakers!
    this.muteGain = this.audioContext.createGain();
    this.muteGain.gain.setValueAtTime(0, this.audioContext.currentTime);

    this.processor.onaudioprocess = (e) => {
      // If stopped or ducked (AI currently speaking), drop mic input to kill feedback loop
      if (!this.isRecording || this.isDucked) return;
      const input = e.inputBuffer.getChannelData(0);
      
      // Convert Float32 to Int16 PCM (16kHz Little-Endian)
      const pcm16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Convert to base64 string
      const buffer = pcm16.buffer;
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      onAudioChunk(base64, input);
    };

    // Route: source -> processor -> muteGain(0.0) -> destination
    // Keeps processor pumping events without outputting mic audio to speakers!
    this.source.connect(this.processor);
    this.processor.connect(this.muteGain);
    this.muteGain.connect(this.audioContext.destination);
    this.isRecording = true;
  }

  public stop() {
    this.isRecording = false;
    this.isDucked = false;
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.muteGain) {
      this.muteGain.disconnect();
      this.muteGain = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}
