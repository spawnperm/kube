import React, { useState } from 'react';
import { Trophy, Search, FileText } from 'lucide-react';
import { Team } from '../../types';
import { CASE_STAGES } from '../../data/mockData';

interface LeaderboardTabProps {
  teams: Team[];
  onSelectTeamForReport: (team: Team) => void;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ teams, onSelectTeamForReport }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'totalScore' | 'readiness'>('totalScore');

  // Filter and sort teams
  const sortedTeams = [...teams]
    .filter((t) => {
      if (selectedLeague !== 'all' && t.league !== selectedLeague) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.school.toLowerCase().includes(q) ||
          t.city.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'totalScore') return b.totalScore - a.totalScore;
      return b.launchReadinessPercent - a.launchReadinessPercent;
    });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Турнирная таблица кейс-чемпионата</h1>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                Автоматический подсчет баллов
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              Команда-победитель получит право запуска своего КубСата на солнечно-синхронную орбиту
              с космодрома «Восточный»!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Команд в турнире:</span>{' '}
            <strong className="text-cyan-400 font-mono">{teams.length}</strong>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Главный приз:</span>{' '}
            <strong className="text-amber-300 font-mono">Орбита 525 км</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Поиск по команде, лицею или городу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="flex-1 sm:flex-none rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">Все лиги (Старшая & Юниоры)</option>
            <option value="Старшая лига (10-11 классы)">Старшая лига (10-11 классы)</option>
            <option value="Юниорская лига (8-9 классы)">Юниорская лига (8-9 классы)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'totalScore' | 'readiness')}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="totalScore">Сортировка: По баллам</option>
            <option value="readiness">Сортировка: По готовности</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Место</th>
                <th className="py-3 px-4">Команда и учебное заведение</th>
                <th className="py-3 px-4 text-center">Формат борта</th>
                <th className="py-3 px-2 text-center">Этап 1</th>
                <th className="py-3 px-2 text-center">Этап 2</th>
                <th className="py-3 px-2 text-center">Этап 3</th>
                <th className="py-3 px-2 text-center">Этап 4</th>
                <th className="py-3 px-2 text-center">Этап 5</th>
                <th className="py-3 px-4 text-center">Сумма баллов</th>
                <th className="py-3 px-4 text-center">Готовность</th>
                <th className="py-3 px-4 text-right">Отчет</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedTeams.map((t, idx) => {
                const rankNum = idx + 1;
                const isLeader = rankNum === 1;
                const isTop3 = rankNum <= 3;

                return (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      isLeader
                        ? 'bg-amber-500/10 hover:bg-amber-500/15'
                        : isTop3
                          ? 'bg-slate-900/40 hover:bg-slate-800/40'
                          : 'hover:bg-slate-850/40'
                    }`}
                  >
                    {/* Rank medal */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold">
                        {rankNum === 1 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-950 text-xs shadow-md">
                            🥇
                          </span>
                        ) : rankNum === 2 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-slate-950 text-xs">
                            🥈
                          </span>
                        ) : rankNum === 3 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-white text-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400 text-sm ml-1.5">
                            #{rankNum}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Team info */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{t.logo}</span>
                          <span className="font-bold text-white text-sm">«{t.name}»</span>
                          {isLeader && (
                            <span className="rounded bg-amber-400/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-400/30">
                              ЛИДЕР КУБСАТ
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {t.school} • г. {t.city}
                        </div>
                        <div className="text-slate-500 text-[10px]">Ментор: {t.mentorName}</div>
                      </div>
                    </td>

                    {/* Format */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300 border border-slate-700">
                        {t.cubesatSpecs.format} ({t.cubesatSpecs.massKg} кг)
                      </span>
                    </td>

                    {/* Stages 1 to 5 scores */}
                    {CASE_STAGES.map((stage) => {
                      const score = t.stageScores[stage.id];
                      const status = t.stageStatuses[stage.id];
                      return (
                        <td key={stage.id} className="py-3 px-2 text-center font-mono">
                          {status === 'approved' ? (
                            <span className="text-emerald-400 font-semibold">{score}</span>
                          ) : status === 'submitted' || status === 'under_review' ? (
                            <span className="text-cyan-400 text-[10px]">ревью</span>
                          ) : status === 'needs_revision' ? (
                            <span className="text-rose-400 text-[10px]">дораб.</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total points */}
                    <td className="py-3 px-4 text-center whitespace-nowrap font-mono font-black text-sm">
                      <span className={isLeader ? 'text-amber-300' : 'text-white'}>
                        {t.totalScore}
                      </span>
                      <span className="text-slate-500 text-[10px]"> / 500</span>
                    </td>

                    {/* Readiness progress bar */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${t.launchReadinessPercent}%` }}
                          />
                        </div>
                        <span className="font-mono text-cyan-300 text-[11px] font-semibold">
                          {t.launchReadinessPercent}%
                        </span>
                      </div>
                    </td>

                    {/* Export PDF Button */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectTeamForReport(t)}
                        className="rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/30 px-2.5 py-1 text-slate-300 text-[11px] font-medium transition-colors"
                        title="Сформировать детальный PDF-отчет"
                      >
                        <FileText className="h-3.5 w-3.5 inline mr-1" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
