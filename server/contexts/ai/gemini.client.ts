import { GoogleGenAI } from '@google/genai';
import { config, geminiEnabled } from '../../config';
import { logger } from '../../logger';

let aiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function isRetryableError(err: unknown): boolean {
  const e = err as { code?: number | string; status?: string; message?: string };
  const code = String(e?.code ?? '');
  const status = String(e?.status ?? '');
  const message = String(e?.message ?? '');
  return (
    code === '503' ||
    status === 'UNAVAILABLE' ||
    status === 'RESOURCE_EXHAUSTED' ||
    message.includes('high demand') ||
    message.includes('timed out') ||
    message.includes('ECONNRESET') ||
    message.includes('503') ||
    message.includes('429')
  );
}

export interface ChatWithGeminiOptions {
  message: string;
  systemInstruction: string;
  temperature?: number;
}

/**
 * Calls the Gemini API with a hard timeout and exponential backoff retries.
 * Throws when all retries are exhausted; callers must handle the error and fall back.
 */
export async function chatWithGemini(
  opts: ChatWithGeminiOptions,
  retriesLeft = config.geminiMaxRetries,
): Promise<string> {
  if (!geminiEnabled()) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const attempt = async (): Promise<string> => {
    const response = await withTimeout(
      getClient().models.generateContent({
        model: config.geminiModel,
        contents: opts.message,
        config: {
          systemInstruction: opts.systemInstruction,
          temperature: opts.temperature ?? 0.7,
        },
      }),
      config.geminiTimeoutMs,
    );
    return response.text || 'Ответ сформирован.';
  };

  try {
    return await attempt();
  } catch (err) {
    if (retriesLeft > 0 && isRetryableError(err)) {
      const delay =
        Math.min(200 * 2 ** (config.geminiMaxRetries - retriesLeft + 1), 8_000) +
        Math.random() * 300;
      logger.warn(
        { err: err instanceof Error ? err.message : err, retriesLeft, delayMs: delay },
        'Gemini retry',
      );
      await sleep(delay);
      return chatWithGemini(opts, retriesLeft - 1);
    }
    throw err;
  }
}
