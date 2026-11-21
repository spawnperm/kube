import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  Rocket,
  Lock,
  Unlock,
  MoveRight,
  ArrowRight,
  Check,
  AlertCircle,
  Award,
  Calendar,
  Building,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Radio,
  FileText,
  UserCheck,
  Edit3,
  X,
  Target,
  BadgeCheck,
} from 'lucide-react';

export type KanbanStageId = 1 | 2 | 3 | 4 | 5 | 6;

export interface StudentMember {
  id: string;
  name: string;
  grade: string;
  role: string;
  verifiedByCaptain: boolean;
}

export interface CrmTeam {
  id: string;
  school: string;
  city: string;
  mentorName: string;
  mentorEmail: string;
  shipName: string;
  cubesatName: string;
  missionGoal: string;
  missionGoalLocked: boolean;
  registeredAtDesk: boolean;
  stage: KanbanStageId;
  students: StudentMember[];
  juryScore?: number;
  juryFeedback?: string;
}

export const STUDENT_ROLES = [
  'Баллистик и специалист по орбитам',
  'Инженер-конструктор CubeSat',
  'Радиоинженер СОНИКС / AX.25',
  'Разработчик полезной нагрузки (ДЗЗ)',
  'Программист бортового ПО (OBC)',
  'Физик-исследователь / Аналитик',
  'Химик / Материаловед',
  'Биолог / Замкнутые экосистемы',
];

export const INITIAL_MISSION_GOALS = [
  'Оптический мониторинг лесных массивов и водоёмов Пермского края (ДЗЗ)',
  'Приём сигналов IoT и датчиков лесных пожаров через радиомаяк СОНИКС',
  'Исследование космической радиации и заряженных частиц в магнитосфере',
  'Эксперимент по кристаллизации белковых соединений в условиях микрогравитации',
  'Испытание отечественных солнечных батарей GaAs и расчет энергобаланса EPS',
  'Биологический эксперимент: микроводоросли хлорелла в замкнутом объеме 1U',
];

export const KANBAN_STAGES: Array<{
  id: KanbanStageId;
  title: string;
  shortTitle: string;
  color: string;
  description: string;
}> = [
  {
    id: 1,
    title: '1. Предварительная регистрация администратором',
    shortTitle: 'Предрегистрация',
    color: 'border-blue-500/50 bg-blue-950/20 text-blue-300',
    description: 'Команда внесена в квоту администратором, ожидается наставник',
  },
  {
    id: 2,
    title: '2. Регистрация на стойке командиром (учителем)',
    shortTitle: 'Стойка регистрации',
    color: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
    description: 'Капитан подтвердил явку, выбрал имя CubeSat и цель миссии',
  },
  {
    id: 3,
    title: '3. Готовность к старту соревнования',
    shortTitle: 'Готовность к старту',
    color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300',
    description: 'Экипаж верифицирован капитаном, цель миссии зафиксирована',
  },
  {
    id: 4,
    title: '4. Подготовка команд к защите',
    shortTitle: 'Подготовка к защите',
    color: 'border-purple-500/50 bg-purple-950/20 text-purple-300',
    description: 'Расчеты баллистики, сборка 3D-модели, подготовка слайдов',
  },
  {
    id: 5,
    title: '5. Защита команды на мероприятии',
    shortTitle: 'Защита перед комиссией',
    color: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300',
    description: 'Питч перед экспертной комиссией, демонстрация решений',
  },
  {
    id: 6,
    title: '6. Выставленные оценки со стороны комиссии',
    shortTitle: 'Оценки комиссии',
    color: 'border-rose-500/50 bg-rose-950/20 text-rose-300',
    description: 'Финальные баллы от жюри, утверждение протокола',
  },
];

// Schedule in Perm Time (UTC+5 / MSK+2)
export const CHAMPIONSHIP_SCHEDULE = [
  {
    time: '13:30 – 14:00',
    title: 'Сбор и очная регистрация на стойке ЦУП',
    desc: 'Регистрация учителей-капитанов, фиксация названия CubeSat и цели миссии, верификация составов учеников.',
    stageTarget: 2,
  },
  {
    time: '14:00 – 14:20',
    title: 'Торжественное открытие кейс-чемпионата',
    desc: 'Приветствие оргкомитета, инструктаж ЦУП, старт соревнования. Цели миссий блокируются от изменений!',
    stageTarget: 3,
  },
  {
    time: '14:20 – 15:30',
    title: 'Инженерный спринт команд',
    desc: 'Решение кейсов по баллистике, расчет солнечных панелей, 3D CAD-компоновка, подготовка материалов.',
    stageTarget: 4,
  },
  {
    time: '15:30 – 15:45',
    title: 'Предстартовая проверка чек-листов',
    desc: 'Загрузка презентаций в систему судейства, предзащитный контроль готовности экипажей.',
    stageTarget: 4,
  },
  {
    time: '15:45 – 16:40',
    title: 'Защита проектов перед экспертной комиссией',
    desc: 'Питчи команд по 5 минут + 3 минуты ответы на вопросы экспертов и жюри чемпионата.',
    stageTarget: 5,
  },
  {
    time: '16:40 – 17:00',
    title: 'Подведение итогов и награждение победителей',
    desc: 'Оглашение суммарных баллов комиссии, вручение дипломов и сертификатов программы «Space-Pi».',
    stageTarget: 6,
  },
];

export const INITIAL_CRM_TEAMS: CrmTeam[] = [
  {
    id: 'team-01',
    school: 'МАОУ «СОШ №81» г. Перми',
    city: 'Пермь',
    mentorName: 'Бондаренко Дарья Сергеевна',
    mentorEmail: 'bondarenko@perm-school81.ru',
    shipName: 'Орион-81',
    cubesatName: 'Парма-1',
    missionGoal: 'Оптический мониторинг лесных массивов и водоёмов Пермского края (ДЗЗ)',
    missionGoalLocked: true,
    registeredAtDesk: true,
    stage: 3,
    students: [
      {
        id: 's1-1',
        name: 'Иванов Кирилл',
        grade: '10 класс',
        role: 'Баллистик и специалист по орбитам',
        verifiedByCaptain: true,
      },
      {
        id: 's1-2',
        name: 'Смирнова Анна',
        grade: '10 класс',
        role: 'Инженер-конструктор CubeSat',
        verifiedByCaptain: true,
      },
      {
        id: 's1-3',
        name: 'Козлов Максим',
        grade: '10 класс',
        role: 'Радиоинженер СОНИКС / AX.25',
        verifiedByCaptain: true,
      },
    ],
    juryScore: 92,
  },
  {
    id: 'team-02',
    school: 'МАОУ «Гимназия №33» г. Перми',
    city: 'Пермь',
    mentorName: 'Кузнецов Игорь Владимирович',
    mentorEmail: 'kuznetsov@gimn33.perm.ru',
    shipName: 'Вектор-33',
    cubesatName: 'Кама-Sat',
    missionGoal: 'Приём сигналов IoT и датчиков лесных пожаров через радиомаяк СОНИКС',
    missionGoalLocked: true,
    registeredAtDesk: true,
    stage: 4,
    students: [
      {
        id: 's2-1',
        name: 'Петров Артем',
        grade: '11 класс',
        role: 'Программист бортового ПО (OBC)',
        verifiedByCaptain: true,
      },
      {
        id: 's2-2',
        name: 'Морозова Елена',
        grade: '11 класс',
        role: 'Разработчик полезной нагрузки (ДЗЗ)',
        verifiedByCaptain: true,
      },
      {
        id: 's2-3',
        name: 'Васильев Денис',
        grade: '10 класс',
        role: 'Физик-исследователь / Аналитик',
        verifiedByCaptain: true,
      },
    ],
  },
  {
    id: 'team-03',
    school: 'МАОУ «Лицей №1» г. Перми',
    city: 'Пермь',
    mentorName: 'Соколова Наталья Михайловна',
    mentorEmail: 'sokolova@lyceum1.perm.ru',
    shipName: 'Звездный Путь',
    cubesatName: 'Лицей-3U',
    missionGoal: 'Исследование космической радиации и заряженных частиц в магнитосфере',
    missionGoalLocked: false,
    registeredAtDesk: true,
    stage: 2,
    students: [
      {
        id: 's3-1',
        name: 'Николаев Егор',
        grade: '10 класс',
        role: 'Физик-исследователь / Аналитик',
        verifiedByCaptain: true,
      },
      {
        id: 's3-2',
        name: 'Федорова Дарья',
        grade: '10 класс',
        role: 'Инженер-конструктор CubeSat',
        verifiedByCaptain: false,
      },
      {
        id: 's3-3',
        name: 'Попов Илья',
        grade: '10 класс',
        role: 'Баллистик и специалист по орбитам',
        verifiedByCaptain: false,
      },
    ],
  },
  {
    id: 'team-04',
    school: 'МАОУ «СОШ №146» с углубленным изучением математики и физики',
    city: 'Пермь',
    mentorName: 'Григорьев Сергей Павлович',
    mentorEmail: 'grigoriev@school146.perm.ru',
    shipName: 'Фотон-146',
    cubesatName: 'Эврика-3U',
    missionGoal: 'Испытание отечественных солнечных батарей GaAs и расчет энергобаланса EPS',
    missionGoalLocked: false,
    registeredAtDesk: false,
    stage: 1,
    students: [
      {
        id: 's4-1',
        name: 'Зайцев Михаил',
        grade: '11 класс',
        role: 'Инженер-конструктор CubeSat',
        verifiedByCaptain: false,
      },
      {
        id: 's4-2',
        name: 'Романов Арсений',
        grade: '11 класс',
        role: 'Баллистик и специалист по орбитам',
        verifiedByCaptain: false,
      },
      {
        id: 's4-3',
        name: 'Семенова Ольга',
        grade: '10 класс',
        role: 'Радиоинженер СОНИКС / AX.25',
        verifiedByCaptain: false,
      },
    ],
  },
  {
    id: 'team-05',
    school: 'МАОУ «Инженерная школа» г. Перми',
    city: 'Пермь',
    mentorName: 'Чернышев Алексей Викторович',
    mentorEmail: 'chernyshev@engschool.perm.ru',
    shipName: 'Авангард',
    cubesatName: 'Инженер-3U',
    missionGoal: 'Эксперимент по кристаллизации белковых соединений в условиях микрогравитации',
    missionGoalLocked: true,
    registeredAtDesk: true,
    stage: 5,
    students: [
      {
        id: 's5-1',
        name: 'Алексеев Даниил',
        grade: '10 класс',
        role: 'Инженер-конструктор CubeSat',
        verifiedByCaptain: true,
      },
      {
        id: 's5-2',
        name: 'Борисова Полина',
        grade: '10 класс',
        role: 'Биолог / Замкнутые экосистемы',
        verifiedByCaptain: true,
      },
      {
        id: 's5-3',
        name: 'Крылов Никита',
        grade: '10 класс',
        role: 'Химик / Материаловед',
        verifiedByCaptain: true,
      },
    ],
  },
  {
    id: 'team-06',
    school: 'МАОУ «Лицей №2» г. Перми',
    city: 'Пермь',
    mentorName: 'Павлова Татьяна Юрьевна',
    mentorEmail: 'pavlova@lyceum2.perm.ru',
    shipName: 'Комета-2',
    cubesatName: 'Кварц-1U',
    missionGoal: 'Биологический эксперимент: микроводоросли хлорелла в замкнутом объеме 1U',
    missionGoalLocked: true,
    registeredAtDesk: true,
    stage: 6,
    students: [
      {
        id: 's6-1',
        name: 'Гусев Илья',
        grade: '11 класс',
        role: 'Биолог / Замкнутые экосистемы',
        verifiedByCaptain: true,
      },
      {
        id: 's6-2',
        name: 'Тихонов Глеб',
        grade: '11 класс',
        role: 'Физик-исследователь / Аналитик',
        verifiedByCaptain: true,
      },
      {
        id: 's6-3',
        name: 'Сорокина Алиса',
        grade: '11 класс',
        role: 'Разработчик полезной нагрузки (ДЗЗ)',
        verifiedByCaptain: true,
      },
    ],
    juryScore: 95,
    juryFeedback: 'Отличный расчет термического диапазона и биологического контейнера.',
  },
];

interface CrmChampionshipScreenProps {
  userRole?: string;
  onSelectTeamForInspection?: (teamId: string) => void;
}

export const CrmChampionshipScreen: React.FC<CrmChampionshipScreenProps> = ({
  userRole = 'admin',
  onSelectTeamForInspection,
}) => {
  const [activeTab, setActiveTab] = useState<
    'kanban' | 'desk' | 'verification' | 'import' | 'goals'
  >('kanban');
  const [teams, setTeams] = useState<CrmTeam[]>(INITIAL_CRM_TEAMS);
  const [missionGoals, setMissionGoals] = useState<string[]>(INITIAL_MISSION_GOALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(INITIAL_CRM_TEAMS[0].id);

  // Desk Registration Form state
  const [deskTeamId, setDeskTeamId] = useState<string>(INITIAL_CRM_TEAMS[2].id);
  const [deskShipName, setDeskShipName] = useState<string>('');
  const [deskCubesatName, setDeskCubesatName] = useState<string>('');
  const [deskSelectedGoal, setDeskSelectedGoal] = useState<string>(INITIAL_MISSION_GOALS[0]);
  const [deskCustomGoal, setDeskCustomGoal] = useState<string>('');

  // New Mission Goal creation
  const [newGoalInput, setNewGoalInput] = useState('');

  // New Team Pre-import Form state
  const [newSchool, setNewSchool] = useState('');
  const [newCity, setNewCity] = useState('Пермь');
  const [newMentorName, setNewMentorName] = useState('');
  const [newMentorEmail, setNewMentorEmail] = useState('');
  const [newStudent1, setNewStudent1] = useState('');
  const [newStudent2, setNewStudent2] = useState('');
  const [newStudent3, setNewStudent3] = useState('');

  // Clock for Perm Time (UTC+5)
  const [permTimeStr, setPermTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // UTC+5
      const permDate = new Date(now.getTime() + (now.getTimezoneOffset() + 300) * 60000);
      setPermTimeStr(
        permDate.toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeDeskTeam = useMemo(
    () => teams.find((t) => t.id === deskTeamId) || teams[0],
    [teams, deskTeamId],
  );

  useEffect(() => {
    if (activeDeskTeam) {
      setDeskShipName(activeDeskTeam.shipName || '');
      setDeskCubesatName(activeDeskTeam.cubesatName || '');
      setDeskSelectedGoal(activeDeskTeam.missionGoal || INITIAL_MISSION_GOALS[0]);
    }
  }, [activeDeskTeam]);

  // Kanban Drag / Stage Shift Handlers
  const handleMoveStage = (teamId: string, delta: number) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        const nextStage = Math.max(1, Math.min(6, t.stage + delta)) as KanbanStageId;
        const willLockGoal = nextStage >= 3 ? true : t.missionGoalLocked;
        return {
          ...t,
          stage: nextStage,
          missionGoalLocked: willLockGoal,
          registeredAtDesk: nextStage >= 2 ? true : t.registeredAtDesk,
        };
      }),
    );
  };

  const handleSetStage = (teamId: string, stage: KanbanStageId) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          stage,
          missionGoalLocked: stage >= 3 ? true : t.missionGoalLocked,
          registeredAtDesk: stage >= 2 ? true : t.registeredAtDesk,
        };
      }),
    );
  };

  // Toggle student verification by Captain
  const handleToggleStudentVerification = (teamId: string, studentId: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          students: t.students.map((s) =>
            s.id === studentId ? { ...s, verifiedByCaptain: !s.verifiedByCaptain } : s,
          ),
        };
      }),
    );
  };

  // Change student role
  const handleChangeStudentRole = (teamId: string, studentId: string, newRole: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          students: t.students.map((s) => (s.id === studentId ? { ...s, role: newRole } : s)),
        };
      }),
    );
  };

  // Desk Registration Form Submit by Captain
  const handleDeskRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalGoal = deskCustomGoal.trim() ? deskCustomGoal.trim() : deskSelectedGoal;

    if (deskCustomGoal.trim() && !missionGoals.includes(deskCustomGoal.trim())) {
      setMissionGoals((prev) => [...prev, deskCustomGoal.trim()]);
    }

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== deskTeamId) return t;
        return {
          ...t,
          shipName: deskShipName.trim() || t.shipName,
          cubesatName: deskCubesatName.trim() || t.cubesatName,
          missionGoal: finalGoal,
          registeredAtDesk: true,
          stage: t.stage < 2 ? 2 : t.stage,
        };
      }),
    );

    setDeskCustomGoal('');
    alert(
      `Регистрация команды «${deskShipName || activeDeskTeam.shipName}» на стойке успешно подтверждена!`,
    );
  };

  // Add custom goal to catalog
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalInput.trim()) return;
    const goal = newGoalInput.trim();
    if (!missionGoals.includes(goal)) {
      setMissionGoals((prev) => [...prev, goal]);
    }
    setNewGoalInput('');
  };

  // Pre-import new team by Administrator
  const handleAddPreImportTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.trim() || !newMentorName.trim()) return;

    const newTeam: CrmTeam = {
      id: `team-${Date.now()}`,
      school: newSchool.trim(),
      city: newCity.trim() || 'Пермь',
      mentorName: newMentorName.trim(),
      mentorEmail:
        newMentorEmail.trim() ||
        `${newMentorName.toLowerCase().replace(/\s+/g, '.')}@perm-school.ru`,
      shipName: `Корабль «${newSchool.slice(0, 15)}»`,
      cubesatName: 'КубСат-3U',
      missionGoal: missionGoals[0],
      missionGoalLocked: false,
      registeredAtDesk: false,
      stage: 1,
      students: [
        {
          id: `st-${Date.now()}-1`,
          name: newStudent1.trim() || 'Ученик 1',
          grade: '10 класс',
          role: STUDENT_ROLES[0],
          verifiedByCaptain: false,
        },
        {
          id: `st-${Date.now()}-2`,
          name: newStudent2.trim() || 'Ученик 2',
          grade: '10 класс',
          role: STUDENT_ROLES[1],
          verifiedByCaptain: false,
        },
        {
          id: `st-${Date.now()}-3`,
          name: newStudent3.trim() || 'Ученик 3',
          grade: '10 класс',
          role: STUDENT_ROLES[2],
          verifiedByCaptain: false,
        },
      ],
    };

    setTeams((prev) => [...prev, newTeam]);
    setNewSchool('');
    setNewMentorName('');
    setNewMentorEmail('');
    setNewStudent1('');
    setNewStudent2('');
    setNewStudent3('');
    alert(`Команда «${newTeam.school}» успешно добавлена в предварительный список!`);
  };

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase();
    return teams.filter(
      (t) =>
        t.school.toLowerCase().includes(q) ||
        t.mentorName.toLowerCase().includes(q) ||
        t.shipName.toLowerCase().includes(q) ||
        t.cubesatName.toLowerCase().includes(q) ||
        t.missionGoal.toLowerCase().includes(q),
    );
  }, [teams, searchQuery]);

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Top CRM Header */}
      <div className="bg-slate-900/95 rounded-2xl border border-cyan-500/30 p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  CRM-Система кейс-чемпионата «КОСМОПОРТ»
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Оргкомитет & Админ
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Канбан этапов, верификация экипажей, регистрация на стойке и фиксация целей миссий
              </p>
            </div>
          </div>
        </div>

        {/* Perm Time Clock UTC+5 */}
        <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-mono">
          <Clock className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase">
              Пермское время (UTC+5 / МСК+2):
            </div>
            <div className="text-amber-300 font-bold text-sm tracking-wider">
              {permTimeStr || '13:30:00'} • Пятница
            </div>
          </div>
        </div>
      </div>

      {/* CRM Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('kanban')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'kanban'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4 text-cyan-400" />
          <span>Канбан-доска (6 этапов)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {teams.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('desk')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'desk'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span>Регистрация на стойке (Капитан)</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'verification'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>Верификация учеников и ролей</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'import'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span>Предзагрузка списков (Админ)</span>
        </button>

        <button
          onClick={() => setActiveTab('goals')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'goals'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Target className="w-4 h-4 text-purple-400" />
          <span>Каталог целей миссий ({missionGoals.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. СТРАНИЦА: КАНБАН-ДОСКА + РАСПИСАНИЕ МЕРОПРИЯТИЯ             */}
      {/* ============================================================== */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
          {/* Schedule Banner in Perm Time */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-2xl border border-indigo-500/30 p-4 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Расписание кейс-чемпионата «КОСМОПОРТ» (Пятница, 13:30 – 17:00, Пермь UTC+5 /
                  МСК+2)
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                Цели миссий фиксируются в 14:00 со стартом!
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-3">
              {CHAMPIONSHIP_SCHEDULE.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between text-xs"
                >
                  <div>
                    <div className="font-mono text-[11px] font-bold text-amber-300 mb-0.5">
                      {item.time}
                    </div>
                    <div className="font-semibold text-slate-200 text-xs leading-snug">
                      {item.title}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kanban Board Container (6 Columns) */}
          <div className="overflow-x-auto pb-4 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 min-w-[1280px]">
              {KANBAN_STAGES.map((col) => {
                const columnTeams = filteredTeams.filter((t) => t.stage === col.id);

                return (
                  <div
                    key={col.id}
                    className="flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg min-h-[580px]"
                  >
                    {/* Column Header */}
                    <div className={`p-3 border-b border-slate-800 ${col.color}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate">{col.shortTitle}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-900 border border-current">
                          {columnTeams.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                        {col.description}
                      </p>
                    </div>

                    {/* Column Cards List */}
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[520px]">
                      {columnTeams.map((team) => {
                        const verifiedCount = team.students.filter(
                          (s) => s.verifiedByCaptain,
                        ).length;
                        const isFullyVerified = verifiedCount === team.students.length;

                        return (
                          <div
                            key={team.id}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-md group flex flex-col justify-between gap-2"
                          >
                            <div>
                              {/* School & City */}
                              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                                <span className="truncate">{team.city}</span>
                                <span className="font-bold text-cyan-400">#{team.id}</span>
                              </div>
                              <h4 className="text-xs font-bold text-white mt-0.5 leading-snug line-clamp-2">
                                {team.school}
                              </h4>

                              {/* Ship & CubeSat */}
                              <div className="mt-2 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono space-y-0.5">
                                <div className="text-slate-300 flex justify-between">
                                  <span className="text-slate-400">Корабль:</span>
                                  <strong className="text-white">{team.shipName}</strong>
                                </div>
                                <div className="text-slate-300 flex justify-between">
                                  <span className="text-slate-400">КубСат:</span>
                                  <span className="text-cyan-300 font-bold">
                                    {team.cubesatName}
                                  </span>
                                </div>
                              </div>

                              {/* Mission Goal with Lock Badge */}
                              <div className="mt-2 text-[10px]">
                                <div className="flex items-center justify-between text-slate-400 mb-0.5">
                                  <span>Цель миссии:</span>
                                  {team.missionGoalLocked ? (
                                    <span className="flex items-center gap-1 text-emerald-400 font-mono font-bold text-[9px]">
                                      <Lock className="w-2.5 h-2.5" /> Зафиксировано
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-amber-400 font-mono text-[9px]">
                                      <Unlock className="w-2.5 h-2.5" /> До старта
                                    </span>
                                  )}
                                </div>
                                <div className="p-1.5 rounded-lg bg-slate-900 text-slate-300 leading-snug line-clamp-2 border border-slate-800/60 font-sans">
                                  {team.missionGoal}
                                </div>
                              </div>

                              {/* Captain & Students status */}
                              <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] space-y-1">
                                <div className="flex justify-between text-slate-400">
                                  <span>Капитан (Учитель):</span>
                                  <span className="text-slate-200 truncate max-w-[120px] font-medium">
                                    {team.mentorName.split(' ')[0]}{' '}
                                    {team.mentorName.split(' ')[1] || ''}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                  <span>Ученики:</span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
                                      isFullyVerified
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    }`}
                                  >
                                    {verifiedCount}/{team.students.length} верифицировано
                                  </span>
                                </div>
                              </div>

                              {/* Jury Score if at stage 6 */}
                              {col.id === 6 && team.juryScore !== undefined && (
                                <div className="mt-2 p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-center font-mono text-xs font-bold">
                                  Баллы жюри: {team.juryScore} / 100
                                </div>
                              )}
                            </div>

                            {/* Stage Move Controls */}
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                              <button
                                disabled={team.stage <= 1}
                                onClick={() => handleMoveStage(team.id, -1)}
                                title="Предыдущий этап"
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-[10px] cursor-pointer"
                              >
                                ← Назад
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedTeamId(team.id);
                                  setActiveTab('verification');
                                }}
                                className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[10px] border border-cyan-500/30 cursor-pointer"
                              >
                                Состав
                              </button>

                              <button
                                disabled={team.stage >= 6}
                                onClick={() => handleMoveStage(team.id, 1)}
                                title="Следующий этап"
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-[10px] cursor-pointer"
                              >
                                Вперёд →
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {columnTeams.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-slate-600 text-xs">
                          <span>Нет команд на этом этапе</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. СТРАНИЦА: РЕГИСТРАЦИЯ НА СТОЙКЕ КОМАНДИРОМ (УЧИТЕЛЕМ)       */}
      {/* ============================================================== */}
      {activeTab === 'desk' && (
        <div className="bg-slate-900/90 rounded-2xl border border-amber-500/30 p-5 shadow-xl space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Очная регистрация на стойке ЦУП (Учитель-наставник / Капитан)
              </h3>
              <p className="text-xs text-slate-400">
                Капитан подтверждает прибытие экипажа, фиксирует имя CubeSat и выбирает или создает
                цель миссии.
              </p>
            </div>
          </div>

          <form onSubmit={handleDeskRegistrationSubmit} className="space-y-4 text-xs font-sans">
            {/* Select Team */}
            <div>
              <label className="block text-slate-300 font-bold mb-1 font-mono uppercase text-[11px]">
                Выберите школьную команду из списка:
              </label>
              <select
                value={deskTeamId}
                onChange={(e) => setDeskTeamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.school} — Наставник: {t.mentorName} (Этап #{t.stage})
                  </option>
                ))}
              </select>
            </div>

            {/* Mentor info */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
              <div className="text-slate-400 flex justify-between">
                <span>Учитель-наставник:</span>
                <strong className="text-white">{activeDeskTeam.mentorName}</strong>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Email для связи:</span>
                <span className="text-cyan-300">{activeDeskTeam.mentorEmail}</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Статус явки на стойке:</span>
                <span
                  className={
                    activeDeskTeam.registeredAtDesk
                      ? 'text-emerald-400 font-bold'
                      : 'text-amber-400'
                  }
                >
                  {activeDeskTeam.registeredAtDesk ? '✓ Зарегистрирован' : 'Ожидает отметки'}
                </span>
              </div>
            </div>

            {/* Ship Name & CubeSat Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1 font-mono uppercase text-[11px]">
                  Название космического корабля:
                </label>
                <input
                  type="text"
                  value={deskShipName}
                  onChange={(e) => setDeskShipName(e.target.value)}
                  placeholder="например, «Орион-81»"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 font-mono uppercase text-[11px]">
                  Имя наноспутника CubeSat:
                </label>
                <input
                  type="text"
                  value={deskCubesatName}
                  onChange={(e) => setDeskCubesatName(e.target.value)}
                  placeholder="например, «Парма-1»"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
            </div>

            {/* Mission Goal Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold font-mono uppercase text-[11px]">
                  Цель космической миссии (из списка):
                </label>
                {activeDeskTeam.missionGoalLocked && (
                  <span className="text-[10px] text-rose-400 font-mono flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Соревнование началось — цель заблокирована
                  </span>
                )}
              </div>
              <select
                disabled={activeDeskTeam.missionGoalLocked}
                value={deskSelectedGoal}
                onChange={(e) => setDeskSelectedGoal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-50 cursor-pointer"
              >
                {missionGoals.map((g, idx) => (
                  <option key={idx} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Mission Goal Creator */}
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">
                Или придумайте свою уникальную цель миссии (будет добавлена в общий каталог):
              </label>
              <input
                disabled={activeDeskTeam.missionGoalLocked}
                type="text"
                value={deskCustomGoal}
                onChange={(e) => setDeskCustomGoal(e.target.value)}
                placeholder="например: Мониторинг углеродного следа торфяников Прикамья спектрометром..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer text-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Подтвердить регистрацию команды у стойки</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. СТРАНИЦА: ВЕРИФИКАЦИЯ УЧЕНИКОВ И НАЗНАЧЕНИЕ РОЛЕЙ           */}
      {/* ============================================================== */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          {/* Header & Team Selector */}
          <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/30 p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <span>Верификация учеников капитаном корабля (учителем)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Каждый школьник выбирает роль из утверждённого списка. Капитан команды верифицирует
                статус допуска.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-mono shrink-0">Команда:</span>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.school} ({t.shipName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Team Student Roster */}
          {(() => {
            const currentTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
            const verifiedCount = currentTeam.students.filter((s) => s.verifiedByCaptain).length;

            return (
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="text-xs font-mono text-cyan-400 font-bold">
                      {currentTeam.school}
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      Корабль: «{currentTeam.shipName}» • КубСат: «{currentTeam.cubesatName}»
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Наставник / Капитан:{' '}
                      <strong className="text-slate-200">{currentTeam.mentorName}</strong>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
                        verifiedCount === currentTeam.students.length
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      Верификация: {verifiedCount} из {currentTeam.students.length}
                    </span>
                  </div>
                </div>

                {/* Student List Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {currentTeam.students.map((student, sIdx) => (
                    <div
                      key={student.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        student.verifiedByCaptain
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            Участник #{sIdx + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              student.verifiedByCaptain
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {student.verifiedByCaptain ? 'Верифицирован' : 'Не подтверждён'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white mt-1">{student.name}</h4>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {student.grade}
                        </div>

                        {/* Role Selector */}
                        <div className="mt-3">
                          <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                            Назначенная роль в экипаже:
                          </label>
                          <select
                            value={student.role}
                            onChange={(e) =>
                              handleChangeStudentRole(currentTeam.id, student.id, e.target.value)
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                          >
                            {STUDENT_ROLES.map((r, rIdx) => (
                              <option key={rIdx} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Captain Verification Button */}
                      <button
                        onClick={() => handleToggleStudentVerification(currentTeam.id, student.id)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          student.verifiedByCaptain
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 border border-slate-700'
                        }`}
                      >
                        <BadgeCheck className="w-4 h-4" />
                        <span>
                          {student.verifiedByCaptain
                            ? '✓ Верифицирован капитаном'
                            : 'Подтвердить участие (Верифицировать)'}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. СТРАНИЦА: ПРЕДЗАГРУЗКА СПИСКОВ КОМАНД АДМИНИСТРАТОРОМ       */}
      {/* ============================================================== */}
      {activeTab === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Add Team Form */}
          <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-blue-500/30 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <Plus className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Загрузка новой школьной команды администратором
              </h3>
            </div>

            <form onSubmit={handleAddPreImportTeam} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-mono text-[11px] mb-1">
                  Образовательное учреждение (Школа / Лицей / Гимназия):
                </label>
                <input
                  type="text"
                  value={newSchool}
                  onChange={(e) => setNewSchool(e.target.value)}
                  placeholder="МАОУ «СОШ №...» г. Перми"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-[11px] mb-1">
                  Город / Населённый пункт:
                </label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Пермь"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-mono text-[11px] mb-1">
                    Учитель-наставник (ФИО):
                  </label>
                  <input
                    type="text"
                    value={newMentorName}
                    onChange={(e) => setNewMentorName(e.target.value)}
                    placeholder="Иванова Ольга Сергеевна"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-mono text-[11px] mb-1">
                    Email наставника:
                  </label>
                  <input
                    type="email"
                    value={newMentorEmail}
                    onChange={(e) => setNewMentorEmail(e.target.value)}
                    placeholder="ivanova@school.perm.ru"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-mono text-[11px]">Список учеников (ФИО):</span>
                <input
                  type="text"
                  value={newStudent1}
                  onChange={(e) => setNewStudent1(e.target.value)}
                  placeholder="Ученик 1 (ФИО)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
                <input
                  type="text"
                  value={newStudent2}
                  onChange={(e) => setNewStudent2(e.target.value)}
                  placeholder="Ученик 2 (ФИО)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
                <input
                  type="text"
                  value={newStudent3}
                  onChange={(e) => setNewStudent3(e.target.value)}
                  placeholder="Ученик 3 (ФИО)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md active:scale-95 cursor-pointer mt-2"
              >
                + Добавить команду в реестр квоты
              </button>
            </form>
          </div>

          {/* Current Pre-imported Teams List */}
          <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase font-mono">
                Реестр приглашенных команд ({teams.length})
              </span>
              <span className="text-[11px] font-mono text-cyan-300">Квота закрыта на 100%</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{t.school}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Наставник: <span className="text-slate-200">{t.mentorName}</span> ({t.city})
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Экипаж: {t.students.map((s) => s.name).join(', ')}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-cyan-300 border border-slate-800">
                      Этап #{t.stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. СТРАНИЦА: КАТАЛОГ ЦЕЛЕЙ МИССИЙ                              */}
      {/* ============================================================== */}
      {activeTab === 'goals' && (
        <div className="bg-slate-900/90 rounded-2xl border border-purple-500/30 p-5 shadow-xl space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Каталог утвержденных целей космических миссий
                </h3>
                <p className="text-xs text-slate-400">
                  Список задач, которые капитан выбирает на стойке. Цель закрепляется в момент
                  старта.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/40">
              {missionGoals.length} целей
            </span>
          </div>

          {/* Add Goal Form */}
          <form onSubmit={handleAddGoal} className="flex gap-2">
            <input
              type="text"
              value={newGoalInput}
              onChange={(e) => setNewGoalInput(e.target.value)}
              placeholder="Добавить новую цель миссии CubeSat..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
            />
            <button
              type="submit"
              disabled={!newGoalInput.trim()}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              + Добавить в список
            </button>
          </form>

          {/* Goals List */}
          <div className="space-y-2 pt-2">
            {missionGoals.map((g, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs"
              >
                <span className="w-6 h-6 rounded-lg bg-purple-950 text-purple-300 border border-purple-500/30 flex items-center justify-center font-mono font-bold shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 text-slate-200 leading-relaxed font-sans">{g}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
