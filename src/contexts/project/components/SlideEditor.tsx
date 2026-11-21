import React, { useState } from 'react';
import {
  FileText,
  Save,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bot,
  CheckCircle2,
  Layers,
  Cpu,
  BarChart3,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Team, ProjectSlide } from '@/src/shared/types/index';
import { audioService } from '@/src/shared/lib/audioService';

interface SlideEditorProps {
  team: Team;
  onUpdateTeam: (updatedTeam: Team) => void;
  onOpenMascotWithTopic: (topic: string) => void;
  onAddXp: (amount: number) => void;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  team,
  onUpdateTeam,
  onOpenMascotWithTopic,
  onAddXp,
}) => {
  const [activeSlideNum, setActiveSlideNum] = useState<1 | 2 | 3>(1);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  const currentSlide = team.slides.find((s) => s.slideNumber === activeSlideNum) || team.slides[0];

  const handleUpdateCurrentSlide = (field: keyof ProjectSlide, value: any) => {
    const newSlides = [...team.slides] as [ProjectSlide, ProjectSlide, ProjectSlide];
    const index = newSlides.findIndex((s) => s.slideNumber === activeSlideNum);
    if (index !== -1) {
      newSlides[index] = {
        ...newSlides[index],
        [field]: value,
        updatedAt: new Date().toISOString(),
      };
      onUpdateTeam({
        ...team,
        slides: newSlides,
      });
    }
  };

  const handleSaveSlide = () => {
    setIsSavedRecently(true);
    audioService.playSuccessChime();
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleSubmitFinalProject = () => {
    const updatedTeam: Team = {
      ...team,
      currentStage: 'submitted',
    };
    onUpdateTeam(updatedTeam);
    onAddXp(100);
    audioService.playSuccessChime();
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
    });
    alert('Проект из 3-х слайдов успешно сдан в оргкомитет КОСМОПОРТ! Статус обновлен.');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-20 pt-2 max-w-4xl mx-auto">
      {/* Top Header & Slide Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider">
            Конструктор 3-х слайдов проекта
          </span>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            Презентация для защиты «{team.cubesatName}»
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Регламент защиты: строго 3 слайда, 3:00 минуты на выступление перед жюри
          </p>
        </div>

        {/* Actions: Save & PDF/Print */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrintPdf}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Печать или экспорт в PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Экспорт PDF</span>
          </button>

          <button
            onClick={handleSaveSlide}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSavedRecently
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
            }`}
          >
            {isSavedRecently ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Сохранено</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Сохранить</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3-Slide Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { num: 1 as const, title: 'Слайд 1: Задача & Концепт', short: '1. Концепция' },
          { num: 2 as const, title: 'Слайд 2: Физическая модель', short: '2. Формулы и модель' },
          { num: 3 as const, title: 'Слайд 3: Архитектура CubeSat', short: '3. Конструкция 3U' },
        ].map((tab) => (
          <button
            key={tab.num}
            onClick={() => setActiveSlideNum(tab.num)}
            className={`p-3 rounded-xl border text-center transition-all min-h-[48px] ${
              activeSlideNum === tab.num
                ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/40 shadow-sm'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-bold">{tab.short}</div>
            <div className="text-[10px] text-slate-400 hidden sm:block truncate mt-0.5">
              {tab.title}
            </div>
          </button>
        ))}
      </div>

      {/* SLIDE CANVAS (Realistic Slide Viewport 16:9 ratio style) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Slide Frame Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-indigo-400 font-bold">СЛАЙД {activeSlideNum} / 3</span>
            <span aria-hidden="true">·</span>
            <span>КОСМОПОРТ 2026</span>
          </div>
          <button
            onClick={() =>
              onOpenMascotWithTopic(`Помоги оформить Слайд ${activeSlideNum} по физике`)
            }
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Консультация Лешего</span>
          </button>
        </div>

        {/* Slide Title Input */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Заголовок слайда:</label>
            <input
              type="text"
              value={currentSlide.title}
              onChange={(e) => handleUpdateCurrentSlide('title', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm sm:text-base font-bold text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Подзаголовок / Спецификация:
            </label>
            <input
              type="text"
              value={currentSlide.subtitle}
              onChange={(e) => handleUpdateCurrentSlide('subtitle', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Content specific to Slide Number */}
        {activeSlideNum === 1 && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Научная цель, актуальность и идея полезной нагрузки:
              </label>
              <textarea
                rows={4}
                value={currentSlide.content}
                onChange={(e) => handleUpdateCurrentSlide('content', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {/* Orbit & Mission Diagram Preview */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
              <div className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Параметры орбитальной миссии (из расчетной записки):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Высота H</div>
                  <div className="text-indigo-400 font-bold">
                    {team.templateData.orbitParameters.altitudeKm} км
                  </div>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Наклонение i</div>
                  <div className="text-indigo-400 font-bold">
                    {team.templateData.orbitParameters.inclinationDeg}°
                  </div>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Эксцентриситет e</div>
                  <div className="text-indigo-400 font-bold">
                    {team.templateData.orbitParameters.eccentricity}
                  </div>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Период витка T</div>
                  <div className="text-indigo-400 font-bold">
                    {team.templateData.orbitParameters.periodMin} мин
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSlideNum === 2 && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Физическая модель и описание процессов:
              </label>
              <textarea
                rows={3}
                value={currentSlide.content}
                onChange={(e) => handleUpdateCurrentSlide('content', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {/* LaTeX Formula Editor & Live Display */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Ключевые формулы модели (LaTeX):
              </label>
              <input
                type="text"
                value={currentSlide.formulaLatex || ''}
                onChange={(e) => handleUpdateCurrentSlide('formulaLatex', e.target.value)}
                placeholder="a_{drag} = 0.5 C_D (A/m) \rho v^2"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Live rendered formula box */}
            {currentSlide.formulaLatex && (
              <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-xl text-center">
                <div className="text-[10px] text-indigo-300 uppercase tracking-wider mb-1">
                  Предпросмотр формулы для жюри:
                </div>
                <div className="text-sm sm:text-base font-mono font-bold text-indigo-200 py-1 overflow-x-auto">
                  ${currentSlide.formulaLatex}$
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Числовой расчет параметров (пример расчета для высоты 400 км):
              </label>
              <textarea
                rows={2}
                value={currentSlide.calculations || ''}
                onChange={(e) => handleUpdateCurrentSlide('calculations', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {activeSlideNum === 3 && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Инженерное обоснование архитектуры CubeSat 3U:
              </label>
              <textarea
                rows={3}
                value={currentSlide.content}
                onChange={(e) => handleUpdateCurrentSlide('content', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {/* Subsystems Table */}
            <div>
              <div className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Сводка ресурсов служебных подсистем:
              </div>
              <div className="space-y-1.5 text-xs">
                {currentSlide.subsystemsData?.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                  >
                    <span className="font-medium text-slate-200">{sub.name}</span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-amber-400">{sub.power}</span>
                      <span className="text-indigo-400">{sub.mass}</span>
                      <span className="text-emerald-400">{sub.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Slide Pager */}
        <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
          <button
            onClick={() => setActiveSlideNum((prev) => Math.max(1, prev - 1) as 1 | 2 | 3)}
            disabled={activeSlideNum === 1}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-medium text-slate-300 disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Назад
          </button>

          <span className="text-xs text-slate-500">Слайд {activeSlideNum} из 3</span>

          <button
            onClick={() => setActiveSlideNum((prev) => Math.min(3, prev + 1) as 1 | 2 | 3)}
            disabled={activeSlideNum === 3}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-medium text-slate-300 disabled:opacity-40 flex items-center gap-1"
          >
            Далее
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Submission Final Callout */}
      <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-bold text-white text-sm">
            {team.currentStage === 'submitted'
              ? '✅ Проект официально сдан на экспертизу'
              : 'Готовы зафиксировать и сдать финальную версию?'}
          </div>
          <div className="text-slate-400 mt-0.5">
            После сдачи эксперты чемпионата приступят к оцениванию по шкале 1–5 баллов.
          </div>
        </div>

        <button
          onClick={handleSubmitFinalProject}
          disabled={team.currentStage === 'submitted'}
          className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            team.currentStage === 'submitted'
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95'
          }`}
        >
          {team.currentStage === 'submitted' ? 'Сдано на проверку' : 'Сдать проект в жюри'}
        </button>
      </div>
    </div>
  );
};
