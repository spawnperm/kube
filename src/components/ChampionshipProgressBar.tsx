import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  Radio,
  TrendingUp,
  Rocket,
  Calendar,
  BarChart2,
  GitCommit,
  Sparkles,
} from 'lucide-react';
import { Team, StageId } from '../types';
import { CASE_STAGES } from '../data/mockData';

interface StageSchedule {
  id: StageId;
  startDate: string;
  endDate: string;
  startDayOffset: number; // дни от 10 мая (день 0)
  durationDays: number;
  weightPercent: number;
}

const STAGE_SCHEDULES: Record<StageId, StageSchedule> = {
  stage_1: {
    id: 'stage_1',
    startDate: '10 мая',
    endDate: '24 мая',
    startDayOffset: 0,
    durationDays: 15,
    weightPercent: 20,
  },
  stage_2: {
    id: 'stage_2',
    startDate: '25 мая',
    endDate: '02 июня',
    startDayOffset: 15,
    durationDays: 9,
    weightPercent: 20,
  },
  stage_3: {
    id: 'stage_3',
    startDate: '03 июня',
    endDate: '12 июня',
    startDayOffset: 24,
    durationDays: 10,
    weightPercent: 20,
  },
  stage_4: {
    id: 'stage_4',
    startDate: '13 июня',
    endDate: '20 июня',
    startDayOffset: 34,
    durationDays: 8,
    weightPercent: 20,
  },
  stage_5: {
    id: 'stage_5',
    startDate: '21 июня',
    endDate: '28 июня',
    startDayOffset: 42,
    durationDays: 8,
    weightPercent: 20,
  },
};

const TOTAL_SCHEDULE_DAYS = 50; // с 10 мая по 28 июня + финал
const CURRENT_SIMULATED_DAY_OFFSET = 29; // Текущий момент: ~8 июня (середина Этапа 3)

interface ChampionshipProgressBarProps {
  team: Team;
  onNavigateTab: (tab: string) => void;
}

export const ChampionshipProgressBar: React.FC<ChampionshipProgressBarProps> = ({
  team,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<'gantt' | 'stepper' | 'burndown'>('gantt');

  // Calculate completed stages and average score
  const completedStages = CASE_STAGES.filter((s) => team.stageStatuses[s.id] === 'approved');
  const evaluatedScores = CASE_STAGES.map((s) => team.stageScores[s.id] || 0).filter(
    (sc) => sc > 0,
  );

  const averageScore =
    evaluatedScores.length > 0
      ? (evaluatedScores.reduce((a, b) => a + b, 0) / evaluatedScores.length).toFixed(1)
      : '0.0';

  // Determine current active stage (first non-approved stage or the last submitted)
  let currentStageIndex = CASE_STAGES.findIndex((s) => team.stageStatuses[s.id] !== 'approved');
  if (currentStageIndex === -1) currentStageIndex = CASE_STAGES.length - 1;
  const currentStage = CASE_STAGES[currentStageIndex];
  const currentStatus = team.stageStatuses[currentStage.id];

  const overallProgressPercent = Math.round((completedStages.length / CASE_STAGES.length) * 100);

  // Status mapping helper
  const getStatusInfo = (stageId: StageId) => {
    const status = team.stageStatuses[stageId];
    const score = team.stageScores[stageId] || 0;
    switch (status) {
      case 'approved':
        return {
          label: `Принято (${score} б.)`,
          shortLabel: 'Одобрено',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/40',
          bgColor: 'bg-emerald-950/30',
          progressPercent: 100,
        };
      case 'under_review':
        return {
          label: 'На проверке жюри',
          shortLabel: 'Проверка',
          color: 'bg-amber-400',
          textColor: 'text-amber-300',
          borderColor: 'border-amber-500/40',
          bgColor: 'bg-amber-950/30',
          progressPercent: 80,
        };
      case 'submitted':
        return {
          label: 'Решение отправлено',
          shortLabel: 'Отправлено',
          color: 'bg-sky-400',
          textColor: 'text-sky-300',
          borderColor: 'border-sky-500/40',
          bgColor: 'bg-sky-950/30',
          progressPercent: 65,
        };
      case 'needs_revision':
        return {
          label: 'Требуется доработка',
          shortLabel: 'Доработка',
          color: 'bg-rose-500',
          textColor: 'text-rose-400',
          borderColor: 'border-rose-500/40',
          bgColor: 'bg-rose-950/30',
          progressPercent: 40,
        };
      case 'draft':
        return {
          label: 'В разработке (черновик)',
          shortLabel: 'Черновик',
          color: 'bg-cyan-500',
          textColor: 'text-cyan-300',
          borderColor: 'border-cyan-500/40',
          bgColor: 'bg-cyan-950/30',
          progressPercent: 35,
        };
      default:
        return {
          label: 'Не начато',
          shortLabel: 'В очереди',
          color: 'bg-slate-700',
          textColor: 'text-slate-400',
          borderColor: 'border-slate-800',
          bgColor: 'bg-slate-900/40',
          progressPercent: 0,
        };
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-2xl backdrop-blur-xl space-y-5">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 h-32 w-64 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 h-32 w-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      {/* Header with Title & View Mode Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <Rocket className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-wide text-white">
                ИНДИКАТОР ПРОГРЕССА И ДЕДЛАЙНОВ
              </h2>
              <span className="rounded bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                ДИАГРАММА ГАНТА
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Выполнение 5 этапов чемпионата относительно дедлайнов • Пройдено{' '}
              <strong className="text-white font-mono">
                {completedStages.length} из {CASE_STAGES.length} этапов
              </strong>{' '}
              ({overallProgressPercent}%) • Финал: Запуск КубСата Space-π
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                viewMode === 'gantt'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Диаграмма Ганта</span>
            </button>
            <button
              onClick={() => setViewMode('stepper')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                viewMode === 'stepper'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitCommit className="h-3.5 w-3.5" />
              <span>Этапы спринта</span>
            </button>
            <button
              onClick={() => setViewMode('burndown')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                viewMode === 'burndown'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Баллы (Score)</span>
            </button>
          </div>

          {/* Quick Average Score */}
          <div className="hidden xl:flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 shadow-sm">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 leading-tight">Ср. балл</div>
              <div className="font-mono font-bold text-emerald-300 text-xs">
                {averageScore} / 100
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. GANTT CHART VIEW                                                   */}
      {/* ===================================================================== */}
      {viewMode === 'gantt' && (
        <div className="space-y-4">
          {/* Timeline Header & Scale Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-semibold text-slate-200">
                  Календарная шкала чемпионата (Май — Июнь 2026)
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-slate-700">
                  Текущий день: 8 июня (Спринт Этапа 03)
                </span>
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  Принято жюри
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                  На экспертизе
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400" />В разработке
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-sm bg-slate-700" />
                  Ожидает
                </span>
              </div>
            </div>

            {/* Calendar Months & Decades Ruler */}
            <div className="relative pt-2 pb-1 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
              <div className="grid grid-cols-5 text-center border-b border-slate-800/80 pb-1 font-bold text-slate-300">
                <div>10 — 20 мая</div>
                <div>21 — 31 мая</div>
                <div>01 — 10 июня</div>
                <div>11 — 20 июня</div>
                <div>21 — 28 июня</div>
              </div>
              <div className="grid grid-cols-5 text-center pt-1 text-[9px] text-slate-500">
                <div>Май (I декада)</div>
                <div>Май (II декада)</div>
                <div>Июнь (I декада)</div>
                <div>Июнь (II декада)</div>
                <div>Июнь (Финал)</div>
              </div>

              {/* Simulated "TODAY" Vertical Marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 via-sky-300 to-indigo-500 shadow-lg shadow-cyan-400/50 z-20 pointer-events-none"
                style={{
                  left: `${(CURRENT_SIMULATED_DAY_OFFSET / TOTAL_SCHEDULE_DAYS) * 100}%`,
                }}
              >
                <div className="absolute -top-3.5 -translate-x-1/2 rounded bg-cyan-400 px-1.5 py-0.2 text-[9px] font-black font-sans text-slate-950 uppercase shadow">
                  СЕГОДНЯ
                </div>
              </div>
            </div>
          </div>

          {/* Gantt Rows for each Stage */}
          <div className="space-y-3">
            {CASE_STAGES.map((stage) => {
              const schedule = STAGE_SCHEDULES[stage.id];
              const statusInfo = getStatusInfo(stage.id);
              const score = team.stageScores[stage.id] || 0;
              const isCurrent = stage.id === currentStage.id;

              // Bar positioning calculations
              const leftPercent = (schedule.startDayOffset / TOTAL_SCHEDULE_DAYS) * 100;
              const widthPercent = (schedule.durationDays / TOTAL_SCHEDULE_DAYS) * 100;

              return (
                <div
                  key={stage.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigateTab('submissions')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNavigateTab('submissions');
                    }
                  }}
                  className={`group relative rounded-xl border p-3 transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-cyan-400/80 bg-slate-900/90 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-2.5">
                    {/* Stage Title and Number */}
                    <div className="flex items-center gap-2.5 min-w-[320px]">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs font-bold ${
                          statusInfo.color === 'bg-emerald-500'
                            ? 'bg-emerald-500 text-slate-950'
                            : isCurrent
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        0{stage.number}
                      </span>
                      <h4 className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {stage.title}
                      </h4>
                    </div>

                    {/* Timeline date metadata & score */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>
                          {schedule.startDate} — {schedule.endDate}
                        </span>
                        <span className="text-slate-600">({schedule.durationDays} дн.)</span>
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}
                      >
                        {statusInfo.label}
                      </span>

                      {score > 0 && (
                        <span className="font-mono font-bold text-xs text-emerald-400">
                          {score} / 100 б.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Gantt Bar Track */}
                  <div className="relative h-6 w-full rounded-lg bg-slate-900/90 overflow-hidden border border-slate-800/80">
                    {/* Grid vertical markers */}
                    <div className="absolute inset-0 grid grid-cols-5 pointer-events-none">
                      <div className="border-r border-slate-800/40 h-full" />
                      <div className="border-r border-slate-800/40 h-full" />
                      <div className="border-r border-slate-800/40 h-full" />
                      <div className="border-r border-slate-800/40 h-full" />
                    </div>

                    {/* Today indicator on bar */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-cyan-400/40 z-10 pointer-events-none"
                      style={{
                        left: `${(CURRENT_SIMULATED_DAY_OFFSET / TOTAL_SCHEDULE_DAYS) * 100}%`,
                      }}
                    />

                    {/* Gantt Bar Segment */}
                    <div
                      className="absolute top-1 bottom-1 rounded-md transition-all duration-500 overflow-hidden flex items-center shadow-md"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    >
                      {/* Background bar filling with status gradient */}
                      <div
                        className={`absolute inset-0 ${
                          statusInfo.color === 'bg-emerald-500'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                            : statusInfo.color === 'bg-amber-400'
                              ? 'bg-gradient-to-r from-amber-600 to-amber-500'
                              : statusInfo.color === 'bg-cyan-500'
                                ? 'bg-gradient-to-r from-cyan-600 to-sky-500 animate-pulse'
                                : 'bg-slate-800'
                        }`}
                      />

                      {/* Internal Progress fill */}
                      <div
                        className="absolute inset-y-0 left-0 bg-white/20"
                        style={{ width: `${statusInfo.progressPercent}%` }}
                      />

                      {/* Bar label text */}
                      <div className="relative z-10 px-2 flex items-center justify-between w-full text-[10px] font-bold text-white tracking-wide truncate">
                        <span>Дедлайн: {schedule.endDate}</span>
                        <span className="font-mono text-[9px] opacity-90">
                          {statusInfo.progressPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Space-pi Grand Final Milestone Bar */}
          <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/80 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="h-4 w-4 text-amber-300" />
              </div>
              <div>
                <div className="text-white font-bold flex items-center gap-2">
                  <span>Финал: Подача заявки в созвездие Space-π (spacepi.space)</span>
                  <span className="rounded bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.2 text-[10px] font-mono text-indigo-300">
                    29 июня — 05 июля 2026
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Оформление 5 этапов в проектную заявку на реальный запуск КубСата 3U при поддержке
                  Фонда содействия инновациям.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('spacepi')}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 font-bold text-white transition-all shrink-0 text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <span>Раздел Space-π</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. STEPPER VIEW (TRADITIONAL CARDS TIMELINE)                         */}
      {/* ===================================================================== */}
      {viewMode === 'stepper' && (
        <div className="my-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {CASE_STAGES.map((stage, idx) => {
              const status = team.stageStatuses[stage.id];
              const score = team.stageScores[stage.id] || 0;
              const isApproved = status === 'approved';
              const isCurrent = idx === currentStageIndex;
              const isSubmitted = status === 'submitted' || status === 'under_review';
              const isRevision = status === 'needs_revision';
              const schedule = STAGE_SCHEDULES[stage.id];

              return (
                <div
                  key={stage.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigateTab('submissions')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNavigateTab('submissions');
                    }
                  }}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                    isApproved
                      ? 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400 hover:bg-emerald-950/30'
                      : isCurrent
                        ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/15 hover:border-cyan-300'
                        : isSubmitted
                          ? 'border-sky-500/40 bg-sky-950/20 hover:border-sky-400'
                          : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold transition-transform group-hover:scale-105 ${
                          isApproved
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                            : isCurrent
                              ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 shadow-md shadow-cyan-500/30'
                              : isSubmitted
                                ? 'bg-sky-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                        ) : (
                          <span>0{stage.number}</span>
                        )}
                      </div>

                      {isApproved ? (
                        <div className="flex items-center gap-1 font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-xs">
                          <Award className="h-3 w-3" />
                          <span>{score} б.</span>
                        </div>
                      ) : isCurrent ? (
                        <span className="flex items-center gap-1 font-semibold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30 text-[10px] animate-pulse">
                          <span>В работе</span>
                        </span>
                      ) : isSubmitted ? (
                        <span className="text-[10px] text-sky-400 font-medium bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                          На оценке
                        </span>
                      ) : isRevision ? (
                        <span className="text-[10px] text-rose-400 font-medium bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                          Доработка
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {schedule.startDate}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-white line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
                      {stage.title}
                    </h4>

                    <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {stage.subtitle}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3 w-3 text-cyan-400" />
                      <span>Дедлайн: {schedule.endDate}</span>
                    </span>
                    <span className="text-slate-400 group-hover:text-cyan-300 transition-colors">
                      max {stage.maxPoints} б.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. BURNDOWN & SCORE BREAKDOWN VIEW                                    */}
      {/* ===================================================================== */}
      {viewMode === 'burndown' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
              <div className="text-xs text-slate-400">Суммарный балл команды</div>
              <div className="mt-1 font-mono text-2xl font-black text-cyan-300">
                {team.totalScore} <span className="text-sm text-slate-500">/ 500</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Текущий рейтинг: #{team.rank} в Лиге
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
              <div className="text-xs text-slate-400">Успеваемость по дедлайнам</div>
              <div className="mt-1 font-mono text-2xl font-black text-emerald-400">100% в срок</div>
              <div className="mt-2 text-[11px] text-emerald-300/80">
                Этапы 1 и 2 сданы без штрафов
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
              <div className="text-xs text-slate-400">Оставшийся потенциал баллов</div>
              <div className="mt-1 font-mono text-2xl font-black text-amber-300">+224 балла</div>
              <div className="mt-2 text-[11px] text-slate-400">Этапы 3, 4 и 5 на оценке</div>
            </div>
          </div>

          {/* Stage breakdown bars */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-300 mb-2">
              Распределение баллов по этапам:
            </div>
            {CASE_STAGES.map((s) => {
              const sc = team.stageScores[s.id] || 0;
              const status = team.stageStatuses[s.id];
              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      Этап 0{s.number}: {s.title}
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {sc > 0 ? `${sc} б.` : status === 'submitted' ? 'На оценке' : '0 б.'}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sc >= 90
                          ? 'bg-emerald-400'
                          : sc > 0
                            ? 'bg-cyan-400'
                            : status === 'submitted'
                              ? 'bg-amber-400'
                              : 'bg-slate-700'
                      }`}
                      style={{ width: `${Math.max(sc, status === 'submitted' ? 50 : 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Sprint Focus Strip */}
      <div className="rounded-xl border border-cyan-900/40 bg-slate-950/80 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="text-white font-semibold flex items-center gap-2">
              <span>
                Текущий спринт:{' '}
                <strong>
                  Этап 0{currentStage.number} — {currentStage.title}
                </strong>
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.2 rounded font-mono">
                Дедлайн: {currentStage.deadline}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {currentStage.subtitle} • Статус:{' '}
              {currentStatus === 'approved' ? 'Принято жюри' : 'В работе'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('submissions')}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-1.5 font-bold text-slate-950 hover:bg-cyan-400 transition-all shrink-0 shadow-md shadow-cyan-500/20 text-xs cursor-pointer"
        >
          <span>Загрузить решение этапа</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
