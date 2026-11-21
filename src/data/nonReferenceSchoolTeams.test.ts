/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  NON_REFERENCE_SCHOOL_TEAMS,
  buildMembersFromNonReferenceSchool,
} from './nonReferenceSchoolTeams';
import { getRandomCubeSatIdea, REFERENCE_SCHOOL_TEAMS } from './referenceSchoolTeams';

describe('Non-reference School Teams Catalog', () => {
  it('contains schools that are NOT in the 16 reference list', () => {
    expect(NON_REFERENCE_SCHOOL_TEAMS.length).toBeGreaterThan(0);

    const refSchoolNames = new Set(REFERENCE_SCHOOL_TEAMS.map((s) => s.school.toLowerCase()));

    for (const nonRef of NON_REFERENCE_SCHOOL_TEAMS) {
      expect(refSchoolNames.has(nonRef.school.toLowerCase())).toBe(false);
      expect(nonRef.students.length).toBe(3);
      expect(nonRef.mentorName).toBeTruthy();
      expect(nonRef.suggestedTeamName).toBeTruthy();
    }
  });

  it('correctly builds members with teacher as Captain and students assigned idea roles', () => {
    const school = NON_REFERENCE_SCHOOL_TEAMS[0];
    const idea = getRandomCubeSatIdea();
    const members = buildMembersFromNonReferenceSchool(school, idea);

    expect(members.length).toBe(4); // 1 teacher + 3 students
    expect(members[0].role).toBe('Капитан');
    expect(members[0].name).toBe(school.mentorName);

    // 3 students have distinct roles
    expect(members[1].name).toBe(school.students[0].name);
    expect(members[2].name).toBe(school.students[1].name);
    expect(members[3].name).toBe(school.students[2].name);
  });
});
