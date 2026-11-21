/**
 * Audio Service: Speech Recognition, Speech Synthesis, and Web Audio SFX
 * Enables full voice input and voice output for the Cubic AI Orchestrator
 */

import { VoiceMessageData } from '@/src/shared/types';

// Web Speech Recognition
export interface SpeechRecognitionListener {
  onStart?: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export interface VoiceRecordingCallbacks {
  onStart?: () => void;
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  onTimeUpdate?: (seconds: number) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

class AudioService {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private isMuted = false;
  private audioCtx: AudioContext | null = null;

  // Voice recording & transcription state
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private recordingInterval: any = null;
  private recordingSeconds = 0;
  private isVoiceRecordingActive = false;
  private currentVoiceTranscript = '';
  private activeAudioElement: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ru-RU';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }
    }
  }

  public isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isRecognitionSupported(): boolean {
    return Boolean(this.recognition);
  }

  public startListening(callbacks: SpeechRecognitionListener): boolean {
    if (!this.recognition) {
      callbacks.onError?.(
        'Голосовой ввод не поддерживается данным браузером. Используйте Chrome или Safari.',
      );
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      callbacks.onResult(finalTranscript || interimTranscript, Boolean(finalTranscript));
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      callbacks.onError?.(event.error || 'Ошибка распознавания речи');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      callbacks.onEnd?.();
    };

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('Could not start recognition:', err);
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }

  public speak(
    text: string,
    role: 'registrar' | 'professor' | 'engineer' | 'biochem' = 'professor',
    onEnd?: () => void,
  ) {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    this.stopSpeaking();

    // Clean text from markdown and LaTeX for smoother pronunciation
    const cleanText = text
      .replace(/\$\$[\s\S]*?\$\$/g, ' расчетная формула ')
      .replace(/\$([^$]+)\$/g, ' $1 ')
      .replace(/[*_#`~[\]()]/g, ' ')
      .replace(/\\Delta v/g, 'дельта вэ')
      .replace(/\\rho/g, 'ро')
      .replace(/\\sigma/g, 'сигма')
      .replace(/\\pi/g, 'пи')
      .replace(/\\cdot/g, ' умножить на ')
      .replace(/\\approx/g, ' примерно ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ru-RU';

    // Tailor pitch and rate to the Mascot subagent persona
    switch (role) {
      case 'professor':
        utterance.pitch = 0.95; // Steady, academic
        utterance.rate = 1.0;
        break;
      case 'engineer':
        utterance.pitch = 1.1; // Crisp, energetic
        utterance.rate = 1.05;
        break;
      case 'biochem':
        utterance.pitch = 1.05; // Balanced, calm
        utterance.rate = 1.0;
        break;
      case 'registrar':
      default:
        utterance.pitch = 1.15; // Friendly mascot tone
        utterance.rate = 1.05;
        break;
    }

    // Try to pick a Russian voice if available
    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find((v) => v.lang.startsWith('ru') || v.lang.includes('RU'));
    if (ruVoice) {
      utterance.voice = ruVoice;
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      onEnd?.();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      onEnd?.();
    };

    this.isSpeaking = true;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopSpeaking();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  // Web Audio SFX (Chimes, Warnings, Timer gong)
  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public playSuccessChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // AudioContext unavailable
    }
  }

  public playClickSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // AudioContext unavailable
    }
  }

  public playTimerWarning() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // AudioContext unavailable
    }
  }

  public playTimerStopGong() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      // AudioContext unavailable
    }
  }

  // --- Voice Message Recording & Real-Time Transcription ---

  public isVoiceRecording(): boolean {
    return this.isVoiceRecordingActive;
  }

  public async startVoiceRecording(callbacks?: VoiceRecordingCallbacks): Promise<boolean> {
    if (this.isVoiceRecordingActive) {
      this.cancelVoiceRecording();
    }

    this.isVoiceRecordingActive = true;
    this.recordedChunks = [];
    this.recordingSeconds = 0;
    this.currentVoiceTranscript = '';

    // Audio recording chirp
    this.playClickSound();

    // 1. Setup speech recognition for real-time transcription (ru-RU)
    if (this.recognition) {
      try {
        this.recognition.onstart = () => {
          callbacks?.onStart?.();
        };

        this.recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = 0; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item.isFinal) {
              final += item[0].transcript + ' ';
            } else {
              interim += item[0].transcript;
            }
          }
          const fullText = (final + interim).trim();
          if (fullText) {
            this.currentVoiceTranscript = fullText;
            callbacks?.onTranscriptUpdate?.(fullText, Boolean(final));
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Speech recognition error during voice recording:', event.error);
        };

        this.recognition.onend = () => {
          // If still recording, attempt restart if needed
          if (this.isVoiceRecordingActive && this.recognition) {
            try {
              this.recognition.start();
            } catch (e) {
              // ignore
            }
          }
        };

        this.recognition.start();
      } catch (recErr) {
        console.warn('Speech recognition start failed:', recErr);
      }
    } else {
      callbacks?.onStart?.();
    }

    // 2. Setup MediaRecorder for actual voice audio track
    if (
      typeof window !== 'undefined' &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    ) {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        let mimeType = '';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          }
        }

        if (typeof MediaRecorder !== 'undefined') {
          this.mediaRecorder = mimeType
            ? new MediaRecorder(this.mediaStream, { mimeType })
            : new MediaRecorder(this.mediaStream);

          this.mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              this.recordedChunks.push(e.data);
            }
          };

          this.mediaRecorder.start(200);
        }
      } catch (err: any) {
        console.warn('Could not acquire microphone stream:', err);
      }
    }

    // 3. Start timer ticker
    this.recordingInterval = setInterval(() => {
      this.recordingSeconds += 1;
      callbacks?.onTimeUpdate?.(this.recordingSeconds);
    }, 1000);

    return true;
  }

  public async stopVoiceRecording(): Promise<VoiceMessageData> {
    const duration = Math.max(1, this.recordingSeconds);
    const transcriptText = this.currentVoiceTranscript.trim();

    // Clear timer
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    // Stop speech recognition
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }

    // Stop MediaRecorder and generate blob URL
    let audioBlobUrl: string | undefined = undefined;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        if (!this.mediaRecorder) return resolve();
        this.mediaRecorder.onstop = () => {
          try {
            const blob = new Blob(this.recordedChunks, {
              type: this.mediaRecorder?.mimeType || 'audio/webm',
            });
            audioBlobUrl = URL.createObjectURL(blob);
          } catch (e) {
            console.warn('Could not create Blob URL:', e);
          }
          resolve();
        };
        this.mediaRecorder.stop();
      });
    }

    // Release microphone tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.isVoiceRecordingActive = false;
    this.playSuccessChime();

    // Synthesize realistic waveform bars for visualization (28 points)
    const waveform: number[] = [];
    const barsCount = 28;
    for (let i = 0; i < barsCount; i++) {
      const base = Math.sin((i / barsCount) * Math.PI) * 0.7 + 0.2;
      const noise = (Math.sin(i * 3.7) + 1) * 0.15;
      waveform.push(Math.min(1.0, Math.max(0.15, Number((base + noise).toFixed(2)))));
    }

    const recordedTimeStr = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      audioUrl: audioBlobUrl,
      durationSec: duration,
      transcript: transcriptText || 'Голосовое сообщение экипажа без распознанного текста',
      waveform,
      recordedAt: recordedTimeStr,
    };
  }

  public cancelVoiceRecording(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // ignore
      }
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.recordedChunks = [];
    this.recordingSeconds = 0;
    this.currentVoiceTranscript = '';
    this.isVoiceRecordingActive = false;
  }

  public playVoiceAudio(audioUrl?: string, fallbackTranscript?: string, onEnd?: () => void): void {
    this.stopVoiceAudio();

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        this.activeAudioElement = audio;
        audio.onended = () => {
          this.activeAudioElement = null;
          onEnd?.();
        };
        audio.onerror = () => {
          this.activeAudioElement = null;
          // Fallback to speech synthesis if audio playback errors
          if (fallbackTranscript) {
            this.speak(fallbackTranscript, 'engineer', onEnd);
          } else {
            onEnd?.();
          }
        };
        audio.play().catch((err) => {
          console.warn('Audio play failed, fallback to speak:', err);
          this.activeAudioElement = null;
          if (fallbackTranscript) {
            this.speak(fallbackTranscript, 'engineer', onEnd);
          } else {
            onEnd?.();
          }
        });
        return;
      } catch (e) {
        console.warn('Could not instantiate Audio element:', e);
      }
    }

    // If no audio URL or failed, speak the transcript
    if (fallbackTranscript) {
      this.speak(fallbackTranscript, 'engineer', onEnd);
    } else {
      onEnd?.();
    }
  }

  public stopVoiceAudio(): void {
    if (this.activeAudioElement) {
      this.activeAudioElement.pause();
      this.activeAudioElement = null;
    }
    this.stopSpeaking();
  }
}

export const audioService = new AudioService();
