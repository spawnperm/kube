import { Router } from 'express';
import { logger } from '../../logger';

export type EventStageId = 'start_ships' | 'prep_blueprints' | 'defense_pitch';

export interface EventStageState {
  currentStage: EventStageId;
  presentingTeamId: string;
  activeSlideIndex: number; // 0, 1, 2
  orbitSpeed: number;
  orbitViewMode: 'global' | 'follow' | 'ground';
  focusedSubsystem: string;
  timer: {
    totalSeconds: number;
    remainingSeconds: number;
    isRunning: boolean;
    mode: 'pitch' | 'qa' | 'paused';
  };
  announcement: string;
  tickerText: string;
  updatedAt: number;
  updatedBy: string;
}

// In-memory persistent state across requests
let currentEventStage: EventStageState = {
  currentStage: 'start_ships',
  presentingTeamId: 'team-perm-01',
  activeSlideIndex: 0,
  orbitSpeed: 1,
  orbitViewMode: 'global',
  focusedSubsystem: 'EPS',
  timer: {
    totalSeconds: 300,
    remainingSeconds: 300,
    isRunning: false,
    mode: 'pitch',
  },
  announcement:
    'Кейс-чемпионат по прикладной физике «Космос-просто» и проектированию CubeSat 3U открыт!',
  tickerText:
    '★ ЦУП КОСМОПОРТ: 10 школьных наноспутников CubeSat 3U на орбите ★ Радиолиния СОНИКС 437.425 МГц ★',
  updatedAt: Date.now(),
  updatedBy: 'Главный координатор (Администратор)',
};

// Event listeners for SSE
const sseClients: Set<(data: EventStageState) => void> = new Set();

export function broadcastStageChange(newState: EventStageState) {
  currentEventStage = { ...newState, updatedAt: Date.now() };
  for (const client of sseClients) {
    try {
      client(currentEventStage);
    } catch (e) {
      logger.warn({ err: e }, 'Failed to send SSE stage update');
    }
  }
}

export function eventStageRouter(): Router {
  const router = Router();

  // GET current stage
  router.get('/api/event/stage', (_req, res) => {
    res.json(currentEventStage);
  });

  // POST update stage
  router.post('/api/event/stage', (req, res) => {
    const update = req.body;
    if (!update || typeof update !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    currentEventStage = {
      ...currentEventStage,
      ...update,
      timer: {
        ...currentEventStage.timer,
        ...(update.timer || {}),
      },
      updatedAt: Date.now(),
      updatedBy: update.updatedBy || 'Администратор портала',
    };

    broadcastStageChange(currentEventStage);
    logger.info({ stage: currentEventStage.currentStage }, 'Admin changed live event stage');

    return res.json({ success: true, stageState: currentEventStage });
  });

  // POST timer control
  router.post('/api/event/timer', (req, res) => {
    const { action, remainingSeconds, totalSeconds, mode } = req.body;

    if (action === 'start') {
      currentEventStage.timer.isRunning = true;
    } else if (action === 'pause') {
      currentEventStage.timer.isRunning = false;
    } else if (action === 'reset') {
      currentEventStage.timer.isRunning = false;
      currentEventStage.timer.remainingSeconds =
        totalSeconds || currentEventStage.timer.totalSeconds;
    } else if (action === 'tick' && typeof remainingSeconds === 'number') {
      currentEventStage.timer.remainingSeconds = remainingSeconds;
    }

    if (mode) currentEventStage.timer.mode = mode;
    if (typeof totalSeconds === 'number') currentEventStage.timer.totalSeconds = totalSeconds;

    currentEventStage.updatedAt = Date.now();
    broadcastStageChange(currentEventStage);

    return res.json({ success: true, timer: currentEventStage.timer });
  });

  // SSE stream for real-time updates to all guest clients and displays
  router.get('/api/event/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial state immediately
    res.write(`data: ${JSON.stringify(currentEventStage)}\n\n`);

    const listener = (state: EventStageState) => {
      res.write(`data: ${JSON.stringify(state)}\n\n`);
    };

    sseClients.add(listener);

    req.on('close', () => {
      sseClients.delete(listener);
    });
  });

  return router;
}
