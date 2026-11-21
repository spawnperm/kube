import { Team, UserProfile, CaseTask, PhotoItem, DailyQuest } from '@/src/shared/types';
import { INITIAL_TEAM, INITIAL_USER, CASE_TASKS, DAILY_QUESTS } from '@/src/shared/data/mockData';

const STORAGE_KEY = 'kosmoport_portal_state_v1';
const SYNC_CHANNEL_NAME = 'kosmoport_cross_device_sync';
const ROOM_TOKEN_PREFIX = 'kosmoport_room_token_';
const PENDING_SYNC_KEY = 'kosmoport_pending_sync_v1';

export interface AppState {
  user: UserProfile;
  team: Team;
  tasks: CaseTask[];
  dailyQuests: DailyQuest[];
  photos: PhotoItem[];
  isOnline: boolean;
  offlineModeForced: boolean;
  roomSyncCode: string;
  lastSyncedTimestamp: number;
  pendingSyncCount: number;
}

interface QueuedSync {
  roomCode: string;
  token?: string;
  state: { user: UserProfile; team: Team; dailyQuests: DailyQuest[] };
  updatedAt: number;
}

const createDefaultPhotos = (): PhotoItem[] => [
  {
    id: 'ph-1',
    teamId: 'team-vostok-1',
    teamName: 'Восток-1',
    uploaderName: 'Алексей Смирнов',
    uploaderRole: 'mentor',
    url: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=800&q=80',
    caption: 'Сборка инженерного макета CubeSat 3U в лаборатории лицея',
    takenAt: '2026-10-12 15:30',
    status: 'published',
  },
  {
    id: 'ph-2',
    uploaderName: 'Оргкомитет Космопорта',
    uploaderRole: 'organizer',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    caption: 'Главный зал Космопорта и стенд вибродинамических испытаний',
    takenAt: '2026-10-10 10:00',
    status: 'published',
  },
];

function defaultState(): AppState {
  return {
    user: INITIAL_USER,
    team: INITIAL_TEAM,
    tasks: CASE_TASKS,
    dailyQuests: DAILY_QUESTS,
    photos: createDefaultPhotos(),
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    offlineModeForced: false,
    roomSyncCode: 'KOSMO-742',
    lastSyncedTimestamp: Date.now(),
    pendingSyncCount: 0,
  };
}

class StorageService {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: ((state: AppState) => void)[] = [];
  private queue: QueuedSync[] = [];
  private queueLoaded = false;

  constructor() {
    this.loadQueue();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'STATE_UPDATED') {
          const freshState = this.getInitialState();
          this.notifyListeners(freshState);
        }
      };
      window.addEventListener('online', () => {
        this.flushQueue();
      });
    }
  }

  // ---- Room tokens (protect cross-device sync) ----

  public getRoomToken(roomCode: string): string | undefined {
    if (typeof window === 'undefined') return undefined;
    return window.localStorage.getItem(`${ROOM_TOKEN_PREFIX}${roomCode}`) || undefined;
  }

  public saveRoomToken(roomCode: string, token: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`${ROOM_TOKEN_PREFIX}${roomCode}`, token);
  }

  // ---- Offline sync queue ----

  private loadQueue() {
    if (this.queueLoaded || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(PENDING_SYNC_KEY);
      if (raw) {
        this.queue = JSON.parse(raw);
      }
    } catch {
      this.queue = [];
    }
    this.queueLoaded = true;
  }

  private persistQueue() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(this.queue));
    } catch {
      /* ignore quota errors */
    }
    this.notifyPendingChange();
  }

  public getPendingSyncCount(): number {
    return this.queue.length;
  }

  private notifyPendingChange() {
    const count = this.queue.length;
    if (typeof window === 'undefined' || this.listeners.length === 0) return;
    // Push the updated count through the state subscribers.
    const current = this.getInitialState();
    this.notifyListeners({ ...current, pendingSyncCount: count });
  }

  public async flushQueue(): Promise<void> {
    if (typeof navigator === 'undefined' || navigator.onLine === false || this.queue.length === 0)
      return;
    const snapshot = [...this.queue];
    this.queue = [];
    this.persistQueue();

    for (const item of snapshot) {
      const ok = await this.pushQueuedItem(item);
      if (!ok) {
        this.queue.push(item);
      }
    }
    this.persistQueue();
  }

  private async pushQueuedItem(item: QueuedSync): Promise<boolean> {
    try {
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: item.roomCode,
          token: item.token,
          state: item.state,
          updatedAt: item.updatedAt,
        }),
      });
      return res.status === 200 || res.status === 201;
    } catch {
      return false;
    }
  }

  // ---- State ----

  public getInitialState(): AppState {
    if (typeof window === 'undefined') {
      return defaultState();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Default entry as Administrator Alexander Anatolyevich Smirnov (Mirovisor)
        const isMirovisorAdmin =
          parsed.user?.email === 'info@mirovisor.com' || parsed.user?.id === 'usr-admin-smirnov';
        const activeUser = isMirovisorAdmin
          ? {
              ...INITIAL_USER,
              ...parsed.user,
              socialPosts: parsed.user?.socialPosts || INITIAL_USER.socialPosts || [],
            }
          : INITIAL_USER;

        return {
          ...parsed,
          user: activeUser,
          team: {
            ...INITIAL_TEAM,
            ...parsed.team,
          },
          isOnline: navigator.onLine && !parsed.offlineModeForced,
          pendingSyncCount: this.queue.length,
        };
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }

    const state = defaultState();
    state.pendingSyncCount = this.queue.length;
    this.saveState(state);
    return state;
  }

  public loadState(): AppState {
    return this.getInitialState();
  }

  public saveState(state: AppState) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...state, pendingSyncCount: this.queue.length }),
      );
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'STATE_UPDATED', timestamp: Date.now() });
      }
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }

  public resetToFactoryState(): AppState {
    const fresh = defaultState();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PENDING_SYNC_KEY);
      } catch {
        // ignore
      }
    }
    this.saveState(fresh);
    return fresh;
  }

  public subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(state: AppState) {
    this.listeners.forEach((l) => l(state));
  }

  // Push state to remote backend for cross-device sync
  public async pushToCloud(state: AppState): Promise<boolean> {
    const roomCode = state.roomSyncCode;
    if (typeof navigator === 'undefined' || navigator.onLine === false || state.offlineModeForced) {
      this.enqueue(state, roomCode);
      return false;
    }

    try {
      const token = this.getRoomToken(roomCode);
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          token,
          state: {
            user: state.user,
            team: state.team,
            dailyQuests: state.dailyQuests,
          },
          updatedAt: Date.now(),
        }),
      });

      if (res.status === 201) {
        const data = await res.json();
        if (data.token) {
          this.saveRoomToken(roomCode, data.token);
        }
        return true;
      }
      if (res.status === 200) {
        return true;
      }
      // 401 (bad token) and 409 (conflict) surface to the caller as failures.
      return false;
    } catch (e) {
      console.warn('Cloud sync failed, queued for retry:', e);
      this.enqueue(state, roomCode);
      return false;
    }
  }

  private enqueue(state: AppState, roomCode: string) {
    this.queue.push({
      roomCode,
      token: this.getRoomToken(roomCode),
      state: {
        user: state.user,
        team: state.team,
        dailyQuests: state.dailyQuests,
      },
      updatedAt: Date.now(),
    });
    this.persistQueue();
  }

  // Pull state from remote backend for cross-device sync
  public async pullFromCloud(roomCode: string): Promise<Partial<AppState> | null> {
    const token = this.getRoomToken(roomCode);
    if (!token) {
      return null;
    }
    try {
      const res = await fetch(`/api/sync/pull/${encodeURIComponent(roomCode)}`, {
        headers: { 'X-Room-Token': token },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.synced && data.state) {
        return data.state as Partial<AppState>;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

export const storageService = new StorageService();
