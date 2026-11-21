// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { SyncState } from './syncStore';
import { syncStore } from './syncStore';

const state = (xp: number): SyncState =>
  ({
    user: {
      id: 'u1',
      name: 'Тест',
      email: 't@t.ru',
      role: 'mentor',
      school: 'S',
      city: 'P',
      photoConsent: true,
      xp,
      level: 1,
      rankTitle: 'R',
      energyCrystals: 0,
      streakDays: 0,
      badges: [],
      socialPosts: [],
    },
  }) as SyncState;

describe('syncStore (room auth + versioning)', () => {
  it('creates a room and issues a token', () => {
    const room = syncStore.create('ROOM-1', state(1), 1000);
    expect(room.token.length).toBeGreaterThanOrEqual(32);
    expect(room.version).toBe(1);
  });

  it('rejects pull with a wrong token', () => {
    syncStore.create('ROOM-2', state(1), 1000);
    expect(syncStore.verify('ROOM-2', 'wrong-token')).toBeUndefined();
  });

  it('accepts pull with a valid token', () => {
    const room = syncStore.create('ROOM-3', state(1), 1000);
    const verified = syncStore.verify('ROOM-3', room.token);
    expect(verified).toBeDefined();
  });

  it('rejects stale updates (older timestamp)', () => {
    const room = syncStore.create('ROOM-4', state(1), 2000);
    const updated = syncStore.update('ROOM-4', room.token, state(2), 1000);
    expect(updated).toBeNull();
  });

  it('accepts newer updates and bumps version', () => {
    const room = syncStore.create('ROOM-5', state(1), 1000);
    const updated = syncStore.update('ROOM-5', room.token, state(5), 2000);
    expect(updated?.version).toBe(2);
    expect(updated?.data.user?.xp).toBe(5);
  });

  it('returns null for update with invalid token', () => {
    syncStore.create('ROOM-6', state(1), 1000);
    expect(syncStore.update('ROOM-6', 'bad', state(3), 3000)).toBeNull();
  });
});
