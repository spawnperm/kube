import helmet from 'helmet';
import cors from 'cors';
import { config } from '../../config';

const productionCsp = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
    connectSrc: ["'self'", 'wss:'],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    frameAncestors: ["'self'"],
  },
};

export const securityMiddleware = [
  // CSP and frameguard are adjusted so the app can run inside AI Studio preview iframe.
  helmet({
    frameguard: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
    originAgentCluster: false,
    hsts: false,
  }),
  cors({
    origin(origin, callback) {
      // Empty whitelist = same-origin/dev usage, allow all.
      if (!origin || config.corsOrigins.length === 0) {
        return callback(null, true);
      }
      if (config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
];
