/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI-модуль интеллектуального сопоставления участников с CRM-реестром и листом ожидания.
 * Обеспечивает:
 * 1. AI-поиск по email наставника, ФИО педагога, названию ОУ или именам школьников.
 * 2. Сопоставление с эталонным списком CRM (16 команд школ Перми + 2 организатора ЦРСО).
 * 3. Интеллектуальное распределение ролей (Физик, Химик, Биолог) под выбранный космический кейс.
 * 4. Назначение пароля самим наставником и генерацию профиля капитана и экипажа.
 */

import {
  CRM_TEAMS_DATABASE,
  CRM_ORGANIZERS_DATABASE,
  CrmTeamRecord,
  CrmStudent,
} from '@/src/contexts/crew/data/crmTeamsData';
import { CASE_TASKS } from '@/src/shared/data/mockData';
import { Team, UserProfile, TeamMember, CaseTask, CrewRoleType } from '@/src/shared/types/index';
import { taskRolesService } from '@/src/contexts/crew/services/taskRolesService';

export interface AiAuditIssue {
  type: 'conflict' | 'incomplete' | 'warning';
  title: string;
  field: 'roles' | 'password' | 'task' | 'school' | 'students' | 'callsign' | 'quota';
  message: string;
  suggestion?: string;
}

export interface AiApplicationAudit {
  teamId: string;
  status: 'conflict' | 'incomplete' | 'ready';
  score: number; // 0 to 100%
  summary: string;
  issues: AiAuditIssue[];
  roleBalance: {
    physicistCount: number;
    chemistCount: number;
    biologistCount: number;
    isBalanced: boolean;
  };
  hasPassword: boolean;
  hasTask: boolean;
  isWaitlist: boolean;
  aiVerdict?: string;
}

export interface AiMatchResult {
  matchFound: boolean;
  confidenceScore: number; // 0-100%
  teamRecord?: CrmTeamRecord;
  organizerRecord?: any;
  aiExplanation: string;
  auditReport?: AiApplicationAudit;
  recommendedRoles: {
    studentIndex: number;
    studentName: string;
    gradeText: string;
    suggestedRole: 'physicist' | 'chemist' | 'biologist';
    roleTitle: string;
    discipline: 'Физика' | 'Химия' | 'Биология';
    disciplineColor: string;
    rationale: string;
  }[];
  captainInfo: {
    name: string;
    email: string;
    school: string;
    title: string;
  };
  navigatorInfo: {
    name: string;
    callsign: string;
    role: string;
    description: string;
  };
  suggestedTask?: CaseTask;
}

// Helper to normalize strings for robust fuzzy comparison
function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .replace(/[«»""'’\s.,\-_()]/g, '')
    .trim();
}

export const aiMatchingService = {
  /**
   * Получить весь список CRM команд
   */
  getAllCrmTeams(): CrmTeamRecord[] {
    return CRM_TEAMS_DATABASE;
  },

  /**
   * Получить организаторов ЦРСО
   */
  getOrganizers() {
    return CRM_ORGANIZERS_DATABASE;
  },

  /**
   * Поиск по запросу (email, ФИО, ОУ) с AI-сопоставлением
   */
  async matchQueryWithCrm(query: string, preferredTaskId?: string): Promise<AiMatchResult> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return {
        matchFound: false,
        confidenceScore: 0,
        aiExplanation: 'Введите email наставника, ФИО или номер школы для AI-сопоставления.',
        recommendedRoles: [],
        captainInfo: { name: '', email: '', school: '', title: '' },
        navigatorInfo: {
          name: 'Леший',
          callsign: 'Бортовой компьютер «Леший»',
          role: 'Бортовой компьютер',
          description: '',
        },
      };
    }

    // Try server-side AI matching via API endpoint
    try {
      const response = await fetch('/api/crm/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cleanQuery, taskId: preferredTaskId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.matchFound) {
          return data;
        }
      }
    } catch (e) {
      // Fallback seamlessly to local intelligent engine
      console.info('Using client-side AI match engine:', e);
    }

    // Local Intelligent Match Engine
    return this.localMatchEngine(cleanQuery, preferredTaskId);
  },

  /**
   * Локальный интеллектуальный алгоритм нечеткого сопоставления
   */
  localMatchEngine(query: string, taskId?: string): AiMatchResult {
    const qNorm = normalizeStr(query);
    const qLower = query.toLowerCase().trim();

    let bestMatch: CrmTeamRecord | null = null;
    let highestScore = 0;
    let matchType = '';

    for (const team of CRM_TEAMS_DATABASE) {
      let score = 0;
      const mentorEmailNorm = normalizeStr(team.mentorEmail);
      const mentorNameNorm = normalizeStr(team.mentorName);
      const schoolNorm = normalizeStr(team.school);

      // 1. Exact or partial email match (highest priority, as email is mentor's login)
      if (team.mentorEmail.toLowerCase() === qLower) {
        score = 100;
        matchType = `Точное совпадение по логину (Email): ${team.mentorEmail}`;
      } else if (
        team.mentorEmail.toLowerCase().includes(qLower) ||
        qLower.includes(team.mentorEmail.toLowerCase())
      ) {
        score = 95;
        matchType = `Частичное совпадение по Email наставника`;
      }
      // 2. Mentor Name match
      else if (mentorNameNorm === qNorm) {
        score = 98;
        matchType = `Точное совпадение по ФИО наставника: ${team.mentorName}`;
      } else if (mentorNameNorm.includes(qNorm) || qNorm.includes(mentorNameNorm)) {
        score = 90;
        matchType = `Совпадение по фамилии/имени наставника`;
      }
      // 3. School number or name match
      else if (schoolNorm.includes(qNorm) || qNorm.includes(schoolNorm)) {
        score = 85;
        matchType = `Совпадение по образовательному учреждению: ${team.school}`;
      }
      // 4. Student match
      else {
        for (const student of team.students) {
          const studentNorm = normalizeStr(student.name);
          if (studentNorm.includes(qNorm) || qNorm.includes(studentNorm)) {
            score = 88;
            matchType = `Совпадение по участнику команды: ${student.name} (${student.gradeText})`;
            break;
          }
        }
      }

      // Check numeric order match (e.g. user entered "1" or "#1" or "команда 1")
      const orderMatch = query.match(/\b([1-9]|1[0-6])\b/);
      if (orderMatch && Number(orderMatch[1]) === team.orderNumber && score < 75) {
        score = 80;
        matchType = `Совпадение по порядковому номеру квоты: Команда №${team.orderNumber}`;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = team;
      }
    }

    if (!bestMatch || highestScore < 40) {
      // Default fallback to first team if confidence too low, but with explanatory message
      bestMatch = CRM_TEAMS_DATABASE[0];
      highestScore = 30;
      matchType = 'Прямое совпадение не найдено, предложен экипаж МАОУ «СОШ №81» (№1 в реестре)';
    }

    // Determine target task
    const selectedTask =
      CASE_TASKS.find((t) => t.id === taskId) ||
      CASE_TASKS.find((t) => t.id === bestMatch.selectedTaskId) ||
      CASE_TASKS[0];

    // AI role allocation logic based on selected task
    const recommendedRoles = bestMatch.students.map((student, idx) => {
      let suggestedRole: 'physicist' | 'chemist' | 'biologist' = 'biologist';
      let roleTitle = 'Бортовой Биолог-эколог';
      let discipline: 'Физика' | 'Химия' | 'Биология' = 'Биология';
      let disciplineColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      let rationale = `Исследует радиационную нагрузку в поясах Ван Аллена, замкнутый цикл регенерации атмосферы и защиту биологических образцов.`;

      if (idx === 0) {
        suggestedRole = 'physicist';
        roleTitle = 'Бортовой Физик-баллистик';
        discipline = 'Физика';
        disciplineColor = 'text-sky-400 bg-sky-500/10 border-sky-500/30';
        rationale = `Отвечает за расчет физико-математической модели задачи «${selectedTask.title}», расчет орбиты, гравитации и кинематики кубсата.`;
      } else if (idx === 1) {
        suggestedRole = 'chemist';
        roleTitle = 'Бортовой Химик-энергетик';
        discipline = 'Химия';
        disciplineColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        rationale = `Курирует электрохимический баланс (LiFePO4, панели GaAs), реакцию Сабатье или взаимодействие материалов корпуса с атомарным кислородом.`;
      }

      return {
        studentIndex: idx,
        studentName: student.name,
        gradeText: student.gradeText,
        suggestedRole,
        roleTitle,
        discipline,
        disciplineColor,
        rationale,
      };
    });

    const aiExplanation = `AI-система КОСМОПОРТ проанализировала запрос: «${query}». ${matchType}. Степень уверенности: ${highestScore}%. Команда успешно сопоставлена с записью в CRM-реестре. Сформирован состав экипажа корабля из 5 единиц (Капитан, 3 Специалиста, Бортовой компьютер Леший).`;

    const auditReport = this.auditTeamApplication(
      bestMatch,
      undefined,
      undefined,
      selectedTask?.id,
    );

    return {
      matchFound: highestScore >= 50,
      confidenceScore: highestScore,
      teamRecord: bestMatch,
      aiExplanation,
      auditReport,
      recommendedRoles,
      captainInfo: {
        name: bestMatch.mentorName,
        email: bestMatch.mentorEmail,
        school: bestMatch.school,
        title: bestMatch.captainTitle,
      },
      navigatorInfo: {
        name: bestMatch.navigatorMascot.name,
        callsign: 'Бортовой компьютер «Леший»',
        role: 'Бортовой компьютер корабля',
        description: bestMatch.navigatorMascot.description,
      },
      suggestedTask: selectedTask,
    };
  },

  /**
   * AI-аудит заявки команды на предмет конфликтов и неполноты
   */
  auditTeamApplication(
    team: CrmTeamRecord,
    rolesOverride?: Record<number, 'physicist' | 'chemist' | 'biologist'>,
    passwordOverride?: string,
    taskIdOverride?: string,
  ): AiApplicationAudit {
    const issues: AiAuditIssue[] = [];
    const password = passwordOverride !== undefined ? passwordOverride : team.registeredPassword;
    const taskId = taskIdOverride !== undefined ? taskIdOverride : team.selectedTaskId;

    // 1. Role distribution check (Физик, Химик, Биолог)
    const effectiveRoles: ('physicist' | 'chemist' | 'biologist')[] = team.students.map((st, i) => {
      if (rolesOverride && rolesOverride[i]) return rolesOverride[i];
      return (st.assignedRole as 'physicist' | 'chemist' | 'biologist' | undefined) || 'physicist';
    });

    let physicistCount = 0;
    let chemistCount = 0;
    let biologistCount = 0;
    effectiveRoles.forEach((r) => {
      if (r === 'physicist') physicistCount++;
      else if (r === 'chemist') chemistCount++;
      else if (r === 'biologist') biologistCount++;
    });

    const isBalanced = physicistCount === 1 && chemistCount === 1 && biologistCount === 1;

    if (!isBalanced) {
      const missingRoles: string[] = [];
      if (physicistCount === 0) missingRoles.push('Физик');
      if (chemistCount === 0) missingRoles.push('Химик');
      if (biologistCount === 0) missingRoles.push('Биолог');

      const dupRoles: string[] = [];
      if (physicistCount > 1) dupRoles.push(`Физиков (${physicistCount})`);
      if (chemistCount > 1) dupRoles.push(`Химиков (${chemistCount})`);
      if (biologistCount > 1) dupRoles.push(`Биологов (${biologistCount})`);

      issues.push({
        type: 'conflict',
        title: 'Конфликт штатного расписания экипажа',
        field: 'roles',
        message: `Дисбаланс ролей: в экипаже ${dupRoles.join(', ')} и не хватает ${missingRoles.join(', ')}. Регламент CubeSat требует ровно: 1 Физик, 1 Химик, 1 Биолог.`,
        suggestion:
          'Нажмите «Сбалансировать роли AI» для автоматического разделения на Физика, Химика и Биолога.',
      });
    }

    // 2. Mentor password check
    const hasPassword = Boolean(password && password.trim().length >= 4);
    if (!hasPassword) {
      issues.push({
        type: 'incomplete',
        title: 'Не назначен пароль капитана',
        field: 'password',
        message:
          'Бортовой компьютер не защищен: преподаватель-наставник должен назначить персональный пароль.',
        suggestion: 'Задайте пароль от 4 символов на шаге 2 или нажмите «Сгенерировать пароль».',
      });
    }

    // 3. Task assignment check
    const hasTask = Boolean(taskId);
    if (!hasTask) {
      issues.push({
        type: 'incomplete',
        title: 'Не выбран кейс космической задачи',
        field: 'task',
        message: 'Для кубсата не определена целевая миссия (баллистика, энергетика, биомодуль).',
        suggestion: 'Выберите одну из 8 утвержденных задач чемпионата.',
      });
    }

    // 4. Students completeness check
    if (!team.students || team.students.length < 3) {
      issues.push({
        type: 'incomplete',
        title: 'Неполный состав экипажа',
        field: 'students',
        message: `В заявке указано ${team.students?.length || 0} школьников вместо утвержденных 3 участников.`,
        suggestion: 'Дополните экипаж до 3 школьников из базы ОУ.',
      });
    }

    // 5. School and duplicate callsign validation
    const duplicateCallsigns = CRM_TEAMS_DATABASE.filter(
      (t) => t.id !== team.id && t.shipCallsign.toLowerCase() === team.shipCallsign.toLowerCase(),
    );
    if (duplicateCallsigns.length > 0) {
      issues.push({
        type: 'conflict',
        title: 'Конфликт радиопозывного борта',
        field: 'callsign',
        message: `Позывной «${team.shipCallsign}» совпадает с позывным другой команды (${duplicateCallsigns[0].school}).`,
        suggestion: `Измените радиопозывной на уникальный (например: «${team.shipCallsign}-${team.orderNumber}»).`,
      });
    }

    // 6. Quota / status check
    const isWaitlist = team.status === 'waitlist' || team.status === 'quota_allocated';
    if (isWaitlist) {
      issues.push({
        type: 'warning',
        title: 'Статус: Лист ожидания квот',
        field: 'quota',
        message: `Заявка находится в очереди квот (позиция #${team.waitlistPosition}). Для активации борта требуется завершение регистрации наставником.`,
        suggestion: 'Завершите регистрацию экипажа для активации статуса.',
      });
    }

    // Determine final status
    const hasConflict = issues.some((i) => i.type === 'conflict');
    const hasIncomplete = issues.some((i) => i.type === 'incomplete');

    let status: 'conflict' | 'incomplete' | 'ready' = 'ready';
    if (hasConflict) status = 'conflict';
    else if (hasIncomplete) status = 'incomplete';

    // Completeness score
    let score = 100;
    if (hasConflict) score -= 35;
    if (!hasPassword) score -= 25;
    if (!hasTask) score -= 20;
    if (isWaitlist) score -= 10;
    if (!isBalanced) score -= 10;
    score = Math.max(10, Math.min(100, score));

    let summary = 'Заявка проверена AI: экипаж полностью укомплектован и готов к старту.';
    if (status === 'conflict') {
      summary = `AI выявил конфликт в заявке (${issues.filter((i) => i.type === 'conflict').length} замечаний). Требуется согласование ролей или позывных.`;
    } else if (status === 'incomplete') {
      summary = `Заявка не завершена: обнаружено ${issues.filter((i) => i.type === 'incomplete').length} незаполненных пунктов (пароль, кейс или статус квоты).`;
    }

    return {
      teamId: team.id,
      status,
      score,
      summary,
      issues,
      roleBalance: {
        physicistCount,
        chemistCount,
        biologistCount,
        isBalanced,
      },
      hasPassword,
      hasTask,
      isWaitlist,
    };
  },

  /**
   * Получить AI-аудит для всех 16 команд в CRM
   */
  auditAllTeams(): Record<string, AiApplicationAudit> {
    const audits: Record<string, AiApplicationAudit> = {};
    for (const team of CRM_TEAMS_DATABASE) {
      audits[team.id] = this.auditTeamApplication(team);
    }
    return audits;
  },

  /**
   * AI Авто-исправление заявки (1 клик)
   */
  autoFixTeamApplication(team: CrmTeamRecord): {
    rolesMap: Record<number, 'physicist' | 'chemist' | 'biologist'>;
    suggestedPassword: string;
    suggestedTaskId: string;
  } {
    return {
      rolesMap: {
        0: 'physicist',
        1: 'chemist',
        2: 'biologist',
      },
      suggestedPassword: team.registeredPassword || `SpaceCaptain-${team.orderNumber}!`,
      suggestedTaskId: team.selectedTaskId || 'task-01',
    };
  },

  /**
   * Запрос к серверному эндпоинту с Gemini для глубокого AI-вердикта
   */
  async fetchServerAiAudit(teamData: any, query?: string): Promise<string | null> {
    try {
      const response = await fetch('/api/crm/ai-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamData, query }),
      });
      if (response.ok) {
        const json = await response.json();
        return json.aiVerdict || null;
      }
    } catch (e) {
      console.warn('Server AI audit fetch failed:', e);
    }
    return null;
  },

  /**
   * Преобразование записи CRM и выбранных ролей в активный Team объект
   */
  createTeamFromCrm(
    crmRecord: CrmTeamRecord,
    rolesMap: Record<number, CrewRoleType>,
    selectedTaskId: string,
    passwordChosen: string,
    customShipName?: string,
  ): { team: Team; mentorProfile: UserProfile } {
    const task = CASE_TASKS.find((t) => t.id === selectedTaskId) || CASE_TASKS[0];
    const finalShipName = customShipName?.trim() || crmRecord.shipName;

    const roleTitles: Record<CrewRoleType, { title: string; disc: any }> = {
      captain: { title: 'Капитан корабля', disc: 'Космонавтика' },
      commander: { title: 'Командир корабля', disc: 'Космонавтика' },
      physicist: { title: 'Бортовой Физик', disc: 'Физика' },
      chemist: { title: 'Бортовой Химик', disc: 'Химия' },
      biologist: { title: 'Бортовой Биолог', disc: 'Биология' },
      designer: { title: 'Бортовой Дизайнер', disc: 'Дизайн' },
      medic: { title: 'Космический Медик', disc: 'Медицина' },
      navigator: { title: 'Штурман-навигатор', disc: 'Космонавтика' },
      mathematician: { title: 'Орбитальный Аналитик', disc: 'Математика' },
      engineer: { title: 'Инженер CubeSat', disc: 'Инженерия' },
      translator: { title: 'Бортовой Переводчик (Филолог)', disc: 'Космонавтика' },
      marketer: { title: 'Маркетолог миссии (Торговец)', disc: 'Космонавтика' },
      flight_mechanic: { title: 'Бортмеханик систем', disc: 'Инженерия' },
    };

    const teamMembers: TeamMember[] = crmRecord.students.map((st, i) => {
      const assignedRole = (rolesMap[i] || st.assignedRole || 'physicist') as CrewRoleType;
      const roleMeta = roleTitles[assignedRole] || { title: 'Специалист', disc: 'Физика' };
      return {
        id: `member-${crmRecord.id}-${i + 1}`,
        name: st.name,
        grade: st.gradeNumber,
        gradeText: st.gradeText,
        email: `${st.name.split(' ')[0].toLowerCase()}@school.space`,
        role: assignedRole,
        assignedRole: assignedRole,
        roleTitle: roleMeta.title,
        discipline: roleMeta.disc,
        status: 'active',
        registeredAt: new Date().toLocaleDateString('ru-RU'),
      };
    });

    // Генерация подзадач под выбранную тему
    const crewRolePairs = teamMembers.map((m) => ({ studentName: m.name, role: m.role }));
    const generatedSubtasks = taskRolesService.generateSubtasksForTeam(
      task.id,
      task.title,
      crewRolePairs,
      crmRecord.mentorName,
    );

    // Генерация рефлексий для Слайда 3
    const generatedReflections = taskRolesService.generateDefaultReflections(
      crmRecord.mentorName,
      teamMembers.map((m) => ({ name: m.name, roleTitle: m.roleTitle || m.role, role: m.role })),
      finalShipName,
    );

    const newTeam: Team = {
      id: crmRecord.id,
      name: finalShipName,
      shipName: finalShipName,
      shipCallsign: crmRecord.shipCallsign,
      cubesatName: crmRecord.cubesatName,
      cubesatFormat: crmRecord.cubesatFormat,
      school: crmRecord.school,
      city: crmRecord.city,
      mentorName: crmRecord.mentorName,
      mentorEmail: crmRecord.mentorEmail,
      selectedTaskId: task.id,
      selectedTaskTitle: task.title,
      currentStage: 'case_selected',
      submissionDeadline: '2026-10-18T21:00:00Z',
      score: 5.0,
      expertCount: 1,
      fuelPercent: 0, // Предложить стартовый квиз для заправки баков!
      starterQuizPassed: false,
      teamPhotoUrl:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      roleSubtasks: generatedSubtasks,
      memberReflections: generatedReflections,
      members: teamMembers,
      slides: [
        {
          slideNumber: 1,
          title: `Космическая миссия ${crmRecord.cubesatName}: ${task.title}`,
          subtitle: `Экипаж «${finalShipName}» · ${crmRecord.school}`,
          content: `Цель миссии: ${task.description}. Экипаж в составе Капитана (${crmRecord.mentorName}), специалистов и бортового компьютера «Леший» разработал технический концепт наноспутника формата ${crmRecord.cubesatFormat}.`,
          diagramType: 'orbit',
          updatedAt: new Date().toISOString(),
        },
        {
          slideNumber: 2,
          title: 'Физико-математический расчет и фундаментальные уравнения',
          subtitle: `Анализ задачи: ${task.categoryLabel}`,
          content: `Расчетная модель основана на ключевых формулах: ${task.keyFormulas.join(', ')}. Команда провела параметрическое моделирование поведения кубсата на высоте 400 км.`,
          formulaLatex: task.keyFormulas[0] || 'v_1 = \\sqrt{G M / r}',
          calculations: `Ключевые физические параметры: гравитационный параметр $\\mu = 3.986 \\times 10^{14}$ м³/с², орбитальная скорость $v \\approx 7.67$ км/с. Расчет подтвержден бортовым компьютером «Леший».`,
          updatedAt: new Date().toISOString(),
        },
        {
          slideNumber: 3,
          title: `Инженерная компоновка ${crmRecord.cubesatFormat} и бортовые системы`,
          subtitle: 'Архитектура полезной нагрузки, EPS, ADCS и терморегулирования',
          content: `Корпус наноспутника вмещает научный блок, радиомодем UHF/VHF, микроконтроллер бортового управления и трехосную систему ориентации. Энергетический баланс положителен на всех фазах орбиты.`,
          subsystemsData: [
            { name: 'Полезная нагрузка кейса', power: '2.0 Вт', mass: '0.42 кг', status: 'Штатно' },
            {
              name: 'Электропитание (EPS GaAs)',
              power: '1.5 Вт',
              mass: '0.85 кг',
              status: 'Штатно',
            },
            {
              name: 'Система ориентации (ADCS)',
              power: '2.8 Вт',
              mass: '0.55 кг',
              status: 'Штатно',
            },
            { name: 'Радиоканал связи (UHF)', power: '3.5 Вт', mass: '0.25 кг', status: 'Штатно' },
            { name: 'Конструктив и термопасты', power: '0 Вт', mass: '0.90 кг', status: 'Штатно' },
          ],
          updatedAt: new Date().toISOString(),
        },
      ],
      templateData: {
        scientificGoal: `Исследование в рамках кейса «${task.title}».`,
        orbitParameters: {
          altitudeKm: 400,
          inclinationDeg: 51.6,
          eccentricity: 0.001,
          periodMin: 92.6,
        },
        physicalModel: 'Численная физико-математическая модель CubeSat на НОО.',
        formulaeDerivation: task.keyFormulas.join('; '),
        payloadDescription: `Оборудование полезной нагрузки для решения задачи: ${task.title}.`,
        powerBudgetWatts: 12.0,
        batteryCapacityWattHours: 40,
        radioFrequencyMhz: 437.5,
        conclusions:
          'Экипаж подтверждает соответствие проекта стандарту CubeSat и регламенту чемпионата КОСМОПОРТ.',
      },
      groupPosts: [
        {
          id: `gp-init-${crmRecord.id}`,
          authorName: crmRecord.mentorName,
          authorRole: 'Капитан корабля (Наставник)',
          type: 'update',
          title: `Экипаж корабля «${finalShipName}» официально зарегистрирован!`,
          content: `Приветствуем Космопорт! Наш экипаж (${crmRecord.school}) успешно прошел AI-верификацию реестра. Роли распределены: Физик, Химик, Биолог и Бортовой компьютер Леший. Приступаем к защите кейса!`,
          createdAt: 'Только что',
          likes: 3,
          commentsCount: 0,
        },
      ],
    };

    const mentorProfile: UserProfile = {
      id: `usr-mentor-${crmRecord.id}`,
      name: crmRecord.mentorName,
      email: crmRecord.mentorEmail,
      role: 'mentor',
      school: crmRecord.school,
      city: crmRecord.city,
      photoConsent: true,
      bio: `${crmRecord.captainTitle} космического корабля «${crmRecord.shipName}» (${crmRecord.school}). Ведет подготовку экипажа по задаче: «${task.title}».`,
      statusMessage: `Корабль «${crmRecord.shipName}» на связи! Пароль назначен. Готовим 3 слайда 🚀`,
      assignedTeamId: crmRecord.id,
      assignedTeamName: crmRecord.shipName,
      xp: 500,
      level: 5,
      rankTitle: 'Капитан Корабля',
      energyCrystals: 80,
      streakDays: 1,
      badges: ['captain_wings', 'first_launch', 'kepler_master', 'crm_verified'],
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      socialLinks: {
        website: 'https://kosmoport.space',
      },
      socialPosts: [
        {
          id: `sp-${Date.now()}`,
          authorId: `usr-mentor-${crmRecord.id}`,
          authorName: crmRecord.mentorName,
          authorRole: 'mentor',
          teamId: crmRecord.id,
          teamName: crmRecord.shipName,
          content: `Завершили AI-сопоставление с реестром CRM и регистрацию экипажа! В строю 3 исследователя (Физик, Химик, Биолог) и Бортовой компьютер «Леший».`,
          createdAt: 'Только что',
          likes: 5,
          likedByMe: true,
          tags: ['#Космопорт2026', `#${crmRecord.shipName}`, '#Капитан'],
        },
      ],
    };

    // Update in-memory CRM status
    crmRecord.status = 'registered_active';
    crmRecord.registeredPassword = passwordChosen;
    crmRecord.registeredAt = new Date().toISOString();
    crmRecord.selectedTaskId = task.id;
    crmRecord.selectedTaskTitle = task.title;

    return { team: newTeam, mentorProfile };
  },
};
