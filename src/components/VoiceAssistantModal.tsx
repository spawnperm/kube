import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Radio, X, Send } from 'lucide-react';
import { Team, TelemetryPacket } from '../types';
import { Modal } from './ui/Modal';

interface SpeechRecognitionResultLike {
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike {
  results: { [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type WebkitWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  webkitAudioContext?: typeof AudioContext;
};

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTeam: Team;
  telemetry: TelemetryPacket;
}

interface VoiceMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  activeTeam,
  telemetry,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [inputText, setInputText] = useState('');
  const [supportNotice, setSupportNotice] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'vm_1',
      sender: 'assistant',
      text: `Вас приветствует голосовой ассистент Центра управления полетами чемпионата «Космос-просто»! На связи борт «${telemetry.satelliteName}». Бортовые системы в норме: шина ${telemetry.batteryVoltage} В, высота ${telemetry.altitudeKm} км. Задайте вопрос по орбитальной механике или телеметрии.`,
      timestamp: '12:00',
    },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const queryHandlerRef = useRef<(query: string) => void>(() => {});
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' ? window.speechSynthesis : null,
  );

  // Play flight controller beep sound using Web Audio API
  const playRadioBeep = (freq: number = 880, duration: number = 0.08) => {
    if (!soundEnabled) return;
    try {
      const AudioCtor = (window.AudioContext ||
        (window as WebkitWindow).webkitAudioContext) as typeof AudioContext;
      const audioCtx = new AudioCtor();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext unavailable
    }
  };

  // Text-to-Speech response
  const speakText = (text: string) => {
    if (!soundEnabled || !synthRef.current) return;
    synthRef.current.cancel();

    playRadioBeep(920, 0.06);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      playRadioBeep(640, 0.05); // Roger beep
    };
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  // Web Speech API Voice Recognition setup
  useEffect(() => {
    const synth = synthRef.current;
    const SpeechRecognition =
      (window as WebkitWindow).SpeechRecognition ||
      (window as WebkitWindow).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'ru-RU';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          queryHandlerRef.current(transcript);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (synth) synth.cancel();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSupportNotice(true);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        playRadioBeep(1200, 0.05);
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Animated Waveform Canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const numBars = 36;
      const barWidth = width / numBars - 2;

      ctx.fillStyle = isListening ? '#38bdf8' : isSpeaking ? '#34d399' : '#475569';

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);
        const distFromCenter = Math.abs(i - numBars / 2) / (numBars / 2);

        let amp = 3;
        if (isListening) {
          amp = Math.sin(phase + i * 0.4) * 14 * (1 - distFromCenter * 0.5) + 6;
        } else if (isSpeaking) {
          amp = (Math.sin(phase * 1.5 + i * 0.6) * 0.5 + 0.5) * 18 * (1 - distFromCenter * 0.3) + 4;
        }

        const barHeight = Math.max(3, amp * 2);
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      }

      phase += 0.15;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isOpen, isListening, isSpeaking]);

  // AI Logic to respond to spaceflight & CubeSat physics questions
  const handleProcessUserQuery = (query: string) => {
    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Add user message
    const userMsg: VoiceMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Generate intelligent space answer
    setTimeout(() => {
      const lower = query.toLowerCase();
      let answer = '';

      if (
        lower.includes('телеметри') ||
        lower.includes('борт') ||
        lower.includes('статус') ||
        lower.includes('доложи')
      ) {
        answer = `Докладываю телеметрию борта: высота ${telemetry.altitudeKm} км, скорость ${telemetry.velocityKms} км/с. Напряжение шины питания ${telemetry.batteryVoltage} В, заряд аккумулятора ${telemetry.batterySocPercent}%. Солнечные панели вырабатывают ${telemetry.solarPowerW} Вт. Сигнал маяка на 437.425 МГц устойчивый, уровень ${telemetry.radioRssiDb} дБм.`;
      } else if (
        lower.includes('скорост') ||
        lower.includes('первая космическ') ||
        lower.includes('период')
      ) {
        answer = `Для рабочей солнечно-синхронной орбиты высотой h = 525 км первая космическая скорость равна ровно 7.605 км/с. Период обращения спутника по третьему закону Кеплера составляет 95.12 минут, что дает 15.1 витков вокруг Земли в сутки.`;
      } else if (
        lower.includes('b-dot') ||
        lower.includes('магнитотор') ||
        lower.includes('вращени') ||
        lower.includes('detumb')
      ) {
        answer = `Алгоритм B-dot гасит начальную угловую скорость КубСата после отделения. Магнитные катушки создают дипольный момент, пропорциональный производной вектора геомагнитного поля dB/dt со знаком минус. Момент сил M = m × B тормозит вращение спутника до долей градуса в секунду.`;
      } else if (
        lower.includes('sipm') ||
        lower.includes('фотоумножител') ||
        lower.includes('температур')
      ) {
        answer = `Кремниевые фотоумножители SiPM крайне чувствительны к температуре. При переходе в теневую часть витка температура падает до -15°C, из-за чего напряжение лавинного пробоя снижается со скоростью около 21 милливольта на градус. Микроконтроллер STM32 обязан корректировать напряжение смещения через ЦАП.`;
      } else if (
        lower.includes('связ') ||
        lower.includes('link') ||
        lower.includes('запас') ||
        lower.includes('margin') ||
        lower.includes('437')
      ) {
        answer = `Для радиолинии 437.425 МГц запас радиолинии Link Margin должен быть не менее +6 дБ. При мощности передатчика 1 Вт и потерях в свободном пространстве 143 дБ, рекомендуется использовать на наземном пункте поворотную антенну кросс-яги с круговой поляризацией, исключающую замирания от вращения КубСата.`;
      } else {
        answer = `Принято! По расчетам команды «${activeTeam.name}», орбитальные параметры соответствуют требованиям пускового контейнера. Формула Циолковского и третий закон Кеплера согласованы. Готовность аппарата к интеграции составляет ${activeTeam.launchReadinessPercent}%.`;
      }

      const botMsg: VoiceMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: answer,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      speakText(answer);
    }, 400);
  };

  queryHandlerRef.current = handleProcessUserQuery;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleProcessUserQuery(inputText);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="voice-assistant-title"
      panelClassName="w-full max-w-2xl rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 text-slate-200 text-xs flex flex-col h-[640px] max-h-[92vh] shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <Radio className="h-5 w-5 animate-pulse" />
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold">
              ✓
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 id="voice-assistant-title" className="text-base font-bold text-white">
                Голосовой ассистент ЦУП
              </h3>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                DEMO · ГОЛОСОВОЙ КАНАЛ
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Интерактивный голосовой полетный контроллер и научный ментор кейс-чемпионата
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
            title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Audio Waveform Canvas Box */}
      <div className="my-3 rounded-xl border border-cyan-900/30 bg-slate-950 p-3 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="flex items-center justify-between w-full px-2 text-[10px] font-mono text-slate-400 pb-1">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${isListening ? 'bg-cyan-400 animate-ping' : isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}
            />
            {isListening
              ? 'СЛУШАЮ ВАШ ГОЛОС...'
              : isSpeaking
                ? 'ПЕРЕДАЧА ОТВЕТА ПО РАДИОКАНАЛУ...'
                : 'ГОЛОСОВОЙ КАНАЛ ГОТОВ'}
          </span>
          <span>437.425 МГц • RS42S</span>
        </div>

        <canvas ref={canvasRef} width={480} height={48} className="w-full max-w-md h-12" />

        {/* Quick Push-To-Talk Button */}
        <button
          onClick={toggleListening}
          className={`mt-2 flex items-center gap-2 px-5 py-2 rounded-full font-bold transition-all shadow-lg text-xs ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30'
              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/25'
          }`}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          <span>
            {isListening ? 'Идет запись... Нажмите для остановки' : 'Нажмите и говорите в микрофон'}
          </span>
        </button>
        {supportNotice && (
          <p role="alert" className="mt-2 text-[10px] text-amber-300">
            Голосовой ввод не поддерживается этим браузером. Используйте текстовое поле ниже.
          </p>
        )}
      </div>

      {/* Quick Question Chips */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800">
        <button
          onClick={() => handleProcessUserQuery('Доложи статус борта Орион-3')}
          className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] text-cyan-300 hover:bg-cyan-950/40"
        >
          🛰️ Доложи статус борта
        </button>
        <button
          onClick={() =>
            handleProcessUserQuery(
              'Рассчитай первую космическую скорость и период обращения для высоты 525 км',
            )
          }
          className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] text-cyan-300 hover:bg-cyan-950/40"
        >
          ⚡ Расчет v1 и периода Кеплера
        </button>
        <button
          onClick={() => handleProcessUserQuery('Как гасить угловую скорость магнитоторами B-dot?')}
          className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] text-cyan-300 hover:bg-cyan-950/40"
        >
          🧲 Алгоритм стабилизации B-dot
        </button>
        <button
          onClick={() =>
            handleProcessUserQuery('Какой запас радиолинии Link Margin нужен на 437 МГц?')
          }
          className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] text-cyan-300 hover:bg-cyan-950/40"
        >
          📡 Запас радиолинии AX.25
        </button>
      </div>

      {/* Messages Transcript Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 my-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30 text-xs">
                ЦУП
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl p-3 leading-relaxed text-[11px] ${
                m.sender === 'user'
                  ? 'bg-cyan-600 text-white font-medium'
                  : 'bg-slate-950 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-[9px] text-slate-400 mb-1">
                <span>{m.sender === 'user' ? 'Вы' : 'Голосовой ментор ЦУП'}</span>
                <span>{m.timestamp}</span>
              </div>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Text Fallback Input Box */}
      <form
        onSubmit={handleFormSubmit}
        className="pt-2 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Или напечатайте вопрос по физике орбиты или телеметрии..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition-all"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Спросить</span>
        </button>
      </form>
    </Modal>
  );
};
