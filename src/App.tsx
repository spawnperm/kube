/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import {
  Rocket,
  Satellite,
  Activity,
  Layers,
  BookOpen,
  Radio,
  Sliders,
  Compass,
  Zap,
  Cpu,
  Thermometer,
  Shield,
  CheckCircle,
  CheckCircle2,
  Send,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Terminal,
  Calculator,
  RefreshCw,
  Globe,
  Award,
  Sun,
  Scale,
  UploadCloud,
  UserPlus,
  UserCheck,
  Server,
  MessageSquare,
  GraduationCap,
  BarChart3,
  FileText,
  Menu,
  X,
  PanelRight,
  Users,
  Sparkles,
  Bell,
  Presentation,
} from 'lucide-react';
import type { EventStageId, EventStageState } from './shared/types/stageDirector';
import { CRM_TEAMS_DATABASE } from './contexts/crew/data/crmTeamsData';

import { CubeSatCoreViewer, CubeSatSubsystem } from './components/CubeSatCoreViewer';
import { D3OrbitGroundTrackMap } from './components/telemetry/D3OrbitGroundTrackMap';
import { FloatingCubicMascot } from './components/ai/FloatingCubicMascot';
import { useTelemetrySimulator } from './hooks/useTelemetrySimulator';
import { useLiveChat } from './hooks/useLiveChat';
import { createId } from './utils/id';

// Types & Mock Data
import type {
  Team as CosmoportTeam,
  Submission as CosmoportSubmission,
  MentorMessage as CosmoportMentorMessage,
  AppNotification as CosmoportAppNotification,
  ActivityLog as CosmoportActivityLog,
  WidgetConfig as CosmoportWidgetConfig,
  SpaceMapObject as CosmoportSpaceMapObject,
  ForumTopic as CosmoportForumTopic,
  ForumReply as CosmoportForumReply,
  EducationalMaterial as CosmoportEducationalMaterial,
  ConnectedMobileDevice,
  UserRole as CosmoportUserRole,
  ChatChannel,
} from './types/index';
import {
  INITIAL_TEAMS,
  INITIAL_SUBMISSIONS,
  INITIAL_MENTOR_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY_LOGS,
  DEFAULT_WIDGETS,
  INITIAL_SPACE_OBJECTS,
  INITIAL_FORUM_TOPICS,
  INITIAL_EDUCATIONAL_MATERIALS,
  CASE_STAGES,
} from './data/mockData';

// Lazy-loaded Tab Components from reference
const TeamDashboardTab = lazy(() =>
  import('./components/tabs/TeamDashboardTab').then((m) => ({ default: m.TeamDashboardTab })),
);
const SubmissionsTab = lazy(() =>
  import('./components/tabs/SubmissionsTab').then((m) => ({ default: m.SubmissionsTab })),
);
const JuryPanelTab = lazy(() =>
  import('./components/tabs/JuryPanelTab').then((m) => ({ default: m.JuryPanelTab })),
);
const LeaderboardTab = lazy(() =>
  import('./components/tabs/LeaderboardTab').then((m) => ({ default: m.LeaderboardTab })),
);
const CosmoportHubTab = lazy(() =>
  import('./components/tabs/CosmoportHubTab').then((m) => ({ default: m.CosmoportHubTab })),
);
const TelemetryTab = lazy(() =>
  import('./components/tabs/TelemetryTab').then((m) => ({ default: m.TelemetryTab })),
);
const SpaceMapTab = lazy(() =>
  import('./components/tabs/SpaceMapTab').then((m) => ({ default: m.SpaceMapTab })),
);
const SpacePiTab = lazy(() =>
  import('./components/tabs/SpacePiTab').then((m) => ({ default: m.SpacePiTab })),
);
const ForumTab = lazy(() =>
  import('./components/tabs/ForumTab').then((m) => ({ default: m.ForumTab })),
);
const EducationTab = lazy(() =>
  import('./components/tabs/EducationTab').then((m) => ({ default: m.EducationTab })),
);
const MentorTab = lazy(() =>
  import('./components/tabs/MentorTab').then((m) => ({ default: m.MentorTab })),
);
const AnalyticsTab = lazy(() =>
  import('./components/tabs/AnalyticsTab').then((m) => ({ default: m.AnalyticsTab })),
);
const CertificatesTab = lazy(() =>
  import('./components/tabs/CertificatesTab').then((m) => ({ default: m.CertificatesTab })),
);
const PdfExportTab = lazy(() =>
  import('./components/tabs/PdfExportTab').then((m) => ({ default: m.PdfExportTab })),
);
const PortalPresentationTab = lazy(() =>
  import('./components/tabs/PortalPresentationTab').then((m) => ({
    default: m.PortalPresentationTab,
  })),
);
const TeamRegistrationForm = lazy(() =>
  import('./components/TeamRegistrationForm').then((m) => ({ default: m.TeamRegistrationForm })),
);
const CrmChampionshipScreen = lazy(() =>
  import('./components/crm/CrmChampionshipScreen').then((m) => ({
    default: m.CrmChampionshipScreen,
  })),
);
const RightSidebar = lazy(() =>
  import('./components/RightSidebar').then((m) => ({ default: m.RightSidebar })),
);
const VoiceAssistantModal = lazy(() =>
  import('./components/VoiceAssistantModal').then((m) => ({ default: m.VoiceAssistantModal })),
);
const DashboardCustomizer = lazy(() =>
  import('./components/DashboardCustomizer').then((m) => ({ default: m.DashboardCustomizer })),
);
const TeamMobileAuthQrModal = lazy(() =>
  import('./components/TeamMobileAuthQrModal').then((m) => ({
    default: m.TeamMobileAuthQrModal,
  })),
);

const StageDirectorScreen = lazy(() =>
  import('./app/screens/StageDirectorScreen').then((m) => ({ default: m.StageDirectorScreen })),
);
import { BottomStatusBar } from './components/BottomStatusBar';

export type MenuItemId =
  | 'mcc'
  | 'cubesat'
  | 'team'
  | 'spacepi'
  | 'registration'
  | 'submissions'
  | 'jury'
  | 'leaderboard'
  | 'cosmoport'
  | 'telemetry'
  | 'spacemap'
  | 'forum'
  | 'education'
  | 'mentor'
  | 'analytics'
  | 'certificates'
  | 'reports'
  | 'presentation'
  | 'crm'
  | 'stage_director';

export interface ChampionshipCompetitionStage {
  id: string;
  num: number;
  title: string;
  shortTitle: string;
  screenId: MenuItemId;
  directorStageId?: EventStageId;
  badge: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  adminControlDesc: string;
  targetScreenName: string;
}

export const COMPETITION_STAGES: ChampionshipCompetitionStage[] = [
  {
    id: 'pre_registration',
    num: 1,
    title: 'Предварительная регистрация',
    shortTitle: '1. Предв. рег.',
    screenId: 'registration',
    badge: 'Сбор анкет',
    color: 'from-sky-500 to-blue-600',
    icon: UserPlus,
    description: 'Сбор заявок школьных и студенческих экипажей, выбор тематики наноспутника CubeSat 3U',
    adminControlDesc: 'Пульт администратора: база входящих анкет, проверка школ и утверждение кураторов',
    targetScreenName: 'Экран регистрации команды',
  },
  {
    id: 'confirm_registration',
    num: 2,
    title: 'Подтверждение регистрации',
    shortTitle: '2. Подтверждение',
    screenId: 'crm',
    badge: 'Канбан верификации',
    color: 'from-indigo-500 to-cyan-600',
    icon: Users,
    description: 'Стойка очной/онлайн регистрации, верификация паспортов экипажей и выдача позывных',
    adminControlDesc: 'Пульт организатора: Канбан-доска верификации, допуск к старту и валидация состава',
    targetScreenName: 'Экран CRM Чемпионата (Канбан)',
  },
  {
    id: 'start_event',
    num: 3,
    title: 'Старт мероприятия',
    shortTitle: '3. Старт мероприятия',
    screenId: 'mcc',
    directorStageId: 'start_ships',
    badge: 'Live ЦУП',
    color: 'from-cyan-500 to-emerald-600',
    icon: Rocket,
    description: 'Официальное открытие, приветствие ЦУП, вывод на орбиту 10 наноспутников и включение маяков AX.25',
    adminControlDesc: 'Пульт режиссера: Трансляция 3D орбит, баннер открытия и скорость орбитального полета',
    targetScreenName: 'Главный экран ЦУП (3D CubeSat)',
  },
  {
    id: 'tasks_execution',
    num: 4,
    title: 'Выполнение заданий',
    shortTitle: '4. Выполнение заданий',
    screenId: 'submissions',
    badge: 'Банк 500 кейсов',
    color: 'from-amber-500 to-orange-600',
    icon: Layers,
    description: 'Инженерная работа: решение 5 этапов физических кейсов, расчет баллистики и 3D CAD компоновка',
    adminControlDesc: 'Пульт организатора: Банк заданий, тайминг дедлайнов этапов и проверка решений',
    targetScreenName: 'Экран загрузки решений (5 этапов)',
  },
  {
    id: 'readiness_defense',
    num: 5,
    title: 'Готовность к защите',
    shortTitle: '5. Готовность к защите',
    screenId: 'team',
    directorStageId: 'prep_blueprints',
    badge: 'Чек-лист допуска',
    color: 'from-purple-500 to-indigo-600',
    icon: Shield,
    description: 'Финальный аудит готовности экипажа: 3 слайда презентации, 3D CAD чертежи и прохождение предзащиты',
    adminControlDesc: 'Пульт режиссера: Проверка готовности подсистем (EPS, OBC, ADCS), модерация 3 слайдов к питчу',
    targetScreenName: 'Кабинет команды & Чертежи CubeSat',
  },
  {
    id: 'team_defense',
    num: 6,
    title: 'Защита команд',
    shortTitle: '6. Защита команд',
    screenId: 'jury',
    directorStageId: 'defense_pitch',
    badge: 'Питч перед жюри',
    color: 'from-rose-500 to-red-600',
    icon: Scale,
    description: 'Очные и онлайн защиты перед экспертами: трибуна команды, таймер питча и вопросы судейской коллегии',
    adminControlDesc: 'Пульт режиссера: Таймер регламента (300с питч / 180с Q&A), вызов команды на трибуну и протокол оценок',
    targetScreenName: 'Панель жюри & Трибуна питча',
  },
  {
    id: 'docs_preparation',
    num: 7,
    title: 'Подготовка документов',
    shortTitle: '7. Подготовка документов',
    screenId: 'certificates',
    badge: 'Итоги и дипломы',
    color: 'from-emerald-500 to-teal-600',
    icon: FileText,
    description: 'Подведение итогов кейс-чемпионата: сводный рейтинг, наградные дипломы и экспорт паспорта миссии',
    adminControlDesc: 'Пульт администратора: Итоговые ведомости, пакетная генерация сертификатов с QR и PDF-отчет',
    targetScreenName: 'Экран сертификатов & Отчетов',
  },
];

interface SidebarMenuItem {
  id: MenuItemId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'orbital' | 'championship' | 'community' | 'tools';
  badge?: string;
  pulse?: boolean;
  description?: string;
}

const MENU_ITEMS: SidebarMenuItem[] = [
  // Блок 1: ЦУП и Орбита
  {
    id: 'mcc',
    label: 'ЦУП (Главный экран)',
    icon: Activity,
    category: 'orbital',
    badge: '3D Live',
    pulse: true,
    description: '3D-модель CubeSat и статус борта',
  },
  {
    id: 'cubesat',
    label: 'CubeSat 3D CAD',
    icon: Layers,
    category: 'orbital',
    badge: '3U',
    description: 'Компоновка узлов и фотоэлементов',
  },
  {
    id: 'telemetry',
    label: 'Телеметрия',
    icon: Radio,
    category: 'orbital',
    badge: 'AX.25',
    pulse: true,
    description: 'Датчики питания, температур и маяк',
  },
  {
    id: 'spacemap',
    label: 'Карта космоса',
    icon: Globe,
    category: 'orbital',
    badge: 'СОНИКС',
    description: 'Орбитальные витки над станциями',
  },

  // Блок 2: Кейс-чемпионат
  {
    id: 'team',
    label: 'Кабинет команды',
    icon: Rocket,
    category: 'championship',
    badge: '85%',
    description: 'Дашборд экипажа и расписание',
  },
  {
    id: 'submissions',
    label: 'Загрузка решений',
    icon: UploadCloud,
    category: 'championship',
    badge: '5 этапов',
    description: 'Банк кейсов и пояснительные записки',
  },
  {
    id: 'registration',
    label: 'Регистрация команды',
    icon: UserPlus,
    category: 'championship',
    badge: 'Заявка',
    description: 'Форма экипажа и наставника',
  },
  {
    id: 'jury',
    label: 'Панель жюри',
    icon: Scale,
    category: 'championship',
    badge: 'Эксперт',
    description: 'Оценка физических решений',
  },
  {
    id: 'leaderboard',
    label: 'Рейтинг команд',
    icon: Award,
    category: 'championship',
    badge: '#1',
    description: 'Турнирная таблица чемпионата',
  },
  {
    id: 'spacepi',
    label: 'Заявка в Space-π',
    icon: Satellite,
    category: 'championship',
    badge: 'spacepi.space',
    pulse: true,
    description: 'Федеральная программа Роскосмоса',
  },
  {
    id: 'crm',
    label: 'CRM Чемпионата',
    icon: Users,
    category: 'championship',
    badge: 'Канбан 6 этапов',
    pulse: true,
    description: 'Канбан команд, стойка регистрации, верификация',
  },

  // Блок 3: Общение и знания
  {
    id: 'forum',
    label: 'Форум',
    icon: MessageSquare,
    category: 'community',
    badge: 'Обсуждения',
    description: 'Физические вопросы и обмен опытом',
  },
  {
    id: 'education',
    label: 'Обучение & 360°',
    icon: GraduationCap,
    category: 'community',
    description: 'Виртуальный тур и база знаний',
  },
  {
    id: 'mentor',
    label: 'Связь с ментором',
    icon: MessageSquare,
    category: 'community',
    description: 'Диалог с научным наставником',
  },

  // Блок 4: Инструменты и отчеты
  {
    id: 'analytics',
    label: 'Аналитика',
    icon: BarChart3,
    category: 'tools',
    description: 'Индекс освоенного объема SPI',
  },
  {
    id: 'certificates',
    label: 'Сертификаты',
    icon: Award,
    category: 'tools',
    badge: 'Диплом',
    description: 'Генератор дипломов участников',
  },
  {
    id: 'reports',
    label: 'PDF-Отчеты',
    icon: FileText,
    category: 'tools',
    description: 'Экспорт паспорта миссии',
  },
  {
    id: 'presentation',
    label: 'Презентация (.PPTX)',
    icon: Presentation,
    category: 'tools',
    badge: 'PPTX',
    description: '10 слайдов: функционал, задачи и руководства ролей',
  },
  {
    id: 'cosmoport',
    label: 'Шлюз портов',
    icon: Server,
    category: 'tools',
    badge: 'Pino/Cfg',
    description: 'Мониторинг сервисов и сетевых портов',
  },
];


export default function App() {
  const [activeTab, setActiveTab] = useState<MenuItemId>('registration');
  const [selectedSubsystem, setSelectedSubsystem] = useState<CubeSatSubsystem>('all');
  const [wingsDeployed, setWingsDeployed] = useState(false);
  const [solarDeploymentTrigger, setSolarDeploymentTrigger] = useState(0);
  const [cubesatFormat, setCubesatFormat] = useState<'1U' | '2U' | '3U'>('3U');

  // Управление этапами соревнования и пультом организатора
  const [currentCompetitionStageId, setCurrentCompetitionStageId] =
    useState<string>('start_event');
  const [isStagesMenuOpen, setIsStagesMenuOpen] = useState(false);
  const stagesMenuRef = useRef<HTMLDivElement>(null);

  // Оповещения ЦУП
  const [notifications, setNotifications] = useState<CosmoportAppNotification[]>(INITIAL_NOTIFICATIONS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isNotificationsOpen]);

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif: CosmoportAppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
    );
    if (notif.linkTab) {
      setActiveTab(notif.linkTab as MenuItemId);
    }
    setIsNotificationsOpen(false);
  };

  const [eventStageState, setEventStageState] = useState<EventStageState>({
    currentStage: 'start_ships',
    presentingTeamId: 'team-perm-01',
    activeSlideIndex: 0,
    orbitSpeed: 1,
    orbitViewMode: 'global',
    focusedSubsystem: 'EPS',
    timer: {
      totalSeconds: 300,
      remainingSeconds: 300,
      isRunning: false,
      mode: 'pitch',
    },
    announcement:
      'Кейс-чемпионат по прикладной физике «Космос-просто» и проектированию CubeSat 3U открыт!',
    tickerText:
      '★ ЦУП КОСМОПОРТ: 10 школьных наноспутников CubeSat 3U на орбите ★ Радиолиния СОНИКС 437.425 МГц ★',
    updatedAt: Date.now(),
    updatedBy: 'Координатор ЦУП',
  });

  // Закрытие меню этапов при клике вне компонента
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (stagesMenuRef.current && !stagesMenuRef.current.contains(e.target as Node)) {
        setIsStagesMenuOpen(false);
      }
    };
    if (isStagesMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isStagesMenuOpen]);

  // Загрузка актуального состояния этапа с сервера при инициализации
  useEffect(() => {
    fetch('/api/event/stage')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.currentStage) {
          setEventStageState(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleUpdateEventStage = (updated: Partial<EventStageState>) => {
    setEventStageState((prev) => ({
      ...prev,
      ...updated,
      timer: {
        ...prev.timer,
        ...(updated.timer || {}),
      },
      updatedAt: Date.now(),
      updatedBy: 'Координатор ЦУП',
    }));

    try {
      fetch('/api/event/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    } catch {}
  };

  const currentCompetitionStage = useMemo(
    () =>
      COMPETITION_STAGES.find((s) => s.id === currentCompetitionStageId) ||
      COMPETITION_STAGES[2],
    [currentCompetitionStageId],
  );

  const handleSelectStage = (stage: ChampionshipCompetitionStage) => {
    setCurrentCompetitionStageId(stage.id);
    setActiveTab(stage.screenId);
    if (stage.id === 'tasks_execution') {
      setWingsDeployed(true);
      setSolarDeploymentTrigger((n) => n + 1);
    }
    if (stage.directorStageId) {
      handleUpdateEventStage({ currentStage: stage.directorStageId });
    }
    setIsStagesMenuOpen(false);
  };

  // Domain State for Reference Tabs
  const [cosmoportTeams, setCosmoportTeams] = useState<CosmoportTeam[]>(INITIAL_TEAMS);
  const [activeTeamId, setActiveTeamId] = useState<string>(INITIAL_TEAMS[0].id);
  const [submissions, setSubmissions] = useState<CosmoportSubmission[]>(INITIAL_SUBMISSIONS);
  const [mentorMessages, setMentorMessages] =
    useState<CosmoportMentorMessage[]>(INITIAL_MENTOR_MESSAGES);
  const [spaceObjects, setSpaceObjects] =
    useState<CosmoportSpaceMapObject[]>(INITIAL_SPACE_OBJECTS);
  const [forumTopics, setForumTopics] = useState<CosmoportForumTopic[]>(INITIAL_FORUM_TOPICS);
  const [educationalMaterials, setEducationalMaterials] = useState<CosmoportEducationalMaterial[]>(
    INITIAL_EDUCATIONAL_MATERIALS,
  );
  const [activityLogs, setActivityLogs] = useState<CosmoportActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [widgets, setWidgets] = useState<CosmoportWidgetConfig[]>(DEFAULT_WIDGETS);
  const [userRole, setUserRole] = useState<CosmoportUserRole>('admin');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cosmoport_right_sidebar_open');
      if (saved !== null) return saved === 'true';
      return window.innerWidth >= 1024;
    }
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cosmoport_right_sidebar_open', String(isRightSidebarOpen));
    } catch {}
  }, [isRightSidebarOpen]);

  const [isVoiceAssistantModalOpen, setIsVoiceAssistantModalOpen] = useState(false);
  const [isCustomizerModalOpen, setIsCustomizerModalOpen] = useState(false);
  const [isMobileSyncModalOpen, setIsMobileSyncModalOpen] = useState(false);

  // Connected devices for active team
  const [connectedDevices, setConnectedDevices] = useState<ConnectedMobileDevice[]>([
    {
      id: 'dev_1',
      deviceName: 'iPhone 15 Pro (Капитан)',
      platform: 'ios',
      memberName: 'Иван Сергеев',
      memberRole: 'Капитан',
      connectedAt: '15 минут назад',
      lastActiveAt: 'Только что',
      batteryLevel: 91,
      pushEnabled: true,
      ipAddress: '192.168.1.104',
    },
  ]);

  // Telemetry Simulator
  const { telemetry, simSpeed, isPaused, setSimSpeed, togglePause, forceEvent } =
    useTelemetrySimulator();

  const activeTeam = useMemo(
    () => cosmoportTeams.find((t) => t.id === activeTeamId) || cosmoportTeams[0],
    [cosmoportTeams, activeTeamId],
  );

  // Live Chat Hook
  const {
    messages: chatMessages,
    activeChannel: activeChatChannel,
    isTyping: isChatTyping,
    setActiveChannel: setActiveChatChannel,
    sendMessage: handleSendChatMessage,
    addReaction: handleAddChatReaction,
    togglePin: handleToggleChatPin,
  } = useLiveChat({
    team: activeTeam,
    userRole,
    onActivityLog: (action, details) => {
      const nowStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      setActivityLogs((prev) => [
        {
          id: createId('log'),
          timestamp: `Сегодня, ${nowStr}`,
          userName: activeTeam.name,
          userRole: userRole === 'organizer' ? 'Оргкомитет' : 'Экипаж',
          action,
          details,
          type: 'mentor',
        },
        ...prev,
      ]);
    },
  });

  // Clocks
  const [timeUtc, setTimeUtc] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Terminal Packet Stream
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[INIT] ЦУП КОСМОПОРТ запущен на частоте 437.425 МГц (СОНИКС/Space-Pi)',
    '[OBC] Бортовой компьютер CubeSat 3U: STM32H743IIT6 — статус НОМИНАЛ',
    '[EPS] Контроллер питания: ток заряда +1.84 А, шина 8.24 В',
    '[ADCS] Маховики 3-осевой ориентации: раскрутка 3400 об/мин',
  ]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      const timestamp = new Date().toISOString().slice(11, 19);
      const volt = (telemetry.batteryVoltage || 8.2).toFixed(2);
      const temp = (telemetry.cpuTemperatureC || 19.5).toFixed(1);
      const rssi = Math.floor(-88 - Math.random() * 12);
      const seq = Math.floor(1000 + Math.random() * 9000);
      const newLog = `[${timestamp}] AX.25 SEQ#${seq} | BATT: ${volt}V | TEMP: ${temp}°C | RSSI: ${rssi} dBm | MODE: ${telemetry.mode || 'NORMAL'}`;

      setTerminalLogs((prev) => [newLog, ...prev.slice(0, 7)]);
    }, 3500);
    return () => clearInterval(interval);
  }, [telemetry, isPaused]);

  // Handlers for reference tabs
  const handleRegisterTeam = (newTeam: CosmoportTeam) => {
    setCosmoportTeams((prev) => [...prev, newTeam]);
    setActiveTeamId(newTeam.id);
    setActiveTab('team');
  };

  const handleSubmitSolution = (submissionData: Partial<CosmoportSubmission>) => {
    const stageId = submissionData.stageId || 'stage_1';
    const nowStr = new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    const newSub: CosmoportSubmission = {
      id: createId('sub'),
      teamId: activeTeam.id,
      stageId,
      title: submissionData.title || 'Решение этапа',
      summary: submissionData.summary || '',
      details: submissionData.details || '',
      calculations: submissionData.calculations || {},
      files: submissionData.files || [],
      repoUrl: submissionData.repoUrl,
      status: 'submitted',
      submittedAt: nowStr,
      updatedAt: nowStr,
    };
    setSubmissions((prev) => {
      const filtered = prev.filter((s) => !(s.teamId === activeTeam.id && s.stageId === stageId));
      return [newSub, ...filtered];
    });
  };

  const handleSimulateStatusChange = (
    submissionId: string,
    status: CosmoportSubmission['status'],
    juryFeedback?: CosmoportSubmission['juryFeedback'],
  ) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== submissionId) return s;
        return {
          ...s,
          status,
          juryFeedback: juryFeedback || s.juryFeedback,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  const handleEvaluateSubmission = (
    teamId: string,
    stageId: string,
    evaluation: {
      physicsAccuracy: number;
      engineeringRealism: number;
      scientificValue: number;
      documentationQuality: number;
      presentationClarity: number;
      comment: string;
      suggestions: string[];
      decision: 'approved' | 'revision';
    },
  ) => {
    const totalScore =
      evaluation.physicsAccuracy +
      evaluation.engineeringRealism +
      evaluation.scientificValue +
      evaluation.documentationQuality +
      evaluation.presentationClarity;

    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.teamId === teamId && s.stageId === stageId) {
          return {
            ...s,
            status: evaluation.decision === 'approved' ? 'approved' : 'needs_revision',
            juryFeedback: {
              juryId: 'jury-1',
              juryName: 'Проф. Мельников А.В.',
              juryTitle: 'Эксперт ЦУП',
              scores: {
                physicsAccuracy: evaluation.physicsAccuracy,
                engineeringRealism: evaluation.engineeringRealism,
                scientificValue: evaluation.scientificValue,
                documentationQuality: evaluation.documentationQuality,
                presentationClarity: evaluation.presentationClarity,
              },
              totalScore,
              comment: evaluation.comment,
              suggestions: evaluation.suggestions,
              reviewedAt: new Date().toLocaleDateString('ru-RU'),
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      }),
    );
  };

  const handleAddSpaceObject = (obj: CosmoportSpaceMapObject) => {
    setSpaceObjects((prev) => [...prev, obj]);
  };

  const handleDeleteSpaceObject = (id: string) => {
    setSpaceObjects((prev) => prev.filter((o) => o.id !== id));
  };

  const handleAddForumTopic = (topic: CosmoportForumTopic) => {
    setForumTopics((prev) => [topic, ...prev]);
  };

  const handleAddForumReply = (topicId: string, reply: CosmoportForumReply) => {
    setForumTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, replies: [...t.replies, reply] } : t)),
    );
  };

  const handleTogglePinTopic = (topicId: string) => {
    setForumTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, pinned: !t.pinned } : t)));
  };

  const handleToggleCloseTopic = (topicId: string) => {
    setForumTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, closed: !t.closed } : t)));
  };

  const handleDeleteForumTopic = (topicId: string) => {
    setForumTopics((prev) => prev.filter((t) => t.id !== topicId));
  };

  const handleDeleteForumReply = (topicId: string, replyId: string) => {
    setForumTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, replies: t.replies.filter((r) => r.id !== replyId) } : t,
      ),
    );
  };

  const handleAddEducationalMaterial = (mat: CosmoportEducationalMaterial) => {
    setEducationalMaterials((prev) => [mat, ...prev]);
  };

  const handleDeleteEducationalMaterial = (id: string) => {
    setEducationalMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSendMessage = (text: string) => {
    const newMsg: CosmoportMentorMessage = {
      id: createId('msg'),
      teamId: activeTeam.id,
      senderRole: 'team',
      senderName: activeTeam.name,
      timestamp: 'Только что',
      text,
    };
    setMentorMessages((prev) => [...prev, newMsg]);
  };

  const activeMenuItem = MENU_ITEMS.find((m) => m.id === activeTab) || MENU_ITEMS[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* ============================================================== */}
      {/* 1. НАВИГАЦИОННАЯ ПАНЕЛЬ (TOPBAR / HEADER)                       */}
      {/* ============================================================== */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 transition-all duration-300 shadow-md flex items-center shrink-0 ${
          isRightSidebarOpen ? 'lg:pr-88 xl:pr-96' : ''
        }`}
      >
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-3">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRightSidebarOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              title="Открыть меню разделов ЦУП"
            >
              {isRightSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => setActiveTab('mcc')}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/30 shrink-0">
                <Satellite className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-wider text-white">
                    КОСМО<span className="text-cyan-400">ПОРТ</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    ЦУП
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                  Единая платформа чемпионата & CubeSat 3U
                </p>
              </div>
            </div>
          </div>

          {/* ПАДАЮЩЕЕ МЕНЮ ЭТАПОВ СОРЕВНОВАНИЯ (ПРИВЯЗАНО К ЭКРАНАМ И ПУЛЬТУ УПРАВЛЕНИЯ) */}
          <div className="relative" ref={stagesMenuRef}>
            <button
              type="button"
              onClick={() => setIsStagesMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 hover:bg-slate-800 text-xs font-semibold transition-all shadow-sm cursor-pointer group"
              title="Этапы соревнования и экраны пульта управления"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-300 text-[10px] font-black font-mono border border-cyan-500/40 group-hover:scale-105 transition-transform">
                {currentCompetitionStage.num}
              </span>
              <div className="text-left hidden sm:block">
                <div className="text-[9px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                  <span>Этап турнира</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate max-w-[170px] md:max-w-[220px]">
                  <span>{currentCompetitionStage.title}</span>
                </div>
              </div>
              <span className="sm:hidden text-cyan-300 font-bold truncate max-w-[130px]">
                {currentCompetitionStage.shortTitle}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-transform ${
                  isStagesMenuOpen ? 'rotate-180 text-cyan-400' : ''
                }`}
              />
            </button>

            {/* Выпадающее меню 7 этапов соревнования */}
            {isStagesMenuOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 md:left-0 mt-2 w-[340px] sm:w-[460px] max-w-[94vw] rounded-2xl border border-cyan-500/40 bg-slate-950/98 p-3 sm:p-4 shadow-2xl backdrop-blur-2xl z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Этапы кейс-чемпионата «Космос-просто»</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Привязка к экранам участников, жюри и пульту управления
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    7 этапов
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[62vh] overflow-y-auto pr-1">
                  {COMPETITION_STAGES.map((stage) => {
                    const isSelected = stage.id === currentCompetitionStageId;
                    const StageIcon = stage.icon;

                    return (
                      <div
                        key={stage.id}
                        onClick={() => handleSelectStage(stage)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/50 border-cyan-400/60 shadow-lg shadow-cyan-500/10'
                            : 'bg-slate-900/60 hover:bg-slate-850/90 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black font-mono shrink-0 ${
                                isSelected
                                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {stage.num}
                            </span>
                            <div className="truncate">
                              <span
                                className={`text-xs font-bold tracking-wide truncate ${
                                  isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                                }`}
                              >
                                {stage.title}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              isSelected
                                ? 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {isSelected ? '● В эфире' : stage.badge}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 pl-8.5 leading-snug">
                          {stage.description}
                        </p>

                        <div className="pl-8.5 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-cyan-400 font-medium truncate max-w-[240px]">
                            🖥️ {stage.targetScreenName}
                          </span>
                          <span className="text-slate-500">
                            {stage.adminControlDesc.split(':')[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Быстрый доступ к пульту управления организатора/администратора */}
                {(userRole === 'admin' || userRole === 'organizer') && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('stage_director');
                        setIsStagesMenuOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 text-cyan-300 hover:text-white text-xs font-bold transition-all border border-cyan-500/40 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Открыть пульт управления режиссёра (Live Console)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Controls: Notifications & Sidebar Drawer Toggle */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {/* Значок оповещений (слева рядом) */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((v) => !v)}
                className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center border cursor-pointer relative ${
                  isNotificationsOpen
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-cyan-500/30'
                }`}
                title="Оповещения и события ЦУП"
                aria-label="Оповещения"
              >
                <Bell className="w-4 h-4 text-cyan-400" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-mono font-bold text-slate-950 ring-2 ring-slate-950">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Выпадающий список оповещений */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-[320px] sm:w-[380px] max-w-[92vw] rounded-2xl border border-cyan-500/40 bg-slate-950/98 p-3 shadow-2xl backdrop-blur-2xl z-50 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Оповещения ЦУП
                      </span>
                      {unreadNotificationsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {unreadNotificationsCount} новых
                        </span>
                      )}
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[10px] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        Прочитать все
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500">
                        Нет новых оповещений
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col gap-1 ${
                            notif.read
                              ? 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 text-slate-300'
                              : 'bg-cyan-950/20 border-cyan-500/30 hover:bg-cyan-950/40 text-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold truncate text-white">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2">
                            {notif.message}
                          </p>
                          {notif.linkTab && (
                            <div className="text-[10px] text-cyan-400 flex items-center gap-1 font-mono mt-0.5">
                              <span>Перейти в раздел</span>
                              <ChevronRight className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Правая боковая панель (упрощена до значка) */}
            <button
              onClick={() => setIsRightSidebarOpen((v) => !v)}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center border cursor-pointer relative ${
                isRightSidebarOpen
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-cyan-500/30'
              }`}
              title="Боковое меню ЦУП: разделы, экипаж и телеметрия"
              aria-label="Боковое меню"
            >
              <PanelRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. ГЛАВНАЯ СТРУКТУРА: БОКОВОЕ МЕНЮ (САЙДБАР) + КОНТЕНТ         */}
      {/* ============================================================== */}
      <div
        className={`flex-1 max-w-[1600px] w-full mx-auto flex flex-col md:flex-row gap-4 px-3 sm:px-5 pt-20 pb-16 sm:pb-20 transition-all duration-300 ${
          isRightSidebarOpen ? 'lg:pr-88 xl:pr-96' : ''
        }`}
      >


        {/* ============================================================ */}
        {/* ОБЛАСТЬ КОНТЕНТА: ОТОБРАЖЕНИЕ ВЫБРАННОГО РАЗДЕЛА             */}
        {/* ============================================================ */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">
          {/* ========================================================== */}
          {/* 1. РАЗДЕЛ: ЦУП (ГЛАВНЫЙ ЭКРАН С 3D CUBESAT В ЦЕНТРЕ)       */}
          {/* ========================================================== */}
          {activeTab === 'mcc' && (
            <div className="space-y-4">
              {/* Header Info Banner */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      ЦУП: Мониторинг наноспутника в реальном времени
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Интерактивная 3D-модель CubeSat 3U в центре экрана, подсистемы энергобаланса
                    EPS, ориентации ADCS и телеметрия
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => forceEvent('DETUMBLING')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition-all cursor-pointer"
                  >
                    Тест: Вращение
                  </button>
                  <button
                    onClick={() => forceEvent('NORMAL')}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-xs font-mono text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer"
                  >
                    Норма
                  </button>
                </div>
              </div>

              {/* 3D CUBESAT В ЦЕНТРЕ ГЛАВНОГО ЭКРАНА + HUD ВИДЖЕТЫ */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Левая колонка HUD: Подсистемы бортовой аппаратуры */}
                <div className="lg:col-span-3 space-y-3 order-2 lg:order-1">
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 shadow-xl backdrop-blur-md">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        <span>Бортовой комплекс</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        ОК
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* OBC */}
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                        <div className="flex justify-between items-center text-slate-300 font-semibold mb-1">
                          <span>OBC (Компьютер)</span>
                          <span className="text-emerald-400 text-[11px] font-mono">STM32H7</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
                          <div className="flex justify-between">
                            <span>Загрузка CPU:</span>
                            <span className="text-slate-200">14%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ОЗУ / ПЗУ:</span>
                            <span className="text-slate-200">18 / 64 MB</span>
                          </div>
                        </div>
                      </div>

                      {/* EPS */}
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                        <div className="flex justify-between items-center text-slate-300 font-semibold mb-1">
                          <span>EPS (Энергетика)</span>
                          <span className="text-cyan-400 text-[11px] font-mono">8.2 В</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
                          <div className="flex justify-between">
                            <span>Ток генерации:</span>
                            <span className="text-emerald-400">+1.84 А</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Потребление:</span>
                            <span className="text-amber-400">4.1 Вт</span>
                          </div>
                        </div>
                      </div>

                      {/* ADCS */}
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                        <div className="flex justify-between items-center text-slate-300 font-semibold mb-1">
                          <span>ADCS (Ориентация)</span>
                          <span className="text-purple-400 text-[11px] font-mono">3D-маховики</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
                          <div className="flex justify-between">
                            <span>Угл. скорость:</span>
                            <span className="text-slate-200">0.04 °/с</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Режим:</span>
                            <span className="text-purple-300">Надир (Земля)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Быстрые команды ЦУП */}
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-3.5 shadow-xl backdrop-blur-md">
                    <div className="text-xs font-bold text-slate-300 mb-2 font-mono flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Команды борта</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          setTerminalLogs((prev) => [
                            `[CMD] Отправка PING на борт CubeSat... Ответ ACK (RTT: 42мс)`,
                            ...prev,
                          ]);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition-all cursor-pointer text-center"
                      >
                        Ping / Опрос
                      </button>
                      <button
                        onClick={() => {
                          setTerminalLogs((prev) => [
                            `[CMD] Сброс гироскопов ADCS и калибровка магнитометра... ОК`,
                            ...prev,
                          ]);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition-all cursor-pointer text-center"
                      >
                        Калибровка
                      </button>
                    </div>
                  </div>
                </div>

                {/* ЦЕНТРАЛЬНАЯ 3D-МОДЕЛЬ CUBESAT НА THREE.JS */}
                <div className="lg:col-span-6 h-[460px] sm:h-[520px] order-1 lg:order-2">
                  <CubeSatCoreViewer
                    wingsDeployed={wingsDeployed}
                    onToggleWings={() => setWingsDeployed((v) => !v)}
                    highlightSubsystem={selectedSubsystem}
                    onSelectSubsystem={setSelectedSubsystem}
                    competitionStageId={currentCompetitionStageId}
                    deploymentTriggerKey={solarDeploymentTrigger}
                  />
                </div>

                {/* Правая колонка HUD: Орбитальные параметры и датчики */}
                <div className="lg:col-span-3 space-y-3 order-3">
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 shadow-xl backdrop-blur-md">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Globe className="w-4 h-4 text-purple-400" />
                        <span>Орбитальная баллистика</span>
                      </div>
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30">
                        ССО
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs font-mono">
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Высота апогея:</span>
                        <span className="text-cyan-400 font-bold">524.2 км</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Высота перигея:</span>
                        <span className="text-cyan-400 font-bold">518.7 км</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                        <span className="text-slate-200">97.45°</span>
                        <span className="text-slate-400">Наклонение i:</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Период витка T:</span>
                        <span className="text-purple-300 font-bold">95.02 мин</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Освещённость:</span>
                        <span className="text-amber-400 flex items-center gap-1">
                          <Sun className="w-3.5 h-3.5" /> Свет (36 мин)
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-400">Подспутник:</span>
                        <span className="text-emerald-400">58.01°N, 56.25°E</span>
                      </div>
                    </div>
                  </div>

                  {/* Термодатчики */}
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-2 text-xs font-bold text-white mb-2.5">
                      <Thermometer className="w-4 h-4 text-amber-400" />
                      <span>Температурный баланс</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Панель +X:</div>
                        <div className="text-amber-300 font-bold text-sm">+24.5 °C</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Панель -X:</div>
                        <div className="text-cyan-300 font-bold text-sm">-12.8 °C</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">АКБ модуль:</div>
                        <div className="text-emerald-300 font-bold text-sm">+18.2 °C</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Камера ДЗЗ:</div>
                        <div className="text-slate-200 font-bold text-sm">+15.0 °C</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 2. РАЗДЕЛ: CUBESAT 3D CAD                                  */}
          {/* ========================================================== */}
          {activeTab === 'cubesat' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    <span>3D CAD-инспекция наноспутника CubeSat</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Детальный интерактивный разбор 3U платформы: направляющие рельсы, солнечные
                    крылья, стек PC104 и оптика ДЗЗ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(['1U', '2U', '3U'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setCubesatFormat(fmt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        cubesatFormat === fmt
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[520px]">
                <CubeSatCoreViewer
                  wingsDeployed={wingsDeployed}
                  onToggleWings={() => setWingsDeployed((v) => !v)}
                  highlightSubsystem={selectedSubsystem}
                  onSelectSubsystem={setSelectedSubsystem}
                  competitionStageId={currentCompetitionStageId}
                  deploymentTriggerKey={solarDeploymentTrigger}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono mb-2">
                    <Shield className="w-4 h-4" />
                    <span>Габариты и масса (3U)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                    <li className="flex justify-between">
                      <span className="text-slate-400">Форм-фактор:</span>{' '}
                      <span>100×100×340.5 мм</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Сухая масса:</span> <span>3.20 кг</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Полезная нагрузка:</span>{' '}
                      <span>0.65 кг</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Полная масса:</span>{' '}
                      <span className="text-white font-bold">3.85 кг</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 font-mono mb-2">
                    <Zap className="w-4 h-4" />
                    <span>Энергосистема (EPS)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                    <li className="flex justify-between">
                      <span className="text-slate-400">Фотоэлементы:</span>{' '}
                      <span>GaAs тройной переход</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">КПД панелей:</span> <span>30.2%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Мощность на свету:</span>{' '}
                      <span>24.5 Вт</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Емкость батарей:</span>{' '}
                      <span className="text-white font-bold">40 Вт·ч (4×18650)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400 font-mono mb-2">
                    <Radio className="w-4 h-4" />
                    <span>Радиокомплекс (СОНИКС)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                    <li className="flex justify-between">
                      <span className="text-slate-400">Диапазон:</span> <span>UHF 435–438 МГц</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Мощность TX:</span>{' '}
                      <span>1.0 Вт (+30 дБм)</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Антенная система:</span>{' '}
                      <span>4 штыря / Turnstile</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Протокол:</span>{' '}
                      <span className="text-white font-bold">AX.25 Packet Radio</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* ОСТАЛЬНЫЕ ВКЛАДКИ ИЗ РЕФЕРЕНСА                             */}
          {/* ========================================================== */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-cyan-400 font-mono text-sm animate-pulse">
                  Загрузка модуля «{activeMenuItem.label}»...
                </div>
              </div>
            }
          >
            {/* КАБИНЕТ КОМАНДЫ */}
            {activeTab === 'team' && (
              <TeamDashboardTab
                team={activeTeam}
                telemetry={telemetry}
                widgets={widgets}
                userRole={userRole}
                chatMessages={chatMessages}
                activeChatChannel={activeChatChannel}
                onSendChatMessage={handleSendChatMessage}
                onAddChatReaction={handleAddChatReaction}
                onToggleChatPin={handleToggleChatPin}
                onChatChannelChange={setActiveChatChannel}
                isChatTyping={isChatTyping}
                onOpenCustomizer={() => {}}
                onNavigateTab={(tab) => setActiveTab(tab as MenuItemId)}
                connectedDevices={connectedDevices}
              />
            )}

            {/* ЗАГРУЗКА РЕШЕНИЙ (КЕЙСЫ) */}
            {activeTab === 'submissions' && (
              <div className="space-y-4">
                <div className="bg-slate-900/90 rounded-2xl border border-amber-500/30 p-4 shadow-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <h2 className="text-sm font-bold text-white">
                        3D Развертывание солнечных панелей • Этап выполнения заданий
                      </h2>
                    </div>
                    <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg self-start sm:self-auto">
                      Three.js • Энергопитание EPS (GaAs 24.5 Вт)
                    </span>
                  </div>
                  <div className="h-[380px] sm:h-[420px]">
                    <CubeSatCoreViewer
                      wingsDeployed={wingsDeployed}
                      onToggleWings={() => setWingsDeployed((v) => !v)}
                      highlightSubsystem={selectedSubsystem}
                      onSelectSubsystem={setSelectedSubsystem}
                      competitionStageId={currentCompetitionStageId}
                      deploymentTriggerKey={solarDeploymentTrigger}
                    />
                  </div>
                </div>

                <SubmissionsTab
                  team={activeTeam}
                  submissions={submissions}
                  onSubmitSolution={handleSubmitSolution}
                  onSimulateStatusChange={handleSimulateStatusChange}
                  onNavigateTab={(tab) => setActiveTab(tab as MenuItemId)}
                />
              </div>
            )}

            {/* РЕГИСТРАЦИЯ КОМАНДЫ */}
            {activeTab === 'registration' && (
              <div className="space-y-4">
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
                  <TeamRegistrationForm onRegisterTeam={handleRegisterTeam} isModal={false} />
                </div>

                {/* НИЖНЯЯ ПАНЕЛЬ: РАДИОМАЯК AX.25 И ТЕРМИНАЛ ПАКЕТОВ ТЕЛЕМЕТРИИ */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white font-mono">
                        Поток пакетов телеметрии AX.25 / Радиосеть «СОНИКС» (437.425 МГц)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Скорость: 9600 бод GFSK
                    </span>
                  </div>

                  <div className="bg-slate-950 rounded-xl p-3 font-mono text-xs text-slate-300 space-y-1 max-h-36 overflow-y-auto border border-slate-800">
                    {terminalLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`leading-relaxed ${
                          idx === 0 ? 'text-emerald-300 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ПАНЕЛЬ ЖЮРИ */}
            {activeTab === 'jury' && (
              <JuryPanelTab
                teams={cosmoportTeams}
                submissions={submissions}
                onEvaluateSubmission={handleEvaluateSubmission}
              />
            )}

            {/* РЕЙТИНГ КОМАНД */}
            {activeTab === 'leaderboard' && (
              <LeaderboardTab
                teams={cosmoportTeams}
                onSelectTeamForReport={(t) => {
                  setActiveTeamId(t.id);
                  setActiveTab('reports');
                }}
              />
            )}

            {/* ЗАЯВКА В SPACE-PI */}
            {activeTab === 'spacepi' && (
              <SpacePiTab
                team={activeTeam}
                allTeams={cosmoportTeams}
                submissions={submissions}
                userRole={userRole}
                onOpenStage={() => setActiveTab('submissions')}
              />
            )}

            {/* ТЕЛЕМЕТРИЯ */}
            {activeTab === 'telemetry' && (
              <TelemetryTab
                telemetry={telemetry}
                simSpeed={simSpeed}
                isPaused={isPaused}
                onSetSimSpeed={setSimSpeed}
                onTogglePause={togglePause}
                onForceEvent={forceEvent}
              />
            )}

            {/* КАРТА КОСМОСА С D3 ВИЗУАЛИЗАЦИЕЙ ОРБИТЫ */}
            {activeTab === 'spacemap' && (
              <div className="space-y-4">
                <D3OrbitGroundTrackMap telemetry={telemetry} />
                <SpaceMapTab
                  objects={spaceObjects}
                  activeTeam={activeTeam}
                  userRole={userRole}
                  onAddObject={handleAddSpaceObject}
                  onDeleteObject={handleDeleteSpaceObject}
                  telemetry={telemetry}
                />
              </div>
            )}

            {/* ФОРУМ */}
            {activeTab === 'forum' && (
              <ForumTab
                topics={forumTopics}
                activeTeam={activeTeam}
                userRole={userRole}
                onAddTopic={handleAddForumTopic}
                onAddReply={handleAddForumReply}
                onTogglePinTopic={handleTogglePinTopic}
                onToggleCloseTopic={handleToggleCloseTopic}
                onDeleteTopic={handleDeleteForumTopic}
                onDeleteReply={handleDeleteForumReply}
              />
            )}

            {/* ОБУЧЕНИЕ & 360° */}
            {activeTab === 'education' && (
              <EducationTab
                materials={educationalMaterials}
                userRole={userRole}
                onAddMaterial={handleAddEducationalMaterial}
                onDeleteMaterial={handleDeleteEducationalMaterial}
              />
            )}

            {/* СВЯЗЬ С МЕНТОРОМ */}
            {activeTab === 'mentor' && (
              <MentorTab
                team={activeTeam}
                messages={mentorMessages}
                onSendMessage={handleSendMessage}
              />
            )}

            {/* АНАЛИТИКА */}
            {activeTab === 'analytics' && (
              <AnalyticsTab
                team={activeTeam}
                allTeams={cosmoportTeams}
                activityLogs={activityLogs}
                onNavigateTab={(tab) => setActiveTab(tab as MenuItemId)}
              />
            )}

            {/* СЕРТИФИКАТЫ */}
            {activeTab === 'certificates' && (
              <CertificatesTab teams={cosmoportTeams} activeTeam={activeTeam} />
            )}

            {/* PDF-ОТЧЕТЫ */}
            {activeTab === 'reports' && (
              <PdfExportTab
                teams={cosmoportTeams}
                activeTeam={activeTeam}
                submissions={submissions}
                onOpenPresentation={() => setActiveTab('presentation')}
              />
            )}

            {/* ПРЕЗЕНТАЦИЯ ПОРТАЛА (.PPTX) */}
            {activeTab === 'presentation' && (
              <PortalPresentationTab
                activeTeam={activeTeam}
                totalTeams={cosmoportTeams.length}
              />
            )}

            {/* ШЛЮЗ ПОРТОВ */}
            {activeTab === 'cosmoport' && <CosmoportHubTab />}

            {/* CRM СИСТЕМА ЧЕМПИОНАТА (КАНБАН 6 ЭТАПОВ И РАСПИСАНИЕ) */}
            {activeTab === 'crm' &&
              (userRole === 'admin' || userRole === 'organizer' ? (
                <CrmChampionshipScreen
                  userRole={userRole}
                  onSelectTeamForInspection={(teamId) => setActiveTeamId(teamId)}
                />
              ) : (
                <div className="bg-slate-900/90 rounded-2xl border border-rose-500/30 p-8 shadow-xl text-center space-y-4 max-w-xl mx-auto my-8">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/40">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Доступ к CRM ограничен</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Экран CRM-системы чемпионата с канбан-доской и верификацией участников
                      доступен только для пользователей с ролью <strong>Администратор</strong> или{' '}
                      <strong>Оргкомитет</strong>.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <button
                      onClick={() => setUserRole('admin')}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95"
                    >
                      Переключить на роль Администратора
                    </button>
                    <button
                      onClick={() => setUserRole('organizer')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer shadow-md transition-all active:scale-95"
                    >
                      Переключить на роль Оргкомитета
                    </button>
                  </div>
                </div>
              ))}

            {/* ПУЛЬТ УПРАВЛЕНИЯ РЕЖИССЁРА (STAGE DIRECTOR LIVE DESK) */}
            {activeTab === 'stage_director' && (
              <StageDirectorScreen
                currentUser={{
                  id: 'coord-01',
                  name: 'Главный координатор ЦУП',
                  callsign: 'Flight-Dir',
                  role: userRole as any,
                  status: 'active',
                  avatarUrl: '',
                  joinedAt: '',
                }}
                eventStageState={eventStageState}
                onUpdateEventStage={handleUpdateEventStage}
                teamsRegistry={CRM_TEAMS_DATABASE}
                activeTeam={activeTeam}
                telemetry={telemetry}
                onNavigateToScreen={(scr) => setActiveTab(scr as MenuItemId)}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* ПРАВАЯ БОКОВАЯ ПАНЕЛЬ С МЕНЮ ЦУП И НАВИГАЦИЕЙ */}
      <Suspense fallback={null}>
        <RightSidebar
          isOpen={isRightSidebarOpen}
          initialAccordion="nav"
          onToggle={() => setIsRightSidebarOpen((v) => !v)}
          currentTab={activeTab}
          onTabChange={(tab) => {
            const tabMap: Record<string, MenuItemId> = {
              ship: 'mcc',
              mcc: 'mcc',
              stage_director: 'stage_director',
              inspectors: 'jury',
              jury: 'jury',
              admin: 'crm',
              crm: 'crm',
              pdf: 'reports',
              reports: 'reports',
              pptx: 'presentation',
              presentation: 'presentation',
            };
            const target = tabMap[tab] || (tab as MenuItemId);
            setActiveTab(target);
            // Only auto-close on mobile (< 1024px); keeps open on desktop
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setIsRightSidebarOpen(false);
            }
          }}
          userRole={userRole}
          onRoleChange={(role) => setUserRole(role as CosmoportUserRole)}
          activeTeam={activeTeam}
          allTeams={cosmoportTeams}
          onSelectTeam={(teamId) => setActiveTeamId(teamId)}
          telemetry={telemetry}
          simSpeed={simSpeed}
          isPaused={isPaused}
          onSetSimSpeed={setSimSpeed}
          onTogglePause={togglePause}
          onForceEvent={() => forceEvent()}
          onOpenVoiceAssistant={() => setIsVoiceAssistantModalOpen(true)}
          onOpenCustomizer={() => setIsCustomizerModalOpen(true)}
          onOpenRegistration={() => {
            setActiveTab('registration');
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setIsRightSidebarOpen(false);
            }
          }}
          onOpenMobileSync={() => setIsMobileSyncModalOpen(true)}
          connectedDevicesCount={connectedDevices.length}
          wingsDeployed={wingsDeployed}
          onToggleWings={() => setWingsDeployed((v) => !v)}
          userName="Анатолий Копанев"
          userEmail="anatoliy.kopanev74@gmail.com"
          eventStageState={eventStageState}
          onUpdateEventStage={handleUpdateEventStage}
        />

        {/* МОДАЛЬНЫЕ ОКНА ИЗ ПРАВОГО МЕНЮ */}
        {isVoiceAssistantModalOpen && (
          <VoiceAssistantModal
            isOpen={isVoiceAssistantModalOpen}
            onClose={() => setIsVoiceAssistantModalOpen(false)}
            activeTeam={activeTeam}
            telemetry={telemetry}
          />
        )}
        {isCustomizerModalOpen && (
          <DashboardCustomizer
            isOpen={isCustomizerModalOpen}
            onClose={() => setIsCustomizerModalOpen(false)}
            widgets={widgets}
            onToggleWidget={(id) => {
              setWidgets((prev) =>
                prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
              );
            }}
            onMoveWidget={(id, dir) => {
              setWidgets((prev) => {
                const idx = prev.findIndex((w) => w.id === id);
                if (idx === -1) return prev;
                const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
                if (targetIdx < 0 || targetIdx >= prev.length) return prev;
                const copy = [...prev];
                const temp = copy[idx];
                copy[idx] = copy[targetIdx];
                copy[targetIdx] = temp;
                return copy.map((w, i) => ({ ...w, order: i + 1 }));
              });
            }}
            onApplyPreset={(preset) => {
              if (preset === 'all') {
                setWidgets((prev) => prev.map((w) => ({ ...w, visible: true })));
              } else if (preset === 'minimal') {
                setWidgets((prev) => prev.map((w, i) => ({ ...w, visible: i < 3 })));
              } else {
                setWidgets((prev) =>
                  prev.map((w) => ({ ...w, visible: w.category === preset || w.order <= 2 })),
                );
              }
            }}
            onResetWidgets={() => setWidgets(DEFAULT_WIDGETS)}
          />
        )}
        {isMobileSyncModalOpen && (
          <TeamMobileAuthQrModal
            isOpen={isMobileSyncModalOpen}
            onClose={() => setIsMobileSyncModalOpen(false)}
            team={activeTeam}
            userRole={userRole}
            connectedDevices={connectedDevices}
            onAddDevice={(dev) => setConnectedDevices((prev) => [dev, ...prev])}
            onRemoveDevice={(devId) =>
              setConnectedDevices((prev) => prev.filter((d) => d.id !== devId))
            }
          />
        )}
      </Suspense>

      {/* ПЛАВАЮЩИЙ AI-МАСКОТ «КУБИК» С ГОЛОСОВЫМ УПРАВЛЕНИЕМ ТЕЛЕМЕТРИЕЙ */}
      <FloatingCubicMascot
        telemetry={telemetry}
        isPaused={isPaused}
        simSpeed={simSpeed}
        wingsDeployed={wingsDeployed}
        onTogglePause={togglePause}
        onSetSimSpeed={setSimSpeed}
        onForceEvent={forceEvent}
        onToggleWings={() => setWingsDeployed((v) => !v)}
      />

      {/* СТРОКА СТАТУСА ЦУП С ЭМУЛЯТОРОМ ТЕРМИНАЛА И ГОЛОСОВЫМ УПРАВЛЕНИЕМ */}
      <BottomStatusBar
        telemetry={telemetry}
        simSpeed={simSpeed}
        isPaused={isPaused}
        wingsDeployed={wingsDeployed}
        onTogglePause={togglePause}
        onSetSimSpeed={setSimSpeed}
        onForceEvent={forceEvent}
        onToggleWings={() => setWingsDeployed((v) => !v)}
        activeTab={activeTab}
        onNavigateToScreen={(screenId) => setActiveTab(screenId)}
        userRole={userRole}
        onRoleChange={(role) => setUserRole(role)}
        activeTeam={activeTeam}
        allTeams={cosmoportTeams}
        onSelectTeam={(teamId) => setActiveTeamId(teamId)}
        currentStageNum={currentCompetitionStage.num}
        onSelectStage={(stageId) => {
          const st = COMPETITION_STAGES.find((s) => s.id === stageId);
          if (st) handleSelectStage(st);
        }}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen((v) => !v)}
        onOpenVoiceModal={() => setIsVoiceAssistantModalOpen(true)}
      />
    </div>
  );
}
