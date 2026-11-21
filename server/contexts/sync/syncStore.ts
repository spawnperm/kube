import crypto from 'crypto';
import type { AppState } from '../../../src/shared/lib/storageService';

export interface SyncState {
  user?: AppState['user'];
  team?: AppState['team'];
  dailyQuests?: AppState['dailyQuests'];
}

export interface SyncRoom {
  roomCode: string;
  token: string;
  version: number;
  updatedAt: number;
  data: SyncState;
}

function generateToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * In-memory room store.
 * Rooms are ephemeral (lost on restart) — acceptable for MVP, see README "Roadmap".
 * Conflict resolution: per-field last-write-wins using the `updatedAt` timestamp
 * reported by the client, with a monotonic `version` per room.
 */
class SyncStore {
  private rooms = new Map<string, SyncRoom>();

  size(): number {
    return this.rooms.size;
  }

  create(roomCode: string, data: SyncState, updatedAt: number): SyncRoom {
    const room: SyncRoom = {
      roomCode,
      token: generateToken(),
      version: 1,
      updatedAt,
      data,
    };
    this.rooms.set(roomCode, room);
    return room;
  }

  get(roomCode: string): SyncRoom | undefined {
    return this.rooms.get(roomCode);
  }

  verify(roomCode: string, token: string | undefined): SyncRoom | undefined {
    const room = this.rooms.get(roomCode);
    if (!room || !token || token !== room.token) {
      return undefined;
    }
    return room;
  }

  /**
   * Updates a room if the incoming payload is newer or equal to the stored one.
   * Returns the room after the update, or null when the payload is stale.
   */
  update(roomCode: string, token: string, data: SyncState, updatedAt: number): SyncRoom | null {
    const room = this.verify(roomCode, token);
    if (!room) {
      return null;
    }
    if (updatedAt < room.updatedAt) {
      return null;
    }
    room.data = {
      user: data.user ?? room.data.user,
      team: data.team ?? room.data.team,
      dailyQuests: data.dailyQuests ?? room.data.dailyQuests,
    };
    room.updatedAt = updatedAt;
    room.version += 1;
    return room;
  }
}

export const syncStore = new SyncStore();
