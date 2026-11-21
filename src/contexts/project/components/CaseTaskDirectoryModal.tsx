import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  Lock,
  CheckCircle2,
  Sparkles,
  Filter,
  GraduationCap,
  Atom,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Target,
  Rocket,
  Globe,
  Dna,
  FlaskConical,
  Compass,
  Calculator,
  Code,
  FileText,
  Shield,
  Layers,
  Send,
  UserCheck,
  Share2,
} from 'lucide-react';
import { CaseTask, UserProfile } from '@/src/shared/types';
import { CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';
import { audioService } from '@/src/shared/lib/audioService';

interface CaseTaskDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTeam?: CrmTeamRecord | null;
  allTeams?: CrmTeamRecord[];
  tasks: CaseTask[];
  onSelectTask?: (taskId: string, taskTitle: string) => void;
  onClearTask?: () => void;
  currentUser?: UserProfile;
  onPublishCommunityPost?: (postContent: string) => void;
}

const CATEGORY_NAMES: Record<string, { label: string; icon: any; short: string; color: string }> = {
  all: { label: 'Все разделы (500)', icon: BookOpen, short: 'Все 500', color: 'text-indigo-400' },
  space_biology: {
    label: 'Биология и микроорганизмы (50)',
    icon: Dna,
    short: 'Биология',
    color: 'text-emerald-400',
  },
  crystallography: {
    label: 'Рост кристаллов и химия (50)',
    icon: FlaskConical,
    short: 'Кристаллы',
    color: 'text-purple-400',
  },
  orbital_physics: {
    label: 'Физика космоса и геомагнетизм (50)',
    icon: Atom,
    short: 'Физ. космоса',
    color: 'text-cyan-400',
  },
  earth_observation: {
    label: 'ДЗЗ, геология и геодезия (50)',
    icon: Globe,
    short: 'ДЗЗ и Геология',
    color: 'text-teal-400',
  },
  payload_optics: {
    label: 'Оптические системы и спектры (50)',
    icon: Layers,
    short: 'Оптика',
    color: 'text-amber-400',
  },
  quantum_radio: {
    label: 'Квантовая связь и радиофизика (50)',
    icon: Rocket,
    short: 'Квант и Радио',
    color: 'text-blue-400',
  },
  ballistics: {
    label: 'Баллистика и небесная механика (50)',
    icon: Compass,
    short: 'Баллистика',
    color: 'text-sky-400',
  },
  astrophysics: {
    label: 'Астрофизика и космические лучи (50)',
    icon: Sparkles,
    short: 'Астрофизика',
    color: 'text-yellow-400',
  },
  thermodynamics: {
    label: 'Термодинамика и теплообмен (50)',
    icon: Atom,
    short: 'Термодинамика',
    color: 'text-orange-400',
  },
  propulsion_energy: {
    label: 'Двигатели и энергетика CubeSat (50)',
    icon: Rocket,
    short: 'Энергия и ЭРД',
    color: 'text-rose-400',
  },
};

const CREW_ROLES_LIST = [
  { key: 'all', label: 'Все роли экипажа', icon: UserCheck },
  { key: 'physicist', label: 'Бортовой Физик', icon: Atom },
  { key: 'ballistician', label: 'Штурман-Баллистик', icon: Compass },
  { key: 'biologist', label: 'Биолог / Астробиолог', icon: Dna },
  { key: 'chemist', label: 'Химик / Материаловед', icon: FlaskConical },
  { key: 'geographer', label: 'Географ / Геолог', icon: Globe },
  { key: 'mathematician', label: 'Орбитальный Аналитик', icon: Calculator },
  { key: 'programmer', label: 'Инженер-Программист', icon: Code },
  { key: 'philologist', label: 'Научный Филолог', icon: FileText },
  { key: 'captain', label: 'Капитан корабля', icon: Shield },
];

export const CaseTaskDirectoryModal: React.FC<CaseTaskDirectoryModalProps> = ({
  isOpen,
  onClose,
  targetTeam = null,
  allTeams = [],
  tasks,
  onSelectTask,
  onClearTask,
  currentUser,
  onPublishCommunityPost,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'free' | 'taken'>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [activeRoleTabMap, setActiveRoleTabMap] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [postPublishedSuccess, setPostPublishedSuccess] = useState<string | null>(null);
  const [assignTeamId, setAssignTeamId] = useState<string>(targetTeam?.id || allTeams[0]?.id || '');

  const PAGE_SIZE = 12;

  // Build a lookup map of taskId -> occupying team (excluding the targetTeam)
  const takenTaskMap = useMemo(() => {
    const map = new Map<string, CrmTeamRecord>();
    allTeams.forEach((t) => {
      if (t.selectedTaskId && (!targetTeam || t.id !== targetTeam.id)) {
        map.set(t.selectedTaskId, t);
      }
    });
    return map;
  }, [allTeams, targetTeam]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesNum = task.cardNumber.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        const matchesGrandGoal = task.grandMissionGoal?.toLowerCase().includes(q);
        const matchesKeywords = task.physicsKeywords?.some((k) => k.toLowerCase().includes(q));
        const matchesFormulas = task.keyFormulas?.some((f) => f.toLowerCase().includes(q));

        if (
          !matchesTitle &&
          !matchesNum &&
          !matchesDesc &&
          !matchesGrandGoal &&
          !matchesKeywords &&
          !matchesFormulas
        ) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'all') {
        if (task.category !== selectedCategory && task.categoryLabel !== selectedCategory) {
          return false;
        }
      }

      // Role filter
      if (selectedRoleFilter !== 'all' && task.roleAssignments) {
        if (!task.roleAssignments[selectedRoleFilter]) {
          return false;
        }
      }

      // Availability status
      const isTaken = takenTaskMap.has(task.id);
      const isCurrentTeam = targetTeam?.selectedTaskId === task.id;

      if (statusFilter === 'free') {
        return !isTaken || isCurrentTeam;
      }
      if (statusFilter === 'taken') {
        return isTaken && !isCurrentTeam;
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    selectedCategory,
    selectedRoleFilter,
    statusFilter,
    takenTaskMap,
    targetTeam,
  ]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, currentPage]);

  if (!isOpen) return null;

  const currentSelectionTaskId = targetTeam?.selectedTaskId;
  const freeCount = tasks.filter(
    (t) => !takenTaskMap.has(t.id) || t.id === currentSelectionTaskId,
  ).length;
  const takenCount = tasks.length - freeCount;

  const handleSelect = (task: CaseTask) => {
    audioService.playSuccessChime();
    if (onSelectTask) {
      onSelectTask(task.id, task.title);
    }
    onClose();
  };

  const handleClear = () => {
    audioService.playClickSound();
    if (onClearTask) {
      onClearTask();
    } else if (onSelectTask) {
      onSelectTask('', '');
    }
    onClose();
  };

  const handleToggleExpand = (taskId: string) => {
    audioService.playClickSound();
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  const handlePublishRolePost = (task: CaseTask, roleKey: string) => {
    const roleDetail = task.roleAssignments?.[roleKey];
    if (!roleDetail) return;

    const formattedPost =
      `📡 [ОТЧЕТ ПО МИССИИ «${task.cardNumber}»]\n` +
      `Роль: ${roleDetail.roleTitle}\n` +
      `Специалист: ${currentUser?.name || 'Член экипажа'}\n` +
      `Тема: ${roleDetail.taskTitle}\n\n` +
      `🔬 Теоретический результат:\n${roleDetail.scientificDeliverable}\n\n` +
      `🌐 Сообщество корабля:\n${roleDetail.socialCommunityPostRequirement}`;

    if (onPublishCommunityPost) {
      onPublishCommunityPost(formattedPost);
      setPostPublishedSuccess(task.id + '-' + roleKey);
      audioService.playSuccessChime();
      setTimeout(() => setPostPublishedSuccess(null), 4000);
    } else {
      audioService.playSuccessChime();
      alert(`Отчёт успешно сформирован!\n\n${formattedPost}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-6xl max-h-[94vh] flex flex-col bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/95 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                Справочник заданий чемпионата «КОСМОПОРТ»
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-[11px] font-mono font-bold text-cyan-300">
                500 кейсов CubeSat
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              Реестр космических задач и ролевая модель экипажа
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-0.5">
              {targetTeam ? (
                <>
                  <span>Выбор для экипажа:</span>
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-950 border border-indigo-500/40 text-cyan-300 font-mono font-bold">
                    {targetTeam.shipCallsign || `Борт-0${targetTeam.orderNumber}`}
                  </span>
                  <span className="font-bold text-white">«{targetTeam.shipName}»</span>
                  <span className="text-slate-400">({targetTeam.school})</span>
                </>
              ) : (
                <span className="text-slate-400">
                  10 предметных направлений по 50 задач • Теоретическая и практическая части •
                  Подзадачи для 9 ролей
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {targetTeam && currentSelectionTaskId && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Освободить выбранное задание"
              >
                <X className="w-3.5 h-3.5" />
                <span>Освободить кейс</span>
              </button>
            )}
            <button
              onClick={() => {
                audioService.playClickSound();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Закрыть справочник"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rule Alert Banner */}
        <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 border-b border-indigo-500/20 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-indigo-200">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Структура кейсов</strong>: общая цель миссии, спецификация CubeSat, теория
              (формулы и физика) и персональные подзадачи биологам, географам, физикам, баллистикам,
              химикам, математикам, программистам, филологам и капитану.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
            <span className="text-emerald-400 font-bold">Свободно: {freeCount}</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-bold">Занято: {takenCount}</span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-3 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Поиск по названию, формуле, номеру (БИО-01), физическим явлениям или роли…"
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Quick Filter */}
            <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Все ({tasks.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('free');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  statusFilter === 'free'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Свободные ({freeCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('taken');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  statusFilter === 'taken'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Занятые ({takenCount})
              </button>
            </div>
          </div>

          {/* 10 Subject Areas Filter Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-cyan-400" />
                Предметная область (10 направлений по 50 задач):
              </span>
              <span className="text-cyan-400 font-bold">
                Найдено: {filteredTasks.length} кейсов
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              {Object.entries(CATEGORY_NAMES).map(([catKey, info]) => {
                const Icon = info.icon;
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(catKey);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-1 ring-indigo-400/50'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : info.color}`} />
                    <span>{info.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Crew Roles Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/60 text-xs">
            <span className="text-slate-500 text-[11px] font-mono mr-1 flex items-center gap-1 shrink-0">
              <UserCheck className="w-3 h-3 text-indigo-400" />
              Подзадачи для роли:
            </span>
            {CREW_ROLES_LIST.map((role) => {
              const RoleIcon = role.icon;
              const isSelected = selectedRoleFilter === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => {
                    setSelectedRoleFilter(role.key);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer text-[11px] flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                      : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                  }`}
                >
                  <RoleIcon className="w-3 h-3 text-amber-400" />
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Task Cards List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 no-scrollbar">
          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                Заданий по выбранным фильтрам не найдено
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedRoleFilter('all');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-xs text-white font-bold hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                Сбросить фильтры поиска
              </button>
            </div>
          ) : (
            paginatedTasks.map((task) => {
              const isCurrentSelection = currentSelectionTaskId === task.id;
              const occupyingTeam = takenTaskMap.get(task.id);
              const isTaken = !!occupyingTeam && !isCurrentSelection;
              const isExpanded = expandedTaskId === task.id;
              const currentActiveRoleTab = activeRoleTabMap[task.id] || 'physicist';

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border transition-all relative overflow-hidden ${
                    isCurrentSelection
                      ? 'bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl'
                      : isTaken
                        ? 'bg-slate-950/70 border-slate-800/80 opacity-85'
                        : 'bg-slate-950/90 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/90 shadow-md'
                  }`}
                >
                  {/* Card Header & Main Overview */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Left: Task Core Meta */}
                      <div className="space-y-2 flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 font-mono text-cyan-300 font-bold text-xs">
                            {task.cardNumber}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-indigo-300 text-xs font-semibold">
                            {task.categoryLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-mono">
                            {task.difficulty}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-400 text-[11px] flex items-center gap-1 font-mono">
                            <GraduationCap className="w-3 h-3 text-cyan-400" />
                            {task.schoolGradeRange}
                          </span>

                          {/* Availability Pill */}
                          {isCurrentSelection ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Текущий выбор этого борта
                            </span>
                          ) : isTaken ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-400" />
                              Занято: {occupyingTeam.shipCallsign} «{occupyingTeam.shipName}»
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              Свободно для выбора
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                          {task.title}
                        </h3>

                        {/* Grand Mission Goal Highlight */}
                        {task.grandMissionGoal && (
                          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 space-y-1">
                            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-amber-400" />
                              Большая общая цель экипажа корабля:
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed font-medium">
                              {task.grandMissionGoal}
                            </p>
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-xs text-slate-300 leading-relaxed">{task.description}</p>

                        {/* CubeSat Hardware Specifications */}
                        {task.cubesatSpecs && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                              Формат: <strong>{task.cubesatSpecs.format}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300">
                              Орбита: {task.cubesatSpecs.orbitType} ({task.cubesatSpecs.altitudeKm}{' '}
                              км, i={task.cubesatSpecs.inclinationDeg}°)
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                              Нагрузка: {task.cubesatSpecs.primaryPayload}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                              Мощность: {task.cubesatSpecs.powerConsumptionWatts} Вт
                            </span>
                          </div>
                        )}

                        {/* Physics Keywords */}
                        {task.physicsKeywords && task.physicsKeywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                              <Atom className="w-3 h-3 text-indigo-400" /> Физические явления:
                            </span>
                            {task.physicsKeywords.slice(0, 5).map((kw, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono"
                              >
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                        {targetTeam && (
                          <>
                            {isCurrentSelection ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                  <Check className="w-4 h-4" /> Закреплено
                                </span>
                                <button
                                  type="button"
                                  onClick={handleClear}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Снять
                                </button>
                              </div>
                            ) : isTaken ? (
                              <div className="flex flex-col items-start md:items-end text-right">
                                <button
                                  disabled
                                  className="px-3.5 py-1.5 rounded-xl bg-slate-800/60 text-slate-500 border border-slate-800 text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Занято</span>
                                </button>
                                <span className="text-[10px] text-amber-400 font-mono mt-0.5">
                                  {occupyingTeam.shipName}
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelect(task)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-700 hover:from-cyan-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-950/50 hover:shadow-cyan-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                                <span>Выбрать борт</span>
                              </button>
                            )}
                          </>
                        )}

                        {/* Toggle Detailed Passport */}
                        <button
                          type="button"
                          onClick={() => handleToggleExpand(task.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-slate-800'
                          }`}
                        >
                          <span>{isExpanded ? 'Свернуть паспорт' : 'Паспорт и 9 ролей'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDABLE SECTION: THEORETICAL & PRACTICAL PARTS + ROLE ASSIGNMENTS */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-slate-950 p-4 sm:p-6 space-y-5 animate-fadeIn">
                      {/* Section 1: Theoretical Part (Formulas & Space Phenomena) */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                          <Atom className="w-4 h-4 text-cyan-400" />
                          <span>1. Теоретическая часть: физические явления и формулы</span>
                        </div>

                        {/* Key Formulas */}
                        {task.theoreticalPart?.formulas &&
                          task.theoreticalPart.formulas.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {task.theoreticalPart.formulas.map((form, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1"
                                >
                                  <div className="text-[11px] font-semibold text-indigo-300">
                                    {form.title}
                                  </div>
                                  <div className="p-2 rounded bg-slate-950 font-mono text-cyan-300 text-xs border border-slate-800/80">
                                    {form.latex}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {form.description}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                        {/* Diagrams & Phenomena Description */}
                        {task.theoreticalPart?.phenomenaDescription && (
                          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
                            <span className="font-bold text-amber-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Поведение кубсата и физические явления в космосе:
                            </span>
                            <p className="text-slate-300 leading-relaxed">
                              {task.theoreticalPart.phenomenaDescription}
                            </p>
                            {task.theoreticalPart.diagramDescription && (
                              <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
                                📊 <strong>Графики и диаграммы</strong>:{' '}
                                {task.theoreticalPart.diagramDescription}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Section 2: Role Assignments for the 9 Crew Specialists */}
                      {task.roleAssignments && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                              <UserCheck className="w-4 h-4 text-amber-400" />
                              <span>2. Ролевая модель экипажа: персональные подзадачи</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Подзадачи распределены каждому члену команды
                            </span>
                          </div>

                          {/* Role selector tabs within card */}
                          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                            {Object.entries(task.roleAssignments).map(([roleKey, roleVal]) => {
                              const isActive = currentActiveRoleTab === roleKey;
                              return (
                                <button
                                  key={roleKey}
                                  type="button"
                                  onClick={() =>
                                    setActiveRoleTabMap((prev) => ({ ...prev, [task.id]: roleKey }))
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                                    isActive
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  <span>{roleVal.roleTitle}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Active Role Content Card */}
                          {task.roleAssignments[currentActiveRoleTab] &&
                            (() => {
                              const activeRoleData = task.roleAssignments[currentActiveRoleTab];
                              const isPublishSuccess =
                                postPublishedSuccess === `${task.id}-${currentActiveRoleTab}`;

                              return (
                                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                                    <div className="space-y-0.5">
                                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                                        {activeRoleData.roleTitle}
                                      </span>
                                      <h4 className="text-sm font-bold text-white">
                                        {activeRoleData.taskTitle}
                                      </h4>
                                    </div>

                                    {/* One-click publish to ship community */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePublishRolePost(task, currentActiveRoleTab)
                                      }
                                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                                        isPublishSuccess
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                      }`}
                                    >
                                      {isPublishSuccess ? (
                                        <>
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Отчёт отправлен в сообщество!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Send className="w-3.5 h-3.5" />
                                          <span>Опубликовать отчёт в сообщество корабля</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <div className="space-y-2 text-xs">
                                    <div>
                                      <strong className="text-slate-200">
                                        Персональное задание роли:
                                      </strong>
                                      <p className="text-slate-300 leading-relaxed mt-0.5">
                                        {activeRoleData.taskDescription}
                                      </p>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                                      <span className="text-[11px] font-mono text-cyan-400 font-bold">
                                        🔬 Ожидаемый научный результат / формула / график:
                                      </span>
                                      <p className="text-slate-300 text-xs leading-relaxed">
                                        {activeRoleData.scientificDeliverable}
                                      </p>
                                    </div>

                                    <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1">
                                      <span className="text-[11px] font-mono text-indigo-300 font-bold">
                                        🌐 Требование к публикации в сообщество космического
                                        корабля:
                                      </span>
                                      <p className="text-slate-300 text-xs leading-relaxed">
                                        {activeRoleData.socialCommunityPostRequirement}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                        </div>
                      )}

                      {/* Section 3: Practical Community Part */}
                      {task.practicalCommunityMission && (
                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
                          <span className="font-bold text-cyan-400 flex items-center gap-1.5 font-mono">
                            <Share2 className="w-3.5 h-3.5" />
                            3. Практическая часть миссии в бортовой сети:
                          </span>
                          <p className="text-slate-300 leading-relaxed">
                            {task.practicalCommunityMission}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Pagination */}
        <div className="p-3 sm:px-6 border-t border-slate-800 bg-slate-950/95 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Info */}
          <div className="text-slate-400 flex flex-wrap items-center gap-2">
            <span>Показано:</span>
            <strong className="text-white">
              {Math.min(filteredTasks.length, (currentPage - 1) * PAGE_SIZE + 1)}–
              {Math.min(filteredTasks.length, currentPage * PAGE_SIZE)}
            </strong>
            <span>из</span>
            <strong className="text-cyan-400">{filteredTasks.length}</strong>
            <span>кейсов</span>
            {targetTeam && (
              <>
                <span className="text-slate-600">|</span>
                <span>Выбранный борт:</span>
                <span className="font-bold text-white">
                  {targetTeam.shipCallsign} «{targetTeam.shipName}»
                </span>
              </>
            )}
          </div>

          {/* Center: Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  audioService.playClickSound();
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Назад
              </button>
              <span className="px-2 text-xs font-mono text-cyan-400">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => {
                  audioService.playClickSound();
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Вперёд →
              </button>
            </div>
          )}

          {/* Right: Close button */}
          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
