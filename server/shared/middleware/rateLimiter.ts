import rateLimit from 'express-rate-limit';

const base = {
  standardHeaders: true as const,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Попробуйте через минуту.' },
};

export const aiRateLimit = rateLimit({
  ...base,
  windowMs: 60_000,
  limit: 30,
});

export const crmRateLimit = rateLimit({
  ...base,
  windowMs: 60_000,
  limit: 30,
});

export const syncRateLimit = rateLimit({
  ...base,
  windowMs: 60_000,
  limit: 120,
});
