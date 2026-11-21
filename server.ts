import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ViteDevServer } from 'vite';
import { createApp } from './server/app';
import { config } from './server/config';
import { logger } from './server/logger';
import { setupLiveWebSocket } from './server/contexts/ai/live.ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApp();

  const { createServer: createViteServer } = await import('vite');
  const vite: ViteDevServer = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  const server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`КОСМОПОРТ Server running on http://0.0.0.0:${config.port}`);
  });

  const wss = setupLiveWebSocket(server);

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully');
    wss.close();
    server.close(async () => {
      try {
        await vite.close();
      } catch (err) {
        logger.warn({ err }, 'Error closing Vite server');
      }
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
}

startServer();
