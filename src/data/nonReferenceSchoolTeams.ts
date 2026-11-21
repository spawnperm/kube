/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Каталог школьных команд Перми, не входящих в исходный референс из 16 школ,
 * для регистрации новых образовательных учреждений с учителем-капитаном и учениками.
 */

import type { CubeSatMissionIdea } from './cubesatMissionIdeas';
import { TeamMember } from '../types';

export interface NonReferenceStudent {
  name: string;
  gradeText: string;
}

export interface NonReferenceSchoolTeam {
  id: string;
  school: string;
  city: string;
  suggestedTeamName: string;
  mentorName: string;
  mentorEmail: string;
  mentorPhone?: string;
  league: 'Старшая лига (10-11 классы)' | 'Юниорская лига (8-9 классы)';
  students: NonReferenceStudent[];
  badge: string;
}

export const NON_REFERENCE_SCHOOL_TEAMS: NonReferenceSchoolTeam[] = [
  {
    id: 'new_school_145',
    school: 'МАОУ «СОШ № 145 с аэрокосмическим профилем» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Космос-145',
    mentorName: 'Николаев Валерий Петрович',
    mentorEmail: 'nikolaev.v@school145.perm.space',
    league: 'Старшая лига (10-11 классы)',
    badge: 'Аэрокосмический класс',
    students: [
      { name: 'Гагарин Кирилл Сергеевич', gradeText: '10 «Космос» класс' },
      { name: 'Орлова Полина Михайловна', gradeText: '10 «Космос» класс' },
      { name: 'Дмитриев Глеб Андреевич', gradeText: '11 «Аэро» класс' },
    ],
  },
  {
    id: 'new_school_gym33',
    school: 'МАОУ «Гимназия № 33» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Вектор-33',
    mentorName: 'Кузнецова Елена Михайловна',
    mentorEmail: 'kuznetsova.e@gym33.perm.space',
    league: 'Старшая лига (10-11 классы)',
    badge: 'Физмат профиль',
    students: [
      { name: 'Смирнов Арсений Денисович', gradeText: '10А физмат' },
      { name: 'Попова Елизавета Андреевна', gradeText: '10А физмат' },
      { name: 'Васильев Максим Игоревич', gradeText: '11ФМ класс' },
    ],
  },
  {
    id: 'new_school_lyc1',
    school: 'МАОУ «Лицей № 1» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Квант-Лицей-1',
    mentorName: 'Белов Александр Николаевич',
    mentorEmail: 'belov.a@lyceum1.perm.space',
    league: 'Старшая лига (10-11 классы)',
    badge: 'Инженерный профиль',
    students: [
      { name: 'Королев Владислав Романович', gradeText: '11 Инж-1' },
      { name: 'Михайлова София Павловна', gradeText: '10Б физмат' },
      { name: 'Захаров Артем Константинович', gradeText: '11 Инж-1' },
    ],
  },
  {
    id: 'new_school_vzlet',
    school: 'МАОУ «Инженерная школа «Взлёт» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Взлёт-Аэро',
    mentorName: 'Семенов Денис Владимирович',
    mentorEmail: 'semenov.d@vzlet.perm.space',
    league: 'Юниорская лига (8-9 классы)',
    badge: 'Авиа- и ракетостроение',
    students: [
      { name: 'Федоров Егор Антонович', gradeText: '9В инженерный' },
      { name: 'Тарасова Алена Викторовна', gradeText: '9В инженерный' },
      { name: 'Морозов Даниил Ильич', gradeText: '8Б тех' },
    ],
  },
  {
    id: 'new_school_gym17',
    school: 'МАОУ «Гимназия № 17» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Эврика-17',
    mentorName: 'Романов Виктор Сергеевич',
    mentorEmail: 'romanov.v@gym17.perm.space',
    league: 'Старшая лига (10-11 классы)',
    badge: 'Академический лицей',
    students: [
      { name: 'Павлов Никита Александрович', gradeText: '11ФМ класс' },
      { name: 'Козлова Вероника Дмитриевна', gradeText: '10А класс' },
      { name: 'Лебедев Илья Сергеевич', gradeText: '11ФМ класс' },
    ],
  },
  {
    id: 'new_school_lyc10',
    school: 'МАОУ «Лицей № 10 при НИУ ВШЭ» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Сириус-10',
    mentorName: 'Макарова Ольга Игоревна',
    mentorEmail: 'makarova.o@hse10.perm.space',
    league: 'Старшая лига (10-11 классы)',
    badge: 'ИТ и электроника',
    students: [
      { name: 'Борисов Родион Матвеевич', gradeText: '10 IT класс' },
      { name: 'Алексеева Дарья Сергеевна', gradeText: '10 IT класс' },
      { name: 'Григорьев Семен Олегович', gradeText: '11 Физтех' },
    ],
  },
  {
    id: 'new_school_mastergrad',
    school: 'МАОУ «СОШ «Мастерград» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Мастерград-Орбита',
    mentorName: 'Соловьев Юрий Андреевич',
    mentorEmail: 'soloviev.y@mastergrad.perm.space',
    league: 'Юниорская лига (8-9 классы)',
    badge: 'Архитектура и 3D-моделирование',
    students: [
      { name: 'Волков Тимофей Романович', gradeText: '9 Архи класс' },
      { name: 'Медведева Ксения Алексеевна', gradeText: '9 Архи класс' },
      { name: 'Кузьмин Андрей Денисович', gradeText: '8 Техно класс' },
    ],
  },
  {
    id: 'new_school_132',
    school: 'МАОУ «СОШ № 132 с углубленным изучением экологии» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Биосфера-132',
    mentorName: 'Воронина Ирина Геннадьевна',
    mentorEmail: 'voronina.i@school132.perm.space',
    league: 'Юниорская лига (8-9 классы)',
    badge: 'Дистанционное зондирование Земли',
    students: [
      { name: 'Беляев Матвей Максимович', gradeText: '9 Био класс' },
      { name: 'Чернов Артур Владиславович', gradeText: '9 Хим класс' },
      { name: 'Сорокина Арина Михайловна', gradeText: '8 Эко класс' },
    ],
  },
];

/**
 * Создает список членов экипажа для новой школы с назначением учителя Капитаном
 * и ролей ученикам на основе выбранной CubeSat идеи
 */
export function buildMembersFromNonReferenceSchool(
  schoolTeam: NonReferenceSchoolTeam,
  idea: CubeSatMissionIdea,
): TeamMember[] {
  return [
    {
      id: `m_teacher_${schoolTeam.id}`,
      name: schoolTeam.mentorName,
      role: 'Капитан',
      grade: 'Преподаватель-наставник (Капитан)',
      email: schoolTeam.mentorEmail,
    },
    ...schoolTeam.students.map((st, idx) => ({
      id: `m_student_${schoolTeam.id}_${idx + 1}`,
      name: st.name,
      role:
        idea.roles[idx] || (idx === 0 ? 'Инженер' : idx === 1 ? 'Исследователь' : 'Программист'),
      grade: st.gradeText,
      email: `student.${idx + 1}@${schoolTeam.suggestedTeamName.toLowerCase().replace(/[^a-z0-9]/g, '')}.space`,
    })),
  ];
}
