import React, { useEffect, useRef, useState } from 'react';
import {
  Rocket,
  Satellite,
  Award,
  UploadCloud,
  Scale,
  MessageSquare,
  BarChart3,
  FileText,
  Bell,
  Sliders,
  UserPlus,
  Radio,
  ChevronDown,
  Globe,
  GraduationCap,
  Mic,
  PanelRight,
  QrCode,
  Server,
} from 'lucide-react';
import { UserRole, AppNotification, Team } from '../types';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTeam: Team;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onOpenCustomizer: () => void;
  onOpenRegistration: () => void;
  onOpenVoiceAssistant: () => void;
  onOpenMobileSync?: () => void;
  connectedDevicesCount?: number;
  isRightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  userRole,
  onRoleChange,
  activeTeam,
  notifications,
  onMarkNotificationRead,
  onOpenCustomizer,
  onOpenRegistration,
  onOpenVoiceAssistant,
  onOpenMobileSync,
  connectedDevicesCount = 0,
  isRightSidebarOpen,
  onToggleRightSidebar,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showNotifMenu && !notifMenuRef.current?.contains(target)) setShowNotifMenu(false);
      if (showRoleMenu && !roleMenuRef.current?.contains(target)) setShowRoleMenu(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifMenu(false);
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showNotifMenu, showRoleMenu]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const tabs = [
    {
      id: 'team',
      label: 'Кабинет команды',
      icon: Rocket,
      badge: `${activeTeam.launchReadinessPercent}%`,
    },
    {
      id: 'spacepi',
      label: 'Заявка в Space-π',
      icon: Satellite,
      badge: 'spacepi.space',
      pulse: true,
    },
    { id: 'registration', label: 'Регистрация команды', icon: UserPlus, badge: 'Заявка' },
    { id: 'submissions', label: 'Загрузка решений', icon: UploadCloud, badge: '5 этапов' },
    {
      id: 'jury',
      label: 'Панель жюри',
      icon: Scale,
      badge: userRole === 'jury' ? 'Эксперт' : undefined,
    },
    { id: 'leaderboard', label: 'Рейтинг команд', icon: Award, badge: '#1' },
    { id: 'cosmoport', label: 'Шлюз портов', icon: Server, badge: 'Pino/Cfg' },
    { id: 'telemetry', label: 'Телеметрия', icon: Radio, pulse: true },
    { id: 'spacemap', label: 'Карта космоса', icon: Globe },
    { id: 'forum', label: 'Форум', icon: MessageSquare, badge: 'Обсуждения' },
    { id: 'education', label: 'Обучение & 360°', icon: GraduationCap },
    { id: 'mentor', label: 'Связь с ментором', icon: MessageSquare },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'certificates', label: 'Сертификаты', icon: Award, badge: 'Диплом' },
    { id: 'reports', label: 'PDF-Отчеты', icon: FileText },
  ];

  const roleLabels: Record<UserRole, { label: string; desc: string; icon: string }> = {
    participant: { label: `Команда «${activeTeam.name}»`, desc: 'Участник чемпионата', icon: '🚀' },
    jury: { label: 'Жюри (Проф. Мельников)', desc: 'Экспертная комиссия', icon: '⚖️' },
    mentor: { label: 'Ментор (В.А. Соколов)', desc: 'Научный наставник', icon: '🎓' },
    organizer: { label: 'Оргкомитет чемпионата', desc: 'Администрация запуска', icon: '🛰️' },
    admin: { label: 'Администратор системы', desc: 'Главный координатор', icon: '🛠️' },
    expert: { label: 'Экспертная комиссия', desc: 'Оценка решений', icon: '⚖️' },
  };

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-900/30 bg-slate-950/85 backdrop-blur-xl">
      {/* Top Banner: Cosmos Branding & Mission HUD */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs border-b border-slate-900/80">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-cyan-400 font-semibold tracking-wider">
            ОРБИТАЛЬНЫЙ СТАТУС: CUBESAT-3U ONLINE
          </span>
          <span className="hidden sm:inline-block text-slate-500">|</span>
          <span className="hidden sm:inline-block text-slate-400">
            Частота маяка: <strong className="text-slate-200 font-mono">437.425 МГц</strong>
          </span>
          <span className="hidden md:inline-block text-slate-500">|</span>
          <span className="hidden md:inline-block text-slate-400">
            Окно пуска с космодрома «Восточный»:{' '}
            <strong className="text-amber-300 font-mono">T-38 сут.</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenVoiceAssistant}
            className="flex items-center gap-1.5 rounded bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-2.5 py-1 text-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/40 transition-all font-semibold shadow-sm animate-pulse-subtle"
            title="Голосовой ассистент ЦУП (демо)"
          >
            <Mic className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-mono">Голос ЦУП</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping hidden sm:inline-block" />
          </button>

          <button
            onClick={onOpenRegistration}
            className="flex items-center gap-1.5 rounded bg-cyan-500/10 px-2.5 py-1 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all font-medium"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Регистрация команды</span>
          </button>

          <button
            onClick={onOpenCustomizer}
            className="flex items-center gap-1.5 rounded bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all"
            title="Настроить виджеты дашборда"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Виджеты</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <div
          role="button"
          tabIndex={0}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onTabChange('team')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onTabChange('team');
            }
          }}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
            <Satellite className="h-5 w-5 text-white animate-pulse" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
              3U
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wide text-white">
                КОСМОС<span className="text-cyan-400">-ПРОСТО</span>
              </span>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                Кейс-чемпионат
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Школьный турнир по физике & Орбитальный запуск КубСата
            </p>
          </div>
        </div>

        {/* Right Tools: Role selector & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              aria-haspopup="true"
              aria-expanded={showNotifMenu}
              aria-controls="notifications-menu"
              aria-label="Уведомления чемпионата"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 transition-colors"
              title="Уведомления о проверке и запуске"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div
                ref={notifMenuRef}
                id="notifications-menu"
                role="menu"
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl z-50"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white">Уведомления чемпионата</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{unreadCount} новых</span>
                </div>
                <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onMarkNotificationRead(n.id);
                        if (n.linkTab) onTabChange(n.linkTab);
                        setShowNotifMenu(false);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onMarkNotificationRead(n.id);
                          if (n.linkTab) onTabChange(n.linkTab);
                          setShowNotifMenu(false);
                        }
                      }}
                      className={`cursor-pointer rounded-lg p-2.5 text-xs transition-colors ${
                        n.read
                          ? 'bg-slate-950/40 text-slate-400 hover:bg-slate-800/40'
                          : 'bg-cyan-950/30 border border-cyan-800/40 text-slate-200 hover:bg-cyan-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-cyan-300 font-semibold">{n.title}</span>
                        <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                      </div>
                      <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile QR Auth Button */}
          {onOpenMobileSync && (
            <button
              type="button"
              onClick={onOpenMobileSync}
              title="Мобильная авторизация команды (QR-код)"
              aria-label="Мобильная авторизация команды (QR-код)"
              className="relative flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-cyan-500/50 hover:bg-slate-850 transition-all shadow-sm cursor-pointer"
            >
              <QrCode className="h-4 w-4 text-cyan-400" />
              <span className="hidden xl:inline text-xs">Моб. QR</span>
              {connectedDevicesCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                  {connectedDevicesCount}
                </span>
              )}
            </button>
          )}

          {/* Role Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              aria-haspopup="true"
              aria-expanded={showRoleMenu}
              aria-controls="role-menu"
              className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-500/50 hover:bg-slate-850 transition-all shadow-sm"
            >
              <span>{roleLabels[userRole].icon}</span>
              <div className="text-left hidden md:block">
                <div className="font-semibold text-white line-clamp-1">
                  {roleLabels[userRole].label}
                </div>
                <div className="text-[10px] text-cyan-400">{roleLabels[userRole].desc}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div
                ref={roleMenuRef}
                id="role-menu"
                role="menu"
                className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50"
              >
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Сменить рабочий профиль:
                </div>
                {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      onRoleChange(role);
                      setShowRoleMenu(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                      userRole === role
                        ? 'bg-cyan-500/20 text-cyan-200 font-medium border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{roleLabels[role].icon}</span>
                    <div>
                      <div className="font-semibold text-white">{roleLabels[role].label}</div>
                      <div className="text-[10px] text-slate-400">{roleLabels[role].desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar Toggle Button */}
          {onToggleRightSidebar && (
            <button
              type="button"
              onClick={onToggleRightSidebar}
              aria-label={
                isRightSidebarOpen ? 'Скрыть боковую панель ЦУП' : 'Открыть боковую панель ЦУП'
              }
              title={isRightSidebarOpen ? 'Скрыть панель ЦУП' : 'Центр управления (ЦУП)'}
              className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-all shadow-sm cursor-pointer ${
                isRightSidebarOpen
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-slate-850'
              }`}
            >
              <PanelRight className="h-4 w-4 text-cyan-400" />
              <span className="hidden xl:inline">ЦУП</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="mx-auto max-w-7xl px-4 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 border-t border-slate-900/60 pt-1 pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 shadow-sm border border-cyan-500/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                      isActive ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {tab.pulse && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
