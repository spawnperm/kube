import React, { useState } from 'react';
import { Scale, CheckCircle2, FileText, Send, Check } from 'lucide-react';
import { Team, Submission, StageId } from '../../types';
import { CASE_STAGES } from '../../data/mockData';

interface JuryPanelTabProps {
  teams: Team[];
  submissions: Submission[];
  onEvaluateSubmission: (
    teamId: string,
    stageId: StageId,
    evaluation: {
      physicsAccuracy: number;
      engineeringRealism: number;
      scientificValue: number;
      documentationQuality: number;
      presentationClarity: number;
      comment: string;
      suggestions: string[];
      decision: 'approved' | 'revision';
    },
  ) => void;
}

export const JuryPanelTab: React.FC<JuryPanelTabProps> = ({
  teams,
  submissions,
  onEvaluateSubmission,
}) => {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>(
    submissions[0]?.id || '',
  );
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSaved, setIsSaved] = useState(false);

  // Scoring rubric states (defaults)
  const [physicsAccuracy, setPhysicsAccuracy] = useState(24); // max 25
  const [engineeringRealism, setEngineeringRealism] = useState(23); // max 25
  const [scientificValue, setScientificValue] = useState(19); // max 20
  const [docQuality, setDocQuality] = useState(14); // max 15
  const [presentationClarity, setPresentationClarity] = useState(14); // max 15
  const [commentText, setCommentText] = useState(
    'Отличный инженерный расчет! Все параметры согласованы со стандартом CubeSat.',
  );
  const [recommendationsText, setRecommendationsText] = useState(
    'Проверить теплоотвод от радиопередатчика.\nУчесть вариации плотности термосферы при максимуме солнечной активности.',
  );
  const [decision, setDecision] = useState<'approved' | 'revision'>('approved');

  const selectedSubmission =
    submissions.find((s) => s.id === selectedSubmissionId) || submissions[0];
  const submissionTeam = teams.find((t) => t.id === selectedSubmission?.teamId);
  const submissionStage = CASE_STAGES.find((s) => s.id === selectedSubmission?.stageId);

  const totalScore =
    physicsAccuracy + engineeringRealism + scientificValue + docQuality + presentationClarity;

  // Filtered list
  const filteredSubmissions = submissions.filter((s) => {
    if (filterStage !== 'all' && s.stageId !== filterStage) return false;
    if (filterStatus === 'pending' && s.status === 'approved') return false;
    if (filterStatus === 'approved' && s.status !== 'approved') return false;
    return true;
  });

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !submissionTeam) return;

    const suggestionsList = recommendationsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onEvaluateSubmission(selectedSubmission.teamId, selectedSubmission.stageId, {
      physicsAccuracy,
      engineeringRealism,
      scientificValue,
      documentationQuality: docQuality,
      presentationClarity,
      comment: commentText,
      suggestions: suggestionsList,
      decision,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleApplyPresetComment = (preset: 'excellent' | 'needs_work' | 'thermal_alert') => {
    if (preset === 'excellent') {
      setPhysicsAccuracy(25);
      setEngineeringRealism(24);
      setScientificValue(19);
      setDocQuality(15);
      setPresentationClarity(14);
      setDecision('approved');
      setCommentText(
        'Безупречный уровень физико-математического обоснования. Превосходный выбор полезной нагрузки и интеграция в CubeSat 3U.',
      );
    } else if (preset === 'needs_work') {
      setPhysicsAccuracy(18);
      setEngineeringRealism(17);
      setScientificValue(15);
      setDocQuality(10);
      setPresentationClarity(10);
      setDecision('revision');
      setCommentText(
        'В расчетах обнаружено несоответствие по запасу радиолинии. Требуется повторный расчет Link Budget с учетом потерь в дожде и ионосфере.',
      );
    } else if (preset === 'thermal_alert') {
      setPhysicsAccuracy(22);
      setEngineeringRealism(20);
      setScientificValue(18);
      setDocQuality(13);
      setPresentationClarity(12);
      setDecision('approved');
      setCommentText(
        'Тепловой режим на теневом участке требует установки дополнительной термоизоляции аккумулятора.',
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Jury Header Banner */}
      <div className="rounded-2xl border border-indigo-500/25 bg-slate-900/90 p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Панель экспертного жюри</h1>
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                Секция баллистики и систем
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              Эксперт: <strong>Проф. Аркадий Игоревич Мельников</strong> (Д.ф.-м.н., председатель
              жюри)
            </p>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">На проверке:</span>{' '}
            <strong className="text-amber-400 font-mono">
              {submissions.filter((s) => s.status !== 'approved').length} работ
            </strong>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Оценено:</span>{' '}
            <strong className="text-emerald-400 font-mono">
              {submissions.filter((s) => s.status === 'approved').length} работ
            </strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Submissions Queue & Rubric Evaluation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Submissions Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Все этапы кейса</option>
              {CASE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  Этап {s.number}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-32 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Все статусы</option>
              <option value="pending">Ожидают</option>
              <option value="approved">Оценены</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {filteredSubmissions.map((sub) => {
              const team = teams.find((t) => t.id === sub.teamId);
              const stage = CASE_STAGES.find((s) => s.id === sub.stageId);
              const isSelected = sub.id === selectedSubmission?.id;
              const isApproved = sub.status === 'approved';

              const handleSelect = () => {
                setSelectedSubmissionId(sub.id);
                if (sub.juryFeedback) {
                  setPhysicsAccuracy(sub.juryFeedback.scores.physicsAccuracy);
                  setEngineeringRealism(sub.juryFeedback.scores.engineeringRealism);
                  setScientificValue(sub.juryFeedback.scores.scientificValue);
                  setDocQuality(sub.juryFeedback.scores.documentationQuality);
                  setPresentationClarity(sub.juryFeedback.scores.presentationClarity);
                  setCommentText(sub.juryFeedback.comment);
                  setRecommendationsText(sub.juryFeedback.suggestions.join('\n'));
                }
              };

              return (
                <div
                  key={sub.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={handleSelect}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelect();
                    }
                  }}
                  className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/25 shadow-md shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-white">«{team?.name || 'Команда'}»</span>
                    {isApproved ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{sub.juryFeedback?.totalScore || 90} б.</span>
                      </span>
                    ) : (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[10px] text-amber-300 border border-amber-500/30">
                        Ожидает оценки
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-slate-300 line-clamp-1">{sub.title}</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      Этап {stage?.number}: {stage?.title.substring(0, 22)}...
                    </span>
                    <span>{sub.submittedAt.split(',')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Rubric Evaluation Form & Details (8 cols) */}
        <div className="lg:col-span-8">
          {selectedSubmission ? (
            <form
              onSubmit={handleSubmitEvaluation}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-xs shadow-xl space-y-4"
            >
              {/* Submission Header Card */}
              <div className="pb-3 border-b border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold">
                      ЭТАП {submissionStage?.number} • {submissionStage?.title}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {selectedSubmission.title}
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Команда: <strong>«{submissionTeam?.name}»</strong> ({submissionTeam?.school},{' '}
                    {submissionTeam?.city})
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 px-3 py-2 text-center shrink-0">
                  <div className="text-[10px] text-slate-400">Итоговый балл</div>
                  <div className="font-mono text-xl font-black text-indigo-300">
                    {totalScore} / 100
                  </div>
                </div>
              </div>

              {isSaved && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Оценка успешно зафиксирована в протоколе! Рейтинг команды пересчитан.</span>
                </div>
              )}

              {/* Solution Summary / Overview text */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                <div className="text-slate-300 font-medium">Резюме и обоснование участников:</div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {selectedSubmission.details}
                </p>

                {/* Calculation indicators */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                  <div className="text-slate-400">
                    ΔV:{' '}
                    <strong className="text-cyan-300">
                      {selectedSubmission.calculations.deltaV || 142} м/с
                    </strong>
                  </div>
                  <div className="text-slate-400">
                    Мощность:{' '}
                    <strong className="text-amber-300">
                      {selectedSubmission.calculations.powerGenerationW || 18.5} Вт
                    </strong>
                  </div>
                  <div className="text-slate-400">
                    Link Margin:{' '}
                    <strong className="text-emerald-300">
                      {selectedSubmission.calculations.linkMarginDb || 9.4} дБ
                    </strong>
                  </div>
                </div>

                {/* Files attached */}
                {selectedSubmission.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedSubmission.files.map((f) => (
                      <span
                        key={f.id}
                        className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[10px] text-slate-300"
                      >
                        <FileText className="h-3 w-3 text-cyan-400" />
                        <span>
                          {f.name} ({f.size})
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Preset templates */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Шаблоны рецензии:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPresetComment('excellent')}
                  className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20"
                >
                  Высокий уровень (96 б.)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetComment('thermal_alert')}
                  className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/20 hover:bg-amber-500/20"
                >
                  Замечание по теплу (85 б.)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetComment('needs_work')}
                  className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-500/20 hover:bg-rose-500/20"
                >
                  Доработка (70 б.)
                </button>
              </div>

              {/* Rubric Criteria Sliders */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">
                    Критерии официального судейского регламента:
                  </span>
                  <span className="text-[10px] text-slate-500">Шкала 0-100 баллов</span>
                </div>

                {/* 1. Physics Accuracy */}
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>1. Физико-математическая строгость и точность формул</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {physicsAccuracy} / 25
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={physicsAccuracy}
                    onChange={(e) => setPhysicsAccuracy(+e.target.value)}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* 2. Engineering Realism */}
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>2. Инженерная реализуемость и соответствие стандарту CubeSat</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {engineeringRealism} / 25
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={engineeringRealism}
                    onChange={(e) => setEngineeringRealism(+e.target.value)}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* 3. Scientific value */}
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>3. Научная ценность эксперимента и полезной нагрузки</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {scientificValue} / 20
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={scientificValue}
                    onChange={(e) => setScientificValue(+e.target.value)}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* 4. Documentation */}
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>4. Качество документации, чертежей и исходного кода</span>
                    <span className="font-mono text-cyan-400 font-bold">{docQuality} / 15</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={docQuality}
                    onChange={(e) => setDocQuality(+e.target.value)}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* 5. Defense presentation */}
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>5. Логика изложения и аргументация решений</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {presentationClarity} / 15
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={presentationClarity}
                    onChange={(e) => setPresentationClarity(+e.target.value)}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Comments & Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="jurypaneltab_field_1"
                    className="block font-medium text-slate-300 mb-1"
                  >
                    Рецензия эксперта (официальный комментарий) *
                  </label>
                  <textarea
                    id="jurypaneltab_field_1"
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="jurypaneltab_field_2"
                    className="block font-medium text-slate-300 mb-1"
                  >
                    Рекомендации к финальной защите (каждая с новой строки)
                  </label>
                  <textarea
                    id="jurypaneltab_field_2"
                    rows={3}
                    value={recommendationsText}
                    onChange={(e) => setRecommendationsText(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Decision & Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-300">Решение комиссии:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400">
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === 'approved'}
                      onChange={() => setDecision('approved')}
                      className="accent-emerald-400"
                    />
                    <span>Зачесть этап (Approved)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-rose-400">
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === 'revision'}
                      onChange={() => setDecision('revision')}
                      className="accent-rose-400"
                    />
                    <span>Отправить на доработку</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2 font-bold text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <Send className="h-4 w-4" />
                  <span>Утвердить оценку ({totalScore} б.)</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-500 text-xs">
              Выберите решение слева для выставления оценок
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
