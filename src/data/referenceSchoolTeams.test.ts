import { describe, it, expect } from 'vitest';
import {
  REFERENCE_SCHOOL_TEAMS,
  getRandomCubeSatIdea,
  createTeamFromReference,
  generateAllReferenceTeams,
} from './referenceSchoolTeams';

describe('referenceSchoolTeams: Регистрация школьных команд из протокола', () => {
  it('содержит ровно 16 школьных команд Перми из официального референса', () => {
    expect(REFERENCE_SCHOOL_TEAMS.length).toBe(16);
    REFERENCE_SCHOOL_TEAMS.forEach((team, index) => {
      expect(team.orderNumber).toBe(index + 1);
      expect(team.school.length).toBeGreaterThan(5);
      expect(team.mentorName.length).toBeGreaterThan(5);
      expect(team.mentorEmail).toContain('@');
      expect(team.students.length).toBe(3);
      team.students.forEach((st) => {
        expect(st.name.length).toBeGreaterThan(3);
        expect(st.gradeText.length).toBeGreaterThan(1);
      });
    });
  });

  it('назначает учителю роль «Капитан», а школьникам — роли из идеи разработки CubeSat', () => {
    const testIdea = getRandomCubeSatIdea(42);
    expect(testIdea.roles.length).toBe(3);

    const team1 = createTeamFromReference(REFERENCE_SCHOOL_TEAMS[0], testIdea);

    // Учитель — первый в списке экипажа и имеет роль «Капитан»
    const teacherMember = team1.members[0];
    expect(teacherMember.name).toBe(REFERENCE_SCHOOL_TEAMS[0].mentorName);
    expect(teacherMember.role).toBe('Капитан');
    expect(team1.mentorName).toBe(REFERENCE_SCHOOL_TEAMS[0].mentorName);

    // 3 школьника имеют роли из выбранной идеи
    const studentMembers = team1.members.slice(1);
    expect(studentMembers.length).toBe(3);
    studentMembers.forEach((student, idx) => {
      expect(student.role).toBe(testIdea.roles[idx]);
      expect(student.name).toBe(REFERENCE_SCHOOL_TEAMS[0].students[idx].name);
    });
  });

  it('генерирует и регистрирует все 16 школьных команд с валидными ролями и спеками', () => {
    const allTeams = generateAllReferenceTeams();
    expect(allTeams.length).toBe(16);

    allTeams.forEach((team, idx) => {
      expect(team.name.length).toBeGreaterThan(2);
      expect(team.school).toBe(REFERENCE_SCHOOL_TEAMS[idx].school);

      // Проверка роли учителя
      const captain = team.members.find((m) => m.role === 'Капитан');
      expect(captain).toBeDefined();
      expect(captain?.name).toBe(REFERENCE_SCHOOL_TEAMS[idx].mentorName);

      // Проверка ролей школьников (должно быть 3 школьника)
      const students = team.members.filter((m) => m.role !== 'Капитан');
      expect(students.length).toBe(3);
      students.forEach((st) => {
        expect(st.role.length).toBeGreaterThan(2);
      });

      expect(team.cubesatSpecs.radioFreqMhz).toBe(437.425);
    });
  });
});
