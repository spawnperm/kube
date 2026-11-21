import React, { useState } from 'react';
import { BarChart3, Users, Activity, Clock, Zap, Radio, Filter } from 'lucide-react';
import { Team, ActivityLog } from '../../types';
import { StageScoresChart } from '../analytics/StageScoresChart';
import { StageSuccessStatsChart } from '../analytics/StageSuccessStatsChart';
import { StageScheduleComparisonTable } from '../analytics/StageScheduleComparisonTable';

interface AnalyticsTabProps {
  team: Team;
  allTeams: Team[];
  activityLogs: ActivityLog[];
  onNavigateTab?: (tab: string) => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  team,
  allTeams = [],
  activityLogs,
  onNavigateTab,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = activityLogs.filter((log) => {
    if (filterType !== 'all' && log.type !== filterType) return false;
    return true;
  });

  // Competency Radar Chart data points (angles in radians, 6 competencies)
  const competencies = [
    { label: 'Орбитальная баллистика', teamVal: 96, avgVal: 78 },
    { label: '3U Компоновка & CAD', teamVal: 92, avgVal: 80 },
    { label: 'Энергобаланс GaAs', teamVal: 94, avgVal: 74 },
    { label: 'Полезная нагрузка SiPM', teamVal: 88, avgVal: 71 },
    { label: 'Радиоканал AX.25', teamVal: 90, avgVal: 65 },
    { label: 'Оформление ГОСТ', teamVal: 86, avgVal: 76 },
  ];

  const radarRadius = 110;
  const radarCenter = 140;

  const getCoordinates = (index: number, total: number, value: number) => {
    const angle = ((Math.PI * 2) / total) * index - Math.PI / 2;
    const r = (value / 100) * radarRadius;
    const x = radarCenter + r * Math.cos(angle);
    const y = radarCenter + r * Math.sin(angle);
    return { x, y };
  };

  const teamRadarPoints = competencies
    .map((c, i) => {
      const { x, y } = getCoordinates(i, competencies.length, c.teamVal);
      return `${x},${y}`;
    })
    .join(' ');

  const avgRadarPoints = competencies
    .map((c, i) => {
      const { x, y } = getCoordinates(i, competencies.length, c.avgVal);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-cyan-500/25 bg-slate-900/90 p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                Аналитика продуктивности и активности
              </h1>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                TEAM VELOCITY & USER METRICS
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              Комплексная оценка вовлеченности команд, скорости решения инженерных кейсов и точности
              физических расчетов.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Индекс продуктивности:</span>
          <strong className="text-cyan-400 font-mono text-sm">94.8 / 100</strong>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>Скорость сдачи этапов</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="font-mono text-2xl font-black text-white">4.2 дня</div>
          <p className="mt-1 text-[11px] text-emerald-400">Впереди среднего по лиге на 2.8 дня</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>Точность мат. моделей</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-black text-white">98.2%</div>
          <p className="mt-1 text-[11px] text-slate-400">Сходимость с данными Роскосмоса</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>Консультаций с ментором</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="font-mono text-2xl font-black text-white">14 сессий</div>
          <p className="mt-1 text-[11px] text-purple-300">100% рекомендаций внедрено</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>Принято телеметрии борта</span>
            <Radio className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-black text-white">48,291 кадр</div>
          <p className="mt-1 text-[11px] text-emerald-400">Потери пакетов (BER) &lt; 0.001%</p>
        </div>
      </div>

      {/* Interactive Stage Schedule & Benchmark Comparison Table */}
      <StageScheduleComparisonTable team={team} allTeams={allTeams} onNavigateTab={onNavigateTab} />

      {/* Statistical Stage Success Charts using Recharts */}
      <StageSuccessStatsChart team={team} allTeams={allTeams} />

      {/* Dynamic Stage Scores Progression Chart using Recharts */}
      <StageScoresChart team={team} allTeams={allTeams} />

      {/* Center Grid: Competency Radar Chart & Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Competencies Radar Chart (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white">Радар компетенций команды («{team.name}»)</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-cyan-300">
                <span className="h-2.5 w-2.5 bg-cyan-400 rounded-sm inline-block" /> «{team.name}»
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="h-2.5 w-2.5 bg-slate-600 rounded-sm inline-block" /> Средний по
                лиге
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center p-2">
            <svg width={280} height={280} className="overflow-visible">
              {/* Radar circular rings */}
              {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => (
                <circle
                  key={i}
                  cx={radarCenter}
                  cy={radarCenter}
                  r={radarRadius * ratio}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
              ))}

              {/* Axes lines */}
              {competencies.map((_, i) => {
                const angle = ((Math.PI * 2) / competencies.length) * i - Math.PI / 2;
                const x2 = radarCenter + radarRadius * Math.cos(angle);
                const y2 = radarCenter + radarRadius * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={radarCenter}
                    y1={radarCenter}
                    x2={x2}
                    y2={y2}
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Tournament average polygon */}
              <polygon
                points={avgRadarPoints}
                fill="rgba(100, 116, 139, 0.15)"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Team polygon */}
              <polygon
                points={teamRadarPoints}
                fill="rgba(56, 189, 248, 0.25)"
                stroke="#38bdf8"
                strokeWidth="2"
              />

              {/* Competency labels */}
              {competencies.map((c, i) => {
                const angle = ((Math.PI * 2) / competencies.length) * i - Math.PI / 2;
                const lx = radarCenter + (radarRadius + 22) * Math.cos(angle);
                const ly = radarCenter + (radarRadius + 18) * Math.sin(angle);
                return (
                  <text
                    key={i}
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="sans-serif"
                  >
                    {c.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Activity Calendar Heatmap & Productivity Velocity (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white">Интенсивность инженерной работы (Heatmap)</span>
            <span className="text-slate-400 text-[11px]">Последние 4 недели</span>
          </div>

          <p className="text-slate-400 text-[11px]">
            Регулярность работы над чертежами, математическими расчетами и отчетами:
          </p>

          {/* Heatmap grid */}
          <div className="grid grid-cols-7 gap-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800">
            {Array.from({ length: 28 }).map((_, i) => {
              // Simulated intensity levels
              const level = (i * 7 + 3) % 5;
              const bgClass =
                level === 4
                  ? 'bg-cyan-400'
                  : level === 3
                    ? 'bg-cyan-500/80'
                    : level === 2
                      ? 'bg-cyan-700/60'
                      : level === 1
                        ? 'bg-cyan-900/40'
                        : 'bg-slate-900';

              return (
                <div
                  key={i}
                  className={`h-7 rounded flex items-center justify-center font-mono text-[9px] text-slate-400 ${bgClass} transition-colors`}
                  title={`День ${i + 1}: ${level * 3 + 1} действий`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Меньше активности</span>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 bg-slate-900 rounded" />
              <span className="h-3 w-3 bg-cyan-900/40 rounded" />
              <span className="h-3 w-3 bg-cyan-700/60 rounded" />
              <span className="h-3 w-3 bg-cyan-500 rounded" />
              <span className="h-3 w-3 bg-cyan-400 rounded" />
            </div>
            <span>Больше активности</span>
          </div>
        </div>
      </div>

      {/* Real-time Activity Logs Stream */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl text-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <h3 className="font-bold text-white">
              Журнал активности пользователей и автоматических служб
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Все события</option>
              <option value="submission">Загрузка решений</option>
              <option value="review">Оценки жюри</option>
              <option value="mentor">Менторские ответы</option>
              <option value="telemetry">Телеметрия</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 transition-colors hover:bg-slate-950"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-2 w-2 rounded-full ${
                    log.type === 'submission'
                      ? 'bg-cyan-400'
                      : log.type === 'review'
                        ? 'bg-emerald-400'
                        : log.type === 'mentor'
                          ? 'bg-purple-400'
                          : 'bg-amber-400'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                      {log.userRole}
                    </span>
                    <span className="font-medium text-cyan-300 text-[11px]">• {log.action}</span>
                  </div>
                  <p className="mt-0.5 text-slate-400 text-[11px]">{log.details}</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
