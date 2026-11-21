import React, { useState, useMemo, useEffect } from 'react';
import {
  Presentation,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Layers,
  Users,
  Shield,
  Scale,
  Rocket,
  Sliders,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  PORTAL_PRESENTATION_SLIDES,
  type PresentationAudience,
  type SlideHighlightCard,
} from '../../data/portalPresentationSlides';
import { downloadPortalPresentationPptx } from '../../services/presentationPptxExport';
import { downloadPortalPresentationPdf } from '../../services/presentationPdfExport';
import type { Team } from '../../types';

interface PortalPresentationTabProps {
  activeTeam?: Team;
  totalTeams?: number;
}

const AUDIENCE_FILTERS: Array<{
  id: PresentationAudience;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'all', label: 'Все слайды (10)', icon: Layers },
  { id: 'features', label: 'Функционал', icon: Rocket },
  { id: 'tasks', label: 'Задачи', icon: Presentation },
  { id: 'participant', label: 'Участникам', icon: Users },
  { id: 'organizer', label: 'Организаторам', icon: Sliders },
  { id: 'jury', label: 'Комиссии', icon: Scale },
  { id: 'admin', label: 'Администратору', icon: Shield },
];

const CARD_ACCENT_CLASSES: Record<SlideHighlightCard['accent'], string> = {
  cyan: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-300',
  amber: 'border-amber-500/40 bg-amber-500/5 text-amber-300',
  emerald: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300',
  indigo: 'border-indigo-500/40 bg-indigo-500/5 text-indigo-300',
  rose: 'border-rose-500/40 bg-rose-500/5 text-rose-300',
  purple: 'border-purple-500/40 bg-purple-500/5 text-purple-300',
};

const BADGE_ACCENT_CLASSES: Record<SlideHighlightCard['accent'], string> = {
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
};

export const PortalPresentationTab: React.FC<PortalPresentationTabProps> = ({
  activeTeam,
  totalTeams,
}) => {
  const [audienceFilter, setAudienceFilter] = useState<PresentationAudience>('all');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportedFileName, setExportedFileName] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const visibleSlides = useMemo(() => {
    if (audienceFilter === 'all') return PORTAL_PRESENTATION_SLIDES;
    return PORTAL_PRESENTATION_SLIDES.filter((s) => s.audience === audienceFilter);
  }, [audienceFilter]);

  const currentSlide = visibleSlides[activeSlideIndex] || visibleSlides[0];

  useEffect(() => {
    setActiveSlideIndex(0);
  }, [audienceFilter]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') {
        setActiveSlideIndex((i) => Math.min(visibleSlides.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveSlideIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visibleSlides.length]);

  const handleDownloadPptx = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const fileName = await downloadPortalPresentationPptx({
        teamName: activeTeam?.name,
        totalTeams,
        generatedDate: new Date().toLocaleDateString('ru-RU'),
      });
      setExportedFileName(fileName);
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.6 },
      });
      setTimeout(() => setExportedFileName(null), 5000);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Не удалось сформировать файл .pptx',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setExportError(null);
    try {
      const fileName = await downloadPortalPresentationPdf({
        teamName: activeTeam?.name,
        totalTeams,
        generatedDate: new Date().toLocaleDateString('ru-RU'),
      });
      setExportedFileName(fileName);
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.6 },
      });
      setTimeout(() => setExportedFileName(null), 5000);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Не удалось сформировать файл .pdf',
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="rounded-2xl border border-cyan-500/25 bg-slate-900/90 p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40">
            <Presentation className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white">
                Презентация портала и руководства ролей (.PPTX)
              </h1>
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                10 СЛАЙДОВ • 16:9
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-300 max-w-3xl">
              Обзор функционала платформы, 5 инженерных этапов и банк 500 задач, а также
              пошаговые руководства для пользователей, организаторов, членов комиссии и
              администраторов.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPptx}
            disabled={isExporting || isExportingPdf}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Сборка PPTX...' : 'Скачать презентацию (.PPTX)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting || isExportingPdf}
            className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>{isExportingPdf ? 'Сборка PDF...' : 'Скачать презентацию (.PDF)'}</span>
          </button>

          <a
            href="/Cosmoport_Portal_Presentation.pptx"
            download="Cosmoport_Portal_Presentation.pptx"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:border-cyan-500/40 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            title="Прямая ссылка на готовый файл .PPTX"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Файл .PPTX</span>
          </a>

          <a
            href="/Cosmoport_Portal_Presentation.pdf"
            download="Cosmoport_Portal_Presentation.pdf"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:border-amber-500/40 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            title="Прямая ссылка на готовый файл .PDF"
          >
            <FileText className="h-3.5 w-3.5 text-amber-400" />
            <span>Файл .PDF</span>
          </a>
        </div>
      </div>

      {exportedFileName && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            Презентация «{exportedFileName}» успешно сформирована и скачана!
          </span>
        </div>
      )}

      {exportError && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-rose-300 text-xs">
          Ошибка экспорта презентации: {exportError}
        </div>
      )}

      {/* Audience Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/70 p-2 rounded-xl border border-slate-800">
        {AUDIENCE_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = audienceFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setAudienceFilter(filter.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main 16:9 Slide Canvas */}
      {currentSlide && (
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-950 shadow-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-amber-400" />

          <div className="p-5 sm:p-8 space-y-5 min-h-[440px] flex flex-col justify-between">
            <div className="space-y-4">
              {/* Slide Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                  {currentSlide.kicker}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                  Слайд {currentSlide.number} из {PORTAL_PRESENTATION_SLIDES.length}
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {currentSlide.title}
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                  {currentSlide.subtitle}
                </p>
              </div>

              {/* Cards Layout */}
              {(currentSlide.layout === 'cover' || currentSlide.layout === 'cards') &&
                currentSlide.cards && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {currentSlide.cards.map((card, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border p-4 space-y-2 ${CARD_ACCENT_CLASSES[card.accent]}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${BADGE_ACCENT_CLASSES[card.accent]}`}
                          >
                            {card.badge}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white">{card.title}</h3>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {card.items.map((line, idx) => (
                            <li key={idx} className="leading-snug">
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

              {/* Stages & Guide Steps Layout */}
              {(currentSlide.layout === 'stages' || currentSlide.layout === 'guide') &&
                currentSlide.steps && (
                  <div className="space-y-2 pt-1">
                    {currentSlide.steps.map((st, idx) => {
                      const isHighlight = st.step === '04' || st.step === 'Шаг 4';
                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 ${
                            isHighlight
                              ? 'border-amber-500/50 bg-amber-950/20'
                              : 'border-slate-800 bg-slate-900/80'
                          }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold shrink-0 w-fit border ${
                              isHighlight
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            }`}
                          >
                            {st.step}
                          </span>
                          <div className="sm:w-64 shrink-0 font-bold text-xs sm:text-sm text-white">
                            {st.title}
                          </div>
                          <div className="text-xs text-slate-300 leading-relaxed flex-1">
                            {st.detail}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Table Layout */}
              {currentSlide.layout === 'table' &&
                currentSlide.tableHeaders &&
                currentSlide.tableRows && (
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-cyan-500 text-slate-950 font-bold">
                          {currentSlide.tableHeaders.map((h, i) => (
                            <th key={i} className="p-2.5 border-b border-slate-800">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {currentSlide.tableRows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={rIdx % 2 === 0 ? 'bg-slate-900/90' : 'bg-slate-900/50'}
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`p-2.5 align-top leading-relaxed ${
                                  cIdx === 0
                                    ? 'font-bold text-cyan-300 whitespace-nowrap'
                                    : 'text-slate-300'
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>

            {/* Slide Footer & Controls */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-slate-400">
                {currentSlide.footerNote}
              </span>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveSlideIndex((i) => Math.max(0, i - 1))}
                  disabled={activeSlideIndex === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Назад</span>
                </button>
                <span className="text-xs font-mono text-slate-400 px-1">
                  {activeSlideIndex + 1} / {visibleSlides.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlideIndex((i) => Math.min(visibleSlides.length - 1, i + 1))
                  }
                  disabled={activeSlideIndex >= visibleSlides.length - 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <span>Вперёд</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide Strip Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {visibleSlides.map((slide, idx) => {
          const isCurrent = idx === activeSlideIndex;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveSlideIndex(idx)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isCurrent
                  ? 'border-cyan-400 bg-cyan-950/30 text-white shadow-md'
                  : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="text-[10px] font-mono text-cyan-400 font-bold">
                Слайд {slide.number}
              </div>
              <div className="text-xs font-semibold line-clamp-2 mt-0.5 text-slate-200">
                {slide.title}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
