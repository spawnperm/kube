import { Router } from 'express';

export function calendarRouter(): Router {
  const router = Router();

  router.get('/api/calendar.ics', (_req, res) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//КОСМОПОРТ//Physics Championship//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:КОСМОПОРТ 2026 — График чемпионата',
      'X-WR-TIMEZONE:Europe/Moscow',

      'BEGIN:VEVENT',
      'UID:kosmoport-reg-deadline@kosmoport.space',
      `DTSTAMP:${year}${month}01T000000Z`,
      `DTSTART:${year}${month}10T090000Z`,
      `DTEND:${year}${month}10T180000Z`,
      'SUMMARY:КОСМОПОРТ: Окончание регистрации и выбор кейса',
      'DESCRIPTION:Дедлайн регистрации наставников и команд, фиксация выбранной космической задачи и прохождение разминочного квиза.',
      'STATUS:CONFIRMED',
      'END:VEVENT',

      'BEGIN:VEVENT',
      'UID:kosmoport-submission-deadline@kosmoport.space',
      `DTSTAMP:${year}${month}01T000000Z`,
      `DTSTART:${year}${month}18T150000Z`,
      `DTEND:${year}${month}18T210000Z`,
      'SUMMARY:КОСМОПОРТ: Дедлайн сдачи 3-х слайдов и расчетной записки',
      'DESCRIPTION:Загрузка финальной версии 3-х слайдов проекта CubeSat в систему для экспертной оценки.',
      'STATUS:CONFIRMED',
      'END:VEVENT',

      'BEGIN:VEVENT',
      'UID:kosmoport-pitch-day@kosmoport.space',
      `DTSTAMP:${year}${month}01T000000Z`,
      `DTSTART:${year}${month}22T070000Z`,
      `DTEND:${year}${month}22T140000Z`,
      'SUMMARY:КОСМОПОРТ: Защита проектов перед жюри и награждение',
      'DESCRIPTION:Очные/онлайн питчи команд (3 минуты на защиту под таймер) перед экспертной комиссией, объявление победителей!',
      'LOCATION:Главный лекторий Космопорта / Онлайн-трансляция',
      'STATUS:CONFIRMED',
      'END:VEVENT',

      'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="kosmoport-schedule.ics"');
    return res.send(icsContent);
  });

  return router;
}
