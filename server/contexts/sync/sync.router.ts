import { Router } from 'express';
import type { SyncState } from './syncStore';
import { syncStore } from './syncStore';
import { pushSyncSchema } from '../../shared/validation/schemas';
import { syncRateLimit } from '../../shared/middleware/rateLimiter';

export function syncRouter(): Router {
  const router = Router();

  router.post('/api/sync/push', syncRateLimit, (req, res) => {
    const parsed = pushSyncSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request' });
    }
    const { roomCode, token, state, updatedAt = Date.now() } = parsed.data;
    const data: SyncState = {
      user: state.user as SyncState['user'],
      team: state.team as SyncState['team'],
      dailyQuests: state.dailyQuests as SyncState['dailyQuests'],
    };

    const existing = syncStore.get(roomCode);
    if (!existing) {
      const room = syncStore.create(roomCode, data, updatedAt);
      return res.status(201).json({
        success: true,
        token: room.token,
        version: room.version,
        updatedAt: room.updatedAt,
      });
    }

    const updated = syncStore.update(roomCode, token || '', data, updatedAt);
    if (!updated) {
      const verified = syncStore.verify(roomCode, token);
      if (!verified) {
        return res.status(401).json({ error: 'Unauthorized: invalid room token' });
      }
      return res.status(409).json({
        error: 'Conflict: local state is older than remote',
        version: verified.version,
        updatedAt: verified.updatedAt,
      });
    }

    return res.json({ success: true, version: updated.version, updatedAt: updated.updatedAt });
  });

  router.get('/api/sync/pull/:roomCode', syncRateLimit, (req, res) => {
    const roomCode = Array.isArray(req.params.roomCode)
      ? req.params.roomCode[0]
      : req.params.roomCode;
    const token =
      typeof req.headers['x-room-token'] === 'string' ? req.headers['x-room-token'] : undefined;

    const room = syncStore.verify(roomCode, token);
    if (!room) {
      return res
        .status(401)
        .json({ synced: false, state: null, error: 'Room not found or invalid token' });
    }

    return res.json({
      synced: true,
      state: room.data,
      updatedAt: room.updatedAt,
      version: room.version,
    });
  });

  return router;
}
