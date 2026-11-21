import { Router } from 'express';
import { chatWithGemini } from '../ai/gemini.client';
import { aiMatchSchema, aiAuditSchema } from '../../shared/validation/schemas';
import { crmRateLimit } from '../../shared/middleware/rateLimiter';
import { config } from '../../config';
import { logger } from '../../logger';

export function crmRouter(): Router {
  const router = Router();

  router.post('/api/crm/ai-match', crmRateLimit, async (req, res) => {
    const parsed = aiMatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Query is required' });
    }
    const { query } = parsed.data;

    if (config.geminiApiKey) {
      try {
        const text = await chatWithGemini({
          message: `Пользователь вводит в форму регистрации космического корабля чемпионата «КОСМОПОРТ» запрос: "${query}".
Задача: сопоставить запрос со школьными командами г. Перми. Выдай краткую рекомендацию (1-2 предложения) по распределению ролей физика, химика и биолога в экипаже под космический кубсат.`,
          systemInstruction: '',
          temperature: 0.3,
        });
        if (text) {
          return res.json({ matchFound: true, aiGenText: text, source: 'gemini-ai' });
        }
      } catch (err) {
        logger.warn(
          { err: err instanceof Error ? err.message : err },
          'Gemini AI match note generation skipped',
        );
      }
    }

    return res.json({ matchFound: true, source: 'crm-catalog' });
  });

  router.post('/api/crm/ai-audit', crmRateLimit, async (req, res) => {
    const parsed = aiAuditSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    const { teamData, query } = parsed.data;

    if (config.geminiApiKey) {
      try {
        const text = await chatWithGemini({
          message: `Ты — эксперт-валидатор заявок космического чемпионата «КОСМОПОРТ» (г. Пермь, МАОУ ДПО «ЦРСО»).
Проанализируй заявку школьной команды на космический корабль / кубсат на предмет конфликтов и неполноты по регламенту:
1. Капитан (педагог): наличие email и назначенного пароля
2. Состав экипажа: ровно 3 школьника со строгим разделением ролей (Физик, Химик, Биолог)
3. Привязка к утвержденной космической задаче
4. Уникальность позывного корабля и формата CubeSat (3U)

Данные:
${JSON.stringify(teamData || query)}

Сформулируй краткий структурированный вердикт (2-3 предложения): выяви замечания (неполнота/конфликт) или подтверди готовность к старту.`,
          systemInstruction: '',
          temperature: 0.2,
        });
        if (text) {
          return res.json({ success: true, aiVerdict: text, source: 'gemini-ai' });
        }
      } catch (err) {
        logger.warn(
          { err: err instanceof Error ? err.message : err },
          'Gemini AI audit generation error',
        );
      }
    }

    return res.json({ success: true, source: 'local-audit' });
  });

  return router;
}
