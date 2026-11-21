import React, { useState, useMemo } from 'react';
import {
  Rocket,
  Send,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Satellite,
  Radio,
  Cpu,
  FileText,
  RefreshCw,
  Award,
  Layers,
  RadioTower,
  Microscope,
  Compass,
  Info,
} from 'lucide-react';

import type {
  Team,
  Submission,
  UserRole,
  SpacePiApplication,
  SpacePiIdea,
  SpacePiConstellationSatellite,
  SpacePiMissionCategory,
} from '../../types';

import {
  SPACE_PI_CONSTELLATION,
  SPACE_PI_IDEAS_BANK,
  INITIAL_SPACE_PI_APPLICATIONS,
  calculateSpacePiCompliance,
  generateSpacePiRegistrationCode,
  syncApplicationFromChampionship,
} from '../../data/spacePiData';

import { generateSpacePiPassportPdf } from '../../services/spacePiPdfExport';

interface SpacePiTabProps {
  team: Team;
  allTeams: Team[];
  submissions: Submission[];
  userRole: UserRole;
  onOpenStage?: (stageId: string) => void;
}

export const SpacePiTab: React.FC<SpacePiTabProps> = ({
  team,
  allTeams,
  submissions,
  userRole,
}) => {
  const [subTab, setSubTab] = useState<
    'application' | 'ideas' | 'constellation' | 'registry' | 'guidelines'
  >('application');

  // Applications state
  const [applications, setApplications] = useState<Record<string, SpacePiApplication>>(
    INITIAL_SPACE_PI_APPLICATIONS,
  );

  // Active team application (or initialize if doesn't exist)
  const currentApp = useMemo(() => {
    if (applications[team.id]) {
      return applications[team.id];
    }
    const synced = syncApplicationFromChampionship(team, submissions);
    const { score, checklist } = calculateSpacePiCompliance(synced);
    const newApp: SpacePiApplication = {
      id: `app_${team.id}`,
      teamId: team.id,
      teamName: team.name,
      projectName: synced.projectName || `Научная полезная нагрузка «${team.name}»`,
      satelliteName: synced.satelliteName || `${team.name}-3U (${team.city})`,
      missionCategory: synced.missionCategory || 'space_weather',
      missionGoal: synced.missionGoal || '',
      scientificNovelty: synced.scientificNovelty || '',
      payloadDescription: synced.payloadDescription || '',
      platformFormat: 'CubeSat 3U',
      payloadMassGrams: synced.payloadMassGrams || 650,
      payloadDimensionsMm: synced.payloadDimensionsMm || { x: 85, y: 85, z: 80 },
      powerConsumptionWatts: synced.powerConsumptionWatts || { average: 3.5, peak: 6.0 },
      supplyVoltage: synced.supplyVoltage || '5V',
      dataInterface: synced.dataInterface || 'I2C',
      dailyDataVolumeMb: synced.dailyDataVolumeMb || 16,
      radioFrequencyMhz: synced.radioFrequencyMhz || 437.425,
      soniksIntegration: synced.soniksIntegration || {
        enabled: true,
        openBeaconDesc: `Открытый телеметрический маяк «${team.name}» для станций СОНИКС на 437.425 МГц`,
        amateurCallsign: 'RS51S',
        telemetryFormat: 'USP SPUTNIX / AX.25',
      },
      schoolInvolvementPlan: synced.schoolInvolvementPlan || '',
      teamMembersSummary: synced.teamMembersSummary || '',
      mentorSummary: synced.mentorSummary || '',
      status: 'draft',
      complianceScore: score,
      checklist,
    };
    return newApp;
  }, [applications, team, submissions]);

  // Form field states
  const [formData, setFormData] = useState<SpacePiApplication>(currentApp);
  const [selectedIdeaCategory, setSelectedIdeaCategory] = useState<string>('all');
  const [selectedConstellationSat, setSelectedConstellationSat] =
    useState<SpacePiConstellationSatellite | null>(SPACE_PI_CONSTELLATION[0]);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [juryNoteText, setJuryNoteText] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // Dynamic compliance calculation
  const compliance = useMemo(() => {
    return calculateSpacePiCompliance(formData);
  }, [formData]);

  const handleFieldChange = <K extends keyof SpacePiApplication>(
    key: K,
    value: SpacePiApplication[K],
  ) => {
    const updated = { ...formData, [key]: value };
    const { score, checklist } = calculateSpacePiCompliance(updated);
    updated.complianceScore = score;
    updated.checklist = checklist;
    setFormData(updated);
  };

  const handleSaveDraft = () => {
    setApplications((prev) => ({
      ...prev,
      [team.id]: {
        ...formData,
        complianceScore: compliance.score,
        checklist: compliance.checklist,
      },
    }));
    setSaveBanner('Проектная заявка успешно сохранена в реестре!');
    setTimeout(() => setSaveBanner(null), 3000);
  };

  const handleSyncFromStages = () => {
    const synced = syncApplicationFromChampionship(team, submissions);
    const merged: SpacePiApplication = {
      ...formData,
      ...synced,
    };
    const { score, checklist } = calculateSpacePiCompliance(merged);
    merged.complianceScore = score;
    merged.checklist = checklist;
    setFormData(merged);
    setSaveBanner('Данные успешно импортированы из решений 5 этапов чемпионата!');
    setTimeout(() => setSaveBanner(null), 3500);
  };

  const handleApplyIdeaTemplate = (idea: SpacePiIdea) => {
    const merged: SpacePiApplication = {
      ...formData,
      projectName: idea.templateData.projectName || idea.title,
      missionCategory: idea.category,
      missionGoal: idea.templateData.missionGoal || idea.summary,
      scientificNovelty: idea.templateData.scientificNovelty || idea.scientificValue,
      payloadDescription: idea.templateData.payloadDescription || idea.payloadComponents.join(', '),
      payloadMassGrams: idea.specs.massG,
      powerConsumptionWatts: idea.templateData.powerConsumptionWatts || {
        average: idea.specs.powerW,
        peak: Number((idea.specs.powerW * 1.6).toFixed(1)),
      },
      schoolInvolvementPlan: idea.soniksExperiment,
    };
    const { score, checklist } = calculateSpacePiCompliance(merged);
    merged.complianceScore = score;
    merged.checklist = checklist;
    setFormData(merged);
    setSubTab('application');
    setSaveBanner(`Идея «${idea.title}» загружена в вашу проектную заявку!`);
    setTimeout(() => setSaveBanner(null), 4000);
  };

  const handleSubmitToSpacePi = () => {
    const regCode =
      formData.spacePiRegistrationCode || generateSpacePiRegistrationCode(team.city, team.name);
    const updated: SpacePiApplication = {
      ...formData,
      status: 'submitted_to_spacepi',
      spacePiRegistrationCode: regCode,
      submittedAt: new Date().toLocaleString('ru-RU'),
      complianceScore: 100,
    };
    setFormData(updated);
    setApplications((prev) => ({
      ...prev,
      [team.id]: updated,
    }));
    setShowSubmitModal(true);
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await generateSpacePiPassportPdf(formData, team);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportJson = () => {
    const exportPayload = {
      source: 'Cosmoport Space Championship',
      platform: 'https://spacepi.space',
      contest:
        'Грантовый конкурс полезных нагрузок CubeSat 3U (Фонд содействия инновациям / Дежурный по планете)',
      registeredAt: new Date().toISOString(),
      team: {
        id: team.id,
        name: team.name,
        school: team.school,
        city: team.city,
        league: team.league,
        mentor: `${team.mentorName} (${team.mentorTitle})`,
        members: team.members,
      },
      application: formData,
      complianceValidation: compliance,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SpacePi_Application_${team.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddJuryNote = () => {
    if (!juryNoteText.trim()) return;
    const notes = formData.juryNotes
      ? [...formData.juryNotes, juryNoteText.trim()]
      : [juryNoteText.trim()];
    const updated = { ...formData, juryNotes: notes };
    setFormData(updated);
    setApplications((prev) => ({ ...prev, [team.id]: updated }));
    setJuryNoteText('');
  };

  const filteredIdeas = useMemo(() => {
    if (selectedIdeaCategory === 'all') return SPACE_PI_IDEAS_BANK;
    return SPACE_PI_IDEAS_BANK.filter((i) => i.category === selectedIdeaCategory);
  }, [selectedIdeaCategory]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Space-pi Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                <Satellite className="h-3.5 w-3.5" />
                Официальный финал: Интеграция с Space-π
              </span>
              <a
                href="https://spacepi.space"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-300 hover:border-sky-400 hover:text-sky-200 transition-colors"
              >
                spacepi.space
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-mono text-amber-300">
                КубСат 3U • Сеть СОНИКС • Фонд содействия инновациям
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Заявка в созвездие школьных спутников Space-π</span>
            </h1>

            <p className="max-w-3xl text-sm text-slate-300 leading-relaxed">
              Главный итог чемпионата — оформление идеи полезной нагрузки вашей команды в
              официальную проектную заявку для конкурса{' '}
              <strong>Space-π («Дежурный по планете»)</strong> с перспективой реального запуска на
              орбиту на отечественной платформе CubeSat 3U и открытой трансляцией данных через сеть
              станций <strong>СОНИКС</strong>.
            </p>
          </div>

          {/* Quick Status / Registration Badge */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 min-w-[240px]">
            <div className="rounded-xl border border-sky-500/30 bg-slate-900/90 p-4 text-left md:text-right w-full">
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Статус заявки команды
              </div>
              <div className="mt-1 flex items-center md:justify-end gap-2">
                {formData.status === 'submitted_to_spacepi' ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Подана на spacepi.space
                  </span>
                ) : formData.status === 'jury_approved' ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-400">
                    <Award className="h-4 w-4" />
                    Одобрена жюри к подаче
                  </span>
                ) : formData.status === 'ready_for_review' ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-400">
                    <Layers className="h-4 w-4" />
                    Готова к экспертизе
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-300">
                    <FileText className="h-4 w-4" />
                    Черновик в разработке
                  </span>
                )}
              </div>
              {formData.spacePiRegistrationCode && (
                <div className="mt-1 font-mono text-xs text-sky-300 font-semibold">
                  {formData.spacePiRegistrationCode}
                </div>
              )}
              {/* Compliance bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Соответствие регламенту:</span>
                  <span className="font-bold text-sky-300 font-mono">{compliance.score}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      compliance.score === 100
                        ? 'bg-emerald-400'
                        : compliance.score >= 80
                          ? 'bg-sky-400'
                          : 'bg-amber-400'
                    }`}
                    style={{ width: `${compliance.score}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtabs navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setSubTab('application')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              subTab === 'application'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            Конструктор заявки команды
          </button>

          <button
            onClick={() => setSubTab('ideas')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              subTab === 'ideas'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Банк идей КубСатов Space-π
            <span className="ml-1 rounded-full bg-amber-400/20 px-1.5 py-0.2 text-[10px] text-amber-200">
              8 концепций
            </span>
          </button>

          <button
            onClick={() => setSubTab('constellation')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              subTab === 'constellation'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Satellite className="h-3.5 w-3.5" />
            Созвездие спутников Space-π
            <span className="ml-1 rounded-full bg-sky-400/20 px-1.5 py-0.2 text-[10px] text-sky-200">
              УмКА-1, Святобор и др.
            </span>
          </button>

          <button
            onClick={() => setSubTab('registry')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              subTab === 'registry'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Реестр заявок чемпионата
          </button>

          <button
            onClick={() => setSubTab('guidelines')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              subTab === 'guidelines'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            Требования регламента Space-π
          </button>
        </div>
      </div>

      {saveBanner && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{saveBanner}</span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 1: APPLICATION BUILDER                                  */}
      {/* ============================================================== */}
      {subTab === 'application' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncFromStages}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-950/40 px-3 py-2 text-xs font-medium text-sky-200 hover:bg-sky-900/60 transition-colors"
                  title="Подтянуть формулы и данные из сданных решений этапов 1-5"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-sky-400" />
                  Синхронизировать с этапами чемпионата
                </button>
                <button
                  onClick={() => setSubTab('ideas')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  Выбрать из Банка идей
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  Сохранить черновик
                </button>
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/50 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-900/60 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isExportingPdf ? 'Генерация...' : 'Паспорт (PDF)'}
                </button>
                <button
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                  title="Экспорт спецификации JSON для АС Фонд-М"
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Section 1: Identification & Mission Category */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-2">
                <Rocket className="h-4 w-4 text-sky-400" />
                <span>1. Идентификация космического аппарата и категория миссии</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Название проекта полезной нагрузки:
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => handleFieldChange('projectName', e.target.value)}
                    placeholder="Например: Орбитальный узкополосный фотометр свечения атмосферы"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Предлагаемое имя КубСата в реестре Space-π:
                  </label>
                  <input
                    type="text"
                    value={formData.satelliteName}
                    onChange={(e) => handleFieldChange('satelliteName', e.target.value)}
                    placeholder="Например: Орион-3U (Пермь)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Направление научного/прикладного эксперимента:
                  </label>
                  <select
                    value={formData.missionCategory}
                    onChange={(e) =>
                      handleFieldChange('missionCategory', e.target.value as SpacePiMissionCategory)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="space_weather">Космическая погода, геофизика и радиация</option>
                    <option value="remote_sensing">Дистанционное зондирование Земли (ДЗЗ)</option>
                    <option value="astrophysics">Астрофизика и оптические телескопы</option>
                    <option value="biology">Космическая биология и агрофизика</option>
                    <option value="amateur_radio">
                      Радиолюбительская связь и открытый маяк SSTV
                    </option>
                    <option value="iot_ais">Интернет вещей (IoT) и прием сигналов АИС</option>
                    <option value="materials_propulsion">
                      Испытание наноматериалов и микродвигателей
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Спутниковая платформа стандарта Space-π:
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300 font-mono">
                    <span className="font-semibold text-sky-400">CubeSat 3U</span>
                    <span className="text-slate-500">|</span>
                    <span>100 × 100 × 340.5 мм • Масса аппарата: до 4.0 кг</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Scientific Objectives & Novelty */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-2">
                <Microscope className="h-4 w-4 text-sky-400" />
                <span>2. Цели миссии, научная новизна и актуальность</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Главная цель и прикладные задачи орбитального эксперимента:
                </label>
                <textarea
                  rows={3}
                  value={formData.missionGoal}
                  onChange={(e) => handleFieldChange('missionGoal', e.target.value)}
                  placeholder="Опишите, какую научную или прикладную задачу решает эксперимент..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Научно-техническая новизна (ключевой критерий экспертизы Фонда-М):
                </label>
                <textarea
                  rows={3}
                  value={formData.scientificNovelty}
                  onChange={(e) => handleFieldChange('scientificNovelty', e.target.value)}
                  placeholder="В чем оригинальность вашего решения? Чем прибор отличается от аналогов..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Техническое описание полезной нагрузки и принципиальной схемы:
                </label>
                <textarea
                  rows={4}
                  value={formData.payloadDescription}
                  onChange={(e) => handleFieldChange('payloadDescription', e.target.value)}
                  placeholder="Укажите сенсоры, детекторы, оптические элементы, микроконтроллер, схему обработки..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Section 3: Technical Budgets (Mass, Power, Bus) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-2">
                <Cpu className="h-4 w-4 text-sky-400" />
                <span>3. Бюджеты ресурсов полезной нагрузки (Ограничения CubeSat 3U)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Масса ПН (г):
                  </label>
                  <input
                    type="number"
                    value={formData.payloadMassGrams}
                    onChange={(e) =>
                      handleFieldChange('payloadMassGrams', parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Лимит: ≤ 1200 г</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Ср. мощность (Вт):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.powerConsumptionWatts.average}
                    onChange={(e) =>
                      handleFieldChange('powerConsumptionWatts', {
                        ...formData.powerConsumptionWatts,
                        average: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Норма: ≤ 8 Вт</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Пик. мощность (Вт):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.powerConsumptionWatts.peak}
                    onChange={(e) =>
                      handleFieldChange('powerConsumptionWatts', {
                        ...formData.powerConsumptionWatts,
                        peak: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Лимит: ≤ 15 Вт</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Шина данных:
                  </label>
                  <select
                    value={formData.dataInterface}
                    onChange={(e) =>
                      handleFieldChange(
                        'dataInterface',
                        e.target.value as 'I2C' | 'SPI' | 'UART' | 'CAN',
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  >
                    <option value="I2C">I2C (100/400 кГц)</option>
                    <option value="SPI">SPI (до 10 МГц)</option>
                    <option value="UART">UART / RS-485</option>
                    <option value="CAN">CAN Bus 2.0B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Габариты ПН (X × Y × Z мм):
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={formData.payloadDimensionsMm.x}
                      onChange={(e) =>
                        handleFieldChange('payloadDimensionsMm', {
                          ...formData.payloadDimensionsMm,
                          x: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white font-mono"
                    />
                    <span className="text-slate-500">×</span>
                    <input
                      type="number"
                      value={formData.payloadDimensionsMm.y}
                      onChange={(e) =>
                        handleFieldChange('payloadDimensionsMm', {
                          ...formData.payloadDimensionsMm,
                          y: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white font-mono"
                    />
                    <span className="text-slate-500">×</span>
                    <input
                      type="number"
                      value={formData.payloadDimensionsMm.z}
                      onChange={(e) =>
                        handleFieldChange('payloadDimensionsMm', {
                          ...formData.payloadDimensionsMm,
                          z: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Стандарт под ПН: 1U (до 100 мм)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Напряжение питания:
                  </label>
                  <select
                    value={formData.supplyVoltage}
                    onChange={(e) =>
                      handleFieldChange('supplyVoltage', e.target.value as '3.3V' | '5V' | '12V')
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  >
                    <option value="3.3V">3.3 В (Стабилизированное)</option>
                    <option value="5V">5.0 В (Основная шина)</option>
                    <option value="12V">12.0 В (Силовая шина)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Объем данных (МБайт/сутки):
                  </label>
                  <input
                    type="number"
                    value={formData.dailyDataVolumeMb}
                    onChange={(e) =>
                      handleFieldChange('dailyDataVolumeMb', parseFloat(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">
                    Пропускная способность радиолинии
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: SONIKS Integration & School Engagement */}
            <div className="rounded-xl border border-sky-900/40 bg-sky-950/20 p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-sky-300 border-b border-sky-900/50 pb-2">
                <Radio className="h-4 w-4 text-sky-400" />
                <span>4. Интеграция с открытой школьной радиосетью «СОНИКС» (sonik.space)</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Формат открытого радиомаяка и передаваемой телеметрии:
                </label>
                <textarea
                  rows={2}
                  value={formData.soniksIntegration.openBeaconDesc}
                  onChange={(e) =>
                    handleFieldChange('soniksIntegration', {
                      ...formData.soniksIntegration,
                      openBeaconDesc: e.target.value,
                    })
                  }
                  placeholder="Опишите, какие параметры транслируются открыто (например, данные сенсора каждые 60 секунд по протоколу AX.25 / USP)..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Частота радиолинии (МГц, радиолюбительский диапазон):
                  </label>
                  <input
                    type="number"
                    step="0.005"
                    value={formData.radioFrequencyMhz}
                    onChange={(e) =>
                      handleFieldChange('radioFrequencyMhz', parseFloat(e.target.value) || 437.425)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Предлагаемый позывной спутника (Серия RS):
                  </label>
                  <input
                    type="text"
                    value={formData.soniksIntegration.amateurCallsign || 'RS51S'}
                    onChange={(e) =>
                      handleFieldChange('soniksIntegration', {
                        ...formData.soniksIntegration,
                        amateurCallsign: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Программа вовлечения школьников других регионов:
                </label>
                <textarea
                  rows={3}
                  value={formData.schoolInvolvementPlan}
                  onChange={(e) => handleFieldChange('schoolInvolvementPlan', e.target.value)}
                  placeholder="Как школьники по всей России смогут принимать данные через СОНИКС и использовать их в своих исследовательских проектах..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Section 5: Team & Academic Mentor */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-2">
                <Compass className="h-4 w-4 text-sky-400" />
                <span>5. Состав команды и научное руководство</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Участники команды и распределение ролей:
                </label>
                <textarea
                  rows={2}
                  value={formData.teamMembersSummary}
                  onChange={(e) => handleFieldChange('teamMembersSummary', e.target.value)}
                  placeholder="Капитан, баллистик, конструктор, радиоинженер, разработчик ПН..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Научный руководитель / Куратор (ФИО, должность, ученая степень):
                </label>
                <input
                  type="text"
                  value={formData.mentorSummary}
                  onChange={(e) => handleFieldChange('mentorSummary', e.target.value)}
                  placeholder="Например: Соколов В.А., к.ф.-м.н., доцент ПГНИУ"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar: Compliance Inspector & Submission Action (1 col) */}
          <div className="space-y-6">
            {/* Checklist Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sky-400" />
                  <span className="text-sm font-bold text-white">Критерии допуска Space-π</span>
                </div>
                <span className="font-mono text-xs font-bold text-sky-300">
                  {compliance.score}%
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 rounded-full p-0.5 ${
                      compliance.checklist.massCompliant
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-slate-300">
                    <span className="font-medium">Лимит массы (≤ 1200 г):</span>
                    <span className="ml-1 text-slate-400">
                      {formData.payloadMassGrams} г (Платформа 3U)
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 rounded-full p-0.5 ${
                      compliance.checklist.powerCompliant
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-slate-300">
                    <span className="font-medium">Энергетический баланс:</span>
                    <span className="ml-1 text-slate-400">
                      {formData.powerConsumptionWatts.average} Вт ср. /{' '}
                      {formData.powerConsumptionWatts.peak} Вт пик
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 rounded-full p-0.5 ${
                      compliance.checklist.soniksChannelOpen
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-slate-300">
                    <span className="font-medium">Открытый канал СОНИКС:</span>
                    <span className="ml-1 text-slate-400">Обязательное условие</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 rounded-full p-0.5 ${
                      compliance.checklist.cameraOrSensorIncluded
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-slate-300">
                    <span className="font-medium">Описание полезной нагрузки:</span>
                    <span className="ml-1 text-slate-400">Сенсор/детектор/камера</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 rounded-full p-0.5 ${
                      compliance.checklist.schoolEngagementDefined
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-slate-300">
                    <span className="font-medium">Вовлечение школьников:</span>
                    <span className="ml-1 text-slate-400">Образовательная часть</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 rounded-full p-0.5 ${
                      compliance.checklist.scientificNoveltyDefined
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-slate-300">
                    <span className="font-medium">Научная новизна:</span>
                    <span className="ml-1 text-slate-400">Критерий Фонда-М</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 rounded-full p-0.5 ${
                      compliance.checklist.curatorConfirmed
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-slate-300">
                    <span className="font-medium">Научный куратор:</span>
                    <span className="ml-1 text-slate-400">Подтвержден</span>
                  </div>
                </div>
              </div>

              {compliance.issues.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Замечания до подачи:
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-200/80 space-y-0.5">
                    {compliance.issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Submission CTA Box */}
            <div className="rounded-xl border border-sky-500/40 bg-gradient-to-br from-sky-950/60 to-slate-900/80 p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Подача заявки на spacepi.space</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Подача заявки фиксирует проект вашей команды в официальном реестре конкурса
                «Открытый космос» / Space-π с присвоением регистрационного номера и передачей на
                рассмотрение жюри и Фонда содействия инновациям.
              </p>

              <button
                onClick={handleSubmitToSpacePi}
                disabled={formData.status === 'submitted_to_spacepi'}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all shadow-lg ${
                  formData.status === 'submitted_to_spacepi'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                    : 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-400 hover:to-cyan-400 shadow-sky-500/20'
                }`}
              >
                {formData.status === 'submitted_to_spacepi' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Заявка зарегистрирована ({formData.spacePiRegistrationCode})
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Подать заявку на spacepi.space
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span>Формат: CubeSat 3U</span>
                <span>Реестр: АС «Фонд-М»</span>
              </div>
            </div>

            {/* Jury / Expert Evaluation Block (if jury role or view notes) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Экспертное заключение жюри</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Space-π Review</span>
              </div>

              {formData.juryNotes && formData.juryNotes.length > 0 ? (
                <div className="space-y-2">
                  {formData.juryNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5 text-xs text-slate-300"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  Экспертные комментарии пока не добавлены.
                </div>
              )}

              {userRole === 'jury' && (
                <div className="pt-2 space-y-2 border-t border-slate-800">
                  <textarea
                    rows={2}
                    value={juryNoteText}
                    onChange={(e) => setJuryNoteText(e.target.value)}
                    placeholder="Добавить заключение жюри..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddJuryNote}
                    className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    Добавить рецензию
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 2: IDEA BANK                                            */}
      {/* ============================================================== */}
      {subTab === 'ideas' && (
        <div className="space-y-6">
          {/* Header & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Банк идей научно-образовательных полезных нагрузок КубСатов
              </h2>
              <p className="text-xs text-slate-400">
                Концепции, адаптированные под регламент конкурсов Space-π, открытую сеть СОНИКС и
                платформу 3U.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Направление:</span>
              <select
                value={selectedIdeaCategory}
                onChange={(e) => setSelectedIdeaCategory(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">Все направления (8)</option>
                <option value="space_weather">Космическая погода & Радиация</option>
                <option value="remote_sensing">ДЗЗ & Экология</option>
                <option value="biology">Биология & Семена</option>
                <option value="amateur_radio">Радиолюбительский маяк & SSTV</option>
                <option value="iot_ais">АИС морских судов & IoT</option>
                <option value="astrophysics">Астрофизика & Лазерная связь</option>
                <option value="materials_propulsion">Наноматериалы в вакууме</option>
              </select>
            </div>
          </div>

          {/* Ideas Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredIdeas.map((idea) => (
              <div
                key={idea.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4 hover:border-sky-500/40 transition-all flex flex-col justify-between backdrop-blur-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
                      {idea.categoryLabel}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                      Сложность: {idea.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{idea.title}</h3>

                  <p className="text-xs text-slate-300 leading-relaxed">{idea.summary}</p>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-1.5">
                    <div className="font-semibold text-sky-300 flex items-center gap-1.5">
                      <Microscope className="h-3.5 w-3.5" />
                      Научная ценность эксперимента:
                    </div>
                    <div className="text-slate-300 text-[11px] leading-relaxed">
                      {idea.scientificValue}
                    </div>
                  </div>

                  {/* Components */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Ключевые узлы полезной нагрузки:
                    </div>
                    <ul className="grid grid-cols-1 gap-1 text-xs text-slate-300">
                      {idea.payloadComponents.map((c, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Specs Pill row */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-center">
                    <div className="rounded bg-slate-950 p-1.5">
                      <div className="text-slate-500 text-[10px]">Масса</div>
                      <div className="text-sky-300 font-semibold">{idea.specs.massG} г</div>
                    </div>
                    <div className="rounded bg-slate-950 p-1.5">
                      <div className="text-slate-500 text-[10px]">Мощность</div>
                      <div className="text-amber-300 font-semibold">{idea.specs.powerW} Вт</div>
                    </div>
                    <div className="rounded bg-slate-950 p-1.5">
                      <div className="text-slate-500 text-[10px]">Объем</div>
                      <div className="text-emerald-300 font-semibold">{idea.specs.volumeU}</div>
                    </div>
                    <div className="rounded bg-slate-950 p-1.5">
                      <div className="text-slate-500 text-[10px]">Трафик</div>
                      <div className="text-indigo-300 font-semibold">{idea.specs.dataRate}</div>
                    </div>
                  </div>

                  {/* Real Space-pi satellites */}
                  <div className="text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Аналоги в Space-π: </span>
                    {idea.realSpacePiPrecedents.join(', ')}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleApplyIdeaTemplate(idea)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 py-2.5 text-xs font-bold text-white transition-colors shadow-md shadow-sky-600/20"
                  >
                    <Rocket className="h-3.5 w-3.5" />
                    Взять идею за основу для нашей заявки
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 3: CONSTELLATION SHOWCASE                               */}
      {/* ============================================================== */}
      {subTab === 'constellation' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Satellite className="h-4 w-4 text-sky-400" />
              Действующее созвездие школьных и студенческих наноспутников Space-π
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Реальные малые космические аппараты формата CubeSat 3U, выведенные на околоземную
              орбиту при поддержке Фонда содействия инновациям и программы «Дежурный по планете».
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Satellite list */}
            <div className="space-y-3">
              {SPACE_PI_CONSTELLATION.map((sat) => {
                const isSelected = selectedConstellationSat?.id === sat.id;
                return (
                  <button
                    key={sat.id}
                    onClick={() => setSelectedConstellationSat(sat)}
                    className={`w-full text-left rounded-xl p-4 transition-all border ${
                      isSelected
                        ? 'border-sky-500 bg-sky-950/40 shadow-lg shadow-sky-500/10'
                        : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{sat.name}</span>
                        {sat.callsign && (
                          <span className="font-mono text-xs text-sky-300 font-semibold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-400/20">
                            {sat.callsign}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        На орбите
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-slate-400 line-clamp-1">
                      {sat.organization}
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>{sat.format}</span>
                      <span>•</span>
                      <span>{sat.year} г.</span>
                      <span>•</span>
                      <span>{sat.frequenciesMhz}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Satellite Detail View (2 cols) */}
            {selectedConstellationSat && (
              <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-xs font-mono text-sky-400 font-semibold uppercase tracking-wider">
                      Космический аппарат Space-π
                    </div>
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                      <span>{selectedConstellationSat.name}</span>
                      <span className="text-sm font-mono font-normal text-slate-400">
                        NORAD ID: {selectedConstellationSat.noradId || 'Каталог РФ'}
                      </span>
                    </h3>
                  </div>

                  <a
                    href={`https://spacepi.space/satellites/${selectedConstellationSat.slug}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-950/40 px-3 py-1.5 text-xs text-sky-300 hover:bg-sky-900 transition-colors"
                  >
                    Страница на spacepi.space
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed">
                  {selectedConstellationSat.description}
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <div className="text-[10px] text-slate-400 uppercase">Организация / Школа</div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {selectedConstellationSat.organization}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <div className="text-[10px] text-slate-400 uppercase">
                      Спутниковая платформа
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {selectedConstellationSat.platform}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <div className="text-[10px] text-slate-400 uppercase">Частота радиоканала</div>
                    <div className="text-xs font-semibold text-cyan-300 font-mono mt-0.5">
                      {selectedConstellationSat.frequenciesMhz}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <div className="text-[10px] text-slate-400 uppercase">Позывной СОНИКС</div>
                    <div className="text-xs font-semibold text-amber-300 font-mono mt-0.5">
                      {selectedConstellationSat.callsign || 'RS-серия'}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <div className="text-[10px] text-slate-400 uppercase">Год запуска</div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {selectedConstellationSat.year} г.
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <div className="text-[10px] text-slate-400 uppercase">Город / Регион</div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {selectedConstellationSat.city}
                    </div>
                  </div>
                </div>

                {/* Payload detailed block */}
                <div className="rounded-xl border border-sky-900/40 bg-sky-950/20 p-4 space-y-2">
                  <div className="text-xs font-bold text-sky-300 flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Полезная нагрузка и приборы на борту:
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedConstellationSat.payloadDescription}
                  </p>
                </div>

                {/* Soniks info */}
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs">
                  <div className="flex items-center gap-3">
                    <RadioTower className="h-5 w-5 text-sky-400" />
                    <div>
                      <div className="font-semibold text-white">Прием через сеть «СОНИКС»</div>
                      <div className="text-slate-400">
                        Данные спутника открыты для школьных радиостанций и любителей космонавтики
                      </div>
                    </div>
                  </div>
                  <a
                    href="https://sonik.space"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-1.5 font-semibold text-white transition-colors"
                  >
                    sonik.space
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 4: SUBMITTED APPLICATIONS REGISTRY                      */}
      {/* ============================================================== */}
      {subTab === 'registry' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              Сводный реестр поданных заявок команд чемпионата
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Проекты полезных нагрузок КубСатов 3U от {allTeams.length} школьных команд чемпионата
              для отправки в Space-π и Фонд содействия инновациям.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Команда</th>
                  <th className="px-4 py-3">Проект полезной нагрузки</th>
                  <th className="px-4 py-3">Категория</th>
                  <th className="px-4 py-3">Масса / Питание</th>
                  <th className="px-4 py-3">Рег. код Space-π</th>
                  <th className="px-4 py-3">Готовность</th>
                  <th className="px-4 py-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {Object.values(applications).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      <div>{app.teamName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {app.satelliteName}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-medium text-slate-200 line-clamp-1">
                        {app.projectName}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {app.missionGoal}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                        {app.missionCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <div>{app.payloadMassGrams} г</div>
                      <div className="text-slate-500 text-[10px]">
                        {app.powerConsumptionWatts.average} Вт ср.
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-sky-300">
                      {app.spacePiRegistrationCode || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
                        <span>{app.complianceScore}%</span>
                        <div className="h-1.5 w-12 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-sky-400"
                            style={{ width: `${app.complianceScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {app.status === 'submitted_to_spacepi' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Подана на сайт
                        </span>
                      ) : app.status === 'jury_approved' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                          <Award className="h-3 w-3" />
                          Одобрена жюри
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          Черновик
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 5: GUIDELINES & STANDARDS                               */}
      {/* ============================================================== */}
      {subTab === 'guidelines' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Info className="h-4 w-4 text-sky-400" />
              Официальный регламент грантового конкурса Space-π и АС «Фонд-М»
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Проект Space-π реализуется в рамках программы «Дежурный по планете» при поддержке
              Фонда содействия инновациям и Госкорпорации «Роскосмос». Цель — вовлечение школьников
              в проектирование реальных малых космических аппаратов.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Satellite className="h-4 w-4 text-sky-400" />
                Требования к платформе CubeSat 3U
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Форм-фактор: 3U (100 × 100 × 340.5 мм)</li>
                <li>Масса аппарата: до 4.0 кг</li>
                <li>Объем, выделяемый под полезную нагрузку: до 1.5U</li>
                <li>Масса полезной нагрузки: не более 1200 грамм</li>
                <li>Шина питания: 3.3 В, 5 В, 12 В (пик до 15 Вт)</li>
                <li>Интерфейсы связи с бортовым компьютером: I2C, SPI, CAN, UART</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <RadioTower className="h-4 w-4 text-cyan-400" />
                Обязательные элементы аппарата Space-π
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Наличие технологической или научной камеры</li>
                <li>Открытый радиолюбительский канал передачи данных для работы школьников</li>
                <li>Интеграция с открытой сетью станций СОНИКС (sonik.space)</li>
                <li>Радиолюбительский диапазон частот: 435–438 МГц</li>
                <li>Защита от сбоев и зависаний бортового ПО</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                Критерии оценки экспертизы Фонда-М
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Научно-техническая новизна полезной нагрузки (макс. 25 баллов)</li>
                <li>Реалистичность технического решения и расчеты (макс. 25 баллов)</li>
                <li>Масштаб вовлечения школьников в прием данных (макс. 20 баллов)</li>
                <li>Квалификация куратора и школьной команды (макс. 15 баллов)</li>
                <li>Качество конструкторской документации (макс. 15 баллов)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SUCCESSFUL SUBMISSION TO SPACE-PI                       */}
      {/* ============================================================== */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="max-w-md w-full rounded-2xl border border-emerald-500/50 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
              <Rocket className="h-8 w-8 animate-bounce" />
            </div>

            <h3 className="text-xl font-extrabold text-white">
              Заявка успешно зарегистрирована в Space-π!
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Проект команды <strong>«{team.name}»</strong> (Лицей/Школа {team.school}, г.{' '}
              {team.city}) внесен в систему учета заявок программы «Дежурный по планете» и Фонда
              содействия инновациям.
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                Официальный регистрационный код:
              </div>
              <div className="mt-1 font-mono text-base font-black text-sky-300">
                {formData.spacePiRegistrationCode}
              </div>
              <div className="mt-1 text-[10px] text-slate-500 font-mono">
                Дата регистрации: {formData.submittedAt}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleExportPdf}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 py-2.5 text-xs font-bold text-white transition-colors"
              >
                <Download className="h-4 w-4" />
                Скачать официальный паспорт заявки (PDF)
              </button>

              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Вернуться к кабинету
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
