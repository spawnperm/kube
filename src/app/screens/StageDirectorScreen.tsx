import React, { useState, useEffect } from 'react';
import {
  Tv,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Rocket,
  Globe,
  Layers,
  FileText,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Sliders,
  Send,
  Volume2,
  Users,
  Shield,
  Zap,
  Maximize2,
  RefreshCw,
  Award,
  ArrowRight,
  MonitorPlay,
  Cpu,
  Compass,
  UserPlus,
  Scale,
} from 'lucide-react';
import type { EventStageId, EventStageState } from '@/src/shared/types/stageDirector';
import type { Team, UserProfile } from '@/src/shared/types/index';
import { CRM_TEAMS_DATABASE, CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';
import { audioService } from '@/src/shared/lib/audioService';
import { CubeSat3DOrbitVisualizer } from '@/src/components/telemetry/CubeSat3DOrbitVisualizer';
import { CubeSat3DViewer } from '@/src/contexts/project/components/CubeSat3DViewer';
import { SAMPLE_MISSION_PASSPORT } from '@/src/shared/data/mockData';
import { ServerResourcesMonitorWidget } from '@/src/components/admin/ServerResourcesMonitorWidget';
import type { TelemetryPacket } from '@/src/types/index';

interface StageDirectorScreenProps {
  currentUser: UserProfile;
  eventStageState: EventStageState;
  onUpdateEventStage: (updated: Partial<EventStageState>) => void;
  teamsRegistry: CrmTeamRecord[];
  activeTeam: Team;
  telemetry: TelemetryPacket;
  onNavigateToScreen?: (screen: string) => void;
  onImpersonateCaptain?: (team: CrmTeamRecord) => void;
}

export const StageDirectorScreen: React.FC<StageDirectorScreenProps> = ({
  currentUser,
  eventStageState,
  onUpdateEventStage,
  teamsRegistry = CRM_TEAMS_DATABASE,
  activeTeam,
  telemetry,
  onNavigateToScreen,
  onImpersonateCaptain,
}) => {
  // Local active control tab on the director desk
  const [selectedControlTab, setSelectedControlTab] = useState<EventStageId>(
    eventStageState.currentStage,
  );

  // Selected team for defense screen
  const [selectedDefenseTeamId, setSelectedDefenseTeamId] = useState<string>(
    eventStageState.presentingTeamId || teamsRegistry[0]?.id || 'team-perm-01',
  );

  // Active slide on the defense desk
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(
    eventStageState.activeSlideIndex || 0,
  );

  // Timer local tick simulation if running
  const [timerSeconds, setTimerSeconds] = useState<number>(eventStageState.timer.remainingSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(eventStageState.timer.isRunning);
  const [timerMode, setTimerMode] = useState<'pitch' | 'qa' | 'paused'>(
    eventStageState.timer.mode || 'pitch',
  );

  // Stage 1 controls state
  const [orbitSpeed, setOrbitSpeed] = useState<number>(eventStageState.orbitSpeed || 1);
  const [focusedSatId, setFocusedSatId] = useState<string>(teamsRegistry[0]?.id || 'team-perm-01');
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showGroundStations, setShowGroundStations] = useState<boolean>(true);

  // Stage 2 controls state (subsystems)
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>(
    eventStageState.focusedSubsystem || 'EPS',
  );
  const [isExplodedView, setIsExplodedView] = useState<boolean>(false);

  // Ticker text
  const [tickerText, setTickerText] = useState<string>(eventStageState.tickerText);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [showMonitorWidget, setShowMonitorWidget] = useState<boolean>(true);

  // Sync with prop when external updates happen
  useEffect(() => {
    setSelectedControlTab(eventStageState.currentStage);
    setTimerSeconds(eventStageState.timer.remainingSeconds);
    setIsTimerRunning(eventStageState.timer.isRunning);
  }, [eventStageState]);

  // Timer countdown hook
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          audioService.playTimerWarning();
          onUpdateEventStage({
            timer: {
              ...eventStageState.timer,
              remainingSeconds: 0,
              isRunning: false,
            },
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, eventStageState.timer, onUpdateEventStage]);

  // Current presenting team record
  const presentingTeam =
    teamsRegistry.find((t) => t.id === selectedDefenseTeamId) || teamsRegistry[0];

  // Helper to activate a stage as the default guest screen
  const handleActivateStageAsGuestDefault = (stageId: EventStageId) => {
    onUpdateEventStage({
      currentStage: stageId,
      presentingTeamId: selectedDefenseTeamId,
      activeSlideIndex,
      focusedSubsystem: selectedSubsystem,
      orbitSpeed,
      announcement: eventStageState.announcement,
      tickerText,
      timer: {
        totalSeconds: timerMode === 'pitch' ? 300 : 180,
        remainingSeconds: timerSeconds,
        isRunning: isTimerRunning,
        mode: timerMode,
      },
    });

    audioService.playSuccessChime();
    setSaveSuccessNotice(
      `✅ Экран «${getStageTitle(stageId)}» успешно назначен главным для всех гостей портала!`,
    );
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  const getStageTitle = (stage: EventStageId) => {
    switch (stage) {
      case 'start_ships':
        return 'Стартовые позиции кораблей (Открытие)';
      case 'prep_blueprints':
        return 'Этап подготовки команд (Инженерная готовность)';
      case 'defense_pitch':
        return 'Защита команд перед экспертами (Слайды)';
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Timer handlers
  const handleStartTimer = () => {
    setIsTimerRunning(true);
    audioService.playClickSound();
    onUpdateEventStage({
      timer: {
        ...eventStageState.timer,
        isRunning: true,
        remainingSeconds: timerSeconds,
      },
    });
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    audioService.playClickSound();
    onUpdateEventStage({
      timer: {
        ...eventStageState.timer,
        isRunning: false,
        remainingSeconds: timerSeconds,
      },
    });
  };

  const handleResetTimer = (mode: 'pitch' | 'qa') => {
    const total = mode === 'pitch' ? 300 : 180;
    setTimerSeconds(total);
    setIsTimerRunning(false);
    setTimerMode(mode);
    audioService.playClickSound();
    onUpdateEventStage({
      timer: {
        totalSeconds: total,
        remainingSeconds: total,
        isRunning: false,
        mode,
      },
    });
  };

  const handleAddMinute = () => {
    setTimerSeconds((prev) => prev + 60);
    audioService.playClickSound();
    onUpdateEventStage({
      timer: {
        ...eventStageState.timer,
        remainingSeconds: timerSeconds + 60,
      },
    });
  };

  const handleSelectSlide = (idx: number) => {
    setActiveSlideIndex(idx);
    audioService.playClickSound();
    onUpdateEventStage({
      activeSlideIndex: idx,
    });
  };

  // Mock slides content for current presenting team
  const slidesContent = [
    {
      number: 1,
      title: `Миссия «${presentingTeam?.shipName || 'Восток-26'}»: Концепция и Орбита`,
      subtitle: `Научно-образовательный наноспутник CubeSat 3U • Школа: ${presentingTeam?.school || 'МАОУ СОШ №146'}`,
      points: [
        `Позывной корабля: ${presentingTeam?.shipCallsign || 'RS146S'} (частота 437.425 МГц AX.25)`,
        `Высота круговой орбиты: 420 км, наклонение 51.6° (период 92.8 мин)`,
        `Главная научная цель: ${presentingTeam?.selectedTaskTitle || 'Дистанционное зондирование Земли в мультиспектральном диапазоне'}`,
        `Экипаж проекта: Капитан (педагог), Физик, Инженер-конструктор, Биолог`,
      ],
      diagram: 'Орбитальная баллистика & Солнечно-синхронный коридор',
    },
    {
      number: 2,
      title: 'Физико-математическая модель и полезная нагрузка',
      subtitle: 'Уравнения движения, тепловой баланс и оптическая матрица',
      points: [
        'Уравнение теплового баланса: Q_солнце + Q_альбедо + Q_внутр = ε · σ · A · T^4',
        'Диапазон рабочих температур подсистем: от -25°C до +55°C (с пассивной терморегуляцией МТИ)',
        'Оптический спектрометр высокого разрешения: 450–900 нм для анализа хлорофилла растительности',
        'Энергобаланс: суточная генерация 18.4 Вт·ч при среднем потреблении 9.2 Вт',
      ],
      diagram: 'Тепловая диаграмма & Баланс мощностей (Power Budget)',
    },
    {
      number: 3,
      title: 'Конструкция CubeSat 3U, компоновка и бюджет масс',
      subtitle: 'Стандартная рамка 3U (100×100×340 мм) с интеграцией Space-Pi',
      points: [
        'Итоговая масса аппарата: 3.42 кг (лимит регламента Space-Pi: 4.0 кг)',
        'Подсистема ориентации (ADCS): 3 маховика + магнитные катушки, точность < 0.8°',
        'Бортовой компьютер (OBC): STM32F4 + резервный микроконтроллер ESP32-S3',
        'Готовность к запуску и предзащитным тестам: 100% подтверждено ЦУП',
      ],
      diagram: '3D CAD Сборка & Размещение модулей по отсекам',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. TOP HEADER & BROADCAST STATUS */}
      <div className="rounded-3xl bg-slate-900/95 border border-cyan-500/40 p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                <Tv className="w-3.5 h-3.5 text-cyan-400" />
                Пульт управления фронтендом портала
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />В ЭФИРЕ ДЛЯ
                ГОСТЕЙ: {getStageTitle(eventStageState.currentStage)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Сценический режиссер мероприятия (Stage Director)</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl">
              Главный пульт администратора для сопровождения кейс-чемпионата. Нажатием одной кнопки
              переключайте рабочий экран, который по умолчанию видят все неавторизованные
              пользователи (гости и большой экран зала).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full lg:w-auto">
            {onNavigateToScreen && (
              <button
                type="button"
                onClick={() => onNavigateToScreen('starmap')}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-102"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Предпросмотр экрана гостя</span>
              </button>
            )}
            <div className="text-right text-[11px] text-slate-400 font-mono hidden sm:block">
              Обновлено: {new Date(eventStageState.updatedAt).toLocaleTimeString('ru-RU')}
            </div>
          </div>
        </div>

        {/* Success toast notification */}
        {saveSuccessNotice && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
        )}
      </div>

      {/* 2. REAL-TIME SERVER RESOURCES MONITOR WIDGET */}
      <ServerResourcesMonitorWidget />

      {/* 2.5 ЭКРАНЫ 7 ЭТАПОВ СОРЕВНОВАНИЯ ПОД УПРАВЛЕНИЕМ ОРГКОМИТЕТА И АДМИНИСТРАТОРА */}
      <div className="rounded-3xl bg-slate-900/95 border border-cyan-500/30 p-5 sm:p-6 shadow-2xl space-y-4 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Sliders className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                7 этапов соревнования и привязка к управляемым экранам
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Прямой переход к экранам участников, жюри и оргкомитета с пульта управления администратора
            </p>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            7 регламентных экранов
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[
            {
              num: 1,
              title: 'Предварительная регистрация',
              screen: 'registration',
              screenName: 'Экран регистрации команды',
              badge: 'Сбор анкет',
              icon: UserPlus,
              color: 'border-sky-500/40 text-sky-400 bg-sky-500/10',
              description: 'Сбор заявок экипажей школ/вузов, выбор темы наноспутника CubeSat 3U и регистрация кураторов',
              controlNote: 'Пульт администратора: модерация анкет, валидация образовательных учреждений',
            },
            {
              num: 2,
              title: 'Подтверждение регистрации',
              screen: 'crm',
              screenName: 'CRM Чемпионата (Канбан)',
              badge: 'Канбан верификации',
              icon: Users,
              color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
              description: 'Очная/онлайн регистрация, сверка состава экипажей, выдача позывных и распределение слотов',
              controlNote: 'Пульт организатора: Канбан-доска верификации, допуск к старту и валидация состава',
            },
            {
              num: 3,
              title: 'Старт мероприятия',
              screen: 'mcc',
              directorStage: 'start_ships' as EventStageId,
              screenName: 'Главный экран ЦУП (3D CubeSat)',
              badge: 'Live ЦУП',
              icon: Rocket,
              color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
              description: 'Официальное открытие турнира, 3D вывод на орбиту 10 CubeSat 3U и включение радиомаяков AX.25',
              controlNote: 'Пульт режиссёра: 3D трансляция орбит, баннер открытия и скорость орбитального моделирования',
            },
            {
              num: 4,
              title: 'Выполнение заданий',
              screen: 'submissions',
              screenName: 'Загрузка решений (5 этапов)',
              badge: 'Банк 500 кейсов',
              icon: Layers,
              color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
              description: 'Решение 5 этапов кейсов по прикладной физике, расчет баллистики и 3D CAD компоновка спутника',
              controlNote: 'Пульт организатора: мониторинг сдачи этапов, банк заданий и тайминг дедлайнов',
            },
            {
              num: 5,
              title: 'Готовность к защите',
              screen: 'team',
              directorStage: 'prep_blueprints' as EventStageId,
              screenName: 'Кабинет команды & Чертежи CubeSat',
              badge: 'Чек-лист допуска',
              icon: Shield,
              color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
              description: 'Финальный аудит готовности экипажа: 3 слайда презентации, 3D CAD чертежи и прохождение предзащиты',
              controlNote: 'Пульт режиссёра: проверка подсистем (EPS, OBC, ADCS) и модерация слайдов к защите',
            },
            {
              num: 6,
              title: 'Защита команд',
              screen: 'jury',
              directorStage: 'defense_pitch' as EventStageId,
              screenName: 'Панель жюри & Трибуна питча',
              badge: 'Питч перед жюри',
              icon: Scale,
              color: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
              description: 'Очные и онлайн защиты перед экспертами: трибуна команды, таймер регламента и протокол оценок',
              controlNote: 'Пульт режиссёра: таймер (300с питч / 180с Q&A), вызов команды на трибуну и судейский протокол',
            },
            {
              num: 7,
              title: 'Подготовка документов',
              screen: 'certificates',
              screenName: 'Сертификаты & Отчеты',
              badge: 'Итоги и дипломы',
              icon: FileText,
              color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
              description: 'Подведение итогов чемпионата, сводный рейтинг, наградные дипломы и экспорт паспорта миссии',
              controlNote: 'Пульт администратора: итоговые ведомости, пакетная генерация сертификатов и PDF-отчет',
            },
          ].map((stg) => {
            const StgIcon = stg.icon;
            const isLiveBroadcast = stg.directorStage && eventStageState.currentStage === stg.directorStage;

            return (
              <div
                key={stg.num}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between bg-slate-950/70 hover:bg-slate-950/90 ${
                  isLiveBroadcast
                    ? 'border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-800 text-cyan-300 font-mono text-xs font-bold border border-slate-700">
                        {stg.num}
                      </span>
                      <span className={`p-1.5 rounded-lg border text-xs ${stg.color}`}>
                        <StgIcon className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isLiveBroadcast
                          ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {isLiveBroadcast ? '● В ЭФИРЕ' : stg.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {stg.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {stg.description}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[10px] space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500">Экран:</span>
                      <span className="text-cyan-300 font-semibold truncate max-w-[150px]">
                        {stg.screenName}
                      </span>
                    </div>
                    <p className="text-slate-400 italic">
                      {stg.controlNote}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2">
                  {onNavigateToScreen && (
                    <button
                      type="button"
                      onClick={() => onNavigateToScreen(stg.screen)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-[11px] font-bold border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3 h-3 text-cyan-400" />
                      <span>Перейти к экрану</span>
                    </button>
                  )}
                  {stg.directorStage && (
                    <button
                      type="button"
                      onClick={() => handleActivateStageAsGuestDefault(stg.directorStage!)}
                      className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                        isLiveBroadcast
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                      }`}
                      title="Вывести этот этап в эфир для гостей"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isLiveBroadcast ? 'В эфире' : 'В эфир'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. THE THREE STAGE CONTROLLER CARDS (QUICK SWITCHER) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 1 Selector Card */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all relative flex flex-col justify-between ${
            eventStageState.currentStage === 'start_ships'
              ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)] ring-2 ring-cyan-500/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          {eventStageState.currentStage === 'start_ships' && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
              АКТИВЕН ДЛЯ ГОСТЕЙ
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                  Экран 1 • Открытие
                </span>
                <h3 className="text-base font-bold text-white">Стартовые позиции кораблей</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              3D Земля с орбитами CubeSat 3U, координаты аппаратов, стартовый реестр команд, частоты
              маяка AX.25 и приветственный баннер открытия чемпионата.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedControlTab('start_ships')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedControlTab === 'start_ships'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Настройки пульта
            </button>
            <button
              type="button"
              onClick={() => handleActivateStageAsGuestDefault('start_ships')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                eventStageState.currentStage === 'start_ships'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-md'
              }`}
            >
              <Send className="w-3 h-3" />
              <span>{eventStageState.currentStage === 'start_ships' ? 'В эфире' : 'В эфир'}</span>
            </button>
          </div>
        </div>

        {/* Stage 2 Selector Card */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all relative flex flex-col justify-between ${
            eventStageState.currentStage === 'prep_blueprints'
              ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.3)] ring-2 ring-indigo-500/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          {eventStageState.currentStage === 'prep_blueprints' && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider">
              АКТИВЕН ДЛЯ ГОСТЕЙ
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                  Экран 2 • Инженерия
                </span>
                <h3 className="text-base font-bold text-white">Подготовка команд к защите</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              3D CAD чертежи CubeSat 3U, декомпозиция подсистем (EPS, OBC, ADCS, Radio, Payload),
              стена готовности команд с чек-листами прохождения тестов.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedControlTab('prep_blueprints')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedControlTab === 'prep_blueprints'
                  ? 'bg-slate-800 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Настройки пульта
            </button>
            <button
              type="button"
              onClick={() => handleActivateStageAsGuestDefault('prep_blueprints')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                eventStageState.currentStage === 'prep_blueprints'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
              }`}
            >
              <Send className="w-3 h-3" />
              <span>
                {eventStageState.currentStage === 'prep_blueprints' ? 'В эфире' : 'В эфир'}
              </span>
            </button>
          </div>
        </div>

        {/* Stage 3 Selector Card */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all relative flex flex-col justify-between ${
            eventStageState.currentStage === 'defense_pitch'
              ? 'bg-gradient-to-b from-amber-950/80 to-slate-900 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] ring-2 ring-amber-500/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          {eventStageState.currentStage === 'defense_pitch' && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
              АКТИВЕН ДЛЯ ГОСТЕЙ
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                  Экран 3 • Питч жюри
                </span>
                <h3 className="text-base font-bold text-white">Защита проектов перед экспертами</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Презентации и слайды выступающей команды, таймер регламента (питч + ответы на
              вопросы), карточка команды на трибуне и статус экспертной оценки.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedControlTab('defense_pitch')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedControlTab === 'defense_pitch'
                  ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Настройки пульта
            </button>
            <button
              type="button"
              onClick={() => handleActivateStageAsGuestDefault('defense_pitch')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                eventStageState.currentStage === 'defense_pitch'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
              }`}
            >
              <Send className="w-3 h-3" />
              <span>{eventStageState.currentStage === 'defense_pitch' ? 'В эфире' : 'В эфир'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. DETAILED CONTROL CONSOLE FOR THE SELECTED SCREEN */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-2xl">
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">
              Консоль детального управления: {getStageTitle(selectedControlTab)}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleActivateStageAsGuestDefault(selectedControlTab)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Сделать активным экраном по умолчанию</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONSOLE VIEW 1: START SHIPS (3D EARTH, SATELLITES, ROSTER) */}
        {/* ========================================================================= */}
        {selectedControlTab === 'start_ships' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: 3D Globe Preview & Camera Presets */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border border-cyan-500/30 overflow-hidden bg-slate-950 shadow-2xl">
                  <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>3D WebGL Орбитальный видоискатель • Земля и CubeSat 3U</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>Скорость: {orbitSpeed}x</span>
                      <span>•</span>
                      <span>Аппаратов: {teamsRegistry.length}</span>
                    </div>
                  </div>

                  <div className="h-80 sm:h-96 relative">
                    <CubeSat3DOrbitVisualizer
                      telemetry={{
                        ...telemetry,
                        velocityKms: telemetry.velocityKms * orbitSpeed,
                      }}
                      isPaused={orbitSpeed === 0}
                    />
                  </div>
                </div>

                {/* Orbit & Camera Controls */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      Скорость орбит
                    </span>
                    <div className="flex items-center gap-1">
                      {[0.5, 1, 2, 5].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => {
                            setOrbitSpeed(spd);
                            onUpdateEventStage({ orbitSpeed: spd });
                          }}
                          className={`flex-1 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                            orbitSpeed === spd
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      Векторы скорости
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowVectors(!showVectors)}
                      className={`w-full py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        showVectors ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {showVectors ? 'Векторы: ВКЛ' : 'Векторы: ВЫКЛ'}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      Станции СОНИКС
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowGroundStations(!showGroundStations)}
                      className={`w-full py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        showGroundStations
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {showGroundStations ? 'СОНИКС: ВКЛ' : 'СОНИКС: ВЫКЛ'}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Анимация</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newSpeed = orbitSpeed === 0 ? 1 : 0;
                        setOrbitSpeed(newSpeed);
                        onUpdateEventStage({ orbitSpeed: newSpeed });
                      }}
                      className={`w-full py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        orbitSpeed === 0 ? 'bg-rose-600 text-white' : 'bg-cyan-600 text-slate-950'
                      }`}
                    >
                      {orbitSpeed === 0 ? 'Пауза орбит' : 'Орбиты в движении'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Col: Team Satellites Roster & Announcement Manager */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                      <Rocket className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Стартовые корабли ({teamsRegistry.length})</span>
                    </h3>
                    <span className="text-[10px] text-cyan-400">Фокус на спутник</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {teamsRegistry.map((team, idx) => {
                      const isFocused = focusedSatId === team.id;
                      return (
                        <div
                          key={team.id}
                          onClick={() => {
                            setFocusedSatId(team.id);
                            audioService.playClickSound();
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            isFocused
                              ? 'bg-cyan-950/70 border-cyan-500/60 text-white'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              <span className="font-bold truncate">{team.shipName}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                ({team.shipCallsign})
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">{team.school}</p>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono shrink-0">
                            437 МГц
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CONSOLE VIEW 2: PREPARATION & BLUEPRINTS (CAD CUBESAT 3U & READINESS WALL) */}
        {/* ========================================================================= */}
        {selectedControlTab === 'prep_blueprints' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: 3D CAD Viewer & Subsystems decomposition */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border border-indigo-500/30 overflow-hidden bg-slate-950 shadow-2xl">
                  <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>3D CAD Компоновка CubeSat 3U • Подсистема: {selectedSubsystem}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsExplodedView(!isExplodedView)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                          isExplodedView
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isExplodedView ? 'Взрыв-схема: ВКЛ' : 'Взрыв-схема: ВЫКЛ'}
                      </button>
                    </div>
                  </div>

                  <div className="h-80 sm:h-96 relative bg-slate-950 flex items-center justify-center">
                    <CubeSat3DViewer
                      passport={activeTeam?.missionPassport || SAMPLE_MISSION_PASSPORT}
                      activeBlueprintId={selectedSubsystem}
                      onSelectBlueprint={(sub: string) => {
                        setSelectedSubsystem(sub);
                        onUpdateEventStage({ focusedSubsystem: sub });
                      }}
                    />
                  </div>
                </div>

                {/* Subsystem quick pills */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'EPS', label: 'EPS • Энергетика', desc: 'СБ + LiFePO4' },
                    { id: 'OBC', label: 'OBC • Компьютер', desc: 'STM32F4 + RTOS' },
                    { id: 'ADCS', label: 'ADCS • Ориентация', desc: 'Маховики + ДМП' },
                    { id: 'COM', label: 'COM • Радиолиния', desc: 'AX.25 437 МГц' },
                    { id: 'PAYLOAD', label: 'PAYLOAD • Нагрузка', desc: 'Оптика / Спектр' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubsystem(sub.id);
                        audioService.playClickSound();
                        onUpdateEventStage({ focusedSubsystem: sub.id });
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedSubsystem === sub.id
                          ? 'bg-indigo-950/80 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs">{sub.label}</div>
                      <div className="text-[10px] text-slate-400">{sub.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Col: Team Readiness Wall & Engineering Status */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Стена готовности команд к защите</span>
                    </h3>
                  </div>

                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {teamsRegistry.map((team) => {
                      const readiness =
                        team.status === 'registered_active'
                          ? 100
                          : team.status === 'quota_allocated'
                            ? 80
                            : 45;
                      return (
                        <div
                          key={team.id}
                          className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white truncate">
                              {team.shipName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                              {readiness}% Готовность
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all"
                              style={{ width: `${readiness}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{team.school}</span>
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Тесты пройдены
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CONSOLE VIEW 3: DEFENSE STAGE (SLIDES, TIMER, PRESENTING TEAM PODIUM) */}
        {/* ========================================================================= */}
        {selectedControlTab === 'defense_pitch' && (
          <div className="space-y-6">
            {/* Top Toolbar: Presenting Team Selector & Podium Header */}
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                    На трибуне защиты:
                  </span>
                  <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Корабль «{presentingTeam?.shipName || 'Восток-26'}»</span>
                    <span className="text-xs font-mono text-slate-400">
                      ({presentingTeam?.shipCallsign})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {presentingTeam?.school} • Педагог-наставник: {presentingTeam?.mentorName}
                  </p>
                </div>
              </div>

              {/* Selector for presenting team */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <label className="text-xs text-slate-400 shrink-0">Выбрать команду:</label>
                <select
                  value={selectedDefenseTeamId}
                  onChange={(e) => {
                    const newTeamId = e.target.value;
                    setSelectedDefenseTeamId(newTeamId);
                    onUpdateEventStage({ presentingTeamId: newTeamId });
                    audioService.playClickSound();
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {teamsRegistry.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.shipName} ({t.school})
                    </option>
                  ))}
                </select>

                {onImpersonateCaptain && presentingTeam && (
                  <button
                    type="button"
                    onClick={() => onImpersonateCaptain(presentingTeam)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                    title="Войти в кабинет капитана этой команды"
                  >
                    Войти капитаном
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Interactive Slide Screen */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border border-amber-500/30 overflow-hidden bg-slate-950 shadow-2xl">
                  {/* Slide Header Toolbar */}
                  <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">
                        Слайд {activeSlideIndex + 1} из 3 • {slidesContent[activeSlideIndex]?.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectSlide(Math.max(0, activeSlideIndex - 1))}
                        disabled={activeSlideIndex === 0}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                        title="Предыдущий слайд"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectSlide(Math.min(2, activeSlideIndex + 1))}
                        disabled={activeSlideIndex === 2}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                        title="Следующий слайд"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main Slide Presentation Canvas */}
                  <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 min-h-80 sm:min-h-96 flex flex-col justify-between relative overflow-hidden">
                    <div className="space-y-4 relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                        <span>СЛАЙД №{activeSlideIndex + 1}</span>
                        <span>•</span>
                        <span>{presentingTeam?.shipName}</span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                        {slidesContent[activeSlideIndex]?.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-cyan-300 font-medium">
                        {slidesContent[activeSlideIndex]?.subtitle}
                      </p>

                      <ul className="space-y-2.5 pt-2">
                        {slidesContent[activeSlideIndex]?.points.map((pt, pIdx) => (
                          <li
                            key={pIdx}
                            className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 border-t border-slate-800/80 mt-6 flex flex-wrap items-center justify-between text-xs text-slate-400 relative z-10">
                      <span className="font-mono">
                        Схема: {slidesContent[activeSlideIndex]?.diagram}
                      </span>
                      <span className="font-mono text-cyan-400">
                        Формат CubeSat: 3U (Space-Pi Ready)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Slide Thumbnails */}
                <div className="grid grid-cols-3 gap-3">
                  {slidesContent.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSlide(idx)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        activeSlideIndex === idx
                          ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          Слайд {s.number}
                        </span>
                        {activeSlideIndex === idx && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-white truncate">{s.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Col: Official Defense Timer & Regulations */}
              <div className="space-y-4">
                {/* Official Clock Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Таймер регламента защиты</span>
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isTimerRunning
                          ? 'bg-emerald-500/20 text-emerald-300 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isTimerRunning ? 'ИДЕТ ДОКЛАД' : 'ПАУЗА'}
                    </span>
                  </div>

                  {/* Big Digital Clock Display */}
                  <div
                    className={`p-6 rounded-2xl border text-center transition-all ${
                      timerSeconds === 0
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                        : timerSeconds < 60
                          ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight">
                      {formatTime(timerSeconds)}
                    </div>
                    <div className="text-xs font-medium text-slate-400 mt-2">
                      {timerMode === 'pitch'
                        ? 'Режим: Доклад команды (5 мин)'
                        : 'Режим: Вопросы экспертов (3 мин)'}
                    </div>
                  </div>

                  {/* Timer Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {isTimerRunning ? (
                      <button
                        type="button"
                        onClick={handlePauseTimer}
                        className="py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Pause className="w-4 h-4" />
                        <span>Пауза</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartTimer}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        <span>Старт</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleAddMinute}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>+1 Минута</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleResetTimer('pitch')}
                      className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      Сброс: Питч (5м)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetTimer('qa')}
                      className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      Сброс: Вопросы (3м)
                    </button>
                  </div>
                </div>

                {/* Team Crew Members Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Экипаж на защите</span>
                  </h4>
                  <div className="space-y-1.5">
                    {presentingTeam?.students?.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 text-xs"
                      >
                        <span className="font-bold text-white">{s.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                          {s.roleTitle || s.assignedRole}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
