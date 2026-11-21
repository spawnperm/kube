import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Pin,
  Lock,
  Unlock,
  Trash2,
  Paperclip,
  Search,
  Filter,
  Eye,
  Send,
  X,
} from 'lucide-react';
import { ForumTopic, ForumReply, ForumCategory, Team, UserRole } from '../../types';

interface ForumTabProps {
  topics: ForumTopic[];
  activeTeam: Team;
  userRole: UserRole;
  onAddTopic: (topic: ForumTopic) => void;
  onAddReply: (topicId: string, reply: ForumReply) => void;
  onTogglePinTopic: (topicId: string) => void;
  onToggleCloseTopic: (topicId: string) => void;
  onDeleteTopic: (topicId: string) => void;
  onDeleteReply: (topicId: string, replyId: string) => void;
}

export const ForumTab: React.FC<ForumTabProps> = ({
  topics,
  activeTeam,
  userRole,
  onAddTopic,
  onAddReply,
  onTogglePinTopic,
  onToggleCloseTopic,
  onDeleteTopic,
  onDeleteReply,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(topics[0]?.id || null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState(false);

  // New reply form
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState<Array<{ name: string; size: string; type: string }>>(
    [],
  );

  // New topic form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ForumCategory>('ballistics');
  const [newContent, setNewContent] = useState('');
  const [newFiles, setNewFiles] = useState<Array<{ name: string; size: string; type: string }>>([]);

  const isModerator = userRole === 'jury' || userRole === 'organizer' || userRole === 'mentor';

  const categoryLabels: Record<ForumCategory, string> = {
    ballistics: 'Орбитальная механика и баллистика',
    hardware: 'Конструирование КубСата и CAD',
    electronics: 'Бортовая электроника и энергобаланс',
    payload: 'Научная полезная нагрузка и датчики',
    radio: 'Радиосвязь 437 МГц и SDR-станции',
    general: 'Правила и общие вопросы',
  };

  const filteredTopics = topics.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.authorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTopic || selectedTopic.closed) return;

    const newReply: ForumReply = {
      id: `rep_${Date.now()}`,
      topicId: selectedTopic.id,
      authorName:
        userRole === 'jury'
          ? 'Проф. А.И. Мельников'
          : userRole === 'mentor'
            ? activeTeam.mentorName
            : activeTeam.members[0]?.name || 'Участник',
      authorRole:
        userRole === 'jury'
          ? 'Экспертное жюри'
          : userRole === 'mentor'
            ? 'Научный ментор'
            : 'Участник команды',
      authorTeam: userRole === 'participant' ? activeTeam.name : undefined,
      createdAt: 'Сегодня, только что',
      content: replyText,
      attachments: replyFiles,
      likes: 0,
    };

    onAddReply(selectedTopic.id, newReply);
    setReplyText('');
    setReplyFiles([]);
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const topic: ForumTopic = {
      id: `topic_${Date.now()}`,
      title: newTitle,
      category: newCategory,
      authorName:
        userRole === 'jury'
          ? 'Проф. А.И. Мельников'
          : userRole === 'mentor'
            ? activeTeam.mentorName
            : activeTeam.members[0]?.name || 'Участник',
      authorRole:
        userRole === 'jury'
          ? 'Экспертное жюри'
          : userRole === 'mentor'
            ? 'Научный ментор'
            : 'Капитан команды',
      authorTeam: userRole === 'participant' ? activeTeam.name : undefined,
      createdAt: 'Только что',
      content: newContent,
      attachments: newFiles,
      pinned: false,
      closed: false,
      views: 1,
      replies: [],
    };

    onAddTopic(topic);
    setSelectedTopicId(topic.id);
    setIsNewTopicModalOpen(false);
    setNewTitle('');
    setNewContent('');
    setNewFiles([]);
  };

  const handleAddMockFile = (target: 'topic' | 'reply') => {
    const sampleFiles = [
      { name: 'CubeSat_Payload_Wiring_Diagram.pdf', size: '2.4 МБ', type: 'application/pdf' },
      { name: 'Thermal_Vacuum_Test_Curve.png', size: '1.2 МБ', type: 'image/png' },
      { name: 'Antenna_Deployment_CAD.step', size: '8.6 МБ', type: 'application/octet-stream' },
    ];
    const picked = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
    if (target === 'topic') {
      setNewFiles((prev) => [...prev, picked]);
    } else {
      setReplyFiles((prev) => [...prev, picked]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/20 p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Форум кейс-чемпионата «МИРОВИЗОР»</h1>
              <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                COSMO-FORUM COMMUNITY
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              Обсуждение инженерных чертежей, расчетов орбитальной механики, консультации экспертов
              и обмен опытом между командами.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewTopicModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-purple-500 px-4 py-2 text-xs font-bold text-white hover:bg-purple-400 shadow-lg shadow-purple-500/25 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Создать тему на форуме</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Поиск тем, чертежей и авторов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="all">Все разделы ({topics.length})</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Topic List & Topic Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Topics List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
          {filteredTopics.map((t) => {
            const isSelected = t.id === selectedTopicId;

            return (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => setSelectedTopicId(t.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedTopicId(t.id);
                  }
                }}
                className={`cursor-pointer rounded-xl border p-3.5 text-xs transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-950/25 shadow-lg shadow-purple-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-medium truncate max-w-[200px]">
                    {categoryLabels[t.category]}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.pinned && (
                      <span className="flex items-center gap-0.5 text-amber-400 text-[10px] bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 font-semibold">
                        <Pin className="h-3 w-3" /> Закреплено
                      </span>
                    )}
                    {t.closed && (
                      <span className="flex items-center gap-0.5 text-rose-400 text-[10px] bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                        <Lock className="h-3 w-3" /> Закрыто
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-white text-sm line-clamp-2 leading-snug">
                  {t.title}
                </h3>

                <p className="mt-1 text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                  {t.content}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-300">{t.authorName}</span>
                    {t.authorTeam && <span className="text-purple-300">({t.authorTeam})</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{t.replies.length}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{t.views}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Topic & Thread Replies (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTopic ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-xs shadow-xl space-y-4">
              {/* Topic Header */}
              <div className="pb-3 border-b border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                      {categoryLabels[selectedTopic.category]}
                    </span>
                    <span className="text-[10px] text-slate-500">{selectedTopic.createdAt}</span>
                  </div>
                  <h2 className="text-base font-bold text-white">{selectedTopic.title}</h2>
                  <div className="text-slate-400 text-xs mt-1">
                    Автор: <strong className="text-white">{selectedTopic.authorName}</strong> (
                    {selectedTopic.authorRole})
                  </div>
                </div>

                {/* Moderation Controls Toolbar */}
                {isModerator && (
                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => onTogglePinTopic(selectedTopic.id)}
                      className={`p-1.5 rounded transition-colors ${selectedTopic.pinned ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 hover:text-white'}`}
                      title={selectedTopic.pinned ? 'Открепить тему' : 'Закрепить тему'}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onToggleCloseTopic(selectedTopic.id)}
                      className={`p-1.5 rounded transition-colors ${selectedTopic.closed ? 'text-rose-400 bg-rose-500/20' : 'text-slate-400 hover:text-white'}`}
                      title={selectedTopic.closed ? 'Открыть тему' : 'Закрыть тему'}
                    >
                      {selectedTopic.closed ? (
                        <Unlock className="h-3.5 w-3.5" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteTopic(selectedTopic.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-400 transition-colors"
                      title="Удалить тему (Модерация)"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Topic Original Post Body */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                <p className="text-slate-200 leading-relaxed text-xs whitespace-pre-wrap">
                  {selectedTopic.content}
                </p>

                {/* Attachments */}
                {selectedTopic.attachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-850">
                    <span className="text-[10px] text-slate-400 font-semibold mb-1.5 block">
                      Прикрепленные файлы:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedTopic.attachments.map((file) => (
                        <div
                          key={`${file.name}-${file.size}`}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 text-[11px]"
                        >
                          <Paperclip className="h-3 w-3 text-purple-400" />
                          <span>{file.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">({file.size})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Thread Replies List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Ответы в теме ({selectedTopic.replies.length}):</span>
                  {selectedTopic.closed && (
                    <span className="text-rose-400 text-[11px]">
                      Тема закрыта для новых ответов
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {selectedTopic.replies.map((rep) => (
                    <div
                      key={rep.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{rep.authorName}</span>
                          <span className="text-[10px] bg-purple-500/15 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/20">
                            {rep.authorRole}
                          </span>
                          {rep.authorTeam && (
                            <span className="text-[10px] text-slate-400">«{rep.authorTeam}»</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">{rep.createdAt}</span>
                          {isModerator && (
                            <button
                              onClick={() => onDeleteReply(selectedTopic.id, rep.id)}
                              className="text-slate-500 hover:text-rose-400 p-0.5"
                              title="Удалить сообщение"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-wrap">
                        {rep.content}
                      </p>

                      {rep.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {rep.attachments.map((f, fi) => (
                            <span
                              key={fi}
                              className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400"
                            >
                              <Paperclip className="h-3 w-3 text-purple-400" />
                              <span>{f.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              {!selectedTopic.closed ? (
                <form
                  onSubmit={handleSendReply}
                  className="pt-2 border-t border-slate-800 space-y-2"
                >
                  <textarea
                    rows={3}
                    placeholder="Напишите ответ, задайте вопрос автору или прикрепите чертеж..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs"
                  />

                  {/* Attached files chips */}
                  {replyFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {replyFiles.map((f, i) => (
                        <span
                          key={`${f.name}-${f.size}`}
                          className="flex items-center gap-1 bg-purple-950/40 border border-purple-800/40 text-purple-300 px-2 py-0.5 rounded text-[10px]"
                        >
                          <span>{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setReplyFiles(replyFiles.filter((_, idx) => idx !== i))}
                            className="hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleAddMockFile('reply')}
                      className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>Прикрепить чертеж / схему</span>
                    </button>

                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-lg bg-purple-500 px-4 py-1.5 font-bold text-white hover:bg-purple-400 shadow-md shadow-purple-500/20 transition-all text-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Опубликовать ответ</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                  🔒 Эта тема закрыта модератором для публикации сообщений
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500 text-xs">
              Выберите тему слева для просмотра обсуждения
            </div>
          )}
        </div>
      </div>

      {/* New Topic Modal */}
      {isNewTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-purple-800/40 bg-slate-900 p-6 shadow-2xl text-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Создание новой темы на форуме</h3>
              </div>
              <button
                onClick={() => setIsNewTopicModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="mt-4 space-y-3.5">
              <div>
                <label htmlFor="forumtab_field_1" className="block text-slate-300 font-medium mb-1">
                  Раздел форума *
                </label>
                <select
                  id="forumtab_field_1"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ForumCategory)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="forumtab_field_2" className="block text-slate-300 font-medium mb-1">
                  Заголовок темы *
                </label>
                <input
                  id="forumtab_field_2"
                  type="text"
                  required
                  placeholder="Четко сформулируйте инженерный вопрос или тему исследования..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="forumtab_field_3" className="block text-slate-300 font-medium mb-1">
                  Содержание темы / Описание вопроса *
                </label>
                <textarea
                  id="forumtab_field_3"
                  rows={4}
                  required
                  placeholder="Опишите подробности, приведите формулы, параметры аппарата или описание проблемы..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-slate-300">
                    Прикрепленные файлы (чертежи, схемы, графики):
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddMockFile('topic')}
                    className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Добавить файл</span>
                  </button>
                </div>
                <div className="space-y-1.5">
                  {newFiles.map((f, i) => (
                    <div
                      key={`${f.name}-${f.size}`}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300"
                    >
                      <span className="truncate">
                        {f.name} ({f.size})
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewFiles(newFiles.filter((_, idx) => idx !== i))}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTopicModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-slate-400 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-500 px-5 py-2 font-bold text-white hover:bg-purple-400 shadow-lg shadow-purple-500/20"
                >
                  Опубликовать тему
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
