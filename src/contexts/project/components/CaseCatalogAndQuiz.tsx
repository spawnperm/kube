import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  HelpCircle,
  Volume2,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  Bot,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CaseTask, QuizQuestion, Team } from '@/src/shared/types/index';
import { CASE_TASKS, QUIZ_QUESTIONS } from '@/src/shared/data/mockData';
import { audioService } from '@/src/shared/lib/audioService';

interface CaseCatalogAndQuizProps {
  team: Team;
  onSelectTask: (task: CaseTask) => void;
  onOpenMascotWithTopic: (topic: string) => void;
  onAddXp: (amount: number) => void;
  initialSubView?: string;
}

export const CaseCatalogAndQuiz: React.FC<CaseCatalogAndQuizProps> = ({
  team,
  onSelectTask,
  onOpenMascotWithTopic,
  onAddXp,
  initialSubView = 'catalog',
}) => {
  const [subView, setSubView] = useState<'catalog' | 'quiz'>(
    initialSubView === 'quiz' ? 'quiz' : 'catalog',
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<CaseTask | null>(
    CASE_TASKS.find((t) => t.id === team.selectedTaskId) || CASE_TASKS[0],
  );

  // Quiz state
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  const filteredTasks = CASE_TASKS.filter((task) => {
    if (categoryFilter === 'all') return true;
    return task.category === categoryFilter;
  });

  const currentQuestion = QUIZ_QUESTIONS[currentQuizIndex];

  const handleSelectAnswer = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    setIsAnswerSubmitted(true);

    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
      audioService.playSuccessChime();
    } else {
      audioService.playTimerWarning();
    }

    // Voice reading explanation if not muted
    if (!audioService.getIsMuted()) {
      audioService.speak(
        (isCorrect ? 'Верно! ' : 'Не совсем так. ') + currentQuestion.explanation,
        'professor',
      );
    }
  };

  const handleNextQuestion = () => {
    if (currentQuizIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizCompleted(true);
      onAddXp(60);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      audioService.playSuccessChime();
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setIsQuizCompleted(false);
  };

  return (
    <div className="space-y-4 pb-20 pt-2 max-w-4xl mx-auto">
      {/* Top Toggle: Каталог задач vs Разминочный квиз */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setSubView('catalog')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            subView === 'catalog'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Каталог космических кейсов</span>
        </button>

        <button
          onClick={() => setSubView('quiz')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            subView === 'quiz'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Разминочный квиз</span>
          <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded ml-1 hidden sm:inline">
            Разогрев
          </span>
        </button>
      </div>

      {/* VIEW A: КАТАЛОГ ЗАДАЧ */}
      {subView === 'catalog' && (
        <div className="space-y-4">
          {/* Category Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-slate-500 text-xs px-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Разделы:
            </span>
            {[
              { id: 'all', label: 'Все кейсы (500)' },
              { id: 'space_biology', label: 'Биология (50)' },
              { id: 'crystallography', label: 'Кристаллы и Химия (50)' },
              { id: 'orbital_physics', label: 'Физика космоса (50)' },
              { id: 'earth_observation', label: 'ДЗЗ и Геология (50)' },
              { id: 'payload_optics', label: 'Оптика и спектры (50)' },
              { id: 'quantum_radio', label: 'Квант и Радио (50)' },
              { id: 'ballistics', label: 'Баллистика (50)' },
              { id: 'astrophysics', label: 'Астрофизика (50)' },
              { id: 'thermodynamics', label: 'Термодинамика (50)' },
              { id: 'propulsion_energy', label: 'Энергетика и ЭРД (50)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  categoryFilter === cat.id
                    ? 'bg-slate-100 text-slate-900 border-white'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTasks.map((task) => {
              const isSelectedByOurTeam = team.selectedTaskId === task.id;
              const isDetailOpen = selectedTaskDetail?.id === task.id;

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskDetail(task)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all text-left ${
                    isSelectedByOurTeam
                      ? 'bg-indigo-950/30 border-indigo-500/60 ring-1 ring-indigo-500/30'
                      : isDetailOpen
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="font-mono text-indigo-400 font-bold">{task.cardNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>{task.categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-400 font-medium">{task.difficulty}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2 leading-snug">{task.title}</h3>

                  <p className="text-xs text-slate-300 line-clamp-3 mb-3 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Physics Keywords */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 mb-3">
                    {task.physicsKeywords.slice(0, 3).map((kw, i) => (
                      <span key={i} className="text-slate-400">
                        #{kw}
                      </span>
                    ))}
                  </div>

                  {/* Footer status & Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {isSelectedByOurTeam ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Выбрана вашей командой</span>
                      </div>
                    ) : task.takenByTeamName ? (
                      <span className="text-xs text-slate-500">Занята: {task.takenByTeamName}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Доступна для выбора</span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task);
                        audioService.playSuccessChime();
                      }}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelectedByOurTeam
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      }`}
                    >
                      {isSelectedByOurTeam ? 'Текущий кейс' : 'Выбрать кейс'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Task Detail Inspector Modal / Drawer */}
          {selectedTaskDetail && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 mt-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{selectedTaskDetail.categoryLabel}</span>
                <span className="font-mono text-indigo-400">
                  {selectedTaskDetail.schoolGradeRange}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mb-2">{selectedTaskDetail.title}</h2>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                {selectedTaskDetail.description}
              </p>

              {/* Required Mathematical & Physics Formulas */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 mb-4">
                <div className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  Ключевые формулы школьного курса для решения (11klassov.net):
                </div>
                <div className="space-y-1.5 text-xs font-mono text-indigo-300">
                  {selectedTaskDetail.keyFormulas.map((f, i) => (
                    <div key={i} className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      ${f}$
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={() => onOpenMascotWithTopic(selectedTaskDetail.title)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  Спросить подсказку у Лешего
                </button>

                <button
                  onClick={() => onSelectTask(selectedTaskDetail)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  Закрепить эту задачу за «{team.name}»
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW B: РАЗМИНОЧНЫЙ КВИЗ */}
      {subView === 'quiz' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[11px] text-indigo-400 uppercase tracking-wider font-semibold">
                Предварительный квиз-разогрев
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Вопросы по физике космических аппаратов
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">
                Вопрос {currentQuizIndex + 1} из {QUIZ_QUESTIONS.length}
              </span>
              <div className="text-xs font-mono font-bold text-amber-400">Баллы: {quizScore}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{
                width: `${((currentQuizIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
              }}
            />
          </div>

          {!isQuizCompleted ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm sm:text-base font-semibold text-white leading-snug">
                {currentQuestion.question}
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === currentQuestion.correctIndex;

                  let borderClass = 'border-slate-800 bg-slate-950/80 text-slate-200';
                  if (isSelected && !isAnswerSubmitted) {
                    borderClass = 'border-indigo-500 bg-indigo-500/10 text-white';
                  } else if (isAnswerSubmitted) {
                    if (isCorrect) {
                      borderClass = 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
                    } else if (isSelected && !isCorrect) {
                      borderClass = 'border-rose-500 bg-rose-500/20 text-rose-300';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between min-h-[48px] ${borderClass}`}
                    >
                      <span>{option}</span>
                      {isAnswerSubmitted && isCorrect && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation card after submit */}
              {isAnswerSubmitted && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Физическое объяснение решения:
                  </div>
                  <p className="text-slate-300 leading-relaxed">{currentQuestion.explanation}</p>
                  {currentQuestion.formulaReference && (
                    <div className="font-mono text-indigo-300 pt-1 text-[11px]">
                      Формула: {currentQuestion.formulaReference}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => audioService.speak(currentQuestion.explanation, 'professor')}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Прослушать объяснение Лешего
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                    className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedAnswer === null
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                    }`}
                  >
                    Проверить ответ
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md"
                  >
                    <span>
                      {currentQuizIndex < QUIZ_QUESTIONS.length - 1
                        ? 'Следующий вопрос'
                        : 'Завершить квиз'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Completed screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Разминочный квиз пройден!</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Вы верно ответили на {quizScore} из {QUIZ_QUESTIONS.length} вопросов. Награда +60 XP
                зачислена на счет команды.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleRestartQuiz}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
                >
                  Пройти заново
                </button>
                <button
                  onClick={() => setSubView('catalog')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Вернуться к кейсам
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
