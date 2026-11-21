import { describe, it, expect } from 'vitest';
import {
  validateTeamRegistration,
  buildTeamFromFormData,
  CHAMPIONSHIP_TRACKS,
  TeamRegistrationFormData,
} from './teamRegistration';

describe('validateTeamRegistration', () => {
  const validData: TeamRegistrationFormData = {
    teamName: 'Орион-Лицей',
    trackId: CHAMPIONSHIP_TRACKS[0].id,
    school: 'МАОУ Лицей №2',
    city: 'Пермь',
    league: 'Старшая лига (10-11 классы)',
    mentorName: 'Сергей Николаевич Ковалев',
    mentorTitle: 'Учитель физики',
    format: '3U',
    orbitAltitudeKm: 520,
    radioFreqMhz: 437.425,
    payloadType: 'Фотометр',
    members: [
      { id: 'm1', name: 'Иван Сергеев', role: 'Капитан', grade: '11 класс' },
      { id: 'm2', name: 'Анна Морозова', role: 'Баллистик', grade: '10 класс' },
    ],
  };

  it('validates a complete and correct team registration form', () => {
    const result = validateTeamRegistration(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('fails if teamName is empty or too short', () => {
    const invalidShort = { ...validData, teamName: 'АБ' };
    const resultShort = validateTeamRegistration(invalidShort);
    expect(resultShort.isValid).toBe(false);
    expect(resultShort.errors.teamName).toBeDefined();

    const invalidEmpty = { ...validData, teamName: '   ' };
    const resultEmpty = validateTeamRegistration(invalidEmpty);
    expect(resultEmpty.isValid).toBe(false);
    expect(resultEmpty.errors.teamName).toBe('Введите название команды');
  });

  it('fails if trackId is missing or unknown', () => {
    const noTrack = { ...validData, trackId: '' };
    const resultNoTrack = validateTeamRegistration(noTrack);
    expect(resultNoTrack.isValid).toBe(false);
    expect(resultNoTrack.errors.trackId).toBe('Выберите трек кейс-чемпионата');

    const wrongTrack = { ...validData, trackId: 'unknown_track' };
    const resultWrongTrack = validateTeamRegistration(wrongTrack);
    expect(resultWrongTrack.isValid).toBe(false);
    expect(resultWrongTrack.errors.trackId).toBeDefined();
  });

  it('fails if school is missing', () => {
    const noSchool = { ...validData, school: '   ' };
    const result = validateTeamRegistration(noSchool);
    expect(result.isValid).toBe(false);
    expect(result.errors.school).toBeDefined();
  });

  it('fails if city is missing', () => {
    const noCity = { ...validData, city: '' };
    const result = validateTeamRegistration(noCity);
    expect(result.isValid).toBe(false);
    expect(result.errors.city).toBeDefined();
  });

  it('fails if members list has no captain', () => {
    const noCaptain = {
      ...validData,
      members: [{ id: 'm1', name: 'Иван Сергеев', role: 'Баллистик' as const, grade: '11 класс' }],
    };
    const result = validateTeamRegistration(noCaptain);
    expect(result.isValid).toBe(false);
    expect(result.errors.members).toContain('Капитаном');
  });

  it('fails if any member name is empty', () => {
    const emptyMember = {
      ...validData,
      members: [
        { id: 'm1', name: 'Иван Сергеев', role: 'Капитан' as const, grade: '11 класс' },
        { id: 'm2', name: '   ', role: 'Баллистик' as const, grade: '10 класс' },
      ],
    };
    const result = validateTeamRegistration(emptyMember);
    expect(result.isValid).toBe(false);
    expect(result.memberErrors?.[1]?.name).toBeDefined();
  });

  it('fails if member email format is invalid', () => {
    const badEmail = {
      ...validData,
      members: [
        {
          id: 'm1',
          name: 'Иван Сергеев',
          role: 'Капитан' as const,
          grade: '11 класс',
          email: 'not-an-email',
        },
      ],
    };
    const result = validateTeamRegistration(badEmail);
    expect(result.isValid).toBe(false);
    expect(result.memberErrors?.[0]?.email).toBeDefined();
  });

  it('builds a proper Team object from form data', () => {
    const team = buildTeamFromFormData(validData);
    expect(team.name).toBe('Орион-Лицей');
    expect(team.track).toBe(CHAMPIONSHIP_TRACKS[0].id);
    expect(team.cubesatSpecs.format).toBe('3U');
    expect(team.members.length).toBe(2);
    expect(team.launchReadinessPercent).toBeGreaterThan(0);
  });

  it('correctly preserves existing team ID and stats when updating an existing team', () => {
    const existingTeam = {
      ...buildTeamFromFormData(validData),
      id: 'team_existing_999',
      totalScore: 88.5,
      launchReadinessPercent: 75,
      status: 'in_progress' as const,
    };

    const updatedFormData: TeamRegistrationFormData = {
      ...validData,
      teamName: 'Орион-Лицей Модернизированный',
      orbitAltitudeKm: 600,
    };

    const built = buildTeamFromFormData(updatedFormData);
    const merged = {
      ...existingTeam,
      ...built,
      id: existingTeam.id,
      name: updatedFormData.teamName,
      totalScore: existingTeam.totalScore,
      launchReadinessPercent: existingTeam.launchReadinessPercent,
      status: existingTeam.status,
    };

    expect(merged.id).toBe('team_existing_999');
    expect(merged.name).toBe('Орион-Лицей Модернизированный');
    expect(merged.totalScore).toBe(88.5);
    expect(merged.launchReadinessPercent).toBe(75);
    expect(merged.status).toBe('in_progress');
  });
});
