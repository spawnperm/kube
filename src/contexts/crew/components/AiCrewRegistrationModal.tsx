/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Модальное окно AI-регистрации экипажа и наставника (Капитана) космического корабля
 *
 * Включает:
 * 1. Первыми регистрируются наставники (учителя) из утвержденного реестра:
 *    - Автодополнение и подсказки по ФИО, Email и школе.
 *    - Присвоение роли в команде: Капитан корабля.
 *    - Выбор названия корабля (с быстрыми подсказками: «Восток-81», «Парма-Орбита», «Циолковский-1» и др.) и школы.
 *    - Выбор темы CubeSat из списка, сгруппированного по областям школьных знаний (Физика, Химия, Биология, Математика, Инженерия).
 * 2. Штатное расписание корабля:
 *    - Капитан (наставник).
 *    - Бортовой компьютер (Леший оркестратор).
 *    - Три школьника с ролями (дизайнер, медик, физик, химик, биолог, навигатор, математик, инженер).
 *    - Автоматическая генерация подзадач под выбранную тему.
 * 3. Режим регистрации школьника:
 *    - Члены команды регистрируются за капитаном, сопоставляясь с утвержденным штатным расписанием.
 * 4. AI-аудит и автоматическое разрешение конфликтов в 1 клик.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Search,
  CheckCircle2,
  Rocket,
  Shield,
  Key,
  Users,
  Compass,
  Atom,
  FlaskConical,
  Dna,
  ArrowRight,
  RefreshCw,
  Building,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  Wand2,
  ShieldCheck,
  ShieldAlert,
  Check,
  Filter,
  Info,
  Palette,
  Stethoscope,
  Calculator,
  Wrench,
  Navigation,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  aiMatchingService,
  AiMatchResult,
  AiApplicationAudit,
} from '@/src/contexts/crew/services/aiMatchingService';
import { CRM_TEAMS_DATABASE, CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';
import { CASE_TASKS } from '@/src/shared/data/mockData';
import { Team, UserProfile, CrewRoleType } from '@/src/shared/types/index';
import { audioService } from '@/src/shared/lib/audioService';
import { taskRolesService } from '@/src/contexts/crew/services/taskRolesService';

interface AiCrewRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (team: Team, mentor: UserProfile) => void;
  prefillQuery?: string;
  prefillTeamId?: string;
}

const SHIP_NAME_SUGGESTIONS = [
  'Восток-81',
  'Парма-Орбита',
  'Циолковский-1',
  'Синтез-3U',
  'Урал-Космос',
  'Гагарин-26',
  'Вектор-Пермь',
];

const ROLE_OPTIONS: { id: CrewRoleType; label: string; icon: string }[] = [
  { id: 'physicist', label: 'Физик', icon: '⚛️' },
  { id: 'chemist', label: 'Химик', icon: '🧪' },
  { id: 'biologist', label: 'Биолог', icon: '🧬' },
  { id: 'designer', label: 'Дизайнер', icon: '🎨' },
  { id: 'medic', label: 'Медик', icon: '🩺' },
  { id: 'navigator', label: 'Навигатор', icon: '🛰️' },
  { id: 'mathematician', label: 'Математик', icon: '📐' },
  { id: 'engineer', label: 'Инженер', icon: '🛠️' },
];

export const AiCrewRegistrationModal: React.FC<AiCrewRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
  prefillQuery = '',
  prefillTeamId,
}) => {
  const [regMode, setRegMode] = useState<'mentor' | 'student'>('mentor');
  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState(prefillQuery);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<AiMatchResult | null>(null);
  const [aiServerVerdict, setAiServerVerdict] = useState<string | null>(null);

  // Ship Name customizable by Captain
  const [customShipName, setCustomShipName] = useState<string>('Восток-81');

  // Filter for the 16 quotas list in CRM
  const [auditFilter, setAuditFilter] = useState<'all' | 'conflict' | 'incomplete' | 'ready'>(
    'all',
  );

  // Selected task
  const [selectedTaskId, setSelectedTaskId] = useState<string>('task-01');

  // Password appointed by mentor
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Role assignments for the 3 students
  const [studentRoles, setStudentRoles] = useState<Record<number, CrewRoleType>>({
    0: 'physicist',
    1: 'chemist',
    2: 'biologist',
  });

  // Track if auto-fix was recently applied
  const [autoFixNotice, setAutoFixNotice] = useState<string | null>(null);

  // Student Search Mode State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Compute all audits for all 16 teams in the CRM registry
  const allAudits = useMemo(() => {
    return aiMatchingService.auditAllTeams();
  }, []);

  // Calculate audit stats
  const auditStats = useMemo(() => {
    let conflict = 0;
    let incomplete = 0;
    let ready = 0;

    Object.values(allAudits).forEach((aud) => {
      if (aud.status === 'conflict') conflict++;
      else if (aud.status === 'incomplete') incomplete++;
      else if (aud.status === 'ready') ready++;
    });

    return { conflict, incomplete, ready, total: Object.keys(allAudits).length };
  }, [allAudits]);

  // Autocomplete suggestions for mentor input
  const mentorSuggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q.length < 2) return [];
    return CRM_TEAMS_DATABASE.filter(
      (t) =>
        t.mentorName.toLowerCase().includes(q) ||
        t.mentorEmail.toLowerCase().includes(q) ||
        t.school.toLowerCase().includes(q) ||
        t.shipName.toLowerCase().includes(q),
    ).slice(0, 4);
  }, [searchQuery]);

  // Student matches across all teams
  const studentMatches = useMemo(() => {
    const q = studentSearchQuery.toLowerCase().trim();
    if (q.length < 2) return [];
    const list: {
      team: CrmTeamRecord;
      student: { name: string; gradeText: string; assignedRole?: CrewRoleType };
      roleIndex: number;
    }[] = [];

    CRM_TEAMS_DATABASE.forEach((t) => {
      t.students.forEach((st, idx) => {
        if (
          st.name.toLowerCase().includes(q) ||
          t.school.toLowerCase().includes(q) ||
          t.shipName.toLowerCase().includes(q)
        ) {
          list.push({ team: t, student: st, roleIndex: idx });
        }
      });
    });
    return list.slice(0, 6);
  }, [studentSearchQuery]);

  // If prefilled with a team ID on mount
  useEffect(() => {
    if (prefillTeamId) {
      const found = CRM_TEAMS_DATABASE.find((t) => t.id === prefillTeamId);
      if (found) {
        setSearchQuery(found.mentorName);
        triggerMatch(found.mentorName);
      }
    } else if (prefillQuery) {
      triggerMatch(prefillQuery);
    }
  }, [prefillTeamId, prefillQuery]);

  const triggerMatch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsMatching(true);
    setAutoFixNotice(null);
    setAiServerVerdict(null);
    audioService.playClickSound();

    try {
      const res = await aiMatchingService.matchQueryWithCrm(queryText, selectedTaskId);
      setMatchResult(res);

      if (res.teamRecord?.shipName) {
        setCustomShipName(res.teamRecord.shipName);
      }

      if (res.teamRecord?.selectedTaskId) {
        setSelectedTaskId(res.teamRecord.selectedTaskId);
      }

      if (res.recommendedRoles.length >= 3) {
        setStudentRoles({
          0: res.recommendedRoles[0].suggestedRole,
          1: res.recommendedRoles[1].suggestedRole,
          2: res.recommendedRoles[2].suggestedRole,
        });
      }

      if (res.teamRecord?.registeredPassword) {
        setPassword(res.teamRecord.registeredPassword);
        setConfirmPassword(res.teamRecord.registeredPassword);
      } else {
        setPassword('');
        setConfirmPassword('');
      }

      if (res.teamRecord) {
        aiMatchingService.fetchServerAiAudit(res.teamRecord, queryText).then((verdict) => {
          if (verdict) setAiServerVerdict(verdict);
        });
      }
    } finally {
      setIsMatching(false);
    }
  };

  const handleSelectQuickTeam = (team: CrmTeamRecord) => {
    setSearchQuery(team.mentorName);
    triggerMatch(team.mentorName);
  };

  const currentAudit: AiApplicationAudit | null = useMemo(() => {
    if (!matchResult?.teamRecord) return null;
    return aiMatchingService.auditTeamApplication(
      matchResult.teamRecord,
      studentRoles as any,
      password,
      selectedTaskId,
    );
  }, [matchResult, studentRoles, password, selectedTaskId]);

  if (!isOpen) return null;

  const handleAutoFix = () => {
    if (!matchResult?.teamRecord) return;
    const fix = aiMatchingService.autoFixTeamApplication(matchResult.teamRecord);

    setStudentRoles(fix.rolesMap as any);
    setPassword(fix.suggestedPassword);
    setConfirmPassword(fix.suggestedPassword);
    setSelectedTaskId(fix.suggestedTaskId);

    setAutoFixNotice(
      `AI устранил замечания: сбалансированы роли, сгенерирован пароль капитана «${fix.suggestedPassword}», подтвержден кейс CubeSat.`,
    );
    audioService.playSuccessChime();
  };

  const handleGeneratePassword = () => {
    if (!matchResult?.teamRecord) return;
    const gen = `SpaceCaptain-${matchResult.teamRecord.orderNumber}!`;
    setPassword(gen);
    setConfirmPassword(gen);
    setPasswordError('');
    audioService.playClickSound();
  };

  const handleGoToStep2 = () => {
    if (!matchResult?.teamRecord) return;
    audioService.playClickSound();
    setStep(2);
  };

  const handleFinalizeRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!password.trim() || password.length < 4) {
      setPasswordError('Пароль должен содержать минимум 4 символа.');
      audioService.playTimerWarning();
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Введенные пароли не совпадают.');
      audioService.playTimerWarning();
      return;
    }

    if (!matchResult?.teamRecord) return;

    // Create team and mentor profile
    const { team, mentorProfile } = aiMatchingService.createTeamFromCrm(
      matchResult.teamRecord,
      studentRoles as any,
      selectedTaskId,
      password.trim(),
      customShipName.trim() || matchResult.teamRecord.shipName,
    );

    // Launch celebration
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.55 },
    });
    audioService.playSuccessChime();

    onRegisterSuccess(team, mentorProfile);
    onClose();
  };

  // Student Quick Login
  const handleStudentLogin = (matchedTeam: CrmTeamRecord, student: any, roleIndex: number) => {
    const assignedRole = (student.assignedRole || 'physicist') as CrewRoleType;
    const { team } = aiMatchingService.createTeamFromCrm(
      matchedTeam,
      {
        0: 'physicist',
        1: 'chemist',
        2: 'biologist',
        ...studentRoles,
      } as any,
      matchedTeam.selectedTaskId || selectedTaskId,
      matchedTeam.registeredPassword || 'SpaceCaptain-81!',
      matchedTeam.shipName,
    );

    const studentProfile: UserProfile = {
      id: `usr-student-${matchedTeam.id}-${roleIndex}`,
      name: student.name,
      email: `${student.name.split(' ')[0].toLowerCase()}@school.perm.space`,
      role: 'participant',
      rankTitle: `Член экипажа «${matchedTeam.shipName}»`,
      school: matchedTeam.school,
      city: matchedTeam.city,
      xp: 150,
      energyCrystals: 25,
      level: 1,
      streakDays: 1,
      statusMessage: `На борту корабля «${matchedTeam.shipName}». Роль: ${assignedRole} 🚀`,
      bio: `Учащийся ${student.gradeText} ${matchedTeam.school}. В экипаже космического корабля «${matchedTeam.shipName}».`,
      photoConsent: true,
      badges: [],
      socialPosts: [],
    };

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    audioService.playSuccessChime();
    onRegisterSuccess(team, studentProfile);
    onClose();
  };

  // Group tasks by subject category
  const taskCategories = [
    {
      category: '⚛️ Физика и баллистика',
      tasks: CASE_TASKS.filter(
        (t) =>
          t.category === 'ballistics' ||
          t.category === 'thermodynamics' ||
          t.id === 'task-01' ||
          t.id === 'task-02',
      ),
    },
    {
      category: '🧪 Химия и источники энергии',
      tasks: CASE_TASKS.filter(
        (t) => t.category === 'power' || t.id === 'task-03' || t.id === 'task-04',
      ),
    },
    {
      category: '🧬 Биология и биорегенерация',
      tasks: CASE_TASKS.filter(
        (t) => t.category === 'biochem' || t.id === 'task-05' || t.id === 'task-06',
      ),
    },
    {
      category: '📐 Математика и орбитальная механика',
      tasks: CASE_TASKS.filter((t) => t.id === 'task-07' || t.category === 'ballistics'),
    },
    {
      category: '🛠️ Космическая инженерия 3U',
      tasks: CASE_TASKS.filter((t) => t.category === 'payload' || t.id === 'task-08'),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Регистрация экипажа космического корабля
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                  CRM Пермь (16 квот)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Смирнов А.А. (info@mirovisor.com), Песин М.В. (ЦУП), Анисимова А.С. (консультант)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher: Captain (Teacher) vs Student Member */}
        <div className="px-4 sm:px-6 pt-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2">
          <button
            onClick={() => {
              setRegMode('mentor');
              setStep(1);
            }}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              regMode === 'mentor'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>👨‍✈️ Регистрация Капитана (Педагога-наставника)</span>
          </button>

          <button
            onClick={() => setRegMode('student')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              regMode === 'student'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🚀 Вход члена экипажа (Школьника)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* STUDENT REGISTRATION MODE */}
          {regMode === 'student' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>Штатное расписание утвержденного борта</span>
                </div>
                <p>
                  Школьники регистрируются за капитаном команды. Введите вашу фамилию, имя или номер
                  школы, чтобы система сопоставила вас с указанным капитаном кораблем.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Поиск по фамилии учащегося или номеру школы:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Например: Габдушев, Мехряков, СОШ 81..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Student Matches */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400">
                  {studentMatches.length > 0
                    ? `Найдено в реестре (${studentMatches.length}):`
                    : 'Введите минимум 2 буквы для поиска в базе экипажей'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {studentMatches.map(({ team, student, roleIndex }) => (
                    <div
                      key={`${team.id}-${student.name}`}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/60 transition-all flex flex-col justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-white text-sm">{student.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                            Место #{roleIndex + 1}
                          </span>
                        </div>
                        <div className="text-slate-300 text-[11px] mb-1">
                          Корабль: <strong className="text-emerald-400">«{team.shipName}»</strong> (
                          {team.school})
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Капитан: {team.mentorName} ({team.mentorEmail})
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStudentLogin(team, student, roleIndex)}
                        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Занять кресло на борту «{team.shipName}»</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MENTOR (CAPTAIN) REGISTRATION MODE */}
          {regMode === 'mentor' && step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Search & Matching Input with Autocomplete */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Поиск учителя-наставника (ФИО, Email или Школа Перми):</span>
                  <span className="text-[10px] text-indigo-400">
                    Первыми регистрируются наставники
                  </span>
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.length >= 3) {
                          triggerMatch(e.target.value);
                        }
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && triggerMatch(searchQuery)}
                      placeholder="Введите: Бондаренко, dsbondarenko@mail.ru или СОШ № 81..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerMatch(searchQuery)}
                    disabled={isMatching}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 shrink-0 transition-colors"
                  >
                    {isMatching ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Сопоставить</span>
                  </button>
                </div>

                {/* Autocomplete Suggestions Cards */}
                {mentorSuggestions.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">
                      Подсказки для быстрого ввода (нажмите для выбора):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {mentorSuggestions.map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => handleSelectQuickTeam(sug)}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-indigo-950/50 border border-slate-800 text-left transition-colors flex items-center justify-between text-xs"
                        >
                          <div className="truncate">
                            <div className="font-bold text-white truncate">{sug.mentorName}</div>
                            <div className="text-[10px] text-slate-400 truncate">{sug.school}</div>
                          </div>
                          <span className="text-[10px] text-indigo-400 font-mono shrink-0 ml-2">
                            {sug.mentorEmail}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CRM 16 Quotas Mini-selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Реестр 16 квот Перми:</span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setAuditFilter('all')}
                      className={`px-2 py-0.5 rounded ${
                        auditFilter === 'all'
                          ? 'bg-slate-700 text-white font-bold'
                          : 'bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      Все (16)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditFilter('conflict')}
                      className={`px-2 py-0.5 rounded ${
                        auditFilter === 'conflict'
                          ? 'bg-rose-500/30 text-rose-300 font-bold'
                          : 'bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      Конфликты ({auditStats.conflict})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditFilter('ready')}
                      className={`px-2 py-0.5 rounded ${
                        auditFilter === 'ready'
                          ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                          : 'bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      Готовы ({auditStats.ready})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  {CRM_TEAMS_DATABASE.filter((t) => {
                    if (auditFilter === 'all') return true;
                    const a = allAudits[t.id];
                    return a?.status === auditFilter;
                  }).map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleSelectQuickTeam(team)}
                      className={`p-2 rounded-lg border text-left transition-all truncate text-xs ${
                        matchResult?.teamRecord?.id === team.id
                          ? 'bg-indigo-950/70 border-indigo-500 ring-1 ring-indigo-500'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-white truncate text-[11px]">
                        {team.mentorName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{team.school}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Matched Team Overview & Audit */}
              {matchResult && matchResult.teamRecord && currentAudit && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-300">
                  {autoFixNotice && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{autoFixNotice}</span>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <div>
                        <div className="text-xs text-slate-400">Найдено в реестре Перми:</div>
                        <div className="font-bold text-white text-sm">
                          {matchResult.teamRecord.mentorName} (Капитан)
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-indigo-400 font-mono">
                          {matchResult.teamRecord.mentorEmail}
                        </div>
                        <div className="text-xs text-slate-300 font-semibold">
                          {matchResult.teamRecord.school}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                      {currentAudit.status !== 'ready' && (
                        <button
                          type="button"
                          onClick={handleAutoFix}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
                        >
                          <Wand2 className="w-4 h-4 text-amber-300" />
                          <span>AI Авто-исправление заявки (1 клик)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleGoToStep2}
                        className="flex-1 min-h-[42px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-xs sm:text-sm"
                      >
                        <span>Перейти к названию корабля, теме и ролям</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SHIP NAME, THEME & CREW ROLES */}
          {regMode === 'mentor' && step === 2 && matchResult?.teamRecord && (
            <form
              onSubmit={handleFinalizeRegistration}
              className="space-y-4 animate-in fade-in duration-200"
            >
              {/* 1. SHIP NAME SELECTION (ВЫБОР НАЗВАНИЯ КОРАБЛЯ) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Rocket className="w-4 h-4 text-cyan-400" />
                    <span>Название космического корабля:</span>
                  </label>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    Школа: {matchResult.teamRecord.school}
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={customShipName}
                    onChange={(e) => setCustomShipName(e.target.value)}
                    placeholder="Придумайте название, например: «Восток-81»"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-semibold"
                  />
                </div>

                {/* Suggestions Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400">Быстрый выбор:</span>
                  {SHIP_NAME_SUGGESTIONS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setCustomShipName(name)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                        customShipName === name
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      «{name}»
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. THEME SELECTION GROUPED BY SCHOOL DISCIPLINES */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    <span>Тема для защиты проекта Кубсата (разделена по областям знаний):</span>
                  </label>
                  <span className="text-[10px] text-indigo-300 font-mono">
                    Подзадачи экипажа адаптируются
                  </span>
                </div>

                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {taskCategories.map((cat, catIdx) => (
                    <optgroup
                      key={catIdx}
                      label={cat.category}
                      className="bg-slate-950 text-indigo-300 font-bold"
                    >
                      {cat.tasks.map((t) => (
                        <option
                          key={t.id}
                          value={t.id}
                          className="bg-slate-900 text-white font-normal"
                        >
                          {t.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* 3. CREW ROSTER & ROLES SELECTION */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Штатное расписание экипажа корабля (5 участников):</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Капитан + Бортовой компьютер Леший + 3 Школьника
                  </span>
                </div>

                {/* 1. Captain (Teacher) */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                      👨‍✈️
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs truncate">
                        {matchResult.teamRecord.mentorName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Капитан корабля · Преподаватель-наставник
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                    Капитан
                  </span>
                </div>

                {/* 2. Navigator (AI Leshy) */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                      🤖
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs truncate">БК «Леший»</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Бортовой компьютер · Оркестратор AI-агентов и справки Википедии
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                    БК
                  </span>
                </div>

                {/* 3. Three Students with Role Selectors */}
                {matchResult.teamRecord.students.map((student, idx) => {
                  const currentRole = studentRoles[idx] || 'physicist';

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 border border-slate-700">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate">
                            {student.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {student.gradeText} · Из утвержденного реестра Перми
                          </div>
                        </div>
                      </div>

                      {/* Role Selector Dropdown / Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400">Роль:</span>
                        <select
                          value={currentRole}
                          onChange={(e) =>
                            setStudentRoles((prev) => ({
                              ...prev,
                              [idx]: e.target.value as CrewRoleType,
                            }))
                          }
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-500"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.icon} {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4. PASSWORD APPOINTED BY CAPTAIN */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>
                      Пароль капитана для входа (Логин: {matchResult.teamRecord.mentorEmail}):
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] text-amber-300 hover:text-amber-200 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Сгенерировать</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Придумайте пароль капитана"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите пароль"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="text-[11px] text-rose-400 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Назад к поиску
                </button>

                <button
                  type="submit"
                  className="flex-1 min-h-[44px] bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-xs sm:text-sm"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Завершить регистрацию экипажа и войти</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
