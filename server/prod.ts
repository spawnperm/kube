import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './app';
import { config } from './config';
import { logger } from './logger';
import { setupLiveWebSocket } from './contexts/ai/live.ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '..', 'dist');

const app = createApp();

// Service worker must not be cached immutably so PWA updates propagate.
app.get('/sw.js', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(distPath, 'sw.js'));
});

app.use(express.static(distPath, { maxAge: '1y', immutable: true, index: false }));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info(`КОСМОПОРТ Server running on http://0.0.0.0:${config.port}`);
});

const wss = setupLiveWebSocket(server);

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutting down gracefully');
  wss.close();
  server.close(() => {
    logger.info('Shutdown complete');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
