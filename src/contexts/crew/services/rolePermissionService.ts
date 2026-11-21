import { UserRole, UserProfile } from '@/src/shared/types';
import { DEMO_PROFILES } from '@/src/shared/data/mockData';
import { CRM_TEAMS_DATABASE, CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';

/**
 * 6-уровневая ролевая модель космического кейс-чемпионата «КОСМОПОРТ»
 * по мере возрастания прав доступа:
 * 1. Пассажир (guest) — псевдоним для гостя (незарегистрированные пользователи на портале)
 * 2. Член экипажа (participant) — псевдоним для школьника, члена команды школьной
 * 3. Командир корабля (mentor) — псевдоним для наставника или учителя
 * 4. Лётный Эксперт (expert) — эксперт жюри / соцпартнёр
 * 5. Командир ЦУП (organizer) — псевдоним для организатора
 * 6. Координатор ЦУП (admin) — псевдоним для админа
 */

export const ROLE_HIERARCHY_LEVELS: Record<UserRole, number> = {
  guest: 1, // Пассажир (гость)
  participant: 2, // Член экипажа (школьник)
  mentor: 3, // Командир корабля (наставник / учитель)
  expert: 4, // Лётный Эксперт (жюри)
  organizer: 5, // Командир ЦУП (организатор)
  admin: 6, // Координатор ЦУП (администратор)
};

export interface RoleInfo {
  role: UserRole;
  alias: string;
  originalRole: string;
  shortAlias: string;
  desc: string;
  badgeColor: string;
  level: number;
}

export const ROLES_CONFIG: Record<UserRole, RoleInfo> = {
  admin: {
    role: 'admin',
    alias: 'Координатор ЦУП',
    originalRole: 'Администратор',
    shortAlias: 'Координатор',
    desc: 'Псевдоним для админа. Может видеть всё, менять все роли, заходить под любым пользователем портала.',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    level: 6,
  },
  organizer: {
    role: 'organizer',
    alias: 'Командир ЦУП',
    originalRole: 'Организатор',
    shortAlias: 'Командир ЦУП',
    desc: 'Псевдоним для организатора. Может менять роли только командирам кораблей и членам команды.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    level: 5,
  },
  expert: {
    role: 'expert',
    alias: 'Лётный Эксперт',
    originalRole: 'Эксперт жюри',
    shortAlias: 'Эксперт',
    desc: 'Псевдоним для эксперта. Экспертиза физико-математических расчетов, оценка 3-х слайдов.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    level: 4,
  },
  mentor: {
    role: 'mentor',
    alias: 'Командир корабля',
    originalRole: 'Наставник / Учитель',
    shortAlias: 'Капитан',
    desc: 'Псевдоним для наставника или учителя. Может менять роли только членам своей команды.',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    level: 3,
  },
  participant: {
    role: 'participant',
    alias: 'Член экипажа',
    originalRole: 'Школьник',
    shortAlias: 'Экипаж',
    desc: 'Псевдоним для школьника, члена команды. Роли менять не может.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    level: 2,
  },
  guest: {
    role: 'guest',
    alias: 'Пассажир',
    originalRole: 'Гость',
    shortAlias: 'Пассажир',
    desc: 'Псевдоним для гостя. Незарегистрированные пользователи на портале (режим ознакомления).',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    level: 1,
  },
};

/**
 * Проверка права входа (имперсонации) под другими пользователями
 * Доступно исключительно Координатору ЦУП (Администратору) Смирнову Александру Анатольевичу (info@mirovisor.com / admin)
 */
export function canImpersonateUsers(currentUser: UserProfile): boolean {
  return currentUser.role === 'admin' || currentUser.email === 'info@mirovisor.com';
}

/**
 * Проверка права смены роли:
 * - Админ может менять все роли
 * - Организатор может менять роли только командирам кораблей (mentor) и членам команды (participant, guest)
 * - Командир может менять роли только членам команды (participant, guest)
 * - Члены команды и пассажиры роли менять не могут
 */
export function canChangeUserRole(
  currentUser: UserProfile,
  targetUserCurrentRole: UserRole,
  newRoleToAssign: UserRole,
): boolean {
  if (canImpersonateUsers(currentUser)) {
    return true; // Админ может менять любые роли на любые
  }

  if (currentUser.role === 'organizer') {
    // Организатор может менять только командирам (mentor) и членам команды (participant, guest)
    const isTargetAllowed =
      targetUserCurrentRole === 'mentor' ||
      targetUserCurrentRole === 'participant' ||
      targetUserCurrentRole === 'guest';
    const isNewRoleAllowed =
      newRoleToAssign === 'mentor' ||
      newRoleToAssign === 'participant' ||
      newRoleToAssign === 'guest';
    return isTargetAllowed && isNewRoleAllowed;
  }

  if (currentUser.role === 'mentor') {
    // Командир корабля может менять роли только членам команды
    const isTargetAllowed =
      targetUserCurrentRole === 'participant' || targetUserCurrentRole === 'guest';
    const isNewRoleAllowed = newRoleToAssign === 'participant' || newRoleToAssign === 'guest';
    return isTargetAllowed && isNewRoleAllowed;
  }

  // Члены команды и пассажиры роли менять не могут
  return false;
}

/**
 * Список ролей, которые текущий пользователь имеет право назначать
 */
export function getAllowedAssignableRoles(currentUser: UserProfile): UserRole[] {
  if (canImpersonateUsers(currentUser)) {
    return ['admin', 'organizer', 'expert', 'mentor', 'participant', 'guest'];
  }
  if (currentUser.role === 'organizer') {
    return ['mentor', 'participant', 'guest'];
  }
  if (currentUser.role === 'mentor') {
    return ['participant', 'guest'];
  }
  return [];
}

/**
 * Проверка права редактирования карточки команды:
 * Редактировать карточку команды могут пользователи с ролями:
 * - Администратор (admin)
 * - Организатор (organizer)
 * - Капитан команды (mentor / captain)
 */
export function canEditTeamCard(
  currentUser?: UserProfile | null,
  _team?: CrmTeamRecord | null,
): boolean {
  if (!currentUser) return false;

  // 1. Администратор
  if (currentUser.role === 'admin' || canImpersonateUsers(currentUser)) {
    return true;
  }

  // 2. Организатор
  if (currentUser.role === 'organizer') {
    return true;
  }

  // 3. Капитан команды
  if (currentUser.role === 'mentor' || (currentUser.role as any) === 'captain') {
    return true;
  }

  return false;
}

/**
 * Полный реестр пользователей портала для личного кабинета администратора Mirovisor
 * Позволяет в 1 клик авторизоваться под любым командиром, школьником, экспертом или организатором
 */
export function getAllPortalUsers(): Array<{
  profile: UserProfile;
  teamId?: string;
  teamName?: string;
  category: 'admin' | 'organizer' | 'expert' | 'mentor' | 'participant' | 'guest';
}> {
  const users: Array<{
    profile: UserProfile;
    teamId?: string;
    teamName?: string;
    category: 'admin' | 'organizer' | 'expert' | 'mentor' | 'participant' | 'guest';
  }> = [];

  // 1. Добавляем базовые демо-профили
  Object.values(DEMO_PROFILES).forEach((p) => {
    users.push({
      profile: p,
      teamId:
        p.assignedTeamId ||
        (p.role === 'mentor' || p.role === 'participant' ? 'crm-team-01' : undefined),
      teamName:
        p.assignedTeamName ||
        (p.role === 'mentor' || p.role === 'participant' ? 'Восток-81' : undefined),
      category: p.role,
    });
  });

  // 2. Добавляем командиров кораблей (16 наставников) из CRM реестра
  CRM_TEAMS_DATABASE.forEach((team) => {
    // Проверяем, не добавлен ли уже этот наставник
    const mentorEmail = team.mentorEmail.toLowerCase();
    const alreadyAdded = users.some((u) => u.profile.email.toLowerCase() === mentorEmail);
    if (!alreadyAdded) {
      users.push({
        profile: {
          id: `usr-mentor-${team.id}`,
          name: team.mentorName,
          email: team.mentorEmail,
          role: 'mentor',
          school: team.school,
          city: team.city,
          phone: team.mentorPhone || '+7 (900) 000-00-00',
          photoConsent: true,
          bio: `Командир космического корабля «${team.shipName}». Преподаватель ${team.school}. Куратор школьной команды наноспутника ${team.cubesatName} (${team.cubesatFormat}).`,
          statusMessage: `Командир корабля «${team.shipName}». Экипаж готовится к полету 🛰️`,
          assignedTeamId: team.id,
          assignedTeamName: team.shipName,
          xp: 650,
          level: 5,
          rankTitle: 'Командир корабля (Наставник)',
          energyCrystals: 120,
          streakDays: 6,
          badges: ['first_launch', 'kepler_master', 'top_curator'],
          socialPosts: [],
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(team.mentorName)}`,
        },
        teamId: team.id,
        teamName: team.shipName,
        category: 'mentor',
      });
    }

    // 3. Добавляем членов экипажей (школьников) из CRM реестра
    team.students.forEach((student, idx) => {
      const studentEmail = `${student.name.toLowerCase().replace(/[^a-zа-я0-9]/g, '.')}@kosmoport-team.ru`;
      const studentAlready = users.some((u) => u.profile.name === student.name);
      if (!studentAlready) {
        users.push({
          profile: {
            id: `usr-student-${team.id}-${idx}`,
            name: student.name,
            email: studentEmail,
            role: 'participant',
            school: team.school,
            city: team.city,
            photoConsent: true,
            bio: `${student.roleTitle} корабля «${team.shipName}». Ученик ${student.gradeText}, ${team.school}. Решает задачу по дисциплине «${student.discipline}».`,
            statusMessage: `Бортовой ${student.roleTitle}. Выполняю расчеты для КубСата ${team.cubesatName} 🚀`,
            assignedTeamId: team.id,
            assignedTeamName: team.shipName,
            xp: 320 + idx * 40,
            level: 3 + idx,
            rankTitle: `Член экипажа (${student.roleTitle})`,
            energyCrystals: 60,
            streakDays: 4,
            badges: ['first_launch', 'voice_pilot'],
            socialPosts: [],
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(student.name)}`,
          },
          teamId: team.id,
          teamName: team.shipName,
          category: 'participant',
        });
      }
    });
  });

  return users;
}

export type UnifiedScreenId =
  | 'stage_director'
  | 'starmap'
  | 'ship'
  | 'inspectors'
  | 'mcc'
  | 'admin'
  | 'wiki'
  | 'mascot'
  | 'quiz'
  | 'team'
  | 'submissions'
  | 'telemetry'
  | 'spacemap'
  | 'spacepi'
  | 'jury'
  | 'analytics'
  | 'leaderboard'
  | 'certificates'
  | 'reports'
  | 'forum'
  | 'education'
  | 'mentor'
  | 'cosmoport';

export interface RoleMenuItemDefinition {
  id: UnifiedScreenId;
  label: string;
  sublabel: string;
  category: 'desks' | 'orbit' | 'jury_mcc' | 'knowledge_community';
  categoryLabel: string;
  badge?: string;
  badgeColor?: string;
  allowedRoles: UserRole[];
  order: number;
}

export interface QuickToolItemDefinition {
  id: 'cad_blueprint' | 'voice_assistant' | 'customizer_widgets' | 'task_directory';
  label: string;
  sublabel: string;
  badge: string;
  color: string;
  allowedRoles: UserRole[];
}

/**
 * Единый реестр всех 23 экранов платформы КОСМОПОРТ с матрицей ролевого доступа RBAC
 */
export const UNIFIED_SCREEN_DEFINITIONS: RoleMenuItemDefinition[] = [
  // 1. ПУЛЬТЫ УПРАВЛЕНИЯ
  {
    id: 'stage_director',
    label: 'Пульт сцены',
    sublabel: 'Управление экранами и трансляцией',
    category: 'desks',
    categoryLabel: 'Пульты управления',
    badge: 'Live',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    allowedRoles: ['admin', 'organizer'],
    order: 1,
  },
  {
    id: 'ship',
    label: '3D борт пульт',
    sublabel: 'CubeSat 3U интерактивная компоновка',
    category: 'desks',
    categoryLabel: 'Пульты управления',
    badge: '3D',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    allowedRoles: ['admin', 'organizer', 'mentor', 'participant', 'guest'],
    order: 2,
  },
  {
    id: 'team',
    label: 'Дашборд & Гант',
    sublabel: 'Спринты команды и статус миссии',
    category: 'desks',
    categoryLabel: 'Пульты управления',
    badge: 'Гант',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    allowedRoles: ['admin', 'organizer', 'mentor', 'participant'],
    order: 3,
  },
  {
    id: 'submissions',
    label: '3 Этапа кейса',
    sublabel: 'Сдача презентаций и верификация',
    category: 'desks',
    categoryLabel: 'Пульты управления',
    badge: 'Этапы',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant'],
    order: 4,
  },
  {
    id: 'quiz',
    label: 'Квиз с AI',
    sublabel: 'Орбитальный экзамен и набор XP',
    category: 'desks',
    categoryLabel: 'Пульты управления',
    badge: '+XP',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant', 'guest'],
    order: 5,
  },

  // 2. ОРБИТА И ТЕЛЕМЕТРИЯ
  {
    id: 'telemetry',
    label: 'Телеметрия & Маяк',
    sublabel: 'AX.25 437.425 МГц НОО пакеты',
    category: 'orbit',
    categoryLabel: 'Орбита и телеметрия',
    badge: 'Live',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    allowedRoles: ['admin', 'organizer', 'mentor', 'participant', 'guest'],
    order: 6,
  },
  {
    id: 'spacemap',
    label: 'Орбитальная карта',
    sublabel: '2D/3D трекинг спутников',
    category: 'orbit',
    categoryLabel: 'Орбита и телеметрия',
    badge: '2D/3D',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant', 'guest'],
    order: 7,
  },
  {
    id: 'spacepi',
    label: 'Space-Pi & СОНИКС',
    sublabel: 'Сеть наземных станций и запуски',
    category: 'orbit',
    categoryLabel: 'Орбита и телеметрия',
    badge: 'СОНИКС',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant', 'guest'],
    order: 8,
  },
  {
    id: 'starmap',
    label: 'Звёздная карта',
    sublabel: 'Главный космический сектор',
    category: 'orbit',
    categoryLabel: 'Орбита и телеметрия',
    badge: 'Обзор',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant', 'guest'],
    order: 9,
  },

  // 3. ЭКСПЕРТИЗА, ЖЮРИ И ЦУП
  {
    id: 'admin',
    label: 'Координатор ЦУП',
    sublabel: 'Системный DevOps & имперсонация',
    category: 'jury_mcc',
    categoryLabel: 'Экспертиза и ЦУП',
    badge: 'Admin',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    allowedRoles: ['admin'],
    order: 10,
  },
  {
    id: 'mcc',
    label: 'ЦУП Оргкомитет',
    sublabel: 'Реестр 16 команд и администрирование',
    category: 'jury_mcc',
    categoryLabel: 'Экспертиза и ЦУП',
    badge: 'CRM',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    allowedRoles: ['admin', 'organizer'],
    order: 11,
  },
  {
    id: 'inspectors',
    label: 'Инспекторы (Эксперты)',
    sublabel: 'Пульт голосования и проверка физики',
    category: 'jury_mcc',
    categoryLabel: 'Экспертиза и ЦУП',
    badge: 'Судейство',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    allowedRoles: ['admin', 'organizer', 'expert'],
    order: 12,
  },
  {
    id: 'jury',
    label: 'Оценки жюри',
    sublabel: 'Ведомости и критерии чемпионата',
    category: 'jury_mcc',
    categoryLabel: 'Экспертиза и ЦУП',
    badge: 'Баллы',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    allowedRoles: ['admin', 'organizer', 'expert'],
    order: 13,
  },
  {
    id: 'reports',
    label: 'PDF Ведомости',
    sublabel: 'Итоговые протоколы судейства',
    category: 'jury_mcc',
    categoryLabel: 'Экспертиза и ЦУП',
    badge: 'PDF',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    allowedRoles: ['admin', 'organizer', 'expert'],
    order: 14,
  },

  // 4. ЗНАНИЯ, АНАЛИТИКА И ОБЩЕНИЕ
  {
    id: 'mascot',
    label: 'Леший',
    sublabel: 'Бортовой компьютер на базе Google Gemini',
    category: 'knowledge_community',
    categoryLabel: 'Знания и сообщество',
    badge: 'Gemini',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    allowedRoles: ['admin', 'organizer', 'mentor', 'participant', 'guest'],
    order: 15,
  },
  {
    id: 'wiki',
    label: 'LLM-Wiki',
    sublabel: 'База знаний по баллистике и CubeSat',
    category: 'knowledge_community',
    categoryLabel: 'Знания и сообщество',
    badge: 'Теория',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant', 'guest'],
    order: 16,
  },
  {
    id: 'analytics',
    label: 'Аналитика & SPI',
    sublabel: 'Индекс освоенного объема и графики',
    category: 'knowledge_community',
    categoryLabel: 'Знания и сообщество',
    badge: 'SPI',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor'],
    order: 17,
  },
  {
    id: 'leaderboard',
    label: 'Рейтинг команд',
    sublabel: 'Турнирная таблица и баллы',
    category: 'knowledge_community',
    categoryLabel: 'Знания и сообщество',
    badge: 'Топ-16',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant', 'guest'],
    order: 18,
  },
  {
    id: 'certificates',
    label: 'Сертификаты (PDF)',
    sublabel: 'Векторная генерация дипломов',
    category: 'knowledge_community',
    categoryLabel: 'Знания и сообщество',
    badge: 'Дипломы',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    allowedRoles: ['admin', 'organizer', 'mentor', 'participant'],
    order: 19,
  },
  {
    id: 'mentor',
    label: 'Кабинет наставника',
    sublabel: 'Чат с экипажем и кураторство',
    category: 'knowledge_community',
    categoryLabel: 'Знания и сообщество',
    badge: 'Куратор',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    allowedRoles: ['admin', 'organizer', 'mentor', 'participant'],
    order: 20,
  },
  {
    id: 'forum',
    label: 'Форум участников',
    sublabel: 'Q&A, обсуждения и обмен опытом',
    category: 'knowledge_community',
    categoryLabel: 'Знания и сообщество',
    badge: 'Чат',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant'],
    order: 21,
  },
  {
    id: 'education',
    label: 'Обучение & Физика',
    sublabel: 'Видеолекции и методические пособия',
    category: 'knowledge_community',
    categoryLabel: 'Знания и сообщество',
    badge: 'Курсы',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant', 'guest'],
    order: 22,
  },
  {
    id: 'cosmoport',
    label: 'Хаб Космопорта',
    sublabel: 'Официальный регламент и документация',
    category: 'knowledge_community',
    categoryLabel: 'Знания и сообщество',
    badge: 'Инфо',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant', 'guest'],
    order: 23,
  },
];

/**
 * Инструменты быстрого действия и их ролевая доступность
 */
export const QUICK_TOOL_DEFINITIONS: QuickToolItemDefinition[] = [
  {
    id: 'cad_blueprint',
    label: '3D CAD',
    sublabel: 'Чертеж компоновки CubeSat 3U',
    badge: 'CAD',
    color: 'text-cyan-400',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant', 'guest'],
  },
  {
    id: 'voice_assistant',
    label: 'Голос ЦУП',
    sublabel: 'AI-штурман с голосовым вводом',
    badge: 'AI',
    color: 'text-emerald-400',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant', 'guest'],
  },
  {
    id: 'customizer_widgets',
    label: 'Виджеты',
    sublabel: 'Настройка персонального дашборда',
    badge: 'Настройка',
    color: 'text-amber-400',
    allowedRoles: ['admin', 'organizer', 'mentor', 'participant'],
  },
  {
    id: 'task_directory',
    label: 'Справочник кейсов',
    sublabel: 'Банк 500 космических задач',
    badge: '500',
    color: 'text-indigo-400',
    allowedRoles: ['admin', 'organizer', 'expert', 'mentor', 'participant', 'guest'],
  },
];

/**
 * Проверяет, доступен ли экран для указанной роли
 */
export function isScreenAllowedForRole(screenId: UnifiedScreenId, role: UserRole): boolean {
  const item = UNIFIED_SCREEN_DEFINITIONS.find((def) => def.id === screenId);
  if (!item) return false;
  return item.allowedRoles.includes(role);
}

/**
 * Возвращает список всех экранов, разрешенных для роли
 */
export function getAllowedScreensForRole(role: UserRole): UnifiedScreenId[] {
  return UNIFIED_SCREEN_DEFINITIONS.filter((def) => def.allowedRoles.includes(role)).map(
    (def) => def.id,
  );
}

/**
 * Возвращает отфильтрованный список пунктов меню для конкретной роли
 */
export function getMenuItemsForRole(role: UserRole): RoleMenuItemDefinition[] {
  return UNIFIED_SCREEN_DEFINITIONS.filter((def) => def.allowedRoles.includes(role));
}

/**
 * Проверяет, доступен ли быстрый инструмент для роли
 */
export function isToolAllowedForRole(toolId: string, role: UserRole): boolean {
  const tool = QUICK_TOOL_DEFINITIONS.find((t) => t.id === toolId);
  if (!tool) return false;
  return tool.allowedRoles.includes(role);
}

/**
 * Возвращает разрешенные быстрые инструменты для роли
 */
export function getToolsForRole(role: UserRole): QuickToolItemDefinition[] {
  return QUICK_TOOL_DEFINITIONS.filter((t) => t.allowedRoles.includes(role));
}

/**
 * Возвращает приоритетный стартовый экран для роли
 */
export function getDefaultScreenForRole(role: UserRole): UnifiedScreenId {
  switch (role) {
    case 'admin':
      return 'stage_director';
    case 'organizer':
      return 'mcc';
    case 'expert':
      return 'inspectors';
    case 'mentor':
    case 'participant':
      return 'ship';
    case 'guest':
    default:
      return 'starmap';
  }
}
