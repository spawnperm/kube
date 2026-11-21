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
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Download,
  Filter,
} from 'lucide-react';
import { Team, UserProfile, ExpertEvaluation, CaseTask } from '@/src/shared/types/index';
import { CRM_TEAMS_DATABASE, CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';
import { CASE_TASKS } from '@/src/shared/data/mockData';
import { audioService } from '@/src/shared/lib/audioService';

interface InspectorsScreenProps {
  currentUser: UserProfile;
  activeTeam: Team;
  allTeams?: CrmTeamRecord[];
  onSelectTeam?: (teamId: string) => void;
  onSaveEvaluation?: (evalData: ExpertEvaluation) => void;
  onNavigateTab?: (tab: string, subView?: string) => void;
}

export const InspectorsScreen: React.FC<InspectorsScreenProps> = ({
  currentUser,
  activeTeam,
  allTeams = CRM_TEAMS_DATABASE,
  onSelectTeam,
  onSaveEvaluation,
  onNavigateTab,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(activeTeam.id || allTeams[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'evaluated' | 'pending' | 'needs_work'>(
    'all',
  );

  // Inspection criteria scores for current selected ship (1 to 5)
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

  // Evaluated ships record
  const [evaluatedShips, setEvaluatedShips] = useState<Record<string, ExpertEvaluation>>({
    'crm-team-01': {
      id: 'eval-01',
      teamId: 'crm-team-01',
      shipName: 'Звёздный-81',
      expertId: currentUser.id,
      expertName: currentUser.name,
      organization: 'АО «НПО Искра»',
      stageId: 'crm-stage-4',
      stageTitle: 'Предполетная инспекция 3U',
      criteriaScores: {
        physicsRigor: 5,
        engineeringFeasibility: 5,
        presentationClarity: 4,
        defenseQuality: 5,
        roleDistributionScore: 5,
      },
      totalAverage: 4.8,
      comment: 'Штатное расписание заполнено в полном объеме, формулы согласованы.',
      timestamp: '24 сентября 2026, 11:30',
    },
  });

  // 3:00 Defense Timer State
  const [timerSeconds, setTimerSeconds] = useState(180); // 3:00
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev === 31) audioService.playTimerWarning();
          if (prev === 1) {
            audioService.playTimerStopGong();
            setIsTimerRunning(false);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    audioService.playClickSound();
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    audioService.playClickSound();
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(180);
    audioService.playClickSound();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Find currently inspected ship
  const currentInspectShip = allTeams.find((t) => t.id === selectedTeamId) || allTeams[0];
  const currentTask =
    CASE_TASKS.find((t) => t.id === currentInspectShip.selectedTaskId) || CASE_TASKS[0];

  // Calculate average
  const currentAverage = Number(
    (
      (scores.physicsRigor +
        scores.engineeringFeasibility +
        scores.roleDistributionScore +
        scores.presentationClarity +
        scores.defenseQuality) /
      5
    ).toFixed(1),
  );

  const handleSaveInspection = (decision: 'approved' | 'revision') => {
    const newEval: ExpertEvaluation = {
      id: `eval-${Date.now()}`,
      teamId: currentInspectShip.id,
      shipName: currentInspectShip.shipName || currentInspectShip.cubesatName,
      expertId: currentUser.id,
      expertName: currentUser.name,
      organization: currentUser.school || 'АО «НПО Искра»',
      stageId: 'crm-stage-4',
      stageTitle: 'Предполетная инспекция и очная защита',
      criteriaScores: scores,
      totalAverage: currentAverage,
      comment: expertComment.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setEvaluatedShips((prev) => ({
      ...prev,
      [currentInspectShip.id]: newEval,
    }));

    if (onSaveEvaluation) {
      onSaveEvaluation(newEval);
    }

    audioService.playSuccessChime();
  };

  // Filtered ships
  const filteredShips = allTeams.filter((ship) => {
    const isEval = !!evaluatedShips[ship.id];
    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'evaluated' && isEval) ||
      (statusFilter === 'pending' && !isEval);

    const matchesSearch =
      !searchQuery.trim() ||
      ship.shipName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.mentorName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. HEADER & EXPERT CREDENTIALS */}
      <div className="rounded-3xl bg-slate-900/90 border border-purple-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold font-mono">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>ИНСПЕКТОРСКИЙ ПУЛЬТ ЖЮРИ КЕЙС-ЧЕМПИОНАТА «КОСМОПОРТ»</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Инспекция кораблей и оценка 3-х слайдов
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Эксперт: <strong>{currentUser.name}</strong> •{' '}
              {currentUser.school || 'Представитель социального партнёра'}
            </p>
          </div>

          {/* Quick Stats Counter */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-mono">Всего бортов</span>
              <strong className="text-lg text-white font-mono">{allTeams.length}</strong>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-mono">Оценено</span>
              <strong className="text-lg text-emerald-400 font-mono">
                {Object.keys(evaluatedShips).length}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REGISTRY OF ALL SHIPS CARDS */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Rocket className="w-4 h-4 text-cyan-400" />
              <span>Карточки всех зарегистрированных кораблей ({filteredShips.length})</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setStatusFilter('evaluated')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === 'evaluated'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Оцененные
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ожидают оценки
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск корабля / школы…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 w-48"
              />
            </div>
          </div>
        </div>

        {/* Ship Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShips.map((ship) => {
            const isSelected = ship.id === selectedTeamId;
            const evalRecord = evaluatedShips[ship.id];

            return (
              <div
                key={ship.id}
                onClick={() => {
                  setSelectedTeamId(ship.id);
                  if (onSelectTeam) onSelectTeam(ship.id);
                  audioService.playClickSound();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-950/40 border-cyan-400 shadow-lg shadow-indigo-600/30 ring-2 ring-cyan-400'
                    : evalRecord
                      ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-500'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-300 font-bold">
                      {ship.shipCallsign || `Борт-0${ship.orderNumber}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 font-mono text-[10px] border border-slate-800">
                      {ship.cubesatFormat || '3U'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      «{ship.shipName || ship.cubesatName}»
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{ship.school}</p>
                  </div>

                  {/* Crew members with roles */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Капитан: {ship.mentorName.split(' ')[0]}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ship.students.map((st, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 text-[9px] font-mono border border-slate-800"
                        >
                          {st.name.split(' ')[0]} (
                          {st.assignedRole === 'physicist'
                            ? 'Ф'
                            : st.assignedRole === 'chemist'
                              ? 'Х'
                              : 'Б'}
                          )
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  {evalRecord ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {evalRecord.totalAverage} / 5.0
                    </span>
                  ) : (
                    <span className="text-amber-400 text-[11px] font-medium">Ожидает оценки</span>
                  )}
                  <span className="text-indigo-400 text-xs font-semibold flex items-center gap-1">
                    Инспектировать →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. INSPECTION WORKBENCH FOR SELECTED SHIP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-4">
        {/* Left: 3 Slides Content Viewer */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Материалы корабля «{currentInspectShip.shipName}»</span>
              </h3>
              <p className="text-xs text-slate-400">
                Проверка 3-х слайдов защиты и математического аппарата
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
              {currentInspectShip.cubesatFormat || '3U'}
            </span>
          </div>

          {/* Slide 1, 2, 3 Preview Accordion */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="text-indigo-400 font-mono">Слайд 1: Задача экипажа</span>
                <span className="text-[10px] text-emerald-400">Готов к защите</span>
              </div>
              <p className="text-slate-300">
                {currentInspectShip.selectedTaskTitle || currentTask.title}
              </p>
              <div className="text-[11px] text-slate-400 pt-1">
                Состав: {currentInspectShip.students.map((s) => s.name).join(', ')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="text-cyan-400 font-mono">
                  Слайд 2: Физико-математическая модель
                </span>
                <span className="text-[10px] text-cyan-300 font-mono">Формулы</span>
              </div>
              <p className="text-slate-300">
                Расчет аэродинамического сопротивления в свободномолекулярном потоке и термосферного
                торможения на высотах 400 км.
              </p>
              <div className="p-2 rounded-lg bg-slate-900 font-mono text-cyan-300 text-[11px]">
                {currentTask.keyFormulas?.[0] ||
                  'a_{aero} = \\frac{1}{2} C_D \\frac{A}{m} \\rho v^2'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="text-purple-400 font-mono">Слайд 3: Компоновка 3U и выводы</span>
                <span className="text-[10px] text-slate-400">Компоновка</span>
              </div>
              <p className="text-slate-300">
                Размещение научных датчиков в верхнем 1U, батарейный блок LiFePO4 и ADCS в нижнем
                отсеке стандарта PC104+.
              </p>
            </div>
          </div>
        </div>

        {/* Right: 4-Criteria Assessment & 3:00 Timer */}
        <div className="lg:col-span-5 space-y-4">
          {/* Defense Timer (3:00) */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Таймер очной защиты (3:00)</span>
              </h4>
              <span className="text-xs font-mono text-slate-400">Регламент жюри</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <div
                className={`text-4xl sm:text-5xl font-mono font-black tracking-wider ${
                  timerSeconds <= 30 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'
                }`}
              >
                {formatTimer(timerSeconds)}
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                {!isTimerRunning ? (
                  <button
                    onClick={handleStartTimer}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Старт защиты</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePauseTimer}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Пауза</span>
                  </button>
                )}
                <button
                  onClick={handleResetTimer}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  title="Сбросить таймер на 3:00"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Scoring by 4 Criteria */}
          <div className="rounded-3xl bg-slate-900/90 border border-purple-500/30 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Оценка по 4 критериям регламента</span>
              </h4>
              <span className="text-cyan-300 font-mono font-bold text-sm">
                Итог: {currentAverage} / 5.0
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { key: 'physicsRigor', label: '1. Физическая строгость модели' },
                { key: 'engineeringFeasibility', label: '2. Инженерная точность 3U' },
                { key: 'roleDistributionScore', label: '3. Командные роли (Ф, Х, Б)' },
                { key: 'defenseQuality', label: '4. Защита перед жюри (3 мин)' },
              ].map((crit) => (
                <div key={crit.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">{crit.label}</span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {(scores as any)[crit.key]} / 5
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() =>
                          setScores((prev) => ({
                            ...prev,
                            [crit.key]: val,
                          }))
                        }
                        className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          (scores as any)[crit.key] >= val
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        {val}★
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Expert Review Input */}
              <div className="space-y-1 pt-2">
                <label className="text-slate-300 font-medium">Заключение инспектора:</label>
                <textarea
                  rows={3}
                  value={expertComment}
                  onChange={(e) => setExpertComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleSaveInspection('revision')}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  На доработку
                </button>
                <button
                  onClick={() => handleSaveInspection('approved')}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  ✅ Утвердить баллы
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
