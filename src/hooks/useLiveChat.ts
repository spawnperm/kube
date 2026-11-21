import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatChannel, ChatMessage, Team, UserRole } from '../types';
import { INITIAL_CHAT_MESSAGES } from '../data/mockData';
import {
  addMessageSafely,
  createChatMessage,
  generateOrganizerResponse,
  toggleMessagePin,
  toggleMessageReaction,
} from '../domain/chat';

const STORAGE_KEY = 'kosmos_live_chat_messages_v1';
const BROADCAST_CHANNEL_NAME = 'kosmos_live_chat_channel';

interface UseLiveChatParams {
  team: Team;
  userRole: UserRole;
  onActivityLog?: (action: string, details: string) => void;
}

export function useLiveChat({ team, userRole, onActivityLog }: UseLiveChatParams) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON parse or localStorage errors
    }
    return INITIAL_CHAT_MESSAGES;
  });

  const [activeChannel, setActiveChannel] = useState<ChatChannel>('team');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // quota or private mode fallback
    }
  }, [messages]);

  // Set up real-time multi-tab / multi-user sync via BroadcastChannel & storage events
  useEffect(() => {
    let broadcast: BroadcastChannel | null = null;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        broadcast = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        broadcast.onmessage = (event) => {
          const data = event.data;
          if (data && data.type === 'NEW_MESSAGE' && data.message) {
            setMessages((prev) => addMessageSafely(prev, data.message));
          } else if (data && data.type === 'REACTION' && data.messageId && data.emoji) {
            setMessages((prev) => toggleMessageReaction(prev, data.messageId, data.emoji));
          } else if (data && data.type === 'PIN_TOGGLE' && data.messageId) {
            setMessages((prev) => toggleMessagePin(prev, data.messageId));
          }
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const fresh = JSON.parse(event.newValue);
          if (Array.isArray(fresh)) {
            setMessages(fresh);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      broadcast?.close();
      window.removeEventListener('storage', handleStorage);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const broadcastEvent = useCallback((eventData: unknown) => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.postMessage(eventData);
        bc.close();
      } catch {
        // ignore
      }
    }
  }, []);

  const sendMessage = useCallback(
    (params: {
      text: string;
      channel?: ChatChannel;
      attachment?: { name: string; size: string; type: string };
    }) => {
      const channel = params.channel || activeChannel;
      const trimmed = params.text.trim();
      if (!trimmed && !params.attachment) return;

      const isOrg = userRole === 'organizer';
      const senderRole = isOrg
        ? 'Оргкомитет чемпионата'
        : userRole === 'mentor'
          ? 'Научный ментор'
          : team.members[0]?.role || 'Капитан';

      const senderName = isOrg
        ? 'Оргкомитет «МИРОВИЗОР»'
        : userRole === 'mentor'
          ? team.mentorName
          : team.members[0]?.name || 'Участник команды';

      const newMsg = createChatMessage({
        teamId: team.id,
        channel,
        senderId: isOrg ? 'org_hq' : team.members[0]?.id || 'user_active',
        senderName,
        senderRole,
        text: trimmed,
        userRole,
        isOrganizer: isOrg,
        attachment: params.attachment,
      });

      setMessages((prev) => addMessageSafely(prev, newMsg));
      broadcastEvent({ type: 'NEW_MESSAGE', message: newMsg });

      if (onActivityLog) {
        const channelName =
          channel === 'team'
            ? 'Чат команды'
            : channel === 'organizers'
              ? 'Связь с Оргкомитетом'
              : 'Объявления';
        onActivityLog(
          `Сообщение в ${channelName}`,
          trimmed.length > 50 ? `${trimmed.substring(0, 48)}...` : trimmed,
        );
      }

      // If a participant asks organizers, simulate a realistic Mission Control response
      if (channel === 'organizers' && userRole !== 'organizer') {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          const autoResp = generateOrganizerResponse(team.name, trimmed);
          setMessages((prev) => addMessageSafely(prev, autoResp));
          broadcastEvent({ type: 'NEW_MESSAGE', message: autoResp });
        }, 1200);
      }
    },
    [activeChannel, userRole, team, broadcastEvent, onActivityLog],
  );

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      setMessages((prev) => toggleMessageReaction(prev, messageId, emoji));
      broadcastEvent({ type: 'REACTION', messageId, emoji });
    },
    [broadcastEvent],
  );

  const togglePin = useCallback(
    (messageId: string) => {
      setMessages((prev) => toggleMessagePin(prev, messageId));
      broadcastEvent({ type: 'PIN_TOGGLE', messageId });
    },
    [broadcastEvent],
  );

  return {
    messages,
    activeChannel,
    setActiveChannel,
    sendMessage,
    addReaction,
    togglePin,
    isTyping,
  };
}
