// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from '@/src/shared/lib/storageService';
import type { AppState } from '@/src/shared/lib/storageService';

describe('storageService (offline queue + room tokens)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
  });

  it('returns a default state on a fresh profile', () => {
    const state: AppState = storageService.getInitialState();
    expect(state.roomSyncCode).toBe('KOSMO-742');
    expect(state.pendingSyncCount).toBe(0);
  });

  it('queues a failed push and reports pending count', async () => {
    const state = storageService.getInitialState();
    const ok = await storageService.pushToCloud(state);
    expect(ok).toBe(false);
    expect(storageService.getPendingSyncCount()).toBe(1);
  });

  it('stores and reads room tokens', () => {
    storageService.saveRoomToken('KOSMO-999', '0123456789abcdef0123456789abcdef');
    expect(storageService.getRoomToken('KOSMO-999')).toBe('0123456789abcdef0123456789abcdef');
    expect(storageService.getRoomToken('OTHER')).toBeUndefined();
  });

  it('returns null from pullFromCloud without a token', async () => {
    const result = await storageService.pullFromCloud('KOSMO-999');
    expect(result).toBeNull();
  });
});
