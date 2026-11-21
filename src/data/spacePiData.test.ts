import { describe, it, expect } from 'vitest';
import {
  SPACE_PI_CONSTELLATION,
  SPACE_PI_IDEAS_BANK,
  INITIAL_SPACE_PI_APPLICATIONS,
  calculateSpacePiCompliance,
  generateSpacePiRegistrationCode,
  syncApplicationFromChampionship,
} from './spacePiData';
import { INITIAL_TEAMS, INITIAL_SUBMISSIONS } from './mockData';
import type { SpacePiApplication } from '../types';

describe('Space-π Data & Submission Verification', () => {
  it('contains verified Space-π constellation satellites with radio frequencies and missions', () => {
    expect(SPACE_PI_CONSTELLATION.length).toBeGreaterThanOrEqual(6);
    const umka = SPACE_PI_CONSTELLATION.find((s) => s.id === 'um-ka-1');
    expect(umka).toBeDefined();
    expect(umka?.callsign).toBe('RS40S');
    expect(umka?.frequenciesMhz).toContain('437');
    expect(umka?.format).toBe('CubeSat 3U');

    const svyatobor = SPACE_PI_CONSTELLATION.find((s) => s.id === 'svyatobor-1');
    expect(svyatobor).toBeDefined();
    expect(svyatobor?.payloadDescription).toContain('плазменный');
  });

  it('contains comprehensive CubeSat 3U idea bank matching Space-π standards', () => {
    expect(SPACE_PI_IDEAS_BANK.length).toBe(8);

    SPACE_PI_IDEAS_BANK.forEach((idea) => {
      expect(idea.title).toBeTruthy();
      expect(idea.category).toBeTruthy();
      expect(idea.summary.length).toBeGreaterThan(30);
      expect(idea.payloadComponents.length).toBeGreaterThanOrEqual(3);
      expect(idea.specs.massG).toBeLessThanOrEqual(1200); // 3U payload limit
      expect(idea.specs.powerW).toBeLessThanOrEqual(15);
      expect(idea.soniksExperiment).toBeTruthy();
    });
  });

  describe('calculateSpacePiCompliance', () => {
    it('accurately scores a fully compliant Space-π application as 100%', () => {
      const validApp: Partial<SpacePiApplication> = {
        payloadMassGrams: 750,
        powerConsumptionWatts: { average: 3.5, peak: 6.2 },
        soniksIntegration: {
          enabled: true,
          openBeaconDesc: 'Открытый маяк AX.25 каждые 60 секунд на 437.425 МГц',
          telemetryFormat: 'AX.25',
        },
        payloadDescription: 'Двухканальный SiPM детектор сцинтилляций с 24-бит АЦП',
        schoolEngagementDefined: true,
        schoolInvolvementPlan: 'Школы РФ принимают пакеты через СОНИКС и строят графики',
        scientificNovelty: 'Первый школьный кремниевый фотоумножитель для линии 557.7 нм',
        mentorSummary: 'Соколов В.А., доцент ПГНИУ',
      };

      const result = calculateSpacePiCompliance(validApp);
      expect(result.score).toBe(100);
      expect(result.checklist.massCompliant).toBe(true);
      expect(result.checklist.powerCompliant).toBe(true);
      expect(result.checklist.soniksChannelOpen).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('flags issues when payload mass exceeds 1200g limit or SONIKS channel is absent', () => {
      const overweightApp: Partial<SpacePiApplication> = {
        payloadMassGrams: 1800, // Exceeds 1200g limit for 3U
        powerConsumptionWatts: { average: 4.0, peak: 20.0 }, // Exceeds 15W peak
        soniksIntegration: {
          enabled: false,
          openBeaconDesc: '',
          telemetryFormat: '',
        },
      };

      const result = calculateSpacePiCompliance(overweightApp);
      expect(result.checklist.massCompliant).toBe(false);
      expect(result.checklist.powerCompliant).toBe(false);
      expect(result.checklist.soniksChannelOpen).toBe(false);
      expect(result.score).toBeLessThan(50);
      expect(result.issues.some((i) => i.includes('превышает лимит'))).toBe(true);
      expect(result.issues.some((i) => i.includes('СОНИКС'))).toBe(true);
    });
  });

  describe('generateSpacePiRegistrationCode', () => {
    it('creates formatted registration codes with city tag and year', () => {
      const code = generateSpacePiRegistrationCode('Пермь', 'Орион-3');
      expect(code).toMatch(/^SPACEPI-2026-[A-ZА-Я0-9]+-\d{4}$/);
    });
  });

  describe('syncApplicationFromChampionship', () => {
    it('seamlessly pulls case stages and physics data into Space-π application draft', () => {
      const team = INITIAL_TEAMS[0];
      const synced = syncApplicationFromChampionship(team, INITIAL_SUBMISSIONS);

      expect(synced.projectName).toBeTruthy();
      expect(synced.satelliteName).toContain(team.name);
      expect(synced.payloadMassGrams).toBeGreaterThan(0);
      expect(synced.payloadMassGrams).toBeLessThanOrEqual(1200);
      expect(synced.soniksIntegration?.enabled).toBe(true);
      expect(synced.teamMembersSummary).toContain(team.members[0].name);
      expect(synced.mentorSummary).toContain(team.mentorName);
    });
  });

  describe('INITIAL_SPACE_PI_APPLICATIONS', () => {
    it('provides initial applications for championship teams with registry codes', () => {
      const pulsarApp = INITIAL_SPACE_PI_APPLICATIONS.team_pulsar_11;
      expect(pulsarApp).toBeDefined();
      expect(pulsarApp.status).toBe('submitted_to_spacepi');
      expect(pulsarApp.spacePiRegistrationCode).toBe('SPACEPI-2026-FASIE-7749');

      const orionApp = INITIAL_SPACE_PI_APPLICATIONS.team_orion_3;
      expect(orionApp).toBeDefined();
      expect(orionApp.platformFormat).toBe('CubeSat 3U');
    });
  });
});
