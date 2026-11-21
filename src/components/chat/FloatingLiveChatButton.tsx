import React, { useState } from 'react';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import { TeamLiveChat } from './TeamLiveChat';
import { ChatChannel, ChatMessage, Team, UserRole } from '../../types';

interface FloatingLiveChatButtonProps {
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
}

export const FloatingLiveChatButton: React.FC<FloatingLiveChatButtonProps> = ({
  team,
  userRole,
  messages,
  activeChannel,
  onChannelChange,
  onSendMessage,
  onAddReaction,
  onTogglePin,
  isTyping,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Count unread or latest messages
  const teamMessagesCount = messages.filter((m) => m.channel === 'team').length;

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 rounded-full border border-cyan-500/40 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-2xl shadow-cyan-500/20 hover:border-cyan-400 hover:scale-105 transition-all"
          aria-label="Открыть командный лайв-чат"
        >
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
          </div>
          <MessageSquare className="h-4 w-4 text-cyan-300" />
          <span>Лайв-чат экипажа & ЦУП</span>
          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-300 border border-cyan-500/30">
            {teamMessagesCount}
          </span>
        </button>
      ) : (
        <div
          className={`flex flex-col rounded-2xl border border-cyan-500/40 bg-slate-950 shadow-2xl transition-all ${
            isExpanded
              ? 'w-[92vw] sm:w-[680px] h-[700px] max-h-[90vh]'
              : 'w-[90vw] sm:w-[460px] h-[560px] max-h-[85vh]'
          }`}
        >
          {/* Top Bar Controls */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-2 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">Эфир связи: «{team.name}»</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isExpanded ? 'Уменьшить окно' : 'Развернуть окно'}
                aria-label={isExpanded ? 'Уменьшить окно' : 'Развернуть окно'}
              >
                {isExpanded ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Свернуть чат"
                aria-label="Свернуть чат"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <TeamLiveChat
              team={team}
              userRole={userRole}
              messages={messages}
              activeChannel={activeChannel}
              onChannelChange={onChannelChange}
              onSendMessage={onSendMessage}
              onAddReaction={onAddReaction}
              onTogglePin={onTogglePin}
              isTyping={isTyping}
              isCompact={!isExpanded}
            />
          </div>
        </div>
      )}
    </div>
  );
};
