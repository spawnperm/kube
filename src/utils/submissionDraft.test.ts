import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveSubmissionDraft,
  loadSubmissionDraft,
  clearSubmissionDraft,
  hasSubmissionDraft,
  getDraftStorageKey,
} from './submissionDraft';

describe('submissionDraft', () => {
  const teamId = 'team_orion_3';
  const stageId = 'stage_2';

  beforeEach(() => {
    localStorage.clear();
  });

  it('generates proper storage key', () => {
    expect(getDraftStorageKey(teamId, stageId)).toBe('kosmos_draft_team_orion_3_stage_2');
  });

  it('saves and loads a submission draft correctly', () => {
    const draftPayload = {
      title: 'Расчет энергобаланса 3U',
      summary: 'Суммарная суточная емкость 20 Вт·ч',
      details: 'Использованы солнечные элементы GaAs с КПД 29.5%.',
      repoUrl: 'https://github.com/orion3/eps',
      calcDeltaV: 150,
      calcPower: 22.4,
      calcMargin: 11.2,
      uploadedFiles: [{ name: 'power_budget.pdf', size: '2.1 МБ', type: 'application/pdf' }],
    };

    const saved = saveSubmissionDraft(teamId, stageId, draftPayload);
    expect(saved).not.toBeNull();
    expect(saved?.title).toBe('Расчет энергобаланса 3U');
    expect(saved?.savedAt).toBeDefined();

    const loaded = loadSubmissionDraft(teamId, stageId);
    expect(loaded).not.toBeNull();
    expect(loaded?.title).toBe(draftPayload.title);
    expect(loaded?.calcPower).toBe(22.4);
    expect(loaded?.uploadedFiles.length).toBe(1);
    expect(hasSubmissionDraft(teamId, stageId)).toBe(true);
  });

  it('clears draft from localStorage', () => {
    saveSubmissionDraft(teamId, stageId, {
      title: 'Тест',
      summary: 'Описание',
      details: 'Детали',
      repoUrl: '',
      calcDeltaV: 100,
      calcPower: 10,
      calcMargin: 5,
      uploadedFiles: [],
    });

    expect(hasSubmissionDraft(teamId, stageId)).toBe(true);
    clearSubmissionDraft(teamId, stageId);
    expect(hasSubmissionDraft(teamId, stageId)).toBe(false);
    expect(loadSubmissionDraft(teamId, stageId)).toBeNull();
  });

  it('returns null if no draft exists', () => {
    expect(loadSubmissionDraft('non_existent', 'stage_1')).toBeNull();
    expect(hasSubmissionDraft('non_existent', 'stage_1')).toBe(false);
  });
});
