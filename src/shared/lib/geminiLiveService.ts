/**
 * Gemini Live API Client Service
 * Bridges browser audio (16kHz PCM Little-Endian) with Gemini Live 3.8 real-time conversational model
 * and plays back 24kHz PCM gapless audio chunks with interruption handling.
 */

export type LiveSessionStatus =
  'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'closed';

export interface LiveTranscriptItem {
  id: string;
  sender: 'user' | 'cubic';
  text: string;
  timestamp: string;
  isInterim?: boolean;
}

export interface LiveVoiceConfig {
  roleAgent: string;
  voiceName: string;
  teamContext?: {
    taskTitle?: string;
    projectName?: string;
    stage?: string;
  };
}

export const GEMINI_LIVE_VOICES = [
  {
    id: 'Charon',
    name: 'Харон (Charon)',
    desc: 'Глубокий, спокойный, академический',
    gender: 'Мужской',
  },
  { id: 'Puck', name: 'Пак (Puck)', desc: 'Бодрый, энергичный, технический', gender: 'Мужской' },
  { id: 'Kore', name: 'Кора (Kore)', desc: 'Четкий, научный, вдохновляющий', gender: 'Женский' },
  {
    id: 'Zephyr',
    name: 'Зефир (Zephyr)',
    desc: 'Мягкий, доброжелательный, структурирующий',
    gender: 'Женский',
  },
  {
    id: 'Fenrir',
    name: 'Фенрир (Fenrir)',
    desc: 'Космический, уверенный, динамичный',
    gender: 'Мужской',
  },
];

function float32To16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true); // little-endian
  }
  return buffer;
}

function base64FromArrayBuffer(arrayBuffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToFloat32(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const dataView = new DataView(bytes.buffer);
  const sampleCount = Math.floor(len / 2);
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const int16 = dataView.getInt16(i * 2, true); // little-endian
    float32[i] = int16 / 32768.0;
  }
  return float32;
}

export class GeminiLiveService {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  private nextPlaybackStartTime = 0;
  private activeAudioSources: AudioBufferSourceNode[] = [];
  private status: LiveSessionStatus = 'idle';

  private isMicMuted = false;
  private inputVolumeLevel = 0;
  private outputVolumeLevel = 0;

  // Listeners
  private statusListeners: Array<(status: LiveSessionStatus) => void> = [];
  private transcriptListeners: Array<(item: LiveTranscriptItem) => void> = [];
  private audioLevelListeners: Array<(inputLevel: number, outputLevel: number) => void> = [];
  private errorListeners: Array<(error: string) => void> = [];

  private currentModelTranscript = '';

  public getStatus(): LiveSessionStatus {
    return this.status;
  }

  public getIsMuted(): boolean {
    return this.isMicMuted;
  }

  public setMicMuted(muted: boolean) {
    this.isMicMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public onStatusChange(fn: (status: LiveSessionStatus) => void): () => void {
    this.statusListeners.push(fn);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== fn);
    };
  }

  public onTranscript(fn: (item: LiveTranscriptItem) => void): () => void {
    this.transcriptListeners.push(fn);
    return () => {
      this.transcriptListeners = this.transcriptListeners.filter((l) => l !== fn);
    };
  }

  public onAudioLevel(fn: (inputLevel: number, outputLevel: number) => void): () => void {
    this.audioLevelListeners.push(fn);
    return () => {
      this.audioLevelListeners = this.audioLevelListeners.filter((l) => l !== fn);
    };
  }

  public onError(fn: (error: string) => void): () => void {
    this.errorListeners.push(fn);
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== fn);
    };
  }

  private setStatus(status: LiveSessionStatus) {
    this.status = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  private emitTranscript(item: LiveTranscriptItem) {
    this.transcriptListeners.forEach((fn) => fn(item));
  }

  private emitAudioLevel(inLevel: number, outLevel: number) {
    this.inputVolumeLevel = inLevel;
    this.outputVolumeLevel = outLevel;
    this.audioLevelListeners.forEach((fn) => fn(inLevel, outLevel));
  }

  private emitError(err: string) {
    this.errorListeners.forEach((fn) => fn(err));
  }

  /**
   * Starts a Live session and requests microphone permission
   */
  public async connect(config: LiveVoiceConfig): Promise<boolean> {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return true;
    }

    this.setStatus('connecting');
    this.stopPlayback();

    try {
      // 1. Initialize output AudioContext (24kHz for Gemini Live audio playback)
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      if (this.outputAudioCtx.state === 'suspended') {
        await this.outputAudioCtx.resume();
      }

      // 2. Open WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send initial setup
        this.ws?.send(
          JSON.stringify({
            type: 'init',
            roleAgent: config.roleAgent,
            voiceName: config.voiceName,
            teamContext: config.teamContext,
          }),
        );
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (err) {
          console.warn('[GeminiLive] Failed to parse message', err);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[GeminiLive] WebSocket error', e);
        this.emitError('Ошибка соединения с сервером голосовой связи');
        this.setStatus('error');
      };

      this.ws.onclose = () => {
        this.setStatus('closed');
        this.cleanupAudio();
      };

      // 3. Start microphone capture (16kHz PCM)
      await this.startMicrophone();
      return true;
    } catch (err: any) {
      console.error('[GeminiLive] Connection error', err);
      this.emitError(err?.message || 'Не удалось подключить микрофон или сервер');
      this.setStatus('error');
      this.disconnect();
      return false;
    }
  }

  private async startMicrophone() {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
    if (this.inputAudioCtx.state === 'suspended') {
      await this.inputAudioCtx.resume();
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.sourceNode = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
    // Use 2048 or 4096 buffer size for real-time low latency
    this.processorNode = this.inputAudioCtx.createScriptProcessor(2048, 1, 1);

    this.processorNode.onaudioprocess = (e) => {
      if (this.isMicMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.emitAudioLevel(0, this.outputVolumeLevel);
        return;
      }

      const inputChannelData = e.inputBuffer.getChannelData(0);

      // Compute RMS volume level for UI
      let sum = 0;
      for (let i = 0; i < inputChannelData.length; i++) {
        sum += inputChannelData[i] * inputChannelData[i];
      }
      const rms = Math.sqrt(sum / inputChannelData.length);
      const level = Math.min(1, rms * 5); // amplify for visualizer
      this.emitAudioLevel(level, this.outputVolumeLevel);

      // Convert to 16-bit PCM little-endian
      const pcmBuffer = float32To16BitPCM(inputChannelData);
      const base64Audio = base64FromArrayBuffer(pcmBuffer);

      this.ws.send(
        JSON.stringify({
          type: 'audio',
          audio: base64Audio,
        }),
      );
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.inputAudioCtx.destination);
  }

  private handleServerMessage(data: any) {
    if (data.type === 'sessionReady') {
      this.setStatus('listening');
    } else if (data.type === 'interrupted') {
      // User spoke over the model - stop current playback immediately
      this.stopPlayback();
      this.setStatus('listening');
    } else if (data.type === 'audio' && data.audio) {
      this.setStatus('speaking');
      this.playAudioChunk(data.audio);
    } else if (data.type === 'outputTranscription' && data.text) {
      this.currentModelTranscript += data.text;
      this.emitTranscript({
        id: `live-model-${Date.now()}`,
        sender: 'cubic',
        text: this.currentModelTranscript,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isInterim: !data.finished,
      });
      if (data.finished) {
        this.currentModelTranscript = '';
      }
    } else if (data.type === 'modelText' && data.text) {
      if (!this.currentModelTranscript) {
        this.emitTranscript({
          id: `live-text-${Date.now()}`,
          sender: 'cubic',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isInterim: false,
        });
      }
    } else if (data.type === 'inputTranscription' && data.text) {
      this.emitTranscript({
        id: `live-user-${Date.now()}`,
        sender: 'user',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isInterim: data.interim,
      });
    } else if (data.type === 'turnComplete') {
      this.currentModelTranscript = '';
      this.setStatus('listening');
    } else if (data.type === 'error') {
      this.emitError(data.error);
      this.setStatus('error');
    }
  }

  private playAudioChunk(base64Chunk: string) {
    if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') return;

    try {
      const float32Samples = base64ToFloat32(base64Chunk);
      if (float32Samples.length === 0) return;

      // Compute RMS for model voice visualizer
      let sum = 0;
      for (let i = 0; i < float32Samples.length; i++) {
        sum += float32Samples[i] * float32Samples[i];
      }
      const rms = Math.sqrt(sum / float32Samples.length);
      const outLevel = Math.min(1, rms * 4);
      this.emitAudioLevel(this.inputVolumeLevel, outLevel);

      const buffer = this.outputAudioCtx.createBuffer(1, float32Samples.length, 24000);
      buffer.getChannelData(0).set(float32Samples);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.outputAudioCtx.destination);

      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextPlaybackStartTime < currentTime) {
        this.nextPlaybackStartTime = currentTime;
      }

      source.start(this.nextPlaybackStartTime);
      this.nextPlaybackStartTime += buffer.duration;
      this.activeAudioSources.push(source);

      source.onended = () => {
        const idx = this.activeAudioSources.indexOf(source);
        if (idx !== -1) {
          this.activeAudioSources.splice(idx, 1);
        }
        if (this.activeAudioSources.length === 0) {
          this.emitAudioLevel(this.inputVolumeLevel, 0);
        }
      };
    } catch (err) {
      console.warn('[GeminiLive] Playback error', err);
    }
  }

  public stopPlayback() {
    for (const src of this.activeAudioSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    }
    this.activeAudioSources = [];
    if (this.outputAudioCtx) {
      this.nextPlaybackStartTime = this.outputAudioCtx.currentTime;
    }
    this.emitAudioLevel(this.inputVolumeLevel, 0);
  }

  public sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text', text }));
    }
  }

  public switchRole(roleAgent: string, voiceName?: string, teamContext?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'switchRole',
          roleAgent,
          voiceName,
          teamContext,
        }),
      );
    }
  }

  private cleanupAudio() {
    this.stopPlayback();

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {}
      this.processorNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
      try {
        this.inputAudioCtx.close();
      } catch {}
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx && this.outputAudioCtx.state !== 'closed') {
      try {
        this.outputAudioCtx.close();
      } catch {}
      this.outputAudioCtx = null;
    }
  }

  public disconnect() {
    this.cleanupAudio();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.setStatus('idle');
    this.emitAudioLevel(0, 0);
  }
}

export const geminiLiveService = new GeminiLiveService();
