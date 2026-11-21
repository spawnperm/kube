import React from 'react';
import {
  Rocket,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Cpu,
  Radio,
  Compass,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import { Team } from '../types';
import { CASE_STAGES } from '../data/mockData';
import { computeCubeSatReadiness, QualitativeReadinessMetrics } from '../domain/scoring';

interface CubeSatReadinessProgressBarProps {
  team: Team;
  onNavigateTab?: (tab: string) => void;
}

export const CubeSatReadinessProgressBar: React.FC<CubeSatReadinessProgressBarProps> = ({
  team,
  onNavigateTab,
}) => {
  const metrics: QualitativeReadinessMetrics = computeCubeSatReadiness(team);

  const getStatusColor = (percent: number) => {
    if (percent >= 85) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    if (percent >= 60) return 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30';
    if (percent >= 35) return 'text-amber-300 bg-amber-500/15 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
  };

  const getProgressGradient = (percent: number) => {
    if (percent >= 85) return 'from-cyan-500 via-sky-400 to-emerald-400';
    if (percent >= 60) return 'from-indigo-500 via-cyan-400 to-sky-400';
    if (percent >= 35) return 'from-amber-500 via-orange-400 to-yellow-400';
    return 'from-rose-500 to-amber-500';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-5 shadow-2xl backdrop-blur-xl">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Header with Title and Overall Preparation Index */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25">
            <Rocket className="h-5 w-5 fill-slate-950 stroke-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-wide text-white">
                ИНТЕГРАЛЬНАЯ ГОТОВНОСТЬ КУБСАТА К ЗАПУСКУ
              </h3>
              <span className="rounded bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                TRL / FLIGHT READINESS
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Суммирующий прогресс прохождения квалификационных этапов и верификации качественных
              бортовых систем.
            </p>
          </div>
        </div>

        {/* Global Readiness Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Индекс подготовки борта
            </div>
            <div className="flex items-baseline justify-end gap-1">
              <span className="font-mono text-2xl font-black text-cyan-300">
                {metrics.overallReadinessPercent}%
              </span>
              <span className="text-[11px] text-slate-400 font-mono">/ 100%</span>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm ${getStatusColor(
              metrics.overallReadinessPercent,
            )}`}
          >
            {metrics.readinessStatus === 'certified_for_launch' ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ) : metrics.readinessStatus === 'pre_launch' ? (
              <Sparkles className="h-4 w-4 text-cyan-400" />
            ) : (
              <Clock className="h-4 w-4 text-amber-400" />
            )}
            <span className="truncate max-w-[200px]">{metrics.readinessStatusText}</span>
          </div>
        </div>
      </div>

      {/* Main Aggregated Progress Bar */}
      <div className="relative z-10 mt-5">
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Общий суммарный прогресс подготовки систем борта</span>
          </span>
          <span className="font-mono text-cyan-300 font-bold">
            {metrics.overallReadinessPercent}% готово
          </span>
        </div>

        {/* Multi-layered Animated Track */}
        <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800 p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(
              metrics.overallReadinessPercent,
            )} transition-all duration-700 shadow-md shadow-cyan-500/20`}
            style={{ width: `${Math.max(4, metrics.overallReadinessPercent)}%` }}
          />
        </div>
      </div>

      {/* Segmented Stages Progress Bar */}
      <div className="relative z-10 mt-5 pt-4 border-t border-slate-850">
        <div className="text-xs font-bold text-slate-200 mb-2.5 flex items-center justify-between">
          <span>
            Суммарный прогресс по квалификационным этапам ({team.launchReadinessPercent}% одобрено):
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            Кликните на этап для перехода к загрузке решения
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {CASE_STAGES.map((st) => {
            const status = team.stageStatuses[st.id];
            const score = team.stageScores[st.id] || 0;
            const isApproved = status === 'approved';
            const isPending = status === 'submitted' || status === 'under_review';
            const isRevision = status === 'needs_revision';

            let segColor = 'bg-slate-800 text-slate-400 border-slate-700';
            let segFill = '0%';
            let segTitle = 'Не начат';

            if (isApproved) {
              segColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              segFill = '100%';
              segTitle = `Одобрен (${score} б.)`;
            } else if (isPending) {
              segColor = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
              segFill = '50%';
              segTitle = 'На проверке жюри';
            } else if (isRevision) {
              segColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
              segFill = '25%';
              segTitle = 'Требует доработки';
            } else if (status === 'draft') {
              segColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              segFill = '20%';
              segTitle = 'Черновик';
            }

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('submissions')}
                className={`flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all hover:scale-[1.02] cursor-pointer ${segColor}`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>Этап 0{st.number}</span>
                    {isApproved ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : isPending ? (
                      <Clock className="h-3.5 w-3.5 text-sky-400 shrink-0 animate-spin" />
                    ) : isRevision ? (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    ) : null}
                  </div>
                  <div className="text-[10px] font-medium text-slate-300 truncate mt-0.5">
                    {st.title}
                  </div>
                </div>

                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isApproved
                          ? 'bg-emerald-400'
                          : isPending
                            ? 'bg-sky-400'
                            : isRevision
                              ? 'bg-rose-400'
                              : 'bg-slate-700'
                      }`}
                      style={{ width: segFill }}
                    />
                  </div>
                  <div className="mt-1 text-[9px] font-mono text-slate-400 flex items-center justify-between">
                    <span>{segTitle}</span>
                    {isApproved && <span className="font-bold text-emerald-300">{score} б.</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Qualitative Technical Indicators Grid */}
      <div className="relative z-10 mt-5 pt-4 border-t border-slate-850">
        <div className="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span>Качественные показатели бортовых систем КубСата:</span>
          </span>
          <span className="text-[10px] text-slate-400">
            Оцениваются по критериям жюри и параметрам спецификации
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Physics & Ballistics */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-medium">
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
                Баллистика и орбита
              </span>
              <span className="font-mono font-bold text-cyan-300 text-xs">
                {metrics.physicsAccuracyScore}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-850 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{ width: `${metrics.physicsAccuracyScore}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
              <span>Высота: {team.cubesatSpecs.orbitAltitudeKm} км</span>
              <span>Наклон: {team.cubesatSpecs.inclinationDeg}°</span>
            </div>
          </div>

          {/* 2. Construction & Mass */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-medium">
                <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                Конструкция и масса
              </span>
              <span className="font-mono font-bold text-emerald-300 text-xs">
                {metrics.engineeringScore}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-850 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${metrics.engineeringScore}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
              <span>Формат: {team.cubesatSpecs.format}</span>
              <span>Масса: {team.cubesatSpecs.massKg} кг</span>
            </div>
          </div>

          {/* 3. Avionics & RF Link */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-medium">
                <Radio className="h-3.5 w-3.5 text-purple-400" />
                Радиоканал и питание
              </span>
              <span className="font-mono font-bold text-purple-300 text-xs">
                {metrics.avionicsRadioScore}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-850 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-400"
                style={{ width: `${metrics.avionicsRadioScore}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
              <span>Питание: {team.cubesatSpecs.powerBudgetWatts} Вт</span>
              <span>Частота: {team.cubesatSpecs.radioFreqMhz} МГц</span>
            </div>
          </div>

          {/* 4. Scientific Mission */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-medium">
                <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
                Научная программа ПН
              </span>
              <span className="font-mono font-bold text-amber-300 text-xs">
                {metrics.scientificScore}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-850 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${metrics.scientificScore}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] text-slate-400 truncate">
              ПН: {team.cubesatSpecs.payloadType || 'Научный эксперимент'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
