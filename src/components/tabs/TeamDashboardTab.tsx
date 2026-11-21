import React, { useState } from 'react';
import {
  Award,
  Radio,
  BatteryCharging,
  Sun,
  Clock,
  CheckCircle2,
  FileText,
  MessageSquare,
  ArrowRight,
  Activity,
  Sliders,
  Calculator,
  ShieldCheck,
  Zap,
  Users,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { CubeSatAssemblyBlueprintModal } from '../CubeSatAssemblyBlueprintModal';
import {
  Team,
  TelemetryPacket,
  WidgetConfig,
  UserRole,
  ChatMessage,
  ChatChannel,
  ConnectedMobileDevice,
} from '../../types';
import { CASE_STAGES } from '../../data/mockData';
import { ChampionshipProgressBar } from '../ChampionshipProgressBar';
import { CubeSatReadinessProgressBar } from '../CubeSatReadinessProgressBar';
import { TeamLiveChat } from '../chat/TeamLiveChat';
import { TeamMobileSyncWidget } from '../TeamMobileSyncWidget';
import { computeCubeSatReadiness } from '../../domain/scoring';
import blueprint1U from '@/src/assets/images/cubesat_1u_blueprint_1791436560253.jpg';
import blueprint2U from '@/src/assets/images/cubesat_2u_blueprint_1791436574557.jpg';
import blueprint3U from '@/src/assets/images/cubesat_3u_blueprint_1791436585233.jpg';

interface TeamDashboardTabProps {
  team: Team;
  telemetry: TelemetryPacket;
  widgets: WidgetConfig[];
  userRole?: UserRole;
  chatMessages: ChatMessage[];
  activeChatChannel: ChatChannel;
  onSendChatMessage: (params: {
    text: string;
    channel?: ChatChannel;
    attachment?: { name: string; size: string; type: string };
  }) => void;
  onAddChatReaction: (messageId: string, emoji: string) => void;
  onToggleChatPin: (messageId: string) => void;
  onChatChannelChange: (channel: ChatChannel) => void;
  isChatTyping?: boolean;
  onOpenCustomizer: () => void;
  onNavigateTab: (tab: string) => void;
  connectedDevices?: ConnectedMobileDevice[];
  onOpenMobileSync?: () => void;
}

export const TeamDashboardTab: React.FC<TeamDashboardTabProps> = ({
  team,
  telemetry,
  widgets,
  userRole = 'participant',
  chatMessages,
  activeChatChannel,
  onSendChatMessage,
  onAddChatReaction,
  onToggleChatPin,
  onChatChannelChange,
  isChatTyping = false,
  onOpenCustomizer,
  onNavigateTab,
  connectedDevices = [],
  onOpenMobileSync,
}) => {
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  // Mini physics calculator state
  const [calcAltitude, setCalcAltitude] = useState(525);
  const [calcDryMass, setCalcDryMass] = useState(3.4);
  const [calcFuelMass, setCalcFuelMass] = useState(0.25);
  const [calcIsp] = useState(220); // seconds for cold gas or micro-thruster

  // Orbital period: T = 2 * pi * sqrt((R + h)^3 / mu)
  const rEarth = 6371;
  const mu = 398600.4418;
  const a = rEarth + calcAltitude;
  const calculatedPeriodMin = +((2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu)) / 60).toFixed(2);
  const calculatedVelocityKms = +Math.sqrt(mu / a).toFixed(3);

  // Tsiolkovsky deltaV = g0 * Isp * ln(M0 / Mk)
  const g0 = 9.80665;
  const m0 = calcDryMass + calcFuelMass;
  const calculatedDeltaV = Math.round(g0 * calcIsp * Math.log(m0 / calcDryMass));

  // CubeSat qualitative and overall readiness metrics
  const readinessMetrics = computeCubeSatReadiness(team);

  // Sort visible widgets by order
  const activeWidgets = widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Team Header Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-6 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-3xl shadow-inner">
              {team.logo}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Команда «{team.name}»
                </h1>
                <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-500/30">
                  {team.league}
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                  Рейтинг: #{team.rank} (Топ-1)
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                {team.school} • г. {team.city}
              </p>
              <p className="mt-1.5 text-xs text-slate-400 max-w-2xl leading-relaxed">
                {team.description}
              </p>

              {/* Badges */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {team.badges.map((b) => (
                  <span
                    key={b}
                    className="rounded bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700"
                  >
                    🏷️ {b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Mission Progress HUD */}
          <div className="rounded-xl border border-cyan-900/40 bg-slate-950/80 p-4 lg:w-80 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Готовность борта (TRL)</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">
                {readinessMetrics.overallReadinessPercent}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${readinessMetrics.overallReadinessPercent}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-800/80">
              <div>
                <div className="text-[10px] text-slate-500">Суммарный балл</div>
                <div className="font-mono text-base font-bold text-white">
                  {team.totalScore} / 500
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Форм-фактор борта</div>
                <div className="font-mono text-base font-bold text-indigo-300">
                  {team.cubesatSpecs.format} • {team.cubesatSpecs.massKg} кг
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onNavigateTab('certificates')}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/20 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-all cursor-pointer"
                title="Сгенерировать цифровой сертификат допуска к пуску"
              >
                <Award className="h-3.5 w-3.5" />
                <span>Сертификат</span>
              </button>
              <button
                onClick={() => onNavigateTab('reports')}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500/20 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition-all cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Паспорт PDF</span>
              </button>
              <button
                onClick={() => {
                  const chatEl = document.getElementById('team-live-chat-section');
                  if (chatEl) {
                    chatEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all cursor-pointer"
                title="Перейти к лайв-чату команды и связи с ЦУП"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Лайв-чат</span>
              </button>
              <button
                onClick={onOpenMobileSync}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-500/20 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all cursor-pointer"
                title="Мобильная авторизация и синхронизация по QR-коду"
              >
                <QrCode className="h-3.5 w-3.5 text-cyan-400" />
                <span>Моб. QR</span>
              </button>
            </div>

            {/* 3D Assembly Blueprint Action Card with Image Generation Blueprint */}
            <div className="mt-3 rounded-xl border border-cyan-500/30 bg-slate-950/80 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Сборочный чертеж (Image Generation)</span>
                </span>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                  CubeSat {team.cubesatSpecs.format}
                </span>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsBlueprintModalOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsBlueprintModalOpen(true);
                  }
                }}
                className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer h-28"
              >
                <img
                  src={
                    team.cubesatSpecs.format === '1U'
                      ? blueprint1U
                      : team.cubesatSpecs.format === '2U'
                        ? blueprint2U
                        : blueprint3U
                  }
                  alt={`Чертеж CubeSat ${team.cubesatSpecs.format}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-transparent flex items-end p-2 justify-between">
                  <span className="text-[10px] font-mono text-cyan-200">
                    CAD Exploded View • {team.cubesatSpecs.format}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-semibold group-hover:underline">
                    3D взрыв-схема (R3F) ›
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsBlueprintModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 py-2 text-xs font-bold text-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/40 transition-all cursor-pointer shadow-sm group"
                title="Инженерный сборочный чертеж и 3D-схема внутреннего устройства CubeSat"
              >
                <Sparkles className="h-4 w-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>3D-Схема сборки (React Three Fiber)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Space-π Championship Goal Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/40 bg-gradient-to-r from-sky-950/80 via-slate-900 to-cyan-950/60 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-ping" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
                Итоговая цель чемпионата • Space-π (spacepi.space)
              </span>
              <span className="rounded-full bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                Фонд содействия инновациям
              </span>
            </div>
            <h2 className="text-base font-extrabold text-white">
              Подача заявки на разработку полезной нагрузки школьного КубСата 3U
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Все 5 этапов чемпионата формируют готовый паспорт проекта. Соберите ваши расчеты
              баллистики, энергобаланса, сенсоров и радиолинии СОНИКС в официальную заявку для
              запуска спутника на орбиту.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('spacepi')}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-white hover:from-sky-400 hover:to-cyan-400 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <span>Оформить заявку в Space-π</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Embedded Mobile App Sync Widget */}
      <TeamMobileSyncWidget
        team={team}
        connectedDevices={connectedDevices}
        onOpenModal={() => onOpenMobileSync?.()}
      />

      {/* Comprehensive CubeSat Preparation & Launch Readiness Progress Bar */}
      <CubeSatReadinessProgressBar team={team} onNavigateTab={onNavigateTab} />

      {/* Visual Championship Progress Timeline & Average Score Scale */}
      <ChampionshipProgressBar team={team} onNavigateTab={onNavigateTab} />

      {/* Customizable Dashboard Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Индивидуальный командный дашборд</h2>
          <span className="text-xs text-slate-400">({activeWidgets.length} активных модулей)</span>
        </div>
        <button
          onClick={onOpenCustomizer}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-white transition-all shadow-sm"
        >
          <Sliders className="h-3.5 w-3.5 text-cyan-400" />
          <span>Настроить виджеты</span>
        </button>
      </div>

      {/* Render Dynamic Widgets */}
      <div className="space-y-6">
        {activeWidgets.map((widget) => {
          switch (widget.id) {
            case 'telemetry_gauge':
              return (
                <div
                  key={widget.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                      <h3 className="text-sm font-bold text-white">
                        Бортовая телеметрия: {telemetry.satelliteName}
                      </h3>
                    </div>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400 border border-emerald-500/20">
                      Режим: {telemetry.mode} | Пакет #{telemetry.packetsDownlinked}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-center">
                      <div className="text-[10px] text-slate-400">Высота орбиты</div>
                      <div className="font-mono text-base font-bold text-cyan-300 mt-1">
                        {telemetry.altitudeKm} км
                      </div>
                      <div className="text-[9px] text-slate-500">
                        v = {telemetry.velocityKms} км/с
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-center">
                      <div className="text-[10px] text-slate-400">Питание шины</div>
                      <div className="font-mono text-base font-bold text-emerald-300 mt-1">
                        {telemetry.batteryVoltage} В
                      </div>
                      <div className="text-[9px] text-slate-500">
                        SoC: {telemetry.batterySocPercent}%
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-center">
                      <div className="text-[10px] text-slate-400">Генерация СБ</div>
                      <div className="font-mono text-base font-bold text-amber-300 mt-1">
                        {telemetry.solarPowerW} Вт
                      </div>
                      <div className="text-[9px] text-slate-500">{telemetry.solarCurrentMa} мА</div>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-center">
                      <div className="text-[10px] text-slate-400">Темп. батарей СБ</div>
                      <div className="font-mono text-base font-bold text-sky-300 mt-1">
                        {telemetry.solarPanelTempC > 0
                          ? `+${telemetry.solarPanelTempC}`
                          : telemetry.solarPanelTempC}{' '}
                        °C
                      </div>
                      <div className="text-[9px] text-slate-500">
                        АКБ: +{telemetry.batteryTempC} °C
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-center">
                      <div className="text-[10px] text-slate-400">Сигнал маяка RSSI</div>
                      <div className="font-mono text-base font-bold text-purple-300 mt-1">
                        {telemetry.radioRssiDb} дБм
                      </div>
                      <div className="text-[9px] text-slate-500">437.425 МГц</div>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-center">
                      <div className="text-[10px] text-slate-400">Научная нагрузка</div>
                      <div className="font-mono text-xs font-bold text-emerald-400 mt-1.5">
                        {telemetry.payloadStatus}
                      </div>
                      <div className="text-[9px] text-slate-500">SiPM Оптич. фотометр</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs bg-slate-950/60 rounded-lg px-3 py-2 border border-slate-800/50">
                    <span className="font-mono text-slate-400 text-[11px] truncate">
                      AX.25 RAW: <span className="text-cyan-400">{telemetry.rawHex}</span>
                    </span>
                    <button
                      onClick={() => onNavigateTab('telemetry')}
                      className="ml-2 flex items-center gap-1 text-cyan-400 hover:text-cyan-300 shrink-0 font-medium text-xs"
                    >
                      <span>Полный телеметрический HUD</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );

            case 'stage_pipeline':
              return (
                <div
                  key={widget.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-white">
                        Трекер этапов кейс-чемпионата «МИРОВИЗОР»
                      </h3>
                    </div>
                    <button
                      onClick={() => onNavigateTab('submissions')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      Загрузить решение →
                    </button>
                  </div>

                  {/* Horizontal Stage Progression */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                    {CASE_STAGES.map((stage) => {
                      const status = team.stageStatuses[stage.id];
                      const score = team.stageScores[stage.id];
                      const isApproved = status === 'approved';
                      const isSubmitted = status === 'submitted' || status === 'under_review';

                      return (
                        <div
                          key={stage.id}
                          className={`relative rounded-xl border p-3.5 transition-all text-xs flex flex-col justify-between ${
                            isApproved
                              ? 'border-emerald-500/40 bg-emerald-950/15'
                              : isSubmitted
                                ? 'border-cyan-500/40 bg-cyan-950/20'
                                : 'border-slate-800 bg-slate-950/60'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-1.5">
                              <span className="font-mono font-bold text-slate-400">
                                Этап 0{stage.number}
                              </span>
                              {isApproved ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>{score} б.</span>
                                </span>
                              ) : isSubmitted ? (
                                <span className="text-cyan-400 font-medium">На проверке</span>
                              ) : (
                                <span className="text-slate-500">В работе</span>
                              )}
                            </div>
                            <h4 className="font-semibold text-slate-200 line-clamp-2 leading-snug">
                              {stage.title}
                            </h4>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Дедлайн: {stage.deadline.split(',')[0]}</span>
                            <span className="font-mono text-cyan-300">max {stage.maxPoints}б</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );

            case 'power_budget':
              return (
                <div
                  key={widget.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white">
                        Энергобаланс КубСат 3U (Суточная диаграмма)
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Батарея: LiFePO4 48 Вт·ч (DoD: 21.4%)
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                      <div className="flex items-center justify-between font-semibold text-amber-300">
                        <span>Солнечный участок (60 мин)</span>
                        <Sun className="h-4 w-4" />
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Выработка трехкаскадных фотопреобразователей GaAs:{' '}
                        <strong>18.5 Вт пик</strong>. Покрывает зарядку АКБ и работу всех подсистем
                        с запасом 1.62.
                      </p>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-amber-400 w-[95%]" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                      <div className="flex items-center justify-between font-semibold text-indigo-300">
                        <span>Теневой участок (35 мин)</span>
                        <BatteryCharging className="h-4 w-4" />
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Потребление OBC + служебные датчики: <strong>4.2 Вт</strong>. АКБ
                        разряжается лишь на 2.45 Вт·ч, сохраняя 2000+ циклов ресурса в условиях LEO.
                      </p>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-indigo-400 w-[78%]" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                      <div className="flex items-center justify-between font-semibold text-emerald-300">
                        <span>Сеанс связи Downlink (10 мин)</span>
                        <Radio className="h-4 w-4" />
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Пиковое потребление передатчика 1.0 Вт RF: <strong>6.8 Вт суммарно</strong>.
                        Запас радиолинии превышает +9.2 дБ при угле места 10°.
                      </p>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-400 w-[88%]" />
                      </div>
                    </div>
                  </div>
                </div>
              );

            case 'physics_calc':
              return (
                <div
                  key={widget.id}
                  className="rounded-2xl border border-cyan-900/30 bg-slate-900/80 p-5 shadow-xl"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-white">
                        Интерактивный физический калькулятор баллистики
                      </h3>
                    </div>
                    <span className="text-[11px] text-cyan-400 font-mono">
                      3-й закон Кеплера & формула Циолковского
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4 text-xs">
                    {/* Input sliders */}
                    <div className="lg:col-span-2 space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Высота орбиты (h)</span>
                          <span className="font-mono text-cyan-400 font-bold">
                            {calcAltitude} км
                          </span>
                        </div>
                        <input
                          type="range"
                          min="300"
                          max="800"
                          step="5"
                          value={calcAltitude}
                          onChange={(e) => setCalcAltitude(+e.target.value)}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Сухая масса (M_k)</span>
                            <span className="font-mono text-cyan-400 font-bold">
                              {calcDryMass} кг
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="0.1"
                            value={calcDryMass}
                            onChange={(e) => setCalcDryMass(+e.target.value)}
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Запас газа/топлива</span>
                            <span className="font-mono text-cyan-400 font-bold">
                              {calcFuelMass} кг
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.05"
                            max="1.0"
                            step="0.05"
                            value={calcFuelMass}
                            onChange={(e) => setCalcFuelMass(+e.target.value)}
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Calculated live outputs */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center flex flex-col justify-center">
                        <span className="text-[11px] text-slate-400">Период обращения (T)</span>
                        <span className="font-mono text-lg font-bold text-white mt-1">
                          {calculatedPeriodMin} мин
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          15.1 витков/сутки
                        </span>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center flex flex-col justify-center">
                        <span className="text-[11px] text-slate-400">1-я космическая скорость</span>
                        <span className="font-mono text-lg font-bold text-cyan-300 mt-1">
                          {calculatedVelocityKms} км/с
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {Math.round(calculatedVelocityKms * 3600)} км/ч
                        </span>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center flex flex-col justify-center">
                        <span className="text-[11px] text-slate-400">Импульс скорости (ΔV)</span>
                        <span className="font-mono text-lg font-bold text-emerald-400 mt-1">
                          {calculatedDeltaV} м/с
                        </span>
                        <span className="text-[10px] text-slate-500">Достаточно для увода</span>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center flex flex-col justify-center">
                        <span className="text-[11px] text-slate-400">Длительность тени Земли</span>
                        <span className="font-mono text-lg font-bold text-amber-300 mt-1">
                          ~35.4 мин
                        </span>
                        <span className="text-[10px] text-slate-500">37.2% витка</span>
                      </div>
                    </div>
                  </div>
                </div>
              );

            case 'mentor_feed':
              return (
                <div
                  key={widget.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-white">Канал наставника команды</h3>
                    </div>
                    <button
                      onClick={() => onNavigateTab('mentor')}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                    >
                      Открыть диалог →
                    </button>
                  </div>

                  <div className="mt-3 flex items-start gap-3 rounded-xl border border-purple-900/30 bg-purple-950/20 p-3.5 text-xs">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                      ВС
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{team.mentorName}</span>
                        <span className="text-[10px] text-purple-300 bg-purple-500/15 px-1.5 py-0.2 rounded">
                          Научный ментор
                        </span>
                        <span className="text-[10px] text-slate-500">Сегодня, 09:20</span>
                      </div>
                      <p className="mt-1 text-slate-300 leading-relaxed text-[11px]">
                        «Отличные расчеты по 1 и 2 этапам! Обязательно проверьте температурный дрейф
                        лавинного фотодиода SiPM. В тени усилие лавинного пробоя смещается —
                        добавьте термокомпенсацию на ЦАП!»
                      </p>
                    </div>
                  </div>
                </div>
              );

            case 'launch_countdown':
              return (
                <div
                  key={widget.id}
                  className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 p-5 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Окно пуска РН «Союз-2.1б» с попутной нагрузкой
                        </h4>
                        <p className="text-xs text-slate-400">
                          Космодром «Восточный», стартовый комплекс 1С
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <div className="rounded-lg bg-slate-950 px-3 py-1.5 border border-slate-800 text-center">
                        <div className="text-base font-black text-amber-400">38</div>
                        <div className="text-[9px] text-slate-500">ДНЕЙ</div>
                      </div>
                      <span className="text-slate-600">:</span>
                      <div className="rounded-lg bg-slate-950 px-3 py-1.5 border border-slate-800 text-center">
                        <div className="text-base font-black text-amber-400">14</div>
                        <div className="text-[9px] text-slate-500">ЧАСОВ</div>
                      </div>
                      <span className="text-slate-600">:</span>
                      <div className="rounded-lg bg-slate-950 px-3 py-1.5 border border-slate-800 text-center">
                        <div className="text-base font-black text-amber-400">22</div>
                        <div className="text-[9px] text-slate-500">МИНУТЫ</div>
                      </div>
                    </div>
                  </div>
                </div>
              );

            case 'team_live_chat':
              return (
                <div key={widget.id} id="team-live-chat-section">
                  <TeamLiveChat
                    team={team}
                    userRole={userRole}
                    messages={chatMessages}
                    activeChannel={activeChatChannel}
                    onChannelChange={onChatChannelChange}
                    onSendMessage={onSendChatMessage}
                    onAddReaction={onAddChatReaction}
                    onTogglePin={onToggleChatPin}
                    isTyping={isChatTyping}
                  />
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Team Roster Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Экипаж разработки школьного КубСата</h3>
          </div>
          <span className="text-xs text-slate-400">5 участников • Лицей №1</span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {team.members.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-xs"
            >
              <div className="font-bold text-white text-sm">{member.name}</div>
              <div className="text-cyan-400 text-[11px] font-medium mt-0.5">{member.role}</div>
              <div className="text-slate-500 text-[10px] mt-1">{member.grade}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3D Assembly Blueprint Modal */}
      <CubeSatAssemblyBlueprintModal
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
        specs={team.cubesatSpecs}
        teamName={team.name}
      />
    </div>
  );
};
