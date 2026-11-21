import { ChatChannel, ChatMessage, UserRole } from '../types';
import { createId } from '../utils/id';

/**
 * Creates a new ChatMessage with proper defaults.
 */
export function createChatMessage(params: {
  teamId: string;
  channel: ChatChannel;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  userRole?: UserRole;
  isOrganizer?: boolean;
  attachment?: {
    name: string;
    size: string;
    type: string;
  };
}): ChatMessage {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const isOrganizer = params.isOrganizer ?? params.userRole === 'organizer';

  return {
    id: createId('chat'),
    teamId: params.teamId,
    channel: params.channel,
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole,
    text: params.text.trim(),
    timestamp: `Сегодня, ${timeStr}`,
    createdAtIso: now.toISOString(),
    isOrganizer,
    reactions: {},
    attachment: params.attachment,
  };
}

/**
 * Idempotent message addition (prevents duplicates).
 */
export function addMessageSafely(
  messages: ChatMessage[],
  incomingMessage: ChatMessage,
): ChatMessage[] {
  if (messages.some((m) => m.id === incomingMessage.id)) {
    return messages;
  }
  return [...messages, incomingMessage];
}

/**
 * Adds or increments an emoji reaction on a message.
 */
export function toggleMessageReaction(
  messages: ChatMessage[],
  messageId: string,
  emoji: string,
): ChatMessage[] {
  return messages.map((msg) => {
    if (msg.id !== messageId) return msg;

    const currentReactions = { ...(msg.reactions || {}) };
    const currentCount = currentReactions[emoji] || 0;
    currentReactions[emoji] = currentCount + 1;

    return {
      ...msg,
      reactions: currentReactions,
    };
  });
}

/**
 * Toggles the pinned status of a message.
 */
export function toggleMessagePin(messages: ChatMessage[], messageId: string): ChatMessage[] {
  return messages.map((msg) => {
    if (msg.id !== messageId) return msg;
    return {
      ...msg,
      isPinned: !msg.isPinned,
    };
  });
}

/**
 * Filters messages by channel and optional search keyword.
 */
export function filterMessages(
  messages: ChatMessage[],
  teamId: string,
  channel: ChatChannel,
  searchQuery?: string,
): ChatMessage[] {
  const normalizedQuery = searchQuery?.trim().toLowerCase();

  return messages.filter((msg) => {
    // Announcements are global; other channels are scoped to team or global organizers
    if (channel === 'announcements') {
      if (msg.channel !== 'announcements') return false;
    } else {
      if (msg.channel !== channel) return false;
      if (msg.teamId !== teamId && !msg.isOrganizer) return false;
    }

    if (!normalizedQuery) return true;

    return (
      msg.text.toLowerCase().includes(normalizedQuery) ||
      msg.senderName.toLowerCase().includes(normalizedQuery) ||
      msg.senderRole.toLowerCase().includes(normalizedQuery)
    );
  });
}

/**
 * Generates an automatic response from the Organizer/Mission Control
 * when a team asks a question in the 'organizers' channel (when current role is participant).
 */
export function generateOrganizerResponse(teamName: string, userQuestion: string): ChatMessage {
  const q = userQuestion.toLowerCase();
  let answer = `Принято в обработку ЦУП чемпионата! Дежурный инженер рассмотрит ваш запрос по проекту «${teamName}» и вернется с детальным заключением.`;

  if (q.includes('антенн') || q.includes('габарит') || q.includes('размер')) {
    answer = `[Ответ ЦУП]: По стандарту CDS 3U Rev 14 любые выступающие элементы должны быть уложены в габарит 100×100×340.5 мм с зазором не менее 2 мм от стенок транспортно-пускового контейнера до момента выхода спутника.`;
  } else if (
    q.includes('частот') ||
    q.includes('радио') ||
    q.includes('маяк') ||
    q.includes('437')
  ) {
    answer = `[Ответ ЦУП]: Выделенный номинал частоты маяка — 437.425 МГц (AX.25 9600 GFSK). Доплеровский сдвиг для орбиты 525 км составляет до ±9.8 кГц. Убедитесь в наличии АПЧ в приёмном тракте.`;
  } else if (
    q.includes('аккумулятор') ||
    q.includes('dod') ||
    q.includes('питани') ||
    q.includes('энерг')
  ) {
    answer = `[Ответ ЦУП]: Рекомендуемая глубина разряда LiFePO4 аккумулятора DoD ≤ 25% на теневом участке (до 35 минут). Напряжение на шине питания не должно проседать ниже 6.4 В.`;
  } else if (
    q.includes('срок') ||
    q.includes('дедлайн') ||
    q.includes('сдач') ||
    q.includes('защит')
  ) {
    answer = `[Ответ ЦУП]: Финальный срок загрузки материалов 5 этапа — 15 июня 2026. Очная предпусковая защита состоится в онлайн-формате с прямой трансляцией на космодром «Восточный».`;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return {
    id: createId('chat_reply'),
    teamId: 'team_orion_3',
    channel: 'organizers',
    senderId: 'org_auto_officer',
    senderName: 'ЦУП / Оргкомитет «МИРОВИЗОР»',
    senderRole: 'Дежурный инженер ЦУП',
    text: answer,
    timestamp: `Сегодня, ${timeStr}`,
    createdAtIso: now.toISOString(),
    isOrganizer: true,
    reactions: { '🤝': 1 },
  };
}
