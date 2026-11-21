/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Официальный реестр 16 школьных команд кейс-чемпионата по физике (г. Пермь)
 * из утвержденного протокола регистрации.
 *
 * Правила назначения:
 * 1. Учителю (наставнику-педагогу) назначается роль «Капитан».
 * 2. Идея разработки CubeSat выбирается из каталога миссий.
 * 3. 3 школьникам роли в проекте назначаются на основе выбранной идеи разработки (roles[0], roles[1], roles[2]).
 */

import { CUBESAT_IDEAS_CATALOG, CubeSatMissionIdea } from './cubesatMissionIdeas';
import { Team, TeamMember } from '../types';
import { createId } from '../utils/id';

export interface ReferenceStudent {
  name: string;
  gradeText: string;
}

export interface ReferenceSchoolTeam {
  orderNumber: number;
  school: string;
  city: string;
  suggestedTeamName: string;
  mentorName: string;
  mentorEmail: string;
  league: 'Старшая лига (10-11 классы)' | 'Юниорская лига (8-9 классы)';
  students: ReferenceStudent[];
}

export const REFERENCE_SCHOOL_TEAMS: ReferenceSchoolTeam[] = [
  {
    orderNumber: 1,
    school: 'МАОУ «Средняя общеобразовательная школа №81» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Зенит-81',
    mentorName: 'Бондаренко Дарья Сергеевна',
    mentorEmail: 'dsbondarenko@yandex.ru',
    league: 'Юниорская лига (8-9 классы)',
    students: [
      { name: 'Габдушев Марат Русланович', gradeText: '9А класс' },
      { name: 'Глушко Андрей Михайлович', gradeText: '9А класс' },
      { name: 'Вотинов Илья Иванович', gradeText: '8А класс' },
    ],
  },
  {
    orderNumber: 2,
    school: 'МАОУ «СОШ №108» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Импульс-108',
    mentorName: 'Муллина Наталья Петровна',
    mentorEmail: 'natalimp08@rambler.ru',
    league: 'Юниорская лига (8-9 классы)',
    students: [
      { name: 'Ибрагимов Марсель Ринатович', gradeText: '9б класс' },
      { name: 'Бессолицын Никита Владимирович', gradeText: '9б класс' },
      { name: 'Шрамов Данил Евгеньевич', gradeText: '9б класс' },
    ],
  },
  {
    orderNumber: 3,
    school: 'МАОУ «СИНТЕЗ» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Синтез-Космос',
    mentorName: 'Вылежнева Анастасия Викторовна',
    mentorEmail: 'an.vylezhneva@mail.ru',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Разепин Артём Анатольевич', gradeText: '11А класс' },
      { name: 'Тюрин Лев Вячеславович', gradeText: '10А класс' },
      { name: 'Шадрина Софья Сергеевна', gradeText: '9С класс' },
    ],
  },
  {
    orderNumber: 4,
    school: 'МАОУ «СОШ №116» г. Пермь',
    city: 'Пермь',
    suggestedTeamName: 'Восток-116',
    mentorName: 'Лахно Вероника Сергеевна',
    mentorEmail: 'lahnoveronika@yandex.ru',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Мукаев Кирилл Геннадьевич', gradeText: '11 класс' },
      { name: 'Неверов Станислав Юрьевич', gradeText: '11 класс' },
      { name: 'Шавкунов Константин Юрьевич', gradeText: '11 класс' },
    ],
  },
  {
    orderNumber: 5,
    school: 'МАОУ «Инженерная школа им. М. Ю. Цирульникова» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Цирульников-Аэро',
    mentorName: 'Габдрашитова Юлия Эльмировна',
    mentorEmail: 'Julypavlova@gmail.com',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Тпясцина Злата Владимировна', gradeText: '10 класс' },
      { name: 'Мальцев Никита Игоревич', gradeText: '10 класс' },
      { name: 'Клименко Кира Алексеевна', gradeText: '10 класс' },
    ],
  },
  {
    orderNumber: 6,
    school: 'МАОУ «СОШ №76» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Фотон-76',
    mentorName: 'Полякова Светлана Николаевна',
    mentorEmail: 'polyakova_68@mail.ru',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Липатов Тимофей Павлович', gradeText: '10 класс' },
      { name: 'Савинов Тимофей Владиславович', gradeText: '11 класс' },
      { name: 'Тынкасов Александр Алексеевич', gradeText: '11 класс' },
    ],
  },
  {
    orderNumber: 7,
    school: 'МАОУ «СОШ 127» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Вектор-127',
    mentorName: 'Мотовица Елена Анатольевна',
    mentorEmail: 'motoviza@school127.perm.ru',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Варанкин Артём Дмитриевич', gradeText: '10 класс' },
      { name: 'Пантелеймонов Кирилл Александрович', gradeText: '10 класс' },
      { name: 'Копысов Владимир Дмитриевич', gradeText: '9 класс' },
    ],
  },
  {
    orderNumber: 8,
    school: 'МАОУ «СОШ 14» г. Пермь',
    city: 'Пермь',
    suggestedTeamName: 'Альтаир-14',
    mentorName: 'Соловьева Анастасия Николаевна',
    mentorEmail: 'usovanastia@yandex.ru',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Чебыкина Алина Алексеевна', gradeText: '11а класс' },
      { name: 'Соковнин Владимир Максимович', gradeText: '11а класс' },
      { name: 'Оленец Арина Витальевна', gradeText: '11а класс' },
    ],
  },
  {
    orderNumber: 9,
    school: 'МАОУ «СОШ № 120» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Антарес-120',
    mentorName: 'Тахтеева Татьяна Васильевна',
    mentorEmail: 'lalar@inbox.ru',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Лобанов Дмитрий Максимович', gradeText: '9 класс' },
      { name: 'Мартемьянов Валентин Витальевич', gradeText: '10 класс' },
      { name: 'Мехрякова Василиса Романовна', gradeText: '11 класс' },
    ],
  },
  {
    orderNumber: 10,
    school: 'МАОУ «СОШ № 96» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Северная Корона-96',
    mentorName: 'Гаврилов Андрей Владимирович',
    mentorEmail: 'vantoz@mail.ru',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Зотин Егор', gradeText: '11 «и» класс' },
      { name: 'Васёв Ярослав', gradeText: '11 «и» класс' },
      { name: 'Рыжкова Кристина', gradeText: '10 «и» класс' },
    ],
  },
  {
    orderNumber: 11,
    school: 'МАОУ «Лицей №4» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Лицей-4 Квантум',
    mentorName: 'Еловикова Елена Валерьевна',
    mentorEmail: 'elovikovaev@mail.ru',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Некрасов Егор Дмитриевич', gradeText: '10 класс' },
      { name: 'Шилов Андрей Александрович', gradeText: '10 класс' },
      { name: 'Ковин Мирослав Романович', gradeText: '10 класс' },
    ],
  },
  {
    orderNumber: 12,
    school: 'МАОУ «СОШ №32 им.Я.А.Сборщикова» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Сборщиков-32',
    mentorName: 'Марченкова Галина Германовна',
    mentorEmail: 'art-show-ura@yandex.ru',
    league: 'Юниорская лига (8-9 классы)',
    students: [
      { name: 'Челпанов Платон', gradeText: '9 класс' },
      { name: 'Ломакина Софья', gradeText: '9 класс' },
      { name: 'Салихов Марк', gradeText: '10 класс' },
    ],
  },
  {
    orderNumber: 13,
    school: 'МАОУ «Флагман» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Флагман-Орбита',
    mentorName: 'Капитонова Оксана Вячеславовна',
    mentorEmail: 'o_v_kapitonova@mail.ru',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Ислямов Марат', gradeText: '10 класс' },
      { name: 'Тихонов Степан', gradeText: '10 класс' },
      { name: 'Гатауллина Аделина', gradeText: '10 класс' },
    ],
  },
  {
    orderNumber: 14,
    school: 'МАОУ «Гимназия №7» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Гимназия-7 Пульсар',
    mentorName: 'Михайлов Андрей Эдуардович',
    mentorEmail: 'andrejmihajlov3007@gmail.com',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Гусев Глеб', gradeText: '10 класс' },
      { name: 'Жумабаев Данат', gradeText: '10 класс' },
      { name: 'Лобанов Лев', gradeText: '10 класс' },
    ],
  },
  {
    orderNumber: 15,
    school: 'МАОУ «Техно-Школа им.В.П.Савиных» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Савиных-Техно',
    mentorName: 'Лапина Алёна Артемовна',
    mentorEmail: 'lapinaa983@gmail.com',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Гагарин Иван', gradeText: '10 класс' },
      { name: 'Шенятская Ярослава', gradeText: '11 класс' },
      { name: 'Туров Лев', gradeText: '9 класс' },
    ],
  },
  {
    orderNumber: 16,
    school: 'МАОУ «СОШ № 93» г. Перми',
    city: 'Пермь',
    suggestedTeamName: 'Новатор-93',
    mentorName: 'Сальников Сергей Дмитриевич',
    mentorEmail: 'serega2009bk@gmail.com',
    league: 'Старшая лига (10-11 классы)',
    students: [
      { name: 'Шагаев Даниил', gradeText: '11 ФМ класс' },
      { name: 'Черемных Амир', gradeText: '11 ИНЖ-1 класс' },
      { name: 'Сычев Артём', gradeText: '11 ИНЖ-2 класс' },
    ],
  },
];

/**
 * Выбирает случайную идею разработки CubeSat из каталога
 */
export function getRandomCubeSatIdea(preferredSeed?: number): CubeSatMissionIdea {
  if (preferredSeed !== undefined) {
    const idx = Math.abs(preferredSeed) % CUBESAT_IDEAS_CATALOG.length;
    return CUBESAT_IDEAS_CATALOG[idx];
  }
  const randomIdx = Math.floor(Math.random() * CUBESAT_IDEAS_CATALOG.length);
  return CUBESAT_IDEAS_CATALOG[randomIdx];
}

/**
 * Создает полную модель команды Team из записи референса и выбранной идеи CubeSat.
 * - Учителю назначается роль «Капитан».
 * - Школьникам назначаются роли из выбранной идеи (roles[0], roles[1], roles[2]).
 */
export function createTeamFromReference(
  refTeam: ReferenceSchoolTeam,
  idea: CubeSatMissionIdea = getRandomCubeSatIdea(refTeam.orderNumber * 19 + 7),
): Team {
  const is3U = idea.format === '3U' || !idea.format || idea.format === '6U';

  const members: TeamMember[] = [
    // Член экипажа 1: Учитель / Наставник с ролью «Капитан»
    {
      id: `m_teacher_${refTeam.orderNumber}`,
      name: refTeam.mentorName,
      role: 'Капитан',
      grade: 'Преподаватель-наставник (Капитан)',
      email: refTeam.mentorEmail,
    },
    // Члены экипажа 2..4: Школьники с ролями из идеи разработки
    ...refTeam.students.map((student, idx) => {
      const assignedRole =
        idea.roles[idx] || (idx === 0 ? 'Инженер' : idx === 1 ? 'Исследователь' : 'Программист');
      return {
        id: `m_student_${refTeam.orderNumber}_${idx + 1}`,
        name: student.name,
        role: assignedRole,
        grade: student.gradeText,
        email: `student.${idx + 1}@${refTeam.suggestedTeamName.toLowerCase().replace(/[^a-z0-9]/g, '')}.space`,
      };
    }),
  ];

  return {
    id: `team_school_${String(refTeam.orderNumber).padStart(2, '0')}`,
    name: refTeam.suggestedTeamName,
    school: refTeam.school,
    city: refTeam.city,
    league: refTeam.league,
    track: idea.trackId,
    trackTitle: `Трек: ${idea.category}`,
    mentorName: refTeam.mentorName,
    mentorTitle: 'Капитан команды (Наставник-педагог)',
    logo: refTeam.orderNumber % 2 === 0 ? '🛰️' : '🚀',
    description: `Проект CubeSat «${idea.title}». Направление: ${idea.category}. Полезная нагрузка: ${idea.payload}. Орбита: ${idea.orbit}.`,
    members,
    cubesatSpecs: {
      format:
        idea.format === '1U' || idea.format === '2U' || idea.format === '3U' ? idea.format : '3U',
      payloadType: `${idea.title} [${idea.payload}]`,
      orbitAltitudeKm: 520 + refTeam.orderNumber * 5,
      inclinationDeg: 97.4,
      powerBudgetWatts: is3U ? 14.5 : 4.8,
      radioFreqMhz: 437.425,
      massKg: is3U ? 3.4 : 1.3,
      satelliteName: `${refTeam.suggestedTeamName}-Sat`,
    },
    stageStatuses: {
      stage_1: 'approved',
      stage_2: refTeam.orderNumber <= 8 ? 'approved' : 'submitted',
      stage_3: refTeam.orderNumber <= 4 ? 'under_review' : 'draft',
      stage_4: 'not_started',
      stage_5: 'not_started',
    },
    stageScores: {
      stage_1: 85 + (refTeam.orderNumber % 15),
      stage_2: refTeam.orderNumber <= 8 ? 80 + (refTeam.orderNumber % 18) : 0,
      stage_3: 0,
      stage_4: 0,
      stage_5: 0,
    },
    totalScore:
      85 +
      (refTeam.orderNumber % 15) +
      (refTeam.orderNumber <= 8 ? 80 + (refTeam.orderNumber % 18) : 0),
    rank: refTeam.orderNumber,
    badges: [
      'Школьный экипаж',
      refTeam.league === 'Юниорская лига (8-9 классы)' ? 'Юниорская лига' : 'Старшая лига',
      idea.category,
    ],
    launchReadinessPercent: 40 + ((refTeam.orderNumber * 3) % 45),
  };
}

/**
 * Автоматически генерирует и регистрирует все 16 школьных команд из референса
 * со случайными идеями разработки из банка CubeSat и ролями школьников.
 */
export function generateAllReferenceTeams(): Team[] {
  return REFERENCE_SCHOOL_TEAMS.map((refTeam, idx) => {
    // Детерминированный, но разнообразный выбор идей со смещением по каталогу 340 идей
    const seed = (idx + 1) * 21 + 13;
    const idea = getRandomCubeSatIdea(seed);
    return createTeamFromReference(refTeam, idea);
  });
}
