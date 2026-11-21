import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Rocket,
  Satellite,
  Award,
  UploadCloud,
  Scale,
  MessageSquare,
  BarChart3,
  FileText,
  Sliders,
  Globe,
  GraduationCap,
  Mic,
  MicOff,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Play,
  Pause,
  Zap,
  Activity,
  Copy,
  Check,
  Shield,
  Users,
  Compass,
  Radio,
  ExternalLink,
  BookOpen,
  UserPlus,
  Battery,
  Thermometer,
  Sun,
  Flame,
  QrCode,
  Search,
  Layers,
  Server,
  CheckCircle2,
  User,
  Bot,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  ClipboardList,
  FlaskConical,
  Cpu,
  Tv,
  Presentation,
  Download,
} from 'lucide-react';
import type { UserRole, Team, TelemetryPacket } from '../types';
import type { EventStageState } from '../shared/types/stageDirector';
import { GeminiLiveVoiceModal } from '../contexts/ai/components/GeminiLiveVoiceModal';
import { audioService } from '../shared/lib/audioService';
import { downloadPortalPresentationPptx } from '../services/presentationPptxExport';
import { downloadPortalPresentationPdf } from '../services/presentationPdfExport';

export type AiRoleAgent = 'professor' | 'engineer' | 'biochem' | 'registrar';

export interface AiAgentRoleMeta {
  id: AiRoleAgent;
  title: string;
  shortRole: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  activeColor: string;
  badgeBg: string;
  quickPrompts: string[];
}

export const AI_AGENT_ROLES: AiAgentRoleMeta[] = [
  {
    id: 'professor',
    title: 'Профессор физики',
    shortRole: 'Баллистика и теория',
    desc: 'Формула Циолковского, законы Кеплера, механика орбит и термодинамика',
    icon: GraduationCap,
    iconColor: 'text-indigo-400',
    activeColor: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    quickPrompts: [
      'Как рассчитать delta-V по Циолковскому?',
      'Период обращения на высоте 500 км',
      'Закон сохранения момента импульса CubeSat',
    ],
  },
  {
    id: 'engineer',
    title: 'Конструктор CubeSat',
    shortRole: 'Бортовые системы',
    desc: 'Компоновка 1U/3U, солнечные панели GaAs, подсистемы EPS, OBC и ADCS',
    icon: Cpu,
    iconColor: 'text-emerald-400',
    activeColor: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    quickPrompts: [
      'Энергобаланс CubeSat 3U на солнечной стороне',
      'Подсистема ориентации ADCS и магнеторокеры',
      'Параметры радиолинии AX.25 на 437.425 МГц',
    ],
  },
  {
    id: 'biochem',
    title: 'Штурман БиоХим',
    shortRole: 'Химия и биосенсоры',
    desc: 'Реакция Сабатье, биологические датчики, ракетные топлива и атмосфера',
    icon: FlaskConical,
    iconColor: 'text-amber-400',
    activeColor: 'bg-amber-500/20 border-amber-500/40 text-amber-200',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    quickPrompts: [
      'Уравнение реакции Сабатье для регенерации CO2',
      'Защита биосенсоров от космической радиации',
      'Холодный газ vs электротермическая тяга',
    ],
  },
  {
    id: 'registrar',
    title: 'Регистратор ЦУП',
    shortRole: 'Регламент и критерии',
    desc: 'Регламент защиты из 3-х слайдов, дедлайны турнира и критерии жюри',
    icon: ClipboardList,
    iconColor: 'text-sky-400',
    activeColor: 'bg-sky-500/20 border-sky-500/40 text-sky-200',
    badgeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
    quickPrompts: [
      'Что должно быть на каждом из 3-х слайдов?',
      'Критерии оценивания решений экспертами жюри',
      'Сроки подачи паспорта миссии и решений кейса',
    ],
  },
];

export type NavCategoryKey = 'orbital' | 'championship' | 'community' | 'tools';

export interface NavCategoryMeta {
  key: NavCategoryKey;
  label: string;
  icon: string;
  badgeColor: string;
  desc: string;
}

export const NAV_CATEGORIES: NavCategoryMeta[] = [
  {
    key: 'orbital',
    label: 'ЦУП и Орбитальная группировка',
    icon: '🛰️',
    badgeColor: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10',
    desc: '3D-модель CubeSat, ориентация, маяк и витки',
  },
  {
    key: 'championship',
    label: 'Кейс-чемпионат и Управление',
    icon: '🏆',
    badgeColor: 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10',
    desc: 'Решения кейсов, жюри, CRM команд и Space-π',
  },
  {
    key: 'community',
    label: 'Знания, Наставничество и Сообщество',
    icon: '💬',
    badgeColor: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
    desc: 'Теория орбит, связь с ментором и обсуждения',
  },
  {
    key: 'tools',
    label: 'Инструменты, Аналитика и Отчеты',
    icon: '📊',
    badgeColor: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
    desc: 'Индекс SPI, сертификаты дипломов и PDF',
  },
];

export interface NavSectionItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: NavCategoryKey;
  badge?: string;
  pulse?: boolean;
  description: string;
  roles: UserRole[];
  roleHighlight?: string;
}

export interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTeam: Team;
  allTeams: Team[];
  onSelectTeam: (teamId: string) => void;
  telemetry: TelemetryPacket;
  simSpeed: number;
  isPaused: boolean;
  onSetSimSpeed: (speed: number) => void;
  onTogglePause: () => void;
  onForceEvent: () => void;
  onOpenVoiceAssistant: () => void;
  onOpenCustomizer: () => void;
  onOpenRegistration: () => void;
  onOpenMobileSync?: () => void;
  connectedDevicesCount?: number;
  initialAccordion?: 'hud' | 'nav' | 'crew' | 'tools' | 'ai';
  wingsDeployed?: boolean;
  onToggleWings?: () => void;
  userName?: string;
  userEmail?: string;
  eventStageState?: EventStageState;
  onUpdateEventStage?: (updated: Partial<EventStageState>) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  onToggle,
  currentTab,
  onTabChange,
  userRole,
  onRoleChange,
  activeTeam,
  allTeams,
  onSelectTeam,
  telemetry,
  simSpeed,
  isPaused,
  onSetSimSpeed,
  onTogglePause,
  onForceEvent,
  onOpenVoiceAssistant,
  onOpenCustomizer,
  onOpenRegistration,
  onOpenMobileSync,
  connectedDevicesCount = 0,
  initialAccordion = 'hud',
  wingsDeployed = false,
  onToggleWings,
  userName = 'Анатолий Копанев',
  userEmail = 'anatoliy.kopanev74@gmail.com',
  eventStageState,
  onUpdateEventStage,
}) => {
  const [activeAccordion, setActiveAccordion] = useState<'hud' | 'nav' | 'crew' | 'tools' | 'ai'>(
    initialAccordion,
  );
  const [sidebarAnnouncement, setSidebarAnnouncement] = useState(
    eventStageState?.announcement || 'Приветствуем экипажи кейс-чемпионата «КОСМОПОРТ»!',
  );
  const [announcementSavedNotice, setAnnouncementSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (eventStageState?.announcement) {
      setSidebarAnnouncement(eventStageState.announcement);
    }
  }, [eventStageState?.announcement]);

  const [copiedTelemetry, setCopiedTelemetry] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const [navRoleFilter, setNavRoleFilter] = useState<'all' | 'my_role'>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Состояние AI-агентов (Кубик, Профессор, Конструктор, БиоХим, Регистратор)
  const [aiSelectedRole, setAiSelectedRole] = useState<AiRoleAgent>('professor');
  const [aiMessages, setAiMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'cubic';
    text: string;
    roleAgent: AiRoleAgent;
    timestamp: string;
  }>>([
    {
      id: 'init-msg',
      sender: 'cubic',
      text: `Приветствую! Я бортовой маскот «Кубик». Готов помочь экипажу «${activeTeam.name}». Выберите роль (Профессор, Конструктор, БиоХим или Регистратор) и задайте вопрос текстом или голосом!`,
      roleAgent: 'professor',
      timestamp: 'Сейчас',
    },
  ]);
  const [aiInputText, setAiInputText] = useState('');
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiIsListening, setAiIsListening] = useState(false);
  const [aiSoundEnabled, setAiSoundEnabled] = useState(true);
  const [isLiveVoiceModalOpen, setIsLiveVoiceModalOpen] = useState(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeAccordion === 'ai') {
      aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, aiIsLoading, activeAccordion]);

  const currentAiAgent = useMemo(
    () => AI_AGENT_ROLES.find((a) => a.id === aiSelectedRole) || AI_AGENT_ROLES[0],
    [aiSelectedRole],
  );

  const handleSendAiMessage = async (textToSend?: string) => {
    const query = (textToSend || aiInputText).trim();
    if (!query || aiIsLoading) return;

    setAiInputText('');
    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user' as const,
      text: query,
      roleAgent: aiSelectedRole,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          roleAgent: aiSelectedRole,
          teamContext: {
            taskTitle: activeTeam.name || 'Космическая миссия',
            projectName: activeTeam.cubesatSpecs?.satelliteName || 'CubeSat 3U',
            step: 'Кейс-чемпионат',
          },
        }),
      });

      const data = await response.json();
      const replyText =
        data.reply ||
        'Извините, радиолиния перегружена. Ответ сформирован локальным блоком памяти Кубика.';

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'cubic' as const,
        text: replyText,
        roleAgent: aiSelectedRole,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setAiMessages((prev) => [...prev, botMsg]);

      if (aiSoundEnabled) {
        audioService.speak(replyText, aiSelectedRole);
      }
    } catch {
      const fallbackMsg = {
        id: `bot-${Date.now()}`,
        sender: 'cubic' as const,
        text: 'Бортовой компьютер переключен в автономный режим. Связь с орбитальным сервером восстанавливается.',
        roleAgent: aiSelectedRole,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setAiMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setAiIsLoading(false);
    }
  };

  const handleToggleAiVoiceInput = () => {
    if (aiIsListening) {
      audioService.stopListening();
      setAiIsListening(false);
      return;
    }

    const started = audioService.startListening({
      onStart: () => {
        setAiIsListening(true);
        audioService.stopSpeaking();
      },
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          setAiIsListening(false);
          handleSendAiMessage(transcript);
        }
      },
      onError: () => {
        setAiIsListening(false);
      },
      onEnd: () => {
        setAiIsListening(false);
      },
    });

    if (!started) {
      setAiIsListening(false);
    }
  };

  const handleSpeakAiMessage = (text: string, role: AiRoleAgent) => {
    audioService.speak(text, role);
  };

  const toggleCategory = (key: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const roleConfigs: Record<UserRole, { label: string; desc: string; icon: string }> = {
    admin: { label: 'Администратор', desc: 'Главный координатор', icon: '🛠️' },
    organizer: { label: 'ЦУП / Оргкомитет', desc: 'Управление турниром', icon: '🛰️' },
    mentor: { label: 'Ментор', desc: 'Научный куратор', icon: '🔭' },
    participant: { label: 'Участник', desc: 'Экипаж команды', icon: '🚀' },
    jury: { label: 'Жюри', desc: 'Экспертная комиссия', icon: '⚖️' },
    expert: { label: 'Эксперт', desc: 'Оценка проектов', icon: '⚖️' },
  };

  // Полный каталог 18 разделов платформы, сгруппированный по функционалу и сопоставленный с ролями
  const allNavSections: NavSectionItem[] = useMemo(
    () => [
      // 1. ЦУП и Орбитальная группировка
      {
        id: 'mcc',
        label: 'ЦУП: Орбитальный полёт (3D)',
        icon: Activity,
        category: 'orbital',
        badge: '3D Live',
        pulse: true,
        description: '3D-модель CubeSat, углы ориентации и прямая телеметрия',
        roles: ['participant', 'mentor', 'organizer', 'admin', 'jury', 'expert'],
        roleHighlight: 'ЦУП Live',
      },
      {
        id: 'cubesat',
        label: 'CubeSat 3D CAD',
        icon: Layers,
        category: 'orbital',
        badge: '3U',
        description: 'Интерактивная 3D-компоновка узлов, приборов и фотоэлементов',
        roles: ['participant', 'mentor', 'organizer', 'admin'],
        roleHighlight: 'Инженерия',
      },
      {
        id: 'telemetry',
        label: 'Телеметрия CubeSat AX.25',
        icon: Radio,
        category: 'orbital',
        badge: '437.425 МГц',
        pulse: true,
        description: 'Энергосистема 8.2 В, термодатчики, радиомаяк и статус подсистем',
        roles: ['participant', 'mentor', 'organizer', 'admin'],
        roleHighlight: 'Радиоканал',
      },
      {
        id: 'spacemap',
        label: 'Карта космоса СОНИКС',
        icon: Globe,
        category: 'orbital',
        badge: 'Орбита',
        description: 'Орбитальные витки наноспутников и зоны радиовидимости станций',
        roles: ['participant', 'mentor', 'organizer', 'admin'],
      },

      // 2. Кейс-чемпионат и Управление
      {
        id: 'team',
        label: 'Кабинет команды',
        icon: Rocket,
        category: 'championship',
        badge: `${activeTeam.launchReadinessPercent}%`,
        description: 'Паспорт экипажа, расписание миссии и график подготовки',
        roles: ['participant', 'mentor', 'organizer', 'admin'],
        roleHighlight: 'Основной кабинет',
      },
      {
        id: 'submissions',
        label: 'Подача решений (Кейсы)',
        icon: UploadCloud,
        category: 'championship',
        badge: '5 этапов',
        description: 'Загрузка решений, банк 500 кейсов, презентации и рецензии жюри',
        roles: ['participant', 'mentor', 'jury', 'expert', 'organizer', 'admin'],
        roleHighlight: 'Защита решений',
      },
      {
        id: 'crm',
        label: 'CRM Чемпионата (Канбан)',
        icon: Users,
        category: 'championship',
        badge: 'Канбан 6 этапов',
        pulse: true,
        description: 'Канбан-доска команд, стойка регистрации и верификация участников',
        roles: ['organizer', 'admin'],
        roleHighlight: 'Координация',
      },
      {
        id: 'stage_director',
        label: 'Пульт режиссёра (Live Console)',
        icon: Sliders,
        category: 'championship',
        badge: 'Live',
        pulse: true,
        description: 'Управление 7 этапами чемпионата, таймерами питча, трибуной и экранами зала',
        roles: ['organizer', 'admin'],
        roleHighlight: 'Главный пульт',
      },
      {
        id: 'registration',
        label: 'Регистрация команды',
        icon: UserPlus,
        category: 'championship',
        badge: 'Заявка',
        description: 'Подача заявок на участие экипажа и научного руководителя',
        roles: ['participant', 'mentor', 'organizer', 'admin'],
      },
      {
        id: 'jury',
        label: 'Панель жюри & Экспертиза',
        icon: Scale,
        category: 'championship',
        badge: 'Судейство',
        description: 'Оценка физических решений, критерии и ведомости проверки',
        roles: ['jury', 'expert', 'organizer', 'admin'],
        roleHighlight: 'Экспертная комиссия',
      },
      {
        id: 'leaderboard',
        label: 'Рейтинг команд',
        icon: Award,
        category: 'championship',
        badge: `#${activeTeam.rank || 1}`,
        description: 'Турнирная таблица чемпионата и сводный рейтинг баллов',
        roles: ['participant', 'mentor', 'jury', 'expert', 'organizer', 'admin'],
      },
      {
        id: 'spacepi',
        label: 'Заявка в Space-π',
        icon: Satellite,
        category: 'championship',
        badge: 'Роскосмос',
        pulse: true,
        description: 'Федеральная программа Роскосмоса по попутному запуску наноспутников',
        roles: ['participant', 'mentor', 'organizer', 'admin'],
      },

      // 3. Знания, Наставничество и Сообщество
      {
        id: 'education',
        label: 'Обучение & 360°',
        icon: GraduationCap,
        category: 'community',
        badge: 'База знаний',
        description: 'Интерактивные курсы физики орбит и 3D-панорамы космодромов',
        roles: ['participant', 'mentor', 'organizer', 'admin'],
      },
      {
        id: 'mentor',
        label: 'Связь с ментором',
        icon: MessageSquare,
        category: 'community',
        badge: 'Куратор',
        description: 'Консультации с научным наставником и разбор физических задач',
        roles: ['participant', 'mentor', 'organizer', 'admin'],
        roleHighlight: 'Научный куратор',
      },
      {
        id: 'forum',
        label: 'Форум и обсуждения',
        icon: MessageSquare,
        category: 'community',
        badge: 'Q&A',
        description: 'Обсуждение инженерных вопросов, баллистики и радиосвязи',
        roles: ['participant', 'mentor', 'jury', 'expert', 'organizer', 'admin'],
      },

      // 4. Инструменты, Аналитика и Отчеты
      {
        id: 'analytics',
        label: 'Аналитика & Индекс SPI',
        icon: BarChart3,
        category: 'tools',
        badge: 'SPI',
        description: 'Индекс освоенного объема (SPI), темп подготовки и статистика',
        roles: ['organizer', 'admin', 'mentor', 'jury', 'expert'],
      },
      {
        id: 'certificates',
        label: 'Сертификаты участия',
        icon: Award,
        category: 'tools',
        badge: 'PDF',
        description: 'Генерация официальных именных дипломов экипажа и наставников',
        roles: ['participant', 'mentor', 'organizer', 'admin'],
      },
      {
        id: 'reports',
        label: 'PDF-Отчеты миссии',
        icon: FileText,
        category: 'tools',
        badge: 'Экспорт',
        description: 'Экспорт проектной документации и паспорта космической миссии',
        roles: ['participant', 'mentor', 'jury', 'expert', 'organizer', 'admin'],
      },
      {
        id: 'presentation',
        label: 'Презентация портала (.PPTX)',
        icon: Presentation,
        category: 'tools',
        badge: 'PPTX',
        description: '10 слайдов: функционал, задачи и руководства для всех ролей',
        roles: ['participant', 'mentor', 'jury', 'expert', 'organizer', 'admin'],
        roleHighlight: 'Скачать PowerPoint',
      },
      {
        id: 'cosmoport',
        label: 'Шлюз портов & Pino',
        icon: Server,
        category: 'tools',
        badge: 'Pino/Cfg',
        description: 'Сетевые порты, логирование Pino и системная конфигурация',
        roles: ['admin', 'organizer'],
        roleHighlight: 'DevOps & Архитектура',
      },
    ],
    [activeTeam.launchReadinessPercent, activeTeam.rank],
  );

  // Фильтрация разделов по поиску и сопоставлению с ролями
  const filteredNavSections = useMemo(() => {
    const q = navSearchQuery.trim().toLowerCase();

    return allNavSections.filter((item) => {
      // Фильтр по роли пользователя
      if (navRoleFilter === 'my_role' && !item.roles.includes(userRole)) {
        return false;
      }

      // Поисковый запрос
      if (q) {
        const matchLabel = item.label.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchBadge = (item.badge || '').toLowerCase().includes(q);
        const matchRoles = item.roles.some((r) =>
          roleConfigs[r]?.label.toLowerCase().includes(q),
        );
        if (!matchLabel && !matchDesc && !matchBadge && !matchRoles) {
          return false;
        }
      }

      return true;
    });
  }, [allNavSections, navSearchQuery, navRoleFilter, userRole]);

  const handleCopyTelemetrySnapshot = () => {
    const snapshot = JSON.stringify(telemetry, null, 2);
    navigator.clipboard.writeText(snapshot).then(() => {
      setCopiedTelemetry(true);
      setTimeout(() => setCopiedTelemetry(false), 2000);
    });
  };

  const handleSelectNav = (tabId: string) => {
    onTabChange(tabId);
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          role="presentation"
          onClick={onToggle}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Right Sidebar Drawer */}
      <aside
        id="right-sidebar-drawer"
        aria-label="Центр управления ЦУП и навигации"
        className={`fixed top-0 right-0 h-screen z-50 flex flex-col bg-slate-950/95 border-l border-cyan-500/20 shadow-2xl backdrop-blur-xl transition-all duration-300 select-none ${
          isOpen ? 'w-84 sm:w-92 translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ========================================================== */}
        {/* 1. МЕНЮ ПОЛЬЗОВАТЕЛЯ (USER MENU - ВВЕРХУ ПРАВОЙ ПАНЕЛИ)     */}
        {/* ========================================================== */}
        <div className="h-16 shrink-0 px-3 sm:px-4 border-b border-slate-800 bg-gradient-to-b from-slate-900/95 via-slate-900/70 to-slate-950/90 flex items-center">
          {/* Верхняя строка меню: Аватар, имя, переключатель роли и email */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Аватар пользователя с кольцом статуса */}
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-0.5 shadow-md">
                <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center font-bold text-xs text-cyan-300">
                  {userName ? userName.slice(0, 2).toUpperCase() : 'АК'}
                </div>
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse"
                title="Статус: В сети"
              />
            </div>

            {/* Имя и выбор роли пользователя */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-xs truncate">
                  {userName || 'Анатолий Копанев'}
                </span>
                <select
                  value={userRole}
                  onChange={(e) => onRoleChange(e.target.value as UserRole)}
                  className="bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:border-cyan-400 rounded-md px-1.5 py-0.5 text-[11px] font-semibold focus:outline-none cursor-pointer shadow-xs transition-colors"
                  title="Сменить роль пользователя"
                >
                  {(Object.keys(roleConfigs) as UserRole[]).map((r) => (
                    <option key={r} value={r} className="bg-slate-900 text-white">
                      {roleConfigs[r].icon} {roleConfigs[r].label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                {userEmail || 'anatoliy.kopanev74@gmail.com'}
              </p>
            </div>
          </div>
        </div>



        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 0: AI-АГЕНТЫ ЦУП (ПРОФЕССОР, КОНСТРУКТОР, БИОХИМ, РЕГИСТРАТОР) */}
          {activeAccordion === 'ai' && (
            <div className="space-y-3.5">
              {/* Верхняя плашка с маскотом и кнопкой прямого эфира Gemini Live */}
              <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/60 p-3 shadow-lg">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                      <Bot className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          AI-Маскот «Кубик»
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                          4 роли
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        Экипаж: {activeTeam.name}
                      </p>
                    </div>
                  </div>

                  {/* Кнопка запуска живого голосового диалога Gemini Live */}
                  <button
                    type="button"
                    onClick={() => setIsLiveVoiceModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer"
                    title="Запустить непрерывный голосовой эфир Gemini Live API"
                  >
                    <Radio className="w-3 h-3 text-cyan-200 animate-pulse" />
                    <span>Эфир Live</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-snug">
                  Выберите специализацию агента для голосовой или текстовой консультации:
                </p>
              </div>

              {/* Сетка выбора 4-х ролей агентов */}
              <div className="grid grid-cols-2 gap-1.5">
                {AI_AGENT_ROLES.map((agent) => {
                  const Icon = agent.icon;
                  const isCurrent = aiSelectedRole === agent.id;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => {
                        setAiSelectedRole(agent.id);
                        audioService.playSuccessChime();
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        isCurrent
                          ? `${agent.activeColor} ring-1 ring-cyan-400/40 shadow-sm`
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${agent.iconColor}`} />
                        <span className="text-[11px] font-bold text-white truncate">
                          {agent.title}
                        </span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 line-clamp-1 leading-tight font-mono">
                        {agent.shortRole}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Текущий агент: карточка профиля */}
              {currentAiAgent && (
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${currentAiAgent.badgeBg}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <currentAiAgent.icon className={`w-4 h-4 shrink-0 ${currentAiAgent.iconColor}`} />
                    <div className="min-w-0">
                      <div className="font-bold text-white text-[11px]">
                        {currentAiAgent.title}
                      </div>
                      <p className="text-[10px] text-slate-300 line-clamp-1">
                        {currentAiAgent.desc}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiSoundEnabled((v) => !v)}
                    className="p-1 rounded-lg bg-slate-950/40 hover:bg-slate-950 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    title={aiSoundEnabled ? 'Озвучка включена' : 'Озвучка отключена'}
                  >
                    {aiSoundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                </div>
              )}

              {/* Быстрые вопросы (Quick prompts) для выбранной роли */}
              {currentAiAgent && currentAiAgent.quickPrompts.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                    Частые вопросы ({currentAiAgent.title}):
                  </span>
                  <div className="flex flex-col gap-1">
                    {currentAiAgent.quickPrompts.map((promptText, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendAiMessage(promptText)}
                        className="text-left text-[11px] p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-300 text-slate-300 transition-colors truncate cursor-pointer"
                      >
                        ⚡ {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Лента сообщений диалога */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 space-y-2.5 max-h-[300px] overflow-y-auto min-h-[140px]">
                {aiMessages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const agentCfg = AI_AGENT_ROLES.find((a) => a.id === msg.roleAgent);
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 font-mono">
                        <span>{isUser ? 'Вы' : (agentCfg?.title || 'Кубик')}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[95%] break-words ${
                          isUser
                            ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/40 rounded-tr-xs'
                            : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleSpeakAiMessage(msg.text, msg.roleAgent)}
                          className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer self-start ml-1"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Озвучить</span>
                        </button>
                      )}
                    </div>
                  );
                })}
                {aiIsLoading && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400 p-2 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse">
                    <Bot className="w-3.5 h-3.5 animate-spin" />
                    <span>{currentAiAgent?.title || 'Кубик'} формулирует ответ...</span>
                  </div>
                )}
                <div ref={aiChatEndRef} />
              </div>

              {/* Форма ввода (текст + микрофон) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={aiInputText}
                      onChange={(e) => setAiInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendAiMessage();
                        }
                      }}
                      placeholder={`Спросить ${currentAiAgent ? currentAiAgent.title.toLowerCase() : 'агента'}...`}
                      disabled={aiIsLoading}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Кнопка голосового ввода (микрофон) */}
                  <button
                    type="button"
                    onClick={handleToggleAiVoiceInput}
                    className={`p-2 rounded-xl border text-xs transition-all cursor-pointer shrink-0 ${
                      aiIsListening
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md animate-pulse'
                        : 'bg-slate-900 border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300'
                    }`}
                    title={aiIsListening ? 'Остановить запись' : 'Голосовой ввод вопроса'}
                  >
                    {aiIsListening ? (
                      <MicOff className="w-3.5 h-3.5" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Кнопка отправки */}
                  <button
                    type="button"
                    onClick={() => handleSendAiMessage()}
                    disabled={!aiInputText.trim() || aiIsLoading}
                    className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition-all cursor-pointer shrink-0"
                    title="Отправить сообщение"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: MISSION HUD & TELEMETRY */}
          {activeAccordion === 'hud' && (
            <div className="space-y-4">
              {/* Telemetry Stream Status Card */}
              <div className="rounded-xl border border-cyan-500/30 bg-slate-900/80 p-3.5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Телеметрический поток</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isPaused
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isPaused ? 'ПАУЗА' : 'АКТИВЕН'}
                  </span>
                </div>

                {/* Grid of Key Telemetry Indicators */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2">
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Высота</span>
                      <Satellite className="h-3 w-3 text-cyan-400" />
                    </div>
                    <div className="mt-1 font-mono text-sm font-bold text-cyan-300">
                      {telemetry.altitudeKm.toFixed(1)} км
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2">
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Скорость</span>
                      <Zap className="h-3 w-3 text-amber-400" />
                    </div>
                    <div className="mt-1 font-mono text-sm font-bold text-amber-300">
                      {telemetry.velocityKms.toFixed(2)} км/с
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2">
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Заряд АКБ</span>
                      <Battery className="h-3 w-3 text-emerald-400" />
                    </div>
                    <div className="mt-1 font-mono text-sm font-bold text-emerald-300">
                      {telemetry.batterySocPercent.toFixed(1)}%
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2">
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Напряжение АКБ</span>
                      <Sun className="h-3 w-3 text-yellow-400" />
                    </div>
                    <div className="mt-1 font-mono text-sm font-bold text-yellow-300">
                      {telemetry.batteryVoltage.toFixed(2)} В
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2">
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Бортовой комп.</span>
                      <Thermometer className="h-3 w-3 text-rose-400" />
                    </div>
                    <div className="mt-1 font-mono text-sm font-bold text-rose-300">
                      {telemetry.obcTempC > 0
                        ? `+${telemetry.obcTempC.toFixed(1)}`
                        : telemetry.obcTempC.toFixed(1)}{' '}
                      °C
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2">
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Сигнал RSSI</span>
                      <Flame className="h-3 w-3 text-purple-400" />
                    </div>
                    <div className="mt-1 font-mono text-sm font-bold text-purple-300">
                      {telemetry.radioRssiDb} dBm
                    </div>
                  </div>
                </div>

                {/* Battery Status Gauge Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Уровень энергии буфера</span>
                    <span className="font-mono text-cyan-300">
                      {telemetry.batterySocPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        telemetry.batterySocPercent > 50
                          ? 'bg-emerald-400'
                          : telemetry.batterySocPercent > 20
                            ? 'bg-yellow-400'
                            : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, telemetry.batterySocPercent))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Real-time Attitude & Orientation Mini Gauge */}
                <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Compass className="h-3 w-3 text-cyan-400" />
                      Ориентация ADCS
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {telemetry.orientation?.adcsStatus || 'STABILIZED'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
                    <div className="bg-slate-900/80 px-1 py-0.5 rounded border border-red-500/20 text-red-300">
                      R: {telemetry.orientation?.roll ?? 0}°
                    </div>
                    <div className="bg-slate-900/80 px-1 py-0.5 rounded border border-emerald-500/20 text-emerald-300">
                      P: {telemetry.orientation?.pitch ?? 0}°
                    </div>
                    <div className="bg-slate-900/80 px-1 py-0.5 rounded border border-sky-500/20 text-sky-300">
                      Y: {telemetry.orientation?.yaw ?? 0}°
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulation Controls */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-3">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Управление симулятором</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Скорость: {simSpeed}x
                  </span>
                </div>

                {/* Control Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onTogglePause}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isPaused
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span>Возобновить</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span>Пауза</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onForceEvent}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all cursor-pointer"
                    title="Сгенерировать телеметрическое событие (пролет тени, нагрев)"
                  >
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Событие</span>
                  </button>
                </div>

                {/* Speed Multiplier Selector */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  {[1, 2, 5].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => onSetSimSpeed(speed)}
                      className={`flex-1 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                        simSpeed === speed
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                {/* Solar Wings Deployment Toggle */}
                {onToggleWings && (
                  <button
                    type="button"
                    onClick={onToggleWings}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      wingsDeployed
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                        : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/25'
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>{wingsDeployed ? 'Сложить солнечные панели' : 'Раскрыть солнечные панели'}</span>
                  </button>
                )}

                {/* Direct shortcut to Stage Director console */}
                <button
                  type="button"
                  onClick={() => handleSelectNav('stage_director')}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/40 hover:from-cyan-500/30 hover:to-purple-500/30 text-cyan-300 hover:text-white transition-all cursor-pointer shadow-xs"
                >
                  <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Пульт режиссёра (Live Console)</span>
                </button>

                {/* 3D Model Telemetry shortcut */}
                <button
                  type="button"
                  onClick={() => handleSelectNav('telemetry')}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 text-cyan-300 transition-all cursor-pointer shadow-xs"
                >
                  <Compass className="h-3.5 w-3.5 text-cyan-400" />
                  <span>3D Модель ориентации CubeSat</span>
                </button>

                {/* Copy Snapshot Button */}
                <button
                  type="button"
                  onClick={handleCopyTelemetrySnapshot}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  {copiedTelemetry ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">JSON скопирован!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Скопировать срез JSON</span>
                    </>
                  )}
                </button>
              </div>

              {/* Бегущая строка и анонс открытия (перенесено из StageDirectorScreen) */}
              <div className="rounded-xl border border-amber-500/30 bg-slate-900/70 p-3.5 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Бегущая строка и анонс открытия</span>
                  </h3>
                  {announcementSavedNotice && (
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold shrink-0">
                      Обновлено
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="sidebar-announcement-input"
                    className="text-[10px] text-slate-400 block font-mono"
                  >
                    Текст приветствия на экране:
                  </label>
                  <textarea
                    id="sidebar-announcement-input"
                    value={sidebarAnnouncement}
                    onChange={(e) => setSidebarAnnouncement(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-y"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateEventStage?.({ announcement: sidebarAnnouncement });
                      audioService.playSuccessChime();
                      setAnnouncementSavedNotice('Текст анонса обновлен на экране!');
                      setTimeout(() => setAnnouncementSavedNotice(null), 3000);
                    }}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Применить текст к экрану
                  </button>
                  {announcementSavedNotice && (
                    <p className="text-[11px] text-emerald-400 font-mono">
                      {announcementSavedNotice}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECTIONS NAVIGATION (ГРУППИРОВКА ПО ФУНКЦИОНАЛУ И СОПОСТАВЛЕНИЕ С РОЛЯМИ) */}
          {activeAccordion === 'nav' && (
            <div className="space-y-3">
              {/* Header: Заголовок и счетчик */}
              <div className="flex items-center justify-between px-1">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Каталог разделов чемпионата</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {allNavSections.length}
                  </span>
                </div>
              </div>

              {/* Список разделов, сгруппированных по функционалу */}
              {NAV_CATEGORIES.map((cat) => {
                const categoryItems = filteredNavSections.filter(
                  (item) => item.category === cat.key,
                );
                if (categoryItems.length === 0) return null;
                const isCollapsed = collapsedCategories[cat.key];

                return (
                  <div key={cat.key} className="space-y-1.5 pt-1">
                    {/* Заголовок функциональной группы */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.key)}
                      className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-left hover:bg-slate-900/60 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs">{cat.icon}</span>
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider truncate">
                          {cat.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${cat.badgeColor}`}>
                          {categoryItems.length}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                            isCollapsed ? '-rotate-90' : 'rotate-0'
                          }`}
                        />
                      </div>
                    </button>

                    {/* Элементы внутри группы */}
                    {!isCollapsed && (
                      <div className="space-y-1 pl-1">
                        {categoryItems.map((item) => {
                          const Icon = item.icon;
                          const isActive =
                            currentTab === item.id ||
                            (currentTab === 'mcc' && (item.id === 'ship' || item.id === 'stage_director')) ||
                            (currentTab === 'jury' && item.id === 'inspectors') ||
                            (currentTab === 'crm' && item.id === 'admin') ||
                            (currentTab === 'reports' && item.id === 'pdf');
                          const isRoleMatched = item.roles.includes(userRole);

                          return (
                            <button
                              key={item.id}
                              type="button"
                              aria-label={item.label}
                              onClick={() => handleSelectNav(item.id)}
                              className={`w-full flex flex-col gap-1 p-2.5 rounded-xl text-xs transition-all text-left cursor-pointer group border ${
                                isActive
                                  ? 'bg-gradient-to-r from-cyan-500/25 via-indigo-500/20 to-transparent text-cyan-200 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                                  : 'text-slate-300 hover:bg-slate-900/90 hover:text-white border-slate-900/80 hover:border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                                      isActive
                                        ? 'bg-cyan-500/30 text-cyan-300'
                                        : 'bg-slate-850 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                                    }`}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="truncate">
                                    <div className="font-semibold text-white tracking-wide truncate">
                                      {item.label}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {item.badge && (
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold flex items-center gap-1 ${
                                        isActive
                                          ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/40'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {item.pulse && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                                      )}
                                      <span>{item.badge}</span>
                                    </span>
                                  )}
                                  <ChevronRight
                                    className={`h-3.5 w-3.5 transition-transform ${
                                      isActive
                                        ? 'text-cyan-400 translate-x-0.5'
                                        : 'text-slate-600 group-hover:text-slate-400'
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Описание и сопоставление с ролями */}
                              <div className="pl-9 pr-1 space-y-1">
                                <p className="text-[11px] text-slate-400 leading-tight">
                                  {item.description}
                                </p>
                                <div className="flex items-center justify-between text-[10px] pt-0.5 font-mono">
                                  <div className="flex items-center gap-1">
                                    {isRoleMatched ? (
                                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span>Доступно роли</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">
                                        Доступ: {item.roles.map((r) => roleConfigs[r]?.label.split(' ')[0]).join(', ')}
                                      </span>
                                    )}
                                  </div>
                                  {item.roleHighlight && (
                                    <span className="text-cyan-400/90 font-medium">
                                      ★ {item.roleHighlight}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Сообщение если ничего не найдено */}
              {filteredNavSections.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 space-y-2 rounded-xl border border-slate-800 bg-slate-900/40">
                  <p>Разделы по запросу не найдены.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNavSearchQuery('');
                      setNavRoleFilter('all');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold cursor-pointer"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CREW ROSTER & TEAM PROFILE */}
          {activeAccordion === 'crew' && (
            <div className="space-y-4">
              {/* Active Team Card */}
              <div className="rounded-xl border border-indigo-500/30 bg-slate-900/80 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Активная команда</span>
                  </div>
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30 font-mono">
                    #{activeTeam.rank} в рейтинге
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-white">«{activeTeam.name}»</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeTeam.city} • {activeTeam.school}
                  </p>
                </div>

                {/* Team Switcher Select */}
                <div>
                  <label
                    htmlFor="team-switcher"
                    className="block text-[10px] font-semibold text-slate-400 uppercase mb-1"
                  >
                    Сменить команду:
                  </label>
                  <select
                    id="team-switcher"
                    value={activeTeam.id}
                    onChange={(e) => onSelectTeam(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs text-white focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                  >
                    {allTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        «{t.name}» ({t.city}, {t.totalScore} б.)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Launch Readiness Progress */}
                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Готовность к запуску:</span>
                    <span className="font-bold text-cyan-300">
                      {activeTeam.launchReadinessPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500"
                      style={{ width: `${activeTeam.launchReadinessPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Crew Roster Members List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Состав экипажа ({activeTeam.members.length} чел.)
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {activeTeam.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] border border-cyan-500/30">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{m.name}</div>
                          <div className="text-[10px] text-cyan-400">{m.role}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{m.grade}</span>
                    </div>
                  ))}
                </div>

                {onOpenMobileSync && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenMobileSync();
                      if (window.innerWidth < 1024) onToggle();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Синхронизировать смартфон экипажа</span>
                  </button>
                )}
              </div>

              {/* Working Role Selector */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-2">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Роль в интерфейсе
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(roleConfigs) as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onRoleChange(r)}
                      className={`p-2 rounded-lg text-left text-xs font-semibold transition-all cursor-pointer ${
                        userRole === r
                          ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-xs'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <div>
                        <span>{roleConfigs[r].icon} </span>
                        <span>{roleConfigs[r].label}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-normal">
                        {roleConfigs[r].desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUICK TOOLS & SPECS */}
          {activeAccordion === 'tools' && (
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Быстрые утилиты
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenVoiceAssistant();
                  if (window.innerWidth < 1024) onToggle();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-200 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all text-left cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Голос ЦУП (Маскот «Кубик»)</div>
                  <div className="text-[10px] text-slate-300">Интеллектуальный помощник физики</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenCustomizer();
                  if (window.innerWidth < 1024) onToggle();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all text-left cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Кастомизация дашборда</div>
                  <div className="text-[10px] text-slate-400">
                    Включение и перестановка виджетов
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenRegistration();
                  if (window.innerWidth < 1024) onToggle();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all text-left cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Регистрация экипажа</div>
                  <div className="text-[10px] text-slate-400">Форма регистрации новой команды</div>
                </div>
              </button>

              {onOpenMobileSync && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenMobileSync();
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Мобильный QR-шлюз</span>
                      {connectedDevicesCount > 0 && (
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {connectedDevicesCount} устр.
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Синхронизация полевых смартфонов экипажа
                    </div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSelectNav('presentation')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 border border-cyan-500/40 text-slate-100 hover:border-cyan-400 transition-all text-left cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Presentation className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Открыть презентацию портала</div>
                  <div className="text-[10px] text-slate-300">
                    10 слайдов: задачи и гайды ролей
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  void downloadPortalPresentationPptx({
                    teamName: activeTeam.name,
                    totalTeams: allTeams.length,
                    generatedDate: new Date().toLocaleDateString('ru-RU'),
                  });
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-white transition-all text-left cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Скачать презентацию (.PPTX)</div>
                  <div className="text-[10px] text-slate-400">
                    Готовый файл PowerPoint 16:9
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  void downloadPortalPresentationPdf({
                    teamName: activeTeam.name,
                    totalTeams: allTeams.length,
                    generatedDate: new Date().toLocaleDateString('ru-RU'),
                  });
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-white transition-all text-left cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Скачать презентацию (.PDF)</div>
                  <div className="text-[10px] text-slate-400">
                    Альбомные слайды 16:9 (10 листов)
                  </div>
                </div>
              </button>

              {/* Documentation Links */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Инженерные спецификации
                </div>

                <a
                  href="/docs/SPECIFICATION.md"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 text-xs transition-all"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                    <span>ТЗ & Регламент (SPECIFICATION)</span>
                  </span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>

                <a
                  href="/docs/ARCHITECTURE.md"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 text-xs transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-indigo-400" />
                    <span>C4 Архитектура (Clean Arch & DDD)</span>
                  </span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>

                <a
                  href="/docs/openapi.yaml"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 text-xs transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-emerald-400" />
                    <span>OpenAPI 3.0.3 Спецификация</span>
                  </span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================== */}
        {/* ПЕРЕКЛЮЧАТЕЛИ: РАЗДЕЛЫ • AI-АГЕНТ • ПУЛЬТ • ПРОФИЛЬ • ОПЦИИ */}
        {/* ========================================================== */}
        <div className="h-11 sm:h-12 shrink-0 grid grid-cols-5 border-t border-slate-800/80 bg-slate-950/95 p-1 gap-1 text-[11px] font-semibold text-slate-400 shadow-lg items-center">
          {/* 1. РАЗДЕЛЫ */}
          <button
            type="button"
            onClick={() => setActiveAccordion('nav')}
            className={`h-full flex flex-col items-center justify-center py-0.5 px-0.5 rounded-lg transition-all cursor-pointer ${
              activeAccordion === 'nav'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Compass className="h-3.5 w-3.5 mb-0.5" />
            <span className="text-[10px]">Разделы</span>
          </button>

          {/* 2. AI-АГЕНТ */}
          <button
            type="button"
            onClick={() => setActiveAccordion('ai')}
            className={`h-full flex flex-col items-center justify-center py-0.5 px-0.5 rounded-lg transition-all cursor-pointer ${
              activeAccordion === 'ai'
                ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-xs'
                : 'hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Bot className="h-3.5 w-3.5 mb-0.5 text-cyan-400" />
            <span className="text-[10px]">AI-Агент</span>
          </button>

          {/* 3. ПУЛЬТ */}
          <button
            type="button"
            onClick={() => setActiveAccordion('hud')}
            className={`h-full flex flex-col items-center justify-center py-0.5 px-0.5 rounded-lg transition-all cursor-pointer ${
              activeAccordion === 'hud'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 mb-0.5" />
            <span className="text-[10px]">Пульт</span>
          </button>

          {/* 4. ПРОФИЛЬ */}
          <button
            type="button"
            onClick={() => setActiveAccordion('crew')}
            className={`h-full flex flex-col items-center justify-center py-0.5 px-0.5 rounded-lg transition-all cursor-pointer ${
              activeAccordion === 'crew'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5 mb-0.5" />
            <span className="text-[10px]">Профиль</span>
          </button>

          {/* 5. ОПЦИИ */}
          <button
            type="button"
            onClick={() => setActiveAccordion('tools')}
            className={`h-full flex flex-col items-center justify-center py-0.5 px-0.5 rounded-lg transition-all cursor-pointer ${
              activeAccordion === 'tools'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5 mb-0.5" />
            <span className="text-[10px]">Опции</span>
          </button>
        </div>
      </aside>

      {/* Модальное окно Gemini Live аудио-эфира с выбранным AI-агентом */}
      {isLiveVoiceModalOpen && (
        <GeminiLiveVoiceModal
          isOpen={isLiveVoiceModalOpen}
          onClose={() => setIsLiveVoiceModalOpen(false)}
          team={{
            ...activeTeam,
            cubesatName: activeTeam.cubesatSpecs?.satelliteName || 'КубСат-3U',
            slides: [{ title: activeTeam.trackTitle || activeTeam.name || 'Миссия CubeSat' }],
            currentStage: 'registration',
          } as any}
          initialRole={aiSelectedRole}
        />
      )}
    </>
  );
};
