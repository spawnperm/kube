/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Главный экран личного кабинета: Бортовой мостик и Профиль космического корабля
 *
 * Включает:
 * 1. Профиль корабля (название, цель миссии, внешний вид 3U, уровень плазменного топлива 0-100%).
 * 2. Кресла экипажа: Капитан (педагог), Штурман AI Кубик (оркестратор) и 3 школьника (роли и подзадачи).
 * 3. Специальная форма загрузки 3-х слайдов:
 *    - Слайд 1: Представление команды, название корабля, список участников и фото команды.
 *    - Слайд 2: Теоретическая часть (формулы, графики, диаграммы).
 *    - Слайд 3: Практическая применимость решения в космосе (персональное видение каждого участника).
 * 4. Кнопка «🖥️ Демонстрация презентации с экрана» (полноэкранная защита перед ЦУП).
 * 5. Маскот Кубик: справки из Википедии по школьным дисциплинам (Физика, Химия, Биология, Математика).
 * 6. Официальная почта капитана и планировщик этапов чемпионата (Смирнов А.А., Песин М.В., Анисимова А.С.).
 */

import React, { useState } from 'react';
import {
  Rocket,
  Flame,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  FileText,
  Bot,
  HelpCircle,
  Timer,
  Download,
  Award,
  Zap,
  Cpu,
  Layers,
  ShieldCheck,
  Radio,
  Atom,
  Box,
  Users,
  Mail,
  BookOpen,
  Image as ImageIcon,
  Play,
  Check,
  Send,
  Edit3,
  Plus,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  Team,
  DailyQuest,
  ChampionshipStage,
  CrmNotificationEmail,
  CrmChampionshipStage,
  RoleSubtask,
  CaseTask,
  CrewRoleDefinition,
  TeamMember,
} from '@/src/shared/types/index';
import { CHAMPIONSHIP_STAGES, CASE_TASKS } from '@/src/shared/data/mockData';
import { CRM_TEAMS_DATABASE } from '@/src/contexts/crew/data/crmTeamsData';
import { audioService } from '@/src/shared/lib/audioService';
import { StarterQuizModal } from '@/src/contexts/crew/components/StarterQuizModal';
import { PresentationModeModal } from '@/src/contexts/project/components/PresentationModeModal';
import { WikipediaHelpModal } from '@/src/contexts/ai/components/WikipediaHelpModal';
import { CaptainEmailModal } from '@/src/contexts/crew/components/CaptainEmailModal';
import { CrmStagesScheduler } from '@/src/contexts/crew/components/CrmStagesScheduler';
import {
  INITIAL_NOTIFICATIONS_EMAILS,
  CHAMPIONSHIP_STAGES_CRM,
  taskRolesService,
} from '@/src/contexts/crew/services/taskRolesService';

interface DashboardHubProps {
  user: UserProfile;
  team: Team;
  dailyQuests: DailyQuest[];
  onClaimDaily: (questId?: string) => void;
  onNavigateTab: (tab: string, subView?: string) => void;
  onOpenWaitlist: () => void;
  onOpenAiRegistration?: (teamId?: string) => void;
  onUpdateTeam?: (team: Team) => void;
  isOnline: boolean;
}

export const DashboardHub: React.FC<DashboardHubProps> = ({
  user,
  team,
  dailyQuests,
  onClaimDaily,
  onNavigateTab,
  onOpenWaitlist,
  onOpenAiRegistration,
  onUpdateTeam,
  isOnline,
}) => {
  const [claimedDailyStreak, setClaimedDailyStreak] = useState(false);

  // Modals state
  const [isStarterQuizOpen, setIsStarterQuizOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isWikiHelpOpen, setIsWikiHelpOpen] = useState(false);
  const [wikiSearchQuery, setWikiSearchQuery] = useState('');
  const [isCaptainEmailOpen, setIsCaptainEmailOpen] = useState(false);
  const [activeSlideTab, setActiveSlideTab] = useState<1 | 2 | 3>(1);

  // Emails and scheduler state
  const [captainEmails, setCaptainEmails] = useState<CrmNotificationEmail[]>(
    INITIAL_NOTIFICATIONS_EMAILS,
  );
  const [crmStages, setCrmStages] = useState<CrmChampionshipStage[]>(CHAMPIONSHIP_STAGES_CRM);
  const [showSchedulerSection, setShowSchedulerSection] = useState(false);

  // Slide 1 Team Photo edit state
  const [teamPhotoUrlInput, setTeamPhotoUrlInput] = useState(
    team.teamPhotoUrl ||
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  );
  const [photoSavedNotice, setPhotoSavedNotice] = useState(false);

  // Slide 2 Formulas & Calculations state
  const [slide2Formula, setSlide2Formula] = useState(
    team.slides[1]?.formulaLatex ||
      'a_{drag} = \\frac{1}{2} C_D \\frac{A}{m} \\rho v^2, \\quad \\Delta r_{rev} = -2\\pi \\frac{C_D A}{m} \\rho r^2',
  );
  const [slide2Calculations, setSlide2Calculations] = useState(
    team.slides[1]?.calculations ||
      'Плотность термосферы на 400 км принята равной 2.8 × 10⁻¹² кг/м³. Баллистический коэффициент кубсата 3U: B = 0.015 м²/кг. Время жизни орбиты до входа в плотные слои — 2.4 года.',
  );

  // Slide 3 Reflections state
  const [reflections, setReflections] = useState(team.memberReflections || []);

  // 1. Ship name inline editing state
  const [isEditingShipName, setIsEditingShipName] = useState(false);
  const [shipNameInput, setShipNameInput] = useState(team.shipName || team.name || 'Звёздный-81');

  // 2. Select mission goal / task modal state
  const [isSelectTaskModalOpen, setIsSelectTaskModalOpen] = useState(false);

  // 3. CRM Roles state (extensible from taskRolesService)
  const [availableRoles, setAvailableRoles] = useState<CrewRoleDefinition[]>(() =>
    taskRolesService.getAvailableRoles(),
  );

  // 4. Inscribe new student modal state
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('9А');
  const [newStudentRole, setNewStudentRole] = useState('physicist');
  const [newStudentSchool, setNewStudentSchool] = useState(
    team.school || 'МАОУ «СОШ №81» г. Перми',
  );

  // 5. Assign student from CRM modal state
  const [isAssignFromCrmModalOpen, setIsAssignFromCrmModalOpen] = useState(false);
  const [crmSearchQuery, setCrmSearchQuery] = useState('');

  // 6. Add new CRM role modal state
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleCategory, setNewRoleCategory] =
    useState<CrewRoleDefinition['category']>('exact_sciences');
  const [newRoleCategoryLabel, setNewRoleCategoryLabel] = useState('Точные науки');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleDiscipline, setNewRoleDiscipline] = useState('Космическая физика');

  // Active subtasks computation
  const currentRoleSubtasks = React.useMemo(() => {
    if (team.roleSubtasks && team.roleSubtasks.length > 0) {
      return team.roleSubtasks;
    }
    const task = CASE_TASKS.find((c) => c.id === team.selectedTaskId) || CASE_TASKS[0];
    const crewInput = team.members.map((m) => ({
      studentName: m.name,
      role: m.assignedRole || m.role,
    }));
    return taskRolesService.generateSubtasksForTeam(
      task.id,
      team.selectedTaskTitle || task.title,
      crewInput,
      team.mentorName,
    );
  }, [
    team.roleSubtasks,
    team.selectedTaskId,
    team.selectedTaskTitle,
    team.members,
    team.mentorName,
  ]);

  const handleSaveShipName = () => {
    if (!shipNameInput.trim()) return;
    const updated: Team = {
      ...team,
      shipName: shipNameInput.trim(),
      name: shipNameInput.trim(),
    };
    if (onUpdateTeam) onUpdateTeam(updated);
    setIsEditingShipName(false);
    audioService.playSuccessChime();
  };

  const handleSelectCaseTask = (task: CaseTask) => {
    const crewInput = team.members.map((m) => ({
      studentName: m.name,
      role: m.assignedRole || m.role,
    }));
    const newSubtasks = taskRolesService.generateSubtasksForTeam(
      task.id,
      task.title,
      crewInput,
      team.mentorName,
    );
    const updated: Team = {
      ...team,
      selectedTaskId: task.id,
      selectedTaskTitle: task.title,
      roleSubtasks: newSubtasks,
      currentStage: team.currentStage === 'registration' ? 'case_selected' : team.currentStage,
    };
    if (onUpdateTeam) onUpdateTeam(updated);
    setIsSelectTaskModalOpen(false);
    audioService.playSuccessChime();
  };

  const handleChangeMemberRole = (memberId: string, newRoleKey: string) => {
    const roleDef = taskRolesService.getRoleDefinition(newRoleKey);
    const updatedMembers = team.members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          assignedRole: newRoleKey as any,
          role: newRoleKey as any,
          roleTitle: roleDef?.title || newRoleKey,
          discipline: (roleDef?.defaultDiscipline as any) || m.discipline,
        };
      }
      return m;
    });
    const crewInput = updatedMembers.map((m) => ({
      studentName: m.name,
      role: m.assignedRole || m.role,
    }));
    const newSubtasks = taskRolesService.generateSubtasksForTeam(
      team.selectedTaskId || 'task-01',
      team.selectedTaskTitle || 'Баллистика и время жизни в термосфере',
      crewInput,
      team.mentorName,
    );
    const updated: Team = {
      ...team,
      members: updatedMembers,
      roleSubtasks: newSubtasks,
    };
    if (onUpdateTeam) onUpdateTeam(updated);
    audioService.playClickSound();
  };

  const handleInscribeStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const roleDef = taskRolesService.getRoleDefinition(newStudentRole);
    const newMember: TeamMember = {
      id: `m-manual-${Date.now()}`,
      name: newStudentName.trim(),
      grade: parseInt(newStudentGrade.replace(/\D/g, '')) || 9,
      gradeText: newStudentGrade.trim(),
      email: `${newStudentName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@perm-school.ru`,
      role: newStudentRole as any,
      assignedRole: newStudentRole as any,
      roleTitle: roleDef?.title || newStudentRole,
      discipline: (roleDef?.defaultDiscipline as any) || 'Физика',
      status: 'active',
      registeredAt: new Date().toLocaleDateString(),
    };

    const updatedMembers = [...team.members, newMember];
    const crewInput = updatedMembers.map((m) => ({
      studentName: m.name,
      role: m.assignedRole || m.role,
    }));
    const newSubtasks = taskRolesService.generateSubtasksForTeam(
      team.selectedTaskId || 'task-01',
      team.selectedTaskTitle || 'Баллистика и время жизни в термосфере',
      crewInput,
      team.mentorName,
    );
    const updated: Team = {
      ...team,
      members: updatedMembers,
      roleSubtasks: newSubtasks,
    };
    if (onUpdateTeam) onUpdateTeam(updated);
    setIsAddStudentModalOpen(false);
    setNewStudentName('');
    audioService.playSuccessChime();
  };

  const handleAssignStudentFromCrm = (student: {
    name: string;
    gradeText: string;
    assignedRole: string;
    discipline: string;
  }) => {
    const roleDef = taskRolesService.getRoleDefinition(student.assignedRole);
    const newMember: TeamMember = {
      id: `m-crm-${Date.now()}`,
      name: student.name,
      grade: parseInt(student.gradeText.replace(/\D/g, '')) || 9,
      gradeText: student.gradeText,
      email: `${student.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@perm-school.ru`,
      role: student.assignedRole as any,
      assignedRole: student.assignedRole as any,
      roleTitle: roleDef?.title || student.assignedRole,
      discipline: (student.discipline as any) || 'Физика',
      status: 'active',
      registeredAt: new Date().toLocaleDateString(),
    };

    const updatedMembers = [...team.members, newMember];
    const crewInput = updatedMembers.map((m) => ({
      studentName: m.name,
      role: m.assignedRole || m.role,
    }));
    const newSubtasks = taskRolesService.generateSubtasksForTeam(
      team.selectedTaskId || 'task-01',
      team.selectedTaskTitle || 'Баллистика и время жизни в термосфере',
      crewInput,
      team.mentorName,
    );
    const updated: Team = {
      ...team,
      members: updatedMembers,
      roleSubtasks: newSubtasks,
    };
    if (onUpdateTeam) onUpdateTeam(updated);
    setIsAssignFromCrmModalOpen(false);
    audioService.playSuccessChime();
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const currentList =
      team.roleSubtasks && team.roleSubtasks.length > 0 ? team.roleSubtasks : currentRoleSubtasks;
    const updatedSubtasks = currentList.map((st) => {
      if (st.id === subtaskId) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });
    const updated: Team = {
      ...team,
      roleSubtasks: updatedSubtasks,
    };
    if (onUpdateTeam) onUpdateTeam(updated);
    audioService.playClickSound();
  };

  const handleSaveNewCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim()) return;
    taskRolesService.addCustomRole({
      title: newRoleTitle,
      category: newRoleCategory,
      categoryLabel: newRoleCategoryLabel,
      shortDesc: newRoleDesc || 'Специализированная роль в экипаже корабля',
      defaultDiscipline: newRoleDiscipline || 'Космические технологии',
    });
    setAvailableRoles(taskRolesService.getAvailableRoles());
    setIsAddRoleModalOpen(false);
    setNewRoleTitle('');
    setNewRoleDesc('');
    audioService.playSuccessChime();
  };

  const handleClaimDailyBonus = () => {
    if (claimedDailyStreak) return;
    setClaimedDailyStreak(true);
    audioService.playSuccessChime();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onClaimDaily();
  };

  const handleDownloadIcs = () => {
    window.location.href = '/api/calendar.ics';
    audioService.playSuccessChime();
  };

  // Fuel quiz complete handler
  const handleStarterQuizComplete = (newFuel: number) => {
    const updatedTeam: Team = {
      ...team,
      fuelPercent: newFuel,
      starterQuizPassed: true,
      currentStage: team.currentStage === 'registration' ? 'case_selected' : team.currentStage,
    };
    if (onUpdateTeam) onUpdateTeam(updatedTeam);
    audioService.playSuccessChime();
  };

  // Save team photo
  const handleSaveTeamPhoto = () => {
    const updatedTeam: Team = {
      ...team,
      teamPhotoUrl: teamPhotoUrlInput,
    };
    if (onUpdateTeam) onUpdateTeam(updatedTeam);
    setPhotoSavedNotice(true);
    setTimeout(() => setPhotoSavedNotice(false), 3000);
    audioService.playSuccessChime();
  };

  // Save Slide 2 Formulas
  const handleSaveSlide2 = () => {
    const newSlides = [...team.slides];
    if (newSlides[1]) {
      newSlides[1] = {
        ...newSlides[1],
        formulaLatex: slide2Formula,
        calculations: slide2Calculations,
        updatedAt: new Date().toISOString(),
      };
    }
    const updatedTeam: Team = {
      ...team,
      slides: newSlides as [
        (typeof team.slides)[0],
        (typeof team.slides)[1],
        (typeof team.slides)[2],
      ],
    };
    if (onUpdateTeam) onUpdateTeam(updatedTeam);
    audioService.playSuccessChime();
  };

  // Update a member's reflection on Slide 3
  const handleUpdateReflection = (idx: number, text: string) => {
    const nextReflections = [...reflections];
    if (nextReflections[idx]) {
      nextReflections[idx] = { ...nextReflections[idx], text };
      setReflections(nextReflections);

      const updatedTeam: Team = {
        ...team,
        memberReflections: nextReflections,
      };
      if (onUpdateTeam) onUpdateTeam(updatedTeam);
    }
  };

  // Broadcast stage from CRM scheduler
  const handleBroadcastStage = (stage: CrmChampionshipStage, letter: CrmNotificationEmail) => {
    setCaptainEmails((prev) => [letter, ...prev]);
    setCrmStages((prev) =>
      prev.map((s) =>
        s.id === stage.id ? { ...s, notificationSent: true, status: 'current' } : s,
      ),
    );
  };

  const openWikiWithQuery = (q: string) => {
    setWikiSearchQuery(q);
    setIsWikiHelpOpen(true);
  };

  const unreadEmailsCount = captainEmails.filter((e) => !e.isRead).length;

  // Readiness checklist computation
  const checklist = [
    { label: 'Регистрация корабля и назначение Капитана', done: true },
    { label: 'Стартовый квиз и заправка плазменных баков', done: (team.fuelPercent || 0) >= 60 },
    { label: 'Штатное расписание: 3 школьника и Штурман Кубик', done: team.members.length >= 3 },
    { label: 'Слайд 1: Загружено командное фото экипажа', done: Boolean(team.teamPhotoUrl) },
    { label: 'Слайд 2: Теория, формулы и графики', done: Boolean(team.slides[1]?.formulaLatex) },
    {
      label: 'Слайд 3: Практическое видение каждого участника',
      done: (team.memberReflections?.length || 0) >= 3,
    },
  ];

  const completedSteps = checklist.filter((i) => i.done).length;
  const progressPercent = Math.round((completedSteps / checklist.length) * 100);

  const isEarthMCC = user.role === 'admin' || user.role === 'organizer';
  const currentFuel = team.fuelPercent !== undefined ? team.fuelPercent : 85;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. HERO BANNER: STARSHIP BRIDGE OR EARTH MISSION CONTROL CENTER */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 flex-wrap">
              {isEarthMCC ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Центр Управления Полётами (ЦУП)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold font-mono text-[10px] flex items-center gap-1">
                  <Rocket className="w-3.5 h-3.5 text-cyan-400" />
                  Бортовой мостик «{team.shipName || team.name}»
                </span>
              )}
              <span>·</span>
              <span className="font-mono text-slate-300 font-semibold">
                {team.shipCallsign || 'Борт-01'}
              </span>
              <span>·</span>
              <span className="text-slate-300">{team.school}</span>
              <span>·</span>
              <span className="text-cyan-400 font-medium">{team.cubesatFormat} CubeSat</span>
            </div>

            {isEditingShipName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={shipNameInput}
                  onChange={(e) => setShipNameInput(e.target.value)}
                  className="bg-slate-950 border border-cyan-500 rounded-xl px-3 py-1.5 text-base font-bold text-white focus:outline-none"
                  placeholder="Название корабля"
                />
                <button
                  onClick={handleSaveShipName}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setIsEditingShipName(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5 flex-wrap">
                <span>Корабль «{team.shipName || team.name}»</span>
                <button
                  onClick={() => {
                    setShipNameInput(team.shipName || team.name || '');
                    setIsEditingShipName(true);
                  }}
                  title="Изменить название корабля (Командир)"
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium hidden sm:inline">Переименовать</span>
                </button>
                <span className="text-sm px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-normal border border-slate-700 hidden sm:inline">
                  {team.selectedTaskTitle || 'Баллистика и время жизни в термосфере'}
                </span>
              </h1>
            )}

            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Экипаж: Капитан <strong>{team.mentorName}</strong>, Штурман AI Кубик и{' '}
              {team.members.length} специалистов. Корабль готов к защите перед руководством ЦУП
              (Смирнов А.А., Песин М.В., Анисимова А.С.).
            </p>
          </div>

          {/* Quick Action Buttons (Presentation Mode, Fuel Quiz, Captain Email, Wiki) */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 shrink-0">
            {/* Presentation Mode Button */}
            <button
              onClick={() => setIsPresentationOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all transform hover:scale-[1.02]"
              title="Открыть презентацию на весь экран для защиты перед жюри"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>🖥️ Демонстрация слайдов</span>
            </button>

            {/* Official Captain Email */}
            <button
              onClick={() => setIsCaptainEmailOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-all relative"
              title="Официальные извещения от руководства ЦУП"
            >
              <Mail className="w-4 h-4 text-amber-400" />
              <span>Почта капитана</span>
              {unreadEmailsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center -ml-0.5">
                  {unreadEmailsCount}
                </span>
              )}
            </button>

            {/* Wikipedia Mascot Help */}
            <button
              onClick={() => openWikiWithQuery('CubeSat')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-all"
              title="Энциклопедические справки по дисциплинам"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Википедия</span>
            </button>
          </div>
        </div>

        {/* FUEL TANK GAUGE (ПЛАЗМЕННОЕ ТОПЛИВО) */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-5 p-5 rounded-b-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">⛽</span>
              <span className="text-xs font-bold text-slate-200">Плазменные баки корабля:</span>
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                  currentFuel >= 80
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : currentFuel >= 40
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {currentFuel}% топлива
              </span>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                (Уровень определяется прохождением стартового научного квиза)
              </span>
            </div>

            <button
              onClick={() => setIsStarterQuizOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/25 transition-all self-start sm:self-auto"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {team.starterQuizPassed
                  ? 'Пройти квиз заново'
                  : '⚡ Заправить баки: Стартовый квиз'}
              </span>
            </button>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                currentFuel >= 80
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                  : currentFuel >= 40
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500'
              }`}
              style={{ width: `${Math.max(currentFuel, 5)}%` }}
            />
          </div>
        </div>
      </section>

      {/* 1.5 EXPEDITION GOAL (ЦЕЛЬ ЭКСПЕДИЦИИ / ЗАДАНИЕ КОМАНДЫ) */}
      {(() => {
        const activeTask = CASE_TASKS.find((c) => c.id === team.selectedTaskId) || CASE_TASKS[0];
        return (
          <section className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono">
                      Карточка задания #{activeTask.cardNumber}
                    </span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                      {activeTask.difficulty}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                    Маршрутный лист: «{team.selectedTaskTitle || activeTask.title}»
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setIsSelectTaskModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto shrink-0"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Выбрать / Сменить задание</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
              {activeTask.description}
            </p>

            {activeTask.keyFormulas && activeTask.keyFormulas.length > 0 && (
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400">
                  Ключевые формулы миссии:
                </span>
                {activeTask.keyFormulas.map((formula, i) => (
                  <code
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 shadow-sm"
                  >
                    {formula}
                  </code>
                ))}
              </div>
            )}
          </section>
        );
      })()}

      {/* 2. CREW CHAIRS & SOCIAL GROUP ROSTER (ПРОФИЛИ УЧАСТНИКОВ В КРЕСЛАХ) */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Штатное расписание: Экипаж корабля
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Каждому члену экипажа присваивается отдельная собственная роль из пополняемого списка
              CRM.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAddStudentModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Вписать школьника</span>
            </button>
            <button
              onClick={() => setIsAssignFromCrmModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Назначить из CRM</span>
            </button>
            <button
              onClick={() => setIsAddRoleModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Роль в CRM</span>
            </button>
          </div>
        </div>

        {/* Crew Chairs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Chair 1: Captain (Teacher / Mentor) */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 flex flex-col justify-between shadow-lg relative group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xl">⭐</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Командир
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-xs sm:text-sm truncate">
                  {team.mentorName}
                </div>
                <div className="text-[11px] text-amber-400 font-medium">
                  Командир корабля (Наставник)
                </div>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                Координация защиты, утверждение 3 слайдов и связь с ЦУП.
              </p>
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate pt-2 mt-3 border-t border-slate-800">
              {team.mentorEmail}
            </div>
          </div>

          {/* Chair 2: Navigator (Mascot AI Kubik) */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 flex flex-col justify-between shadow-lg relative group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xl">🤖</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Штурман
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-xs sm:text-sm truncate">AI Кубик</div>
                <div className="text-[11px] text-cyan-400 font-medium">Бортовой оркестратор</div>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                Справки из Википедии, расчет орбит, информирование об этапах.
              </p>
            </div>
            <button
              onClick={() => openWikiWithQuery('CubeSat')}
              className="text-[10px] text-cyan-300 hover:text-cyan-200 truncate pt-2 mt-3 border-t border-slate-800 text-left flex items-center justify-between"
            >
              <span>Справка Википедии</span>
              <span>→</span>
            </button>
          </div>

          {/* Chairs 3+: Students with Role Selector and Subtasks */}
          {team.members.map((member, idx) => {
            const roleKey = member.assignedRole || member.role;
            const subtask = (team.roleSubtasks || currentRoleSubtasks)?.find(
              (st) => st.role === roleKey || st.assignedStudentName === member.name,
            );

            let roleIcon = '🛰️';
            if (roleKey === 'physicist') roleIcon = '⚛️';
            else if (roleKey === 'chemist') roleIcon = '🧪';
            else if (roleKey === 'biologist') roleIcon = '🧬';
            else if (roleKey === 'medic') roleIcon = '🩺';
            else if (roleKey === 'translator') roleIcon = '🌐';
            else if (roleKey === 'marketer') roleIcon = '💼';
            else if (roleKey === 'engineer') roleIcon = '🛠️';
            else if (roleKey === 'flight_mechanic') roleIcon = '⚙️';
            else if (roleKey === 'mathematician') roleIcon = '📐';
            else if (roleKey === 'designer') roleIcon = '🎨';

            return (
              <div
                key={member.id || idx}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{roleIcon}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {member.roleTitle || roleKey}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs sm:text-sm truncate">
                      {member.name}
                    </div>
                    <div className="text-[11px] font-medium text-slate-400">
                      {member.gradeText || `${member.grade || 9} класс`}
                    </div>
                  </div>

                  {/* Change Role Selector */}
                  <div className="pt-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">
                      Роль в CRM:
                    </label>
                    <select
                      value={roleKey}
                      onChange={(e) => handleChangeMemberRole(member.id, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-indigo-300 font-medium focus:outline-none focus:border-indigo-500"
                    >
                      {availableRoles.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {subtask && (
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                      <div className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 flex items-center justify-between">
                        <span>Задание по роли:</span>
                        {subtask.completed && (
                          <span className="text-emerald-400 font-bold">✓ Выполнено</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-200 line-clamp-2">{subtask.title}</div>
                    </div>
                  )}
                </div>

                <div className="pt-2 mt-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">{member.discipline || 'Космонавтика'}</span>
                  <span className="text-emerald-400 font-semibold">✓ В экипаже</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2.5 CREW ROLE SUBTASKS IN MISSION (РОЛЕВЫЕ ЗАДАНИЯ ЭКИПАЖА) */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Ролевые задания экипажа в рамках миссии «{team.selectedTaskTitle || 'Кубсат'}»
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Каждый член корабля согласно своей роли (физик, химик, биолог, штурман, бортмеханик,
              переводчик и др.) выполняет задачи в рамках общего задания.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Прогресс выполнения:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
              {(team.roleSubtasks || currentRoleSubtasks).filter((s) => s.completed).length} /{' '}
              {(team.roleSubtasks || currentRoleSubtasks).length} выполнено
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(team.roleSubtasks || currentRoleSubtasks).map((subtask) => (
            <div
              key={subtask.id}
              className={`p-4 rounded-2xl border transition-all ${
                subtask.completed
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {subtask.roleTitle}
                    </span>
                    {subtask.assignedStudentName && (
                      <span className="text-[11px] font-mono text-slate-400">
                        {subtask.assignedStudentName}
                      </span>
                    )}
                  </div>
                  <h3
                    className={`text-xs font-bold leading-snug ${subtask.completed ? 'text-emerald-300 line-through' : 'text-white'}`}
                  >
                    {subtask.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {subtask.description}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleSubtask(subtask.id)}
                  title={
                    subtask.completed ? 'Отметить как невыполненное' : 'Отметить как выполненное'
                  }
                  className={`min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    subtask.completed
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>Дисциплина: {subtask.discipline}</span>
                {subtask.wikiQuery && (
                  <button
                    onClick={() => openWikiWithQuery(subtask.wikiQuery || 'CubeSat')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Справка Википедии</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SPECIAL 3-SLIDE WORKSPACE (ФОРМА ЗАПОЛНЕНИЯ СЛАЙДОВ ДЛЯ ЗАЩИТЫ) */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Подготовка 3-х слайдов итоговой презентации
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Все наработки загружаются в форму для прямой демонстрации с экрана наставника перед
              экспертами
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPresentationOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Запустить показ презентации</span>
            </button>
          </div>
        </div>

        {/* 3 Tabs for Slides */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveSlideTab(1)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSlideTab === 1
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Слайд 1: Представление и фото</span>
          </button>

          <button
            onClick={() => setActiveSlideTab(2)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSlideTab === 2
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Слайд 2: Теория, формулы и графики</span>
          </button>

          <button
            onClick={() => setActiveSlideTab(3)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSlideTab === 3
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Слайд 3: Практическая применимость</span>
          </button>
        </div>

        {/* SLIDE 1 FORM: TEAM & PHOTO */}
        {activeSlideTab === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row gap-6">
              {/* Photo Preview */}
              <div className="w-full md:w-72 shrink-0 space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Фотография команды:</span>
                  <span className="text-[10px] text-cyan-400">Слайд 1</span>
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-700 bg-slate-900 relative">
                  <img
                    src={teamPhotoUrlInput}
                    alt="Фото экипажа"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Photo URL & Team Roster Overview */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Ссылка на фотографию команды (или загрузка в форму):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={teamPhotoUrlInput}
                      onChange={(e) => setTeamPhotoUrlInput(e.target.value)}
                      placeholder="https://... ссылка на фото команды"
                      aria-label="Ссылка на фото команды"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={handleSaveTeamPhoto}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shrink-0 shadow-md shadow-cyan-600/20"
                    >
                      Сохранить фото
                    </button>
                  </div>
                  {photoSavedNotice && (
                    <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <span>✓</span> Фотография успешно прикреплена к первому слайду!
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Представление экипажа на слайде 1:</span>
                    <span className="text-cyan-400 font-mono">Автоматическая синхронизация</span>
                  </div>
                  <div className="text-slate-300">
                    • Корабль: <strong>«{team.shipName || team.name}»</strong> ({team.school})
                  </div>
                  <div className="text-slate-300">
                    • Капитан: <strong>{team.mentorName}</strong> (наставник)
                  </div>
                  <div className="text-slate-300">
                    • Штурман: <strong>AI Кубик</strong>
                  </div>
                  <div className="text-slate-300">
                    • Экипаж:{' '}
                    {team.members.map((m) => `${m.name} (${m.roleTitle || m.role})`).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2 FORM: THEORY, FORMULAS & GRAPHS */}
        {activeSlideTab === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Теоретическая часть: Аналитические формулы и физическая модель
                </span>
                <button
                  onClick={() => openWikiWithQuery(team.selectedTaskTitle || 'Физика')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Взять формулы из Википедии</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Математические уравнения и формулы (LaTeX):
                </label>
                <textarea
                  rows={2}
                  value={slide2Formula}
                  onChange={(e) => setSlide2Formula(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Физическое описание графиков, диаграмм и баллистических расчетов:
                </label>
                <textarea
                  rows={3}
                  value={slide2Calculations}
                  onChange={(e) => setSlide2Calculations(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSlide2}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-md shadow-cyan-600/20"
                >
                  Сохранить расчеты Слайда 2
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3 FORM: PRACTICAL APPLICABILITY & REFLECTIONS */}
        {activeSlideTab === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Практическая часть: Применимость в космосе (мнение каждого участника)
                </h4>
                <p className="text-xs text-slate-400">
                  Каждый член экипажа описывает со своей точки зрения (физика, химия, биология,
                  дизайн), как данное решение работает на реальной орбите.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reflections.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{item.memberName}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-700 text-[10px] font-medium">
                        {item.roleTitle}
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={item.text}
                      onChange={(e) => handleUpdateReflection(idx, e.target.value)}
                      placeholder="Опишите применимость в космосе..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. CRM CHAMPIONSHIP STAGES SCHEDULER (ДЛЯ ОРГАНИЗАТОРОВ И НАСТАВНИКОВ) */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🗓️</span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Планировщик этапов чемпионата и оповещения экипажа
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Связан с оповещениями через Маскота Кубика, колокольчик и официальные письма капитану
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSchedulerSection((prev) => !prev)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              {showSchedulerSection ? 'Скрыть подробности' : 'Развернуть планировщик ЦУП'}
            </button>
            <button
              onClick={handleDownloadIcs}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Календарь .ICS</span>
            </button>
          </div>
        </div>

        {showSchedulerSection && (
          <CrmStagesScheduler
            stages={crmStages}
            onBroadcastStage={handleBroadcastStage}
            mentorEmail={team.mentorEmail}
            mentorName={team.mentorName}
            shipName={team.shipName || team.name}
          />
        )}

        {/* Compressed Stages Overview */}
        {!showSchedulerSection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {crmStages.map((stg) => (
              <div
                key={stg.id}
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                  stg.status === 'current'
                    ? 'bg-cyan-950/40 border-cyan-500/50 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950 border-slate-800/80 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Этап {stg.number}</span>
                    <span className="font-mono">{stg.dates}</span>
                  </div>
                  <div className="font-bold text-white line-clamp-1 mb-1">{stg.title}</div>
                  <p className="text-[10px] text-slate-400 line-clamp-2">{stg.description}</p>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-800 text-[10px] flex items-center justify-between">
                  <span className="text-slate-500">Дедлайн:</span>
                  <span className="text-slate-300 font-mono">{stg.deadlineTime}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODALS */}
      {/* 1. Starter Quiz Modal (0-100% fuel) */}
      <StarterQuizModal
        isOpen={isStarterQuizOpen}
        onClose={() => setIsStarterQuizOpen(false)}
        shipName={team.shipName || team.name}
        currentFuel={currentFuel}
        onQuizComplete={handleStarterQuizComplete}
      />

      {/* 2. Fullscreen Presentation Mode Modal */}
      <PresentationModeModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        team={team}
      />

      {/* 3. Wikipedia Mascot Help Modal */}
      <WikipediaHelpModal
        isOpen={isWikiHelpOpen}
        onClose={() => setIsWikiHelpOpen(false)}
        initialQuery={wikiSearchQuery}
      />

      {/* 4. Official Captain Email Inbox Modal */}
      <CaptainEmailModal
        isOpen={isCaptainEmailOpen}
        onClose={() => setIsCaptainEmailOpen(false)}
        emails={captainEmails}
        mentorEmail={team.mentorEmail}
        mentorName={team.mentorName}
        onMarkAsRead={(id) => {
          setCaptainEmails((prev) => prev.map((e) => (e.id === id ? { ...e, isRead: true } : e)));
        }}
      />

      {/* 5. Select Expedition Task Modal */}
      {isSelectTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-indigo-400" />
                  <span>Выбор цели экспедиции для корабля</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Командир выбирает задание для корабля из официального каталога кейс-чемпионата
                </p>
              </div>
              <button
                onClick={() => setIsSelectTaskModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {CASE_TASKS.map((task) => {
                const isCurrent = (team.selectedTaskId || 'task-01') === task.id;
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-indigo-400 font-bold">
                            Карточка #{task.cardNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                            {task.difficulty}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {task.schoolGradeRange}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{task.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{task.description}</p>
                      </div>

                      <button
                        onClick={() => handleSelectCaseTask(task)}
                        disabled={isCurrent}
                        className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                          isCurrent
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                        }`}
                      >
                        {isCurrent ? '✓ Текущее задание' : 'Взять задание'}
                      </button>
                    </div>

                    {task.keyFormulas && task.keyFormulas.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="text-slate-500 font-medium">Формулы:</span>
                        {task.keyFormulas.map((f, i) => (
                          <code
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300"
                          >
                            {f}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. Inscribe New Student Modal */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Вписать школьника в списки экипажа</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Если ученика нет в CRM, командир может внести его вручную
                </p>
              </div>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInscribeStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">ФИО школьника:</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
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
                    value={newStudentGrade}
                    onChange={(e) => setNewStudentGrade(e.target.value)}
                    placeholder="9А / 10Б"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Назначить роль:</label>
                  <select
                    value={newStudentRole}
                    onChange={(e) => setNewStudentRole(e.target.value)}
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
                <label className="block text-slate-300 font-medium mb-1">Школа / Лицей:</label>
                <input
                  type="text"
                  value={newStudentSchool}
                  onChange={(e) => setNewStudentSchool(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
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
                  Вписать в экипаж
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Assign Student from CRM Database Modal */}
      {isAssignFromCrmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Выбор участника из CRM-базы школ Перми</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Назначьте ученика из готового списка 16 аккредитованных школ
                </p>
              </div>
              <button
                onClick={() => setIsAssignFromCrmModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={crmSearchQuery}
                onChange={(e) => setCrmSearchQuery(e.target.value)}
                placeholder="Поиск по ФИО, школе, классу..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {CRM_TEAMS_DATABASE.flatMap((t) =>
                t.students.map((st, i) => ({
                  ...st,
                  school: t.school,
                  sourceShip: t.shipName,
                })),
              )
                .filter(
                  (st) =>
                    !crmSearchQuery ||
                    st.name.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
                    st.school.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
                    st.roleTitle.toLowerCase().includes(crmSearchQuery.toLowerCase()),
                )
                .map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{st.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({st.gradeText})
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px]">
                          {st.roleTitle}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-sm">{st.school}</p>
                    </div>

                    <button
                      onClick={() => handleAssignStudentFromCrm(st)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shrink-0 transition-colors"
                    >
                      Назначить
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. Add Custom Role Modal */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Пополнение справочника ролей CRM</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Создайте новую роль для экипажа корабля
                </p>
              </div>
              <button
                onClick={() => setIsAddRoleModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewCustomRole} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Название роли (например: Бортовой физик, Маркетолог, Бортмеханик):
                </label>
                <input
                  type="text"
                  required
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  placeholder="Бортовой астрофизик"
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
                  <option value="engineering">Инженерия и механика</option>
                  <option value="humanities">Гуманитарные науки (Филология, Перевод)</option>
                  <option value="commercial">Коммерциализация (Маркетинг, Торговля)</option>
                  <option value="medicine">Космическая медицина и биозащита</option>
                  <option value="custom">Другое направление</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Профильная дисциплина:
                </label>
                <input
                  type="text"
                  required
                  value={newRoleDiscipline}
                  onChange={(e) => setNewRoleDiscipline(e.target.value)}
                  placeholder="Астрофизика / Навигация"
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
                  placeholder="Опишите задачи специалиста в рамках орбитального полета..."
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
                  Сохранить роль
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
