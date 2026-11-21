import React, { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Award,
  Star,
  CheckCircle2,
  Trophy,
  Filter,
  Columns,
  Sparkles,
  Download,
  FileText,
  Rocket,
} from 'lucide-react';
import { Team, ExpertEvaluation } from '@/src/shared/types/index';
import { INITIAL_LEADERBOARD } from '@/src/shared/data/mockData';
import { audioService } from '@/src/shared/lib/audioService';
import { CertificateModal } from '@/src/contexts/championship/components/CertificateModal';
import {
  CertificateData,
  downloadTeamCertificatePdf,
} from '@/src/contexts/championship/services/certificateService';

interface ExpertDashboardAndKanbanProps {
  team: Team;
  onUpdateTeamScore: (score: number) => void;
  initialSubTab?: string;
}

export const ExpertDashboardAndKanban: React.FC<ExpertDashboardAndKanbanProps> = ({
  team,
  onUpdateTeamScore,
  initialSubTab = 'timer',
}) => {
  const [subTab, setSubTab] = useState<'timer' | 'expert' | 'kanban' | 'leaderboard'>(
    (initialSubTab as any) || 'timer',
  );

  // 1. SPEECH TIMER STATE (2-3 min for presentation projection)
  const [timerDuration, setTimerDuration] = useState<number>(180); // 3 minutes = 180s
  const [secondsLeft, setSecondsLeft] = useState<number>(180);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === 31) {
            audioService.playTimerWarning();
          } else if (prev === 11) {
            audioService.playTimerWarning();
          } else if (prev <= 1) {
            audioService.playTimerStopGong();
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  const handleStartTimer = () => {
    if (secondsLeft === 0) setSecondsLeft(timerDuration);
    setIsTimerRunning(true);
    audioService.playSuccessChime();
  };

  const handlePauseTimer = () => setIsTimerRunning(false);

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsLeft(timerDuration);
  };

  const handleSetDuration = (secs: number) => {
    setIsTimerRunning(false);
    setTimerDuration(secs);
    setSecondsLeft(secs);
  };

  // Timer Color Indicator Calculation
  let timerColorClass = 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  let timerProgressBg = 'bg-emerald-500';
  if (secondsLeft === 0) {
    timerColorClass = 'text-rose-500 border-rose-500 bg-rose-500/20 animate-pulse';
    timerProgressBg = 'bg-rose-500';
  } else if (secondsLeft <= 15) {
    timerColorClass = 'text-rose-400 border-rose-500/60 bg-rose-500/10 animate-pulse';
    timerProgressBg = 'bg-rose-500';
  } else if (secondsLeft <= 30) {
    timerColorClass = 'text-amber-400 border-amber-500/60 bg-amber-500/10';
    timerProgressBg = 'bg-amber-500';
  }

  // 2. EXPERT EVALUATION FORM STATE (1-5 Scores)
  const [scores, setScores] = useState({
    physicsRigor: 5,
    engineeringFeasibility: 5,
    presentationClarity: 4,
    defenseQuality: 5,
  });
  const [expertComment, setExpertComment] = useState(
    'Отличный физико-математический расчет аэродинамического торможения на Слайде 2. Рекомендовано к финалу!',
  );
  const [isEvaluationSubmitted, setIsEvaluationSubmitted] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isDirectDownloading, setIsDirectDownloading] = useState(false);

  const averageScore = Number(
    (
      (scores.physicsRigor +
        scores.engineeringFeasibility +
        scores.presentationClarity +
        scores.defenseQuality) /
      4
    ).toFixed(2),
  );

  const currentFinalScore = team.score || averageScore || 4.85;
  const currentShipName = team.shipName || team.name || 'Восток-81';

  const certificateData: CertificateData = {
    teamName: team.name,
    shipName: currentShipName,
    shipCallsign: team.shipCallsign || 'Борт-01',
    school: team.school,
    mentorName: team.mentorName,
    members: team.members.map((m) => ({
      name: m.name,
      roleTitle: m.roleTitle || m.role,
    })),
    finalScore: currentFinalScore,
    taskTitle:
      team.selectedTaskTitle || 'Баллистика и время жизни наноспутника CubeSat в термосфере',
  };

  const handleOpenCertificate = () => {
    setIsCertificateModalOpen(true);
    audioService.playClickSound();
  };

  const handleQuickDownloadPdf = async () => {
    setIsDirectDownloading(true);
    try {
      await downloadTeamCertificatePdf(certificateData);
      audioService.playSuccessChime();
    } catch (err) {
      console.error('Failed to download certificate PDF:', err);
    } finally {
      setIsDirectDownloading(false);
    }
  };

  const handleSubmitEvaluation = () => {
    setIsEvaluationSubmitted(true);
    onUpdateTeamScore(averageScore);
    audioService.playSuccessChime();
  };

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 pb-20 pt-2 max-w-4xl mx-auto">
      {/* Ship & Team Score Certificate Banner */}
      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 uppercase font-mono">Корабль:</span>
              <span className="text-sm font-bold text-white">«{currentShipName}»</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                {team.cubesatFormat || '3U'}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Финальный балл:</span>
              <span className="font-mono font-bold text-amber-400">
                {currentFinalScore.toFixed(2)} / 5.00
              </span>
              <span>· {team.school}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickDownloadPdf}
            disabled={isDirectDownloading}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
            title="Быстрое скачивание готового PDF-файла"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDirectDownloading ? 'Формирование…' : 'Скачать PDF'}</span>
          </button>

          <button
            onClick={handleOpenCertificate}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            title="Открыть окно предпросмотра сертификата"
          >
            <Award className="w-3.5 h-3.5 text-slate-950" />
            <span>Сертификат участия</span>
          </button>
        </div>
      </div>
      {/* Sub Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setSubTab('timer')}
          className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            subTab === 'timer'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Таймер 3:00</span>
        </button>

        <button
          onClick={() => setSubTab('expert')}
          className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            subTab === 'expert'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Оценка жюри</span>
        </button>

        <button
          onClick={() => setSubTab('kanban')}
          className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            subTab === 'kanban'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Канбан-этапы</span>
        </button>

        <button
          onClick={() => setSubTab('leaderboard')}
          className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            subTab === 'leaderboard'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Лидерборд</span>
        </button>
      </div>

      {/* 1. SPEECH TIMER (PROJECTOR MODE) */}
      {subTab === 'timer' && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
              Регламент питча команды перед жюри
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Защита проекта «{team.name}»
            </h2>
          </div>

          {/* Time Picker 2 min vs 3 min */}
          <div className="flex justify-center gap-2">
            {[120, 180].map((durationSec) => (
              <button
                key={durationSec}
                onClick={() => handleSetDuration(durationSec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  timerDuration === durationSec
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {durationSec / 60}:00 минуты
              </button>
            ))}
          </div>

          {/* Large Clock Display */}
          <div
            className={`max-w-md mx-auto py-8 sm:py-12 rounded-3xl border-2 transition-all shadow-inner ${timerColorClass}`}
          >
            <div className="text-6xl sm:text-8xl font-black font-mono tracking-tight">
              {formatTime(secondsLeft)}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider mt-2 opacity-80">
              {secondsLeft === 0
                ? 'ВРЕМЯ ВЫШЛО! СТОП-СИГНАЛ'
                : secondsLeft <= 30
                  ? 'ФИНАЛЬНЫЙ РАСЧЕТ И ВЫВОДЫ (30 СЕКУНД)'
                  : 'ОСНОВНАЯ ЗАЩИТА 3 СЛАЙДОВ'}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {!isTimerRunning ? (
              <button
                onClick={handleStartTimer}
                className="min-h-[52px] px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-base font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Старт</span>
              </button>
            ) : (
              <button
                onClick={handlePauseTimer}
                className="min-h-[52px] px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-base font-bold flex items-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
              >
                <Pause className="w-5 h-5 fill-current" />
                <span>Пауза</span>
              </button>
            )}

            <button
              onClick={handleResetTimer}
              className="min-h-[52px] px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-sm font-semibold flex items-center gap-2 active:scale-95 transition-all"
              title="Сбросить таймер"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Сброс</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. EXPERT EVALUATION FORM */}
      {subTab === 'expert' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] text-indigo-400 uppercase font-mono font-bold">
                Экспертный протокол рецензирования
              </span>
              <h2 className="text-base font-bold text-white">
                Оценка команды «{team.name}» (Шкала 1–5)
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400">Итоговый балл:</span>
              <div className="text-lg font-mono font-bold text-amber-400">{averageScore} / 5.0</div>
            </div>
          </div>

          {/* Criteria Sliders / Radio buttons */}
          <div className="space-y-3">
            {[
              {
                key: 'physicsRigor',
                label: '1. Физико-математическая строгость (формулы, расчеты термосферы)',
              },
              {
                key: 'engineeringFeasibility',
                label: '2. Инженерная реализуемость кубсата (энергетика, ADCS, масса)',
              },
              { key: 'presentationClarity', label: '3. Качество 3-х слайдов и наглядность схемы' },
              {
                key: 'defenseQuality',
                label: '4. Ответы на вопросы жюри и удержание регламента 3:00 мин',
              },
            ].map((crit) => (
              <div
                key={crit.key}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <span className="font-medium text-slate-200">{crit.label}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setScores((prev) => ({ ...prev, [crit.key]: val }))}
                      className={`w-8 h-8 rounded-lg font-bold font-mono text-xs transition-all ${
                        (scores as any)[crit.key] === val
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-slate-400 mb-1">Рецензия и рекомендации эксперта:</label>
            <textarea
              rows={3}
              value={expertComment}
              onChange={(e) => setExpertComment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleOpenCertificate}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95"
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>Генерация PDF-сертификата</span>
            </button>

            <button
              onClick={handleSubmitEvaluation}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Зафиксировать оценку ({averageScore})</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. KANBAN STAGE BOARD */}
      {subTab === 'kanban' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">Канбан-доска команд по этапам чемпионата:</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Column 1 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-300 pb-2 border-b border-slate-800">
                <span>Подготовка (Квиз и Слайды)</span>
                <span className="text-[10px] text-slate-500">2</span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="font-bold text-white">Гагаринцы</div>
                <div className="text-[11px] text-slate-400">Квиз завершен, слайды в работе</div>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="font-bold text-white">Сириус-Квант</div>
                <div className="text-[11px] text-slate-400">Кейс выбран</div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between font-bold text-indigo-400 pb-2 border-b border-slate-800">
                <span>Сдано на проверку</span>
                <span className="text-[10px] text-slate-500">2</span>
              </div>
              <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/40 rounded-xl">
                <div className="font-bold text-white">{team.name} (Вы)</div>
                <div className="text-[11px] text-indigo-300">3 слайда готовы к питчу</div>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="font-bold text-white">Кеплер-X</div>
                <div className="text-[11px] text-slate-400">Рецензирование жюри</div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between font-bold text-emerald-400 pb-2 border-b border-slate-800">
                <span>Финалисты защиты</span>
                <span className="text-[10px] text-slate-500">2</span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="font-bold text-white">Астра-3U</div>
                <div className="text-[11px] text-emerald-400">Оценка 4.82 · Допущены</div>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="font-bold text-white">Орион-Политех</div>
                <div className="text-[11px] text-emerald-400">Оценка 4.60 · Допущены</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. LEADERBOARD */}
      {subTab === 'leaderboard' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Рейтинговая таблица команд
              </h2>
              <span className="text-slate-400 text-xs">
                По результатам физико-инженерной экспертизы 3-х слайдов
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {INITIAL_LEADERBOARD.map((item) => (
              <div
                key={item.rank}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  item.name === team.name
                    ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-400 w-5 text-center">
                    {item.rank}
                  </span>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {item.name}
                      {item.name === team.name && (
                        <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-1.5 rounded">
                          Ваша команда
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{item.school}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.name === team.name && (
                    <button
                      onClick={handleOpenCertificate}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                      title="Открыть PDF-сертификат"
                    >
                      <Award className="w-3 h-3 text-amber-400" />
                      <span>Сертификат</span>
                    </button>
                  )}
                  <div className="text-right">
                    <div className="font-mono font-bold text-amber-400 text-sm">
                      {item.score.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">{item.badge}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official PDF Certificate Modal */}
      <CertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        data={certificateData}
      />
    </div>
  );
};
