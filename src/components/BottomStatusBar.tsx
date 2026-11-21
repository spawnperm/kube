import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Zap,
  Radio,
  Sliders,
  ChevronUp,
  ChevronDown,
  X,
  Send,
  HelpCircle,
  Activity,
  Compass,
  Cpu,
  Layers,
  Sparkles,
  Bot,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Battery,
  Sun,
  Shield,
  FileText,
  Scale,
  Users,
  Award,
  BookOpen,
} from 'lucide-react';
import { TelemetryPacket } from '../types';
import { type TelemetryMode } from '../services/telemetrySimulator';
import { audioService } from '../shared/lib/audioService';
import type { MenuItemId, CosmoportUserRole, CosmoportTeam } from '../App';

export interface BottomStatusBarProps {
  telemetry: TelemetryPacket;
  simSpeed: number;
  isPaused: boolean;
  wingsDeployed: boolean;
  onTogglePause: () => void;
  onSetSimSpeed: (speed: number) => void;
  onForceEvent: (mode?: TelemetryMode) => void;
  onToggleWings: () => void;
  activeTab: MenuItemId;
  onNavigateToScreen: (screenId: MenuItemId) => void;
  userRole: CosmoportUserRole;
  onRoleChange: (role: CosmoportUserRole) => void;
  activeTeam: CosmoportTeam;
  allTeams: CosmoportTeam[];
  onSelectTeam: (teamId: string) => void;
  currentStageNum?: number;
  onSelectStage?: (stageId: string) => void;
  isRightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
  onOpenVoiceModal?: () => void;
}

interface TerminalLogItem {
  id: string;
  timestamp: string;
  type: 'system' | 'command' | 'output' | 'voice' | 'error' | 'cubic';
  text: string;
  meta?: string;
}

// 7 этапов соревнования для привязки и быстрого голосового/текстового переключения
const SEVEN_STAGES = [
  { num: 1, id: 'registration', title: 'Предварительная регистрация', screen: 'registration' as MenuItemId },
  { num: 2, id: 'crm', title: 'Подтверждение регистрации', screen: 'crm' as MenuItemId },
  { num: 3, id: 'mcc', title: 'Старт мероприятия', screen: 'mcc' as MenuItemId },
  { num: 4, id: 'submissions', title: 'Выполнение заданий', screen: 'submissions' as MenuItemId },
  { num: 5, id: 'team', title: 'Готовность к защите', screen: 'team' as MenuItemId },
  { num: 6, id: 'jury', title: 'Защита команд', screen: 'jury' as MenuItemId },
  { num: 7, id: 'certificates', title: 'Подготовка документов', screen: 'certificates' as MenuItemId },
];

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  telemetry,
  simSpeed,
  isPaused,
  wingsDeployed,
  onTogglePause,
  onSetSimSpeed,
  onForceEvent,
  onToggleWings,
  activeTab,
  onNavigateToScreen,
  userRole,
  onRoleChange,
  activeTeam,
  allTeams,
  onSelectTeam,
  currentStageNum = 1,
  onSelectStage,
  isRightSidebarOpen = false,
  onToggleRightSidebar,
  onOpenVoiceModal,
}) => {
  // Drawer visibility & tab state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'cli' | 'voice_hub' | 'packets' | 'audit'>('cli');

  // Terminal input & history
  const [inputCommand, setInputCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [lastVoiceAction, setLastVoiceAction] = useState<string | null>(null);

  // Terminal logs state
  const [logs, setLogs] = useState<TerminalLogItem[]>([
    {
      id: 'init-1',
      timestamp: '00:00:01',
      type: 'system',
      text: 'ЦУП КОСМОПОРТ CLI v1.0.0 инициализирован. Радиомаяк: 437.425 МГц (AX.25).',
    },
    {
      id: 'init-2',
      timestamp: '00:00:02',
      type: 'system',
      text: 'Голосовой движок Web Speech API подключен. Введите «help» или нажмите 🎙️ для голосовой команды.',
    },
    {
      id: 'init-3',
      timestamp: '00:00:03',
      type: 'cubic',
      text: 'Маскот «Кубик» на связи! Готов отвечать на запросы по физике, баллистике и управлять симулятором.',
    },
  ]);

  const terminalScrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionInstanceRef = useRef<any>(null);

  // Auto-scroll terminal log
  useEffect(() => {
    if (isDrawerOpen && terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [logs, isDrawerOpen]);

  // Periodic AX.25 background heartbeat log (every 6 seconds if not paused)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      const now = new Date().toTimeString().slice(0, 8);
      const volt = (telemetry.batteryVoltage || 8.2).toFixed(2);
      const temp = (telemetry.cpuTemperatureC || 19.5).toFixed(1);
      const seq = Math.floor(1000 + Math.random() * 9000);
      const hexPacket = `[${now}] AX.25 #SEQ${seq} CALL:RS44S BATT:${volt}V TEMP:${temp}°C RSSI:${telemetry.radioRssiDb}dBm MODE:${telemetry.mode || 'NORMAL'}`;

      setLogs((prev) => [
        ...prev.slice(-120),
        {
          id: `ax-${Date.now()}`,
          timestamp: now,
          type: 'system',
          text: hexPacket,
        },
      ]);
    }, 7000);
    return () => clearInterval(timer);
  }, [telemetry, isPaused]);

  // Append new log helper
  const addLog = (type: TerminalLogItem['type'], text: string, meta?: string) => {
    const timestamp = new Date().toTimeString().slice(0, 8);
    setLogs((prev) => [
      ...prev.slice(-150),
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp,
        type,
        text,
        meta,
      },
    ]);
  };

  // Speak response aloud via audioService
  const speakResponse = (text: string) => {
    if (isVoiceMuted) return;
    try {
      audioService.speak(text, 'professor');
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // --- CORE COMMAND & QUERY DISPATCHER (TEXT & VOICE) ---
  const executeCommand = (cmdRaw: string, source: 'cli' | 'voice' = 'cli') => {
    const cmd = cmdRaw.trim();
    if (!cmd) return;

    // Record in history if CLI
    if (source === 'cli') {
      setCommandHistory((prev) => [cmd, ...prev.filter((c) => c !== cmd).slice(0, 30)]);
      setHistoryIndex(-1);
      addLog('command', `tsup:~$ ${cmd}`);
    } else {
      addLog('voice', `[ГОЛОС]: «${cmd}»`);
    }

    const lower = cmd.toLowerCase();

    // 1. HELP / СПРАВКА
    if (lower === 'help' || lower === '?' || lower === 'помощь' || lower.includes('справка') || lower.includes('команды')) {
      const helpText = [
        '--- ДОСТУПНЫЕ КОМАНДЫ ЭМУЛЯТОРА ТЕРМИНАЛА И ГОЛОСА ---',
        '• status | telemetry | статус — текущий телеметрический отчет борта CubeSat 3U',
        '• pause | стоп | пауза — приостановить симуляцию телеметрии',
        '• resume | play | старт | пуск — возобновить симуляцию телеметрии',
        '• speed 1 | speed 2 | speed 5 | быстрее | максимум — изменить скорость потока',
        '• wings | panels | раскрой панели | сложи панели — управление солнечными батареями',
        '• detumble | вращение — активация режима детамблинга (ADCS маховики)',
        '• eclipse | тень — симуляция входа в тень Земли',
        '• safe | сейф — перевод борта в безопасный режим энергосбережения',
        '• normal | штатный — возврат систем к номинальному режиму',
        '• stage <1..7> | этап <1..7> — переход к соответствующему этапу соревнования',
        '• nav <screen> | открой <экран> — навигация (mcc, cubesat, crm, jury, team, certs, spacepi, director)',
        '• clear | cls — очистить терминал',
        '• вопрос по физике/баллистике («период витка», «что такое CubeSat?», «энергобаланс»)',
      ].join('\n');
      addLog('output', helpText);
      if (source === 'voice') {
        speakResponse('Выведена справка по всем командам терминала и голоса.');
      }
      return;
    }

    // 2. CLEAR
    if (lower === 'clear' || lower === 'cls' || lower === 'очистить') {
      setLogs([]);
      return;
    }

    // 3. STATUS / ТЕЛЕМЕТРИЯ
    if (lower.includes('status') || lower.includes('статус') || lower.includes('telemetry') || lower.includes('состояние')) {
      const volt = telemetry.batteryVoltage.toFixed(2);
      const soc = telemetry.batterySocPercent.toFixed(1);
      const alt = telemetry.altitudeKm.toFixed(1);
      const vel = telemetry.velocityKms.toFixed(2);
      const temp = (telemetry.cpuTemperatureC || 19.5).toFixed(1);
      const wingsStr = wingsDeployed ? 'РАСКРЫТЫ' : 'СЛОЖЕНЫ';
      const modeStr = telemetry.mode || 'NORMAL';
      const simStr = isPaused ? 'ПАУЗА' : `АКТИВЕН (${simSpeed}x)`;

      const report = [
        `[ОТЧЕТ ЦУП БОРТА «${telemetry.satelliteName}»]`,
        `• Орбита: высота ${alt} км | скорость ${vel} км/с | период: 95.02 мин`,
        `• Питание (EPS): шина ${volt} В | SOC: ${soc}% | Солнечные панели: ${wingsStr}`,
        `• Бортовой компьютер: OBC STM32H7 | T: +${temp}°C | ADCS: ${telemetry.orientation?.adcsStatus || 'STABILIZED'}`,
        `• Радиоканал: 437.425 МГц AX.25 | RSSI: ${telemetry.radioRssiDb} dBm | Режим: ${modeStr}`,
        `• Симулятор: ${simStr}`,
      ].join('\n');

      addLog('output', report);
      speakResponse(`Статус борта: высота ${alt} километров, заряд аккумулятора ${soc} процентов, напряжение ${volt} вольт. Режим ${modeStr}.`);
      return;
    }

    // 4. ПАУЗА / СТОП
    if (lower === 'pause' || lower.includes('пауз') || lower.includes('стоп') || lower.includes('останови')) {
      if (!isPaused) onTogglePause();
      addLog('output', 'Симуляция телеметрии приостановлена (PAUSED).');
      speakResponse('Симуляция телеметрии приостановлена.');
      setLastVoiceAction('Пауза');
      return;
    }

    // 5. СТАРТ / ПУСК / ВОЗОБНОВИТЬ
    if (
      lower === 'start' ||
      lower === 'play' ||
      lower === 'resume' ||
      lower.includes('старт') ||
      lower.includes('пуск') ||
      lower.includes('возобнови') ||
      lower.includes('поехали')
    ) {
      if (isPaused) onTogglePause();
      addLog('output', 'Симуляция телеметрии запущена в штатном режиме (ACTIVE).');
      speakResponse('Симуляция телеметрии возобновлена.');
      setLastVoiceAction('Старт симуляции');
      return;
    }

    // 6. СКОРОСТЬ
    if (lower.includes('speed') || lower.includes('скорост') || lower.includes('быстрее') || lower.includes('максимум')) {
      if (lower.includes('5') || lower.includes('максимум') || lower.includes('пять')) {
        onSetSimSpeed(5);
        addLog('output', 'Скорость симуляции установлена: 5x (максимальная).');
        speakResponse('Включена максимальная скорость симуляции пять икс.');
        setLastVoiceAction('Скорость 5x');
        return;
      }
      if (lower.includes('2') || lower.includes('быстрее') || lower.includes('два')) {
        onSetSimSpeed(2);
        addLog('output', 'Скорость симуляции установлена: 2x (ускоренная).');
        speakResponse('Скорость потока телеметрии увеличена в два раза.');
        setLastVoiceAction('Скорость 2x');
        return;
      }
      if (lower.includes('1') || lower.includes('нормал') || lower.includes('стандарт') || lower.includes('один')) {
        onSetSimSpeed(1);
        addLog('output', 'Скорость симуляции возвращена: 1x (штатная).');
        speakResponse('Скорость симуляции возвращена к штатной.');
        setLastVoiceAction('Скорость 1x');
        return;
      }
    }

    // 7. СОЛНЕЧНЫЕ ПАНЕЛИ / WINGS
    if (lower.includes('wing') || lower.includes('panel') || lower.includes('панел') || lower.includes('крыл')) {
      if (lower.includes('раскрой') || lower.includes('разверни') || lower.includes('открой') || lower.includes('deploy')) {
        if (!wingsDeployed) onToggleWings();
        addLog('output', 'Команда выполнена: Солнечные панели раскрыты (100% инсоляция).');
        speakResponse('Команда на раскрытие солнечных крыльев выполнена.');
        setLastVoiceAction('Панели раскрыты');
        return;
      }
      if (lower.includes('сложи') || lower.includes('закрой') || lower.includes('убери') || lower.includes('stow')) {
        if (wingsDeployed) onToggleWings();
        addLog('output', 'Команда выполнена: Солнечные панели сложены в стартовое положение.');
        speakResponse('Солнечные батареи переведены в сложенное положение.');
        setLastVoiceAction('Панели сложены');
        return;
      }
      // Toggle if general command
      onToggleWings();
      const stateNow = !wingsDeployed ? 'раскрыты' : 'сложены';
      addLog('output', `Переключение солнечных панелей: теперь ${stateNow}.`);
      speakResponse(`Солнечные панели теперь ${stateNow}.`);
      setLastVoiceAction(`Панели: ${stateNow}`);
      return;
    }

    // 8. ДЕТАМБЛИНГ / ВРАЩЕНИЕ / ADCS
    if (lower.includes('detumble') || lower.includes('вращени') || lower.includes('детамблинг') || lower.includes('закрутк') || lower.includes('adcs')) {
      onForceEvent('DETUMBLING');
      addLog('output', 'Активирован режим гашения угловых скоростей ADCS. Электромагнитные катушки и маховики задействованы.');
      speakResponse('Активирован режим детамблинга. Маховики стабилизируют спутник.');
      setLastVoiceAction('Режим ADCS Detumbling');
      return;
    }

    // 9. ТЕНЬ / ЗАТМЕНИЕ / ECLIPSE
    if (lower.includes('eclipse') || lower.includes('тень') || lower.includes('затмени')) {
      onForceEvent('ECLIPSE');
      addLog('output', 'Спутник вошел в тень Земли. Фотоэлементы отключены, питание от буферного аккумулятора.');
      speakResponse('Спутник вошел в тень Земли. Питание переведено на аккумуляторы.');
      setLastVoiceAction('Вход в тень');
      return;
    }

    // 10. БЕЗОПАСНЫЙ РЕЖИМ / SAFE MODE
    if (lower.includes('safe') || lower.includes('безопасн') || lower.includes('сейф')) {
      onForceEvent('SAFE');
      addLog('output', 'Активирован Safe Mode: Неприоритетная полезная нагрузка отключена, радиомаяк на пониженной мощности.');
      speakResponse('Включен безопасный режим. Неприоритетные нагрузки отключены.');
      setLastVoiceAction('Безопасный режим');
      return;
    }

    // 11. ШТАТНЫЙ РЕЖИМ / NORMAL
    if (lower.includes('normal') || lower.includes('штатн') || lower.includes('норма')) {
      onForceEvent('NORMAL');
      addLog('output', 'Все подсистемы CubeSat возвращены в номинальный режим работы.');
      speakResponse('Борт вернулся в номинальный режим.');
      setLastVoiceAction('Штатный режим');
      return;
    }

    // 12. 7 ЭТАПОВ СОРЕВНОВАНИЯ
    const stageMatch = lower.match(/(?:этап|stage)\s*([1-7])/i);
    if (stageMatch || lower.includes('предварительн') || lower.includes('подтвержден') || lower.includes('старт мероприят') || lower.includes('выполнен') || lower.includes('готовност') || lower.includes('защита команд') || lower.includes('подготовк')) {
      let targetNum = stageMatch ? parseInt(stageMatch[1], 10) : 0;
      if (!targetNum) {
        if (lower.includes('предварительн')) targetNum = 1;
        else if (lower.includes('подтвержден')) targetNum = 2;
        else if (lower.includes('старт мероприят')) targetNum = 3;
        else if (lower.includes('выполнен')) targetNum = 4;
        else if (lower.includes('готовност')) targetNum = 5;
        else if (lower.includes('защита команд')) targetNum = 6;
        else if (lower.includes('подготовк')) targetNum = 7;
      }

      const foundStage = SEVEN_STAGES.find((s) => s.num === targetNum);
      if (foundStage) {
        onNavigateToScreen(foundStage.screen);
        onSelectStage?.(foundStage.id);
        addLog('output', `Переход к этапу ${foundStage.num}: «${foundStage.title}» -> Экран: [${foundStage.screen}].`);
        speakResponse(`Переход к этапу ${foundStage.num}: ${foundStage.title}.`);
        setLastVoiceAction(`Этап ${foundStage.num}: ${foundStage.title}`);
        return;
      }
    }

    // 13. НАВИГАЦИЯ ПО ЭКРАНАМ
    if (lower.includes('nav ') || lower.includes('открой ') || lower.includes('перейди ') || lower.includes('экран ')) {
      const navTarget = lower.replace(/^(nav|открой|перейди|экран)\s+/i, '').trim();
      const screenMappings: Record<string, MenuItemId> = {
        'цуп': 'mcc',
        'mcc': 'mcc',
        '3d': 'cubesat',
        'модель': 'cubesat',
        'кад': 'cubesat',
        'cubesat': 'cubesat',
        'телеметрия': 'telemetry',
        'telemetry': 'telemetry',
        'пульт': 'stage_director',
        'пульт режиссера': 'stage_director',
        'режиссер': 'stage_director',
        'director': 'stage_director',
        'stage_director': 'stage_director',
        'жюри': 'jury',
        'jury': 'jury',
        'эксперт': 'jury',
        'команда': 'team',
        'кабинет': 'team',
        'team': 'team',
        'црм': 'crm',
        'crm': 'crm',
        'регистрация': 'registration',
        'заявка': 'registration',
        'решения': 'submissions',
        'submissions': 'submissions',
        'сертификаты': 'certificates',
        'дипломы': 'certificates',
        'certificates': 'certificates',
        'отчеты': 'reports',
        'reports': 'reports',
        'spacepi': 'spacepi',
        'роскосмос': 'spacepi',
        'обучение': 'education',
        'ментор': 'mentor',
        'форум': 'forum',
        'аналитика': 'analytics',
        'космопорт': 'cosmoport',
      };

      const matchedKey = Object.keys(screenMappings).find((k) => navTarget.includes(k));
      if (matchedKey) {
        const dest = screenMappings[matchedKey];
        onNavigateToScreen(dest);
        addLog('output', `Навигация: открыт экран [${dest}].`);
        speakResponse(`Открыт экран ${matchedKey}.`);
        setLastVoiceAction(`Экран: ${dest}`);
        return;
      }
    }

    // 14. ИНЖЕНЕРНЫЕ ВОПРОСЫ ПО ФИЗИКЕ И ОРБИТЕ К МАСКОТУ «КУБИК»
    let cubicAnswer = '';
    if (lower.includes('cubesat') || lower.includes('кубсат') || lower.includes('наноспутник')) {
      cubicAnswer = 'CubeSat 3U — сверхмалый космический аппарат габаритами 10×10×34 см и массой до 4.5 кг. Состоит из каркаса, бортового компьютера STM32, батарей LiFePO4, радиомаяка и системы ориентации ADCS.';
    } else if (lower.includes('период') || lower.includes('виток') || lower.includes('орбит')) {
      cubicAnswer = 'Для круговой солнечно-синхронной орбиты высотой 520 км период обращения спутника составляет ровно 95 минут 02 секунды. Спутник совершает около 15 витков вокруг Земли за одни сутки.';
    } else if (lower.includes('стабилизац') || lower.includes('ориентац') || lower.includes('маховик')) {
      cubicAnswer = 'Система ADCS использует микромаховики для 3-осевой стабилизации и электромагнитные катушки (магнитные торкеры), взаимодействующие с магнитным полем Земли для сброса накопленного кинетического момента.';
    } else if (lower.includes('аккумулятор') || lower.includes('батаре') || lower.includes('питани') || lower.includes('eps')) {
      cubicAnswer = `Энергосистема EPS: текущее напряжение шины ${telemetry.batteryVoltage.toFixed(2)} В, уровень заряда ${telemetry.batterySocPercent.toFixed(0)}%. В тени Земли питание идет от аккумуляторов, на освещенном участке — от кремниевых фотоэлементов.`;
    } else if (lower.includes('space-pi') || lower.includes('spacepi') || lower.includes('роскосмос')) {
      cubicAnswer = 'Программа Space-π (Роскосмос и Фонд содействия инновациям) обеспечивает запуск российских школьных и университетских наноспутников на ракетах «Союз-2» с космодромов Восточный и Байконур.';
    } else if (lower.includes('привет') || lower.includes('кто ты') || lower.includes('кубик')) {
      cubicAnswer = 'Приветствую! Я — «Кубик», искусственный интеллект орбитального ЦУП чемпионата «Космос-просто». Могу выполнять голосовые команды, управлять спутником и отвечать на технические вопросы.';
    }

    if (cubicAnswer) {
      addLog('cubic', `[КУБИК]: ${cubicAnswer}`);
      speakResponse(cubicAnswer);
      setLastVoiceAction('Ответ ИИ «Кубик»');
      return;
    }

    // Fallback: command not strictly matched, show hint
    addLog('output', `Команда «${cmd}» принята. Для справки введите «help» или нажмите кнопку голосовых команд.`);
    if (source === 'voice') {
      speakResponse(`Команда ${cmd} обработана.`);
    }
  };

  // --- WEB SPEECH RECOGNITION (MIC TOGGLE) ---
  const toggleListening = () => {
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  const startVoiceRecognition = () => {
    setLiveTranscript('');
    setIsListening(true);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback message
      addLog('error', 'Web Speech API не поддерживается вашим браузером. Используйте Chrome или Safari.');
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        addLog('system', 'Микрофон активен. Произнесите голосовую команду на русском языке...');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const text = final || interim;
        setLiveTranscript(text);

        if (final) {
          setIsListening(false);
          setLiveTranscript('');
          executeCommand(final, 'voice');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setLiveTranscript('');
        if (event.error !== 'no-speech') {
          addLog('error', `Ошибка голосового ввода: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionInstanceRef.current = recognition;
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
      addLog('error', 'Не удалось активировать распознавание речи.');
    }
  };

  const stopVoiceRecognition = () => {
    setIsListening(false);
    setLiveTranscript('');
    if (recognitionInstanceRef.current) {
      try {
        recognitionInstanceRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionInstanceRef.current = null;
    }
  };

  // CLI Input Submit
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCommand.trim()) return;
    executeCommand(inputCommand, 'cli');
    setInputCommand('');
  };

  // Keyboard navigation for history (Up/Down arrows)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex + 1 < commandHistory.length ? historyIndex + 1 : historyIndex;
      setHistoryIndex(nextIndex);
      setInputCommand(commandHistory[nextIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputCommand(commandHistory[nextIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInputCommand('');
      }
    }
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. РАЗВЕРТЫВАЕМЫЙ ЭМУЛЯТОР ТЕРМИНАЛА & ГОЛОСОВОЙ ЦУП (DRAWER)  */}
      {/* ============================================================== */}
      {isDrawerOpen && (
        <section
          id="terminal-emulator-drawer"
          aria-label="Эмулятор терминала ЦУП и голосовой оркестратор"
          className={`fixed bottom-11 sm:bottom-12 left-0 right-0 z-40 bg-slate-950/98 border-t-2 border-cyan-500/40 shadow-2xl backdrop-blur-2xl transition-all duration-300 flex flex-col font-mono text-xs ${
            isRightSidebarOpen ? 'lg:pr-88 xl:pr-96' : ''
          }`}
          style={{ height: '340px' }}
        >
          {/* Drawer Top Navigation Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span className="font-bold text-white text-[12px] tracking-wide">
                  ТЕРМИНАЛ ЦУП & ГОЛОС «КУБИК»
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AX.25 v1.0
                </span>
              </div>

              {/* Drawer Tabs */}
              <div className="hidden sm:flex items-center gap-1 border-l border-slate-800 pl-3">
                <button
                  type="button"
                  onClick={() => setActiveDrawerTab('cli')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    activeDrawerTab === 'cli'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  CLI Консоль ({logs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawerTab('voice_hub')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeDrawerTab === 'voice_hub'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Голосовые команды & База знаний</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawerTab('packets')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    activeDrawerTab === 'packets'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Пакеты AX.25
                </button>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsVoiceMuted((v) => !v)}
                className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-1 cursor-pointer transition-all ${
                  isVoiceMuted
                    ? 'bg-slate-900 border-slate-800 text-slate-500'
                    : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                }`}
                title={isVoiceMuted ? 'Включить голосовые ответы ИИ' : 'Отключить голосовые ответы ИИ'}
              >
                {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{isVoiceMuted ? 'Звук выкл' : 'Озвучка вкл'}</span>
              </button>

              <button
                type="button"
                onClick={() => setLogs([])}
                className="px-2 py-1 rounded border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] cursor-pointer"
                title="Очистить экран терминала"
              >
                Очистить
              </button>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Свернуть терминал"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-3" ref={terminalScrollRef}>
            {/* TAB 1: CLI CONSOLE OUTPUT */}
            {activeDrawerTab === 'cli' && (
              <div className="space-y-1.5">
                {logs.map((log) => {
                  let badge = 'text-slate-500';
                  let textColor = 'text-slate-300';
                  let icon = null;

                  if (log.type === 'command') {
                    badge = 'text-cyan-400 font-bold';
                    textColor = 'text-cyan-200 font-semibold';
                  } else if (log.type === 'voice') {
                    badge = 'text-purple-400 font-bold';
                    textColor = 'text-purple-200';
                    icon = <Mic className="w-3 h-3 text-purple-400 inline mr-1" />;
                  } else if (log.type === 'cubic') {
                    badge = 'text-emerald-400 font-bold';
                    textColor = 'text-emerald-200';
                    icon = <Bot className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />;
                  } else if (log.type === 'error') {
                    badge = 'text-rose-400 font-bold';
                    textColor = 'text-rose-300';
                  }

                  return (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-[10px] text-slate-600 select-none">[{log.timestamp}]</span>
                      <div className={`flex-1 break-words ${textColor} whitespace-pre-wrap`}>
                        {icon}
                        {log.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: VOICE COMMANDS HUB & KNOWLEDGE BASE */}
            {activeDrawerTab === 'voice_hub' && (
              <div className="space-y-4 font-sans text-xs">
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 border border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">Справочник голосового управления платформой</div>
                      <div className="text-[11px] text-slate-300">
                        Нажмите кнопку команды для мгновенного выполнения или произнесите её в микрофон
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isListening ? 'Слушаю...' : 'Включить микрофон'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Category 1: Борт и симулятор */}
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                    <div className="font-bold text-cyan-300 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Борт и симулятор</span>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: '«Пауза» / «Стоп»', cmd: 'пауза' },
                        { label: '«Старт» / «Пуск»', cmd: 'старт' },
                        { label: '«Скорость 2x»', cmd: 'скорость 2' },
                        { label: '«Максимум 5x»', cmd: 'скорость 5' },
                        { label: '«Раскрой панели»', cmd: 'раскрой солнечные панели' },
                        { label: '«Сложи панели»', cmd: 'сложи панели' },
                        { label: '«Вращение / ADCS»', cmd: 'детамблинг' },
                        { label: '«Тень Земли»', cmd: 'тень' },
                      ].map((item) => (
                        <button
                          key={item.cmd}
                          type="button"
                          onClick={() => executeCommand(item.cmd, 'voice')}
                          className="w-full text-left px-2 py-1 rounded bg-slate-950/70 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 text-[11px] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>{item.label}</span>
                          <span className="text-[9px] text-slate-500">▶ запуск</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category 2: Навигация по экранам */}
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                    <div className="font-bold text-indigo-300 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Голосовая навигация</span>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: '«Открой ЦУП 3D»', cmd: 'открой цуп' },
                        { label: '«Пульт режиссёра Live»', cmd: 'открой пульт режиссера' },
                        { label: '«Панель жюри»', cmd: 'открой жюри' },
                        { label: '«CRM участников»', cmd: 'открой црм' },
                        { label: '«Кабинет команды»', cmd: 'открой кабинет' },
                        { label: '«Сертификаты и дипломы»', cmd: 'открой сертификаты' },
                        { label: '«Заявка в Space-π»', cmd: 'открой spacepi' },
                        { label: '«Телеметрия AX.25»', cmd: 'открой телеметрия' },
                      ].map((item) => (
                        <button
                          key={item.cmd}
                          type="button"
                          onClick={() => executeCommand(item.cmd, 'voice')}
                          className="w-full text-left px-2 py-1 rounded bg-slate-950/70 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-300 text-[11px] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>{item.label}</span>
                          <span className="text-[9px] text-slate-500">▶ переход</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category 3: 7 этапов соревнования */}
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                    <div className="font-bold text-emerald-300 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>7 Этапов турнира</span>
                    </div>
                    <div className="space-y-1">
                      {SEVEN_STAGES.map((s) => (
                        <button
                          key={s.num}
                          type="button"
                          onClick={() => executeCommand(`этап ${s.num}`, 'voice')}
                          className="w-full text-left px-2 py-1 rounded bg-slate-950/70 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 text-[11px] transition-colors flex items-center justify-between cursor-pointer truncate"
                          title={s.title}
                        >
                          <span className="truncate">«Этап {s.num}: {s.title}»</span>
                          <span className="text-[9px] text-slate-500 shrink-0 ml-1">▶</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category 4: Вопросы по физике к «Кубику» */}
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                    <div className="font-bold text-purple-300 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                      <span>Вопросы к «Кубику»</span>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: '«Что такое CubeSat 3U?»', cmd: 'что такое кубсат' },
                        { label: '«Период обращения на 520 км»', cmd: 'какой период витка' },
                        { label: '«Как работает ADCS стабилизация?»', cmd: 'как работает стабилизация' },
                        { label: '«Статус энергосистемы EPS»', cmd: 'питание аккумулятора' },
                        { label: '«Федеральная программа Space-π»', cmd: 'что такое space-pi' },
                        { label: '«Кто ты, Кубик?»', cmd: 'кто ты' },
                      ].map((item) => (
                        <button
                          key={item.cmd}
                          type="button"
                          onClick={() => executeCommand(item.cmd, 'voice')}
                          className="w-full text-left px-2 py-1 rounded bg-slate-950/70 hover:bg-purple-500/20 hover:text-purple-300 text-slate-300 text-[11px] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>{item.label}</span>
                          <span className="text-[9px] text-slate-500">▶ спросить</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AX.25 PACKETS RAW INSPECTOR */}
            {activeDrawerTab === 'packets' && (
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-between">
                  <span>Шлюз СОНИКС • Протокол AX.25 UI Frame • Частота 437.425 МГц (GFSK 9600)</span>
                  <span className="text-emerald-400 font-bold">ПОТОК АКТИВЕН</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div className="text-emerald-400">
                    KISS TNC &gt; [RS44S-1 &gt; CUBESAT-0, UI, P]: 7E A0 2A 92 88 64 60 03 F0 53 54 4D 33 32 ... (CRC OK)
                  </div>
                  <div className="text-cyan-300">
                    TELEMETRY DECODED: BATT_V={(telemetry.batteryVoltage).toFixed(2)} | SOC={(telemetry.batterySocPercent).toFixed(1)}% | TEMP_CPU={(telemetry.cpuTemperatureC || 19.5).toFixed(1)}C | RSSI={telemetry.radioRssiDb}dBm
                  </div>
                  <div className="text-slate-400">
                    ADCS_QUATERNIONS: Q0={telemetry.orientation?.roll ?? 0} Q1={telemetry.orientation?.pitch ?? 0} Q2={telemetry.orientation?.yaw ?? 0} STATUS={telemetry.orientation?.adcsStatus || 'STABILIZED'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 2. ВСЕГДА ВИДИМАЯ СТРОКА СТАТУСА (BOTTOM STATUS BAR)           */}
      {/* ============================================================== */}
      <footer
        id="cosmoport-bottom-status-bar"
        aria-label="Нижняя строка статуса и терминал ЦУП"
        className={`fixed bottom-0 left-0 right-0 z-40 h-11 sm:h-12 shrink-0 bg-slate-950/95 border-t border-cyan-500/30 backdrop-blur-xl shadow-2xl transition-all duration-300 select-none flex items-center px-2 sm:px-3 text-xs ${
          isRightSidebarOpen ? 'lg:pr-88 xl:pr-96' : ''
        }`}
      >
        {/* RIGHT SECTION: SHORTCUT PILLS & TERMINAL DRAWER TOGGLE */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {/* Quick Command Pills (hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              type="button"
              onClick={() => executeCommand('wings', 'cli')}
              className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-[10px] font-mono border border-slate-800 transition-colors cursor-pointer"
              title="Раскрыть / сложить солнечные панели"
            >
              wings
            </button>
          </div>

          {/* Terminal Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen((v) => !v)}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              isDrawerOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-700 hover:border-cyan-500/40'
            }`}
            title="Развернуть/свернуть эмулятор консоли терминала"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Терминал [CLI]</span>
            {isDrawerOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </footer>
    </>
  );
};
