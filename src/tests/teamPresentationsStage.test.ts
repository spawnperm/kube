/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { COMPETITION_STAGES } from '@/src/App';

describe('Stage 8: Team Presentations Review (3 Slides)', () => {
  it('registers Stage 8 in COMPETITION_STAGES list with id presentations_review', () => {
    const stage8 = COMPETITION_STAGES.find((s) => s.num === 8);
    expect(stage8).toBeDefined();
    expect(stage8?.id).toBe('presentations_review');
    expect(stage8?.screenId).toBe('presentations');
    expect(stage8?.title).toContain('3 слайда');
  });

  it('contains all 8 competition stages in sequence', () => {
    expect(COMPETITION_STAGES.length).toBe(8);
    const stageNumbers = COMPETITION_STAGES.map((s) => s.num);
    expect(stageNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('maps presentations stage to valid screenId', () => {
    const stage = COMPETITION_STAGES.find((s) => s.screenId === 'presentations');
    expect(stage).toBeDefined();
    expect(stage?.badge).toBeDefined();
    expect(stage?.description).toContain('3 регламентных слайдов');
  });
});
