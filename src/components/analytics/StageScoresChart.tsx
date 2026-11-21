import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Trophy,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { Team, StageId, SubmissionStatus } from '../../types';
import { CASE_STAGES } from '../../data/mockData';

interface StageScoresChartProps {
  team: Team;
  allTeams?: Team[];
  className?: string;
}

export type ChartViewMode = 'cumulative' | 'perStage' | 'comparison';

interface StagePointData {
  stageId: StageId;
  stageNumber: number;
  shortName: string;
  fullName: string;
  deadline: string;
  teamScore: number;
  cumulativeTeamScore: number;
  leagueAvgScore: number;
  cumulativeLeagueAvg: number;
  leaderScore: number;
  cumulativeLeader: number;
  maxScore: number;
  cumulativeMax: number;
  status: SubmissionStatus;
}

const STAGE_SHORT_NAMES: Record<StageId, string> = {
  stage_1: '1. Баллистика',
  stage_2: '2. 3U Энергия',
  stage_3: '3. Полезная нагрузка',
  stage_4: '4. Радиоканал',
  stage_5: '5. Испытания',
};

export const StageScoresChart: React.FC<StageScoresChartProps> = ({
  team,
  allTeams = [],
  className = '',
}) => {
  const [viewMode, setChartViewMode] = useState<ChartViewMode>('cumulative');
  const [hoveredStageId, setHoveredStageId] = useState<StageId | null>(null);

  // Teams from the same league for accurate benchmarking
  const leagueTeams = allTeams.filter((t) => t.league === team.league);
  const effectiveLeagueTeams = leagueTeams.length > 0 ? leagueTeams : [team];

  // Find leader team in the league (highest total score)
  const sortedLeagueTeams = [...effectiveLeagueTeams].sort((a, b) => b.totalScore - a.totalScore);
  const leaderTeam = sortedLeagueTeams[0] || team;

  // Build 5 stages chart dataset
  let runningTeamTotal = 0;
  let runningLeagueTotal = 0;
  let runningLeaderTotal = 0;

  const chartData: StagePointData[] = CASE_STAGES.map((stage) => {
    const stageId = stage.id;
    const stageScore = team.stageScores[stageId] ?? 0;
    runningTeamTotal += stageScore;

    // League average for this stage
    const totalLeagueStageScore = effectiveLeagueTeams.reduce(
      (sum, t) => sum + (t.stageScores[stageId] ?? 0),
      0,
    );
    const avgScore = Math.round(totalLeagueStageScore / effectiveLeagueTeams.length);
    runningLeagueTotal += avgScore;

    // Leader score for this stage
    const leadScore = leaderTeam.stageScores[stageId] ?? 0;
    runningLeaderTotal += leadScore;

    return {
      stageId,
      stageNumber: stage.number,
      shortName: STAGE_SHORT_NAMES[stageId] || `Этап ${stage.number}`,
      fullName: stage.title,
      deadline: stage.deadline,
      teamScore: stageScore,
      cumulativeTeamScore: runningTeamTotal,
      leagueAvgScore: avgScore,
      cumulativeLeagueAvg: runningLeagueTotal,
      leaderScore: leadScore,
      cumulativeLeader: runningLeaderTotal,
      maxScore: stage.maxPoints,
      cumulativeMax: stage.number * 100,
      status: team.stageStatuses[stageId] || 'not_started',
    };
  });

  // KPI Calculations
  const evaluatedStages = chartData.filter((d) => d.teamScore > 0);
  const avgTeamScorePerEvaluated =
    evaluatedStages.length > 0
      ? (evaluatedStages.reduce((sum, d) => sum + d.teamScore, 0) / evaluatedStages.length).toFixed(
          1,
        )
      : '0.0';

  const bestStage = [...chartData].sort((a, b) => b.teamScore - a.teamScore)[0];
  const totalLeagueAvg = chartData[chartData.length - 1]?.cumulativeLeagueAvg || 0;
  const deltaVsAvg = team.totalScore - totalLeagueAvg;

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Зачтено',
          className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: CheckCircle2,
        };
      case 'under_review':
        return {
          label: 'На проверке',
          className: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: Clock,
        };
      case 'submitted':
        return {
          label: 'Сдано жюри',
          className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: Clock,
        };
      case 'needs_revision':
        return {
          label: 'Доработка',
          className: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: AlertCircle,
        };
      case 'draft':
        return {
          label: 'Черновик',
          className: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: Clock,
        };
      default:
        return {
          label: 'Не начат',
          className: 'bg-slate-800 text-slate-400 border-slate-700',
          icon: HelpCircle,
        };
    }
  };

  // Custom Glassmorphic Tooltip for Recharts
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = chartData.find((d) => d.shortName === label);
    if (!dataPoint) return null;

    const badge = getStatusBadge(dataPoint.status);
    const BadgeIcon = badge.icon;

    return (
      <div className="rounded-xl border border-cyan-500/40 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[240px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-bold text-white">{dataPoint.fullName}</span>
          <span
            className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}
          >
            <BadgeIcon className="h-3 w-3" />
            <span>{badge.label}</span>
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>«{team.name}»:</span>
            </span>
            <span className="font-mono font-bold text-cyan-300 text-sm">
              {viewMode === 'cumulative'
                ? `${dataPoint.cumulativeTeamScore} б.`
                : `${dataPoint.teamScore} / 100 б.`}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>Средний по лиге:</span>
            </span>
            <span className="font-mono text-slate-300">
              {viewMode === 'cumulative'
                ? `${dataPoint.cumulativeLeagueAvg} б.`
                : `${dataPoint.leagueAvgScore} б.`}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Лидер лиги («{leaderTeam.name}»):</span>
            </span>
            <span className="font-mono text-emerald-400">
              {viewMode === 'cumulative'
                ? `${dataPoint.cumulativeLeader} б.`
                : `${dataPoint.leaderScore} б.`}
            </span>
          </div>
        </div>

        <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Дедлайн этапа:</span>
          <span className="text-slate-300 font-mono text-[10px]">{dataPoint.deadline}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`rounded-2xl border border-cyan-500/20 bg-slate-900/90 p-5 shadow-2xl space-y-5 ${className}`}
    >
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Динамика рейтинговых баллов по этапам чемпионата</span>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30 font-mono">
                  RECHARTS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Мониторинг набора баллов команды «{team.name}» в сравнении со средним показателем
                лиги и лидером
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            data-testid="btn-view-cumulative"
            onClick={() => setChartViewMode('cumulative')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'cumulative'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Накопительный</span>
          </button>
          <button
            type="button"
            data-testid="btn-view-perStage"
            onClick={() => setChartViewMode('perStage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'perStage'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>По этапам</span>
          </button>
          <button
            type="button"
            data-testid="btn-view-comparison"
            onClick={() => setChartViewMode('comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'comparison'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Сравнение</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Общий рейтинг</span>
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="font-mono text-lg font-bold text-white mt-1">
            {team.totalScore} <span className="text-xs text-slate-500 font-normal">/ 500 б.</span>
          </div>
          <p className="text-[11px] text-amber-400 mt-0.5">
            #{team.rank} в {team.league}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Средний балл / этап</span>
            <Award className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="font-mono text-lg font-bold text-cyan-300 mt-1">
            {avgTeamScorePerEvaluated}{' '}
            <span className="text-xs text-slate-500 font-normal">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Оценено: {evaluatedStages.length} из 5
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Лучший этап</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 mt-1">
            {bestStage?.teamScore || 0}{' '}
            <span className="text-xs text-slate-500 font-normal">б.</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {bestStage?.shortName || '—'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Отрыв от лиги</span>
            <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div
            className={`font-mono text-lg font-bold mt-1 ${
              deltaVsAvg >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {deltaVsAvg >= 0 ? `+${deltaVsAvg}` : deltaVsAvg}{' '}
            <span className="text-xs text-slate-500 font-normal">б.</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Относительно медианы лиги</p>
        </div>
      </div>

      {/* Main Recharts Area Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 pt-6">
        <div className="h-[320px] w-full" data-testid="recharts-stage-container">
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={280}>
            {viewMode === 'cumulative' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 25, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="teamGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="leaderGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  domain={[0, 500]}
                  tickLine={false}
                  tickFormatter={(val) => `${val} б.`}
                />
                <Tooltip content={renderCustomTooltip} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <ReferenceLine
                  y={400}
                  stroke="#eab308"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Гранд-финал (≥400)',
                    fill: '#eab308',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeTeamScore"
                  name={`Команда «${team.name}»`}
                  stroke="#38bdf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#teamGradient)"
                  activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeLeagueAvg"
                  name="Среднее по лиге"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#94a3b8' }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeLeader"
                  name={`Лидер («${leaderTeam.name}»)`}
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#34d399' }}
                />
              </AreaChart>
            ) : viewMode === 'perStage' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 25, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  domain={[0, 100]}
                  tickLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip content={renderCustomTooltip} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <ReferenceLine
                  y={75}
                  stroke="#34d399"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Порог допуска (75 б.)',
                    fill: '#34d399',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
                <Bar
                  dataKey="teamScore"
                  name={`«${team.name}»`}
                  fill="#38bdf8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="leagueAvgScore"
                  name="Средний результат лиги"
                  fill="#475569"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="leaderScore"
                  name={`Лидер («${leaderTeam.name}»)`}
                  fill="#34d399"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 25, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  domain={[0, 500]}
                  tickLine={false}
                  tickFormatter={(val) => `${val} б.`}
                />
                <Tooltip content={renderCustomTooltip} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeTeamScore"
                  name={`«${team.name}»`}
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#38bdf8' }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeLeagueAvg"
                  name="Среднее по лиге"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#94a3b8' }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeLeader"
                  name={`Лидер («${leaderTeam.name}»)`}
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#34d399' }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeMax"
                  name="Максимум (100% зачет)"
                  stroke="#6366f1"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stage Breakdown Cards Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>Поэтапная разбивка и статус решений:</span>
          <span>5 этапов квалификации</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {chartData.map((stage) => {
            const badge = getStatusBadge(stage.status);
            const isHovered = hoveredStageId === stage.stageId;

            return (
              <div
                key={stage.stageId}
                onMouseEnter={() => setHoveredStageId(stage.stageId)}
                onMouseLeave={() => setHoveredStageId(null)}
                className={`rounded-xl border p-3 text-xs transition-all ${
                  isHovered
                    ? 'border-cyan-400 bg-slate-900 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-white">Этап {stage.stageNumber}</span>
                  <span
                    className={`rounded border px-1.5 py-0.2 text-[9px] font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="font-mono text-base font-bold text-cyan-300">
                  {stage.teamScore}{' '}
                  <span className="text-[10px] text-slate-500 font-normal">/ 100 б.</span>
                </div>

                <div className="mt-1 text-[10px] text-slate-400">
                  Накоплено:{' '}
                  <strong className="text-slate-200">{stage.cumulativeTeamScore} б.</strong>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Ср. по лиге:</span>
                  <span className="font-mono text-slate-400">{stage.leagueAvgScore} б.</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
