/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Внутренняя CRM-панель и реестр экипажей чемпионата «КОСМОПОРТ».
 * Отображает загруженную из утвержденного списка информацию по всем 16 командам
 * (Преподаватель-капитан, 3 школьника с ролями Физик/Химик/Биолог, Бортовой компьютер «Леший»)
 * и 2 организаторам МАОУ ДПО «ЦРСО».
 */

import React, { useState, useMemo } from 'react';
import {
  Rocket,
  Shield,
  Search,
  CheckCircle2,
  Clock,
  Users,
  Compass,
  Atom,
  FlaskConical,
  Dna,
  Key,
  ExternalLink,
  Copy,
  Check,
  Building,
  Mail,
  Sparkles,
  Filter,
  UserCheck,
  ChevronRight,
  AlertTriangle,
  Wand2,
  Calendar,
  Bot,
} from 'lucide-react';
import {
  CRM_TEAMS_DATABASE,
  CRM_ORGANIZERS_DATABASE,
  CrmTeamRecord,
} from '@/src/contexts/crew/data/crmTeamsData';
import { aiMatchingService } from '@/src/contexts/crew/services/aiMatchingService';
import {
  Team,
  UserProfile,
  CrmChampionshipStage,
  CrmNotificationEmail,
} from '@/src/shared/types/index';
import { audioService } from '@/src/shared/lib/audioService';
import { CrmStagesScheduler } from '@/src/contexts/crew/components/CrmStagesScheduler';

interface CrmRegistryViewProps {
  currentTeam: Team;
  currentUser: UserProfile;
  onOpenAiRegistration: (teamId?: string) => void;
  onSwitchToTeam: (team: Team, mentor: UserProfile) => void;
  onBroadcastStage?: (stage: CrmChampionshipStage, emailLetter: CrmNotificationEmail) => void;
  onNavigateToMascot?: () => void;
}

export const CrmRegistryView: React.FC<CrmRegistryViewProps> = ({
  currentTeam,
  currentUser,
  onOpenAiRegistration,
  onSwitchToTeam,
  onBroadcastStage,
  onNavigateToMascot,
}) => {
  const [crmSubTab, setCrmSubTab] = useState<'crews' | 'scheduler' | 'organizers'>('crews');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'registered' | 'waitlist' | 'conflict' | 'incomplete' | 'organizers'
  >('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allAudits = useMemo(() => aiMatchingService.auditAllTeams(), []);

  const conflictCount = useMemo(
    () => Object.values(allAudits).filter((a) => a.status === 'conflict').length,
    [allAudits],
  );
  const incompleteCount = useMemo(
    () => Object.values(allAudits).filter((a) => a.status === 'incomplete').length,
    [allAudits],
  );

  const handleCopyCrew = (team: CrmTeamRecord) => {
    const text =
      `Корабль: ${team.shipName} (${team.shipCallsign})\nОУ: ${team.school}\nКапитан (Наставник): ${team.mentorName} (${team.mentorEmail})\nБортовой компьютер: Леший\nЭкипаж:\n` +
      team.students
        .map((s, i) => `${i + 1}. ${s.name} (${s.gradeText}) — ${s.roleTitle} (${s.discipline})`)
        .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedId(team.id);
    audioService.playClickSound();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTeams = CRM_TEAMS_DATABASE.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      t.school.toLowerCase().includes(q) ||
      t.mentorName.toLowerCase().includes(q) ||
      t.mentorEmail.toLowerCase().includes(q) ||
      t.shipName.toLowerCase().includes(q) ||
      t.students.some((s) => s.name.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (activeFilter === 'registered') return t.status === 'registered_active';
    if (activeFilter === 'waitlist')
      return t.status === 'waitlist' || t.status === 'quota_allocated';
    if (activeFilter === 'conflict') return allAudits[t.id]?.status === 'conflict';
    if (activeFilter === 'incomplete') return allAudits[t.id]?.status === 'incomplete';
    return true;
  });

  const registeredCount = CRM_TEAMS_DATABASE.filter((t) => t.status === 'registered_active').length;
  const waitlistCount = CRM_TEAMS_DATABASE.length - registeredCount;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Внутренняя CRM «КОСМОПОРТ»
              </span>
              <span className="text-xs text-slate-400">Официальный протокол участников 2026</span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Реестр экипажей, наставников и лист ожидания
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              База данных: 16 космических экипажей школ г. Перми и методический куратор МАОУ ДПО
              «ЦРСО». В составе каждого корабля: Преподаватель (Капитан), 3 школьника (Физик, Химик,
              Биолог) и Бортовой компьютер («Леший»).
            </p>
          </div>

          <button
            onClick={() => onOpenAiRegistration()}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Регистрация экипажа</span>
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold">Всего экипажей в CRM</div>
            <div className="text-lg font-bold text-white font-mono">16 кораблей</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-emerald-400 font-semibold">
              Зарегистрировано / Активно
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {registeredCount} борт(а)
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-rose-400 font-semibold">Конфликты ролей / данных</div>
            <div className="text-lg font-bold text-rose-400 font-mono">{conflictCount} борт(а)</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-amber-400 font-semibold">Неполные заявки CRM</div>
            <div className="text-lg font-bold text-amber-400 font-mono">
              {incompleteCount} борт(а)
            </div>
          </div>
        </div>
      </div>

      {/* CRM Main Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setCrmSubTab('crews');
            audioService.playClickSound();
          }}
          className={`text-xs font-bold px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
            crmSubTab === 'crews'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Реестр экипажей (16 квот)</span>
        </button>

        <button
          onClick={() => {
            setCrmSubTab('scheduler');
            audioService.playClickSound();
          }}
          className={`text-xs font-bold px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
            crmSubTab === 'scheduler'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Calendar className="w-4 h-4 text-cyan-300" />
          <span>Планировщик этапов & Временная шкала</span>
          <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 text-[10px] font-mono border border-cyan-500/30">
            ЦУП
          </span>
        </button>

        <button
          onClick={() => {
            setCrmSubTab('organizers');
            audioService.playClickSound();
          }}
          className={`text-xs font-bold px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
            crmSubTab === 'organizers'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Building className="w-4 h-4 text-purple-300" />
          <span>Оргштаб ЦРСО (2 куратора)</span>
        </button>
      </div>

      {/* VIEW 1: SCHEDULER & TIMELINE */}
      {crmSubTab === 'scheduler' && (
        <CrmStagesScheduler
          mentorEmail={currentTeam.mentorEmail}
          mentorName={currentTeam.mentorName}
          shipName={currentTeam.name}
          onBroadcastStage={onBroadcastStage}
          onNavigateToMascot={onNavigateToMascot}
        />
      )}

      {/* VIEW 2: ORGANIZERS */}
      {crmSubTab === 'organizers' && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Методический штаб чемпионата (МАОУ ДПО «ЦРСО» г. Перми):
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CRM_ORGANIZERS_DATABASE.map((org) => (
              <div
                key={org.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Организатор #{org.orderNumber}
                  </span>
                  <span className="text-[11px] text-slate-400">{org.organization}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{org.name}</h3>
                  <div className="text-xs text-purple-300 font-semibold">{org.position}</div>
                  <div className="text-xs text-slate-400 font-mono mt-1">{org.email}</div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  Курирует методическую экспертизу кейсов кубсатов, утверждение паспортов миссий и
                  протоколы защиты.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: CREWS REGISTRY */}
      {crmSubTab === 'crews' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Все 16 экипажей
              </button>
              <button
                onClick={() => setActiveFilter('conflict')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeFilter === 'conflict'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-900 text-rose-400 hover:text-rose-300 border border-rose-900/60'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Конфликты ({conflictCount})</span>
              </button>
              <button
                onClick={() => setActiveFilter('incomplete')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeFilter === 'incomplete'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-900 text-amber-400 hover:text-amber-300 border border-amber-900/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Неполные ({incompleteCount})</span>
              </button>
              <button
                onClick={() => setActiveFilter('registered')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === 'registered'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Зарегистрированные ({registeredCount})
              </button>
              <button
                onClick={() => setActiveFilter('waitlist')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === 'waitlist'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Лист ожидания ({waitlistCount})
              </button>
              <button
                onClick={() => setActiveFilter('organizers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === 'organizers'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Организаторы ЦРСО (2)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по школе, педагогу, email..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTeams.map((team) => {
              const isCurrent = currentTeam.id === team.id;
              const audit = allAudits[team.id];
              const isConflict = audit?.status === 'conflict';
              const isIncomplete = audit?.status === 'incomplete';

              return (
                <div
                  key={team.id}
                  className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : isConflict
                        ? 'bg-slate-900/90 border-rose-900/80 shadow-md shadow-rose-950/20'
                        : isIncomplete
                          ? 'bg-slate-900/90 border-amber-900/80'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top Bar of Card */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-mono font-bold text-xs">
                          #{team.orderNumber}
                        </span>
                        <span className="font-bold text-white text-sm truncate">
                          {team.shipName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white">
                            Текущий борт
                          </span>
                        )}

                        {/* Audit Pill */}
                        {isConflict && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            Конфликт в CRM
                          </span>
                        )}

                        {isIncomplete && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Неполная ({audit?.issues.length})
                          </span>
                        )}

                        {team.status === 'registered_active' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Зарегистрирован
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                            Лист ожидания
                          </span>
                        )}
                      </div>
                    </div>

                    {/* School & Callsign */}
                    <div className="text-xs text-slate-300 font-medium line-clamp-1 mb-1">
                      {team.school}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 mb-3">
                      <span>
                        Позывной: <strong className="text-slate-200">{team.shipCallsign}</strong>
                      </span>
                      <span>
                        CubeSat:{' '}
                        <strong className="text-slate-200">
                          {team.cubesatName} ({team.cubesatFormat})
                        </strong>
                      </span>
                    </div>

                    {/* Mentor / Captain Info */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-indigo-950/80 mb-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">👨‍✈️</span>
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase">
                              Капитан (Наставник-педагог):
                            </div>
                            <div className="text-xs font-bold text-white">{team.mentorName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-semibold">
                            Логин / Email:
                          </div>
                          <div className="text-xs font-mono text-indigo-300">
                            {team.mentorEmail}
                          </div>
                        </div>
                      </div>
                      {team.registeredPassword ? (
                        <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-emerald-400 flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          <span>Пароль назначен капитаном</span>
                        </div>
                      ) : (
                        <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-amber-400/80 flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          <span>Пароль назначается при регистрации</span>
                        </div>
                      )}
                    </div>

                    {/* Navigator: Mascot Leshy */}
                    <div className="p-2 rounded-xl bg-purple-950/20 border border-purple-500/20 mb-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span>🤖</span>
                        <div>
                          <span className="font-bold text-purple-300">
                            Бортовой компьютер «Леший»
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            Бортовой навигатор
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-purple-400">БК</span>
                    </div>

                    {/* AI Audit Issue Banner if exists */}
                    {audit && audit.issues.length > 0 && (
                      <div
                        className={`p-2 rounded-xl mb-2.5 text-[10px] space-y-0.5 border ${
                          isConflict
                            ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                            : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          {isConflict ? (
                            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                          <span className="truncate">AI-контроль: {audit.issues[0].title}</span>
                        </div>
                        <p className="text-[10px] text-slate-300 line-clamp-1">
                          {audit.issues[0].message}
                        </p>
                      </div>
                    )}

                    {/* 3 Student Crew Members */}
                    <div className="space-y-1.5 mb-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Состав экипажа школьников (3 человека):
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {team.students.map((student, idx) => (
                          <div
                            key={idx}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-[11px]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-slate-500 font-mono text-[10px]">
                                #{idx + 1}
                              </span>
                              <span className="font-semibold text-slate-200 truncate">
                                {student.name}
                              </span>
                              <span className="text-slate-400 text-[10px] shrink-0">
                                ({student.gradeText})
                              </span>
                            </div>

                            <div className="shrink-0 flex items-center gap-1">
                              {student.assignedRole === 'physicist' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                                  <Atom className="w-2.5 h-2.5" />
                                  Физик
                                </span>
                              )}
                              {student.assignedRole === 'chemist' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                  <FlaskConical className="w-2.5 h-2.5" />
                                  Химик
                                </span>
                              )}
                              {student.assignedRole === 'biologist' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <Dna className="w-2.5 h-2.5" />
                                  Биолог
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyCrew(team)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors flex items-center gap-1"
                      title="Скопировать данные экипажа"
                    >
                      {copiedId === team.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[10px]">Копия</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenAiRegistration(team.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          isConflict
                            ? 'bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/50'
                            : isIncomplete
                              ? 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/50'
                              : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>
                          {isConflict
                            ? 'Устранить конфликт'
                            : isIncomplete
                              ? 'Доукомплектовать'
                              : team.status === 'registered_active'
                                ? 'Управление'
                                : 'AI Регистрация'}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          const rolesMap = {
                            0: team.students[0].assignedRole,
                            1: team.students[1].assignedRole,
                            2: team.students[2].assignedRole,
                          };
                          const { team: newT, mentorProfile } = aiMatchingService.createTeamFromCrm(
                            team,
                            rolesMap,
                            team.selectedTaskId || 'task-01',
                            team.registeredPassword || 'Kosmoport2026!',
                          );
                          onSwitchToTeam(newT, mentorProfile);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                      >
                        <span>Войти на борт</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
