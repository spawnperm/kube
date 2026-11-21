/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Стартовый квиз корабля для определения уровня топлива (0–100%)
 */

import React, { useState } from 'react';
import { STARTER_QUIZ_QUESTIONS } from '@/src/contexts/crew/services/taskRolesService';
import { audioService } from '@/src/shared/lib/audioService';

interface StarterQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipName: string;
  currentFuel: number;
  onQuizComplete: (fuelPercent: number) => void;
}

export const StarterQuizModal: React.FC<StarterQuizModalProps> = ({
  isOpen,
  onClose,
  shipName,
  currentFuel,
  onQuizComplete,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [calculatedFuel, setCalculatedFuel] = useState(currentFuel);

  if (!isOpen) return null;

  const currentQuestion = STARTER_QUIZ_QUESTIONS[currentQuestionIndex];
  const progressPercent = Math.round(
    ((currentQuestionIndex + 1) / STARTER_QUIZ_QUESTIONS.length) * 100,
  );

  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerChecked(true);

    const isCorrect = selectedOption === currentQuestion.correctIndex;
    if (isCorrect) {
      audioService.playSuccessChime();
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);
      const newFuel = Math.min(100, Math.round((newCorrect / STARTER_QUIZ_QUESTIONS.length) * 100));
      setCalculatedFuel(newFuel);
    } else {
      audioService.playTimerWarning();
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < STARTER_QUIZ_QUESTIONS.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      setIsFinished(true);
      audioService.playSuccessChime();
      onQuizComplete(calculatedFuel);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setCorrectCount(0);
    setIsFinished(false);
    setCalculatedFuel(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Glow effects */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg shadow-cyan-500/20">
              ⚡
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Стартовый квиз заправки корабля
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  «{shipName}»
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                За правильные ответы экипаж заправляет плазменные баки кубсата для допуска на орбиту
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Fuel Tank Gauge Bar */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-4">
          <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span>⛽ Плазменное топливо:</span>
              <span
                className={`font-bold ${calculatedFuel >= 80 ? 'text-emerald-400' : calculatedFuel >= 40 ? 'text-amber-400' : 'text-red-400'}`}
              >
                {calculatedFuel}%
              </span>
            </span>
            <span className="text-slate-400">
              Вопрос {currentQuestionIndex + 1} из {STARTER_QUIZ_QUESTIONS.length}
            </span>
          </div>

          <div className="w-full bg-slate-800/80 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700/60 flex items-center">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                calculatedFuel >= 80
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                  : calculatedFuel >= 40
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-red-500 to-amber-500'
              }`}
              style={{ width: `${Math.max(calculatedFuel, 6)}%` }}
            />
          </div>
        </div>

        {/* Content Area */}
        {!isFinished ? (
          <div className="overflow-y-auto flex-1 pr-1">
            <div className="mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/50">
                {currentQuestion.category}
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-semibold text-slate-100 mb-4 mt-2">
              {currentQuestion.question}
            </h4>

            {/* Answer Options */}
            <div className="space-y-2.5 mb-4">
              {currentQuestion.options.map((option, idx) => {
                let btnStyle =
                  'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/70';

                if (selectedOption === idx) {
                  btnStyle = 'border-cyan-500 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-500';
                }

                if (isAnswerChecked) {
                  if (idx === currentQuestion.correctIndex) {
                    btnStyle =
                      'border-emerald-500 bg-emerald-950/50 text-emerald-200 ring-1 ring-emerald-500 font-semibold';
                  } else if (selectedOption === idx) {
                    btnStyle = 'border-red-500 bg-red-950/50 text-red-200 ring-1 ring-red-500';
                  } else {
                    btnStyle = 'border-slate-800 bg-slate-900/30 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswerChecked}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between text-sm ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-slate-900/80 border border-slate-700 flex items-center justify-center text-xs text-slate-300">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </div>

                    {isAnswerChecked && idx === currentQuestion.correctIndex && (
                      <span className="text-emerald-400 text-base font-bold">✓</span>
                    )}
                    {isAnswerChecked &&
                      selectedOption === idx &&
                      idx !== currentQuestion.correctIndex && (
                        <span className="text-red-400 text-base font-bold">✕</span>
                      )}
                  </button>
                );
              })}
            </div>

            {/* Scientific Explanation after check */}
            {isAnswerChecked && (
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 mb-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
                  <span>💡 Справка бортового компьютера «Леший»:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-2">
                  {currentQuestion.explanation}
                </p>
                {currentQuestion.formulaReference && (
                  <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 flex items-center gap-2">
                    <span className="text-slate-500 text-[10px] uppercase">Формула:</span>
                    <span>{currentQuestion.formulaReference}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Finished State */
          <div className="text-center py-6 flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-4xl shadow-xl shadow-cyan-500/25 mb-4 animate-bounce">
              🚀
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Стартовый тест завершен!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-4">
              Корабль <span className="font-semibold text-cyan-400">«{shipName}»</span> успешно
              заправил баки на{' '}
              <span className="font-bold text-emerald-400 text-base">{calculatedFuel}%</span>{' '}
              плазменного топлива.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-xs w-full mb-6 text-left">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Правильных ответов</div>
                <div className="text-lg font-bold text-white">
                  {correctCount} / {STARTER_QUIZ_QUESTIONS.length}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Уровень топлива</div>
                <div className="text-lg font-bold text-cyan-400">{calculatedFuel}%</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm mb-6">
              Бортовой компьютер «Леший» подтверждает допуск к заполнению 3-х итоговых слайдов и
              защите проекта с экрана перед экспертами ЦУП.
            </p>
          </div>
        )}

        {/* Modal Footer */}
        <div className="border-t border-slate-800 pt-4 mt-2 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {!isFinished && (
              <span>
                Правильно: <strong className="text-white">{correctCount}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isFinished ? (
              !isAnswerChecked ? (
                <button
                  onClick={handleCheckAnswer}
                  disabled={selectedOption === null}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:pointer-events-none text-white font-medium text-sm transition-colors shadow-lg shadow-cyan-600/20"
                >
                  Ответить
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                >
                  <span>
                    {currentQuestionIndex + 1 < STARTER_QUIZ_QUESTIONS.length
                      ? 'Следующий вопрос'
                      : 'Завершить заправку'}
                  </span>
                  <span>→</span>
                </button>
              )
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetQuiz}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Пройти заново
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Перейти в личный кабинет корабля
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
