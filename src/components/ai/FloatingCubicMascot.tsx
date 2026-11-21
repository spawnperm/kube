import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  Bot,
  Zap,
  Activity,
  Radio,
  X,
  MessageSquare,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { TelemetryPacket } from '../../types';
import { type TelemetryMode } from '../../services/telemetrySimulator';
import { audioService } from '../../shared/lib/audioService';

interface FloatingCubicMascotProps {
  telemetry: TelemetryPacket;
  isPaused: boolean;
  simSpeed: number;
  wingsDeployed: boolean;
  onTogglePause: () => void;
  onSetSimSpeed: (speed: number) => void;
  onForceEvent: (mode?: TelemetryMode) => void;
  onToggleWings: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'cubic';
  text: string;
  actionTaken?: string;
  timestamp: string;
}

export const FloatingCubicMascot: React.FC<FloatingCubicMascotProps> = ({
  telemetry,
  isPaused,
  simSpeed,
  wingsDeployed,
  onTogglePause,
  onSetSimSpeed,
  onForceEvent,
  onToggleWings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'cubic',
      text: 'Привет, инженер! Я — маскот «Кубик». Включи микрофон или напиши команду, и я буду управлять телеметрией CubeSat голосом!',
      timestamp: 'Сейчас',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Command Dispatcher
  const handleVoiceCommand = (commandText: string) => {
    const raw = commandText.trim().toLowerCase();
    setLastCommand(commandText);

    let recognizedAction = '';
    let responseSpeech = '';

    if (raw.includes('пауз') || raw.includes('стоп') || raw.includes('останови')) {
      if (!isPaused) onTogglePause();
      recognizedAction = 'Пауза симуляции';
      responseSpeech = 'Симуляция телеметрии приостановлена.';
    } else if (
      raw.includes('старт') ||
      raw.includes('пуск') ||
      raw.includes('поехали') ||
      raw.includes('запусти') ||
      raw.includes('возобнови')
    ) {
      if (isPaused) onTogglePause();
      recognizedAction = 'Запуск симуляции';
      responseSpeech = 'Симуляция телеметрии возобновлена.';
    } else if (raw.includes('быстрее') || raw.includes('два') || raw.includes('скорость 2')) {
      onSetSimSpeed(2);
      recognizedAction = 'Скорость 2x';
      responseSpeech = 'Скорость потока телеметрии увеличена в два раза.';
    } else if (raw.includes('максимум') || raw.includes('пять') || raw.includes('скорость 5')) {
      onSetSimSpeed(5);
      recognizedAction = 'Скорость 5x';
      responseSpeech = 'Включена максимальная скорость симуляции пять икс.';
    } else if (
      raw.includes('нормальная скорость') ||
      raw.includes('один') ||
      raw.includes('стандарт')
    ) {
      onSetSimSpeed(1);
      recognizedAction = 'Скорость 1x';
      responseSpeech = 'Скорость симуляции возвращена к штатной.';
    } else if (
      raw.includes('раскрой') ||
      raw.includes('разверни') ||
      raw.includes('открой панел')
    ) {
      if (!wingsDeployed) onToggleWings();
      recognizedAction = 'Раскрытие солнечных панелей';
      responseSpeech = 'Команда на раскрытие солнечных крыльев выполнена.';
    } else if (raw.includes('сложи') || raw.includes('закрой панел')) {
      if (wingsDeployed) onToggleWings();
      recognizedAction = 'Складывание солнечных панелей';
      responseSpeech = 'Солнечные батареи переведены в сложенное положение.';
    } else if (raw.includes('вращени') || raw.includes('детамблинг') || raw.includes('закрутк')) {
      onForceEvent('DETUMBLING');
      recognizedAction = 'Режим гашения угловых скоростей (ADCS)';
      responseSpeech = 'Активирован режим детамблинга. Маховики стабилизируют спутник.';
    } else if (raw.includes('тень') || raw.includes('затмени')) {
      onForceEvent('ECLIPSE');
      recognizedAction = 'Вход в тень Земли (Eclipse)';
      responseSpeech = 'Спутник вошел в тень Земли. Питание переведено на аккумуляторы.';
    } else if (raw.includes('безопасн') || raw.includes('сейф')) {
      onForceEvent('SAFE');
      recognizedAction = 'Безопасный режим (Safe Mode)';
      responseSpeech = 'Включен безопасный режим. Неприоритетные нагрузки отключены.';
    } else if (
      raw.includes('связь') ||
      raw.includes('передач') ||
      raw.includes('маяк') ||
      raw.includes('сброс')
    ) {
      onForceEvent('TRANSMITTING');
      recognizedAction = 'Сеанс радиосвязи (AX.25)';
      responseSpeech = 'Радиопередатчик активен. Начат сброс пакетов телеметрии на Землю.';
    } else if (raw.includes('штатн') || raw.includes('норм')) {
      onForceEvent('NORMAL');
      recognizedAction = 'Штатный режим (Normal)';
      responseSpeech = 'Все системы спутника функционируют в штатном режиме.';
    } else if (raw.includes('статус') || raw.includes('параметр') || raw.includes('телеметри')) {
      const volt = (telemetry.batteryVoltage || 8.2).toFixed(1);
      const temp = (telemetry.cpuTemperatureC || 19.5).toFixed(0);
      recognizedAction = 'Запрос телеметрии';
      responseSpeech = `Напряжение батареи ${volt} вольт. Температура процессора ${temp} градусов. Статус борта номинальный.`;
    } else {
      recognizedAction = 'Общий вопрос';
      responseSpeech = `Ваша команда «${commandText}» принята. Для управления телеметрией скажите: «Старт», «Пауза», «Вращение», «Раскрой панели» или «Статус».`;
    }

    // Add messages to chat
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: `cubic-${Date.now()}`,
        sender: 'cubic',
        text: responseSpeech,
        actionTaken: recognizedAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Speak response if not muted
    if (!isMuted) {
      audioService.speak(responseSpeech, 'professor');
    }
    audioService.playSuccessChime();
  };

  // Toggle microphone with real Web Speech Recognition & AudioContext visualizer
  const toggleListening = async () => {
    if (isListening) {
      audioService.stopListening();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      setIsListening(false);
      setMicAudioLevel(0);
      return;
    }

    try {
      // 1. Request microphone access for audio analyzer wave visualizer
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setMicAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // 2. Start Speech Recognition
      const started = audioService.startListening({
        onStart: () => {
          setIsListening(true);
        },
        onResult: (transcript, isFinal) => {
          if (isFinal && transcript.trim()) {
            handleVoiceCommand(transcript);
          }
        },
        onError: (err) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
          setMicAudioLevel(0);
        },
      });

      if (!started) {
        // Fallback demo voice command prompt
        setIsListening(true);
      }
    } catch (e) {
      console.warn('Microphone permission not granted or error:', e);
      // Still allow text input and simulation
      setIsListening(false);
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const txt = inputText;
    setInputText('');
    handleVoiceCommand(txt);
  };

  return (
    <div className="fixed bottom-14 right-4 z-40 flex flex-col items-end pointer-events-auto">
      {/* Expanded Cubic AI Assistant Dialog */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shadow-md">
                <Bot className="w-4 h-4 text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div>
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>AI-Штурман «Кубик»</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    Голос ЦУП
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Управление телеметрией на русском языке
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMuted((v) => !v)}
                title={isMuted ? 'Включить звук' : 'Выключить звук'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs font-sans max-h-72">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-tr-sm'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-sm'
                  }`}
                >
                  <div>{msg.text}</div>
                  {msg.actionTaken && (
                    <div className="mt-1.5 pt-1 border-t border-cyan-500/30 flex items-center gap-1 text-[10px] font-mono text-cyan-300">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>{msg.actionTaken}</span>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Prompt Suggestions */}
          <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] font-mono">
            <span className="text-slate-500 shrink-0 text-[10px]">Команды:</span>
            {['Старт', 'Пауза', 'Вращение', 'Раскрой панели', 'Связь', 'Статус'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleVoiceCommand(cmd)}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 whitespace-nowrap transition-all cursor-pointer text-[10px]"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Input & Microphone Bar */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            {/* Audio Wave Visualizer when listening */}
            {isListening && (
              <div className="mb-2 p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between text-xs font-mono text-cyan-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>Слушаю вас... Говорите!</span>
                </div>
                {/* Audio Bars */}
                <div className="flex items-center gap-0.5 h-4">
                  {[20, 50, 80, 40, 90, 60, 30].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(4, (micAudioLevel / 100) * h)}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? 'Выключить микрофон' : 'Включить голосовое управление'}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                    : 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-cyan-500/20 hover:border-cyan-500/40'
                }`}
              >
                {isListening ? (
                  <Mic className="w-4 h-4 text-rose-400" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              <input
                type="text"
                placeholder="Голосовая команда или вопрос..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-sans"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition-all cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Mascot Button in Bottom Right */}
      <div className="flex items-center gap-2.5">
        {/* Quick Action Pill on speech recognized */}
        {lastCommand && !isOpen && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-xl animate-in fade-in duration-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[180px]">«{lastCommand}»</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen((v) => !v)}
          className="relative group p-1.5 rounded-2xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-700 shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          title="AI-Маскот «Кубик» — Голосовое управление телеметрией"
        >
          {/* Pulsing beacon ring */}
          <span className="absolute -inset-1 rounded-2xl bg-cyan-400/30 animate-ping pointer-events-none" />

          {/* Cute 3D CubeSat Mascot Body */}
          <div className="relative w-12 h-12 rounded-xl bg-slate-950 border border-cyan-400/40 flex flex-col items-center justify-center overflow-hidden">
            {/* Deployable Solar Ears */}
            <div className="absolute top-1 -left-1 w-2 h-4 bg-cyan-500/60 rounded-sm border border-cyan-300" />
            <div className="absolute top-1 -right-1 w-2 h-4 bg-cyan-500/60 rounded-sm border border-cyan-300" />

            {/* Glowing Face with Eyes */}
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`}
              />
              <span
                className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`}
              />
            </div>

            {/* Mascot Smile / Sensor Mouth */}
            <div className="w-3 h-1 bg-cyan-300/80 rounded-full" />

            {/* Bottom AX.25 Beacon indicator */}
            <span className="text-[8px] font-mono font-bold text-cyan-300 mt-1">3U</span>
          </div>

          {/* Microphone status badge */}
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow">
            {isListening ? (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            ) : (
              <Mic className="w-3 h-3 text-cyan-400" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
