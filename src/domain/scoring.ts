import type { StageId, SubmissionStatus, Team } from '../types';

export const STAGE_IDS: readonly StageId[] = [
  'stage_1',
  'stage_2',
  'stage_3',
  'stage_4',
  'stage_5',
];

export const MAX_STAGE_SCORE = 100;
export const MAX_TOTAL_SCORE = STAGE_IDS.length * MAX_STAGE_SCORE;

export interface CriterionScores {
  physicsAccuracy: number;
  engineeringRealism: number;
  scientificValue: number;
  documentationQuality: number;
  presentationClarity: number;
}

export const MAX_CRITERION_SCORES: CriterionScores = {
  physicsAccuracy: 25,
  engineeringRealism: 25,
  scientificValue: 20,
  documentationQuality: 15,
  presentationClarity: 15,
};

export function sumCriterionScores(scores: CriterionScores): number {
  return (
    scores.physicsAccuracy +
    scores.engineeringRealism +
    scores.scientificValue +
    scores.documentationQuality +
    scores.presentationClarity
  );
}

export function computeLaunchReadinessPercent(statuses: Record<StageId, SubmissionStatus>): number {
  const approved = STAGE_IDS.filter((id) => statuses[id] === 'approved').length;
  return Math.min(100, Math.round((approved / STAGE_IDS.length) * 100));
}

export function recalculateRanks(teams: Team[]): Team[] {
  return [...teams]
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export function applyEvaluation(
  team: Team,
  stageId: StageId,
  scores: CriterionScores,
  approved: boolean,
): Team {
  const total = sumCriterionScores(scores);
  const stageScores: Record<StageId, number> = {
    ...team.stageScores,
    [stageId]: approved ? total : 0,
  };
  const stageStatuses: Record<StageId, SubmissionStatus> = {
    ...team.stageStatuses,
    [stageId]: approved ? 'approved' : 'needs_revision',
  };
  const totalScore = STAGE_IDS.reduce((sum, id) => sum + (stageScores[id] ?? 0), 0);

  return {
    ...team,
    stageScores,
    stageStatuses,
    totalScore,
    launchReadinessPercent: computeLaunchReadinessPercent(stageStatuses),
  };
}

export interface QualitativeReadinessMetrics {
  stageProgressPercent: number;
  physicsAccuracyScore: number;
  engineeringScore: number;
  avionicsRadioScore: number;
  scientificScore: number;
  overallReadinessPercent: number;
  readinessStatus: 'not_ready' | 'in_progress' | 'pre_launch' | 'certified_for_launch';
  readinessStatusText: string;
}

export function computeCubeSatReadiness(team: Team): QualitativeReadinessMetrics {
  let stageProgressPoints = 0;
  for (const id of STAGE_IDS) {
    const status = team.stageStatuses[id];
    if (status === 'approved') stageProgressPoints += 20;
    else if (status === 'submitted' || status === 'under_review') stageProgressPoints += 10;
    else if (status === 'needs_revision' || status === 'draft') stageProgressPoints += 5;
  }
  const stageProgressPercent = Math.min(100, stageProgressPoints);

  const evaluatedScores = STAGE_IDS.map((id) => team.stageScores[id] ?? 0).filter((s) => s > 0);
  const avgStageScore =
    evaluatedScores.length > 0
      ? evaluatedScores.reduce((a, b) => a + b, 0) / evaluatedScores.length
      : 0;

  const orbitValid =
    team.cubesatSpecs.orbitAltitudeKm >= 450 && team.cubesatSpecs.orbitAltitudeKm <= 650;
  const inclinationValid =
    team.cubesatSpecs.inclinationDeg >= 95 && team.cubesatSpecs.inclinationDeg <= 100;
  const orbitBonus = (orbitValid ? 10 : 0) + (inclinationValid ? 10 : 0);
  const physicsStageScore = team.stageScores.stage_1 ?? 0;
  const physicsAccuracyScore = Math.min(
    100,
    Math.round(
      physicsStageScore > 0
        ? physicsStageScore * 0.8 + orbitBonus
        : stageProgressPercent > 0
          ? 30 + orbitBonus
          : orbitBonus,
    ),
  );

  const massValid = team.cubesatSpecs.massKg > 0 && team.cubesatSpecs.massKg <= 4.0;
  const formatValid =
    team.cubesatSpecs.format === '3U' ||
    team.cubesatSpecs.format === '2U' ||
    team.cubesatSpecs.format === '1U';
  const hwBonus = (massValid ? 10 : 0) + (formatValid ? 10 : 0);
  const engStageScore = team.stageScores.stage_2 ?? 0;
  const engineeringScore = Math.min(
    100,
    Math.round(
      engStageScore > 0
        ? engStageScore * 0.8 + hwBonus
        : stageProgressPercent > 0
          ? 30 + hwBonus
          : hwBonus,
    ),
  );

  const powerValid = team.cubesatSpecs.powerBudgetWatts >= 10;
  const freqValid = team.cubesatSpecs.radioFreqMhz >= 430 && team.cubesatSpecs.radioFreqMhz <= 440;
  const avBonus = (powerValid ? 10 : 0) + (freqValid ? 10 : 0);
  const radioStageScore = team.stageScores.stage_4 ?? 0;
  const avionicsRadioScore = Math.min(
    100,
    Math.round(
      radioStageScore > 0
        ? radioStageScore * 0.8 + avBonus
        : stageProgressPercent > 0
          ? 25 + avBonus
          : avBonus,
    ),
  );

  const payloadValid = Boolean(
    team.cubesatSpecs.payloadType && team.cubesatSpecs.payloadType.length > 2,
  );
  const scBonus = payloadValid ? 20 : 0;
  const sciStageScore = ((team.stageScores.stage_3 ?? 0) + (team.stageScores.stage_5 ?? 0)) / 2;
  const scientificScore = Math.min(
    100,
    Math.round(
      sciStageScore > 0
        ? sciStageScore * 0.8 + scBonus
        : stageProgressPercent > 0
          ? 25 + scBonus
          : scBonus,
    ),
  );

  const hardwareAvg =
    (physicsAccuracyScore + engineeringScore + avionicsRadioScore + scientificScore) / 4;

  const overallReadinessPercent = Math.min(
    100,
    Math.max(0, Math.round(stageProgressPercent * 0.45 + avgStageScore * 0.35 + hardwareAvg * 0.2)),
  );

  let readinessStatus: QualitativeReadinessMetrics['readinessStatus'] = 'not_ready';
  let readinessStatusText = 'Начальный этап разработки';

  if (overallReadinessPercent >= 88 && team.launchReadinessPercent >= 80) {
    readinessStatus = 'certified_for_launch';
    readinessStatusText = 'Сертифицирован к запуску с космодрома «Восточный»';
  } else if (overallReadinessPercent >= 65) {
    readinessStatus = 'pre_launch';
    readinessStatusText = 'Предстартовая интеграция бортовых систем';
  } else if (overallReadinessPercent >= 30) {
    readinessStatus = 'in_progress';
    readinessStatusText = 'Штатная подготовка и верификация узлов';
  }

  return {
    stageProgressPercent,
    physicsAccuracyScore,
    engineeringScore,
    avionicsRadioScore,
    scientificScore,
    overallReadinessPercent,
    readinessStatus,
    readinessStatusText,
  };
}
