/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  Rocket,
  ShieldCheck,
  Building2,
  Sparkles,
  Award,
  Shield,
  Radio,
  Globe,
  Sliders,
  Server,
  BookOpen,
  BrainCircuit,
  UploadCloud,
  FileText,
  BarChart3,
  MessageSquare,
  GraduationCap,
  Layers,
  Zap,
  Mic,
  RefreshCw,
  Bell,
  PanelRight,
  Database,
  Satellite,
  Compass,
  CheckCircle,
} from 'lucide-react';
import { TopBar, UnifiedScreenId } from '@/src/app/layout/TopBar';
import { BottomNav } from '@/src/app/layout/BottomNav';
import { ErrorBoundary } from '@/src/app/layout/ErrorBoundary';

// Screen components
import { StageDirectorScreen } from '@/src/app/screens/StageDirectorScreen';
import { GuestStarMapScreen } from '@/src/app/screens/GuestStarMapScreen';
import { ShipControlScreen } from '@/src/app/screens/ShipControlScreen';
import { InspectorsScreen } from '@/src/app/screens/InspectorsScreen';
import { MccOrganizersScreen } from '@/src/app/screens/MccOrganizersScreen';
import { AdminScreen } from '@/src/app/screens/AdminScreen';
import type { EventStageState } from '@/src/shared/types/stageDirector';

// Secondary tool components
const CubicMascot = lazy(() =>
  import('@/src/contexts/ai/components/CubicMascot').then((m) => ({ default: m.CubicMascot })),
);
const LlmWiki = lazy(() =>
  import('@/src/contexts/ai/components/LlmWiki').then((m) => ({ default: m.LlmWiki })),
);
const QuizScreen = lazy(() =>
  import('@/src/app/screens/QuizScreen').then((m) => ({ default: m.QuizScreen })),
);
const UserProfileSidebar = lazy(() =>
  import('@/src/contexts/crew/components/UserProfileSidebar').then((m) => ({
    default: m.UserProfileSidebar,
  })),
);
const SyncModal = lazy(() =>
  import('@/src/app/ui/SyncModal').then((m) => ({ default: m.SyncModal })),
);
const NotificationCenter = lazy(() =>
  import('@/src/contexts/championship/components/NotificationCenter').then((m) => ({
    default: m.NotificationCenter,
  })),
);
const AiCrewRegistrationModal = lazy(() =>
  import('@/src/contexts/crew/components/AiCrewRegistrationModal').then((m) => ({
    default: m.AiCrewRegistrationModal,
  })),
);
const CaseTaskDirectoryModal = lazy(() =>
  import('@/src/contexts/project/components/CaseTaskDirectoryModal').then((m) => ({
    default: m.CaseTaskDirectoryModal,
  })),
);

// Cosmoport tabs & modals
const TeamDashboardTab = lazy(() =>
  import('@/src/components/tabs/TeamDashboardTab').then((m) => ({ default: m.TeamDashboardTab })),
);
const SubmissionsTab = lazy(() =>
  import('@/src/components/tabs/SubmissionsTab').then((m) => ({ default: m.SubmissionsTab })),
);
const JuryPanelTab = lazy(() =>
  import('@/src/components/tabs/JuryPanelTab').then((m) => ({ default: m.JuryPanelTab })),
);
const LeaderboardTab = lazy(() =>
  import('@/src/components/tabs/LeaderboardTab').then((m) => ({ default: m.LeaderboardTab })),
);
const CosmoportHubTab = lazy(() =>
  import('@/src/components/tabs/CosmoportHubTab').then((m) => ({ default: m.CosmoportHubTab })),
);
const TelemetryTab = lazy(() =>
  import('@/src/components/tabs/TelemetryTab').then((m) => ({ default: m.TelemetryTab })),
);
const SpaceMapTab = lazy(() =>
  import('@/src/components/tabs/SpaceMapTab').then((m) => ({ default: m.SpaceMapTab })),
);
const SpacePiTab = lazy(() =>
  import('@/src/components/tabs/SpacePiTab').then((m) => ({ default: m.SpacePiTab })),
);
const ForumTab = lazy(() =>
  import('@/src/components/tabs/ForumTab').then((m) => ({ default: m.ForumTab })),
);
const EducationTab = lazy(() =>
  import('@/src/components/tabs/EducationTab').then((m) => ({ default: m.EducationTab })),
);
const MentorTab = lazy(() =>
  import('@/src/components/tabs/MentorTab').then((m) => ({ default: m.MentorTab })),
);
const AnalyticsTab = lazy(() =>
  import('@/src/components/tabs/AnalyticsTab').then((m) => ({ default: m.AnalyticsTab })),
);
const CertificatesTab = lazy(() =>
  import('@/src/components/tabs/CertificatesTab').then((m) => ({ default: m.CertificatesTab })),
);
const PdfExportTab = lazy(() =>
  import('@/src/components/tabs/PdfExportTab').then((m) => ({ default: m.PdfExportTab })),
);

const CubeSatAssemblyBlueprintModal = lazy(() =>
  import('@/src/components/CubeSatAssemblyBlueprintModal').then((m) => ({
    default: m.CubeSatAssemblyBlueprintModal,
  })),
);
const RegistrationModal = lazy(() =>
  import('@/src/components/RegistrationModal').then((m) => ({ default: m.RegistrationModal })),
);
const VoiceAssistantModal = lazy(() =>
  import('@/src/components/VoiceAssistantModal').then((m) => ({ default: m.VoiceAssistantModal })),
);
const TeamMobileAuthQrModal = lazy(() =>
  import('@/src/components/TeamMobileAuthQrModal').then((m) => ({
    default: m.TeamMobileAuthQrModal,
  })),
);
const DashboardCustomizer = lazy(() =>
  import('@/src/components/DashboardCustomizer').then((m) => ({ default: m.DashboardCustomizer })),
);

// Cosmoport widgets
import { FloatingLiveChatButton } from '@/src/components/chat/FloatingLiveChatButton';
import { LivePushNotifications } from '@/src/components/LivePushNotifications';
import { FullScreenLoader } from '@/src/components/ui/FullScreenLoader';

// Data & Services
import { storageService, AppState } from '@/src/shared/lib/storageService';
import type {
  CaseTask,
  PhotoItem,
  GroupPost,
  Team,
  UserRole,
  UserProfile,
  TeamMember,
  SocialPost,
  CubeSatMissionPassport,
  VoiceMessageData,
  ExpertEvaluation,
  ChampionshipNews,
  OfficeFileAttachment,
  MediaAttachment,
  SystemAlert,
  RouteSheetItem,
  VenueMapZone,
} from '@/src/shared/types/index';
import { DEMO_PROFILES, CASE_TASKS } from '@/src/shared/data/mockData';
import { CRM_TEAMS_DATABASE, CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';
import {
  INITIAL_CHAMPIONSHIP_NEWS,
  VENUE_MAP_ZONES,
  INITIAL_ROUTE_SHEET,
  INITIAL_OFFICE_FILES,
  INITIAL_MEDIA_ATTACHMENTS,
  INITIAL_SYSTEM_ALERTS,
} from '@/src/shared/data/championshipData';
import { taskRolesService } from '@/src/contexts/crew/services/taskRolesService';
import { audioService } from '@/src/shared/lib/audioService';
import { geminiLiveService } from '@/src/shared/lib/geminiLiveService';
import {
  ROLES_CONFIG,
  isScreenAllowedForRole,
  getDefaultScreenForRole,
} from '@/src/contexts/crew/services/rolePermissionService';

// Cosmoport types & mockData
import type {
  Team as CosmoportTeam,
  Submission as CosmoportSubmission,
  MentorMessage as CosmoportMentorMessage,
  AppNotification as CosmoportAppNotification,
  ActivityLog as CosmoportActivityLog,
  WidgetConfig as CosmoportWidgetConfig,
  WidgetId as CosmoportWidgetId,
  StageId as CosmoportStageId,
  SpaceMapObject as CosmoportSpaceMapObject,
  ForumTopic as CosmoportForumTopic,
  ForumReply as CosmoportForumReply,
  EducationalMaterial as CosmoportEducationalMaterial,
  ConnectedMobileDevice,
  UserRole as CosmoportUserRole,
  ChatChannel,
} from '@/src/types/index';
import {
  INITIAL_TEAMS as COSMOPORT_INITIAL_TEAMS,
  INITIAL_SUBMISSIONS as COSMOPORT_INITIAL_SUBMISSIONS,
  INITIAL_MENTOR_MESSAGES as COSMOPORT_INITIAL_MENTOR_MESSAGES,
  INITIAL_NOTIFICATIONS as COSMOPORT_INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY_LOGS as COSMOPORT_INITIAL_ACTIVITY_LOGS,
  DEFAULT_WIDGETS,
  INITIAL_SPACE_OBJECTS,
  INITIAL_FORUM_TOPICS,
  INITIAL_EDUCATIONAL_MATERIALS,
  CASE_STAGES,
} from '@/src/data/mockData';
import { useTelemetrySimulator } from '@/src/hooks/useTelemetrySimulator';
import { useLiveChat } from '@/src/hooks/useLiveChat';
import { createId } from '@/src/utils/id';

function buildCaptainProfile(crmTeam: CrmTeamRecord): UserProfile {
  return {
    id: `mentor-${crmTeam.id}`,
    name: crmTeam.mentorName,
    email: crmTeam.mentorEmail,
    role: 'mentor',
    school: crmTeam.school,
    city: crmTeam.city,
    photoConsent: true,
    rankTitle: 'Капитан космического аппарата',
    xp: 1200,
    level: 5,
    energyCrystals: 45,
    streakDays: 4,
    badges: ['captain', 'pilot'],
    socialPosts: [],
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  };
}

function getInitialConnectedDevices(team: CosmoportTeam): ConnectedMobileDevice[] {
  return [
    {
      id: `dev_${team.id}_1`,
      deviceName: `iPhone 15 Pro (${team.members[0]?.name || 'Капитан'})`,
      platform: 'ios',
      memberName: team.members[0]?.name || 'Капитан',
      memberRole: 'Капитан',
      connectedAt: '12 минут назад',
      lastActiveAt: 'Только что',
      batteryLevel: 88,
      pushEnabled: true,
      ipAddress: '192.168.1.104',
    },
  ];
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => storageService.getInitialState());

  // Event Stage State (Guest Frontend Stage Director)
  const [eventStageState, setEventStageState] = useState<EventStageState>(() => {
    try {
      const saved = localStorage.getItem('kosmoport_event_stage_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
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
      updatedBy: 'Главный координатор (Администратор)',
    };
  });

  const getDefaultScreenForRole = (role: UserRole): UnifiedScreenId => {
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
  };

  const [currentScreen, setCurrentScreen] = useState<UnifiedScreenId>(() =>
    getDefaultScreenForRole(appState.user.role),
  );

  // Sync event stage from backend
  useEffect(() => {
    fetch('/api/event/stage')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: EventStageState | null) => {
        if (data) {
          setEventStageState(data);
        }
      })
      .catch(() => {});

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/event/stream');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setEventStageState(parsed);
        } catch {}
      };
    } catch {}

    return () => {
      eventSource?.close();
    };
  }, []);

  const handleUpdateEventStage = (updated: Partial<EventStageState>) => {
    setEventStageState((prev) => {
      const next: EventStageState = {
        ...prev,
        ...updated,
        timer: {
          ...prev.timer,
          ...(updated.timer || {}),
        },
        updatedAt: Date.now(),
        updatedBy: appState.user.name,
      };
      try {
        localStorage.setItem('kosmoport_event_stage_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch('/api/event/stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updated, updatedBy: appState.user.name }),
    }).catch(() => {});
  };
  const [quizInitialArticleSlug, setQuizInitialArticleSlug] = useState<string | undefined>(
    undefined,
  );

  // Championship Domain Data Collections
  const [newsList, setNewsList] = useState<ChampionshipNews[]>(INITIAL_CHAMPIONSHIP_NEWS);
  const [officeFiles, setOfficeFiles] = useState<OfficeFileAttachment[]>(INITIAL_OFFICE_FILES);
  const [mediaAttachments, setMediaAttachments] =
    useState<MediaAttachment[]>(INITIAL_MEDIA_ATTACHMENTS);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>(INITIAL_SYSTEM_ALERTS);
  const [routeSheet, setRouteSheet] = useState<RouteSheetItem[]>(INITIAL_ROUTE_SHEET);
  const [venueZones, setVenueZones] = useState<VenueMapZone[]>(VENUE_MAP_ZONES);
  const [teamsRegistry, setTeamsRegistry] = useState<CrmTeamRecord[]>(() => {
    try {
      const saved = localStorage.getItem('kosmoport_crm_teams_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return CRM_TEAMS_DATABASE;
  });

  // Cosmoport Domain State
  const [cosmoportTeams, setCosmoportTeams] = useState<CosmoportTeam[]>(COSMOPORT_INITIAL_TEAMS);
  const [activeCosmoportTeamId, setActiveCosmoportTeamId] = useState<string>(
    COSMOPORT_INITIAL_TEAMS[0].id,
  );
  const [cosmoportSubmissions, setCosmoportSubmissions] = useState<CosmoportSubmission[]>(
    COSMOPORT_INITIAL_SUBMISSIONS,
  );
  const [cosmoportMentorMessages, setCosmoportMentorMessages] = useState<CosmoportMentorMessage[]>(
    COSMOPORT_INITIAL_MENTOR_MESSAGES,
  );
  const [cosmoportNotifications, setCosmoportNotifications] = useState<CosmoportAppNotification[]>(
    COSMOPORT_INITIAL_NOTIFICATIONS,
  );
  const [cosmoportActivityLogs, setCosmoportActivityLogs] = useState<CosmoportActivityLog[]>(
    COSMOPORT_INITIAL_ACTIVITY_LOGS,
  );
  const [cosmoportWidgets, setCosmoportWidgets] =
    useState<CosmoportWidgetConfig[]>(DEFAULT_WIDGETS);
  const [spaceObjects, setSpaceObjects] =
    useState<CosmoportSpaceMapObject[]>(INITIAL_SPACE_OBJECTS);
  const [forumTopics, setForumTopics] = useState<CosmoportForumTopic[]>(INITIAL_FORUM_TOPICS);
  const [educationalMaterials, setEducationalMaterials] = useState<CosmoportEducationalMaterial[]>(
    INITIAL_EDUCATIONAL_MATERIALS,
  );

  // Cosmoport connected devices
  const [connectedDevicesByTeam, setConnectedDevicesByTeam] = useState<
    Record<string, ConnectedMobileDevice[]>
  >(() => {
    const init: Record<string, ConnectedMobileDevice[]> = {};
    COSMOPORT_INITIAL_TEAMS.forEach((t) => {
      init[t.id] = getInitialConnectedDevices(t);
    });
    return init;
  });

  // AI Registration Modal state
  const [isAiRegistrationOpen, setIsAiRegistrationOpen] = useState(false);
  const [aiRegistrationPrefillTeamId, setAiRegistrationPrefillTeamId] = useState<
    string | undefined
  >(undefined);
  const [aiRegistrationPrefillQuery, setAiRegistrationPrefillQuery] = useState<string | undefined>(
    undefined,
  );

  // Right sidebar collapsible state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return true;
    }
    return false;
  });

  // Left Navigation sidebar collapsible state
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      return true;
    }
    return false;
  });

  // Modals state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGlobalTaskDirectoryOpen, setIsGlobalTaskDirectoryOpen] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isMobileSyncOpen, setIsMobileSyncOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [impersonatingAdmin, setImpersonatingAdmin] = useState<UserProfile | null>(null);

  // Telemetry Simulator
  const { telemetry, simSpeed, isPaused, setSimSpeed, togglePause, forceEvent } =
    useTelemetrySimulator();

  const activeCosmoportTeam =
    cosmoportTeams.find((t) => t.id === activeCosmoportTeamId) || cosmoportTeams[0];
  const activeConnectedDevices = connectedDevicesByTeam[activeCosmoportTeam.id] || [];

  const cosmoportUserRole: CosmoportUserRole =
    appState.user.role === 'admin' || appState.user.role === 'organizer'
      ? 'organizer'
      : appState.user.role === 'expert'
        ? 'jury'
        : appState.user.role === 'mentor'
          ? 'mentor'
          : 'participant';

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
    team: activeCosmoportTeam,
    userRole: cosmoportUserRole,
    onActivityLog: (action, details) => {
      const nowStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      setCosmoportActivityLogs((prev) => [
        {
          id: createId('log'),
          timestamp: `Сегодня, ${nowStr}`,
          userName: activeCosmoportTeam.name,
          userRole: cosmoportUserRole === 'organizer' ? 'Оргкомитет' : 'Экипаж',
          action,
          details,
          type: 'mentor',
        },
        ...prev,
      ]);
    },
  });

  useEffect(() => {
    const unsubLive = geminiLiveService.onStatusChange((status) => {
      setIsLiveActive(status === 'connected' || status === 'listening' || status === 'speaking');
    });
    return () => unsubLive();
  }, []);

  const updateState = (updater: (prev: AppState) => AppState) => {
    setAppState((prev) => {
      const next = updater(prev);
      storageService.saveState(next);
      return next;
    });
  };

  const handleToggleOfflineMode = () => {
    updateState((prev) => ({
      ...prev,
      offlineModeForced: !prev.offlineModeForced,
      isOnline: prev.offlineModeForced
        ? typeof navigator !== 'undefined'
          ? navigator.onLine
          : true
        : false,
    }));
    audioService.playSuccessChime();
  };

  const handleAddXp = (amount: number) => {
    updateState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        xp: prev.user.xp + amount,
      },
    }));
  };

  const handleAddCrystals = (amount: number) => {
    updateState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        energyCrystals: (prev.user.energyCrystals || 0) + amount,
      },
    }));
  };

  const handleUpdateTeamFuel = (fuelAmount: number) => {
    updateState((prev) => ({
      ...prev,
      team: {
        ...prev.team,
        fuelPercent: fuelAmount,
        starterQuizPassed: fuelAmount >= 80,
      },
    }));
  };

  const handleSelectCaseTask = (task: CaseTask) => {
    updateState((prev) => ({
      ...prev,
      team: {
        ...prev.team,
        selectedTaskId: task.id,
        selectedTaskTitle: task.title,
        currentStage:
          prev.team.currentStage === 'registration' ? 'case_selected' : prev.team.currentStage,
      },
    }));
  };

  const handleUpdateTeam = (updatedTeam: Team) => {
    updateState((prev) => ({
      ...prev,
      team: updatedTeam,
    }));
  };

  const handleAddOfficeFile = (file: OfficeFileAttachment) => {
    setOfficeFiles((prev) => [file, ...prev]);
  };

  const handleAddMediaAttachment = (media: MediaAttachment) => {
    setMediaAttachments((prev) => [media, ...prev]);
  };

  const handleAddGroupPost = (postText: string, voiceMessage?: VoiceMessageData) => {
    const newPost: GroupPost = {
      id: `p-${Date.now()}`,
      authorName: `${appState.user.name} (${appState.user.role === 'mentor' ? 'Капитан' : 'Экипаж'})`,
      authorRole: appState.user.role === 'mentor' ? 'Наставник' : 'Участник',
      type: voiceMessage ? 'voice' : 'update',
      title: voiceMessage
        ? `Голосовая заметка от ${appState.user.name}`
        : `Заметка от ${appState.user.name}`,
      content: postText,
      createdAt: 'Только что',
      likes: 1,
      commentsCount: 0,
      voiceMessage,
    };

    updateState((prev) => ({
      ...prev,
      team: {
        ...prev.team,
        groupPosts: [newPost, ...prev.team.groupPosts],
      },
    }));
  };

  const handleSwitchUserRole = (role: UserRole) => {
    const demoProfile = DEMO_PROFILES[role];
    if (demoProfile) {
      updateState((prev) => ({
        ...prev,
        user: {
          ...demoProfile,
          xp: Math.max(demoProfile.xp, prev.user.xp),
          energyCrystals: Math.max(demoProfile.energyCrystals, prev.user.energyCrystals),
          streakDays: Math.max(demoProfile.streakDays, prev.user.streakDays),
        },
      }));
    } else {
      updateState((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          role,
        },
      }));
    }
  };

  const handleImpersonateUser = (targetUser: UserProfile, targetTeamId?: string) => {
    if (!impersonatingAdmin) {
      setImpersonatingAdmin(appState.user);
    }

    let updatedTeam = appState.team;
    if (targetTeamId) {
      const found = CRM_TEAMS_DATABASE.find((t) => t.id === targetTeamId);
      if (found) {
        const studentsAsMembers: TeamMember[] = found.students.map((s, idx) => ({
          id: `m-${found.id}-${idx}`,
          name: s.name,
          grade: s.gradeNumber,
          gradeText: s.gradeText,
          email: `${s.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@perm-school.ru`,
          role: s.assignedRole,
          assignedRole: s.assignedRole,
          roleTitle: s.roleTitle,
          discipline: s.discipline as any,
          status: 'active',
        }));

        const task = CASE_TASKS.find((t) => t.id === found.selectedTaskId) || CASE_TASKS[0];

        const generatedSubtasks = taskRolesService.generateSubtasksForTeam(
          task.id,
          found.selectedTaskTitle || task.title,
          studentsAsMembers.map((m) => ({ studentName: m.name, role: m.assignedRole || m.role })),
          found.mentorName,
        );

        updatedTeam = {
          ...appState.team,
          id: found.id,
          name: found.shipName,
          shipName: found.shipName,
          cubesatName: found.cubesatName,
          cubesatFormat: found.cubesatFormat,
          school: found.school,
          city: found.city,
          mentorName: found.mentorName,
          mentorEmail: found.mentorEmail,
          currentStage: 'registration',
          score: 18.5,
          members: studentsAsMembers,
          selectedTaskId: task.id,
          selectedTaskTitle: found.selectedTaskTitle || task.title,
          roleSubtasks: generatedSubtasks,
        };
      }
    }

    updateState((prev) => ({
      ...prev,
      user: targetUser,
      team: updatedTeam,
    }));

    if (targetUser.role === 'expert') setCurrentScreen('inspectors');
    else if (targetUser.role === 'organizer') setCurrentScreen('mcc');
    else if (targetUser.role === 'admin') setCurrentScreen('admin');
    else setCurrentScreen('ship');

    audioService.playSuccessChime();
  };

  const handleExitImpersonation = () => {
    if (impersonatingAdmin) {
      updateState((prev) => ({
        ...prev,
        user: impersonatingAdmin,
      }));
      setImpersonatingAdmin(null);
      setCurrentScreen('admin');
      audioService.playSuccessChime();
    }
  };

  const handleSelectTeamFromCrm = (teamId: string) => {
    const found = CRM_TEAMS_DATABASE.find((t) => t.id === teamId);
    if (!found) return;

    const studentsAsMembers: TeamMember[] = found.students.map((s, idx) => ({
      id: `m-${found.id}-${idx}`,
      name: s.name,
      grade: s.gradeNumber,
      gradeText: s.gradeText,
      email: `${s.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@perm-school.ru`,
      role: s.assignedRole,
      assignedRole: s.assignedRole,
      roleTitle: s.roleTitle,
      discipline: s.discipline as any,
      status: 'active',
    }));

    const task = CASE_TASKS.find((t) => t.id === found.selectedTaskId) || CASE_TASKS[0];

    updateState((prev) => ({
      ...prev,
      team: {
        ...prev.team,
        id: found.id,
        name: found.shipName,
        shipName: found.shipName,
        cubesatName: found.cubesatName,
        cubesatFormat: found.cubesatFormat,
        school: found.school,
        city: found.city,
        mentorName: found.mentorName,
        mentorEmail: found.mentorEmail,
        selectedTaskId: task.id,
        selectedTaskTitle: found.selectedTaskTitle || task.title,
        members: studentsAsMembers,
      },
    }));

    const matchCosmo = cosmoportTeams.find((t) => t.id === teamId);
    if (matchCosmo) setActiveCosmoportTeamId(matchCosmo.id);

    audioService.playSuccessChime();
  };

  const handleUpdateCrmTeam = (updated: CrmTeamRecord) => {
    setTeamsRegistry((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleAddCrmTeam = (newTeam: CrmTeamRecord) => {
    setTeamsRegistry((prev) => [newTeam, ...prev]);
  };

  const handleDeleteCrmTeam = (teamId: string) => {
    setTeamsRegistry((prev) => prev.filter((t) => t.id !== teamId));
  };

  const handleAddNews = (news: ChampionshipNews) => {
    setNewsList((prev) => [news, ...prev]);
  };

  const handleDeleteNews = (id: string) => {
    setNewsList((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSendAlert = (alert: SystemAlert) => {
    setSystemAlerts((prev) => [alert, ...prev]);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    updateState((prev) => ({
      ...prev,
      user: updatedUser,
    }));
  };

  const handleAddMemberByMentor = (member: Omit<TeamMember, 'id'>) => {
    const fullMember: TeamMember = {
      ...member,
      id: `m-${Date.now()}`,
    };
    updateState((prev) => ({
      ...prev,
      team: {
        ...prev.team,
        members: [...prev.team.members, fullMember],
      },
    }));
  };

  const handleApproveMember = (memberId: string) => {
    updateState((prev) => ({
      ...prev,
      team: {
        ...prev.team,
        members: prev.team.members.map((m) => (m.id === memberId ? { ...m, isApproved: true } : m)),
      },
    }));
  };

  const handleRejectMember = (memberId: string) => {
    updateState((prev) => ({
      ...prev,
      team: {
        ...prev.team,
        members: prev.team.members.filter((m) => m.id !== memberId),
      },
    }));
  };

  const handleResetFactoryState = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleOpenAiRegistration = (teamId?: string, query?: string) => {
    setAiRegistrationPrefillTeamId(teamId);
    setAiRegistrationPrefillQuery(query);
    setIsAiRegistrationOpen(true);
  };

  const handleCrewRegistered = (newTeam: Team, mentor: UserProfile) => {
    updateState((prev) => ({
      ...prev,
      team: newTeam,
      user: mentor,
    }));
  };

  const handleAddSocialPost = (
    postText: string,
    tags?: string[],
    voiceMessage?: VoiceMessageData,
  ) => {
    const newPost: SocialPost = {
      id: `sp-${Date.now()}`,
      authorId: appState.user.id,
      authorName: appState.user.name,
      authorRole: appState.user.role,
      authorAvatar: appState.user.avatarUrl,
      teamId: appState.team.id,
      teamName: appState.team.name,
      content: postText,
      createdAt: 'Только что',
      likes: 1,
      likedByMe: true,
      tags: tags || ['#Космопорт2026'],
      voiceMessage,
    };

    updateState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        socialPosts: [newPost, ...(prev.user.socialPosts || [])],
      },
    }));
  };

  // Cosmoport handlers
  const handleAddDevice = (device: ConnectedMobileDevice) => {
    setConnectedDevicesByTeam((prev) => ({
      ...prev,
      [activeCosmoportTeam.id]: [device, ...(prev[activeCosmoportTeam.id] || [])],
    }));
  };

  const handleRemoveDevice = (deviceId: string) => {
    setConnectedDevicesByTeam((prev) => ({
      ...prev,
      [activeCosmoportTeam.id]: (prev[activeCosmoportTeam.id] || []).filter(
        (d) => d.id !== deviceId,
      ),
    }));
  };

  const handleRegisterTeam = (newTeam: CosmoportTeam) => {
    setCosmoportTeams((prev) => [...prev, newTeam]);
    setActiveCosmoportTeamId(newTeam.id);
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
      teamId: activeCosmoportTeam.id,
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
    setCosmoportSubmissions((prev) => {
      const filtered = prev.filter(
        (s) => !(s.teamId === activeCosmoportTeam.id && s.stageId === stageId),
      );
      return [newSub, ...filtered];
    });
    setCosmoportTeams((prev) =>
      prev.map((t) =>
        t.id === activeCosmoportTeam.id
          ? { ...t, stageStatuses: { ...t.stageStatuses, [stageId]: 'submitted' } }
          : t,
      ),
    );
    audioService.playSuccessChime();
  };

  const handleSimulateStatusChange = (
    submissionId: string,
    status: CosmoportSubmission['status'],
    juryFeedback?: CosmoportSubmission['juryFeedback'],
  ) => {
    setCosmoportSubmissions((prev) =>
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
    stageId: CosmoportStageId,
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

    setCosmoportSubmissions((prev) =>
      prev.map((s) => {
        if (s.teamId === teamId && s.stageId === stageId) {
          return {
            ...s,
            status: evaluation.decision === 'approved' ? 'approved' : 'needs_revision',
            juryFeedback: {
              juryId: appState.user.id,
              juryName: appState.user.name,
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
    audioService.playSuccessChime();
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
      prev.map((t) => {
        if (t.id !== topicId) return t;
        return {
          ...t,
          replies: [...t.replies, reply],
        };
      }),
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
      prev.map((t) => {
        if (t.id !== topicId) return t;
        return {
          ...t,
          replies: t.replies.filter((r) => r.id !== replyId),
        };
      }),
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
      teamId: activeCosmoportTeam.id,
      senderRole: 'team',
      senderName: appState.user.name,
      senderAvatar: appState.user.avatarUrl,
      timestamp: 'Только что',
      text,
    };
    setCosmoportMentorMessages((prev) => [...prev, newMsg]);
  };

  const handleToggleWidget = (id: CosmoportWidgetId) => {
    setCosmoportWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
    );
  };

  const handleMoveWidget = (id: CosmoportWidgetId, direction: 'up' | 'down') => {
    setCosmoportWidgets((prev) => {
      const idx = prev.findIndex((w) => w.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((w, i) => ({ ...w, order: i + 1 }));
    });
  };

  const handleApplyPreset = (preset: 'all' | 'flight' | 'engineering' | 'minimal') => {
    if (preset === 'all') {
      setCosmoportWidgets((prev) => prev.map((w) => ({ ...w, visible: true })));
    } else if (preset === 'minimal') {
      setCosmoportWidgets((prev) => prev.map((w, i) => ({ ...w, visible: i < 3 })));
    } else {
      setCosmoportWidgets((prev) =>
        prev.map((w) => ({ ...w, visible: w.category === preset || w.order <= 2 })),
      );
    }
  };

  const handleResetWidgets = () => {
    setCosmoportWidgets(DEFAULT_WIDGETS);
  };

  const handleMarkNotificationRead = (id: string) => {
    setCosmoportNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  // Safe screen resolution strictly adhering to RBAC permissions
  const isCurrentAllowed = isScreenAllowedForRole(currentScreen, appState.user.role);
  const activeScreen: UnifiedScreenId = isCurrentAllowed
    ? currentScreen
    : getDefaultScreenForRole(appState.user.role);

  return (
    <ErrorBoundary>
      <Suspense fallback={<FullScreenLoader />}>
        <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-white">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0 relative">
            {/* Impersonation Banner */}
            {impersonatingAdmin && (
              <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-slate-950 px-4 py-2 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xl sticky top-0 z-50">
                <div className="flex items-center gap-2 text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping shrink-0" />
                  <span>
                    🛡️ Вход под пользователем:{' '}
                    <strong className="underline decoration-white/50">{appState.user.name}</strong>{' '}
                    ({ROLES_CONFIG[appState.user.role]?.alias || appState.user.role}). Координатор:{' '}
                    {impersonatingAdmin.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExitImpersonation}
                  className="px-3.5 py-1 bg-slate-950 hover:bg-slate-900 text-amber-300 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>✕ Вернуться в кабинет координатора</span>
                </button>
              </div>
            )}

            {/* Top Bar with Profile & Indicators */}
            <TopBar
              isOnline={appState.isOnline}
              offlineForced={appState.offlineModeForced}
              onToggleOffline={handleToggleOfflineMode}
              onOpenSync={() => setIsSyncModalOpen(true)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadNotificationsCount={unreadCount}
              onOpenAiRegistration={() => handleOpenAiRegistration()}
              onOpenTaskDirectory={() => setIsGlobalTaskDirectoryOpen(true)}
              currentScreen={activeScreen}
              onSelectScreen={(screen) => {
                audioService.playClickSound();
                setCurrentScreen(screen);
              }}
              userRank={appState.user.rankTitle}
              userXp={appState.user.xp}
              crystals={appState.user.energyCrystals}
              userName={appState.user.name}
              userRole={appState.user.role}
              userAvatar={appState.user.avatarUrl}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
              onSwitchUserRole={handleSwitchUserRole}
              pendingSyncCount={appState.pendingSyncCount}
            />

            {/* Main Application Screen Container */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 pt-4 pb-24 lg:pb-10">
              <Suspense fallback={<FullScreenLoader />}>
                {/* 0. Stage Director Screen (Portal Frontend Control Desk) */}
                {activeScreen === 'stage_director' && (
                  <StageDirectorScreen
                    currentUser={appState.user}
                    eventStageState={eventStageState}
                    onUpdateEventStage={handleUpdateEventStage}
                    teamsRegistry={teamsRegistry}
                    activeTeam={appState.team}
                    telemetry={telemetry}
                    onNavigateToScreen={(sc) => setCurrentScreen(sc as UnifiedScreenId)}
                    onImpersonateCaptain={(crmTeam) => {
                      handleImpersonateUser(buildCaptainProfile(crmTeam), crmTeam.id);
                    }}
                  />
                )}

                {/* 1. Star Map Screen (Guest Live Event Stage) */}
                {activeScreen === 'starmap' && (
                  <GuestStarMapScreen
                    teamsList={teamsRegistry}
                    activeTeam={appState.team}
                    currentUser={appState.user}
                    newsList={newsList}
                    venueZones={venueZones}
                    routeSheet={routeSheet}
                    eventStageState={eventStageState}
                    telemetry={telemetry}
                    onOpenRegistration={(teamId) => handleOpenAiRegistration(teamId)}
                    onNavigateToScreen={(sc) => setCurrentScreen(sc as UnifiedScreenId)}
                    onSwitchRole={handleSwitchUserRole}
                    onSelectShipForInspection={handleSelectTeamFromCrm}
                  />
                )}

                {/* 2. Ship Control 3D Screen */}
                {activeScreen === 'ship' && (
                  <ShipControlScreen
                    team={appState.team}
                    currentUser={appState.user}
                    officeFiles={officeFiles}
                    mediaAttachments={mediaAttachments}
                    onUpdateTeam={handleUpdateTeam}
                    onAddOfficeFile={handleAddOfficeFile}
                    onAddMediaAttachment={handleAddMediaAttachment}
                    onAddGroupPost={handleAddGroupPost}
                    onSelectTask={handleSelectCaseTask}
                    onNavigateTab={(tab) => setCurrentScreen(tab as UnifiedScreenId)}
                  />
                )}

                {/* 3. Team Dashboard & Gantt Tab */}
                {activeScreen === 'team' && (
                  <TeamDashboardTab
                    team={activeCosmoportTeam}
                    telemetry={telemetry}
                    widgets={cosmoportWidgets}
                    userRole={cosmoportUserRole}
                    chatMessages={chatMessages}
                    activeChatChannel={activeChatChannel}
                    onSendChatMessage={handleSendChatMessage}
                    onAddChatReaction={handleAddChatReaction}
                    onToggleChatPin={handleToggleChatPin}
                    onChatChannelChange={setActiveChatChannel}
                    isChatTyping={isChatTyping}
                    onOpenCustomizer={() => setIsCustomizerOpen(true)}
                    onNavigateTab={(tab) => setCurrentScreen(tab as UnifiedScreenId)}
                    connectedDevices={activeConnectedDevices}
                    onOpenMobileSync={() => setIsMobileSyncOpen(true)}
                  />
                )}

                {/* 4. Submissions 3-Stage Tab */}
                {activeScreen === 'submissions' && (
                  <SubmissionsTab
                    team={activeCosmoportTeam}
                    submissions={cosmoportSubmissions}
                    onSubmitSolution={handleSubmitSolution}
                    onSimulateStatusChange={handleSimulateStatusChange}
                    onNavigateTab={(tab) => setCurrentScreen(tab as UnifiedScreenId)}
                  />
                )}

                {/* 5. Telemetry Simulator Tab */}
                {activeScreen === 'telemetry' && (
                  <TelemetryTab
                    telemetry={telemetry}
                    simSpeed={simSpeed}
                    isPaused={isPaused}
                    onSetSimSpeed={setSimSpeed}
                    onTogglePause={togglePause}
                    onForceEvent={forceEvent}
                  />
                )}

                {/* 6. 2D Space Map Tab */}
                {activeScreen === 'spacemap' && (
                  <SpaceMapTab
                    objects={spaceObjects}
                    activeTeam={activeCosmoportTeam}
                    userRole={cosmoportUserRole}
                    onAddObject={handleAddSpaceObject}
                    onDeleteObject={handleDeleteSpaceObject}
                    telemetry={telemetry}
                  />
                )}

                {/* 7. Space-Pi & SONIKS Tab */}
                {activeScreen === 'spacepi' && (
                  <SpacePiTab
                    team={activeCosmoportTeam}
                    allTeams={cosmoportTeams}
                    submissions={cosmoportSubmissions}
                    userRole={cosmoportUserRole}
                    onOpenStage={() => setCurrentScreen('submissions')}
                  />
                )}

                {/* 8. Cubic AI Mascot Screen */}
                {activeScreen === 'mascot' && (
                  <CubicMascot team={appState.team} isOnline={appState.isOnline} />
                )}

                {/* 9. LLM Wiki Screen */}
                {activeScreen === 'wiki' && (
                  <LlmWiki
                    onOpenMascotWithTopic={() => setCurrentScreen('mascot')}
                    onAddXp={handleAddXp}
                    onOpenQuiz={(slug) => {
                      setQuizInitialArticleSlug(slug);
                      setCurrentScreen('quiz');
                    }}
                  />
                )}

                {/* 10. Quiz Orbital Exam Screen */}
                {activeScreen === 'quiz' && (
                  <QuizScreen
                    currentUser={appState.user}
                    activeTeam={appState.team}
                    initialArticleSlug={quizInitialArticleSlug}
                    onNavigateToScreen={(sc) => setCurrentScreen(sc as UnifiedScreenId)}
                    onAddXp={handleAddXp}
                    onAddCrystals={handleAddCrystals}
                    onUpdateTeamFuel={handleUpdateTeamFuel}
                  />
                )}

                {/* 11. Inspectors & Experts Screen */}
                {activeScreen === 'inspectors' && (
                  <InspectorsScreen
                    currentUser={appState.user}
                    activeTeam={appState.team}
                    allTeams={teamsRegistry}
                    onSelectTeam={handleSelectTeamFromCrm}
                    onSaveEvaluation={(evalData) => {
                      if (evalData.totalAverage) {
                        handleUpdateTeam({
                          ...appState.team,
                          score: evalData.totalAverage * 4,
                        });
                      }
                    }}
                    onNavigateTab={(tab) => setCurrentScreen(tab as UnifiedScreenId)}
                  />
                )}

                {/* 12. Jury Panel Tab */}
                {activeScreen === 'jury' && (
                  <JuryPanelTab
                    teams={cosmoportTeams}
                    submissions={cosmoportSubmissions}
                    onEvaluateSubmission={handleEvaluateSubmission}
                  />
                )}

                {/* 13. MCC Organizers & CRM Screen */}
                {activeScreen === 'mcc' && (
                  <MccOrganizersScreen
                    currentUser={appState.user}
                    newsList={newsList}
                    routeSheet={routeSheet}
                    systemAlerts={systemAlerts}
                    allTeams={teamsRegistry}
                    onAddNews={handleAddNews}
                    onDeleteNews={handleDeleteNews}
                    onSendAlert={handleSendAlert}
                    onSelectTeam={handleSelectTeamFromCrm}
                    onUpdateTeamRecord={handleUpdateCrmTeam}
                    onAddTeamRecord={handleAddCrmTeam}
                    onDeleteTeamRecord={handleDeleteCrmTeam}
                    onImpersonateCaptain={(crmTeam) => {
                      handleImpersonateUser(buildCaptainProfile(crmTeam), crmTeam.id);
                    }}
                  />
                )}

                {/* 14. Admin Screen (DevOps & System Console) */}
                {activeScreen === 'admin' && (
                  <AdminScreen
                    currentUser={appState.user}
                    activeTeam={appState.team}
                    allTeams={teamsRegistry}
                    newsList={newsList}
                    onImpersonateUser={handleImpersonateUser}
                    onResetFactoryState={handleResetFactoryState}
                    onOpenAiRegistration={() => handleOpenAiRegistration()}
                    onApproveMember={handleApproveMember}
                    onRejectMember={handleRejectMember}
                    onAddMember={handleAddMemberByMentor}
                    onNavigateToScreen={(sc) => setCurrentScreen(sc as UnifiedScreenId)}
                  />
                )}

                {/* 15. Analytics & Benchmark Tab */}
                {activeScreen === 'analytics' && (
                  <AnalyticsTab
                    team={activeCosmoportTeam}
                    allTeams={cosmoportTeams}
                    activityLogs={cosmoportActivityLogs}
                    onNavigateTab={(tab) => setCurrentScreen(tab as UnifiedScreenId)}
                  />
                )}

                {/* 16. Leaderboard Tab */}
                {activeScreen === 'leaderboard' && (
                  <LeaderboardTab
                    teams={cosmoportTeams}
                    onSelectTeamForReport={(t) => {
                      setActiveCosmoportTeamId(t.id);
                      setCurrentScreen('reports');
                    }}
                  />
                )}

                {/* 17. Certificates Tab */}
                {activeScreen === 'certificates' && (
                  <CertificatesTab teams={cosmoportTeams} activeTeam={activeCosmoportTeam} />
                )}

                {/* 18. PDF Export Tab */}
                {activeScreen === 'reports' && (
                  <PdfExportTab
                    teams={cosmoportTeams}
                    activeTeam={activeCosmoportTeam}
                    submissions={cosmoportSubmissions}
                  />
                )}

                {/* 19. Forum Tab */}
                {activeScreen === 'forum' && (
                  <ForumTab
                    topics={forumTopics}
                    activeTeam={activeCosmoportTeam}
                    userRole={cosmoportUserRole}
                    onAddTopic={handleAddForumTopic}
                    onAddReply={handleAddForumReply}
                    onTogglePinTopic={handleTogglePinTopic}
                    onToggleCloseTopic={handleToggleCloseTopic}
                    onDeleteTopic={handleDeleteForumTopic}
                    onDeleteReply={handleDeleteForumReply}
                  />
                )}

                {/* 20. Education Tab */}
                {activeScreen === 'education' && (
                  <EducationTab
                    materials={educationalMaterials}
                    userRole={cosmoportUserRole}
                    onAddMaterial={handleAddEducationalMaterial}
                    onDeleteMaterial={handleDeleteEducationalMaterial}
                  />
                )}

                {/* 21. Mentor Tab */}
                {activeScreen === 'mentor' && (
                  <MentorTab
                    team={activeCosmoportTeam}
                    messages={cosmoportMentorMessages}
                    onSendMessage={handleSendMessage}
                  />
                )}

                {/* 22. Cosmoport Hub Tab */}
                {activeScreen === 'cosmoport' && <CosmoportHubTab />}
              </Suspense>
            </main>

            {/* Bottom Thumb-Zone Navigation for Mobile */}
            <BottomNav
              currentScreen={activeScreen}
              onSelectScreen={(sc) => setCurrentScreen(sc as UnifiedScreenId)}
              userRole={appState.user.role}
              isVoiceActive={audioService.getIsListening() || isLiveActive}
            />
          </div>

          {/* User Profile & Navigation Collapsible Right Sidebar */}
          <UserProfileSidebar
            user={appState.user}
            team={appState.team}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            onSwitchUserRole={handleSwitchUserRole}
            onUpdateUser={handleUpdateUser}
            onAddMemberByMentor={handleAddMemberByMentor}
            onApproveMember={handleApproveMember}
            onRejectMember={handleRejectMember}
            onAddSocialPost={handleAddSocialPost}
            onOpenAiRegistration={() => handleOpenAiRegistration()}
            onImpersonateUser={handleImpersonateUser}
            currentScreen={activeScreen}
            onSelectScreen={(screen) => {
              audioService.playClickSound();
              setCurrentScreen(screen);
            }}
            onOpen3DCAD={() => setIsBlueprintModalOpen(true)}
            onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
            onOpenCustomizer={() => setIsCustomizerOpen(true)}
            onOpenTaskDirectory={() => setIsGlobalTaskDirectoryOpen(true)}
          />

          {/* Global Floating Live Team Chat Button */}
          <FloatingLiveChatButton
            team={activeCosmoportTeam}
            userRole={cosmoportUserRole}
            messages={chatMessages}
            activeChannel={activeChatChannel}
            onChannelChange={setActiveChatChannel}
            onSendMessage={handleSendChatMessage}
            onAddReaction={handleAddChatReaction}
            onTogglePin={handleToggleChatPin}
            isTyping={isChatTyping}
          />

          {/* Real-time Push Toaster */}
          <LivePushNotifications
            notifications={cosmoportNotifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onNavigateTab={(tab) => setCurrentScreen(tab as UnifiedScreenId)}
          />

          {/* 3D CAD Blueprint Modal */}
          <Suspense fallback={null}>
            <CubeSatAssemblyBlueprintModal
              isOpen={isBlueprintModalOpen}
              onClose={() => setIsBlueprintModalOpen(false)}
            />

            {/* Voice Assistant Modal */}
            <VoiceAssistantModal
              isOpen={isVoiceAssistantOpen}
              onClose={() => setIsVoiceAssistantOpen(false)}
              activeTeam={activeCosmoportTeam}
              telemetry={telemetry}
            />

            {/* Dashboard Customizer Modal */}
            <DashboardCustomizer
              isOpen={isCustomizerOpen}
              onClose={() => setIsCustomizerOpen(false)}
              widgets={cosmoportWidgets}
              onToggleWidget={handleToggleWidget}
              onMoveWidget={handleMoveWidget}
              onApplyPreset={handleApplyPreset}
              onResetWidgets={handleResetWidgets}
            />

            {/* Team Mobile QR Auth Modal */}
            <TeamMobileAuthQrModal
              isOpen={isMobileSyncOpen}
              onClose={() => setIsMobileSyncOpen(false)}
              team={activeCosmoportTeam}
              userRole={cosmoportUserRole}
              connectedDevices={activeConnectedDevices}
              onAddDevice={handleAddDevice}
              onRemoveDevice={handleRemoveDevice}
              onShowNotification={(title, message) => {
                const notif: CosmoportAppNotification = {
                  id: createId('notif'),
                  title,
                  message,
                  timestamp: 'Только что',
                  read: false,
                  type: 'achievement',
                  linkTab: 'team',
                };
                setCosmoportNotifications((prev) => [notif, ...prev]);
              }}
            />

            {/* Registration Modal */}
            <RegistrationModal
              isOpen={isRegistrationOpen}
              onClose={() => setIsRegistrationOpen(false)}
              onRegisterTeam={handleRegisterTeam}
            />

            {/* AI Crew Registration Modal */}
            <AiCrewRegistrationModal
              isOpen={isAiRegistrationOpen}
              onClose={() => setIsAiRegistrationOpen(false)}
              onRegisterSuccess={handleCrewRegistered}
              prefillTeamId={aiRegistrationPrefillTeamId}
              prefillQuery={aiRegistrationPrefillQuery}
            />

            {/* Room Sync Modal */}
            <SyncModal
              isOpen={isSyncModalOpen}
              onClose={() => setIsSyncModalOpen(false)}
              roomCode={appState.roomSyncCode}
              onUpdateRoomCode={(code) => updateState((prev) => ({ ...prev, roomSyncCode: code }))}
              onPushSync={async () => await storageService.pushToCloud(appState)}
              onPullSync={async (code) => {
                const remote = await storageService.pullFromCloud(code);
                if (remote) {
                  updateState((prev) => ({ ...prev, ...remote, roomSyncCode: code }));
                  return true;
                }
                return false;
              }}
            />

            {/* 500 Task Directory Modal */}
            <CaseTaskDirectoryModal
              isOpen={isGlobalTaskDirectoryOpen}
              onClose={() => setIsGlobalTaskDirectoryOpen(false)}
              targetTeam={
                teamsRegistry.find((t) => t.id === appState.team.id) || {
                  id: appState.team.id,
                  orderNumber: 1,
                  school: appState.team.school,
                  city: appState.team.city,
                  mentorName: appState.team.mentorName,
                  mentorEmail: appState.team.mentorEmail,
                  captainTitle: 'Капитан корабля',
                  shipCallsign: appState.team.cubesatName || 'Борт-01',
                  shipName: appState.team.shipName || appState.team.name,
                  cubesatName: appState.team.cubesatName,
                  cubesatFormat: appState.team.cubesatFormat,
                  students: [],
                  status: 'registered_active',
                  waitlistPosition: 1,
                  navigatorMascot: {
                    name: 'Кубик',
                    role: 'navigator' as const,
                    roleTitle: 'Штурман (AI)',
                    description: 'Бортовой AI-оркестратор и навигация экипажа.',
                  },
                  selectedTaskId: appState.team.selectedTaskId,
                  selectedTaskTitle: appState.team.selectedTaskTitle,
                }
              }
              allTeams={teamsRegistry}
              tasks={CASE_TASKS}
              currentUser={appState.user}
              onSelectTask={(taskId, taskTitle) => {
                const task = CASE_TASKS.find((t) => t.id === taskId);
                if (task) {
                  handleSelectCaseTask(task);
                }
                setIsGlobalTaskDirectoryOpen(false);
              }}
              onPublishCommunityPost={(text) => handleAddGroupPost(text)}
            />

            {/* Notification Center */}
            <NotificationCenter
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              onClearUnread={() => setUnreadCount(0)}
            />
          </Suspense>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
