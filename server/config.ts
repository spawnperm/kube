import 'dotenv/config';
import crypto from 'crypto';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  appUrl: string;
  geminiApiKey: string;
  geminiModel: string;
  geminiTimeoutMs: number;
  geminiMaxRetries: number;
  corsOrigins: string[];
  bodyLimit: string;
  syncTokenSecret: string;
}

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: 3000,
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  geminiModel: (process.env.GEMINI_MODEL || '').trim() || 'gemini-3.8-flash',
  geminiTimeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 12_000,
  geminiMaxRetries: Number(process.env.GEMINI_MAX_RETRIES) || 1,
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  bodyLimit: process.env.BODY_LIMIT || '2mb',
  syncTokenSecret: process.env.SYNC_TOKEN_SECRET || crypto.randomBytes(32).toString('hex'),
};

export function geminiEnabled(): boolean {
  return config.geminiApiKey.length > 0;
}
