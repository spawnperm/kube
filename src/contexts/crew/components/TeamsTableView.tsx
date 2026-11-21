import React, { useState, useMemo } from 'react';
import {
  Edit3,
  Trash2,
  BookOpen,
  Search,
  Filter,
  Users,
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  FileSpreadsheet,
  Lock,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';
import { UserProfile } from '@/src/shared/types';
import { canEditTeamCard } from '@/src/contexts/crew/services/rolePermissionService';
import { audioService } from '@/src/shared/lib/audioService';

interface TeamsTableViewProps {
  teams: CrmTeamRecord[];
  currentUser?: UserProfile;
  onUpdateTeam: (team: CrmTeamRecord) => void;
  onEditTeam: (team: CrmTeamRecord) => void;
  onDeleteTeam: (teamId: string) => void;
  onOpenTaskDirectory: (team: CrmTeamRecord) => void;
  onSelectTeamForDossier?: (teamId: string) => void;
  selectedTeamId?: string;
}

export const TeamsTableView: React.FC<TeamsTableViewProps> = ({
  teams,
  currentUser,
  onUpdateTeam,
  onEditTeam,
  onDeleteTeam,
  onOpenTaskDirectory,
  onSelectTeamForDossier,
  selectedTeamId,
}) => {
  const canDeleteTeams = currentUser?.role === 'admin' || currentUser?.role === 'organizer';
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | '1U' | '2U' | '3U' | '6U'>('all');
  const [taskFilter, setTaskFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'quota_allocated' | 'registered_active' | 'waitlist'
  >('all');

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        t.shipName.toLowerCase().includes(q) ||
        t.shipCallsign.toLowerCase().includes(q) ||
        t.school.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.mentorName.toLowerCase().includes(q) ||
        (t.selectedTaskTitle && t.selectedTaskTitle.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Format
      if (formatFilter !== 'all' && t.cubesatFormat !== formatFilter) {
        return false;
      }

      // Task
      if (taskFilter === 'assigned' && !t.selectedTaskId) return false;
      if (taskFilter === 'unassigned' && t.selectedTaskId) return false;

      // Status
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      return true;
    });
  }, [teams, searchQuery, formatFilter, taskFilter, statusFilter]);

  // Quick inline update for format
  const handleFormatChange = (team: CrmTeamRecord, newFormat: '1U' | '2U' | '3U' | '6U') => {
    audioService.playClickSound();
    onUpdateTeam({ ...team, cubesatFormat: newFormat });
  };

  // Quick inline update for status
  const handleStatusChange = (team: CrmTeamRecord, newStatus: CrmTeamRecord['status']) => {
    audioService.playClickSound();
    onUpdateTeam({ ...team, status: newStatus });
  };

  // Export CSV functionality
  const handleExportCsv = () => {
    audioService.playSuccessChime();
    const headers = [
      '№',
      'Позывной',
      'Корабль',
      'Кубсат',
      'Формат',
      'Школа',
      'Город',
      'Наставник',
      'Email',
      'Телефон',
      'Кейс-задание',
      'Участники',
      'Статус',
    ];

    const rows = filteredTeams.map((t) => [
      t.orderNumber,
      `"${t.shipCallsign}"`,
      `"${t.shipName}"`,
      `"${t.cubesatName}"`,
      t.cubesatFormat,
      `"${t.school.replace(/"/g, '""')}"`,
      `"${t.city}"`,
      `"${t.mentorName}"`,
      `"${t.mentorEmail}"`,
      `"${t.mentorPhone || ''}"`,
      `"${(t.selectedTaskTitle || 'Не выбрано').replace(/"/g, '""')}"`,
      `"${t.students.map((s) => s.name).join(', ')}"`,
      t.status,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cubesat_CRM_Teams_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Table Toolbar & Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по позывному, кораблю, школе, наставнику или кейсу…"
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Format Filter */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500">Формат:</span>
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value as any)}
                className="bg-transparent text-xs text-cyan-300 font-mono focus:outline-none cursor-pointer"
              >
                <option value="all">Все форматы</option>
                <option value="1U">1U</option>
                <option value="2U">2U</option>
                <option value="3U">3U</option>
                <option value="6U">6U</option>
              </select>
            </div>

            {/* Task Filter */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500">Кейс:</span>
              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value as any)}
                className="bg-transparent text-xs text-indigo-300 font-mono focus:outline-none cursor-pointer"
              >
                <option value="all">Все кейсы</option>
                <option value="assigned">Назначен</option>
                <option value="unassigned">Без кейса</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500">Статус:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-xs text-amber-300 font-mono focus:outline-none cursor-pointer"
              >
                <option value="all">Все статусы</option>
                <option value="quota_allocated">Квота выделена</option>
                <option value="registered_active">Активен</option>
                <option value="waitlist">Лист ожидания</option>
              </select>
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Экспортировать CRM реестр в CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Role Permissions & Editing Access Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Право редактирования:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all ${
                  currentUser?.role === 'admin'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 ring-1 ring-rose-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800/80'
                }`}
              >
                <Shield className="w-3 h-3 text-rose-400" />
                Администратор
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all ${
                  currentUser?.role === 'organizer'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800/80'
                }`}
              >
                <Users className="w-3 h-3 text-amber-400" />
                Организатор
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all ${
                  currentUser?.role === 'mentor' || (currentUser?.role as any) === 'captain'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800/80'
                }`}
              >
                <UserCheck className="w-3 h-3 text-indigo-400" />
                Капитан команды
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEditTeamCard(currentUser) ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Редактирование доступно (
                  {currentUser?.role === 'admin'
                    ? 'Администратор'
                    : currentUser?.role === 'organizer'
                      ? 'Организатор'
                      : 'Капитан'}
                  )
                </span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-[11px]"
                title="Редактирование карточки доступно администратору, организатору или капитану команды"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Режим просмотра (Редактирование: Админ, Орг, Капитан)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">№</th>
                <th className="py-3 px-3 w-28">Позывной</th>
                <th className="py-3 px-3 min-w-[160px]">Корабль / Кубсат</th>
                <th className="py-3 px-3 w-24">Формат</th>
                <th className="py-3 px-3 min-w-[200px]">Школа и Город</th>
                <th className="py-3 px-3 min-w-[180px]">Капитан / Наставник</th>
                <th className="py-3 px-3 min-w-[140px]">Экипаж</th>
                <th className="py-3 px-3 min-w-[260px]">
                  <span className="text-cyan-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    Кейс-задание (клик для выбора)
                  </span>
                </th>
                <th className="py-3 px-3 w-36">Статус квоты</th>
                <th className="py-3 px-3 w-24 text-right pr-4">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-mono">
                    Нет команд, удовлетворяющих заданным критериям поиска
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => {
                  const isSelected = selectedTeamId === team.id;
                  const hasTask = !!team.selectedTaskId;

                  return (
                    <tr
                      key={team.id}
                      onClick={() => onSelectTeamForDossier && onSelectTeamForDossier(team.id)}
                      className={`hover:bg-slate-800/40 transition-colors group cursor-pointer ${
                        isSelected ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      {/* 1. Order Number */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                        {team.orderNumber}
                      </td>

                      {/* 2. Ship Callsign */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-950 border border-indigo-500/40 font-mono font-bold text-cyan-300">
                          {team.shipCallsign || `Борт-0${team.orderNumber}`}
                        </span>
                      </td>

                      {/* 3. Ship & Cubesat Name */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white group-hover:text-amber-300 transition-colors">
                          «{team.shipName}»
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {team.cubesatName}
                        </div>
                      </td>

                      {/* 4. Format (Interactive Dropdown) */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          disabled={!canEditTeamCard(currentUser, team)}
                          value={team.cubesatFormat || '3U'}
                          onChange={(e) => handleFormatChange(team, e.target.value as any)}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-400 font-semibold focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <option value="1U">1U</option>
                          <option value="2U">2U</option>
                          <option value="3U">3U</option>
                          <option value="6U">6U</option>
                        </select>
                      </td>

                      {/* 5. School & City */}
                      <td className="py-3 px-3">
                        <div className="text-slate-200 line-clamp-1" title={team.school}>
                          {team.school}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">г. {team.city}</div>
                      </td>

                      {/* 6. Mentor */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200">{team.mentorName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {team.mentorEmail}
                        </div>
                      </td>

                      {/* 7. Students count */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-semibold text-slate-200">
                            {team.students.length} чел.
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {team.students.map((s) => s.name.split(' ')[0]).join(', ')}
                        </div>
                      </td>

                      {/* 8. Case Task Field (Clickable Trigger for Directory) */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={!canEditTeamCard(currentUser, team)}
                          onClick={() => {
                            audioService.playClickSound();
                            onOpenTaskDirectory(team);
                          }}
                          className={`w-full text-left p-2 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${
                            canEditTeamCard(currentUser, team)
                              ? hasTask
                                ? 'bg-slate-950/80 border-indigo-500/40 hover:border-cyan-400 hover:bg-slate-900 group/btn cursor-pointer'
                                : 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400 text-amber-300 cursor-pointer'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 cursor-not-allowed opacity-80'
                          }`}
                          title={
                            canEditTeamCard(currentUser, team)
                              ? 'Нажмите, чтобы открыть справочник заданий и выбрать кейс'
                              : 'Редактирование доступно администратору, организатору или капитану команды'
                          }
                        >
                          <div className="min-w-0">
                            {hasTask ? (
                              <div className="font-medium text-white truncate max-w-[200px]">
                                {team.selectedTaskTitle}
                              </div>
                            ) : (
                              <div className="italic text-amber-300">⚠️ Выбрать кейс-задание…</div>
                            )}
                          </div>
                          <span className="p-1 rounded bg-slate-800 text-cyan-400 shrink-0">
                            <BookOpen className="w-3 h-3" />
                          </span>
                        </button>
                      </td>

                      {/* 9. Status (Interactive Dropdown) */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          disabled={!canEditTeamCard(currentUser, team)}
                          value={team.status}
                          onChange={(e) => handleStatusChange(team, e.target.value as any)}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <option value="quota_allocated">Квота выделена</option>
                          <option value="registered_active">Активен</option>
                          <option value="waitlist">Лист ожидания</option>
                        </select>
                      </td>

                      {/* 10. Actions */}
                      <td
                        className="py-3 px-3 text-right pr-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {canEditTeamCard(currentUser, team) ? (
                            <button
                              onClick={() => {
                                audioService.playClickSound();
                                onEditTeam(team);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/40 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Редактировать все поля команды"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                            </button>
                          ) : (
                            <div
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 cursor-not-allowed select-none"
                              title="Редактирование карточки доступно только Администратору, Организатору или Капитану команды"
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          )}

                          {canDeleteTeams && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Удалить борт «${team.shipName}» (${team.shipCallsign}) из CRM-реестра?`,
                                  )
                                ) {
                                  onDeleteTeam(team.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="Удалить команду"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Stats */}
        <div className="p-3.5 sm:px-5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-4">
            <span>
              Показано команд: <strong className="text-white">{filteredTeams.length}</strong> из{' '}
              {teams.length}
            </span>
            <span>•</span>
            <span>
              С закрепленным кейсом:{' '}
              <strong className="text-emerald-400">
                {filteredTeams.filter((t) => !!t.selectedTaskId).length}
              </strong>
            </span>
            <span>•</span>
            <span>
              Всего школьников:{' '}
              <strong className="text-cyan-300">
                {filteredTeams.reduce((acc, t) => acc + t.students.length, 0)}
              </strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-500">
            💡 Нажмите на любое кейс-задание для открытия справочника свободных кейсов
          </div>
        </div>
      </div>
    </div>
  );
};
