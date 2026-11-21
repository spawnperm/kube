/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Полноэкранный режим демонстрации 3-х слайдов итоговой презентации команды
 * для защиты проекта перед экспертами и ЦУП прямо из личного кабинета наставника.
 */

import React, { useState, useEffect } from 'react';
import { Team } from '@/src/shared/types/index';

interface PresentationModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
}

export const PresentationModeModal: React.FC<PresentationModeModalProps> = ({
  isOpen,
  onClose,
  team,
}) => {
  const [currentSlide, setCurrentSlide] = useState<1 | 2 | 3>(1);
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // 5 минут на защиту
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Клавиатурная навигация
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        setCurrentSlide((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlide((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Таймер регламента защиты (5 минут)
  useEffect(() => {
    if (!isOpen || !isTimerRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isTimerRunning]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const slide1 = team.slides[0];
  const slide2 = team.slides[1];
  const slide3 = team.slides[2];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col text-slate-100 select-none animate-in fade-in duration-200">
      {/* Top Presenter Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center font-bold text-white text-sm">
            🚀
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{team.shipName || team.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                {team.cubesatFormat} CubeSat
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-md">
              {team.school} · {team.selectedTaskTitle || 'Кейс по космической физике'}
            </div>
          </div>
        </div>

        {/* Slide Steps Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => setCurrentSlide(num as 1 | 2 | 3)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentSlide === num
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span>Слайд {num}</span>
              <span className="text-[10px] opacity-75">
                {num === 1 ? '(Команда)' : num === 2 ? '(Теория)' : '(Практика)'}
              </span>
            </button>
          ))}
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">⏱️ Регламент:</span>
            <span
              className={`font-mono font-bold ${
                timerSeconds < 60 ? 'text-red-400 animate-pulse' : 'text-cyan-300'
              }`}
            >
              {formatTimer(timerSeconds)}
            </span>
            <button
              onClick={() => setIsTimerRunning((prev) => !prev)}
              className="text-slate-500 hover:text-slate-300 text-[10px]"
              title={isTimerRunning ? 'Пауза' : 'Продолжить'}
            >
              {isTimerRunning ? '⏸' : '▶'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-300 text-xs font-medium border border-slate-700 hover:border-red-800 transition-colors flex items-center gap-1.5"
          >
            <span>Завершить показ</span>
            <kbd className="px-1 py-0.5 rounded bg-slate-900 text-[10px] text-slate-400">Esc</kbd>
          </button>
        </div>
      </header>

      {/* Main Slide Canvas (Projector Screen) */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <div className="w-full max-w-6xl aspect-[16/9] min-h-[580px] bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 lg:p-12 shadow-2xl relative flex flex-col justify-between overflow-hidden">
          {/* Subtle Projector Watermark */}
          <div className="absolute top-6 right-8 flex items-center gap-3 opacity-40 pointer-events-none">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              ЦУП КОСМОПОРТ 2026
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          {/* SLIDE 1: Team Representation & Photo */}
          {currentSlide === 1 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in duration-300">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                    Слайд 1 · Представление экипажа
                  </span>
                  <span className="text-xs text-slate-400">| Защита проектного кейса</span>
                </div>
                <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight mb-2">
                  Космический корабль «{team.shipName || team.name}»
                </h1>
                <p className="text-base lg:text-lg text-slate-300 font-medium max-w-3xl">
                  {team.school}
                </p>
                <div className="text-sm text-cyan-400 font-medium mt-1">
                  Научная задача:{' '}
                  {team.selectedTaskTitle || 'Баллистика и время жизни кубсата 3U в термосфере'}
                </div>
              </div>

              {/* Grid with Team Photo & Crew Roster */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 my-auto items-center">
                {/* Photo Column */}
                <div className="md:col-span-6 relative">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-2xl bg-slate-950 relative group">
                    <img
                      src={
                        team.teamPhotoUrl ||
                        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
                      }
                      alt="Фото команды"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                      <div className="text-xs text-slate-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Экипаж в лаборатории перед допуском к старту</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Crew Roster Column */}
                <div className="md:col-span-6 space-y-3">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
                    Штатное расписание на борту:
                  </h3>

                  {/* Captain */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-base">
                        ⭐
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{team.mentorName}</div>
                        <div className="text-xs text-amber-400 font-medium">
                          Капитан корабля (Наставник)
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                      Руководитель
                    </span>
                  </div>

                  {/* AI Leshy Navigator */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-base">
                        🤖
                      </div>
                      <div>
                        <div className="text-sm font-bold text-cyan-200">
                          Бортовой компьютер «Леший»
                        </div>
                        <div className="text-xs text-cyan-400 font-medium">
                          Оркестратор бортовых AI-агентов
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                      Бортовой компьютер
                    </span>
                  </div>

                  {/* 3 Student Specialists */}
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                          {member.role === 'physicist'
                            ? '⚛️'
                            : member.role === 'chemist'
                              ? '🧪'
                              : member.role === 'biologist'
                                ? '🧬'
                                : member.role === 'designer'
                                  ? '🎨'
                                  : member.role === 'medic'
                                    ? '🩺'
                                    : member.role === 'mathematician'
                                      ? '📐'
                                      : '🛠️'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">{member.name}</div>
                          <div className="text-xs text-slate-400">
                            {member.roleTitle || member.role} ·{' '}
                            {member.gradeText || `${member.grade} класс`}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-emerald-900/50">
                        {member.status === 'active' ? 'Активен' : 'Штатно'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide 1 Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Формат CubeSat: <strong className="text-white">{team.cubesatFormat}</strong>
                </span>
                <span>
                  Заправка баков:{' '}
                  <strong className="text-cyan-400">{team.fuelPercent || 85}%</strong>
                </span>
                <span>
                  Позывной: <strong className="text-white">{team.shipCallsign || 'Борт-01'}</strong>
                </span>
              </div>
            </div>
          )}

          {/* SLIDE 2: Theoretical Foundation, Formulas & Charts */}
          {currentSlide === 2 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in duration-300">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-xs font-bold uppercase tracking-wider">
                    Слайд 2 · Теоретическая часть и математические модели
                  </span>
                  <span className="text-xs text-slate-400">| Формулы, графики, диаграммы</span>
                </div>
                <h2 className="text-2xl lg:text-4xl font-bold text-white tracking-tight mb-1">
                  {slide2.title}
                </h2>
                <p className="text-sm lg:text-base text-slate-300">{slide2.subtitle}</p>
              </div>

              {/* Theoretical Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
                {/* Formulas & Calculations */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-slate-950/80 border border-blue-500/30 rounded-2xl p-5 shadow-xl">
                    <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span>📐 Ключевые аналитические уравнения</span>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 font-mono text-cyan-300 text-sm lg:text-base leading-relaxed overflow-x-auto">
                      {slide2.formulaLatex ||
                        'a_{drag} = \\frac{1}{2} C_D \\frac{A}{m} \\rho v^2, \\quad \\Delta r_{rev} = -2\\pi \\frac{C_D A}{m} \\rho r^2'}
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
                    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      💡 Физическое обоснование и параметры расчета:
                    </div>
                    <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
                      {slide2.calculations || slide2.content}
                    </p>
                  </div>
                </div>

                {/* Diagrams & Orbital Cyclogram */}
                <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span>📊 Орбитальные параметры и динамика</span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                        <span className="text-xs text-slate-400">Период обращения T:</span>
                        <span className="font-mono font-bold text-white text-sm">92.8 мин</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                        <span className="text-xs text-slate-400">Орбитальная скорость v:</span>
                        <span className="font-mono font-bold text-cyan-300 text-sm">7.67 км/с</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                        <span className="text-xs text-slate-400">
                          Плотность атмосферы ρ (400 км):
                        </span>
                        <span className="font-mono font-bold text-amber-300 text-sm">
                          2.8 × 10⁻¹² кг/м³
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                        <span className="text-xs text-slate-400">Суточная потеря высоты:</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          ~435 м/сутки
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-[11px] text-cyan-200">
                    ℹ️ Расчет подтвержден библиотекой баллистических алгоритмов ЦУП КОСМОПОРТ.
                  </div>
                </div>
              </div>

              {/* Slide 2 Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Дисциплины: <strong>Физика · Высшая математика · Баллистика</strong>
                </span>
                <span>
                  Модель атмосферы: <strong>NRLMSISE-00</strong>
                </span>
              </div>
            </div>
          )}

          {/* SLIDE 3: Practical Application & Member Reflections */}
          {currentSlide === 3 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in duration-300">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    Слайд 3 · Практическая применимость в космосе
                  </span>
                  <span className="text-xs text-slate-400">
                    | Персональное видение каждого участника экипажа
                  </span>
                </div>
                <h2 className="text-2xl lg:text-4xl font-bold text-white tracking-tight mb-1">
                  {slide3.title}
                </h2>
                <p className="text-sm lg:text-base text-slate-300">{slide3.subtitle}</p>
              </div>

              {/* Practical Reflections Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-auto">
                {(team.memberReflections && team.memberReflections.length > 0
                  ? team.memberReflections
                  : [
                      {
                        memberName: team.mentorName,
                        role: 'captain',
                        roleTitle: 'Капитан (Наставник)',
                        text: 'Внедрение данного наноспутника позволит пермским школьникам непрерывно калибровать плотность верхней атмосферы для точного прогнозирования траекторий космических аппаратов.',
                      },
                      ...team.members.map((m) => ({
                        memberName: m.name,
                        role: m.role,
                        roleTitle: m.roleTitle || m.role,
                        text:
                          m.role === 'physicist'
                            ? 'Физическая модель прямо применима для автоматического маневрирования наноспутников и предотвращения опасных сближений с космическим мусором.'
                            : m.role === 'chemist'
                              ? 'Литий-железо-фосфатные батареи и термостойкое покрытие корпуса защитят научную аппаратуру в течение 4000 циклов день/ночь.'
                              : 'Биологический модуль доказывает жизнеспособность автономных микробиореакторов для будущих межпланетных экспедиций.',
                      })),
                    ]
                ).map((reflection, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-colors"
                  >
                    <p className="text-xs lg:text-sm text-slate-200 italic leading-relaxed mb-3">
                      «{reflection.text}»
                    </p>
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                      <div className="text-xs font-bold text-white">{reflection.memberName}</div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-slate-700 font-medium">
                        {reflection.roleTitle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Slide 3 Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Готовность к запуску:{' '}
                  <strong className="text-emerald-400">100% (Борт допущен)</strong>
                </span>
                <span>
                  Защиту принимает:{' '}
                  <strong className="text-white">
                    ЦУП КОСМОПОРТ (Смирнов А.А., Песин М.В., Анисимова А.С.)
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Presenter Control Bar */}
      <footer className="h-16 border-t border-slate-800 bg-slate-900/95 px-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Навигация: </span>
          <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
            ← Назад
          </kbd>
          <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
            Вперед → / Пробел
          </kbd>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentSlide((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev))}
            disabled={currentSlide === 1}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Предыдущий слайд</span>
          </button>

          <span className="text-xs font-bold text-slate-300 px-3">{currentSlide} / 3</span>

          <button
            onClick={() => setCurrentSlide((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev))}
            disabled={currentSlide === 3}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
          >
            <span>Следующий слайд</span>
            <span>→</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
