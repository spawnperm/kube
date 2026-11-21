import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  User,
  Shield,
  Sparkles,
  MessageSquare,
  Share2,
  Send,
  Plus,
  Clock,
  XCircle,
  Users,
  Settings,
  Edit3,
  Check,
  Building,
  Camera,
  Globe,
  ExternalLink,
  Upload,
  X,
  Link2,
  Wand2,
  LogIn,
  ShieldAlert,
  Sliders,
  Rocket,
  BarChart3,
  UploadCloud,
  Radio,
  Satellite,
  BrainCircuit,
  ShieldCheck,
  Server,
  Award,
  FileText,
  GraduationCap,
  Database,
  Layers,
  Mic,
  BookOpen,
  Compass,
  Search,
  Zap,
} from 'lucide-react';
import {
  UserProfile,
  UserRole,
  Team,
  TeamMember,
  SocialPost,
  VoiceMessageData,
} from '@/src/shared/types/index';
import { DEMO_PROFILES } from '@/src/shared/data/mockData';
import { audioService } from '@/src/shared/lib/audioService';
import { AiAvatarGeneratorModal } from '@/src/contexts/crew/components/AiAvatarGeneratorModal';
import { AdminUserImpersonationModal } from '@/src/contexts/crew/components/AdminUserImpersonationModal';
import {
  canImpersonateUsers,
  ROLES_CONFIG,
  ROLE_HIERARCHY_LEVELS,
  UnifiedScreenId,
  UNIFIED_SCREEN_DEFINITIONS,
  QUICK_TOOL_DEFINITIONS,
  isScreenAllowedForRole,
  isToolAllowedForRole,
  getMenuItemsForRole,
  getToolsForRole,
  RoleMenuItemDefinition,
} from '@/src/contexts/crew/services/rolePermissionService';

import commanderImg from '@/src/assets/images/space_explorer_commander_1790230084463.jpg';
import physicistImg from '@/src/assets/images/space_explorer_physicist_1790230095673.jpg';
import engineerImg from '@/src/assets/images/space_explorer_engineer_1790230107372.jpg';

const COSMIC_AVATARS = [
  { label: 'AI Командир корабля', url: commanderImg },
  { label: 'AI Астрофизик', url: physicistImg },
  { label: 'AI Бортинженер CubeSat', url: engineerImg },
  {
    label: 'Астронавт',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Пилот CubeSat',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Орбитальная станция',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&q=80',
  },
];

const SCREEN_ICONS: Record<UnifiedScreenId, React.ComponentType<{ className?: string }>> = {
  stage_director: Sliders,
  ship: Rocket,
  team: BarChart3,
  submissions: UploadCloud,
  quiz: Sparkles,
  telemetry: Radio,
  spacemap: Globe,
  spacepi: Satellite,
  starmap: Globe,
  admin: Shield,
  mcc: Server,
  inspectors: ShieldCheck,
  jury: Award,
  reports: FileText,
  mascot: Sparkles,
  wiki: BrainCircuit,
  analytics: BarChart3,
  leaderboard: Award,
  certificates: FileText,
  mentor: MessageSquare,
  forum: MessageSquare,
  education: GraduationCap,
  cosmoport: Database,
};

const SCREEN_COLORS: Record<UnifiedScreenId, { icon: string; active: string }> = {
  stage_director: {
    icon: 'text-rose-400',
    active: 'border-rose-500/50 bg-rose-950/40 text-rose-200',
  },
  ship: {
    icon: 'text-indigo-400',
    active: 'border-indigo-500/50 bg-indigo-950/40 text-indigo-200',
  },
  team: { icon: 'text-cyan-400', active: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200' },
  submissions: {
    icon: 'text-emerald-400',
    active: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200',
  },
  quiz: { icon: 'text-amber-400', active: 'border-amber-500/50 bg-amber-950/40 text-amber-200' },
  telemetry: {
    icon: 'text-emerald-400',
    active: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200',
  },
  spacemap: { icon: 'text-cyan-400', active: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200' },
  spacepi: { icon: 'text-sky-400', active: 'border-sky-500/50 bg-sky-950/40 text-sky-200' },
  starmap: {
    icon: 'text-indigo-400',
    active: 'border-indigo-500/50 bg-indigo-950/40 text-indigo-200',
  },
  admin: { icon: 'text-rose-400', active: 'border-rose-500/50 bg-rose-950/40 text-rose-200' },
  mcc: { icon: 'text-amber-400', active: 'border-amber-500/50 bg-amber-950/40 text-amber-200' },
  inspectors: {
    icon: 'text-purple-400',
    active: 'border-purple-500/50 bg-purple-950/40 text-purple-200',
  },
  jury: {
    icon: 'text-purple-400',
    active: 'border-purple-500/50 bg-purple-950/40 text-purple-200',
  },
  reports: { icon: 'text-slate-300', active: 'border-slate-500/50 bg-slate-900/60 text-slate-200' },
  mascot: { icon: 'text-amber-400', active: 'border-amber-500/50 bg-amber-950/40 text-amber-200' },
  wiki: {
    icon: 'text-indigo-400',
    active: 'border-indigo-500/50 bg-indigo-950/40 text-indigo-200',
  },
  analytics: { icon: 'text-cyan-400', active: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200' },
  leaderboard: {
    icon: 'text-amber-400',
    active: 'border-amber-500/50 bg-amber-950/40 text-amber-200',
  },
  certificates: {
    icon: 'text-emerald-400',
    active: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200',
  },
  mentor: {
    icon: 'text-indigo-400',
    active: 'border-indigo-500/50 bg-indigo-950/40 text-indigo-200',
  },
  forum: { icon: 'text-blue-400', active: 'border-blue-500/50 bg-blue-950/40 text-blue-200' },
  education: {
    icon: 'text-violet-400',
    active: 'border-violet-500/50 bg-violet-950/40 text-violet-200',
  },
  cosmoport: { icon: 'text-cyan-400', active: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200' },
};

const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cad_blueprint: Layers,
  voice_assistant: Mic,
  customizer_widgets: Sliders,
  task_directory: BookOpen,
};

interface UserProfileSidebarProps {
  user: UserProfile;
  team: Team;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSwitchUserRole: (role: UserRole) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onAddMemberByMentor: (member: Omit<TeamMember, 'id'>) => void;
  onApproveMember: (memberId: string) => void;
  onRejectMember: (memberId: string) => void;
  onAddSocialPost: (postText: string, tags?: string[], voiceMessage?: VoiceMessageData) => void;
  onOpenAiRegistration?: () => void;
  onImpersonateUser?: (targetUser: UserProfile, targetTeamId?: string) => void;
  onUpdateTargetUserRole?: (targetUserId: string, newRole: UserRole) => void;
  // Navigation props
  currentScreen?: UnifiedScreenId;
  onSelectScreen?: (screen: UnifiedScreenId) => void;
  onOpen3DCAD?: () => void;
  onOpenVoiceAssistant?: () => void;
  onOpenCustomizer?: () => void;
  onOpenTaskDirectory?: () => void;
}

export const UserProfileSidebar: React.FC<UserProfileSidebarProps> = ({
  user,
  team,
  isCollapsed,
  onToggleCollapse,
  onSwitchUserRole,
  onUpdateUser,
  onAddMemberByMentor,
  onApproveMember,
  onRejectMember,
  onAddSocialPost,
  onOpenAiRegistration,
  onImpersonateUser,
  onUpdateTargetUserRole,
  currentScreen = 'ship',
  onSelectScreen,
  onOpen3DCAD,
  onOpenVoiceAssistant,
  onOpenCustomizer,
  onOpenTaskDirectory,
}) => {
  // Tabs: 'menu' (Навигация) | 'profile' (Профиль)
  const [activeTab, setActiveTab] = useState<'menu' | 'profile'>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);

  // Impersonation modal state
  const [isImpersonationModalOpen, setIsImpersonationModalOpen] = useState(false);

  // Edit Profile Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAiAvatarModalOpen, setIsAiAvatarModalOpen] = useState(false);
  const [editAvatarUrl, setEditAvatarUrl] = useState(user.avatarUrl || '');
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editTelegram, setEditTelegram] = useState(user.socialLinks?.telegram || '');
  const [editVk, setEditVk] = useState(user.socialLinks?.vk || '');
  const [editGithub, setEditGithub] = useState(user.socialLinks?.github || '');
  const [editWebsite, setEditWebsite] = useState(user.socialLinks?.website || '');

  // Social Wall Post state
  const [newPostText, setNewPostText] = useState('');

  const handleApplyAiAvatar = (newAvatarUrl: string) => {
    onUpdateUser({
      ...user,
      avatarUrl: newAvatarUrl,
    });
    setEditAvatarUrl(newAvatarUrl);
    audioService.playSuccessChime();
  };

  const openEditProfileModal = () => {
    setEditAvatarUrl(user.avatarUrl || '');
    setEditBio(user.bio || '');
    setEditTelegram(user.socialLinks?.telegram || '');
    setEditVk(user.socialLinks?.vk || '');
    setEditGithub(user.socialLinks?.github || '');
    setEditWebsite(user.socialLinks?.website || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      avatarUrl: editAvatarUrl.trim() || undefined,
      bio: editBio.trim() || undefined,
      socialLinks: {
        telegram: editTelegram.trim() || undefined,
        vk: editVk.trim() || undefined,
        github: editGithub.trim() || undefined,
        website: editWebsite.trim() || undefined,
      },
    });
    setIsEditingProfile(false);
    audioService.playSuccessChime();
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const resultUrl = uploadEvent.target?.result as string;
      setEditAvatarUrl(resultUrl);
      audioService.playSuccessChime();
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    onAddSocialPost(newPostText.trim());
    setNewPostText('');
    audioService.playSuccessChime();
  };

  const handleNavigate = (screenId: UnifiedScreenId) => {
    audioService.playClickSound();
    if (onSelectScreen) {
      onSelectScreen(screenId);
    }
    // On small screens, collapse after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggleCollapse();
    }
  };

  const roleInfo = ROLES_CONFIG[user.role] || ROLES_CONFIG.guest;

  // Filter menu items by role
  const roleAllowedMenuItems = getMenuItemsForRole(user.role);
  const roleAllowedTools = getToolsForRole(user.role);

  // Filter by search query if any
  const filteredMenuItems = roleAllowedMenuItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.sublabel.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q) ||
      (item.badge && item.badge.toLowerCase().includes(q))
    );
  });

  // Group items by category
  const categories: Array<{ id: RoleMenuItemDefinition['category']; label: string; icon: string }> =
    [
      { id: 'desks', label: 'Пульты управления & Борт', icon: '🚀' },
      { id: 'orbit', label: 'Орбита & Телеметрия', icon: '🛰️' },
      { id: 'jury_mcc', label: 'Экспертиза & Оргкомитет', icon: '⚖️' },
      { id: 'knowledge_community', label: 'База знаний & Сообщество', icon: '📚' },
    ];

  // Quick tools handlers
  const handleToolClick = (toolId: string) => {
    audioService.playClickSound();
    if (toolId === 'cad_blueprint' && onOpen3DCAD) onOpen3DCAD();
    else if (toolId === 'voice_assistant' && onOpenVoiceAssistant) onOpenVoiceAssistant();
    else if (toolId === 'customizer_widgets' && onOpenCustomizer) onOpenCustomizer();
    else if (toolId === 'task_directory' && onOpenTaskDirectory) onOpenTaskDirectory();
  };

  // COLLAPSED RAIL VIEW (when collapsed, slim vertical rail on the right)
  if (isCollapsed) {
    return (
      <aside
        aria-label="Боковая панель навигации и профиля (свернута)"
        className="w-16 sm:w-20 shrink-0 bg-slate-950/95 border-l border-slate-800/90 flex flex-col items-center py-3 select-none transition-all duration-200 z-30 backdrop-blur-xl"
      >
        {/* Expand Trigger Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Развернуть меню и личный кабинет"
          aria-label="Развернуть меню и личный кабинет"
          className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-center transition-all cursor-pointer shadow-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="my-2.5 w-8 h-px bg-slate-800/80" />

        {/* User Mini Avatar */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('profile');
            onToggleCollapse();
          }}
          title={`${user.name} • ${roleInfo.alias} (Клик для профиля)`}
          className="relative flex flex-col items-center group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden group-hover:border-cyan-400 transition-colors">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              user.name.slice(0, 1)
            )}
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 absolute -bottom-0.5 -right-0.5" />
        </button>

        {/* Active Role Indicator Badge */}
        <div className="mt-1 text-[9px] font-mono font-bold text-slate-400 text-center px-1 truncate max-w-[56px]">
          {roleInfo.shortAlias}
        </div>

        <div className="my-2 w-8 h-px bg-slate-800/80" />

        {/* Allowed screens icons list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1.5 scrollbar-none px-1">
          {roleAllowedMenuItems.slice(0, 10).map((item) => {
            const Icon = SCREEN_ICONS[item.id] || Compass;
            const isActive = currentScreen === item.id;
            const colors = SCREEN_COLORS[item.id] || {
              icon: 'text-slate-400',
              active: 'border-cyan-500 bg-slate-900 text-white',
            };

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                title={`${item.label} — ${item.sublabel} [${item.badge || 'Раздел'}]`}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'border-2 border-cyan-400 bg-cyan-950/70 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'border border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : colors.icon}`} />
                {isActive && (
                  <span className="absolute -left-1 top-2.5 bottom-2.5 w-1 rounded-r bg-cyan-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Expand Tool Button */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('menu');
              onToggleCollapse();
            }}
            title="Открыть все разделы меню"
            className="p-2 rounded-xl text-cyan-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // EXPANDED FULL-HEIGHT RIGHT PANEL
  return (
    <aside
      aria-label="Правая панель навигации и личного кабинета"
      className="w-80 sm:w-96 shrink-0 bg-slate-950/98 border-l border-slate-800/90 flex flex-col h-screen sticky top-0 z-30 transition-all duration-200 overflow-hidden shadow-2xl backdrop-blur-xl"
    >
      {/* 1. HEADER WITH TABS & COLLAPSE BUTTON */}
      <div className="px-3 pt-3 pb-2 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.name.slice(0, 1)
                )}
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 absolute -bottom-0.5 -right-0.5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate">{user.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border shrink-0 ${roleInfo.badgeColor}`}
                >
                  {roleInfo.shortAlias}
                </span>
              </div>
              <span className="block text-[10px] text-slate-400 truncate">
                {user.school || 'КОСМОПОРТ 2026'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Свернуть правую панель"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
            title="Свернуть правую панель"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: [🧭 Меню навигации] vs [👤 Профиль и экипаж] */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('menu');
              audioService.playClickSound();
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Меню ({roleAllowedMenuItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              audioService.playClickSound();
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Профиль</span>
          </button>
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {/* ============================================================== */}
        {/* TAB 1: ВСЕ ПУНКТЫ МЕНЮ (С УЧЕТОМ РОЛЕВЫХ РАЗРЕШЕНИЙ)           */}
        {/* ============================================================== */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            {/* RBAC Role Selector & Permissions Card */}
            <div className="rounded-xl border border-cyan-500/30 bg-slate-900/70 p-3 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Доступ роли (RBAC)</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${roleInfo.badgeColor}`}
                >
                  L{roleInfo.level} • {roleInfo.alias}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-tight">{roleInfo.desc}</p>

              {/* Dynamic Role Permissions Stats */}
              <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Доступно экранов:</span>
                <span className="text-cyan-300 font-bold">{roleAllowedMenuItems.length} из 23</span>
              </div>

              {/* Quick Role Switcher (Allows live testing of permissions) */}
              <div className="pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsRolePickerOpen(!isRolePickerOpen)}
                  className="w-full flex items-center justify-between text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                >
                  <span>Сменить роль для проверки прав:</span>
                  <span className="text-xs">{isRolePickerOpen ? '▲' : '▼'}</span>
                </button>

                {isRolePickerOpen && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5 animate-fadeIn">
                    {(Object.keys(ROLES_CONFIG) as UserRole[]).map((r) => {
                      const isCurrent = user.role === r;
                      const conf = ROLES_CONFIG[r];
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            audioService.playClickSound();
                            onSwitchUserRole(r);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-left text-[10px] transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 font-bold'
                              : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
                          }`}
                        >
                          <div className="truncate font-semibold">{conf.alias}</div>
                          <div className="text-[9px] text-slate-400 truncate">
                            L{conf.level} ({getMenuItemsForRole(r).length} экр.)
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по доступным разделам..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* Quick Action Tools (Filtered by role permissions) */}
            {roleAllowedTools.length > 0 && (
              <div>
                <div className="px-1 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Инструменты ЦУП</span>
                  <span className="text-amber-400 text-[9px]">
                    {roleAllowedTools.length} доступно
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {roleAllowedTools.map((tool) => {
                    const ToolIcon = TOOL_ICONS[tool.id] || Layers;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleToolClick(tool.id)}
                        className="p-2 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <ToolIcon
                            className={`w-4 h-4 ${tool.color} group-hover:scale-110 transition-transform`}
                          />
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                            {tool.badge}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-200 truncate group-hover:text-white">
                          {tool.label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{tool.sublabel}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categorized Menu Items */}
            {categories.map((cat) => {
              const itemsInCat = filteredMenuItems.filter((m) => m.category === cat.id);
              if (itemsInCat.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="px-1 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                    <span className="text-cyan-400 text-[9px]">{itemsInCat.length}</span>
                  </div>

                  <div className="space-y-1">
                    {itemsInCat.map((item) => {
                      const Icon = SCREEN_ICONS[item.id] || Compass;
                      const isActive = currentScreen === item.id;
                      const colors = SCREEN_COLORS[item.id] || {
                        icon: 'text-slate-400',
                        active: 'border-cyan-500 bg-slate-900 text-white',
                      };

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavigate(item.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all text-left cursor-pointer group ${
                            isActive
                              ? `${colors.active} shadow-[0_0_12px_rgba(6,182,212,0.2)] font-bold`
                              : 'border border-transparent text-slate-300 hover:bg-slate-900 hover:border-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'}`}
                            >
                              <Icon
                                className={`w-4 h-4 ${isActive ? 'text-cyan-300' : colors.icon}`}
                              />
                            </div>
                            <div className="min-w-0">
                              <span
                                className={`block truncate ${isActive ? 'text-white font-bold' : 'text-slate-200 group-hover:text-white'}`}
                              >
                                {item.label}
                              </span>
                              <span className="block text-[10px] text-slate-400 truncate">
                                {item.sublabel}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {item.badge && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}
                              >
                                {item.badge}
                              </span>
                            )}
                            {isActive && (
                              <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-0.5" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredMenuItems.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-xs">
                По запросу «{searchQuery}» разделов не найдено.
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ПРОФИЛЬ, ЭКИПАЖ И ЛИЧНЫЙ КАБИНЕТ                        */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="rounded-xl border border-indigo-500/30 bg-slate-900/70 p-3.5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0 group">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-white font-bold text-base shadow-md overflow-hidden">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name.slice(0, 1)
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAiAvatarModalOpen(true);
                      audioService.playClickSound();
                    }}
                    title="Сгенерировать аватар с AI"
                    className="absolute inset-0 bg-slate-950/70 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                  >
                    <Wand2 className="w-4 h-4 text-indigo-300 animate-pulse" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-white truncate">{user.name}</h3>
                    <button
                      type="button"
                      onClick={openEditProfileModal}
                      title="Редактировать профиль"
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  <p className="text-[10px] text-indigo-300 truncate mt-0.5">{user.school}</p>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-[11px] text-slate-300 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  «{user.bio}»
                </p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-mono">ОПЫТ</div>
                  <div className="text-xs font-bold text-amber-300 font-mono">{user.xp || 350}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-mono">РАНГ</div>
                  <div className="text-xs font-bold text-cyan-300 font-mono">
                    L{user.level || 4}
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-mono">КРИСТ.</div>
                  <div className="text-xs font-bold text-indigo-300 font-mono">
                    {user.energyCrystals || 120}
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-mono">СЕРИЯ</div>
                  <div className="text-xs font-bold text-emerald-300 font-mono">
                    {user.streakDays || 5}д
                  </div>
                </div>
              </div>
            </div>

            {/* Team Roster Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Rocket className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Команда и борт</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">
                  {team.cubesatFormat || 'CubeSat 3U'}
                </span>
              </div>

              <div>
                <div className="text-sm font-extrabold text-white">«{team.name}»</div>
                <div className="text-[11px] text-slate-400">
                  Спутник:{' '}
                  <span className="text-cyan-300 font-mono">{team.cubesatName || 'Борт-01'}</span>
                </div>
              </div>

              {/* Launch readiness */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Готовность к запуску</span>
                  <span className="font-mono text-cyan-300">{team.fuelPercent ?? 85}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                    style={{ width: `${team.fuelPercent ?? 85}%` }}
                  />
                </div>
              </div>

              {/* Crew members count */}
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Экипаж:</span>
                <span className="text-slate-200 font-semibold">
                  {team.members?.length || 4} исследователя
                </span>
              </div>
            </div>

            {/* Social Posts / Wall Feed */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-3">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">Бортовой журнал & Стена</span>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-2">
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="Опубликовать заметку экипажа..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={!newPostText.trim()}
                  className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Опубликовать в бортовой журнал</span>
                </button>
              </form>

              {user.socialPosts && user.socialPosts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80 max-h-48 overflow-y-auto scrollbar-thin">
                  {user.socialPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300"
                    >
                      <p>{post.content}</p>
                      <span className="text-[9px] text-slate-500 mt-1 block">
                        {new Date(post.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Impersonation Trigger */}
            {canImpersonateUsers(user) && (
              <button
                type="button"
                onClick={() => setIsImpersonationModalOpen(true)}
                className="w-full p-2.5 rounded-xl border border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <LogIn className="w-4 h-4 text-rose-400" />
                <span>Реестр пользователей Mirovisor</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="edit-profile-title" className="text-sm sm:text-base font-bold text-white">
                    Редактирование профиля
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Аватар, описание (био) и контакты в социальных сетях
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors min-h-[32px] min-w-[32px] cursor-pointer"
                aria-label="Закрыть модальное окно"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleSaveProfile}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs"
            >
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                  Аватар профиля
                </label>

                <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border-2 border-indigo-500/50 flex items-center justify-center text-white font-bold text-xl shadow-md overflow-hidden">
                      {editAvatarUrl ? (
                        <img
                          src={editAvatarUrl}
                          alt="Предпросмотр аватара"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={() => setEditAvatarUrl('')}
                        />
                      ) : (
                        user.name.slice(0, 1)
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAiAvatarModalOpen(true);
                          audioService.playClickSound();
                        }}
                        className="min-h-[36px] px-3 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-600/30 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-pulse" />
                        <span>Сгенерировать аватар с AI</span>
                      </button>

                      <label className="min-h-[36px] px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Загрузить фото</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileUpload}
                          className="hidden"
                        />
                      </label>

                      {editAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setEditAvatarUrl('')}
                          className="min-h-[36px] px-2.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs transition-colors cursor-pointer"
                        >
                          Сбросить
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cosmic Avatar Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400">
                    Или выберите космический аватар:
                  </span>
                  <div className="grid grid-cols-6 gap-2">
                    {COSMIC_AVATARS.map((avatar, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditAvatarUrl(avatar.url)}
                        title={avatar.label}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group ${
                          editAvatarUrl === avatar.url
                            ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                            : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                        {editAvatarUrl === avatar.url && (
                          <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Или укажите прямую ссылку на изображение:
                  </label>
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Описание профиля (био):
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Расскажите о своей роли в экипаже..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="min-h-[40px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Сохранить изменения</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Cosmic Explorer Avatar Generator Modal */}
      <AiAvatarGeneratorModal
        isOpen={isAiAvatarModalOpen}
        onClose={() => setIsAiAvatarModalOpen(false)}
        userName={user.name}
        userRole={roleInfo.alias}
        teamName={team.name}
        cubesatName={team.missionPassport?.cubesatName || team.cubesatName}
        currentAvatarUrl={user.avatarUrl}
        onApplyAvatar={handleApplyAiAvatar}
      />

      {/* Mirovisor Admin Impersonation Modal */}
      {onImpersonateUser && (
        <AdminUserImpersonationModal
          isOpen={isImpersonationModalOpen}
          onClose={() => setIsImpersonationModalOpen(false)}
          currentUser={user}
          onImpersonate={(targetUser, targetTeamId) => {
            onImpersonateUser(targetUser, targetTeamId);
          }}
          onUpdateUserRole={(targetUserId, newRole) => {
            if (onUpdateTargetUserRole) {
              onUpdateTargetUserRole(targetUserId, newRole);
            }
          }}
        />
      )}
    </aside>
  );
};
