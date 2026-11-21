/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Личный кабинет эксперта (представителя организации социального партнёра).
 *
 * Эксперты видят карточки всех команд (кораблей), описание кораблей,
 * цели их экспедиций, состав экипажа с ролями и презентационные материалы (3 слайда).
 * Выставляют командам оценки по результатам прохождения этапов чемпионата.
 */

import React, { useState } from 'react';
import {
  Award,
  Star,
  CheckCircle2,
  Building2,
  Rocket,
  ShieldCheck,
  Users,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Search,
  Sliders,
  Send,
  Eye,
  Check,
} from 'lucide-react';
import { Team, UserProfile, ExpertEvaluation, CaseTask } from '@/src/shared/types/index';
import { CRM_TEAMS_DATABASE, CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';
import {
  CHAMPIONSHIP_STAGES_CRM,
  taskRolesService,
} from '@/src/contexts/crew/services/taskRolesService';
import { CASE_TASKS } from '@/src/shared/data/mockData';
import { audioService } from '@/src/shared/lib/audioService';

interface ExpertPortalViewProps {
  currentUser: UserProfile;
  activeTeam: Team;
  onSelectTeam?: (teamId: string) => void;
  onSaveEvaluation?: (evalData: ExpertEvaluation) => void;
  onNavigateTab?: (tab: string, subView?: string) => void;
}

const PARTNER_ORGANIZATIONS = [
  'АО «НПО Искра» (Роскосмос)',
  'Аэрокосмический факультет ПНИПУ',
  'АО «Протон-ПМ»',
  'АО «ОДК-Пермские моторы»',
  'МАОУ ДПО «ЦРСО» г. Перми',
  'Пермский кванториум Фотоника',
];

export const ExpertPortalView: React.FC<ExpertPortalViewProps> = ({
  currentUser,
  activeTeam,
  onSelectTeam,
  onSaveEvaluation,
  onNavigateTab,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    activeTeam.id || CRM_TEAMS_DATABASE[0].id,
  );
  const [selectedStageId, setSelectedStageId] = useState<string>('crm-stage-2');
  const [searchQuery, setSearchQuery] = useState('');

  // Expert scores state
  const [scores, setScores] = useState({
    physicsRigor: 5,
    engineeringFeasibility: 5,
    roleDistributionScore: 5,
    presentationClarity: 4,
    defenseQuality: 5,
  });

  const [expertComment, setExpertComment] = useState(
    'Физико-математическая модель торможения в термосфере рассчитана корректно. Четко прослеживается ролевое распределение: задачи физика, химика и биолога согласованы с общей целью экспедиции.',
  );

  const [submittedEvals, setSubmittedEvals] = useState<Record<string, ExpertEvaluation>>({
    'crm-team-01': {
      id: 'eval-demo-01',
      teamId: 'crm-team-01',
      shipName: 'Звёздный-81',
      expertId: currentUser.id,
      expertName: currentUser.name,
      organization: 'АО «НПО Искра»',
      stageId: 'crm-stage-1',
      stageTitle: 'Этап 1: Регистрация и роли',
      criteriaScores: {
        physicsRigor: 5,
        engineeringFeasibility: 5,
        roleDistributionScore: 5,
        presentationClarity: 4,
        defenseQuality: 5,
      },
      totalAverage: 4.8,
      comment:
        'Штатное расписание заполнено в полном объеме, роли распределены точно под баллистический кейс.',
      timestamp: '24 сентября 2026, 11:30',
    },
  });

  const [justSavedNotice, setJustSavedNotice] = useState(false);

  // Filter teams by search
  const filteredTeams = CRM_TEAMS_DATABASE.filter(
    (t) =>
      t.shipName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mentorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.selectedTaskTitle &&
        t.selectedTaskTitle.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const currentTeamRecord =
    CRM_TEAMS_DATABASE.find((t) => t.id === selectedTeamId) || CRM_TEAMS_DATABASE[0];
  const matchedTask: CaseTask | undefined =
    CASE_TASKS.find((c) => c.id === currentTeamRecord.selectedTaskId) || CASE_TASKS[0];

  // Calculate average score
  const currentAverage = Number(
    (
      (scores.physicsRigor +
        scores.engineeringFeasibility +
        scores.roleDistributionScore +
        scores.presentationClarity +
        scores.defenseQuality) /
      5
    ).toFixed(2),
  );

  const handleScoreChange = (field: keyof typeof scores, val: number) => {
    setScores((prev) => ({ ...prev, [field]: val }));
    audioService.playClickSound();
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const stage =
      CHAMPIONSHIP_STAGES_CRM.find((s) => s.id === selectedStageId) || CHAMPIONSHIP_STAGES_CRM[1];

    const evalRecord: ExpertEvaluation = {
      id: `eval-${Date.now()}`,
      teamId: currentTeamRecord.id,
      shipName: currentTeamRecord.shipName,
      expertId: currentUser.id,
      expertName: currentUser.name,
      organization: 'АО «НПО Искра» / ПНИПУ',
      stageId: stage.id,
      stageTitle: stage.title,
      criteriaScores: { ...scores },
      totalAverage: currentAverage,
      comment: expertComment.trim(),
      timestamp: new Date().toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setSubmittedEvals((prev) => ({
      ...prev,
      [currentTeamRecord.id]: evalRecord,
    }));

    if (onSaveEvaluation) {
      onSaveEvaluation(evalRecord);
    }

    setJustSavedNotice(true);
    audioService.playSuccessChime();
    setTimeout(() => setJustSavedNotice(false), 4000);
  };

  const handleSelectTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    if (onSelectTeam) onSelectTeam(teamId);
    audioService.playClickSound();

    // Check if previously evaluated
    const existing = submittedEvals[teamId];
    if (existing) {
      setScores({
        physicsRigor: existing.criteriaScores.physicsRigor,
        engineeringFeasibility: existing.criteriaScores.engineeringFeasibility,
        roleDistributionScore: existing.criteriaScores.roleDistributionScore || 5,
        presentationClarity: existing.criteriaScores.presentationClarity,
        defenseQuality: existing.criteriaScores.defenseQuality,
      });
      setExpertComment(existing.comment);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner: Social Partner Accreditation */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-indigo-950/60 border border-amber-500/30 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Личный кабинет эксперта
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                Жюри Чемпионата
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Оценка космических кораблей и защит</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Экспертный пул социальных партнёров чемпионата «КОСМОПОРТ». Оценивайте научную глубину
              решений, инженерную реализуемость CubeSat, распределение ролей в экипаже и качество
              презентаций.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-3.5 min-w-[220px]">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Социальный партнёр:</span>
            </div>
            <span className="text-sm font-semibold text-white mt-0.5">АО «НПО Искра» / ПНИПУ</span>
            <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Эксперт: {currentUser.name}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Ship Cards) & Right Column (Evaluation Console) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Ship Cards Directory */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">
                  Корабли участников ({CRM_TEAMS_DATABASE.length})
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Оценено: {Object.keys(submittedEvals).length} из {CRM_TEAMS_DATABASE.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск корабля, школы или задания..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Ship Cards List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredTeams.map((teamRecord) => {
                const isSelected = teamRecord.id === selectedTeamId;
                const evaluation = submittedEvals[teamRecord.id];

                return (
                  <button
                    key={teamRecord.id}
                    onClick={() => handleSelectTeam(teamRecord.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">
                            Корабль «{teamRecord.shipName}»
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                            {teamRecord.cubesatFormat}
                          </span>
                          {evaluation && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-medium flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              {evaluation.totalAverage}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {teamRecord.school}
                        </p>

                        <div className="flex items-center gap-1 text-[11px] text-slate-300 mt-1">
                          <span className="text-amber-400 font-medium">Миссия:</span>
                          <span className="truncate">
                            {teamRecord.selectedTaskTitle || 'Баллистика и термосфера'}
                          </span>
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform mt-1 ${
                          isSelected ? 'text-indigo-400 translate-x-0.5' : 'text-slate-600'
                        }`}
                      />
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate">
                        Капитан: {teamRecord.mentorName.split(' ')[0]}
                      </span>
                      <span>Экипаж: {teamRecord.students.length} чел.</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Detailed Ship Dossier & Evaluation Console */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card: Active Ship Dossier */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
                    {currentTeamRecord.shipCallsign}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                    Стандарт {currentTeamRecord.cubesatFormat}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Корабль «{currentTeamRecord.shipName}»
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{currentTeamRecord.school}</p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Капитан-наставник</span>
                <span className="text-xs font-semibold text-white">
                  {currentTeamRecord.mentorName}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {currentTeamRecord.mentorEmail}
                </span>
              </div>
            </div>

            {/* Mission Goal (Цель экспедиции / Задание команды) */}
            <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-200">
                    Цель экспедиции (Задание корабля)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  {matchedTask?.difficulty || 'Продвинутый'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white">
                {currentTeamRecord.selectedTaskTitle || matchedTask?.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">{matchedTask?.description}</p>

              {matchedTask?.keyFormulas && matchedTask.keyFormulas.length > 0 && (
                <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold text-slate-400">Базовые формулы:</span>
                  {matchedTask.keyFormulas.map((f, i) => (
                    <code
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] font-mono text-indigo-300"
                    >
                      {f}
                    </code>
                  ))}
                </div>
              )}
            </div>

            {/* Crew Roster & Assigned Roles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Члены экипажа и распределение ролей</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {currentTeamRecord.students.length} специалистов + Капитан + Штурман
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Captain Card */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-sm shrink-0">
                    👨‍🏫
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block">
                      Командир корабля
                    </span>
                    <span className="text-xs font-bold text-white truncate block">
                      {currentTeamRecord.mentorName}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Управление миссией и защитой
                    </span>
                  </div>
                </div>

                {/* AI Mascot Navigator Card */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm shrink-0">
                    🤖
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider block">
                      Бортовой компьютер
                    </span>
                    <span className="text-xs font-bold text-white block">Леший</span>
                    <span className="text-[10px] text-slate-400 block">
                      Оркестратор баллистики и телеметрии
                    </span>
                  </div>
                </div>

                {/* Students cards with individual roles */}
                {currentTeamRecord.students.map((student, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-sm shrink-0">
                      🛰️
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          {student.roleTitle}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          ({student.gradeText})
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white truncate block">
                        {student.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Дисциплина: {student.discipline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Expert Evaluation Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Оценочный лист эксперта жюри</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Итоговый балл:</span>
                <span className="text-base font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg font-mono">
                  {currentAverage} / 5.0
                </span>
              </div>
            </div>

            {/* Stage Selector */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1.5">
                Оцениваемый этап чемпионата:
              </label>
              <select
                value={selectedStageId}
                onChange={(e) => setSelectedStageId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {CHAMPIONSHIP_STAGES_CRM.map((st) => (
                  <option key={st.id} value={st.id}>
                    Этап {st.number}: {st.title} ({st.dates})
                  </option>
                ))}
              </select>
            </div>

            {/* Evaluation Criteria Sliders */}
            <div className="space-y-3.5 pt-1">
              {/* Criterion 1: Physics rigor */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    1. Физико-математическая строгость модели
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {scores.physicsRigor} / 5
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Корректность формул свободномолекулярного торможения, законов Кеплера, расчет
                  высот и циклограммы.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleScoreChange('physicsRigor', star)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        scores.physicsRigor >= star
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Criterion 2: Engineering feasibility */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    2. Инженерно-конструкторская реализуемость
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {scores.engineeringFeasibility} / 5
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Спецификация шасси CubeSat 3U (масса до 3.8 кг), шина PC104, энергобаланс батарей
                  LiFePO4 и зазоры P-POD.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleScoreChange('engineeringFeasibility', star)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        scores.engineeringFeasibility >= star
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Criterion 3: Role distribution & crew performance */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    3. Распределение ролей и командная защита
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {scores.roleDistributionScore} / 5
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Каждый участник четко понимает свою роль (физик, химик, биолог, бортмеханик,
                  переводчик и др.) и выполнил профильную задачу.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleScoreChange('roleDistributionScore', star)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        scores.roleDistributionScore >= star
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Criterion 4: Presentation & Slide Quality */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    4. Оформление 3-х слайдов и защита решения
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {scores.presentationClarity} / 5
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Слайд 1 (визитка и фото), Слайд 2 (теория и формулы), Слайд 3 (практическая
                  применимость и рефлексия каждого члена экипажа).
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleScoreChange('presentationClarity', star)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        scores.presentationClarity >= star
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Expert Feedback Textarea */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Экспертное заключение и обратная связь экипажу:
              </label>
              <textarea
                rows={3}
                value={expertComment}
                onChange={(e) => setExpertComment(e.target.value)}
                placeholder="Напишите экспертные замечания, сильные стороны решения и рекомендации для орбитального полета..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {/* Notice banner when evaluation saved */}
            {justSavedNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Оценка успешно зафиксирована в официальном протоколе жюри ЦУП!</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-500">
                Заполняет аккредитованный эксперт социального партнёра
              </span>

              <button
                type="button"
                onClick={handleSubmitEvaluation}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Award className="w-4 h-4" />
                <span>Зафиксировать оценку ({currentAverage})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
