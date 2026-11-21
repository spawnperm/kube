import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  Paperclip,
  Check,
  Send,
  Calculator,
  FileCode,
  AlertTriangle,
  Clock,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Submission, StageId, Team } from '../../types';
import { CASE_STAGES } from '../../data/mockData';
import {
  saveSubmissionDraft,
  loadSubmissionDraft,
  clearSubmissionDraft,
} from '../../utils/submissionDraft';
import { CubeSatAssemblyBlueprintModal } from '../CubeSatAssemblyBlueprintModal';

interface SubmissionsTabProps {
  team: Team;
  submissions: Submission[];
  onSubmitSolution: (submission: Partial<Submission>) => void;
  onOpenStageReview?: (stageId: StageId) => void;
  onSimulateStatusChange?: (
    stageId: StageId,
    newStatus: 'approved' | 'needs_revision' | 'submitted',
  ) => void;
  onNavigateTab?: (tab: string) => void;
}

export const SubmissionsTab: React.FC<SubmissionsTabProps> = ({
  team,
  submissions,
  onSubmitSolution,
  onSimulateStatusChange,
  onNavigateTab,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<StageId>('stage_3');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [calcDeltaV, setCalcDeltaV] = useState<number>(145);
  const [calcPower, setCalcPower] = useState<number>(18.5);
  const [calcMargin, setCalcMargin] = useState<number>(9.2);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; size: string; type: string }>
  >([
    { name: 'Payload_Optics_Calculation.pdf', size: '3.4 МБ', type: 'application/pdf' },
    { name: 'SiPM_Photometer_Schematic.step', size: '12.8 МБ', type: 'application/octet-stream' },
  ]);

  // Autosave and draft states
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const isInitialLoadRef = useRef(true);

  const activeStage = CASE_STAGES.find((s) => s.id === selectedStageId) || CASE_STAGES[0];
  const activeSubmission = submissions.find((s) => s.stageId === selectedStageId);
  const currentStatus = team.stageStatuses[selectedStageId];

  // Load draft or existing submission on stage change
  useEffect(() => {
    isInitialLoadRef.current = true;
    const existingDraft = loadSubmissionDraft(team.id, selectedStageId);

    if (existingDraft) {
      setTitle(existingDraft.title || '');
      setSummary(existingDraft.summary || '');
      setDetails(existingDraft.details || '');
      setRepoUrl(existingDraft.repoUrl || '');
      setCalcDeltaV(existingDraft.calcDeltaV ?? 145);
      setCalcPower(existingDraft.calcPower ?? 18.5);
      setCalcMargin(existingDraft.calcMargin ?? 9.2);
      if (existingDraft.uploadedFiles && existingDraft.uploadedFiles.length > 0) {
        setUploadedFiles(existingDraft.uploadedFiles);
      }
      setLastDraftSavedAt(existingDraft.savedAt);
      setIsDraftRestored(true);
    } else {
      const sub = submissions.find((s) => s.stageId === selectedStageId && s.teamId === team.id);
      if (sub) {
        setTitle(sub.title || '');
        setSummary(sub.summary || '');
        setDetails(sub.details || '');
        setRepoUrl(sub.repoUrl || '');
        setCalcDeltaV(sub.calculations?.deltaV ?? 145);
        setCalcPower(sub.calculations?.powerGenerationW ?? 18.5);
        setCalcMargin(sub.calculations?.linkMarginDb ?? 9.2);
        if (sub.files && sub.files.length > 0) {
          setUploadedFiles(sub.files.map((f) => ({ name: f.name, size: f.size, type: f.type })));
        }
      } else {
        setTitle('');
        setSummary('');
        setDetails('');
        setRepoUrl('');
        setCalcDeltaV(145);
        setCalcPower(18.5);
        setCalcMargin(9.2);
      }
      setLastDraftSavedAt(null);
      setIsDraftRestored(false);
    }
  }, [selectedStageId, team.id, submissions]);

  // Debounced autosave effect
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    setIsSavingDraft(true);
    const timer = setTimeout(() => {
      const saved = saveSubmissionDraft(team.id, selectedStageId, {
        title,
        summary,
        details,
        repoUrl,
        calcDeltaV,
        calcPower,
        calcMargin,
        uploadedFiles,
      });
      if (saved) {
        setLastDraftSavedAt(saved.savedAt);
      }
      setIsSavingDraft(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [
    title,
    summary,
    details,
    repoUrl,
    calcDeltaV,
    calcPower,
    calcMargin,
    uploadedFiles,
    selectedStageId,
    team.id,
  ]);

  // Save draft on window beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSubmissionDraft(team.id, selectedStageId, {
        title,
        summary,
        details,
        repoUrl,
        calcDeltaV,
        calcPower,
        calcMargin,
        uploadedFiles,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [
    title,
    summary,
    details,
    repoUrl,
    calcDeltaV,
    calcPower,
    calcMargin,
    uploadedFiles,
    selectedStageId,
    team.id,
  ]);

  const handleDiscardDraft = () => {
    clearSubmissionDraft(team.id, selectedStageId);
    setLastDraftSavedAt(null);
    setIsDraftRestored(false);
    const sub = submissions.find((s) => s.stageId === selectedStageId && s.teamId === team.id);
    if (sub) {
      setTitle(sub.title || '');
      setSummary(sub.summary || '');
      setDetails(sub.details || '');
      setRepoUrl(sub.repoUrl || '');
    } else {
      setTitle('');
      setSummary('');
      setDetails('');
      setRepoUrl('');
    }
  };

  const handleFileUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} МБ`,
          type: file.type || 'application/octet-stream',
        },
      ]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !activeSubmission) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitSolution({
        stageId: selectedStageId,
        title: title || `${activeStage.title} (версия команды)`,
        summary: summary || 'Разработанное техническое решение и расчеты.',
        details: details || 'Подробное обоснование физических параметров наноспутника.',
        calculations: {
          deltaV: calcDeltaV,
          powerGenerationW: calcPower,
          linkMarginDb: calcMargin,
        },
        files: uploadedFiles.map((f, i) => ({
          id: `file_${Date.now()}_${i}`,
          name: f.name,
          size: f.size,
          type: f.type,
          uploadedAt: 'Сегодня, только что',
        })),
        repoUrl: repoUrl || undefined,
        status: 'submitted',
      });

      // Clear draft upon successful submission
      clearSubmissionDraft(team.id, selectedStageId);
      setLastDraftSavedAt(null);
      setIsDraftRestored(false);

      setIsSubmitting(false);
      setSubmissionSuccess(true);
      setTimeout(() => setSubmissionSuccess(false), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/90 p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">
              Загрузка решений кейс-чемпионата «МИРОВИЗОР»
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-300 max-w-2xl">
            Загружайте технические отчеты, математические модели в Jupyter Notebook, CAD-чертежи и
            схемы бортовых систем КубСата для рецензирования экспертами жюри.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Текущий прогресс:</span>
          <span className="font-bold text-cyan-300 font-mono">
            {Object.values(team.stageStatuses).filter((s) => s === 'approved').length} из 5 этапов
            одобрено
          </span>
        </div>
      </div>

      {/* Space-π Target Callout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-sky-500/30 bg-sky-950/20 px-4 py-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-slate-300">
            Итог чемпионата: Данные 5 этапов автоматически агрегируются в заявку для космического
            запуска в <strong className="text-white">Space-π (spacepi.space)</strong>.
          </span>
        </div>
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('spacepi')}
            className="shrink-0 rounded-lg bg-sky-600/80 hover:bg-sky-500 px-3 py-1.5 font-semibold text-white transition-colors"
          >
            Собрать заявку в Space-π →
          </button>
        )}
      </div>

      {/* Stage Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {CASE_STAGES.map((stage) => {
          const isSelected = stage.id === selectedStageId;
          const status = team.stageStatuses[stage.id];
          const score = team.stageScores[stage.id];

          return (
            <button
              key={stage.id}
              onClick={() => setSelectedStageId(stage.id)}
              className={`rounded-xl border p-3.5 text-left transition-all ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-cyan-400 font-bold">Этап {stage.number}</span>
                {status === 'approved' && (
                  <span className="flex items-center gap-1 font-bold text-emerald-400 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{score} б.</span>
                  </span>
                )}
                {status === 'submitted' && (
                  <span className="text-cyan-400 text-[11px] font-medium">Отправлено</span>
                )}
                {status === 'under_review' && (
                  <span className="text-amber-400 text-[11px] font-medium">На оценке</span>
                )}
                {status === 'needs_revision' && (
                  <span className="text-rose-400 text-[11px] font-medium">Доработка</span>
                )}
                {status === 'draft' && <span className="text-slate-500 text-[11px]">Черновик</span>}
              </div>
              <div className="font-semibold text-white text-xs line-clamp-1">{stage.title}</div>
              <div className="mt-1 text-[10px] text-slate-400">
                до {stage.deadline.split(',')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Layout: Stage Details & Submission Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Stage Information & Physics Formulas (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-xs shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono text-cyan-400 font-bold">КЕЙС #{activeStage.number}</span>
              <span className="text-slate-400">
                Максимум: <strong className="text-white">{activeStage.maxPoints} баллов</strong>
              </span>
            </div>

            <h3 className="text-sm font-bold text-white leading-snug">{activeStage.title}</h3>
            <p className="text-slate-300 leading-relaxed text-[11px]">{activeStage.description}</p>

            {/* Deliverables */}
            <div>
              <div className="font-semibold text-slate-200 mb-1.5 text-xs">
                Требуемые результаты (Deliverables):
              </div>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                {activeStage.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Physics Formulas Box */}
            <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3">
              <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-xs mb-2">
                <Calculator className="h-3.5 w-3.5" />
                <span>Физический аппарат кейса:</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-300">
                {activeStage.physicsFormulas.map((f) => (
                  <div
                    key={f}
                    className="bg-slate-950/60 rounded px-2 py-1 border border-slate-800/80"
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* 3D Blueprint Assembly Hint Card */}
            <div className="rounded-xl border border-cyan-900/50 bg-gradient-to-br from-cyan-950/30 to-indigo-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>3D-Схема сборки КубСата {team.cubesatSpecs.format}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsBlueprintModalOpen(true)}
                  className="rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  Открыть чертеж
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Вид сборочного чертежа внутреннего устройства с подсказками по габаритам и балансу
                мощности под целевую нагрузку ({team.cubesatSpecs.payloadType}).
              </p>
            </div>
          </div>

          {/* Existing Review Feedback if present */}
          {activeSubmission?.juryFeedback && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-xs shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Рецензия жюри: {activeSubmission.juryFeedback.totalScore} / 100 баллов
                  </span>
                </div>
                <span className="text-slate-400 text-[10px]">
                  {activeSubmission.juryFeedback.reviewedAt}
                </span>
              </div>

              <div>
                <div className="text-slate-300 font-semibold">
                  {activeSubmission.juryFeedback.juryName}
                </div>
                <div className="text-[10px] text-slate-400">
                  {activeSubmission.juryFeedback.juryTitle}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-slate-300 text-[11px] leading-relaxed italic">
                «{activeSubmission.juryFeedback.comment}»
              </div>

              {/* Rubric scores breakdown */}
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Физич. точность:</span>{' '}
                  <strong className="text-emerald-300 font-mono">
                    {activeSubmission.juryFeedback.scores.physicsAccuracy}/25
                  </strong>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Инженер. реализм:</span>{' '}
                  <strong className="text-emerald-300 font-mono">
                    {activeSubmission.juryFeedback.scores.engineeringRealism}/25
                  </strong>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Научная ценность:</span>{' '}
                  <strong className="text-emerald-300 font-mono">
                    {activeSubmission.juryFeedback.scores.scientificValue}/20
                  </strong>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Документация:</span>{' '}
                  <strong className="text-emerald-300 font-mono">
                    {activeSubmission.juryFeedback.scores.documentationQuality}/15
                  </strong>
                </div>
              </div>

              {activeSubmission.juryFeedback.suggestions.length > 0 && (
                <div className="text-[11px] text-slate-300 pt-1">
                  <span className="font-semibold text-cyan-400">
                    Рекомендации к финальной защите:
                  </span>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                    {activeSubmission.juryFeedback.suggestions.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Real-time Push Status Simulator widget */}
          {onSimulateStatusChange && (
            <div className="rounded-2xl border border-cyan-800/40 bg-gradient-to-b from-slate-900 to-slate-950 p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-bold text-white">Тест Push-уведомлений ЦУП</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">Real-time</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Смоделируйте статус решения по выбранному этапу и проверьте мгновенное всплывающее
                push-уведомление со звуковым сигналом:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSimulateStatusChange(selectedStageId, 'approved')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-2 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all active:scale-95"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Одобрить</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateStatusChange(selectedStageId, 'needs_revision')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-2 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/25 transition-all active:scale-95"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  <span>Доработка</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateStatusChange(selectedStageId, 'submitted')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-2.5 py-2 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/25 transition-all active:scale-95"
                >
                  <Clock className="h-3.5 w-3.5 text-sky-400" />
                  <span>На проверку</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Submission Form (7 cols) */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleFormSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-xs shadow-xl space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Форма отправки решения: Этап {activeStage.number}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {isSavingDraft ? (
                  <span className="flex items-center gap-1 text-[11px] text-cyan-400 font-mono animate-pulse">
                    <Save className="h-3 w-3" />
                    <span>Сохранение...</span>
                  </span>
                ) : lastDraftSavedAt ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-mono">
                    <Save className="h-3 w-3" />
                    <span>Черновик сохранен ({lastDraftSavedAt})</span>
                  </span>
                ) : null}

                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    currentStatus === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : currentStatus === 'submitted'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Статус:{' '}
                  {currentStatus === 'approved'
                    ? 'Принято жюри'
                    : currentStatus === 'submitted'
                      ? 'Отправлено'
                      : 'Черновик'}
                </span>
              </div>
            </div>

            {/* Restored Draft Alert Banner */}
            {isDraftRestored && (
              <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-2.5 text-[11px] text-cyan-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>
                    Восстановлен несохраненный черновик
                    {lastDraftSavedAt ? ` (сохранен в ${lastDraftSavedAt})` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="flex items-center gap-1 rounded bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300 hover:text-rose-400 hover:border-rose-500/40 border border-slate-700 transition-colors"
                  title="Удалить сохраненный черновик и восстановить исходную версию"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Сбросить черновик</span>
                </button>
              </div>
            )}

            {submissionSuccess && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <Check className="h-4 w-4 stroke-[3]" />
                <span>
                  Решение успешно отправлено на рецензию экспертной комиссии! Жюри уведомлено.
                </span>
              </div>
            )}

            <div>
              <label
                htmlFor="submissionstab_field_1"
                className="block font-medium text-slate-300 mb-1"
              >
                Тема решения / Название технического отчета *
              </label>
              <input
                id="submissionstab_field_1"
                type="text"
                placeholder={
                  activeSubmission?.title ||
                  `Расчет и проектные решения по этапу #${activeStage.number}`
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none placeholder-slate-600"
              />
            </div>

            <div>
              <label
                htmlFor="submissionstab_field_2"
                className="block font-medium text-slate-300 mb-1"
              >
                Краткое резюме решения (Executive Summary) *
              </label>
              <textarea
                id="submissionstab_field_2"
                rows={2}
                placeholder={
                  activeSubmission?.summary ||
                  'Опишите основные полученные результаты, ключевые формулы и выводы...'
                }
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none placeholder-slate-600"
              />
            </div>

            {/* Calculations metrics input */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-200">
                  Численные результаты физического моделирования:
                </span>
                <span className="text-[10px] text-slate-500">
                  Автопроверка физических ограничений
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="submissionstab_field_3"
                    className="block text-slate-400 text-[11px] mb-1"
                  >
                    Импульс ΔV (м/с)
                  </label>
                  <input
                    id="submissionstab_field_3"
                    type="number"
                    value={calcDeltaV}
                    onChange={(e) => setCalcDeltaV(+e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="submissionstab_field_4"
                    className="block text-slate-400 text-[11px] mb-1"
                  >
                    Пиковая мощность (Вт)
                  </label>
                  <input
                    id="submissionstab_field_4"
                    type="number"
                    step="0.1"
                    value={calcPower}
                    onChange={(e) => setCalcPower(+e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="submissionstab_field_5"
                    className="block text-slate-400 text-[11px] mb-1"
                  >
                    Запас связи (дБ)
                  </label>
                  <input
                    id="submissionstab_field_5"
                    type="number"
                    step="0.1"
                    value={calcMargin}
                    onChange={(e) => setCalcMargin(+e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Repository Link */}
            <div>
              <label
                htmlFor="submissionstab_field_6"
                className="block font-medium text-slate-300 mb-1"
              >
                Ссылка на открытый репозиторий с кодом / Jupyter Notebook
              </label>
              <input
                id="submissionstab_field_6"
                type="url"
                placeholder={
                  activeSubmission?.repoUrl || 'https://github.com/space-orion3/cubesat-mission'
                }
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none placeholder-slate-600"
              />
            </div>

            {/* Attached Files List & Upload Box */}
            <div>
              <span className="block font-medium text-slate-300 mb-1.5">
                Прикрепленные файлы отчета, чертежей и расчетов (PDF, STEP, DOCX, ZIP)
              </span>

              {/* Upload Drop area */}
              <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-4 hover:border-cyan-500/50 hover:bg-cyan-950/10 cursor-pointer transition-all">
                <UploadCloud className="h-6 w-6 text-cyan-400 mb-1" />
                <span className="font-medium text-slate-300 text-xs">
                  Нажмите для выбора файла или перетащите сюда
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Максимальный размер: 50 МБ
                </span>
                <input type="file" className="hidden" onChange={handleFileUploadMock} />
              </label>

              {/* Files preview list */}
              <div className="mt-2.5 space-y-1.5">
                {uploadedFiles.map((f) => (
                  <div
                    key={`${f.name}-${f.size}`}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-300 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="font-medium text-white">{f.name}</span>
                      <span className="text-[10px] text-slate-500">({f.size})</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Готов к передаче
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2 font-bold text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Отправка решения...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Отправить на проверку жюри</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3D Assembly Blueprint Modal */}
      <CubeSatAssemblyBlueprintModal
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
        specs={team.cubesatSpecs}
        teamName={team.name}
      />
    </div>
  );
};
