/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Модальное окно энциклопедических справок из Википедии
 * под управлением Бортового компьютера «Леший» для помощи экипажу по школьным дисциплинам.
 */

import React, { useState } from 'react';
import {
  WIKIPEDIA_DATABASE,
  WikiEntry,
  taskRolesService,
} from '@/src/contexts/crew/services/taskRolesService';

interface WikipediaHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const WikipediaHelpModal: React.FC<WikipediaHelpModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<WikiEntry>(() => {
    return initialQuery ? taskRolesService.getWikiForQuery(initialQuery) : WIKIPEDIA_DATABASE[0];
  });

  if (!isOpen) return null;

  const disciplines = ['all', 'Физика', 'Химия', 'Биология', 'Математика', 'Космонавтика'];

  const filteredArticles = WIKIPEDIA_DATABASE.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.extract.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDiscipline =
      selectedDiscipline === 'all' || item.discipline === selectedDiscipline;
    return matchesSearch && matchesDiscipline;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xl shadow-lg shadow-cyan-500/20">
              📚
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Справки из Википедии от бортового компьютера «Леший»
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Энциклопедия наук
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Физико-математические и естественно-научные основы решения задач CubeSat
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

        {/* Search Bar & Discipline Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по терминам: свободный пробег, Кеплер, LiFePO4, Сабатье, CubeSat..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <span className="absolute left-3.5 top-3 text-slate-500 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {disciplines.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDiscipline(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedDiscipline === d
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {d === 'all' ? 'Все области' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Two Columns: List & Article Reader */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden">
          {/* Article List Column */}
          <div className="md:col-span-5 border border-slate-800/80 rounded-xl bg-slate-950/60 p-2 overflow-y-auto space-y-1.5 max-h-[500px]">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveArticle(item)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeArticle.id === item.id
                      ? 'border-cyan-500/80 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-500/40'
                      : 'border-transparent bg-slate-900/50 hover:bg-slate-800/70 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-cyan-400">{item.discipline}</span>
                    <span className="text-slate-500 text-[10px]">Википедия</span>
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-1 mb-1">{item.title}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.extract}
                  </p>
                </button>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-500">
                Статьи не найдены. Попробуйте другой запрос.
              </div>
            )}
          </div>

          {/* Article Reader Column */}
          <div className="md:col-span-7 border border-slate-800 rounded-xl bg-slate-950/90 p-5 overflow-y-auto max-h-[500px] flex flex-col justify-between">
            {activeArticle ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="px-2.5 py-1 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-semibold">
                    {activeArticle.discipline}
                  </span>
                  <a
                    href={activeArticle.wikipediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 underline"
                  >
                    <span>Читать оригинал на Википедии</span>
                    <span>↗</span>
                  </a>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-white">{activeArticle.title}</h4>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeArticle.extract}
                </p>

                {activeArticle.keyFormulas && activeArticle.keyFormulas.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Формулы и расчетные соотношения:
                    </div>
                    {activeArticle.keyFormulas.map((f, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg font-mono text-xs text-cyan-300 flex items-center justify-between"
                      >
                        <code>{f}</code>
                        <span className="text-[10px] text-slate-500">LaTeX</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-sm">
                Выберите статью слева для просмотра
              </div>
            )}

            <div className="border-t border-slate-800/80 pt-3 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Бортовой компьютер «Леший» синтезирует данные из Википедии</span>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
              >
                Закрыть справку
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
