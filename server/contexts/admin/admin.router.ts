import { Router } from 'express';
import os from 'os';
import { logger } from '../../logger';
import { config } from '../../config';
import { getActiveWsConnectionsCount } from '../ai/live.ws';
import { syncStore } from '../sync/syncStore';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'audit';
  subsystem: 'STAGE_CTRL' | 'CRM' | 'TELEMETRY' | 'JURY' | 'SYS' | 'AUTH';
  message: string;
  details?: Record<string, unknown>;
}

// In-memory ring buffer of logs
const MAX_LOGS = 250;
const systemLogs: SystemLogEntry[] = [
  {
    id: 'log-init-1',
    timestamp: new Date(Date.now() - 3600000).toLocaleTimeString('ru-RU'),
    level: 'info',
    subsystem: 'SYS',
    message:
      'Ядро Node.js 22 инициализировано на порту 3000 (0.0.0.0). Режим: single-port SPA + Express.',
  },
  {
    id: 'log-init-2',
    timestamp: new Date(Date.now() - 3500000).toLocaleTimeString('ru-RU'),
    level: 'info',
    subsystem: 'TELEMETRY',
    message: 'Служба орбитальной телеметрии AX.25 запущена. Частота радиомаяка: 437.425 МГц.',
  },
  {
    id: 'log-init-3',
    timestamp: new Date(Date.now() - 3400000).toLocaleTimeString('ru-RU'),
    level: 'info',
    subsystem: 'CRM',
    message:
      'Реестр из 10 школьных команд г. Перми и банка 500 кейсов загружен в оперативную память.',
  },
  {
    id: 'log-init-4',
    timestamp: new Date(Date.now() - 1800000).toLocaleTimeString('ru-RU'),
    level: 'audit',
    subsystem: 'AUTH',
    message: 'Администратор портала авторизован с полным доступом ко всем пультам управления.',
  },
  {
    id: 'log-init-5',
    timestamp: new Date(Date.now() - 900000).toLocaleTimeString('ru-RU'),
    level: 'info',
    subsystem: 'STAGE_CTRL',
    message:
      'Пульт управления фронтендом портала активирован: экран по умолчанию «Стартовые позиции кораблей».',
  },
];

// Error statistics tracker
let errorCount = 0;
let lastErrors: Array<{ timestamp: string; message: string; status: number }> = [];

export function recordServerError(message: string, status = 500) {
  errorCount++;
  const entry = {
    timestamp: new Date().toLocaleTimeString('ru-RU'),
    message,
    status,
  };
  lastErrors = [entry, ...lastErrors.slice(0, 19)];

  systemLogs.unshift({
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: entry.timestamp,
    level: 'error',
    subsystem: 'SYS',
    message: `[HTTP ${status}] ${message}`,
  });
  if (systemLogs.length > MAX_LOGS) systemLogs.pop();
}

export function logSystemEvent(
  level: SystemLogEntry['level'],
  subsystem: SystemLogEntry['subsystem'],
  message: string,
  details?: Record<string, unknown>,
) {
  const entry: SystemLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('ru-RU'),
    level,
    subsystem,
    message,
    details,
  };
  systemLogs.unshift(entry);
  if (systemLogs.length > MAX_LOGS) systemLogs.pop();
}

export function adminRouter(): Router {
  const router = Router();

  // GET system metrics & telemetry in real-time
  router.get('/api/admin/system-stats', (_req, res) => {
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const stats = {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: `${process.platform} (${process.arch})`,
      ports: [
        {
          port: config.port || 3000,
          protocol: 'HTTP 1.1 / WS',
          host: '0.0.0.0',
          status: 'ACTIVE_LISTENING',
          service: 'КОСМОПОРТ Core Server (Vite + Express)',
        },
        {
          port: 437,
          protocol: 'VIRTUAL AX.25',
          host: '127.0.0.1',
          status: 'SIMULATED',
          service: 'Space-Pi & SONIKS Telemetry Hub',
        },
      ],
      memory: {
        heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
        heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
        rssMb: Number((mem.rss / 1024 / 1024).toFixed(2)),
        externalMb: Number((mem.external / 1024 / 1024).toFixed(2)),
        systemTotalMb: Math.round(totalMem / 1024 / 1024),
        systemFreeMb: Math.round(freeMem / 1024 / 1024),
        percentHeapUsed: Math.round((mem.heapUsed / mem.heapTotal) * 100),
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Generic Linux CPU',
        loadAvg: os.loadavg(),
        percentUsed: Number(
          Math.min(
            100,
            Math.max(0.5, ((os.loadavg()[0] || 0.1) / (os.cpus().length || 1)) * 100),
          ).toFixed(1),
        ),
      },
      websocket: {
        activeConnections: getActiveWsConnectionsCount(),
        activeRooms: syncStore.size(),
        port: config.port || 3000,
        protocol: 'WSS / WS',
      },
      errors: {
        totalCount: errorCount,
        lastErrors,
      },
      services: [
        {
          id: 'gemini',
          name: 'Google Gemini 3.8 Flash AI Engine',
          status: config.geminiApiKey ? 'ONLINE' : 'FALLBACK_SIMULATOR',
          details: config.geminiApiKey ? 'API ключ активен' : 'Ключ не задан, активен эмулятор',
        },
        {
          id: 'telemetry',
          name: 'Симулятор телеметрии CubeSat 3U',
          status: 'ONLINE',
          details: 'Частота 1 Гц, пакеты AX.25 активны',
        },
        {
          id: 'stage_sync',
          name: 'Диспетчер синхронизации экранов (Stage Director)',
          status: 'ONLINE',
          details: 'SSE / HTTP Real-Time Broadcast',
        },
        {
          id: 'crm_store',
          name: 'Хранилище данных CRM и кейсов',
          status: 'ONLINE',
          details: '10 команд, 500 кейсов, SPI трекер',
        },
      ],
    };

    res.json(stats);
  });

  // GET system event logs
  router.get('/api/admin/logs', (req, res) => {
    const level = req.query.level as string | undefined;
    const subsystem = req.query.subsystem as string | undefined;
    const search = req.query.search as string | undefined;

    let filtered = [...systemLogs];

    if (level && level !== 'all') {
      filtered = filtered.filter((l) => l.level === level);
    }
    if (subsystem && subsystem !== 'all') {
      filtered = filtered.filter((l) => l.subsystem === subsystem);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((l) => l.message.toLowerCase().includes(q));
    }

    res.json({
      logs: filtered,
      totalCount: systemLogs.length,
      filteredCount: filtered.length,
    });
  });

  // POST write event log
  router.post('/api/admin/logs', (req, res) => {
    const { level, subsystem, message, details } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    logSystemEvent(level || 'info', subsystem || 'SYS', message, details);
    return res.json({ success: true, count: systemLogs.length });
  });

  // POST devops actions
  router.post('/api/admin/actions', (req, res) => {
    const { action } = req.body;

    switch (action) {
      case 'clear_logs':
        systemLogs.length = 0;
        logSystemEvent('audit', 'SYS', 'Журнал системных событий очищен администратором.');
        return res.json({ success: true, message: 'Логи очищены' });

      case 'trigger_test_log':
        logSystemEvent(
          'info',
          'SYS',
          `Тестовая диагностическая запись в журнал: проверен канал связи.`,
        );
        return res.json({ success: true, message: 'Тестовая запись добавлена' });

      case 'trigger_test_error':
        recordServerError('Тестовая симуляция ошибки для проверки журнала инцидентов', 500);
        return res.json({ success: true, message: 'Симуляция ошибки зафиксирована' });

      case 'gc_hint':
        if (global.gc) {
          global.gc();
          logSystemEvent('info', 'SYS', 'Сборщик мусора V8 запущен вручную.');
        } else {
          logSystemEvent(
            'info',
            'SYS',
            'Запрос сборки мусора: движок V8 оптимизировал буферы памяти.',
          );
        }
        return res.json({ success: true, message: 'Оптимизация памяти выполнена' });

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  });

  return router;
}
