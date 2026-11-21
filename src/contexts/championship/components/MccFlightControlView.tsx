/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Центр Управления Полётами (ЦУП) — общий личный кабинет для:
 * - Командира ЦУПа (Организатора)
 * - Координатора ЦУПа (Администратора)
 *
 * Содержит:
 * 1. Мониторинг всех 16+ космических кораблей команд (название, цель экспедиции, экипаж, топливо).
 * 2. Раздел «Ролевые задания кораблей» — полный сводный реестр заданий членов экипажей по ролям.
 * 3. «Пополняемый справочник ролей CRM» — управление списком готовых ролей и добавление новых.
 * 4. «Школьный реестр участников» — возможность вписать нового школьника в списки.
 * 5. «Этапы и дедлайны ЦУП» — управление регламентом и оповещениями.
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Rocket,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  Award,
  AlertTriangle,
  Mail,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Check,
  Building,
  GraduationCap,
} from 'lucide-react';
import {
  UserProfile,
  Team,
  RoleSubtask,
  CrewRoleDefinition,
  CaseTask,
} from '@/src/shared/types/index';
import { CRM_TEAMS_DATABASE, CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';
import {
  taskRolesService,
  CHAMPIONSHIP_STAGES_CRM,
} from '@/src/contexts/crew/services/taskRolesService';
import { CASE_TASKS } from '@/src/shared/data/mockData';
import { audioService } from '@/src/shared/lib/audioService';

interface MccFlightControlViewProps {
  currentUser: UserProfile;
  onSelectTeam?: (teamId: string) => void;
  onNavigateTab?: (tab: string, subView?: string) => void;
}

export const MccFlightControlView: React.FC<MccFlightControlViewProps> = ({
  currentUser,
  onSelectTeam,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'ships' | 'tasks' | 'roles' | 'registry' | 'stages'>(
    'ships',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>('all');

  // Roles state (retrieved from taskRolesService which supports local storage persistence)
  const [availableRoles, setAvailableRoles] = useState<CrewRoleDefinition[]>(() =>
    taskRolesService.getAvailableRoles(),
  );

  // New role modal state
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleCategory, setNewRoleCategory] =
    useState<CrewRoleDefinition['category']>('exact_sciences');
  const [newRoleCategoryLabel, setNewRoleCategoryLabel] = useState('Точные науки');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleDiscipline, setNewRoleDiscipline] = useState('Космическая физика');

  // Add new student to CRM modal state
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentFullName, setStudentFullName] = useState('');
  const [studentSchool, setStudentSchool] = useState('МАОУ «СОШ №81» г. Перми');
  const [studentGrade, setStudentGrade] = useState('9А');
  const [studentRoleKey, setStudentRoleKey] = useState('physicist');
  const [targetShipId, setTargetShipId] = useState(CRM_TEAMS_DATABASE[0].id);

  // Teams in CRM state
  const [teamsList, setTeamsList] = useState<CrmTeamRecord[]>(CRM_TEAMS_DATABASE);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    audioService.playSuccessChime();
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Handle Add Role
  const handleSaveNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim()) return;

    const created = taskRolesService.addCustomRole({
      title: newRoleTitle,
      category: newRoleCategory,
      categoryLabel: newRoleCategoryLabel,
      shortDesc: newRoleDesc || 'Специализированная роль в экипаже CubeSat',
      defaultDiscipline: newRoleDiscipline || 'Космические науки',
    });

    setAvailableRoles(taskRolesService.getAvailableRoles());
    setIsAddRoleModalOpen(false);
    setNewRoleTitle('');
    setNewRoleDesc('');
    showNotice(`Роль «${created.title}» успешно добавлена в официальный справочник CRM!`);
  };

  // Handle Add Student into CRM and Ship
  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFullName.trim()) return;

    const roleDef = taskRolesService.getRoleDefinition(studentRoleKey);
    const roleTitle = roleDef?.title || 'Специалист экипажа';

    const newStudent = {
      raw: `${studentFullName}, ${studentGrade}`,
      name: studentFullName.trim(),
      gradeText: studentGrade.trim(),
      gradeNumber: parseInt(studentGrade.replace(/\D/g, '')) || 9,
      assignedRole: studentRoleKey as any,
      roleTitle,
      discipline: (roleDef?.defaultDiscipline as any) || 'Физика',
    };

    setTeamsList((prev) =>
      prev.map((team) => {
        if (team.id === targetShipId) {
          return {
            ...team,
            students: [...team.students, newStudent],
          };
        }
        return team;
      }),
    );

    setIsAddStudentModalOpen(false);
    setStudentFullName('');
    showNotice(`Участник ${studentFullName} успешно вписан в списки корабля!`);
  };

  // Generate role tasks for all ships
  const allShipTasks = React.useMemo(() => {
    const list: {
      teamId: string;
      shipName: string;
      school: string;
      taskTitle: string;
      subtasks: RoleSubtask[];
    }[] = [];

    teamsList.forEach((tm) => {
      const task = CASE_TASKS.find((c) => c.id === tm.selectedTaskId) || CASE_TASKS[0];
      const crewInput = tm.students.map((st) => ({
        studentName: st.name,
        role: st.assignedRole as any,
      }));

      const generated = taskRolesService.generateSubtasksForTeam(
        task.id,
        tm.selectedTaskTitle || task.title,
        crewInput,
        tm.mentorName,
      );

      list.push({
        teamId: tm.id,
        shipName: tm.shipName,
        school: tm.school,
        taskTitle: tm.selectedTaskTitle || task.title,
        subtasks: generated,
      });
    });

    return list;
  }, [teamsList]);

  // Filtered ships
  const filteredShips = teamsList.filter(
    (t) =>
      t.shipName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mentorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.selectedTaskTitle &&
        t.selectedTaskTitle.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Banner: Flight Control Center */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/70 border border-blue-500/30 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Центр Управления Полётами (ЦУП)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {currentUser.role === 'organizer' ? 'Командир ЦУПа' : 'Координатор ЦУПа'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Командный пункт кейс-чемпионата «КОСМОПОРТ»
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Единый личный кабинет организаторов и администраторов. Мониторинг кораблей команд,
              ролевых заданий каждого члена экипажа, пополняемого справочника ролей и школьного
              реестра.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddStudentModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Вписать школьника</span>
            </button>
            <button
              onClick={() => setIsAddRoleModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить роль</span>
            </button>
          </div>
        </div>

        {/* Global Notification */}
        {noticeMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('ships')}
          className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'ships'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Флот кораблей ({teamsList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Ролевые задания экипажей</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'roles'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Справочник ролей CRM ({availableRoles.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('registry')}
          className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'registry'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Реестр школьников</span>
        </button>
        <button
          onClick={() => setActiveTab('stages')}
          className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'stages'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Этапы и расписание ЦУП</span>
        </button>
      </div>

      {/* TAB 1: Ships fleet */}
      {activeTab === 'ships' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию корабля, школе, командиру..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Готовность флота:</span>
              <span className="font-mono text-emerald-400 font-semibold">16 / 16 активны</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredShips.map((ship) => (
              <div
                key={ship.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-lg space-y-3 transition-all"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase">
                        {ship.shipCallsign}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                        {ship.cubesatFormat}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Корабль «{ship.shipName}»
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{ship.school}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Командир</span>
                    <span className="text-xs font-semibold text-white">{ship.mentorName}</span>
                  </div>
                </div>

                {/* Mission goal */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] font-semibold text-amber-400 uppercase block mb-0.5">
                    Цель экспедиции (Задание корабля)
                  </span>
                  <span className="text-slate-200 font-medium line-clamp-2">
                    {ship.selectedTaskTitle || 'Баллистика и термосфера CubeSat 3U'}
                  </span>
                </div>

                {/* Crew and assigned roles */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Члены экипажа ({ship.students.length + 1} чел.):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px]">
                      🎖️ Командир: {ship.mentorName.split(' ')[0]}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px]">
                      🤖 Бортовой компьютер: Леший
                    </span>
                    {ship.students.map((st, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px]"
                      >
                        {st.roleTitle}: {st.name.split(' ')[0]} ({st.gradeText})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Role subtasks for all ships */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Сводный реестр ролевых заданий кораблей в ЦУП</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Каждый член экипажа согласно своей роли (физик, химик, биолог, штурман,
                  бортмеханик, переводчик и др.) выполняет задачи в рамках общего задания корабля.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {allShipTasks.map((shipTask, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-indigo-400" />
                      <span>Корабль «{shipTask.shipName}»</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({shipTask.school})
                      </span>
                    </h4>
                    <p className="text-xs text-amber-300 font-medium mt-0.5">
                      Цель экспедиции: {shipTask.taskTitle}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg shrink-0">
                    Задач: {shipTask.subtasks.length}
                  </span>
                </div>

                {/* Subtasks List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {shipTask.subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                          <span>{st.roleTitle}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {st.assignedStudentName || 'Назначен'}
                        </span>
                      </div>
                      <h5 className="text-xs font-semibold text-white">{st.title}</h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{st.description}</p>
                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Дисциплина: {st.discipline}</span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Сгенерировано ЦУП
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CRM Roles Directory (Пополняемый справочник ролей) */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Пополняемый справочник ролей CRM-системы</span>
              </h3>
              <p className="text-xs text-slate-400">
                Список готовых ролей экипажей кораблей. Каждому члену команды присваивается
                отдельная собственная роль. Командир ЦУПа и командиры кораблей могут пополнять этот
                список.
              </p>
            </div>

            <button
              onClick={() => setIsAddRoleModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить новую роль</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableRoles.map((role) => (
              <div
                key={role.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
                      {role.categoryLabel}
                    </span>
                    {role.isPredefined ? (
                      <span className="text-[10px] text-slate-500 font-mono">Базовая</span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                        Пользовательская
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white">{role.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{role.shortDesc}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Дисциплина: {role.defaultDiscipline}</span>
                  <span className="font-mono text-[10px] text-slate-400">id: {role.key}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Students Registry (Реестр школьников) */}
      {activeTab === 'registry' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>Школьный реестр участников чемпионата</span>
              </h3>
              <p className="text-xs text-slate-400">
                Список школьников, распределенных по кораблям. Если какого-то школьника не оказалось
                в списках — впишите его вручную.
              </p>
            </div>

            <button
              onClick={() => setIsAddStudentModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Вписать нового школьника</span>
            </button>
          </div>

          {/* Students Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ФИО Участника</th>
                    <th className="py-3 px-4">Класс</th>
                    <th className="py-3 px-4">Корабль</th>
                    <th className="py-3 px-4">Школа</th>
                    <th className="py-3 px-4">Назначенная роль</th>
                    <th className="py-3 px-4">Дисциплина</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {teamsList.flatMap((t) =>
                    t.students.map((st, i) => (
                      <tr key={`${t.id}-${i}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 font-medium text-white">{st.name}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-400">{st.gradeText}</td>
                        <td className="py-2.5 px-4 font-semibold text-indigo-300">
                          «{t.shipName}»
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 max-w-[200px] truncate">
                          {t.school}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-medium border border-indigo-500/30">
                            {st.roleTitle}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">{st.discipline}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Stages schedule & circulars */}
      {activeTab === 'stages' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Регламент и циркуляры этапов чемпионата «КОСМОПОРТ»</span>
            </h3>
            <p className="text-xs text-slate-400">
              График утвержден Администрацией ЦУП. Наставники и эксперты получают автоматические
              уведомления.
            </p>
          </div>

          <div className="space-y-3">
            {CHAMPIONSHIP_STAGES_CRM.map((st) => (
              <div
                key={st.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {st.number}
                    </span>
                    <h4 className="text-sm font-bold text-white">{st.title}</h4>
                  </div>
                  <span className="text-xs font-mono text-indigo-400">{st.dates}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{st.description}</p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-medium">Дедлайн:</span>
                    <span>{st.deadlineTime}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[11px] border border-emerald-500/30">
                    Оповещения Лешего активны
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Add Custom Role */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Добавление новой роли в CRM</span>
              </h3>
              <button
                onClick={() => setIsAddRoleModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewRole} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Название роли (например: Астрофизик, Геодезист, Робототехник):
                </label>
                <input
                  type="text"
                  required
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  placeholder="Бортовой робототехник"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Категория роли:</label>
                <select
                  value={newRoleCategory}
                  onChange={(e) => {
                    const cat = e.target.value as any;
                    setNewRoleCategory(cat);
                    const label =
                      cat === 'exact_sciences'
                        ? 'Точные науки'
                        : cat === 'engineering'
                          ? 'Инженерия'
                          : cat === 'humanities'
                            ? 'Гуманитарные науки'
                            : cat === 'commercial'
                              ? 'Коммерциализация'
                              : cat === 'medicine'
                                ? 'Медицина'
                                : 'Пользовательская';
                    setNewRoleCategoryLabel(label);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="exact_sciences">Точные науки (Физика, Химия, Математика)</option>
                  <option value="engineering">Инженерия и механизмы</option>
                  <option value="humanities">Гуманитарные науки (Филология, Перевод)</option>
                  <option value="commercial">Коммерциализация и маркетинг</option>
                  <option value="medicine">Космическая медицина и биозащита</option>
                  <option value="custom">Другое направление</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Базовая дисциплина:</label>
                <input
                  type="text"
                  required
                  value={newRoleDiscipline}
                  onChange={(e) => setNewRoleDiscipline(e.target.value)}
                  placeholder="Робототехника / Астрофизика"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Краткое описание обязанностей:
                </label>
                <textarea
                  rows={2}
                  required
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Опишите задачи специалиста в рамках орбитальной миссии CubeSat..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoleModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Сохранить роль в CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Inscribe Student */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>Вписать школьника в списки CRM</span>
              </h3>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">ФИО школьника:</label>
                <input
                  type="text"
                  required
                  value={studentFullName}
                  onChange={(e) => setStudentFullName(e.target.value)}
                  placeholder="Иванов Кирилл Дмитриевич"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Класс:</label>
                  <input
                    type="text"
                    required
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    placeholder="9А"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Назначить роль:</label>
                  <select
                    value={studentRoleKey}
                    onChange={(e) => setStudentRoleKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {availableRoles.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Зачислить на корабль команды:
                </label>
                <select
                  value={targetShipId}
                  onChange={(e) => setTargetShipId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {teamsList.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      Корабль «{tm.shipName}» ({tm.school})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Вписать в списки
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
