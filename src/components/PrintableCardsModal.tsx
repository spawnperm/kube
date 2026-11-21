import React, { useState, useId } from 'react';
import { type CubeSatMissionIdea } from '../data/cubesatMissionIdeas';
import { ROLE_ICONS } from './CubeSatIdeasCatalog';
import {
  Printer,
  Download,
  FileDown,
  Loader2,
  X,
  FileText,
  Scissors,
  CheckCircle2,
  Sparkles,
  Layers,
  Users,
  Cpu,
  Orbit,
} from 'lucide-react';

export type PrintLayoutMode =
  '18perPage' | '12perPage' | '9perPage' | '8perPage' | '6perPage' | '4perPage' | '2perPage';

interface PrintableCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredIdeas: CubeSatMissionIdea[];
  allIdeas: CubeSatMissionIdea[];
  selectedIdea?: CubeSatMissionIdea;
}

export const PrintableCardsModal: React.FC<PrintableCardsModalProps> = ({
  isOpen,
  onClose,
  filteredIdeas,
  allIdeas,
  selectedIdea,
}) => {
  const [targetScope, setTargetScope] = useState<'filtered' | 'selected' | 'all'>('filtered');
  const [layoutMode, setLayoutMode] = useState<PrintLayoutMode>('12perPage');
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [showJuryFields, setShowJuryFields] = useState<boolean>(true);
  const [colorMode, setColorMode] = useState<'color' | 'bw'>('color');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  if (!isOpen) return null;

  const cardsToPrint = (() => {
    if (targetScope === 'selected' && selectedIdea) {
      return [selectedIdea];
    }
    if (targetScope === 'all') {
      return allIdeas;
    }
    return filteredIdeas.length > 0 ? filteredIdeas : allIdeas.slice(0, 12);
  })();

  const cardsPerPage =
    layoutMode === '18perPage'
      ? 18
      : layoutMode === '12perPage'
        ? 12
        : layoutMode === '9perPage'
          ? 9
          : layoutMode === '8perPage'
            ? 8
            : layoutMode === '6perPage'
              ? 6
              : layoutMode === '4perPage'
                ? 4
                : 2;

  // Односторонняя печать: каждый лист содержит до cardsPerPage карточек
  const totalSheets = Math.ceil(cardsToPrint.length / cardsPerPage);

  // Скачивание готового скомпилированного PDF через серверный API
  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const response = await fetch('/api/export/cards-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: cardsToPrint,
          layoutMode,
          showCropMarks,
          showJuryFields,
          colorMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cubesat_cards_${cardsToPrint.length}pcs_${layoutMode}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error, fallback to HTML print:', err);
      // Fallback
      handleDownloadHtml();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    const htmlContent = generateStandalonePrintHtml(
      cardsToPrint,
      layoutMode,
      showCropMarks,
      showJuryFields,
      colorMode,
    );
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    printFrame.contentDocument?.open();
    printFrame.contentDocument?.write(htmlContent);
    printFrame.contentDocument?.close();

    printFrame.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          if (printFrame.parentNode) {
            document.body.removeChild(printFrame);
          }
        }, 2000);
      }, 300);
    };
  };

  const handleDownloadHtml = () => {
    const htmlContent = generateStandalonePrintHtml(
      cardsToPrint,
      layoutMode,
      showCropMarks,
      showJuryFields,
      colorMode,
    );
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cubesat_cards_print_${cardsToPrint.length}pcs_${layoutMode}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-indigo-500/40 bg-slate-900 shadow-2xl shadow-indigo-950/50 my-6 overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Шапка модального окна */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Печать и экспорт карточек для выдачи командам
                </h3>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Односторонняя печать • Шрифт 10+ пт • 12+ на лист</span>
                </span>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                  <Scissors className="h-3 w-3" />
                  <span>С полями реза</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Односторонний шаблон кейс-заданий: длина карточки по контенту, четкое расстояние
                заголовка и описания, шрифт от 10 пт
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Панель настроек печати */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 shrink-0 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Выбор набора карточек */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Какие карточки включить:
              </label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setTargetScope('filtered')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer flex items-center justify-between ${
                    targetScope === 'filtered'
                      ? 'border-indigo-400 bg-indigo-950/50 text-indigo-200 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Текущая выборка</span>
                  <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                    {filteredIdeas.length} шт.
                  </span>
                </button>

                {selectedIdea && (
                  <button
                    type="button"
                    onClick={() => setTargetScope('selected')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer flex items-center justify-between ${
                      targetScope === 'selected'
                        ? 'border-indigo-400 bg-indigo-950/50 text-indigo-200 font-bold'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate">Выбранная команда: #{selectedIdea.number}</span>
                    <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                      1 шт.
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setTargetScope('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer flex items-center justify-between ${
                    targetScope === 'all'
                      ? 'border-indigo-400 bg-indigo-950/50 text-indigo-200 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Весь каталог миссий</span>
                  <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                    {allIdeas.length} шт.
                  </span>
                </button>
              </div>
            </div>

            {/* Макет раскладки на листе А4 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Макет листа А4:
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                  Листов: {totalSheets} стр. (односторонняя)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setLayoutMode('12perPage')}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden ${
                    layoutMode === '12perPage'
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 font-bold ring-1 ring-emerald-400/50'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">12 на лист</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-bold">
                      Рекомендуется!
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    3×4 • ~{Math.ceil(cardsToPrint.length / 12)} стр. (шрифт 10+ пт)
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('18perPage')}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    layoutMode === '18perPage'
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 font-bold ring-1 ring-emerald-400/50'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">18 на лист</span>
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded">
                      3×6
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    3×6 • ~{Math.ceil(cardsToPrint.length / 18)} стр.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('9perPage')}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    layoutMode === '9perPage'
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 font-bold ring-1 ring-emerald-400/50'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">9 на лист</span>
                    <span className="text-[9px] bg-slate-700 text-slate-300 px-1 rounded">3×3</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    3×3 • ~{Math.ceil(cardsToPrint.length / 9)} стр.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('8perPage')}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    layoutMode === '8perPage'
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 font-bold ring-1 ring-emerald-400/50'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">8 на лист</span>
                    <span className="text-[9px] bg-slate-700 text-slate-300 px-1 rounded">2×4</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    2×4 • ~{Math.ceil(cardsToPrint.length / 8)} стр.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('6perPage')}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    layoutMode === '6perPage'
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 font-bold ring-1 ring-emerald-400/50'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">6 на лист</span>
                    <span className="text-[9px] bg-slate-700 text-slate-300 px-1 rounded">2×3</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    2×3 • ~{Math.ceil(cardsToPrint.length / 6)} стр.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('4perPage')}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    layoutMode === '4perPage'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 font-bold ring-1 ring-cyan-400/50'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-xs">4 на лист (2×2)</div>
                  <div className="text-[10px] text-slate-400">
                    {Math.ceil(cardsToPrint.length / 4)} стр.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('2perPage')}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    layoutMode === '2perPage'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 font-bold ring-1 ring-cyan-400/50'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-xs">2 на лист (1×2)</div>
                  <div className="text-[10px] text-slate-400">
                    {Math.ceil(cardsToPrint.length / 2)} стр.
                  </div>
                </button>
              </div>
            </div>

            {/* Опции полей реза и отметок */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Параметры печати:
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showCropMarks}
                    onChange={(e) => setShowCropMarks(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-400"
                  />
                  <span>Метки и пунктир реза (Crop marks ✂)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showJuryFields}
                    onChange={(e) => setShowJuryFields(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-400"
                  />
                  <span>Бланк выдачи и отметок жюри</span>
                </label>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setColorMode('color')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                      colorMode === 'color'
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                        : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    Цветной
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('bw')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                      colorMode === 'bw'
                        ? 'border-slate-400 bg-slate-800 text-white'
                        : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    Ч/Б (Экономия тонера)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Предпросмотр карточек (Интерактивное превью) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span>Предпросмотр печатных карточек ({cardsToPrint.length} шт.):</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Показано в окне первых {Math.min(cardsToPrint.length, 6)} из {cardsToPrint.length}
            </span>
          </div>

          <div
            className={`grid gap-3.5 ${
              layoutMode === '2perPage'
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            } items-start`}
          >
            {cardsToPrint.slice(0, 6).map((idea) => (
              <div
                key={idea.id}
                className="relative bg-white text-slate-900 rounded-lg p-3.5 border border-dashed border-slate-400 shadow-md font-sans select-none h-auto transition-all"
                style={{
                  boxShadow:
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
              >
                {/* Метки реза (Crop marks) по углам */}
                {showCropMarks && (
                  <>
                    <div className="absolute -top-2 -left-2 text-[10px] text-slate-500 font-mono font-bold leading-none">
                      ┌
                    </div>
                    <div className="absolute -top-2 -right-2 text-[10px] text-slate-500 font-mono font-bold leading-none">
                      ┐
                    </div>
                    <div className="absolute -bottom-2 -left-2 text-[10px] text-slate-500 font-mono font-bold leading-none">
                      └
                    </div>
                    <div className="absolute -bottom-2 -right-2 text-[10px] text-slate-500 font-mono font-bold leading-none">
                      ┘
                    </div>
                    <div className="absolute top-1 right-2 text-[8px] font-mono text-slate-400 flex items-center gap-0.5">
                      <Scissors className="h-2.5 w-2.5" />
                      <span>Линия реза</span>
                    </div>
                  </>
                )}

                {/* Шапка карточки: только категория и номер */}
                <div className="border-b-2 border-slate-900 pb-1.5 mb-2.5 flex items-center justify-between">
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10.5pt] font-bold bg-slate-900 text-white leading-tight">
                    {idea.category}
                  </span>
                  <span className="font-mono text-slate-900 font-bold text-[10.5pt]">
                    № {String(idea.number).padStart(4, '0')}
                  </span>
                </div>

                {/* Название миссии (четкий крупный заголовок) */}
                <h4 className="font-extrabold text-slate-950 text-base leading-snug mb-3">
                  {idea.title}
                </h4>

                {/* Выделенный блок изюминки с четким отступом */}
                {idea.creativityHighlight && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-2 text-xs text-amber-950 mb-3 leading-tight rounded-r">
                    <span>{idea.creativityHighlight}</span>
                  </div>
                )}

                {/* Описание миссии (Шрифт не менее 10 пунктов, четкое свободное расстояние) */}
                <p className="text-[10.5pt] text-slate-800 leading-relaxed mb-3.5 font-normal">
                  {idea.description}
                </p>

                {/* Роли экипажа в одну строку без заголовка */}
                <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[10pt] mb-2.5">
                  {idea.roles.map((role) => (
                    <span
                      key={role}
                      className="px-1.5 py-0.5 rounded text-[10pt] font-semibold bg-slate-100 border border-slate-200 text-slate-800 shrink-0"
                    >
                      {ROLE_ICONS[role] || '👤'} {role}
                    </span>
                  ))}
                </div>

                {/* Бланк отметок для команды и жюри */}
                {showJuryFields && (
                  <div className="pt-2 border-t border-slate-300 text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
                      <span>Команда: ___________________________</span>
                      <span>Стол №: _____</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>[ ] Орбита [ ] ПН [ ] 3D-сборка [ ] Защита</span>
                      <span className="font-bold text-slate-800">Балл: ___ / 100</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {cardsToPrint.length > 6 && (
            <p className="text-center text-slate-500 text-xs mt-3">
              ...и еще {cardsToPrint.length - 6} карточек будут включены в печать и файл экспорта.
            </p>
          )}
        </div>

        {/* Футер с кнопками действий */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            Готово к выдаче: <strong className="text-white">{cardsToPrint.length}</strong> карточек
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer transform active:scale-95"
              title="Скачать готовый PDF-документ карточек с полями реза (минимальное число листов)"
            >
              {isDownloadingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              <span>
                {isDownloadingPdf ? 'Генерация PDF…' : `Скачать PDF (${cardsToPrint.length} шт.)`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              title="Сохранить автономный HTML-файл для печати на любом компьютере"
            >
              <Download className="h-4 w-4" />
              <span>Скачать HTML для печати</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer transform active:scale-95"
              title="Открыть системный диалог печати браузера"
            >
              <Printer className="h-4 w-4" />
              <span>Распечатать / PDF ({cardsToPrint.length} шт.)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Генерирует автономный чистый HTML-документ со встроенными стилями печати,
 * полями реза, типографскими метками и удобной разметкой листов А4.
 */
function generateStandalonePrintHtml(
  cards: CubeSatMissionIdea[],
  layoutMode: PrintLayoutMode,
  showCropMarks: boolean,
  showJuryFields: boolean,
  colorMode: 'color' | 'bw',
): string {
  const cardsPerPage =
    layoutMode === '18perPage'
      ? 18
      : layoutMode === '12perPage'
        ? 12
        : layoutMode === '9perPage'
          ? 9
          : layoutMode === '8perPage'
            ? 8
            : layoutMode === '6perPage'
              ? 6
              : layoutMode === '4perPage'
                ? 4
                : 2;
  const isColor = colorMode === 'color';

  const cardsHtml = cards
    .map((idea, index) => {
      const pageBreakBefore = index > 0 && index % cardsPerPage === 0;

      const rolesHtml = idea.roles
        .map((role) => `<span class="role-tag">${ROLE_ICONS[role] || '👤'} ${role}</span>`)
        .join(' ');

      return `
        ${pageBreakBefore ? '<div class="page-break"></div>' : ''}
        <div class="card ${layoutMode === '2perPage' ? 'card-large' : 'card-compact'}">
          ${
            showCropMarks
              ? `
            <div class="crop-mark crop-tl"></div>
            <div class="crop-mark crop-tr"></div>
            <div class="crop-mark crop-bl"></div>
            <div class="crop-mark crop-br"></div>
            <div class="cut-indicator">✂ Линия реза</div>
          `
              : ''
          }
          <div class="card-inner">
            <div class="card-header">
              <span class="category-badge">${escapeHtml(idea.category)}</span>
              <div class="card-number">№ ${String(idea.number).padStart(4, '0')}</div>
            </div>

            <h3 class="card-title">${escapeHtml(idea.title)}</h3>

            ${
              idea.creativityHighlight
                ? `<div class="highlight-box">${escapeHtml(idea.creativityHighlight)}</div>`
                : ''
            }

            <p class="card-desc">${escapeHtml(idea.description)}</p>

            <div class="roles-section">
              <div class="roles-list">${rolesHtml}</div>
            </div>

            ${
              showJuryFields
                ? `
              <div class="jury-box">
                <div class="jury-line">
                  <span>Команда: _____________________________________</span>
                  <span>Стол №: _____</span>
                </div>
                <div class="checklist-line">
                  <span>Этапы: [ ] Орбита &bull; [ ] ПН &bull; [ ] 3D-сборка &bull; [ ] Защита</span>
                  <span class="jury-score">Оценка: _____ / 100</span>
                </div>
              </div>
            `
                : ''
            }
          </div>
        </div>
      `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Карточки CubeSat для выдачи командам (${cards.length} шт.)</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 5mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      color: #0f172a;
      font-size: 10.5pt;
    }
    .print-controls {
      background: #0f172a;
      color: #fff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
    }
    .print-btn {
      background: #4f46e5;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
    }
    .print-btn:hover { background: #4338ca; }
    .page-break {
      page-break-before: always;
      break-before: page;
      height: 0;
      margin: 0;
      border: none;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: ${
        layoutMode === '18perPage' || layoutMode === '12perPage' || layoutMode === '9perPage'
          ? 'repeat(3, 1fr)'
          : layoutMode === '2perPage'
            ? '1fr'
            : '1fr 1fr'
      };
      gap: 3mm;
      padding: 2mm;
      max-width: 210mm;
      margin: 0 auto;
      align-items: start; /* Длина каждой карточки определяется контентом */
    }
    .card {
      position: relative;
      background: #ffffff;
      border: 1px dashed #64748b;
      padding: 2.5mm 3mm;
      page-break-inside: avoid;
      break-inside: avoid;
      height: auto;
      min-height: auto;
    }
    .card-large {
      min-height: auto;
    }
    .card-compact {
      min-height: auto;
    }
    .card-inner {
      height: auto;
      display: flex;
      flex-direction: column;
    }
    /* Crop Marks */
    .crop-mark {
      position: absolute;
      width: 4mm;
      height: 4mm;
      border-color: #0f172a;
      pointer-events: none;
    }
    .crop-tl { top: -2mm; left: -2mm; border-top: 1px solid #0f172a; border-left: 1px solid #0f172a; }
    .crop-tr { top: -2mm; right: -2mm; border-top: 1px solid #0f172a; border-right: 1px solid #0f172a; }
    .crop-bl { bottom: -2mm; left: -2mm; border-bottom: 1px solid #0f172a; border-left: 1px solid #0f172a; }
    .crop-br { bottom: -2mm; right: -2mm; border-bottom: 1px solid #0f172a; border-right: 1px solid #0f172a; }
    .cut-indicator {
      position: absolute;
      top: 1mm;
      right: 2mm;
      font-size: 8px;
      font-family: monospace;
      color: #94a3b8;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 1.5mm;
      margin-bottom: 2.5mm;
    }
    .card-number {
      font-size: 10.5pt;
      font-weight: 800;
      font-family: monospace;
      color: #0f172a;
    }
    .category-badge {
      display: inline-block;
      padding: 1.5px 7px;
      border-radius: 4px;
      font-size: 10pt;
      font-weight: bold;
      background: ${isColor ? '#0f172a' : '#0f172a'};
      color: #ffffff;
      line-height: 1.25;
    }
    .card-title {
      font-size: 12pt;
      font-weight: 800;
      margin: 0 0 4mm 0; /* Четкий достаточный отступ от заголовка к описанию, чтобы не сливалось */
      line-height: 1.32;
      color: #0f172a;
    }
    .highlight-box {
      background: ${isColor ? '#fef3c7' : '#f1f5f9'};
      border-left: 3px solid ${isColor ? '#d97706' : '#0f172a'};
      padding: 2mm 2.8mm;
      font-size: 10pt;
      line-height: 1.35;
      margin: 1mm 0 3.8mm 0;
      color: ${isColor ? '#78350f' : '#0f172a'};
      border-radius: 0 3px 3px 0;
    }
    .card-desc {
      font-size: 10.5pt; /* Шрифт не менее 10 пунктов */
      line-height: 1.4;
      color: #1e293b;
      margin: 0 0 3.5mm 0;
    }
    .roles-section {
      margin-bottom: 2mm;
    }
    .roles-list {
      display: flex;
      flex-wrap: nowrap;
      overflow: hidden;
      white-space: nowrap;
      gap: 1.5mm;
    }
    .role-tag {
      display: inline-flex;
      align-items: center;
      padding: 1px 5px;
      border-radius: 3px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #1e293b;
      font-size: 10pt;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .jury-box {
      border-top: 1px solid #cbd5e1;
      padding-top: 1.8mm;
      margin-top: 2mm;
      font-size: 10pt;
      color: #475569;
    }
    .jury-line {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #cbd5e1;
      padding-bottom: 1mm;
      margin-bottom: 1mm;
    }
    .checklist-line {
      display: flex;
      justify-content: space-between;
      color: #64748b;
    }
    .jury-score {
      font-weight: bold;
      color: #0f172a;
    }
    @media print {
      .print-controls { display: none !important; }
      body { background: #fff !important; }
      .cards-grid { padding: 0 !important; max-width: 100% !important; gap: 3mm !important; }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <div>
      <strong>КОСМОПОРТ</strong> &bull; Односторонние карточки CubeSat (${cards.length} шт. &bull; Шрифт 10+ пт &bull; Длина по контенту)
    </div>
    <button class="print-btn" onclick="window.print()">Распечатать карточки (Ctrl+P)</button>
  </div>

  <div class="cards-grid">
    ${cardsHtml}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
