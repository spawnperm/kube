import express from 'express';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './logger';
import { securityMiddleware } from './shared/middleware/security';
import { healthRouter } from './shared/routes/health';
import { assistantRouter } from './contexts/ai/ai.router';
import { crmRouter } from './contexts/crm/crm.router';
import { syncRouter } from './contexts/sync/sync.router';
import { calendarRouter } from './contexts/championship/calendar.router';
import { eventStageRouter } from './contexts/event/eventStage.router';
import { adminRouter } from './contexts/admin/admin.router';

export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(securityMiddleware);
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => !req.url?.startsWith('/api'),
      },
    }),
  );
  app.use(express.json({ limit: config.bodyLimit }));

  app.use(healthRouter());
  app.use(assistantRouter());
  app.use(crmRouter());
  app.use(syncRouter());
  app.use(calendarRouter());
  app.use(eventStageRouter());
  app.use(adminRouter());

  return app;
}
