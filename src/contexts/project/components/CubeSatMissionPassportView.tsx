import React, { useState } from 'react';
import {
  Rocket,
  Compass,
  Cpu,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Eye,
  Sliders,
  Maximize2,
  Download,
  Share2,
  Atom,
  FlaskConical,
  Dna,
  Binary,
  Radio,
  Activity,
  ShieldCheck,
  Plus,
  X,
  Edit3,
  Check,
  ChevronRight,
  Terminal,
  Bot,
  Box,
  Sun,
} from 'lucide-react';
import {
  Team,
  UserProfile,
  CubeSatMissionPassport,
  CubeSatBlueprint,
  CubeSatFlowchart,
  CubeSatDiagram,
  CubeSatFormula,
  ScienceDiscipline,
} from '@/src/shared/types/index';
import { audioService } from '@/src/shared/lib/audioService';
import { CubeSat3DViewer } from '@/src/contexts/project/components/CubeSat3DViewer';

interface CubeSatMissionPassportViewProps {
  team: Team;
  user: UserProfile;
  onUpdateTeamPassport: (passport: CubeSatMissionPassport) => void;
  onNavigateTab: (tab: string, subView?: string) => void;
}

export const CubeSatMissionPassportView: React.FC<CubeSatMissionPassportViewProps> = ({
  team,
  user,
  onUpdateTeamPassport,
  onNavigateTab,
}) => {
  const passport = team.missionPassport;

  // Active view tabs inside Passport
  const [activeSection, setActiveSection] = useState<
    'overview' | '3d_model' | 'appearance' | 'blueprints' | 'stages'
  >('3d_model');
  const [appearanceMode, setAppearanceMode] = useState<'3d' | 'exterior' | 'interior'>('3d');
  const [selectedDiscipline, setSelectedDiscipline] = useState<ScienceDiscipline | 'all'>('all');
  const [selectedArtifactType, setSelectedArtifactType] = useState<
    'all' | 'blueprints' | 'flowcharts' | 'diagrams' | 'formulas'
  >('all');
  const [activeBlueprintId, setActiveBlueprintId] = useState<string | null>(
    passport?.blueprints[0]?.id || null,
  );

  // Edit Goal / Specs Modal
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempCubesatName, setTempCubesatName] = useState(passport?.cubesatName || team.cubesatName);
  const [tempScientificGoal, setTempScientificGoal] = useState(passport?.scientificGoal || '');
  const [tempPurpose, setTempPurpose] = useState(passport?.purpose || '');
  const [tempAppearance, setTempAppearance] = useState(passport?.appearanceDescription || '');
  const [tempInternal, setTempInternal] = useState(passport?.internalStructure || '');

  // Add new blueprint / formula modal
  const [isAddingArtifact, setIsAddingArtifact] = useState(false);
  const [newArtifactDiscipline, setNewArtifactDiscipline] = useState<ScienceDiscipline>('physics');
  const [newArtifactType, setNewArtifactType] = useState<'blueprint' | 'formula' | 'flowchart'>(
    'blueprint',
  );
  const [newArtifactTitle, setNewArtifactTitle] = useState('');
  const [newArtifactDesc, setNewArtifactDesc] = useState('');
  const [newArtifactFormula, setNewArtifactFormula] = useState('');

  if (!passport) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
        <Rocket className="w-12 h-12 text-indigo-400 mx-auto mb-3 animate-pulse" />
        <h3 className="text-base font-bold text-white mb-2">
          Инициализация бортового паспорта КубСата
        </h3>
        <p className="text-xs">Загрузка данных телеметрии с борта корабля «{team.name}»...</p>
      </div>
    );
  }

  const handleSaveGoalAndSpecs = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CubeSatMissionPassport = {
      ...passport,
      cubesatName: tempCubesatName.trim() || passport.cubesatName,
      scientificGoal: tempScientificGoal.trim() || passport.scientificGoal,
      purpose: tempPurpose.trim() || passport.purpose,
      appearanceDescription: tempAppearance.trim() || passport.appearanceDescription,
      internalStructure: tempInternal.trim() || passport.internalStructure,
    };
    onUpdateTeamPassport(updated);
    setIsEditingGoal(false);
    audioService.playSuccessChime();
  };

  const handleApproveByMCC = (stageId: string) => {
    if (user.role !== 'admin' && user.role !== 'organizer') return;
    const updatedStages = passport.completedStages.map((s) =>
      s.stageId === stageId
        ? { ...s, approvedByEarthMCC: !s.approvedByEarthMCC, completed: true }
        : s,
    );
    onUpdateTeamPassport({ ...passport, completedStages: updatedStages });
    audioService.playSuccessChime();
  };

  const handleAddNewArtifact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtifactTitle.trim()) return;

    const disciplineLabels: Record<ScienceDiscipline, string> = {
      physics: 'Физика',
      chemistry: 'Химия',
      biology: 'Биология',
      ballistics: 'Баллистика',
      electronics: 'Электроника',
    };

    const updated = { ...passport };

    if (newArtifactType === 'blueprint') {
      const newBp: CubeSatBlueprint = {
        id: `bp-${Date.now()}`,
        title: newArtifactTitle.trim(),
        discipline: newArtifactDiscipline,
        disciplineLabel: disciplineLabels[newArtifactDiscipline],
        viewType: 'isometric',
        description: newArtifactDesc.trim() || 'Инженерный чертеж модуля КубСата',
        dimensions: '100 × 100 мм',
        specifications: ['Разработано экипажем корабля', 'Проверено бортовым компьютером «Леший»'],
        systemType: 'payload_sensor',
      };
      updated.blueprints = [newBp, ...passport.blueprints];
    } else if (newArtifactType === 'formula') {
      const newFm: CubeSatFormula = {
        id: `form-${Date.now()}`,
        title: newArtifactTitle.trim(),
        discipline: newArtifactDiscipline,
        disciplineLabel: disciplineLabels[newArtifactDiscipline],
        latex: newArtifactFormula.trim() || 'E = mc^2',
        description: newArtifactDesc.trim() || 'Физико-математический расчет миссии',
        calculationResult: 'Расчет верифицирован бортовым компьютером «Леший».',
      };
      updated.formulas = [newFm, ...passport.formulas];
    } else {
      const newFc: CubeSatFlowchart = {
        id: `fc-${Date.now()}`,
        title: newArtifactTitle.trim(),
        discipline: newArtifactDiscipline,
        disciplineLabel: disciplineLabels[newArtifactDiscipline],
        description: newArtifactDesc.trim() || 'Блок-схема бортового процесса',
        steps: [
          { label: 'Инициализация подсистемы', subtext: 'Подача питания по шине 5В' },
          { label: 'Сбор физических измерений', subtext: 'Опрос сенсоров с частотой 10 Гц' },
          { label: 'Сохранение во Flash-память', subtext: 'Формирование пакета телеметрии' },
        ],
      };
      updated.flowcharts = [newFc, ...passport.flowcharts];
    }

    onUpdateTeamPassport(updated);
    setIsAddingArtifact(false);
    setNewArtifactTitle('');
    setNewArtifactDesc('');
    setNewArtifactFormula('');
    audioService.playSuccessChime();
  };

  const filteredBlueprints = passport.blueprints.filter(
    (b) => selectedDiscipline === 'all' || b.discipline === selectedDiscipline,
  );
  const filteredFlowcharts = passport.flowcharts.filter(
    (fc) => selectedDiscipline === 'all' || fc.discipline === selectedDiscipline,
  );
  const filteredDiagrams = passport.diagrams.filter(
    (d) => selectedDiscipline === 'all' || d.discipline === selectedDiscipline,
  );
  const filteredFormulas = passport.formulas.filter(
    (fm) => selectedDiscipline === 'all' || fm.discipline === selectedDiscipline,
  );

  const selectedBlueprint =
    passport.blueprints.find((b) => b.id === activeBlueprintId) || passport.blueprints[0];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. TOP METAPHOR BANNER: SHIP BRIDGE VS EARTH MCC */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {user.role === 'admin' || user.role === 'organizer' ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Командный пункт Земли (ЦУП КОСМОПОРТ)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5" />
                  Борт космического корабля «{team.name}»
                </span>
              )}

              <span className="text-slate-500 text-xs">·</span>
              <span className="text-slate-300 text-xs font-mono">
                Позывной:{' '}
                <strong className="text-white">{team.shipCallsign || `Борт-«${team.name}»`}</strong>
              </span>

              <span className="text-slate-500 text-xs">·</span>
              <span className="text-emerald-400 text-xs flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Орбита: 410 км
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>Паспорт задачи КубСата: {passport.cubesatName}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 font-mono">
                {passport.cubesatFormat}
              </span>
            </h1>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Экипаж корабля ({team.members.length} исследователей под руководством наставника{' '}
              {team.mentorName}) формирует законченный проект применения точных наук (физика, химия,
              биология) в космическом пространстве.
            </p>
          </div>

          {/* Right Status / Mascot Widget */}
          <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300">
                <Atom className="w-4 h-4 animate-spin" style={{ animationDuration: '10s' }} />
              </div>
              <div className="text-left text-[11px]">
                <div className="text-slate-400 text-[10px]">Бортовой компьютер:</div>
                <div className="font-semibold text-white">Леший готов помочь</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('mascot')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                title="Спросить бортовой компьютер Леший"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Совет Лешего</span>
              </button>

              <button
                onClick={() => {
                  setTempCubesatName(passport.cubesatName);
                  setTempScientificGoal(passport.scientificGoal);
                  setTempPurpose(passport.purpose);
                  setTempAppearance(passport.appearanceDescription);
                  setTempInternal(passport.internalStructure);
                  setIsEditingGoal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Редактировать</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Mission Core Pillars Progress Indicator */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">1. Название КубСата</div>
              <div className="text-slate-400 text-[10px] truncate">{passport.cubesatName}</div>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">2. Цель в космосе</div>
              <div className="text-slate-400 text-[10px] truncate">Физика термосферы</div>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">3. Внешний / Внутр. вид</div>
              <div className="text-slate-400 text-[10px] truncate">Разрезы 3U и PC104+</div>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">4. Чертежи и Формулы</div>
              <div className="text-slate-400 text-[10px] truncate">
                {passport.blueprints.length} черт., {passport.formulas.length} форм.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION BAR BETWEEN PASSPORT SECTIONS */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveSection('3d_model')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === '3d_model'
                ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 text-white shadow font-bold'
                : 'text-indigo-300 hover:text-white bg-indigo-950/40 border border-indigo-500/30'
            }`}
          >
            <Box className="w-3.5 h-3.5 animate-pulse" />
            <span>3D-Модель и Сборка</span>
          </button>

          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Цель и Назначение</span>
          </button>

          <button
            onClick={() => setActiveSection('appearance')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'appearance'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Внешний вид и Внутренности</span>
          </button>

          <button
            onClick={() => setActiveSection('blueprints')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'blueprints'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>
              Чертежи, Схемы и Формулы ({passport.blueprints.length + passport.formulas.length})
            </span>
          </button>

          <button
            onClick={() => setActiveSection('stages')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'stages'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Этапы и Допуск ЦУП Земли</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('cases', 'slides')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-slate-800"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Слайды защиты</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. SECTION CONTENT */}

      {/* SECTION 3D: ДИНАМИЧЕСКАЯ 3D-СБОРКА КУБСАТА НА ОСНОВЕ ДАННЫХ ПАСПОРТА */}
      {activeSection === '3d_model' && (
        <div className="space-y-5">
          {/* Main 3D Interactive WebGL Component */}
          <CubeSat3DViewer
            passport={passport}
            activeBlueprintId={activeBlueprintId}
            onSelectBlueprint={(bpId) => {
              setActiveBlueprintId(bpId);
              setActiveSection('blueprints');
            }}
          />

          {/* Connected Passport Subsystems Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Box className="w-4 h-4" />
                <span>Геометрия и формат {passport.cubesatFormat}</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                3D-модель автоматически собрана по стандарту CalPoly с габаритами{' '}
                {passport.cubesatFormat === '1U'
                  ? '100×100×113.5 мм'
                  : passport.cubesatFormat === '2U'
                    ? '100×100×227 мм'
                    : '100×100×340.5 мм'}
                . 4 рельса из алюминия 7075-T6 анодированы для скольжения в пусковом контейнере
                P-POD.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Sun className="w-4 h-4" />
                <span>Энергетический баланс миссии</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                В модель интегрированы раскрываемые крылья солнечных батарей GaAs и 4 ячейки LiFePO4
                (45 Вт·ч). Используйте кнопку «Крылья СБ» для симуляции раскрытия в полете после
                отделения от ракеты-носителя.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Cpu className="w-4 h-4" />
                <span>Связь с чертежами и формулами</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Кликните на любой модуль в 3D (акселерометр, батарею, ADCS, антенны), чтобы перейти
                к соответствующему чертежу и расчетным формулам физики в паспорте.
              </p>
              <button
                onClick={() => setActiveSection('blueprints')}
                className="mt-1 w-full py-1.5 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Перейти к чертежам ({passport.blueprints.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION A: ЦЕЛЬ, ДОСТИЖИМАЯ ДЛЯ КОМАНДЫ, И НАЗНАЧЕНИЕ КУБСАТА */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {/* Scientific Goal Card */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Rocket className="w-4 h-4" />
                  Тематический физический проект (Цель миссии в космосе)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Школьный курс физики 10-11 класс
                </span>
              </div>

              <div className="text-sm font-semibold text-white leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                {passport.scientificGoal}
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase text-[10px]">
                  Практическое назначение наноспутника:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  {passport.purpose}
                </p>
              </div>
            </div>

            {/* Crew roles on the Starship */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Atom className="w-4 h-4 text-indigo-400" />
                  Распределение ролей на борту корабля «{team.name}»
                </h3>
                <span className="text-[11px] text-emerald-400 font-mono">Экипаж активен</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1"
                  >
                    <div className="font-semibold text-white truncate">{member.name}</div>
                    <div className="text-[11px] text-indigo-300 font-medium">
                      {member.role === 'captain'
                        ? '👨‍✈️ Капитан / Командир'
                        : member.role === 'physicist'
                          ? '🔭 Физик-теоретик'
                          : member.role === 'engineer'
                            ? '⚙️ Бортинженер'
                            : '🌱 Биолог-исследователь'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {member.grade} класс · {team.school}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-center gap-2.5 text-xs text-indigo-200">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Руководитель полета (наставник): <strong>{team.mentorName}</strong> (
                  {team.mentorEmail})
                </span>
              </div>
            </div>
          </div>

          {/* Right Sidebar: CubeSat Specs & Mascot Advice */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Спецификация космического аппарата
              </h3>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Форм-фактор</span>
                  <span className="text-indigo-300 font-bold">
                    {passport.cubesatFormat} (Стандарт CalPoly)
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Габариты</span>
                  <span className="text-white">100 × 100 × 340.5 мм</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Предельная масса</span>
                  <span className="text-white">до 4.0 кг</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Шина питания</span>
                  <span className="text-amber-400">EPS 3.3В / 5В / 12В</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Аккумуляторы</span>
                  <span className="text-emerald-400">LiFePO4 45 Вт·ч</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Радиоканал</span>
                  <span className="text-sky-400">UHF/VHF 437.25 МГц</span>
                </div>
              </div>
            </div>

            {/* Mascot Commentary Card */}
            <div className="p-4 bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Совет бортового компьютера «Леший»:</div>
                  <div className="text-[10px] text-indigo-300">Бортовой ассистент корабля</div>
                </div>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                «Отличная компоновка, экипаж! Физическая цель миссии в термосфере требует строго
                ориентированного полета. Обязательно проверьте формулу аэродинамического торможения
                в разделе чертежей и блок-схему ADCS!»
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: ПОЛНОЕ ОПИСАНИЕ ВНЕШНЕГО ВИДА И ВНУТРЕННЕГО СОДЕРЖАНИЯ */}
      {activeSection === 'appearance' && (
        <div className="space-y-4">
          {/* Mode Switcher: 3D vs Exterior vs Interior */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setAppearanceMode('3d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  appearanceMode === '3d'
                    ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 text-white shadow font-bold'
                    : 'text-indigo-300 hover:text-white bg-indigo-950/40 border border-indigo-500/30'
                }`}
              >
                <Box className="w-3.5 h-3.5 animate-pulse" />
                <span>3D Интерактивная сборка (Three.js)</span>
              </button>
              <button
                onClick={() => setAppearanceMode('exterior')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  appearanceMode === 'exterior'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>2D Внешний вид (CAD-чертеж)</span>
              </button>
              <button
                onClick={() => setAppearanceMode('interior')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  appearanceMode === 'interior'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2D Внутренний разрез (CAD-чертеж)</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Масштаб 1:1 · Формат {passport.cubesatFormat} (CalPoly 3U)
            </span>
          </div>

          {appearanceMode === '3d' ? (
            <CubeSat3DViewer
              passport={passport}
              activeBlueprintId={activeBlueprintId}
              onSelectBlueprint={(bpId) => {
                setActiveBlueprintId(bpId);
                setActiveSection('blueprints');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Visual CAD Schema Box */}
              <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-4 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1 text-indigo-400">
                    <Terminal className="w-3.5 h-3.5" />
                    CAD-BLUEPRINT // VSTK-3U-REV4
                  </span>
                  <span>ГОСТ Р 56461-2015 / CalPoly 3U</span>
                </div>

                {/* SVG CAD Drawing for Exterior or Interior */}
                <div className="w-full flex items-center justify-center py-4">
                  {appearanceMode === 'exterior' ? (
                    /* EXTERIOR SVG SCHEMATIC */
                    <svg
                      viewBox="0 0 500 320"
                      className="w-full max-h-[300px] text-indigo-400 stroke-current fill-none font-mono text-[9px]"
                    >
                      {/* Grid Background */}
                      <defs>
                        <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path
                            d="M 20 0 L 0 0 0 20"
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="0.5"
                          />
                        </pattern>
                      </defs>
                      <rect width="500" height="320" fill="url(#cad-grid)" />

                      {/* Chassis 3U Outline */}
                      <rect
                        x="180"
                        y="40"
                        width="140"
                        height="240"
                        rx="4"
                        stroke="#6366f1"
                        strokeWidth="2"
                        fill="#0f172a"
                        fillOpacity="0.8"
                      />

                      {/* Rails */}
                      <rect x="175" y="36" width="6" height="248" fill="#475569" stroke="#64748b" />
                      <rect x="319" y="36" width="6" height="248" fill="#475569" stroke="#64748b" />

                      {/* Solar Panels (Deployable Wings) */}
                      <rect
                        x="40"
                        y="60"
                        width="130"
                        height="90"
                        rx="2"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        fill="#0369a1"
                        fillOpacity="0.2"
                        strokeDasharray="3 3"
                      />
                      <text x="65" y="110" fill="#38bdf8" stroke="none">
                        Крыло СБ №1 (GaAs)
                      </text>
                      <line x1="40" y1="90" x2="170" y2="90" stroke="#38bdf8" strokeWidth="0.5" />
                      <line x1="105" y1="60" x2="105" y2="150" stroke="#38bdf8" strokeWidth="0.5" />

                      <rect
                        x="330"
                        y="60"
                        width="130"
                        height="90"
                        rx="2"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        fill="#0369a1"
                        fillOpacity="0.2"
                        strokeDasharray="3 3"
                      />
                      <text x="355" y="110" fill="#38bdf8" stroke="none">
                        Крыло СБ №2 (GaAs)
                      </text>
                      <line x1="330" y1="90" x2="460" y2="90" stroke="#38bdf8" strokeWidth="0.5" />
                      <line x1="395" y1="60" x2="395" y2="150" stroke="#38bdf8" strokeWidth="0.5" />

                      {/* Body Solar Cells */}
                      <rect
                        x="195"
                        y="55"
                        width="110"
                        height="60"
                        rx="2"
                        stroke="#818cf8"
                        strokeWidth="1"
                        fill="#1e1b4b"
                        fillOpacity="0.4"
                      />
                      <rect
                        x="195"
                        y="125"
                        width="110"
                        height="60"
                        rx="2"
                        stroke="#818cf8"
                        strokeWidth="1"
                        fill="#1e1b4b"
                        fillOpacity="0.4"
                      />
                      <rect
                        x="195"
                        y="195"
                        width="110"
                        height="60"
                        rx="2"
                        stroke="#818cf8"
                        strokeWidth="1"
                        fill="#1e1b4b"
                        fillOpacity="0.4"
                      />

                      {/* Antenna Array */}
                      <line x1="250" y1="280" x2="250" y2="315" stroke="#ef4444" strokeWidth="2" />
                      <circle cx="250" cy="315" r="3" fill="#ef4444" />
                      <text x="260" y="310" fill="#ef4444" stroke="none">
                        UHF Антенна (437 МГц)
                      </text>

                      {/* Star Tracker / Optical Lens */}
                      <circle
                        cx="250"
                        cy="40"
                        r="8"
                        stroke="#10b981"
                        strokeWidth="2"
                        fill="#064e3b"
                      />
                      <text x="265" y="35" fill="#10b981" stroke="none">
                        Оптический звездный датчик
                      </text>

                      {/* Dimensions Leader lines */}
                      <line x1="160" y1="40" x2="160" y2="280" stroke="#94a3b8" strokeWidth="1" />
                      <line x1="155" y1="40" x2="165" y2="40" stroke="#94a3b8" strokeWidth="1" />
                      <line x1="155" y1="280" x2="165" y2="280" stroke="#94a3b8" strokeWidth="1" />
                      <text x="110" y="165" fill="#94a3b8" stroke="none">
                        H = 340.5 мм
                      </text>

                      <line x1="180" y1="295" x2="320" y2="295" stroke="#94a3b8" strokeWidth="1" />
                      <text x="225" y="308" fill="#94a3b8" stroke="none">
                        W = 100 мм
                      </text>
                    </svg>
                  ) : (
                    /* INTERIOR CROSS-SECTION SVG SCHEMATIC */
                    <svg
                      viewBox="0 0 500 320"
                      className="w-full max-h-[300px] text-indigo-400 stroke-current fill-none font-mono text-[9px]"
                    >
                      <defs>
                        <pattern
                          id="cad-grid-int"
                          width="20"
                          height="20"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 20 0 L 0 0 0 20"
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="0.5"
                          />
                        </pattern>
                      </defs>
                      <rect width="500" height="320" fill="url(#cad-grid-int)" />

                      {/* Outer Frame Cutout */}
                      <rect
                        x="150"
                        y="30"
                        width="200"
                        height="260"
                        rx="4"
                        stroke="#6366f1"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                      />

                      {/* SECTION 1: PAYLOAD (Top 1U) */}
                      <rect
                        x="160"
                        y="40"
                        width="180"
                        height="75"
                        rx="3"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        fill="#064e3b"
                        fillOpacity="0.2"
                      />
                      <text x="170" y="58" fill="#10b981" stroke="none" fontWeight="bold">
                        УРОВЕНЬ 1 // НАУЧНАЯ ПОЛЕЗНАЯ НАГРУЗКА
                      </text>
                      <rect
                        x="180"
                        y="65"
                        width="60"
                        height="40"
                        stroke="#34d399"
                        strokeWidth="1"
                        fill="#047857"
                        fillOpacity="0.3"
                      />
                      <text x="185" y="85" fill="#34d399" stroke="none">
                        MEMS Акселерометр
                      </text>
                      <rect
                        x="250"
                        y="65"
                        width="75"
                        height="40"
                        stroke="#34d399"
                        strokeWidth="1"
                        fill="#047857"
                        fillOpacity="0.3"
                      />
                      <text x="255" y="85" fill="#34d399" stroke="none">
                        Герметичный биомодуль
                      </text>

                      {/* PC104 Stacking Bus */}
                      <line
                        x1="170"
                        y1="35"
                        x2="170"
                        y2="285"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                      <text x="80" y="160" fill="#f59e0b" stroke="none">
                        Шина PC104+
                      </text>

                      {/* SECTION 2: OBC & ADCS (Middle 1U) */}
                      <rect
                        x="160"
                        y="122"
                        width="180"
                        height="75"
                        rx="3"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        fill="#0369a1"
                        fillOpacity="0.2"
                      />
                      <text x="170" y="140" fill="#38bdf8" stroke="none" fontWeight="bold">
                        УРОВЕНЬ 2 // БОРТОВАЯ ЭВМ (OBC) + ADCS
                      </text>
                      <rect
                        x="175"
                        y="148"
                        width="70"
                        height="40"
                        stroke="#60a5fa"
                        strokeWidth="1"
                        fill="#1d4ed8"
                        fillOpacity="0.3"
                      />
                      <text x="180" y="168" fill="#93c5fd" stroke="none">
                        STM32F4 OBC
                      </text>
                      <circle
                        cx="285"
                        cy="168"
                        r="16"
                        stroke="#60a5fa"
                        strokeWidth="1.5"
                        fill="#1e3a8a"
                      />
                      <text x="270" y="172" fill="#93c5fd" stroke="none">
                        Маховики
                      </text>

                      {/* SECTION 3: EPS & BATTERIES (Bottom 1U) */}
                      <rect
                        x="160"
                        y="204"
                        width="180"
                        height="75"
                        rx="3"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        fill="#881337"
                        fillOpacity="0.2"
                      />
                      <text x="170" y="222" fill="#f43f5e" stroke="none" fontWeight="bold">
                        УРОВЕНЬ 3 // ПИТАНИЕ EPS + LiFePO4
                      </text>
                      <rect
                        x="175"
                        y="230"
                        width="35"
                        height="42"
                        rx="4"
                        stroke="#fb7185"
                        strokeWidth="1"
                        fill="#e11d48"
                        fillOpacity="0.3"
                      />
                      <rect
                        x="215"
                        y="230"
                        width="35"
                        height="42"
                        rx="4"
                        stroke="#fb7185"
                        strokeWidth="1"
                        fill="#e11d48"
                        fillOpacity="0.3"
                      />
                      <rect
                        x="255"
                        y="230"
                        width="35"
                        height="42"
                        rx="4"
                        stroke="#fb7185"
                        strokeWidth="1"
                        fill="#e11d48"
                        fillOpacity="0.3"
                      />
                      <rect
                        x="295"
                        y="230"
                        width="35"
                        height="42"
                        rx="4"
                        stroke="#fb7185"
                        strokeWidth="1"
                        fill="#e11d48"
                        fillOpacity="0.3"
                      />
                      <text x="180" y="255" fill="#ffe4e6" stroke="none">
                        LiFePO4
                      </text>
                    </svg>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>
                    Проекция:{' '}
                    {appearanceMode === 'exterior'
                      ? 'Изометрический вид оболочки'
                      : 'Послойный разрез шасси PC104+'}
                  </span>
                  <span className="text-indigo-400">Спецификация ГОСТ Р</span>
                </div>
              </div>

              {/* Description Text & Specs Breakdown */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    {appearanceMode === 'exterior'
                      ? 'Описание внешнего вида'
                      : 'Описание внутреннего содержания'}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    {appearanceMode === 'exterior'
                      ? passport.appearanceDescription
                      : passport.internalStructure}
                  </p>

                  <div className="space-y-2 pt-1 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {appearanceMode === 'exterior'
                        ? 'Ключевые внешние узлы:'
                        : 'Внутренние бортовые узлы:'}
                    </span>
                    {appearanceMode === 'exterior' ? (
                      <ul className="space-y-1.5 text-slate-300 text-[11px]">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          Алюминиевый монокок сплава АМг6 с рельсами стандарта P-POD
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />4 раскрываемые
                          панели солнечных элементов GaAs (КПД 29.5%)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Оптический звездный датчик и защитное кварцевое стекло
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Ленточная рулеточная антенна UHF/VHF диапазона 437 МГц
                        </li>
                      </ul>
                    ) : (
                      <ul className="space-y-1.5 text-slate-300 text-[11px]">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Верхний отсек: 3-осевой прецизионный MEMS-акселерометр
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          Средний отсек: Компьютер OBC (FreeRTOS) + маховики ADCS
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Нижний отсек: 4 безопасные ячейки LiFePO4 (45 Вт·ч) с нагревателями
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Объединительная системная шина PC104+ с линиями питания и SPI/I2C
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION C: ИНЖЕНЕРНЫЙ АРХИВ — ЧЕРТЕЖИ, БЛОК-СХЕМЫ, ДИАГРАММЫ И ФОРМУЛЫ (ФИЗИКА, ХИМИЯ, БИОЛОГИЯ) */}
      {activeSection === 'blueprints' && (
        <div className="space-y-5">
          {/* Filter Bar: Disciplines and Artifact Types */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
            {/* Discipline filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">
                Наука:
              </span>
              <button
                onClick={() => setSelectedDiscipline('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  selectedDiscipline === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Все точные науки
              </button>
              <button
                onClick={() => setSelectedDiscipline('physics')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  selectedDiscipline === 'physics'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Atom className="w-3 h-3 text-indigo-400" />
                <span>Физика</span>
              </button>
              <button
                onClick={() => setSelectedDiscipline('chemistry')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  selectedDiscipline === 'chemistry'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FlaskConical className="w-3 h-3 text-sky-400" />
                <span>Химия</span>
              </button>
              <button
                onClick={() => setSelectedDiscipline('biology')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  selectedDiscipline === 'biology'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Dna className="w-3 h-3 text-emerald-400" />
                <span>Биология</span>
              </button>
              <button
                onClick={() => setSelectedDiscipline('ballistics')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  selectedDiscipline === 'ballistics'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3 h-3 text-amber-400" />
                <span>Баллистика</span>
              </button>
            </div>

            {/* Add to project button */}
            <button
              onClick={() => setIsAddingArtifact(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить чертеж / формулу</span>
            </button>
          </div>

          {/* Artifacts Grid */}
          <div className="space-y-6">
            {/* 1. BLUEPRINTS / ЧЕРТЕЖИ */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Конструкторские чертежи КубСата ({filteredBlueprints.length})
                </h4>
                <span className="text-[10px] text-slate-500">
                  Точные науки и габаритные спецификации
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBlueprints.map((bp) => (
                  <div
                    key={bp.id}
                    className="p-4 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl space-y-3 transition-colors text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                          {bp.disciplineLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {bp.dimensions}
                        </span>
                      </div>

                      <h5 className="font-bold text-white text-sm">{bp.title}</h5>
                      <p className="text-slate-300 text-xs leading-relaxed">{bp.description}</p>

                      <div className="space-y-1 pt-1 border-t border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Технические параметры:
                        </span>
                        {bp.specifications.map((spec, sIdx) => (
                          <div
                            key={sIdx}
                            className="text-[11px] text-slate-400 flex items-start gap-1.5"
                          >
                            <span className="text-indigo-400 font-bold">›</span>
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>
                        Вид:{' '}
                        {bp.viewType === 'cross_section'
                          ? 'Сечение'
                          : bp.viewType === 'isometric'
                            ? 'Изометрия'
                            : 'Внешний'}
                      </span>
                      <span className="text-emerald-400">В архиве проекта ✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. FORMULAS / ФИЗИЧЕСКИЕ И ХИМИЧЕСКИЕ РАСЧЕТЫ */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Atom className="w-4 h-4 text-indigo-400" />
                  Физико-математические формулы и расчеты миссии ({filteredFormulas.length})
                </h4>
                <span className="text-[10px] text-slate-500">
                  Законы физики, химии и биологии в космосе
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFormulas.map((fm) => (
                  <div
                    key={fm.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                          {fm.disciplineLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Расчет команды</span>
                      </div>

                      <h5 className="font-bold text-white text-sm">{fm.title}</h5>

                      {/* LaTeX formula visual card */}
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center font-mono text-indigo-300 text-sm">
                        {fm.latex}
                      </div>

                      <p className="text-slate-300 text-xs leading-relaxed">{fm.description}</p>
                    </div>

                    <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 font-mono">
                      <strong>Результат расчетов:</strong> {fm.calculationResult}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. FLOWCHARTS & DIAGRAMS / БЛОК-СХЕМЫ И ДИАГРАММЫ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Flowcharts */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Блок-схемы бортовых алгоритмов
                </h4>

                <div className="space-y-3">
                  {filteredFlowcharts.map((fc) => (
                    <div
                      key={fc.id}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs"
                    >
                      <div>
                        <div className="text-[10px] text-indigo-400 font-semibold">
                          {fc.disciplineLabel}
                        </div>
                        <h5 className="font-bold text-white text-sm">{fc.title}</h5>
                        <p className="text-slate-400 text-[11px] mt-0.5">{fc.description}</p>
                      </div>

                      <div className="space-y-2">
                        {fc.steps.map((st, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                              {sIdx + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-white text-xs">{st.label}</div>
                              <div className="text-[11px] text-slate-400">{st.subtext}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagrams */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  Диаграммы миссии и термобаланса
                </h4>

                <div className="space-y-3">
                  {filteredDiagrams.map((dg) => (
                    <div
                      key={dg.id}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs"
                    >
                      <div>
                        <div className="text-[10px] text-indigo-400 font-semibold">
                          {dg.disciplineLabel}
                        </div>
                        <h5 className="font-bold text-white text-sm">{dg.title}</h5>
                        <p className="text-slate-400 text-[11px] mt-0.5">{dg.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center font-mono">
                        {dg.keyValues.map((kv, kvIdx) => (
                          <div
                            key={kvIdx}
                            className="p-2.5 bg-slate-950 rounded-xl border border-slate-800"
                          >
                            <div className="text-[10px] text-slate-400">{kv.label}</div>
                            <div className="text-sm font-bold text-indigo-300 mt-0.5">
                              {kv.value} <span className="text-xs text-slate-400">{kv.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION D: ЭТАПЫ МЕРОПРИЯТИЙ И СОГЛАСОВАНИЕ С КОМАНДНЫМ ПУНКТОМ ЗЕМЛИ */}
      {activeSection === 'stages' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Этапы выполнения задачи и допуск Командного Пункта Земли (ЦУП)
              </h3>
              <span className="text-[11px] text-slate-400">
                {user.role === 'admin' || user.role === 'organizer'
                  ? 'Режим ЦУП: Вы можете утверждать этапы'
                  : 'Статус допуска экипажа'}
              </span>
            </div>

            <div className="space-y-3">
              {passport.completedStages.map((st, idx) => (
                <div
                  key={st.stageId}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        st.completed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{st.title}</span>
                        {st.approvedByEarthMCC && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                            ✓ Утверждено ЦУП Земли
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{st.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {user.role === 'admin' || user.role === 'organizer' ? (
                      <button
                        onClick={() => handleApproveByMCC(st.stageId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                          st.approvedByEarthMCC
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{st.approvedByEarthMCC ? 'Допуск выдан' : 'Выдать допуск ЦУП'}</span>
                      </button>
                    ) : (
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono ${
                          st.completed
                            ? 'text-emerald-400 bg-emerald-950/30'
                            : 'text-slate-400 bg-slate-900'
                        }`}
                      >
                        {st.completed ? 'Выполнено экипажем' : 'В работе'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT GOAL & PASSPORT DATA */}
      {isEditingGoal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Редактирование задачи КубСата</span>
              </h3>
              <button
                onClick={() => setIsEditingGoal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveGoalAndSpecs}
              className="flex-1 overflow-y-auto p-4 space-y-4 text-xs"
            >
              <div>
                <label className="block text-[11px] uppercase font-semibold text-slate-300 mb-1">
                  Название КубСата:
                </label>
                <input
                  type="text"
                  value={tempCubesatName}
                  onChange={(e) => setTempCubesatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-slate-300 mb-1">
                  Цель, достижимая для команды (Тематический проект по физике):
                </label>
                <textarea
                  rows={3}
                  value={tempScientificGoal}
                  onChange={(e) => setTempScientificGoal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-slate-300 mb-1">
                  Назначение КубСата:
                </label>
                <textarea
                  rows={2}
                  value={tempPurpose}
                  onChange={(e) => setTempPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-slate-300 mb-1">
                  Полное описание внешнего вида КубСата:
                </label>
                <textarea
                  rows={3}
                  value={tempAppearance}
                  onChange={(e) => setTempAppearance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-slate-300 mb-1">
                  Внутреннее содержание (компоновка и подсистемы):
                </label>
                <textarea
                  rows={3}
                  value={tempInternal}
                  onChange={(e) => setTempInternal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingGoal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Сохранить в паспорт</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW BLUEPRINT / FORMULA / FLOWCHART */}
      {isAddingArtifact && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Добавить артефакт в проект КубСата</span>
              </h3>
              <button
                onClick={() => setIsAddingArtifact(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleAddNewArtifact}
              className="flex-1 overflow-y-auto p-4 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Тип элемента:</label>
                  <select
                    value={newArtifactType}
                    onChange={(e) => setNewArtifactType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none"
                  >
                    <option value="blueprint">📐 Чертеж / Схема узла</option>
                    <option value="formula">🧮 Физическая формула</option>
                    <option value="flowchart">📊 Блок-схема процесса</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Раздел точных наук:
                  </label>
                  <select
                    value={newArtifactDiscipline}
                    onChange={(e) => setNewArtifactDiscipline(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none"
                  >
                    <option value="physics">Физика</option>
                    <option value="chemistry">Химия</option>
                    <option value="biology">Биология</option>
                    <option value="ballistics">Баллистика</option>
                    <option value="electronics">Электроника</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-slate-300 mb-1">
                  Название чертежа / формулы:
                </label>
                <input
                  type="text"
                  value={newArtifactTitle}
                  onChange={(e) => setNewArtifactTitle(e.target.value)}
                  placeholder="Например: Закон Стефана-Больцмана или Чертеж солнечной петли"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              {newArtifactType === 'formula' && (
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-slate-300 mb-1">
                    Формула (LaTeX):
                  </label>
                  <input
                    type="text"
                    value={newArtifactFormula}
                    onChange={(e) => setNewArtifactFormula(e.target.value)}
                    placeholder="P = S * E0 * cos(theta)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] uppercase font-semibold text-slate-300 mb-1">
                  Описание и соответствие выполняемым задачам:
                </label>
                <textarea
                  rows={3}
                  value={newArtifactDesc}
                  onChange={(e) => setNewArtifactDesc(e.target.value)}
                  placeholder="Опишите, как этот чертеж или формула решает космическую задачу команды..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingArtifact(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Добавить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
