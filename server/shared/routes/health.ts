import { Router } from 'express';
import os from 'os';
import { syncStore } from '../../contexts/sync/syncStore';
import { config } from '../../config';
import { getActiveWsConnectionsCount } from '../../contexts/ai/live.ws';

export function healthRouter(): Router {
  const router = Router();

  router.get('/api/health', (_req, res) => {
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedSystemMem = totalMem - freeMem;
    const activeWs = getActiveWsConnectionsCount();

    // CPU calculation from os.loadavg & os.cpus()
    const cpus = os.cpus();
    const cores = cpus.length || 1;
    const loadAvg = os.loadavg();
    // 1-minute load relative to total core count expressed as approximate percentage
    const cpuPercent = Number(
      Math.min(100, Math.max(0.5, ((loadAvg[0] || 0.1) / cores) * 100)).toFixed(1),
    );

    res.json({
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      activeRooms: syncStore.size(),
      geminiEnabled: Boolean(config.geminiApiKey),
      nodeEnv: config.nodeEnv,
      // Comprehensive server resource telemetry
      resources: {
        cpu: {
          cores,
          model: cpus[0]?.model || 'Generic CPU',
          loadAvg,
          percentUsed: cpuPercent,
        },
        ram: {
          heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
          heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
          rssMb: Number((mem.rss / 1024 / 1024).toFixed(2)),
          externalMb: Number((mem.external / 1024 / 1024).toFixed(2)),
          systemTotalMb: Math.round(totalMem / 1024 / 1024),
          systemFreeMb: Math.round(freeMem / 1024 / 1024),
          systemUsedMb: Math.round(usedSystemMem / 1024 / 1024),
          systemPercentUsed: Math.round((usedSystemMem / totalMem) * 100),
          percentHeapUsed: Math.round((mem.heapUsed / mem.heapTotal) * 100),
        },
        websocket: {
          activeConnections: activeWs,
          status: 'LISTENING',
          port: config.port || 3000,
          protocol: 'WSS / WS',
          path: '/api/live',
        },
      },
    });
  });

  return router;
}
