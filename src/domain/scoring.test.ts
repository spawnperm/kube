import { describe, expect, it } from 'vitest';
import type { StageId, SubmissionStatus, Team } from '../types';
import {
  applyEvaluation,
  computeCubeSatReadiness,
  computeLaunchReadinessPercent,
  MAX_CRITERION_SCORES,
  MAX_STAGE_SCORE,
  MAX_TOTAL_SCORE,
  recalculateRanks,
  STAGE_IDS,
  sumCriterionScores,
  type CriterionScores,
} from './scoring';

function makeStatuses(status: SubmissionStatus = 'not_started'): Record<StageId, SubmissionStatus> {
  return {
    stage_1: status,
    stage_2: status,
    stage_3: status,
    stage_4: status,
    stage_5: status,
  };
}

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 'team_test',
    name: 'Тест',
    school: 'Школа',
    city: 'Город',
    league: 'Старшая лига (10-11 классы)',
    mentorName: 'Ментор',
    mentorTitle: 'Учитель',
    logo: '🛰️',
    description: '',
    members: [],
    cubesatSpecs: {
      format: '3U',
      payloadType: 'test',
      orbitAltitudeKm: 525,
      inclinationDeg: 97.4,
      powerBudgetWatts: 15,
      radioFreqMhz: 437.425,
      massKg: 3.5,
    },
    stageStatuses: makeStatuses(),
    totalScore: 0,
    stageScores: { stage_1: 0, stage_2: 0, stage_3: 0, stage_4: 0, stage_5: 0 },
    rank: 1,
    badges: [],
    launchReadinessPercent: 0,
    ...overrides,
  };
}

describe('Логика подсчета баллов кейс-чемпионата (Scoring Domain)', () => {
  describe('Константы чемпионата', () => {
    it('содержит ровно 5 этапов чемпионата', () => {
      expect(STAGE_IDS).toHaveLength(5);
      expect(STAGE_IDS).toEqual(['stage_1', 'stage_2', 'stage_3', 'stage_4', 'stage_5']);
    });

    it('максимальный балл за этап равен 100, а суммарный — 500', () => {
      expect(MAX_STAGE_SCORE).toBe(100);
      expect(MAX_TOTAL_SCORE).toBe(500);
    });

    it('веса максимальных критериев точно согласованы со 100 баллами', () => {
      expect(MAX_CRITERION_SCORES.physicsAccuracy).toBe(25);
      expect(MAX_CRITERION_SCORES.engineeringRealism).toBe(25);
      expect(MAX_CRITERION_SCORES.scientificValue).toBe(20);
      expect(MAX_CRITERION_SCORES.documentationQuality).toBe(15);
      expect(MAX_CRITERION_SCORES.presentationClarity).toBe(15);
      expect(sumCriterionScores(MAX_CRITERION_SCORES)).toBe(100);
    });
  });

  describe('sumCriterionScores', () => {
    it('корректно суммирует нулевые баллы', () => {
      const zeroScores: CriterionScores = {
        physicsAccuracy: 0,
        engineeringRealism: 0,
        scientificValue: 0,
        documentationQuality: 0,
        presentationClarity: 0,
      };
      expect(sumCriterionScores(zeroScores)).toBe(0);
    });

    it('корректно суммирует частичные баллы жюри', () => {
      const scores: CriterionScores = {
        physicsAccuracy: 22,
        engineeringRealism: 21,
        scientificValue: 18,
        documentationQuality: 13,
        presentationClarity: 14,
      };
      expect(sumCriterionScores(scores)).toBe(88);
    });

    it('обрабатывает дробные оценки с высокой математической точностью', () => {
      const scores: CriterionScores = {
        physicsAccuracy: 24.5,
        engineeringRealism: 23.5,
        scientificValue: 19.0,
        documentationQuality: 14.25,
        presentationClarity: 13.75,
      };
      expect(sumCriterionScores(scores)).toBeCloseTo(95.0, 5);
    });
  });

  describe('computeLaunchReadinessPercent', () => {
    it('возвращает 0%, если ни один этап не одобрен', () => {
      expect(computeLaunchReadinessPercent(makeStatuses('not_started'))).toBe(0);
      expect(computeLaunchReadinessPercent(makeStatuses('draft'))).toBe(0);
      expect(computeLaunchReadinessPercent(makeStatuses('submitted'))).toBe(0);
      expect(computeLaunchReadinessPercent(makeStatuses('under_review'))).toBe(0);
      expect(computeLaunchReadinessPercent(makeStatuses('needs_revision'))).toBe(0);
    });

    it('рассчитывает 20% за каждый одобренный этап', () => {
      const statuses = makeStatuses();
      expect(computeLaunchReadinessPercent({ ...statuses, stage_1: 'approved' })).toBe(20);
      expect(
        computeLaunchReadinessPercent({ ...statuses, stage_1: 'approved', stage_2: 'approved' }),
      ).toBe(40);
      expect(
        computeLaunchReadinessPercent({
          ...statuses,
          stage_1: 'approved',
          stage_2: 'approved',
          stage_3: 'approved',
        }),
      ).toBe(60);
      expect(
        computeLaunchReadinessPercent({
          ...statuses,
          stage_1: 'approved',
          stage_2: 'approved',
          stage_3: 'approved',
          stage_4: 'approved',
        }),
      ).toBe(80);
      expect(computeLaunchReadinessPercent(makeStatuses('approved'))).toBe(100);
    });

    it('не учитывает этапы со статусом submitted или needs_revision при расчете готовности', () => {
      const mixed: Record<StageId, SubmissionStatus> = {
        stage_1: 'approved',
        stage_2: 'needs_revision',
        stage_3: 'submitted',
        stage_4: 'under_review',
        stage_5: 'approved',
      };
      expect(computeLaunchReadinessPercent(mixed)).toBe(40);
    });
  });

  describe('recalculateRanks', () => {
    it('корректно упорядочивает команды по убыванию общего балла', () => {
      const teams = [
        makeTeam({ id: 'team_a', totalScore: 180 }),
        makeTeam({ id: 'team_b', totalScore: 420 }),
        makeTeam({ id: 'team_c', totalScore: 310 }),
        makeTeam({ id: 'team_d', totalScore: 95 }),
      ];

      const ranked = recalculateRanks(teams);
      expect(ranked.map((t) => t.id)).toEqual(['team_b', 'team_c', 'team_a', 'team_d']);
      expect(ranked.map((t) => t.rank)).toEqual([1, 2, 3, 4]);
    });

    it('обрабатывает пустой массив команд без ошибок', () => {
      expect(recalculateRanks([])).toEqual([]);
    });

    it('корректно обрабатывает единственную команду', () => {
      const single = makeTeam({ id: 'alpha', totalScore: 250 });
      const res = recalculateRanks([single]);
      expect(res).toHaveLength(1);
      expect(res[0].rank).toBe(1);
    });

    it('назначает последовательные ранги командам с равными баллами', () => {
      const tied = [
        makeTeam({ id: 't1', totalScore: 200 }),
        makeTeam({ id: 't2', totalScore: 200 }),
        makeTeam({ id: 't3', totalScore: 150 }),
      ];
      const ranked = recalculateRanks(tied);
      expect(ranked.map((t) => t.rank)).toEqual([1, 2, 3]);
    });
  });

  describe('applyEvaluation', () => {
    it('зачисляет баллы и пересчитывает сумму при одобрении этапа', () => {
      const team = makeTeam();
      const updated = applyEvaluation(team, 'stage_1', MAX_CRITERION_SCORES, true);

      expect(updated.stageScores.stage_1).toBe(100);
      expect(updated.stageStatuses.stage_1).toBe('approved');
      expect(updated.totalScore).toBe(100);
      expect(updated.launchReadinessPercent).toBe(20);
    });

    it('обнуляет балл этапа и статус при направлении на доработку', () => {
      const team = makeTeam({
        stageScores: { stage_1: 90, stage_2: 0, stage_3: 0, stage_4: 0, stage_5: 0 },
        totalScore: 90,
        launchReadinessPercent: 20,
      });

      const updated = applyEvaluation(team, 'stage_1', MAX_CRITERION_SCORES, false);

      expect(updated.stageScores.stage_1).toBe(0);
      expect(updated.stageStatuses.stage_1).toBe('needs_revision');
      expect(updated.totalScore).toBe(0);
      expect(updated.launchReadinessPercent).toBe(0);
    });

    it('кумулятивно накапливает оценки нескольких этапов подряд', () => {
      let team = makeTeam();

      const stage1Scores: CriterionScores = {
        physicsAccuracy: 24,
        engineeringRealism: 24,
        scientificValue: 19,
        documentationQuality: 14,
        presentationClarity: 14,
      }; // 95

      const stage2Scores: CriterionScores = {
        physicsAccuracy: 23,
        engineeringRealism: 22,
        scientificValue: 18,
        documentationQuality: 13,
        presentationClarity: 14,
      }; // 90

      team = applyEvaluation(team, 'stage_1', stage1Scores, true);
      expect(team.totalScore).toBe(95);
      expect(team.launchReadinessPercent).toBe(20);

      team = applyEvaluation(team, 'stage_2', stage2Scores, true);
      expect(team.totalScore).toBe(185);
      expect(team.launchReadinessPercent).toBe(40);
      expect(team.stageScores.stage_1).toBe(95);
      expect(team.stageScores.stage_2).toBe(90);
    });

    it('позволяет повторно оценить этап после доработки и обновить суммарный балл', () => {
      let team = makeTeam();
      const initialScores: CriterionScores = {
        physicsAccuracy: 15,
        engineeringRealism: 15,
        scientificValue: 10,
        documentationQuality: 10,
        presentationClarity: 10,
      }; // 60
      team = applyEvaluation(team, 'stage_3', initialScores, true);
      expect(team.totalScore).toBe(60);

      // После доработки команда получает 98 баллов
      const revisedScores: CriterionScores = {
        physicsAccuracy: 25,
        engineeringRealism: 24,
        scientificValue: 20,
        documentationQuality: 15,
        presentationClarity: 14,
      }; // 98
      team = applyEvaluation(team, 'stage_3', revisedScores, true);
      expect(team.totalScore).toBe(98);
      expect(team.stageScores.stage_3).toBe(98);
    });
  });

  describe('Гарантия корректности ранжирования команд (recalculateRanks Deep Verification)', () => {
    it('не мутирует исходный массив команд (immutability)', () => {
      const original = [
        makeTeam({ id: 'team_low', totalScore: 100, rank: 1 }),
        makeTeam({ id: 'team_high', totalScore: 350, rank: 2 }),
      ];
      const copy = [...original];

      const result = recalculateRanks(original);

      expect(original).toEqual(copy);
      expect(original[0].id).toBe('team_low');
      expect(result[0].id).toBe('team_high');
    });

    it('гарантирует, что ранг 1 всегда принадлежит команде с максимальным баллом', () => {
      const teams = [
        makeTeam({ id: 't1', totalScore: 40 }),
        makeTeam({ id: 't2', totalScore: 490 }),
        makeTeam({ id: 't3', totalScore: 210 }),
        makeTeam({ id: 't4', totalScore: 380 }),
      ];

      const ranked = recalculateRanks(teams);
      expect(ranked[0].id).toBe('t2');
      expect(ranked[0].totalScore).toBe(490);
      expect(ranked[0].rank).toBe(1);
    });

    it('надежно ранжирует большую таблицу из 20 команд с произвольным разбросом баллов', () => {
      const scores = [
        120, 45, 380, 210, 500, 0, 310, 195, 410, 290, 80, 490, 150, 275, 360, 440, 230, 95, 330,
        170,
      ];
      const teams = scores.map((score, i) => makeTeam({ id: `team_${i}`, totalScore: score }));

      const ranked = recalculateRanks(teams);

      expect(ranked).toHaveLength(20);
      // Проверяем строгое невозрастание баллов
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].totalScore).toBeGreaterThanOrEqual(ranked[i + 1].totalScore);
        expect(ranked[i].rank).toBe(i + 1);
      }
      expect(ranked[0].totalScore).toBe(500);
      expect(ranked[ranked.length - 1].totalScore).toBe(0);
      expect(ranked[ranked.length - 1].rank).toBe(20);
    });

    it('обрабатывает крайние значения баллов (все 0 или все максимум 500)', () => {
      const allZeros = [
        makeTeam({ id: 'z1', totalScore: 0 }),
        makeTeam({ id: 'z2', totalScore: 0 }),
        makeTeam({ id: 'z3', totalScore: 0 }),
      ];
      const rankedZeros = recalculateRanks(allZeros);
      expect(rankedZeros.map((t) => t.rank)).toEqual([1, 2, 3]);

      const allMax = [
        makeTeam({ id: 'm1', totalScore: 500 }),
        makeTeam({ id: 'm2', totalScore: 500 }),
      ];
      const rankedMax = recalculateRanks(allMax);
      expect(rankedMax.map((t) => t.rank)).toEqual([1, 2]);
    });

    it('динамически обновляет таблицу лидеров при последовательной оценке решений команд', () => {
      let teamAlpha = makeTeam({ id: 'alpha', name: 'Альфа' });
      let teamBeta = makeTeam({ id: 'beta', name: 'Бета' });
      let teamGamma = makeTeam({ id: 'gamma', name: 'Гамма' });

      // На этапе 1: Альфа получает 90, Бета — 70, Гамма — 85
      teamAlpha = applyEvaluation(
        teamAlpha,
        'stage_1',
        { ...MAX_CRITERION_SCORES, presentationClarity: 5 },
        true,
      ); // 90
      teamBeta = applyEvaluation(
        teamBeta,
        'stage_1',
        {
          ...MAX_CRITERION_SCORES,
          presentationClarity: 5,
          documentationQuality: 5,
          scientificValue: 10,
        },
        true,
      ); // 70
      teamGamma = applyEvaluation(
        teamGamma,
        'stage_1',
        { ...MAX_CRITERION_SCORES, presentationClarity: 5, documentationQuality: 10 },
        true,
      ); // 85

      let leaderboard = recalculateRanks([teamAlpha, teamBeta, teamGamma]);
      expect(leaderboard.map((t) => t.id)).toEqual(['alpha', 'gamma', 'beta']);
      expect(leaderboard.map((t) => t.rank)).toEqual([1, 2, 3]);

      // На этапе 2: Бета вырывается вперед, получая 100 баллов, а Альфа отправлена на доработку (0 баллов)
      teamBeta = applyEvaluation(teamBeta, 'stage_2', MAX_CRITERION_SCORES, true); // 70 + 100 = 170
      teamAlpha = applyEvaluation(teamAlpha, 'stage_2', MAX_CRITERION_SCORES, false); // 90 + 0 = 90
      teamGamma = applyEvaluation(
        teamGamma,
        'stage_2',
        { ...MAX_CRITERION_SCORES, scientificValue: 10 },
        true,
      ); // 85 + 90 = 175

      leaderboard = recalculateRanks([teamAlpha, teamBeta, teamGamma]);
      // Теперь Гамма (175) на 1 месте, Бета (170) на 2 месте, Альфа (90) на 3 месте
      expect(leaderboard.map((t) => t.id)).toEqual(['gamma', 'beta', 'alpha']);
      expect(leaderboard.map((t) => t.rank)).toEqual([1, 2, 3]);
    });
  });

  describe('Расчет общего состояния подготовки КубСата (computeCubeSatReadiness)', () => {
    it('рассчитывает базовые показатели для новой команды со статусом not_ready', () => {
      const freshTeam = makeTeam();
      const metrics = computeCubeSatReadiness(freshTeam);

      expect(metrics.stageProgressPercent).toBe(0);
      expect(metrics.overallReadinessPercent).toBeLessThan(35);
      expect(metrics.readinessStatus).toBe('not_ready');
      expect(metrics.readinessStatusText).toBe('Начальный этап разработки');
      expect(metrics.physicsAccuracyScore).toBeGreaterThanOrEqual(0);
      expect(metrics.engineeringScore).toBeGreaterThanOrEqual(0);
      expect(metrics.avionicsRadioScore).toBeGreaterThanOrEqual(0);
      expect(metrics.scientificScore).toBeGreaterThanOrEqual(0);
    });

    it('учитывает промежуточный прогресс при подаче этапов на проверку (submitted, under_review)', () => {
      const inProgressTeam = makeTeam({
        stageStatuses: {
          stage_1: 'approved',
          stage_2: 'submitted',
          stage_3: 'under_review',
          stage_4: 'draft',
          stage_5: 'not_started',
        },
        stageScores: { stage_1: 92, stage_2: 0, stage_3: 0, stage_4: 0, stage_5: 0 },
        totalScore: 92,
        launchReadinessPercent: 20,
      });

      const metrics = computeCubeSatReadiness(inProgressTeam);

      // stage_1: 20 + stage_2: 10 + stage_3: 10 + stage_4: 5 = 45%
      expect(metrics.stageProgressPercent).toBe(45);
      expect(metrics.overallReadinessPercent).toBeGreaterThanOrEqual(30);
      expect(metrics.readinessStatus).toBe('in_progress');
      expect(metrics.readinessStatusText).toBe('Штатная подготовка и верификация узлов');
    });

    it('присваивает статус certified_for_launch при успешном завершении всех этапов с высокими баллами', () => {
      const readyTeam = makeTeam({
        stageStatuses: {
          stage_1: 'approved',
          stage_2: 'approved',
          stage_3: 'approved',
          stage_4: 'approved',
          stage_5: 'approved',
        },
        stageScores: { stage_1: 95, stage_2: 96, stage_3: 98, stage_4: 94, stage_5: 97 },
        totalScore: 480,
        launchReadinessPercent: 100,
        cubesatSpecs: {
          format: '3U',
          payloadType: 'Астрономический фотометр и гамма-спектрометр',
          orbitAltitudeKm: 525,
          inclinationDeg: 97.4,
          powerBudgetWatts: 18,
          radioFreqMhz: 437.425,
          massKg: 3.4,
        },
      });

      const metrics = computeCubeSatReadiness(readyTeam);

      expect(metrics.stageProgressPercent).toBe(100);
      expect(metrics.overallReadinessPercent).toBeGreaterThanOrEqual(88);
      expect(metrics.readinessStatus).toBe('certified_for_launch');
      expect(metrics.readinessStatusText).toBe('Сертифицирован к запуску с космодрома «Восточный»');
      expect(metrics.physicsAccuracyScore).toBeGreaterThanOrEqual(90);
      expect(metrics.engineeringScore).toBeGreaterThanOrEqual(90);
      expect(metrics.avionicsRadioScore).toBeGreaterThanOrEqual(90);
      expect(metrics.scientificScore).toBeGreaterThanOrEqual(90);
    });

    it('поощряет корректные физические параметры орбиты, массы и радиодиапазона', () => {
      const teamWithValidSpecs = makeTeam({
        cubesatSpecs: {
          format: '3U',
          payloadType: 'Оптическая камера ДЗЗ высокого разрешения',
          orbitAltitudeKm: 525, // номинал ССО (450..650)
          inclinationDeg: 97.4, // номинал наклонения (95..100)
          powerBudgetWatts: 15, // >= 10
          radioFreqMhz: 437.2, // радиолюбительский спутниковый диапазон
          massKg: 3.2, // <= 4.0
        },
      });

      const metrics = computeCubeSatReadiness(teamWithValidSpecs);

      expect(metrics.physicsAccuracyScore).toBeGreaterThan(0);
      expect(metrics.engineeringScore).toBeGreaterThan(0);
      expect(metrics.avionicsRadioScore).toBeGreaterThan(0);
      expect(metrics.scientificScore).toBeGreaterThan(0);
    });
  });
});
