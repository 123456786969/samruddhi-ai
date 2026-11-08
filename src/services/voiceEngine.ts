/**
 * Samruddhi AI Voice Simulation & Neural Speech Engine
 * Features:
 * 1. 0ms Offline Cache Layer (IndexedDB + Blob storage)
 * 2. High-fidelity Gemini Voice AI Neural Synthesis via /api/tts
 * 3. Client-side Web SpeechSynthesis with 7 Indian Regional Language Accents
 * 4. Harmonic Formant Acoustic Simulation for offline/interrupted scenarios
 */

import { voiceCache } from '../utils/voiceCache';
import { offlineVoiceCache } from './offlineVoiceCache';

export interface PlaybackOptions {
  lang: string;
  sender: 'bot' | 'user';
  text: string;
  audioSrc?: string;
  stepIndex?: number;
  emotion?: 'warm' | 'curious' | 'reassuring' | 'excited' | 'professional';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class VoiceEngineService {
  private audio: HTMLAudioElement | null = null;
  private isCurrentlyPlaying = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioContext: AudioContext | null = null;
  private isMuted = false;
  private chosenVoices: Map<string, SpeechSynthesisVoice | null> = new Map();

  constructor() {
    // Warm up AudioContext and voice list on client load if available
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.audioContext = new AudioCtx();
        } catch {
          // Ignore
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.warmupVoiceList();
        };
        this.warmupVoiceList();
      }
    }
  }

  /**
   * Unlock AudioContext on user interaction (e.g. click Play)
   */
  public resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  private warmupVoiceList() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.muted = muted;
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  public stop() {
    this.isCurrentlyPlaying = false;

    // 1. Stop HTML Audio
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.onended = null;
        this.audio.onerror = null;
        this.audio.currentTime = 0;
        this.audio.src = '';
      } catch {
        // Ignore
      }
      this.audio = null;
    }

    // 2. Stop Web Speech Synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
      this.currentUtterance = null;
    }
  }

  /**
   * Preload audio and persist directly into IndexedDB voiceCache
   */
  public async preload(text: string, lang: string, sender: 'bot' | 'user', audioSrc?: string): Promise<void> {
    try {
      const cleanText = text.trim();
      const cachedUrl = await voiceCache.getVoiceBlobUrl(lang, sender, cleanText);
      if (cachedUrl) return;

      const fetchUrl = audioSrc || `/api/tts?lang=${encodeURIComponent(lang)}&sender=${encodeURIComponent(sender)}&text=${encodeURIComponent(cleanText)}`;
      const res = await fetch(fetchUrl);
      if (res.ok) {
        const blob = await res.blob();
        await voiceCache.storeVoiceBlob(lang, sender, cleanText, blob);
        await offlineVoiceCache.storeVoiceBlob(lang, sender, cleanText, blob);
      }
    } catch {
      // Preload fail is non-fatal
    }
  }

  /**
   * Play speech with guaranteed voice continuity for both Assistant and Customer
   */
  public async playVoice(options: PlaybackOptions): Promise<void> {
    this.stop();
    this.isCurrentlyPlaying = true;
    this.resumeAudioContext();

    const { text, lang, sender, audioSrc, emotion, onStart, onEnd, onError } = options;
    const cleanText = text.trim();

    // 1. Check IndexedDB Offline Cache (0ms edge latency)
    try {
      const cachedUrl = await voiceCache.getVoiceBlobUrl(lang, sender, cleanText);
      if (cachedUrl) {
        if (!this.isCurrentlyPlaying) return;
        return this.playFromUrl(cachedUrl, onStart, onEnd, onError, cleanText, lang, sender, emotion);
      }
    } catch (cacheLookupErr) {
      console.warn('[VoiceEngine] IndexedDB cache lookup skipped:', cacheLookupErr);
    }

    // 2. Direct Pre-rendered Audio Path (Zero-Lag, 100% Voice Consistency)
    if (audioSrc) {
      return this.playFromUrl(audioSrc, onStart, onEnd, onError, cleanText, lang, sender, emotion);
    }

    // 3. Check if offline simulated or device offline
    const isOffline = typeof navigator !== 'undefined' && (!navigator.onLine || voiceCache.getIsSimulatedOffline() || offlineVoiceCache.getIsSimulatedOffline());
    if (isOffline) {
      return this.fallbackSpeechSynthesis(cleanText, lang, sender, emotion, onStart, onEnd, onError);
    }

    // 4. Server-Side High Fidelity TTS
    try {
      const ttsUrl = `/api/tts?lang=${encodeURIComponent(lang)}&sender=${encodeURIComponent(sender)}&text=${encodeURIComponent(cleanText)}`;
      const res = await fetch(ttsUrl);
      if (!res.ok) {
        throw new Error(`Server TTS returned status: ${res.status}`);
      }
      
      const blob = await res.blob();
      const objectUrl = await voiceCache.storeVoiceBlob(lang, sender, cleanText, blob);
      await offlineVoiceCache.storeVoiceBlob(lang, sender, cleanText, blob);

      if (!this.isCurrentlyPlaying) return;
      return this.playFromUrl(objectUrl, onStart, onEnd, onError, cleanText, lang, sender, emotion);
    } catch (serverErr: any) {
      if (serverErr?.name === 'AbortError' || serverErr?.message?.includes('interrupted by a call to pause')) {
        return;
      }
      console.warn('[VoiceEngine] Server TTS route fallback triggered:', serverErr?.message);
      this.fallbackSpeechSynthesis(cleanText, lang, sender, emotion, onStart, onEnd, onError);
    }
  }

  private playFromUrl(
    url: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void,
    text?: string,
    lang?: string,
    sender?: 'bot' | 'user',
    emotion?: string
  ) {
    // Create and initialize audio element with proper src
    const audio = new Audio(url);
    this.audio = audio;
    audio.src = url;
    audio.volume = 1.0;
    audio.muted = this.isMuted;
    audio.preload = 'auto';

    // Tone & cadence balancing:
    // Assistant (bot): crisp, articulate 1.02x
    // Customer (user): natural, relaxed 0.96x
    audio.playbackRate = sender === 'user' ? 0.96 : 1.02;

    audio.onplay = () => {
      onStart?.();
    };

    audio.onended = () => {
      this.isCurrentlyPlaying = false;
      this.audio = null;
      onEnd?.();
    };

    audio.onerror = (e) => {
      console.warn('[VoiceEngine] Audio playback error, checking server TTS fallback', e);
      if (text && lang && sender) {
        const ttsUrl = `/api/tts?lang=${encodeURIComponent(lang)}&sender=${encodeURIComponent(sender)}&text=${encodeURIComponent(text.trim())}`;
        fetch(ttsUrl)
          .then((res) => {
            if (!res.ok) throw new Error('Server TTS response not ok');
            return res.blob();
          })
          .then((blob) => {
            const objectUrl = URL.createObjectURL(blob);
            this.playFromUrl(objectUrl, onStart, onEnd, onError);
          })
          .catch(() => {
            this.fallbackSpeechSynthesis(text, lang, sender, emotion as any, onStart, onEnd, onError);
          });
      } else {
        this.isCurrentlyPlaying = false;
        onError?.(e);
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((playErr) => {
        if (playErr?.name !== 'AbortError') {
          console.warn('[VoiceEngine] Audio play promise rejected, checking fallback:', playErr?.message);
          if (text && lang && sender) {
            const ttsUrl = `/api/tts?lang=${encodeURIComponent(lang)}&sender=${encodeURIComponent(sender)}&text=${encodeURIComponent(text.trim())}`;
            fetch(ttsUrl)
              .then((res) => {
                if (!res.ok) throw new Error('Server TTS response not ok');
                return res.blob();
              })
              .then((blob) => {
                const objectUrl = URL.createObjectURL(blob);
                this.playFromUrl(objectUrl, onStart, onEnd, onError);
              })
              .catch(() => {
                this.fallbackSpeechSynthesis(text, lang, sender, emotion as any, onStart, onEnd, onError);
              });
          } else {
            onError?.(playErr);
          }
        }
      });
    }
  }

  /**
   * Tier 2: Browser Speech Synthesis with Strict Dual-Voice Consistency
   * Guarantees that Assistant retains a distinct female persona and Customer retains a distinct male persona across all dialogue turns.
   */
  private fallbackSpeechSynthesis(
    text: string,
    lang: string,
    sender: 'bot' | 'user',
    emotion?: 'warm' | 'curious' | 'reassuring' | 'excited' | 'professional',
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.isCurrentlyPlaying) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        // Map regional language codes to Indian locale tags
        const langMap: Record<string, string> = {
          en: 'en-IN',
          hi: 'hi-IN',
          kn: 'kn-IN',
          ta: 'ta-IN',
          te: 'te-IN',
          ml: 'ml-IN',
          mr: 'mr-IN'
        };

        const targetLocale = langMap[lang] || 'en-IN';
        utterance.lang = targetLocale;
        
        // Strict Dual Voice Persona Configuration:
        // Bot (Assistant): Female vocal range, pleasant, confident
        // User (Customer): Male vocal range, authentic homebuyer cadence
        const isBot = sender === 'bot';
        let baseRate = isBot ? 1.02 : 0.94;
        let basePitch = isBot ? 1.16 : 0.84;

        if (emotion === 'excited') {
          baseRate += 0.05;
          basePitch += 0.08;
        } else if (emotion === 'reassuring') {
          baseRate -= 0.04;
          basePitch += 0.04;
        } else if (emotion === 'warm') {
          basePitch += 0.06;
        }

        utterance.rate = Math.max(0.8, Math.min(1.4, baseRate));
        utterance.pitch = Math.max(0.6, Math.min(1.6, basePitch));

        const voices = window.speechSynthesis.getVoices();
        const targetPrefix = lang.toLowerCase();

        // Exact dialect voice filtering - only match voices truly belonging to target language
        const matchingVoices = voices.filter(v => {
          const vLang = v.lang.toLowerCase().replace('_', '-');
          return vLang.startsWith(targetPrefix);
        });

        // If target language is non-English and browser has NO native voice for that language,
        // NEVER allow an English voice to read Kannada or Indian script.
        if (targetPrefix !== 'en' && matchingVoices.length === 0) {
          const ttsUrl = `/api/tts?lang=${encodeURIComponent(lang)}&sender=${encodeURIComponent(sender)}&text=${encodeURIComponent(text.trim())}`;
          fetch(ttsUrl)
            .then(res => {
              if (!res.ok) throw new Error('Server TTS not ok');
              return res.blob();
            })
            .then(blob => {
              const objectUrl = URL.createObjectURL(blob);
              this.playFromUrl(objectUrl, onStart, onEnd, onError, text, lang, sender, emotion);
            })
            .catch(() => {
              this.fallbackAudioTone(text, sender, onStart, onEnd);
            });
          return;
        }

        // Pin voice per (lang, sender) to prevent voice changes mid-conversation
        const voiceKey = `${lang}_${sender}`;
        if (!this.chosenVoices.has(voiceKey)) {
          let selectedVoice: SpeechSynthesisVoice | null = null;

          if (isBot) {
            // Find female voice for Assistant
            selectedVoice = matchingVoices.find(v => 
              v.name.toLowerCase().includes('female') || 
              v.name.toLowerCase().includes('zira') || 
              v.name.toLowerCase().includes('samantha') || 
              v.name.toLowerCase().includes('heera') || 
              v.name.toLowerCase().includes('kavya') || 
              v.name.toLowerCase().includes('aditi') ||
              v.name.toLowerCase().includes('priya')
            ) || matchingVoices[0] || null;
          } else {
            // Find male voice for Customer
            selectedVoice = matchingVoices.find(v => 
              v.name.toLowerCase().includes('male') || 
              v.name.toLowerCase().includes('david') || 
              v.name.toLowerCase().includes('ravi') || 
              v.name.toLowerCase().includes('prabhat') || 
              v.name.toLowerCase().includes('george')
            ) || matchingVoices[matchingVoices.length > 1 ? 1 : 0] || null;
          }

          this.chosenVoices.set(voiceKey, selectedVoice);
        }

        const chosen = this.chosenVoices.get(voiceKey);
        if (chosen) {
          utterance.voice = chosen;
        }

        utterance.onstart = () => {
          onStart?.();
        };

        utterance.onend = () => {
          this.isCurrentlyPlaying = false;
          this.currentUtterance = null;
          onEnd?.();
        };

        utterance.onerror = (err) => {
          console.warn('[VoiceEngine] SpeechSynthesis error, using acoustic tone simulation', err);
          this.fallbackAudioTone(text, sender, onStart, onEnd);
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (synthErr) {
        console.warn('[VoiceEngine] SpeechSynthesis exception', synthErr);
      }
    }

    // Tier 3 Fallback: Harmonic phone simulation
    this.fallbackAudioTone(text, sender, onStart, onEnd);
  }

  /**
   * Tier 3 Fallback: Web Audio API voice simulation
   * Distinct dual-frequency formant modulation for Bot vs Customer.
   */
  private fallbackAudioTone(text: string, sender: 'bot' | 'user', onStart?: () => void, onEnd?: () => void) {
    if (!this.isCurrentlyPlaying) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        const wordCount = text.split(' ').length;
        const durationMs = Math.max(1800, wordCount * 320);
        onStart?.();
        setTimeout(() => {
          if (this.isCurrentlyPlaying) {
            this.isCurrentlyPlaying = false;
            onEnd?.();
          }
        }, durationMs);
        return;
      }

      const ctx = this.audioContext || new AudioCtx();
      this.audioContext = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      onStart?.();

      const wordCount = text.split(' ').length;
      const durationSec = Math.max(1.8, wordCount * 0.32);

      // Distinct frequencies: Bot (female/260Hz), Customer (male/160Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      const baseFreq = sender === 'bot' ? 260 : 160;
      osc1.type = sender === 'bot' ? 'triangle' : 'sawtooth';
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * (sender === 'bot' ? 1.2 : 1.1), ctx.currentTime + durationSec * 0.5);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2.0, ctx.currentTime);

      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + durationSec);
      osc2.stop(ctx.currentTime + durationSec);

      setTimeout(() => {
        if (this.isCurrentlyPlaying) {
          this.isCurrentlyPlaying = false;
          onEnd?.();
        }
      }, durationSec * 1000);
    } catch {
      onStart?.();
      setTimeout(() => {
        this.isCurrentlyPlaying = false;
        onEnd?.();
      }, 2500);
    }
  }
}

export const voiceEngine = new VoiceEngineService();
