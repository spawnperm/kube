import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Filter,
  Download,
  Zap,
  Sliders,
  Sparkles,
  Award,
} from 'lucide-react';
import { Team, StageId } from '../../types';
import { CASE_STAGES } from '../../data/mockData';

interface StageScheduleBenchmark {
  id: StageId;
  stageNumber: number;
  title: string;
  recommendedStartDate: string;
  recommendedDeadline: string;
  durationDays: number;
  plannedProgressPercent: number; // Плановый прогресс на текущую контрольную дату (8 июня)
  plannedStatusLabel: string;
  deliverableFocus: string;
  keyMetricName: string;
  targetMetricValue: string;
}

const STAGE_BENCHMARKS: StageScheduleBenchmark[] = [
  {
    id: 'stage_1',
    stageNumber: 1,
    title: 'Орбитальная баллистика и параметры выведения',
    recommendedStartDate: '10 мая 2026',
    recommendedDeadline: '24 мая 2026',
    durationDays: 15,
    plannedProgressPercent: 100,
    plannedStatusLabel: 'Завершено (100%)',
    deliverableFocus: 'Расчет ССО h=500-550 км, характеристический импульс ΔV, срок существования',
    keyMetricName: 'Импульс ΔV',
    targetMetricValue: '145 м/с',
  },
  {
    id: 'stage_2',
    stageNumber: 2,
    title: 'Архитектура КубСат 3U и энергобаланс',
    recommendedStartDate: '25 мая 2026',
    recommendedDeadline: '02 июня 2026',
    durationDays: 9,
    plannedProgressPercent: 100,
    plannedStatusLabel: 'Завершено (100%)',
    deliverableFocus: '3D-компоновка, суточный энергобаланс фотопреобразователей, тепловой режим',
    keyMetricName: 'Генерация GaAs',
    targetMetricValue: '18.5 Вт',
  },
  {
    id: 'stage_3',
    stageNumber: 3,
    title: 'Полезная нагрузка и научный эксперимент',
    recommendedStartDate: '03 июня 2026',
    recommendedDeadline: '12 июня 2026',
    durationDays: 10,
    plannedProgressPercent: 60,
    plannedStatusLabel: 'В активном спринте (60%)',
    deliverableFocus: 'Сенсорный SiPM модуль, оптика, шина I2C, фильтрация научных данных',
    keyMetricName: 'Объем сырых данных',
    targetMetricValue: '1.2 МБ/виток',
  },
  {
    id: 'stage_4',
    stageNumber: 4,
    title: 'Бортовая радиолиния и прием телеметрии',
    recommendedStartDate: '13 июня 2026',
    recommendedDeadline: '20 июня 2026',
    durationDays: 8,
    plannedProgressPercent: 15,
    plannedStatusLabel: 'Предварительная подготовка (15%)',
    deliverableFocus: 'Link Budget радиоканала 437 МГц, открытый протокол сети СОНИКС, маяк AX.25',
    keyMetricName: 'Запас Link Margin',
    targetMetricValue: '≥ 6.0 дБ',
  },
  {
    id: 'stage_5',
    stageNumber: 5,
    title: 'Предстартовые испытания и Mission Control',
    recommendedStartDate: '21 июня 2026',
    recommendedDeadline: '28 июня 2026',
    durationDays: 8,
    plannedProgressPercent: 0,
    plannedStatusLabel: 'В очереди (0%)',
    deliverableFocus:
      'Программа ТВИ, циклограмма LEOP (первые 90 мин), парирование нештатных ситуаций',
    keyMetricName: 'Частота резонанса',
    targetMetricValue: '≥ 50 Гц',
  },
];

interface StageScheduleComparisonTableProps {
  team: Team;
  allTeams?: Team[];
  onNavigateTab?: (tab: string) => void;
}

export const StageScheduleComparisonTable: React.FC<StageScheduleComparisonTableProps> = ({
  team,
  allTeams = [],
  onNavigateTab,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(team.id);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'active' | 'future'>(
    'all',
  );
  const [paceScenario, setPaceScenario] = useState<'current' | 'accelerated' | 'intensive'>(
    'current',
  );

  // Currently evaluated team
  const currentEvaluatedTeam = useMemo(() => {
    if (selectedTeamId === team.id) return team;
    const found = allTeams.find((t) => t.id === selectedTeamId);
    return found || team;
  }, [selectedTeamId, team, allTeams]);

  // Comparison metrics calculation per stage
  const comparisonRows = useMemo(() => {
    return STAGE_BENCHMARKS.map((benchmark) => {
      const stageInfo = CASE_STAGES.find((s) => s.id === benchmark.id);
      const status = currentEvaluatedTeam.stageStatuses[benchmark.id] || 'not_started';
      const score = currentEvaluatedTeam.stageScores[benchmark.id] || 0;

      // Actual progress percent calculation
      let actualProgressPercent = 0;
      switch (status) {
        case 'approved':
          actualProgressPercent = 100;
          break;
        case 'under_review':
          actualProgressPercent = 85;
          break;
        case 'submitted':
          actualProgressPercent = 75;
          break;
        case 'needs_revision':
          actualProgressPercent = 50;
          break;
        case 'draft':
          actualProgressPercent = 35;
          break;
        default:
          actualProgressPercent = 0;
      }

      // Modify by pace scenario if simulated
      if (
        paceScenario === 'accelerated' &&
        actualProgressPercent < 100 &&
        actualProgressPercent > 0
      ) {
        actualProgressPercent = Math.min(100, actualProgressPercent + 15);
      } else if (
        paceScenario === 'intensive' &&
        actualProgressPercent < 100 &&
        actualProgressPercent > 0
      ) {
        actualProgressPercent = Math.min(100, actualProgressPercent + 25);
      }

      const progressVariance = actualProgressPercent - benchmark.plannedProgressPercent;

      // Determine schedule delta classification
      let scheduleStatus: 'ahead' | 'on_track' | 'behind' | 'completed_ontime';
      let scheduleDeltaText = '';

      if (status === 'approved') {
        scheduleStatus = 'completed_ontime';
        scheduleDeltaText = 'Сдано в срок (100%)';
      } else if (progressVariance > 15) {
        scheduleStatus = 'ahead';
        scheduleDeltaText = `Опережение (+${Math.round(progressVariance / 10)} дн.)`;
      } else if (progressVariance >= -10) {
        scheduleStatus = 'on_track';
        scheduleDeltaText = 'В рекомендованном графике';
      } else {
        scheduleStatus = 'behind';
        scheduleDeltaText = `Отставание (${Math.round(progressVariance / 10)} дн.)`;
      }

      return {
        benchmark,
        stageInfo,
        status,
        score,
        actualProgressPercent,
        progressVariance,
        scheduleStatus,
        scheduleDeltaText,
      };
    });
  }, [currentEvaluatedTeam, paceScenario]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return comparisonRows.filter((row) => {
      if (statusFilter === 'completed') return row.actualProgressPercent === 100;
      if (statusFilter === 'active')
        return row.actualProgressPercent > 0 && row.actualProgressPercent < 100;
      if (statusFilter === 'future') return row.actualProgressPercent === 0;
      return true;
    });
  }, [comparisonRows, statusFilter]);

  // Overall schedule performance index (SPI)
  const averagePlanned =
    STAGE_BENCHMARKS.reduce((acc, b) => acc + b.plannedProgressPercent, 0) /
    STAGE_BENCHMARKS.length;
  const averageActual =
    comparisonRows.reduce((acc, r) => acc + r.actualProgressPercent, 0) / comparisonRows.length;
  const spiRatio = averagePlanned > 0 ? (averageActual / averagePlanned).toFixed(2) : '1.00';

  const completedCount = comparisonRows.filter((r) => r.status === 'approved').length;

  const handleExportCsv = () => {
    const headers = [
      'Этап',
      'Название',
      'Рекомендованные даты',
      'Дедлайн',
      'Плановый прогресс (%)',
      'Фактический прогресс (%)',
      'Статус команды',
      'Набранный балл',
      'Отклонение от графика',
    ];

    const rows = comparisonRows.map((r) => [
      `Этап ${r.benchmark.stageNumber}`,
      `"${r.benchmark.title}"`,
      `"${r.benchmark.recommendedStartDate} - ${r.benchmark.recommendedDeadline}"`,
      `"${r.benchmark.recommendedDeadline}"`,
      `${r.benchmark.plannedProgressPercent}%`,
      `${r.actualProgressPercent}%`,
      `"${r.status}"`,
      `${r.score}`,
      `"${r.scheduleDeltaText}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Progress_vs_Schedule_${currentEvaluatedTeam.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl space-y-5">
      {/* Table Header and Summary Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-black tracking-wide text-white">
              СРАВНЕНИЕ ТЕКУЩЕГО ПРОГРЕССА С РЕКОМЕНДОВАННЫМ ГРАФИКОМ
            </h2>
            <span className="rounded bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
              SCHEDULE BENCHMARK & VELOCITY
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Сопоставление фактического темпа решения 5 этапов чемпионата с плановым таймлайном
            подготовки КубСата 3U к подаче заявки в Space-π.
          </p>
        </div>

        {/* Quick KPI Stats Summary */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Schedule Performance Index (SPI) */}
          <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 shadow-sm">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400 leading-tight">Индекс темпа (SPI)</div>
              <div className="font-mono font-bold text-cyan-300 text-sm">
                {spiRatio}{' '}
                <span className="text-[10px] text-emerald-400 font-normal">
                  {Number(spiRatio) >= 1.0 ? '(Опережает план)' : '(Отстает)'}
                </span>
              </div>
            </div>
          </div>

          {/* Completed stages count */}
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 leading-tight">Принято этапов</div>
              <div className="font-mono font-bold text-emerald-300 text-sm">
                {completedCount} из 5
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Team Switcher, Filters, Velocity Scenario & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Team Switcher (Active Team vs Competitors) */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Команда:</span>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-200 font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value={team.id}>«{team.name}» (Текущая команда)</option>
              {allTeams
                .filter((t) => t.id !== team.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    «{t.name}» ({t.city}, {t.totalScore} б.)
                  </option>
                ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Все этапы (5)</option>
              <option value="completed">Только завершенные</option>
              <option value="active">В активной работе</option>
              <option value="future">В очереди</option>
            </select>
          </div>
        </div>

        {/* Pace Scenario & CSV Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] text-slate-400">Сценарий:</span>
            <select
              value={paceScenario}
              onChange={(e) => setPaceScenario(e.target.value as typeof paceScenario)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none text-[11px] cursor-pointer"
            >
              <option value="current">Фактический темп</option>
              <option value="accelerated">Ускоренный (+15%)</option>
              <option value="intensive">Спринт перед дедлайном (+25%)</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-850 px-2.5 py-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Экспорт таблицы сравнения в CSV"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Interactive Comparison Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Этап чемпионата</th>
              <th className="px-3 py-3">Рекомендованный график</th>
              <th className="px-3 py-3">План vs Факт прогресса</th>
              <th className="px-3 py-3">Статус команды</th>
              <th className="px-3 py-3">Отклонение (Delta)</th>
              <th className="px-3 py-3 text-right">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-sans">
            {filteredRows.map((row) => {
              const isAhead = row.scheduleStatus === 'ahead';
              const isBehind = row.scheduleStatus === 'behind';
              const isCompleted = row.scheduleStatus === 'completed_ontime';

              return (
                <tr
                  key={row.benchmark.id}
                  className="hover:bg-slate-900/50 transition-colors group"
                >
                  {/* Stage number & title */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-xs font-bold bg-slate-800 text-cyan-300 border border-slate-700 mt-0.5">
                        0{row.benchmark.stageNumber}
                      </span>
                      <div>
                        <div className="font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                          {row.benchmark.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {row.benchmark.deliverableFocus}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>Контрольный параметр: {row.benchmark.keyMetricName}</span>
                          <span>•</span>
                          <span className="text-cyan-400">{row.benchmark.targetMetricValue}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Recommended schedule dates */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{row.benchmark.recommendedStartDate}</span>
                      <span className="text-slate-600">—</span>
                      <span className="font-bold text-white">
                        {row.benchmark.recommendedDeadline}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Длительность: {row.benchmark.durationDays} дн.
                    </div>
                  </td>

                  {/* Plan vs Actual Progress Bars */}
                  <td className="px-3 py-3.5 min-w-[190px]">
                    <div className="space-y-1.5">
                      {/* Actual Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Факт команды:</span>
                          <span
                            className={`font-bold ${
                              isCompleted
                                ? 'text-emerald-400'
                                : isAhead
                                  ? 'text-cyan-300'
                                  : isBehind
                                    ? 'text-rose-400'
                                    : 'text-sky-300'
                            }`}
                          >
                            {row.actualProgressPercent}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted
                                ? 'bg-emerald-400'
                                : isAhead
                                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                                  : isBehind
                                    ? 'bg-rose-400'
                                    : 'bg-cyan-400'
                            }`}
                            style={{ width: `${row.actualProgressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Planned Benchmark Reference */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Плановый норматив:</span>
                          <span>{row.benchmark.plannedProgressPercent}%</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-slate-800/80 overflow-hidden">
                          <div
                            className="h-full bg-slate-500/60 rounded-full"
                            style={{ width: `${row.benchmark.plannedProgressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Actual team status */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <div>
                      {row.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          Одобрено ({row.score} б.)
                        </span>
                      ) : row.status === 'under_review' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          На экспертизе
                        </span>
                      ) : row.status === 'submitted' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
                          <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                          Сдано
                        </span>
                      ) : row.status === 'needs_revision' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                          Доработка
                        </span>
                      ) : row.status === 'draft' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                          <Zap className="h-3.5 w-3.5 text-cyan-400" />В разработке
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-400">
                          В очереди
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Schedule variance / Delta indicator */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono border ${
                          isCompleted
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                            : isAhead
                              ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30'
                              : isBehind
                                ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                        {isAhead && <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />}
                        {isBehind && <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />}
                        <span>{row.scheduleDeltaText}</span>
                      </span>
                    </div>
                  </td>

                  {/* Direct action button */}
                  <td className="px-3 py-3.5 text-right whitespace-nowrap">
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab('submissions')}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer"
                        title="Перейти к этапу в разделе сдачи решений"
                      >
                        <span>К этапу</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Strategic Recommendation Callout Strip */}
      <div className="rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 to-slate-950 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30">
            <Award className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Инженерный прогноз готовности к финалу Space-π:</span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/20">
                24 июня 2026 (за 4 дня до дедлайна)
              </span>
            </div>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Команда «{currentEvaluatedTeam.name}» опережает рекомендованный темп (SPI = {spiRatio}
              ). Рекомендуется запараллелить подготовку спецификации радиомаяка СОНИКС (Этап 4) с
              доработкой сенсора.
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('spacepi')}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-3.5 py-2 font-bold text-white hover:from-sky-400 hover:to-cyan-400 transition-all shrink-0 shadow-lg shadow-sky-500/20 cursor-pointer"
          >
            <span>Оформить заявку Space-π</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
