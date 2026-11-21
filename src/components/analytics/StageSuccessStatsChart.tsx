/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  Target,
  BarChart2,
  PieChart as PieIcon,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Team, StageId } from '../../types';
import { CASE_STAGES } from '../../data/mockData';

export interface StageSuccessStatsChartProps {
  team: Team;
  allTeams?: Team[];
  className?: string;
}

export type SuccessViewMode = 'rateAndTrl' | 'radar' | 'criteriaBreakdown' | 'statusDistribution';

interface StageSuccessMetric {
  stageId: StageId;
  stageNumber: number;
  name: string;
  shortName: string;
  teamScore: number;
  maxScore: number;
  successPercent: number;
  leagueAvgPercent: number;
  trlLevel: number; // Technology Readiness Level 1-9
  simulationAccuracy: number; // % accuracy
  physicsRigor: number; // out of 30
  engineeringSpecs: number; // out of 25
  calculationClarity: number; // out of 25
  presentationQuality: number; // out of 20
  statusText: string;
}

const CRITERIA_COLORS = {
  physics: '#38bdf8', // cyan-400
  engineering: '#818cf8', // indigo-400
  calculations: '#34d399', // emerald-400
  presentation: '#fbbf24', // amber-400
};

export const StageSuccessStatsChart: React.FC<StageSuccessStatsChartProps> = ({
  team,
  allTeams = [],
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<SuccessViewMode>('rateAndTrl');

  const leagueTeams = allTeams.filter((t) => t.league === team.league);
  const effectiveLeagueTeams = leagueTeams.length > 0 ? leagueTeams : [team];

  // Prepare stage success dataset
  const stageMetrics: StageSuccessMetric[] = CASE_STAGES.map((stage) => {
    const stageId = stage.id;
    const teamScore = team.stageScores[stageId] ?? 0;
    const successPercent = Math.min(100, Math.round((teamScore / stage.maxPoints) * 100));

    // Calculate league average percent
    const avgScore =
      effectiveLeagueTeams.reduce((sum, t) => sum + (t.stageScores[stageId] ?? 0), 0) /
      effectiveLeagueTeams.length;
    const leagueAvgPercent = Math.min(100, Math.round((avgScore / stage.maxPoints) * 100));

    // Simulated proportional breakdown based on verified domain scores
    const ratio = stage.maxPoints > 0 ? teamScore / stage.maxPoints : 0;
    const physicsRigor = Math.round(30 * ratio);
    const engineeringSpecs = Math.round(25 * ratio);
    const calculationClarity = Math.round(25 * ratio);
    const presentationQuality = Math.max(
      0,
      teamScore - (physicsRigor + engineeringSpecs + calculationClarity),
    );

    // TRL progression: starts from 3 (concept) up to 7-9 (spaceflight validation)
    const trlLevel = Math.min(
      9,
      Math.round(3 + stage.number * 1.1 + (successPercent > 85 ? 1 : 0)),
    );
    const simulationAccuracy = Math.min(
      99.8,
      +(88 + stage.number * 2.1 + (teamScore > 90 ? 3 : 0)).toFixed(1),
    );

    let statusText = 'Не начат';
    if (successPercent >= 90) statusText = 'Отлично (≥90%)';
    else if (successPercent >= 75) statusText = 'Успешно (≥75%)';
    else if (successPercent > 0) statusText = 'В доработке';

    return {
      stageId,
      stageNumber: stage.number,
      name: stage.title,
      shortName: `Этап ${stage.number}`,
      teamScore,
      maxScore: stage.maxPoints,
      successPercent,
      leagueAvgPercent,
      trlLevel,
      simulationAccuracy,
      physicsRigor,
      engineeringSpecs,
      calculationClarity,
      presentationQuality,
      statusText,
    };
  });

  // Competency Radar Dataset for Recharts
  const radarData = [
    {
      subject: 'Баллистика & Кеплер',
      team: stageMetrics[0]?.successPercent || 92,
      leagueAvg: 76,
      benchmark: 90,
      fullMark: 100,
    },
    {
      subject: 'GaAs Энергобаланс',
      team: stageMetrics[1]?.successPercent || 88,
      leagueAvg: 72,
      benchmark: 85,
      fullMark: 100,
    },
    {
      subject: 'SiPM Нагрузка',
      team: stageMetrics[2]?.successPercent || 84,
      leagueAvg: 70,
      benchmark: 85,
      fullMark: 100,
    },
    {
      subject: 'AX.25 Радиоканал',
      team: stageMetrics[3]?.successPercent || 89,
      leagueAvg: 68,
      benchmark: 90,
      fullMark: 100,
    },
    {
      subject: 'Термовакуум & Вибро',
      team: stageMetrics[4]?.successPercent || 94,
      leagueAvg: 75,
      benchmark: 90,
      fullMark: 100,
    },
    {
      subject: 'ГОСТ & Оформление',
      team: 91,
      leagueAvg: 78,
      benchmark: 88,
      fullMark: 100,
    },
  ];

  // Stage status distribution dataset for PieChart
  const statusCounts = stageMetrics.reduce(
    (acc, m) => {
      if (m.successPercent >= 90) acc.excellent += 1;
      else if (m.successPercent >= 70) acc.passed += 1;
      else if (m.successPercent > 0) acc.inProgress += 1;
      else acc.pending += 1;
      return acc;
    },
    { excellent: 0, passed: 0, inProgress: 0, pending: 0 },
  );

  const pieData = [
    { name: 'Зачтено с отличием (≥90%)', value: statusCounts.excellent, color: '#38bdf8' },
    { name: 'Успешно защищено (70-89%)', value: statusCounts.passed, color: '#34d399' },
    { name: 'В процессе доработки', value: statusCounts.inProgress, color: '#fbbf24' },
    { name: 'Ожидает решения', value: statusCounts.pending, color: '#64748b' },
  ].filter((item) => item.value > 0);

  // Overall calculations
  const totalScored = stageMetrics.reduce((sum, m) => sum + m.teamScore, 0);
  const totalPossible = stageMetrics.reduce((sum, m) => sum + m.maxScore, 0);
  const overallSuccessRate =
    totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : 0;
  const currentTRL = Math.max(...stageMetrics.map((m) => (m.teamScore > 0 ? m.trlLevel : 3)));

  // Custom Recharts Tooltip
  interface TooltipEntry {
    name?: string;
    value?: number | string;
    color?: string;
    stroke?: string;
    fill?: string;
    dataKey?: string;
  }

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="rounded-xl border border-cyan-500/40 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 z-50">
        <div className="font-bold text-white border-b border-slate-800 pb-1.5 flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="font-mono text-cyan-400 text-[10px]">RECHARTS METRICS</span>
        </div>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
                />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {typeof entry.value === 'number'
                  ? entry.dataKey === 'successPercent' || entry.dataKey === 'leagueAvgPercent'
                    ? `${entry.value}%`
                    : entry.dataKey === 'trlLevel'
                      ? `TRL ${entry.value}`
                      : `${entry.value} б.`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`rounded-2xl border border-cyan-500/20 bg-slate-900/90 p-5 shadow-2xl space-y-5 ${className}`}
    >
      {/* Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Статистические графики успешности этапов команды
                </h2>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30 font-mono">
                  RECHARTS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Команда «{team.name}» • Глубокий анализ результативности, TRL и критериев судейства
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            data-testid="btn-mode-rate"
            onClick={() => setViewMode('rateAndTrl')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'rateAndTrl'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Успешность & TRL</span>
          </button>

          <button
            type="button"
            data-testid="btn-mode-radar"
            onClick={() => setViewMode('radar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'radar'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>Радар компетенций</span>
          </button>

          <button
            type="button"
            data-testid="btn-mode-criteria"
            onClick={() => setViewMode('criteriaBreakdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'criteriaBreakdown'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Критерии судейства</span>
          </button>

          <button
            type="button"
            data-testid="btn-mode-status"
            onClick={() => setViewMode('statusDistribution')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'statusDistribution'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieIcon className="h-3.5 w-3.5" />
            <span>Баланс статусов</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Общая успешность</span>
            <Award className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="font-mono text-xl font-extrabold text-cyan-300 mt-1">
            {overallSuccessRate}%
          </div>
          <p className="text-[11px] text-emerald-400 mt-0.5 font-medium">+18% выше порога финала</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Уровень готовности</span>
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="font-mono text-xl font-extrabold text-indigo-300 mt-1">
            TRL {currentTRL} / 9
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Квалификация подсистем</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Сходимость расчетов</span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="font-mono text-xl font-extrabold text-amber-300 mt-1">98.4%</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Мат. верификация моделей</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Зачтено этапов</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="font-mono text-xl font-extrabold text-emerald-400 mt-1">
            {statusCounts.excellent + statusCounts.passed} / 5
          </div>
          <p className="text-[11px] text-emerald-400 mt-0.5 font-medium">Допуск к запуску открыт</p>
        </div>
      </div>

      {/* Main Chart Presentation Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 pt-6">
        {/* VIEW 1: Success Rate (%) and TRL (ComposedChart) */}
        {viewMode === 'rateAndTrl' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs px-2">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span>Динамика коэффициента успешности решений по этапам</span>
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Шкала: 0 - 100% • Порог квалификации: 70%
              </span>
            </div>

            <div className="h-[320px] w-full" data-testid="chart-container-rate">
              <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={280}>
                <ComposedChart
                  data={stageMetrics}
                  margin={{ top: 10, right: 25, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="successBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="areaTrlGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.0} />
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
                    domain={[0, 100]}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                  />
                  <ReferenceLine
                    y={70}
                    stroke="#eab308"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Квалиф. минимум (70%)',
                      fill: '#eab308',
                      fontSize: 10,
                      position: 'insideTopLeft',
                    }}
                  />
                  <Bar
                    dataKey="successPercent"
                    name={`Успешность «${team.name}»`}
                    fill="url(#successBarGrad)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  <Line
                    type="monotone"
                    dataKey="leagueAvgPercent"
                    name="Среднее по лиге"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#94a3b8' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="simulationAccuracy"
                    name="Точность мат. моделирования"
                    stroke="#818cf8"
                    strokeWidth={2}
                    fill="url(#areaTrlGrad)"
                    dot={{ r: 4, fill: '#818cf8' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 2: Radar of Competencies (Recharts RadarChart) */}
        {viewMode === 'radar' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs px-2">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-cyan-400" />
                <span>Радар профильных инженерных компетенций (Recharts Polar Radar)</span>
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Шкала мастерства: 0 - 100%
              </span>
            </div>

            <div className="h-[340px] w-full" data-testid="chart-container-radar">
              <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={280}>
                <RadarChart outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="#475569"
                    fontSize={10}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                  />
                  <Radar
                    name={`«${team.name}»`}
                    dataKey="team"
                    stroke="#38bdf8"
                    fill="#38bdf8"
                    fillOpacity={0.35}
                    strokeWidth={2.5}
                  />
                  <Radar
                    name="Средний по лиге"
                    dataKey="leagueAvg"
                    stroke="#94a3b8"
                    fill="#64748b"
                    fillOpacity={0.15}
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                  />
                  <Radar
                    name="Эталонный норматив"
                    dataKey="benchmark"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 3: Criteria Breakdown (Stacked BarChart) */}
        {viewMode === 'criteriaBreakdown' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs px-2">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <span>Структура баллов по критериям судейской комиссии</span>
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Суммарно до 100 баллов на этап
              </span>
            </div>

            <div className="h-[320px] w-full" data-testid="chart-container-criteria">
              <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={280}>
                <BarChart data={stageMetrics} margin={{ top: 10, right: 25, left: 0, bottom: 20 }}>
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
                    tickFormatter={(val) => `${val} б.`}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                  />
                  <Bar
                    dataKey="physicsRigor"
                    name="Физико-математическая строгость (30 б.)"
                    stackId="criteria"
                    fill={CRITERIA_COLORS.physics}
                  />
                  <Bar
                    dataKey="engineeringSpecs"
                    name="Инженерные 3U стандарты (25 б.)"
                    stackId="criteria"
                    fill={CRITERIA_COLORS.engineering}
                  />
                  <Bar
                    dataKey="calculationClarity"
                    name="Сходимость расчетов (25 б.)"
                    stackId="criteria"
                    fill={CRITERIA_COLORS.calculations}
                  />
                  <Bar
                    dataKey="presentationQuality"
                    name="Защита и оформление (20 б.)"
                    stackId="criteria"
                    fill={CRITERIA_COLORS.presentation}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 4: Status Distribution (PieChart & Metrics) */}
        {viewMode === 'statusDistribution' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs px-2">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-emerald-400" />
                <span>Баланс готовности этапов и статус аттестации</span>
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                5 квалификационных этапов
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-6 h-[300px] w-full" data-testid="chart-container-pie">
                <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={260}>
                  <PieChart>
                    <Tooltip content={renderCustomTooltip} />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#020617"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status details list */}
              <div className="md:col-span-6 space-y-2.5 text-xs pr-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Сводка по этапам чемпионата:</span>
                    <span className="text-cyan-400 font-mono text-[11px]">
                      {overallSuccessRate}% готовности
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {stageMetrics.map((stage) => (
                      <div
                        key={stage.stageId}
                        className="flex items-center justify-between py-1 border-b border-slate-900 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-300">{stage.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            TRL {stage.trlLevel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span
                            className={`font-bold ${
                              stage.successPercent >= 90
                                ? 'text-cyan-300'
                                : stage.successPercent >= 70
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                            }`}
                          >
                            {stage.teamScore} / {stage.maxScore} б.
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({stage.successPercent}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage Cards Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
        {stageMetrics.map((stage) => (
          <div
            key={stage.stageId}
            className={`p-3 rounded-xl border transition-all text-xs ${
              stage.successPercent >= 90
                ? 'border-cyan-500/30 bg-cyan-950/20'
                : stage.successPercent >= 70
                  ? 'border-emerald-500/30 bg-emerald-950/20'
                  : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {stage.shortName}
              </span>
              <span
                className={`text-[10px] font-bold font-mono ${
                  stage.successPercent >= 90 ? 'text-cyan-300' : 'text-emerald-400'
                }`}
              >
                {stage.successPercent}%
              </span>
            </div>

            <div className="mt-1 font-bold text-white text-xs truncate" title={stage.name}>
              {stage.name}
            </div>

            <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  stage.successPercent >= 90
                    ? 'bg-cyan-400'
                    : stage.successPercent >= 70
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                }`}
                style={{ width: `${stage.successPercent}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>TRL {stage.trlLevel}</span>
              <span className="text-slate-300 font-semibold">{stage.teamScore} б.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
