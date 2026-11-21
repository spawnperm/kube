import { describe, expect, it } from 'vitest';
import {
  addMessageSafely,
  createChatMessage,
  filterMessages,
  generateOrganizerResponse,
  toggleMessagePin,
  toggleMessageReaction,
} from './chat';
import { ChatMessage } from '../types';

describe('chat domain logic', () => {
  it('creates chat message with proper metadata', () => {
    const msg = createChatMessage({
      teamId: 'team_orion_3',
      channel: 'team',
      senderId: 'mem_1',
      senderName: 'Артём',
      senderRole: 'Капитан',
      text: 'Тестовый вопрос',
    });

    expect(msg.id).toMatch(/^chat_/);
    expect(msg.channel).toBe('team');
    expect(msg.text).toBe('Тестовый вопрос');
    expect(msg.isOrganizer).toBe(false);
  });

  it('safely adds messages without duplicates', () => {
    const existing: ChatMessage = {
      id: 'chat_1',
      teamId: 'team_1',
      channel: 'team',
      senderId: 's1',
      senderName: 'User',
      senderRole: 'Капитан',
      text: 'Привет',
      timestamp: '12:00',
      createdAtIso: new Date().toISOString(),
    };

    const list1 = addMessageSafely([existing], existing);
    expect(list1).toHaveLength(1);

    const newMsg: ChatMessage = {
      ...existing,
      id: 'chat_2',
      text: 'Второе сообщение',
    };
    const list2 = addMessageSafely([existing], newMsg);
    expect(list2).toHaveLength(2);
  });

  it('increments reactions correctly', () => {
    const msg: ChatMessage = {
      id: 'chat_1',
      teamId: 'team_1',
      channel: 'team',
      senderId: 's1',
      senderName: 'User',
      senderRole: 'Капитан',
      text: 'Запуск',
      timestamp: '12:00',
      createdAtIso: new Date().toISOString(),
      reactions: { '🚀': 1 },
    };

    const updated = toggleMessageReaction([msg], 'chat_1', '🚀');
    expect(updated[0].reactions?.['🚀']).toBe(2);

    const updated2 = toggleMessageReaction(updated, 'chat_1', '🔥');
    expect(updated2[0].reactions?.['🔥']).toBe(1);
  });

  it('toggles pin status', () => {
    const msg: ChatMessage = {
      id: 'chat_1',
      teamId: 'team_1',
      channel: 'organizers',
      senderId: 's1',
      senderName: 'User',
      senderRole: 'Оргкомитет',
      text: 'Важное объявление',
      timestamp: '12:00',
      createdAtIso: new Date().toISOString(),
      isPinned: false,
    };

    const pinned = toggleMessagePin([msg], 'chat_1');
    expect(pinned[0].isPinned).toBe(true);

    const unpinned = toggleMessagePin(pinned, 'chat_1');
    expect(unpinned[0].isPinned).toBe(false);
  });

  it('filters messages by channel and search query', () => {
    const msgs: ChatMessage[] = [
      {
        id: '1',
        teamId: 'team_1',
        channel: 'team',
        senderId: 's1',
        senderName: 'Баллистик',
        senderRole: 'Баллистик',
        text: 'Кеплеровы элементы рассчитаны',
        timestamp: '12:00',
        createdAtIso: new Date().toISOString(),
      },
      {
        id: '2',
        teamId: 'team_1',
        channel: 'organizers',
        senderId: 's2',
        senderName: 'Орг',
        senderRole: 'Оргкомитет',
        text: 'Регламент пуска обновлен',
        timestamp: '12:00',
        createdAtIso: new Date().toISOString(),
      },
    ];

    const teamFiltered = filterMessages(msgs, 'team_1', 'team');
    expect(teamFiltered).toHaveLength(1);
    expect(teamFiltered[0].id).toBe('1');

    const searchFiltered = filterMessages(msgs, 'team_1', 'team', 'кеплер');
    expect(searchFiltered).toHaveLength(1);

    const noMatch = filterMessages(msgs, 'team_1', 'team', 'радиолиния');
    expect(noMatch).toHaveLength(0);
  });

  it('generates organizer response with technical advice', () => {
    const resp = generateOrganizerResponse('Орион-3', 'какие допустимы антенны и габариты?');
    expect(resp.isOrganizer).toBe(true);
    expect(resp.senderRole).toBe('Дежурный инженер ЦУП');
    expect(resp.text).toContain('100×100×340.5 мм');
  });
});
