import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  Pause,
  Play,
  Share2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  FileText,
  Shield,
  Award,
  Zap,
  Radio,
  Eye,
  LogIn,
  UserCheck,
  Search,
  Globe,
  Tv,
} from 'lucide-react';
import {
  Team,
  UserProfile,
  ChampionshipNews,
  VenueMapZone,
  RouteSheetItem,
} from '@/src/shared/types/index';
import { CRM_TEAMS_DATABASE, CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';
import { audioService } from '@/src/shared/lib/audioService';
import type { EventStageId, EventStageState } from '@/src/shared/types/stageDirector';
import { CubeSat3DOrbitVisualizer } from '@/src/components/telemetry/CubeSat3DOrbitVisualizer';
import { CubeSat3DViewer } from '@/src/contexts/project/components/CubeSat3DViewer';
import { SAMPLE_MISSION_PASSPORT } from '@/src/shared/data/mockData';
import type { TelemetryPacket } from '@/src/types/index';

interface GuestStarMapScreenProps {
  teamsList?: CrmTeamRecord[];
  activeTeam?: Team;
  currentUser: UserProfile;
  newsList: ChampionshipNews[];
  venueZones: VenueMapZone[];
  routeSheet: RouteSheetItem[];
  onOpenRegistration: (prefillTeamId?: string) => void;
  onNavigateToScreen: (screenId: string) => void;
  onSwitchRole: (role: any) => void;
  onSelectShipForInspection?: (teamId: string) => void;
  eventStageState?: EventStageState;
  telemetry?: TelemetryPacket;
}

export const GuestStarMapScreen: React.FC<GuestStarMapScreenProps> = ({
  teamsList = CRM_TEAMS_DATABASE,
  activeTeam,
  currentUser,
  newsList,
  venueZones,
  routeSheet,
  onOpenRegistration,
  onNavigateToScreen,
  onSwitchRole,
  onSelectShipForInspection,
  eventStageState,
  telemetry,
}) => {
  // Determine active stage from admin state or default to start_ships
  const activeStage: EventStageId = eventStageState?.currentStage || 'start_ships';

  // Star Map Carousel State (Stage 1)
  const [activeShipIndex, setActiveShipIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    venueZones[0]?.id || 'zone-main-hall',
  );
  const [newsFilter, setNewsFilter] = useState<string>('all');
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [selectedRouteStep, setSelectedRouteStep] = useState<number>(2);

  // Stage 2 (Prep & CAD) local view state
  const [focusedSubsystem, setFocusedSubsystem] = useState<string>(
    eventStageState?.focusedSubsystem || 'EPS',
  );

  // Stage 3 (Defense) local presentation slide index
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(
    eventStageState?.activeSlideIndex || 0,
  );

  // Sync active slide when admin changes it
  useEffect(() => {
    if (eventStageState?.activeSlideIndex !== undefined) {
      setActiveSlideIndex(eventStageState.activeSlideIndex);
    }
  }, [eventStageState?.activeSlideIndex]);

  // Sync focused subsystem when admin changes it
  useEffect(() => {
    if (eventStageState?.focusedSubsystem) {
      setFocusedSubsystem(eventStageState.focusedSubsystem);
    }
  }, [eventStageState?.focusedSubsystem]);

  const currentShip = teamsList[activeShipIndex] || teamsList[0];

  // Presenting team for stage 3
  const presentingTeam =
    teamsList.find((t) => t.id === eventStageState?.presentingTeamId) ||
    teamsList.find((t) => t.id === 'team-perm-01') ||
    teamsList[0];

  // Auto-cycle through registered ships on Stage 1
  useEffect(() => {
    if (!isAutoCycling || teamsList.length === 0 || activeStage !== 'start_ships') return;

    const timer = setInterval(() => {
      setActiveShipIndex((prev) => (prev + 1) % teamsList.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isAutoCycling, teamsList.length, activeStage]);

  const handleNextShip = () => {
    setActiveShipIndex((prev) => (prev + 1) % teamsList.length);
    audioService.playClickSound();
  };

  const handlePrevShip = () => {
    setActiveShipIndex((prev) => (prev - 1 + teamsList.length) % teamsList.length);
    audioService.playClickSound();
  };

  const handleSelectSpecificShip = (index: number) => {
    setActiveShipIndex(index);
    audioService.playClickSound();
  };

  const formatTimer = (secs?: number) => {
    if (typeof secs !== 'number') return '05:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filtered news
  const filteredNews = newsList.filter((item) => {
    const matchesCategory = newsFilter === 'all' || item.category === newsFilter;
    const matchesSearch =
      !newsSearchQuery.trim() ||
      item.title.toLowerCase().includes(newsSearchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(newsSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeZone = venueZones.find((z) => z.id === selectedZoneId) || venueZones[0];

  const getStageHeaderInfo = (stage: EventStageId) => {
    switch (stage) {
      case 'start_ships':
        return {
          tag: 'ЭТАП 1: СТАРТОВЫЕ ПОЗИЦИИ КОРАБЛЕЙ',
          title: '3D Орбиты, Земля и стартовые позиции CubeSat 3U',
          desc: 'Официальное открытие кейс-чемпионата: 10 космических аппаратов школьных команд на орбите.',
          color: 'from-cyan-500/20 to-blue-600/30 border-cyan-500/40 text-cyan-300',
        };
      case 'prep_blueprints':
        return {
          tag: 'ЭТАП 2: ПОДГОТОВКА КОМАНД К ЗАЩИТЕ',
          title: 'Инженерная готовность, 3D CAD чертежи и стена команд',
          desc: 'Сверка подсистем спутников (EPS, OBC, ADCS, COM, Payload), верификация расчетов и технический допуск.',
          color: 'from-indigo-500/20 to-purple-600/30 border-indigo-500/40 text-indigo-300',
        };
      case 'defense_pitch':
        return {
          tag: 'ЭТАП 3: ЗАЩИТА ПРОЕКТОВ ПЕРЕД ЭКСПЕРТАМИ',
          title: 'Презентация и защита решений: слайды миссии на трибуне',
          desc: 'Прямая трансляция защиты: доклад команды перед жюри, таймер регламента и научно-инженерные слайды.',
          color: 'from-amber-500/20 to-orange-600/30 border-amber-500/40 text-amber-300',
        };
    }
  };

  const headerInfo = getStageHeaderInfo(activeStage);

  // Presentation slides for presenting team
  const slidesContent = [
    {
      number: 1,
      title: `Миссия «${presentingTeam?.shipName || 'Восток-26'}»: Концепция и Орбита`,
      subtitle: `Научно-образовательный наноспутник CubeSat 3U • ${presentingTeam?.school || 'МАОУ СОШ №146'}`,
      points: [
        `Позывной корабля: ${presentingTeam?.shipCallsign || 'RS146S'} (частота 437.425 МГц AX.25)`,
        `Высота орбиты: 420 км, наклонение 51.6° (период 92.8 мин)`,
        `Главная научная цель: ${presentingTeam?.selectedTaskTitle || 'Дистанционное зондирование Земли в мультиспектральном диапазоне'}`,
        `Экипаж проекта: Капитан (педагог), Физик, Инженер, Биолог`,
      ],
      diagram: 'Орбитальная баллистика & Солнечно-синхронный коридор',
    },
    {
      number: 2,
      title: 'Физико-математическая модель и полезная нагрузка',
      subtitle: 'Уравнения движения, тепловой баланс и оптическая матрица',
      points: [
        'Уравнение теплового баланса: Q_солнце + Q_альбедо + Q_внутр = ε · σ · A · T^4',
        'Диапазон рабочих температур подсистем: от -25°C до +55°C (пассивная терморегуляция МТИ)',
        'Оптический спектрометр: 450–900 нм для анализа растительности',
        'Энергобаланс: суточная генерация 18.4 Вт·ч при потреблении 9.2 Вт',
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
        'Бортовой компьютер (OBC): STM32F4 + резервный контроллер ESP32-S3',
        'Готовность к запуску и защите: 100% подтверждено ЦУП',
      ],
      diagram: '3D CAD Сборка & Размещение модулей по отсекам',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* 1. BROADCAST LIVE BANNER CONTROLLED BY ADMIN */}
      <div
        className={`p-4 sm:p-5 rounded-3xl bg-gradient-to-r ${headerInfo.color} border shadow-2xl relative overflow-hidden backdrop-blur-xl`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase tracking-wider">
                ПРЯМОЙ ЭФИР ДЛЯ ГОСТЕЙ ПОРТАЛА
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                • Управляется с пульта администратора
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {headerInfo.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              {eventStageState?.announcement || headerInfo.desc}
            </p>
          </div>

          {/* Quick role login prompt for guests */}
          {currentUser.role === 'guest' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onSwitchRole('admin')}
                className="px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                title="Войти под администратором для доступа к пульту"
              >
                Вход координатора
              </button>
              <button
                type="button"
                onClick={() => onSwitchRole('mentor')}
                className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md cursor-pointer"
                title="Войти капитаном команды"
              >
                Вход капитана
              </button>
            </div>
          )}
        </div>

        {/* Ticker tape if set */}
        {eventStageState?.tickerText && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-cyan-300/90 font-mono overflow-hidden whitespace-nowrap">
            <span className="animate-pulse">{eventStageState.tickerText}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STAGE 1: START SHIPS (3D EARTH, CELESTIAL ORBITS, ROSTER) */}
      {/* ========================================================================= */}
      {activeStage === 'start_ships' && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-cyan-500/30 shadow-2xl p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  Стартовый сектор • 3D Орбитальный видоискатель
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Орбитальные позиции наноспутников CubeSat 3U
                </h2>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Всего кораблей: <strong className="text-cyan-300">{teamsList.length}</strong> •
                Скорость орбит: {eventStageState?.orbitSpeed || 1}x
              </div>
            </div>

            {/* 3D WebGL Earth Orbit Visualizer */}
            {telemetry && (
              <div className="rounded-2xl border border-cyan-500/30 overflow-hidden bg-slate-950 shadow-2xl">
                <div className="h-80 sm:h-96 relative">
                  <CubeSat3DOrbitVisualizer
                    telemetry={{
                      ...telemetry,
                      velocityKms: telemetry.velocityKms * (eventStageState?.orbitSpeed || 1),
                    }}
                    isPaused={eventStageState?.orbitSpeed === 0}
                  />
                </div>
              </div>
            )}

            {/* The Visual Star Celestial Map Carousel */}
            <div className="relative aspect-[16/10] sm:aspect-[21/9] min-h-[340px] w-full rounded-2xl bg-slate-950/80 border border-indigo-500/30 overflow-hidden shadow-inner flex items-center justify-center p-4">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-[85%] h-[85%] rounded-full border border-dashed border-indigo-500/30 animate-[spin_120s_linear_infinite]" />
                <div className="absolute w-[60%] h-[60%] rounded-full border border-indigo-400/20 animate-[spin_90s_linear_infinite_reverse]" />
                <div className="absolute w-[35%] h-[35%] rounded-full border border-dashed border-cyan-400/30 animate-[spin_60s_linear_infinite]" />
                <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 via-cyan-500 to-emerald-400 shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center justify-center text-xs font-bold text-slate-950">
                  🌍
                </div>
              </div>

              {/* Constellation Stars (Ships) */}
              <div className="relative w-full h-full">
                {teamsList.map((team, idx) => {
                  const isHighlighted = idx === activeShipIndex;
                  const angle = (idx * (360 / teamsList.length) * Math.PI) / 180;
                  const radius = 22 + (idx % 3) * 14;
                  const posX = 50 + radius * Math.cos(angle);
                  const posY = 50 + radius * Math.sin(angle);

                  return (
                    <button
                      key={team.id}
                      onClick={() => handleSelectSpecificShip(idx)}
                      style={{ left: `${posX}%`, top: `${posY}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-500 cursor-pointer ${
                        isHighlighted
                          ? 'scale-125 z-30'
                          : 'scale-90 hover:scale-110 z-20 opacity-80'
                      }`}
                      title={`${team.shipName} (${team.school})`}
                    >
                      {isHighlighted && (
                        <div className="absolute -inset-3 rounded-full bg-indigo-500/40 animate-ping" />
                      )}
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-lg ${
                          isHighlighted
                            ? 'bg-gradient-to-r from-amber-400 to-indigo-500 text-slate-950 ring-4 ring-cyan-400/80 shadow-[0_0_25px_rgba(34,211,238,0.8)]'
                            : 'bg-slate-900 border border-indigo-400/60 text-indigo-300 hover:border-cyan-300 hover:text-white'
                        }`}
                      >
                        {isHighlighted ? '🛰️' : idx + 1}
                      </div>

                      <div
                        className={`absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap transition-all shadow-md ${
                          isHighlighted
                            ? 'bg-slate-900/95 text-cyan-300 border border-cyan-500/50 shadow-cyan-500/20 opacity-100 scale-100'
                            : 'bg-slate-950/80 text-slate-400 border border-slate-800 opacity-0 group-hover:opacity-100 pointer-events-none'
                        }`}
                      >
                        {team.shipName}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Star Map Controls Toolbar */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="font-mono text-cyan-300 font-bold">
                    #{activeShipIndex + 1} из {teamsList.length}
                  </span>
                  <span className="hidden sm:inline text-slate-500">•</span>
                  <span className="hidden sm:inline text-slate-300 font-medium truncate max-w-[200px]">
                    «{currentShip.shipName}»
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevShip}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    title="Предыдущий корабль"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsAutoCycling(!isAutoCycling)}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-indigo-600/30 border-indigo-500/50 text-indigo-300"
                  >
                    {isAutoCycling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{isAutoCycling ? 'Авто' : 'Пуск'}</span>
                  </button>
                  <button
                    onClick={handleNextShip}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    title="Следующий корабль"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ship Details Highlight Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                  Текущий корабль в фокусе:
                </span>
                <div className="text-lg font-black text-white flex items-center gap-2">
                  <span>{currentShip.shipName}</span>
                  <span className="text-xs font-mono text-slate-400">
                    ({currentShip.shipCallsign})
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {currentShip.school} • Капитан: {currentShip.mentorName}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
                  Задача: {currentShip.selectedTaskTitle || 'Дистанционное зондирование'}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: PREPARATION & CAD BLUEPRINTS */}
      {/* ========================================================================= */}
      {activeStage === 'prep_blueprints' && (
        <section className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                Инженерная готовность • CubeSat 3U CAD
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Чертежи и декомпозиция подсистем космического аппарата
              </h2>
            </div>
            <span className="text-xs text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/40 font-mono">
              Стандарт: CubeSat 3U (100×100×340 мм)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 3D CAD Viewer */}
            <div className="lg:col-span-2 rounded-2xl border border-indigo-500/30 overflow-hidden bg-slate-950 p-2">
              <div className="h-80 sm:h-96 relative flex items-center justify-center">
                <CubeSat3DViewer
                  passport={activeTeam?.missionPassport || SAMPLE_MISSION_PASSPORT}
                  activeBlueprintId={focusedSubsystem}
                  onSelectBlueprint={(sub: string) => setFocusedSubsystem(sub)}
                />
              </div>
            </div>

            {/* Subsystems Breakdown Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Ключевые модули спутника:
              </h3>
              {[
                {
                  id: 'EPS',
                  name: 'EPS • Система энергоснабжения',
                  desc: 'Фотоэлектрические преобразователи + АКБ LiFePO4',
                },
                {
                  id: 'OBC',
                  name: 'OBC • Бортовой компьютер',
                  desc: 'STM32F407 Cortex-M4 с ОС реального времени FreeRTOS',
                },
                {
                  id: 'ADCS',
                  name: 'ADCS • Ориентация и стабилизация',
                  desc: '3 маховика + магнитные катушки разгрузки',
                },
                {
                  id: 'COM',
                  name: 'COM • Приёмопередатчик AX.25',
                  desc: 'Частота 437.425 МГц, мощность 1.5 Вт',
                },
                {
                  id: 'PAYLOAD',
                  name: 'PAYLOAD • Научная нагрузка',
                  desc: 'Мультиспектральная камера и дозиметр космических лучей',
                },
              ].map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setFocusedSubsystem(sub.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    focusedSubsystem === sub.id
                      ? 'bg-indigo-950/80 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold">{sub.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{sub.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Teams Readiness Wall */}
          <div className="pt-4 border-t border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Стена готовности команд к этапу защиты:</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teamsList.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate">{t.shipName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      Готов к защите
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{t.school}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: DEFENSE PITCH & SLIDES */}
      {/* ========================================================================= */}
      {activeStage === 'defense_pitch' && (
        <section className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                Защита решений • Трибуна чемпионата
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Защита космического аппарата «{presentingTeam?.shipName || 'Восток-26'}»
              </h2>
              <p className="text-xs text-slate-300">
                {presentingTeam?.school} • Позывной: {presentingTeam?.shipCallsign}
              </p>
            </div>

            {/* Official Countdown Timer Badge */}
            <div className="px-5 py-2.5 rounded-2xl bg-slate-950 border border-amber-500/40 text-center shadow-lg">
              <div className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                {eventStageState?.timer?.mode === 'pitch' ? 'Время доклада' : 'Вопросы жюри'}
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {formatTimer(eventStageState?.timer?.remainingSeconds)}
              </div>
            </div>
          </div>

          {/* Interactive Slide Viewer Canvas */}
          <div className="rounded-2xl border border-amber-500/30 overflow-hidden bg-slate-950 shadow-2xl">
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
                  onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                  disabled={activeSlideIndex === 0}
                  className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlideIndex(Math.min(2, activeSlideIndex + 1))}
                  disabled={activeSlideIndex === 2}
                  className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 min-h-80 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                  <span>СЛАЙД №{activeSlideIndex + 1}</span>
                  <span>•</span>
                  <span>{presentingTeam?.shipName}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {slidesContent[activeSlideIndex]?.title}
                </h3>
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

              <div className="pt-6 border-t border-slate-800/80 mt-6 flex flex-wrap items-center justify-between text-xs text-slate-400">
                <span className="font-mono">Схема: {slidesContent[activeSlideIndex]?.diagram}</span>
                <span className="font-mono text-cyan-400">Регламент Space-Pi: CubeSat 3U</span>
              </div>
            </div>
          </div>

          {/* Slide Switcher Thumbnails */}
          <div className="grid grid-cols-3 gap-3">
            {slidesContent.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlideIndex(idx)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeSlideIndex === idx
                    ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-mono font-bold text-amber-400">
                  Слайд {s.number}
                </div>
                <div className="text-xs font-bold text-white truncate">{s.title}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 2. VENUE ZONES MAP & PROGRAM SCHEDULE */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Zone Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Регламент и маршрутный лист мероприятия</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {routeSheet.map((step) => (
                <div
                  key={step.id}
                  onClick={() => setSelectedRouteStep(step.stepNumber)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedRouteStep === step.stepNumber
                      ? 'bg-cyan-950/70 border-cyan-500/60 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-mono font-bold text-cyan-400">{step.timeSlot}</div>
                  <div className="font-bold text-white truncate mt-0.5">{step.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{step.location}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Championship News Feed */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Лента событий чемпионата</span>
            </h3>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredNews.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-cyan-400 uppercase font-mono">
                      {n.category}
                    </span>
                    <span>{n.publishedAt}</span>
                  </div>
                  <div className="text-xs font-bold text-white">{n.title}</div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
