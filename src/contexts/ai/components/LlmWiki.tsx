import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Volume2,
  HardDrive,
  FileCode,
  Tag,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import { WikiArticle } from '@/src/shared/types/index';
import { WIKI_ARTICLES } from '@/src/shared/data/mockData';
import { audioService } from '@/src/shared/lib/audioService';

interface LlmWikiProps {
  onOpenMascotWithTopic: (topic: string) => void;
  onAddXp: (amount: number) => void;
  onOpenQuiz?: (slug?: string) => void;
}

export const LlmWiki: React.FC<LlmWikiProps> = ({ onOpenMascotWithTopic, onAddXp, onOpenQuiz }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle>(WIKI_ARTICLES[0]);
  const [activeTab, setActiveTab] = useState<'articles' | 'minio'>('articles');

  const filteredArticles = WIKI_ARTICLES.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.markdownContent.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = selectedSubject === 'all' || article.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleDownloadMarkdown = (article: WikiArticle) => {
    const blob = new Blob([article.markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${article.slug}-llm-wiki.md`;
    link.click();
    URL.revokeObjectURL(url);
    onAddXp(20);
    audioService.playSuccessChime();
  };

  const handleSpeakArticle = (article: WikiArticle) => {
    audioService.speak(article.summary, 'professor');
  };

  // MinIO Media Assets List (Simulated Object Storage)
  const minioMediaList = [
    {
      id: 'obj-01',
      bucket: 'kosmoport-multimedia',
      key: 'schemes/cubesat-3u-exploded-blueprint.svg',
      title: 'Взрыв-схема наноспутника 3U со стандартами CalPoly',
      size: '2.4 MB',
      type: 'Векторная схема',
      updatedAt: '2026-10-10',
    },
    {
      id: 'obj-02',
      bucket: 'kosmoport-multimedia',
      key: 'orbits/homann-transfer-trajectory.png',
      title: 'Гомановский маневр перехода на геостационарную орбиту',
      size: '4.8 MB',
      type: 'Диаграмма траектории',
      updatedAt: '2026-10-12',
    },
    {
      id: 'obj-03',
      bucket: 'kosmoport-multimedia',
      key: 'chemistry/sabatier-co2-recovery-reactor.svg',
      title: 'Технологическая схема реактора Сабатье для станции',
      size: '1.9 MB',
      type: 'Химическая схема',
      updatedAt: '2026-10-13',
    },
    {
      id: 'obj-04',
      bucket: 'kosmoport-multimedia',
      key: 'biophysics/radiation-belts-van-allen.png',
      title: 'Карта плотности потоков протонов и электронов поясов Ван Аллена',
      size: '3.1 MB',
      type: 'Радиационная карта',
      updatedAt: '2026-10-14',
    },
  ];

  return (
    <div className="space-y-4 pb-20 pt-2 max-w-4xl mx-auto">
      {/* Top Banner: LLM-Wiki + MinIO / Forgejo Identity */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="text-indigo-400 font-mono">LLM-WIKI ARCHITECTURE</span>
            <span aria-hidden="true">·</span>
            <span>Forgejo Markdown + MinIO Storage</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">100% Оффлайн</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            База знаний: Космическая физика, химия и биология
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Конспекты точных наук по материалам школьной программы (11klassov.net) для расчета
            кейсов.
          </p>
        </div>

        {/* View Switcher: Articles vs MinIO Storage */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[40px] flex items-center gap-1.5 ${
              activeTab === 'articles'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Статьи</span>
          </button>
          <button
            onClick={() => setActiveTab('minio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[40px] flex items-center gap-1.5 ${
              activeTab === 'minio'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>MinIO Медиа</span>
          </button>
        </div>
      </div>

      {activeTab === 'articles' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column: Search & Articles List (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по законам физики, формулам..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Subject Filters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {['all', 'Физика', 'Химия', 'Биология', 'Инженерия CubeSat'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors ${
                    selectedSubject === sub
                      ? 'bg-slate-100 text-slate-900 border-white font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {sub === 'all' ? 'Все науки' : sub}
                </button>
              ))}
            </div>

            {/* Articles List */}
            <div className="space-y-2">
              {filteredArticles.map((article) => {
                const isSelected = selectedArticle.id === article.id;
                return (
                  <div
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all text-left ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="text-indigo-400 font-semibold">{article.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.schoolGrade}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.readingTimeMin} мин</span>
                    </div>

                    <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">
                      {article.title}
                    </h3>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Full Article Reader (7 cols) */}
          <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
            {/* Article Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                  <span className="text-indigo-400 font-semibold">{selectedArticle.subject}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedArticle.schoolGrade}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {selectedArticle.title}
                </h2>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {onOpenQuiz && (
                  <button
                    onClick={() => onOpenQuiz(selectedArticle.slug)}
                    className="min-h-[40px] px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
                    title="Пройти экзамен-квиз с Лешим по этой теме"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Квиз Лешего</span>
                  </button>
                )}

                <button
                  onClick={() => handleSpeakArticle(selectedArticle)}
                  className="min-h-[40px] px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-700 text-xs font-medium flex items-center gap-1"
                  title="Озвучить конспект голосом Лешего"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Озвучить</span>
                </button>

                <button
                  onClick={() => handleDownloadMarkdown(selectedArticle)}
                  className="min-h-[40px] px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1"
                  title="Экспортировать в Markdown файл (Forgejo)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.MD</span>
                </button>
              </div>
            </div>

            {/* School Textbook Attribution (11klassov.net) */}
            <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Источник: {selectedArticle.sourceReference}</span>
              <span className="text-emerald-400 flex items-center gap-1 shrink-0 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Оффлайн-кэш
              </span>
            </div>

            {/* Formatted Markdown Content */}
            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 font-sans">
              <div className="whitespace-pre-wrap">{selectedArticle.markdownContent}</div>
            </div>

            {/* Bottom Quiz Callout Banner */}
            {onOpenQuiz && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Закрепить материал в Орбитальном экзамене
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Бортовой компьютер «Леший» сгенерирует расчетные задачи по этой статье и
                    начислит +25 XP за каждый верный ответ.
                  </p>
                </div>
                <button
                  onClick={() => onOpenQuiz(selectedArticle.slug)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <span>Начать тест</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Bottom: Ask Cubic prompt */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => onOpenMascotWithTopic(selectedArticle.title)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5"
              >
                <Bot className="w-4 h-4" />
                Задать Лешему вопрос по этой теме
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MINIO MULTIMEDIA VAULT */
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                M
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  MinIO Медиа-Хранилище чертежей и схем
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  bucket: kosmoport-multimedia (S3-compatible API)
                </span>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-mono">Status: Connected</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {minioMediaList.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
                  <span>{item.type}</span>
                  <span>{item.size}</span>
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm">{item.title}</h3>
                <div className="font-mono text-[10px] text-indigo-400 truncate">
                  s3://{item.bucket}/{item.key}
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Обновлено: {item.updatedAt}</span>
                  <button
                    onClick={() => {
                      alert(`Файл ${item.key} загружен из локального хранилища MinIO!`);
                      audioService.playSuccessChime();
                    }}
                    className="text-xs text-indigo-400 hover:text-white font-medium flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Скачать
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
