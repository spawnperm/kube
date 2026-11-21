import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Send,
  Users,
  ShieldCheck,
  Radio,
  Pin,
  Paperclip,
  Search,
  Sparkles,
  Smile,
  X,
  FileCode,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { ChatChannel, ChatMessage, Team, UserRole } from '../../types';
import { filterMessages } from '../../domain/chat';

interface TeamLiveChatProps {
  team: Team;
  userRole: UserRole;
  messages: ChatMessage[];
  activeChannel: ChatChannel;
  onChannelChange: (channel: ChatChannel) => void;
  onSendMessage: (params: {
    text: string;
    channel?: ChatChannel;
    attachment?: { name: string; size: string; type: string };
  }) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string) => void;
  isTyping?: boolean;
  isCompact?: boolean;
}

export const TeamLiveChat: React.FC<TeamLiveChatProps> = ({
  team,
  userRole,
  messages,
  activeChannel,
  onChannelChange,
  onSendMessage,
  onAddReaction,
  onTogglePin,
  isTyping = false,
  isCompact = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const searchId = useId();

  // Scroll to bottom when new messages arrive or channel switches
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChannel, isTyping]);

  const channelFilteredMessages = filterMessages(messages, team.id, activeChannel, searchQuery);

  const pinnedMessage = channelFilteredMessages.find((m) => m.isPinned);

  const quickQuestions = [
    {
      label: '📐 Допустимые габариты выступов 3U',
      text: 'Уточните, пожалуйста: допускаются ли выступы антенн за пределы направляющих рельс P-POD?',
    },
    {
      label: '📡 Согласование частоты 437.425 МГц',
      text: 'Каковы требования к стабильности частоты и девиации радиолинии маяка 437.425 МГц?',
    },
    {
      label: '🔋 Требование к глубине разряда DoD',
      text: 'Какое предельное значение DoD аккумулятора регламентировано для теневого участка орбиты?',
    },
    {
      label: '⏱️ Срок защиты 5 этапа',
      text: 'Когда завершается прием отчетов по 5 этапу и как будет проходить защита миссии?',
    },
  ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    onSendMessage({
      text: inputText,
      channel: activeChannel,
      attachment: attachedFile || undefined,
    });

    setInputText('');
    setAttachedFile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const attachSampleFile = () => {
    setAttachedFile({
      name: `telemetry_packet_${Date.now().toString().slice(-4)}.step`,
      size: '1.8 МБ',
      type: 'cad',
    });
  };

  const channels: Array<{
    id: ChatChannel;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    badge?: string;
  }> = [
    {
      id: 'team',
      label: `Экипаж «${team.name}»`,
      icon: Users,
      desc: 'Внутрикомандный закрытый канал',
      badge: '4 онлайн',
    },
    {
      id: 'organizers',
      label: 'Связь с Оргкомитетом',
      icon: ShieldCheck,
      desc: 'Прямая линия с инженерами ЦУП',
      badge: 'ЦУП Онлайн',
    },
    {
      id: 'announcements',
      label: 'Эфир объявлений',
      icon: Radio,
      desc: 'Официальные сводки и расписание',
    },
  ];

  return (
    <div
      role="region"
      aria-label="Лайв-чат команды и связь с Оргкомитетом"
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900/90 shadow-2xl backdrop-blur-md ${
        isCompact ? 'h-[520px]' : 'h-[640px]'
      }`}
    >
      {/* Top Header & Channels */}
      <div className="border-b border-slate-800 bg-slate-950/90 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Командный лайв-чат & ЦУП</h3>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Realtime
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Синхронизация сообщений экипажа и дежурной смены космодрома
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <label htmlFor={searchId} className="sr-only">
              Поиск по сообщениям чата
            </label>
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              id={searchId}
              type="text"
              placeholder="Поиск по сообщениям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 rounded-lg border border-slate-800 bg-slate-900/90 pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
                aria-label="Очистить поиск"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Channel Navigation Pills */}
        <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
          {channels.map((chan) => {
            const Icon = chan.icon;
            const isActive = activeChannel === chan.id;
            return (
              <button
                key={chan.id}
                type="button"
                onClick={() => onChannelChange(chan.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                <span>{chan.label}</span>
                {chan.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                      isActive ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-cyan-300'
                    }`}
                  >
                    {chan.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pinned Message Alert */}
      {pinnedMessage && (
        <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
          <div className="flex items-center gap-2 truncate">
            <Pin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-amber-300">Закреплено:</span>
            <span className="truncate">{pinnedMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => onTogglePin(pinnedMessage.id)}
            className="text-[10px] text-amber-400 hover:underline shrink-0 ml-2"
          >
            Открепить
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {channelFilteredMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-500">
            <HelpCircle className="h-8 w-8 text-slate-600 mb-2" />
            <p className="text-xs">Сообщений в этом канале пока нет.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Начните диалог или воспользуйтесь быстрыми вопросами ниже.
            </p>
          </div>
        ) : (
          channelFilteredMessages.map((msg) => {
            const isMe =
              (userRole !== 'organizer' && msg.senderRole.includes('Капитан')) ||
              (userRole === 'organizer' && msg.isOrganizer);

            return (
              <div
                key={msg.id}
                className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender badge & timestamp */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                  <span
                    className={`font-semibold ${
                      msg.isOrganizer
                        ? 'text-amber-300 flex items-center gap-1'
                        : isMe
                          ? 'text-cyan-300'
                          : 'text-slate-200'
                    }`}
                  >
                    {msg.isOrganizer && <ShieldCheck className="h-3 w-3 text-amber-400" />}
                    {msg.senderName}
                  </span>
                  <span className="rounded bg-slate-800 px-1 py-0.2 text-[9px] text-slate-400">
                    {msg.senderRole}
                  </span>
                  <span>•</span>
                  <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>

                  {msg.isPinned && (
                    <span className="flex items-center gap-0.5 text-[9px] text-amber-400 bg-amber-400/10 px-1 rounded">
                      <Pin className="h-2.5 w-2.5" />
                      Закреплено
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative max-w-[85%] sm:max-w-xl rounded-2xl p-3 text-xs leading-relaxed shadow-lg ${
                    msg.isOrganizer
                      ? 'border border-amber-500/30 bg-gradient-to-r from-slate-900 to-amber-950/30 text-amber-100'
                      : isMe
                        ? 'border border-cyan-500/30 bg-cyan-950/40 text-slate-100'
                        : 'border border-slate-800 bg-slate-950/80 text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Attachment if present */}
                  {msg.attachment && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-[11px]">
                      <FileCode className="h-4 w-4 text-cyan-400 shrink-0" />
                      <div className="flex-1 truncate">
                        <div className="font-semibold text-slate-200 truncate">
                          {msg.attachment.name}
                        </div>
                        <div className="text-[9px] text-slate-400">{msg.attachment.size}</div>
                      </div>
                      <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] text-cyan-300 font-bold">
                        Вложение
                      </span>
                    </div>
                  )}

                  {/* Reactions row */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-1">
                    {msg.reactions &&
                      Object.entries(msg.reactions).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => onAddReaction(msg.id, emoji)}
                          className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 hover:border-cyan-500/50 hover:bg-slate-700 transition-colors"
                        >
                          <span>{emoji}</span>
                          <span className="font-mono font-bold">{count}</span>
                        </button>
                      ))}

                    {/* Quick Reaction Picker Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)
                        }
                        className="rounded-full p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                        title="Добавить реакцию"
                      >
                        <Smile className="h-3.5 w-3.5" />
                      </button>

                      {showEmojiPicker === msg.id && (
                        <div className="absolute left-0 bottom-full mb-1 z-20 flex gap-1 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl">
                          {['🚀', '👍', '🛰️', '💡', '🔥'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                onAddReaction(msg.id, emoji);
                                setShowEmojiPicker(null);
                              }}
                              className="rounded p-1 hover:bg-slate-800 text-sm transition-transform hover:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pin button */}
                    <button
                      type="button"
                      onClick={() => onTogglePin(msg.id)}
                      className="rounded-full p-1 text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                      title={msg.isPinned ? 'Открепить' : 'Закрепить сообщение'}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Real-time typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-amber-300 animate-pulse px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-medium">Дежурный инженер ЦУП готовит официальный ответ...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions Suggestions for Organizers channel */}
      {activeChannel === 'organizers' && (
        <div className="border-t border-slate-800/80 bg-slate-950/60 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mb-1.5">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>Частые технические запросы в Оргкомитет:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(q.text)}
                className="rounded-lg border border-slate-800 bg-slate-900/90 px-2 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40 hover:bg-slate-800 hover:text-white transition-all text-left"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-slate-800 bg-slate-950 p-3">
        {attachedFile && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-cyan-800/40 bg-cyan-950/30 px-2.5 py-1 text-xs text-cyan-200">
            <div className="flex items-center gap-2 truncate">
              <Paperclip className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-medium truncate">{attachedFile.name}</span>
              <span className="text-[10px] text-slate-400">({attachedFile.size})</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <label htmlFor={inputId} className="sr-only">
              Текст сообщения в чат
            </label>
            <textarea
              id={inputId}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeChannel === 'team'
                  ? 'Сообщение экипажу (Enter — отправить, Shift+Enter — перенос)...'
                  : activeChannel === 'organizers'
                    ? 'Задать технический вопрос Оргкомитету / ЦУП...'
                    : 'Сообщение в общий эфир...'
              }
              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5 pb-1">
            <button
              type="button"
              onClick={attachSampleFile}
              className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
              title="Прикрепить файл телеметрии или чертеж"
              aria-label="Прикрепить файл"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <button
              type="submit"
              disabled={!inputText.trim() && !attachedFile}
              className="flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 p-2 text-slate-950 font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20 transition-all"
              aria-label="Отправить сообщение"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-slate-600" />
            <span>Время ЦУП: МСК (UTC+3)</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>Шифрование протокола связи активно</span>
          </div>
        </div>
      </div>
    </div>
  );
};
