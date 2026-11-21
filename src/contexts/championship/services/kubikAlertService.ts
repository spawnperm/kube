/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Сервис управления этапами кейс-чемпионата «КОСМОПОРТ» и автоматической
 * синхронизации дедлайнов с системой оповещений Бортового компьютера «Леший».
 */

import {
  CrmChampionshipStage,
  KubikDeadlineAlert,
  CrmNotificationEmail,
} from '@/src/shared/types/index';
import { audioService } from '@/src/shared/lib/audioService';

const STAGES_STORAGE_KEY = 'crm_championship_stages_v2';
const ALERTS_STORAGE_KEY = 'kubik_deadline_alerts_v2';
const CONFIG_STORAGE_KEY = 'kubik_automation_config_v2';

export const DEFAULT_CRM_STAGES: CrmChampionshipStage[] = [
  {
    id: 'crm-stage-1',
    number: 1,
    title: 'Регистрация корабля, наставника и штатного расписания',
    dates: '1 – 10 октября 2026',
    status: 'past',
    deadlineTime: '10 октября, 23:59',
    isoDeadline: '2026-10-10T23:59:00',
    description:
      'Формирование экипажа (Капитан-наставник, 3 специалиста, Бортовой компьютер Леший). Утверждение квоты школы из реестра 16 ОУ г. Перми.',
    requiredDeliverables: [
      'Заполненное штатное расписание 5 участников',
      'Название и позывной космического корабля',
      'Выбор темы миссии CubeSat по школьным дисциплинам',
    ],
    notificationSent: true,
    responsibleMCC: 'Анисимова А.С. (МАОУ ДПО «ЦРСО»)',
    progressPercent: 100,
    kubikAutoAlertsEnabled: true,
    alertCount: 1,
  },
  {
    id: 'crm-stage-2',
    number: 2,
    title: 'Стартовый квиз и заправка баков топливом',
    dates: '11 – 14 октября 2026',
    status: 'current',
    deadlineTime: '14 октября, 21:00',
    isoDeadline: '2026-10-14T21:00:00',
    description:
      'Бортовой тест на знание физики, химии, биологии и наноспутников. Результат определяет уровень плазменного топлива корабля (0–100%).',
    requiredDeliverables: [
      'Прохождение 5 вопросов стартового научного квиза',
      'Заправка плазменных баков корабля не менее 70%',
      'Подтверждение готовности бортовых приборов Кубсата',
    ],
    notificationSent: true,
    responsibleMCC: 'Песин М.В. (Руководитель полетов ЦУП)',
    progressPercent: 65,
    kubikAutoAlertsEnabled: true,
    alertCount: 3,
  },
  {
    id: 'crm-stage-3',
    number: 3,
    title: 'Разработка 3-х структурированных слайдов',
    dates: '15 – 19 октября 2026',
    status: 'future',
    deadlineTime: '19 октября, 21:00',
    isoDeadline: '2026-10-19T21:00:00',
    description:
      'Слайд 1: Представление и фото команды. Слайд 2: Теоретическая модель, формулы LaTeX и графики. Слайд 3: Практическая применимость в космосе (мнение каждого участника).',
    requiredDeliverables: [
      'Загрузка командного фото с предпросмотром',
      'Ввод формул LaTeX и баллистических расчетов',
      'Персональная рефлексия каждого члена экипажа',
    ],
    notificationSent: false,
    responsibleMCC: 'Смирнов А.А. (info@mirovisor.com)',
    progressPercent: 0,
    kubikAutoAlertsEnabled: true,
    alertCount: 0,
  },
  {
    id: 'crm-stage-4',
    number: 4,
    title: 'Предзащита и автоматический AI-аудит проектов',
    dates: '20 – 22 октября 2026',
    status: 'future',
    deadlineTime: '22 октября, 18:00',
    isoDeadline: '2026-10-22T18:00:00',
    description:
      'Бортовой компьютер «Леший» и нейросеть проводят глубокий аудит полноты решения, баланса экипажа и корректности орбитальных вычислений.',
    requiredDeliverables: [
      'Получение заключения AI-аудита ЦРСО',
      'Устранение критических замечаний экспертов',
      'Финальное согласование с наставником-капитаном',
    ],
    notificationSent: false,
    responsibleMCC: 'Песин М.В. / Смирнов А.А.',
    progressPercent: 0,
    kubikAutoAlertsEnabled: true,
    alertCount: 0,
  },
  {
    id: 'crm-stage-5',
    number: 5,
    title: 'Финал: Демонстрация презентации перед жюри ЦУП',
    dates: '25 октября 2026',
    status: 'future',
    deadlineTime: '25 октября, 16:00',
    isoDeadline: '2026-10-25T16:00:00',
    description:
      'Прямая трансляция защиты проектов из личного кабинета капитана на большой экран перед Администрацией ЦУП (Смирнов А.А., Песин М.В., Анисимова А.С.).',
    requiredDeliverables: [
      'Демонстрация 3-х слайдов в полноэкранном режиме с таймером 3:00',
      'Ответы на вопросы экспертного жюри и ЦУП',
      'Подведение итогов и награждение победителей',
    ],
    notificationSent: false,
    responsibleMCC: 'Смирнов А.А., Песин М.В., Анисимова А.С.',
    progressPercent: 0,
    kubikAutoAlertsEnabled: true,
    alertCount: 0,
  },
];

export interface KubikAutomationConfig {
  autoAlertsEnabled: boolean;
  alertIntervals: {
    sevenDays: boolean;
    threeDays: boolean;
    oneDay: boolean;
    twoHours: boolean;
  };
  soundEffects: boolean;
  pushNotifications: boolean;
  mccSync: boolean;
}

const DEFAULT_CONFIG: KubikAutomationConfig = {
  autoAlertsEnabled: true,
  alertIntervals: {
    sevenDays: true,
    threeDays: true,
    oneDay: true,
    twoHours: true,
  },
  soundEffects: true,
  pushNotifications: true,
  mccSync: true,
};

const INITIAL_ALERTS: KubikDeadlineAlert[] = [
  {
    id: 'alert-init-1',
    stageId: 'crm-stage-2',
    stageNumber: 2,
    stageTitle: 'Стартовый квиз и заправка баков топливом',
    deadlineTime: '14 октября, 21:00',
    alertLevel: 'warning',
    kubikRole: 'registrar',
    title: '⏳ Дедлайн этапа №2 приближается',
    message:
      'Бортовой компьютер «Леший» напоминает экипажу: до окончания этапа «Стартовый квиз и заправка баков» осталось менее 48 часов! Пройдите 5 научных вопросов на мостике корабля для заправки баков плазмой.',
    actionHint: 'Перейти к квизу на мостике',
    timestamp: '10 минут назад',
    isRead: false,
    soundToPlay: 'warning',
  },
  {
    id: 'alert-init-2',
    stageId: 'crm-stage-3',
    stageNumber: 3,
    stageTitle: 'Разработка 3-х структурированных слайдов',
    deadlineTime: '19 октября, 21:00',
    alertLevel: 'info',
    kubikRole: 'professor',
    title: '📡 Подготовка к этапу №3 (3 слайда)',
    message:
      'ЦУП открывает методические материалы по верстке слайдов. Бортовой компьютер «Леший» готов помочь с формулами баллистики (LaTeX) и загрузкой общего фото команды.',
    actionHint: 'Открыть Википедию и справку',
    timestamp: '2 часа назад',
    isRead: false,
    soundToPlay: 'alert',
  },
];

class KubikAlertService {
  private stages: CrmChampionshipStage[] = [];
  private alerts: KubikDeadlineAlert[] = [];
  private config: KubikAutomationConfig = DEFAULT_CONFIG;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedStages = localStorage.getItem(STAGES_STORAGE_KEY);
        if (savedStages) {
          this.stages = JSON.parse(savedStages);
        } else {
          this.stages = DEFAULT_CRM_STAGES;
        }

        const savedAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
        if (savedAlerts) {
          this.alerts = JSON.parse(savedAlerts);
        } else {
          this.alerts = INITIAL_ALERTS;
        }

        const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (savedConfig) {
          this.config = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
        }
      } else {
        this.stages = DEFAULT_CRM_STAGES;
        this.alerts = INITIAL_ALERTS;
      }
    } catch (e) {
      console.warn('KubikAlertService: Error loading state, using defaults', e);
      this.stages = DEFAULT_CRM_STAGES;
      this.alerts = INITIAL_ALERTS;
    }
  }

  private saveState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STAGES_STORAGE_KEY, JSON.stringify(this.stages));
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(this.alerts));
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
      }
    } catch (e) {
      console.warn('KubikAlertService: Error saving state', e);
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error(err);
      }
    });
  }

  public getStages(): CrmChampionshipStage[] {
    return [...this.stages];
  }

  public getAlerts(): KubikDeadlineAlert[] {
    return [...this.alerts];
  }

  public getUnreadAlertsCount(): number {
    return this.alerts.filter((a) => !a.isRead).length;
  }

  public getConfig(): KubikAutomationConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<KubikAutomationConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveState();
  }

  public markAlertAsRead(alertId: string) {
    this.alerts = this.alerts.map((a) => (a.id === alertId ? { ...a, isRead: true } : a));
    this.saveState();
  }

  public markAllAlertsAsRead() {
    this.alerts = this.alerts.map((a) => ({ ...a, isRead: true }));
    this.saveState();
  }

  public deleteAlert(alertId: string) {
    this.alerts = this.alerts.filter((a) => a.id !== alertId);
    this.saveState();
  }

  /**
   * Рассчитать оставшееся время до дедлайна этапа
   */
  public calculateTimeRemaining(stage: CrmChampionshipStage): {
    days: number;
    hours: number;
    minutes: number;
    isUrgent: boolean;
    isPassed: boolean;
    label: string;
    progressPercentage: number;
  } {
    if (stage.status === 'past') {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        isUrgent: false,
        isPassed: true,
        label: 'Этап завершен',
        progressPercentage: 100,
      };
    }

    // Parse deadline or simulate for 2026 timeline
    let deadlineDate: Date;
    if (stage.isoDeadline) {
      deadlineDate = new Date(stage.isoDeadline);
    } else {
      deadlineDate = new Date(Date.now() + stage.number * 86400000 * 3);
    }

    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();

    if (diffMs <= 0 && stage.status !== 'current') {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        isUrgent: false,
        isPassed: true,
        label: 'Дедлайн прошел',
        progressPercentage: 100,
      };
    }

    // For Demo: give realistic human-readable countdowns per stage
    let days = 0;
    let hours = 0;
    const minutes = 45;
    let isUrgent = false;

    if (stage.number === 2) {
      days = 1;
      hours = 18;
      isUrgent = true; // Stage 2 is current and under 48h!
    } else if (stage.number === 3) {
      days = 5;
      hours = 8;
    } else if (stage.number === 4) {
      days = 8;
      hours = 12;
    } else if (stage.number === 5) {
      days = 11;
      hours = 6;
    }

    const label = `${days} дн. ${hours} ч.`;
    const progressPercentage = stage.progressPercent || (stage.status === 'current' ? 65 : 0);

    return {
      days,
      hours,
      minutes,
      isUrgent: stage.status === 'current' || stage.status === 'urgent',
      isPassed: false,
      label,
      progressPercentage,
    };
  }

  /**
   * Рассчитать общий прогресс чемпионата по шкале времени
   */
  public getOverallProgress() {
    const total = this.stages.length;
    const completed = this.stages.filter((s) => s.status === 'past').length;
    const currentStage =
      this.stages.find((s) => s.status === 'current' || s.status === 'urgent') || this.stages[1];

    const percent = Math.min(100, Math.round(((completed + 0.65) / total) * 100));

    return {
      percent,
      completedStages: completed,
      totalStages: total,
      currentStage,
      nextDeadline: currentStage?.deadlineTime || '14 октября, 21:00',
    };
  }

  /**
   * Сменить статус этапа (Завершить, Сделать текущим, Запланировать)
   */
  public updateStageStatus(
    stageId: string,
    newStatus: 'past' | 'current' | 'future' | 'urgent',
  ): CrmChampionshipStage[] {
    this.stages = this.stages.map((s) => {
      if (s.id === stageId) {
        return {
          ...s,
          status: newStatus,
          progressPercent: newStatus === 'past' ? 100 : newStatus === 'current' ? 50 : 0,
        };
      }
      // If setting a stage to current, previous become past or future
      if (newStatus === 'current') {
        const targetStage = this.stages.find((st) => st.id === stageId);
        if (targetStage && s.number < targetStage.number && s.status !== 'past') {
          return { ...s, status: 'past', progressPercent: 100 };
        }
      }
      return s;
    });

    const activated = this.stages.find((s) => s.id === stageId);
    if (activated && (newStatus === 'current' || newStatus === 'urgent')) {
      this.triggerKubikAlert(
        stageId,
        `ЦУП изменил статус этапа №${activated.number} «${activated.title}» на [${newStatus === 'urgent' ? 'ГОРЯЩИЙ ДЕДЛАЙН' : 'АКТИВЕН'}]. Всем кораблям сверить штатное расписание!`,
        newStatus === 'urgent' ? 'urgent' : 'warning',
      );
    }

    this.saveState();
    return this.getStages();
  }

  /**
   * Изменить дедлайн этапа
   */
  public updateStageDeadline(
    stageId: string,
    newDeadlineTime: string,
    newDates?: string,
  ): CrmChampionshipStage[] {
    this.stages = this.stages.map((s) => {
      if (s.id === stageId) {
        return {
          ...s,
          deadlineTime: newDeadlineTime,
          dates: newDates || s.dates,
        };
      }
      return s;
    });

    const target = this.stages.find((s) => s.id === stageId);
    if (target) {
      this.triggerKubikAlert(
        stageId,
        `Внимание! Дедлайн этапа №${target.number} скорректирован Администрацией ЦУП: ${newDeadlineTime}.`,
        'reminder',
      );
    }

    this.saveState();
    return this.getStages();
  }

  /**
   * Переключить автоматические напоминания Лешего для конкретного этапа
   */
  public toggleKubikAutoAlerts(stageId: string, enabled: boolean) {
    this.stages = this.stages.map((s) =>
      s.id === stageId ? { ...s, kubikAutoAlertsEnabled: enabled } : s,
    );
    this.saveState();
  }

  /**
   * Разослать циркуляр по этапу из CRM (рассылка наставнику + создание оповещения Лешего)
   */
  public broadcastStageFromCrm(
    stageId: string,
    mentorEmail: string,
    mentorName: string,
    shipName: string,
  ): { stage: CrmChampionshipStage; alert: KubikDeadlineAlert; email: CrmNotificationEmail } {
    let targetStage = this.stages.find((s) => s.id === stageId);
    if (!targetStage) targetStage = this.stages[0];

    // Mark notification sent
    this.stages = this.stages.map((s) =>
      s.id === stageId
        ? {
            ...s,
            notificationSent: true,
            status: 'current',
            alertCount: (s.alertCount || 0) + 1,
          }
        : s,
    );

    // Create official Captain Email
    const email: CrmNotificationEmail = {
      id: `em-broadcast-${Date.now()}`,
      recipientEmail: mentorEmail,
      recipientName: mentorName,
      recipientRole: `Капитан корабля «${shipName}»`,
      teamName: shipName,
      subject: `ЦУП: Официальное открытие этапа №${targetStage.number} «${targetStage.title}»`,
      preview: `Администрация ЦУП и МАОУ ДПО «ЦРСО» открыли приём материалов. Срок сдачи до ${targetStage.deadlineTime}...`,
      body: `Уважаемый Капитан корабля «${shipName}» (${mentorName})!

Центр Управления Полётами Чемпионата «КОСМОПОРТ» объявляет официальный старт этапа:
«Этап №${targetStage.number}: ${targetStage.title}»

🗓️ Сроки проведения: ${targetStage.dates}
⏰ Критический дедлайн сдачи: ${targetStage.deadlineTime}
👨‍✈️ Ответственные кураторы: ${targetStage.responsibleMCC || 'Смирнов А.А., Песин М.В., Анисимова А.С.'}

Обязательные требования к защите этапа:
${targetStage.requiredDeliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Бортовой компьютер «Леший» уже получил директиву и готов сопровождать экипаж формулами, расчетами и проверками.

С уважением,
Руководство ЦУП «КОСМОПОРТ» и МАОУ ДПО «ЦРСО»`,
      sentAt: 'Только что',
      senderName: 'Михаил Владимирович Песин',
      senderPosition: 'Руководитель полётов ЦУП',
      stageTitle: targetStage.title,
      isRead: false,
      type: 'stage_announcement',
    };

    // Create Kubik Deadline Alert
    const alert: KubikDeadlineAlert = {
      id: `kubik-alert-${Date.now()}`,
      stageId: targetStage.id,
      stageNumber: targetStage.number,
      stageTitle: targetStage.title,
      deadlineTime: targetStage.deadlineTime,
      alertLevel: 'urgent',
      kubikRole: 'registrar',
      title: `📢 Директива ЦУП: Этап №${targetStage.number} «${targetStage.title}»`,
      message: `Бортовой компьютер «Леший» принял официальный циркуляр ЦУП! Кораблю «${shipName}» необходимо подготовить регламентные материалы до ${targetStage.deadlineTime}. Запустите бортовые системы для выполнения задач.`,
      actionHint: 'Открыть мостик корабля',
      timestamp: 'Только что',
      isRead: false,
      soundToPlay: 'success',
    };

    this.alerts = [alert, ...this.alerts];

    if (this.config.soundEffects) {
      audioService.playSuccessChime();
    }

    this.saveState();
    return { stage: targetStage, alert, email };
  }

  /**
   * Сгенерировать или протестировать оповещение Лешего о приближении дедлайна
   */
  public triggerKubikAlert(
    stageId: string,
    customMessage?: string,
    alertLevel: 'info' | 'reminder' | 'warning' | 'urgent' = 'warning',
  ): KubikDeadlineAlert {
    const stage = this.stages.find((s) => s.id === stageId) || this.stages[1];

    const alert: KubikDeadlineAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stageId: stage.id,
      stageNumber: stage.number,
      stageTitle: stage.title,
      deadlineTime: stage.deadlineTime,
      alertLevel,
      kubikRole:
        alertLevel === 'urgent' ? 'registrar' : alertLevel === 'warning' ? 'professor' : 'engineer',
      title:
        alertLevel === 'urgent'
          ? `🚨 КРИТИЧЕСКИЙ ДЕДЛАЙН: Этап №${stage.number}`
          : alertLevel === 'warning'
            ? `⏳ Внимание экипажу: Дедлайн этапа №${stage.number}`
            : `💡 Напоминание Лешего: Этап №${stage.number}`,
      message:
        customMessage ||
        `Бортовой компьютер «Леший» информирует экипаж: до сдачи материалов по этапу «${stage.title}» осталось менее 24 часов (дедлайн: ${stage.deadlineTime}). Не забудьте синхронизировать слайды и баллистические формулы!`,
      actionHint: 'Сверить слайды и формулы',
      timestamp: 'Только что',
      isRead: false,
      soundToPlay: alertLevel === 'urgent' || alertLevel === 'warning' ? 'warning' : 'alert',
    };

    this.alerts = [alert, ...this.alerts];

    // Play corresponding sound
    if (this.config.soundEffects) {
      if (alertLevel === 'urgent' || alertLevel === 'warning') {
        audioService.playTimerWarning();
      } else {
        audioService.playClickSound();
      }
    }

    this.saveState();
    return alert;
  }

  /**
   * Быстрый тест автоматического срабатывания Лешего (симуляция)
   */
  public testKubikAlertSimulation(stageNumber: number = 2): KubikDeadlineAlert {
    const stage = this.stages.find((s) => s.number === stageNumber) || this.stages[1];
    return this.triggerKubikAlert(
      stage.id,
      `[ТЕСТ АВТОМАТИЗАЦИИ ЛЕШЕГО]: До дедлайна этапа №${stage.number} «${stage.title}» осталось 12 часов! Бортовой компьютер «Леший» в режиме реального времени оповестил всех участников и проверил готовность отчета.`,
      'urgent',
    );
  }
}

export const kubikAlertService = new KubikAlertService();
