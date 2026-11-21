import React, { useState } from 'react';
import {
  Bell,
  Sparkles,
  Rocket,
  Shield,
  Award,
  Radio,
  Settings,
  UserCheck,
  ChevronDown,
  Globe,
  Users,
  Lock,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  Sliders,
  Compass,
} from 'lucide-react';
import { audioService } from '@/src/shared/lib/audioService';
import { UserRole } from '@/src/shared/types/index';

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

interface TopBarProps {
  isOnline: boolean;
  offlineForced: boolean;
  onToggleOffline: () => void;
  onOpenSync: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  onOpenAiRegistration?: () => void;
  onOpenTaskDirectory?: () => void;
  currentScreen: UnifiedScreenId;
  onSelectScreen: (screen: UnifiedScreenId) => void;
  userRank: string;
  userXp: number;
  crystals: number;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSwitchUserRole?: (role: UserRole) => void;
  pendingSyncCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  isOnline,
  offlineForced,
  onToggleOffline,
  onOpenSync,
  onOpenNotifications,
  unreadNotificationsCount,
  onOpenAiRegistration,
  onOpenTaskDirectory,
  currentScreen,
  onSelectScreen,
  userRank,
  userXp,
  crystals,
  userName,
  userRole,
  userAvatar,
  isSidebarCollapsed,
  onToggleSidebar,
  onSwitchUserRole,
  pendingSyncCount = 0,
}) => {
  const [isScreensDropdownOpen, setIsScreensDropdownOpen] = useState(false);

  // Admin, Organizers, and Team Captains (mentor) are authorized to toggle between screens in the dropdown
  const canSwitchScreens =
    userRole === 'admin' || userRole === 'organizer' || userRole === 'mentor';

  const getScreenDetails = (screenId: string) => {
    switch (screenId) {
      case 'stage_director':
        return {
          id: 'stage_director',
          label: 'Пульт управления фронтендом',
          shortLabel: 'Пульт сцены',
          icon: Sliders,
          color: 'text-cyan-400',
          badge: 'Live Эфир',
        };
      case 'starmap':
        return {
          id: 'starmap',
          label: 'Главная (Звёздная карта)',
          shortLabel: 'Главная',
          icon: Globe,
          color: 'text-cyan-400',
          badge: 'Сектор 1',
        };
      case 'ship':
        return {
          id: 'ship',
          label: 'Пульт корабля (CubeSat)',
          shortLabel: 'Пульт корабля',
          icon: Rocket,
          color: 'text-indigo-400',
          badge: 'Сектор 2',
        };
      case 'inspectors':
        return {
          id: 'inspectors',
          label: 'Инспекторы (Эксперты)',
          shortLabel: 'Инспекторы',
          icon: Award,
          color: 'text-purple-400',
          badge: 'Сектор 3',
        };
      case 'mcc':
        return {
          id: 'mcc',
          label: 'ЦУП (Организаторы)',
          shortLabel: 'ЦУП',
          icon: Radio,
          color: 'text-amber-400',
          badge: 'Сектор 4',
        };
      case 'admin':
        return {
          id: 'admin',
          label: 'Координатор ЦУП',
          shortLabel: 'Координатор',
          icon: Settings,
          color: 'text-rose-400',
          badge: 'Сектор 5',
        };
      case 'quiz':
        return {
          id: 'quiz',
          label: 'Орбитальный экзамен (Квиз)',
          shortLabel: 'Экзамен',
          icon: Sparkles,
          color: 'text-emerald-400',
          badge: 'AI-Тест',
        };
      case 'wiki':
        return {
          id: 'wiki',
          label: 'База знаний LLM-Wiki',
          shortLabel: 'Wiki',
          icon: BookOpen,
          color: 'text-indigo-400',
          badge: 'Знания',
        };
      case 'mascot':
        return {
          id: 'mascot',
          label: 'AI-штурман Кубик',
          shortLabel: 'Кубик',
          icon: Radio,
          color: 'text-amber-400',
          badge: 'AI',
        };
      case 'team':
        return {
          id: 'team',
          label: 'Дашборд & График Ганта',
          shortLabel: 'Дашборд',
          icon: Rocket,
          color: 'text-cyan-400',
          badge: 'Гант',
        };
      case 'submissions':
        return {
          id: 'submissions',
          label: '3 Этапа кейса (Решения)',
          shortLabel: 'Этапы кейса',
          icon: Rocket,
          color: 'text-emerald-400',
          badge: 'Кейс',
        };
      case 'telemetry':
        return {
          id: 'telemetry',
          label: 'Телеметрия & AX.25 радиомаяк',
          shortLabel: 'Телеметрия',
          icon: Radio,
          color: 'text-sky-400',
          badge: 'Маяк',
        };
      case 'spacemap':
        return {
          id: 'spacemap',
          label: 'Орбитальная карта & Наземные станции',
          shortLabel: 'Карта орбит',
          icon: Globe,
          color: 'text-blue-400',
          badge: '2D Трасса',
        };
      case 'spacepi':
        return {
          id: 'spacepi',
          label: 'Space-Pi & СОНИКС',
          shortLabel: 'Space-Pi',
          icon: Rocket,
          color: 'text-violet-400',
          badge: 'Спутник',
        };
      case 'jury':
        return {
          id: 'jury',
          label: 'Оценки жюри & Критерии',
          shortLabel: 'Оценки',
          icon: Award,
          color: 'text-purple-400',
          badge: 'Жюри',
        };
      case 'analytics':
        return {
          id: 'analytics',
          label: 'Аналитика этапов & SPI метрики',
          shortLabel: 'Аналитика',
          icon: Award,
          color: 'text-teal-400',
          badge: 'SPI',
        };
      case 'leaderboard':
        return {
          id: 'leaderboard',
          label: 'Турнирный рейтинг команд',
          shortLabel: 'Рейтинг',
          icon: Award,
          color: 'text-amber-400',
          badge: 'Лидеры',
        };
      case 'certificates':
        return {
          id: 'certificates',
          label: 'Генератор сертификатов (PDF)',
          shortLabel: 'Сертификаты',
          icon: Award,
          color: 'text-orange-400',
          badge: 'jsPDF',
        };
      case 'reports':
        return {
          id: 'reports',
          label: 'PDF Паспорт и отчёты миссии',
          shortLabel: 'Отчёты',
          icon: Award,
          color: 'text-rose-400',
          badge: 'Экспорт',
        };
      case 'forum':
        return {
          id: 'forum',
          label: 'Форум участников кейса',
          shortLabel: 'Форум',
          icon: Users,
          color: 'text-pink-400',
          badge: 'Общение',
        };
      case 'education':
        return {
          id: 'education',
          label: 'Обучающие материалы по физике',
          shortLabel: 'Обучение',
          icon: BookOpen,
          color: 'text-green-400',
          badge: 'База',
        };
      case 'mentor':
        return {
          id: 'mentor',
          label: 'Чат с академическим ментором',
          shortLabel: 'Ментор',
          icon: Users,
          color: 'text-cyan-400',
          badge: 'Связь',
        };
      case 'cosmoport':
        return {
          id: 'cosmoport',
          label: 'Хаб Космопорта и стыковка',
          shortLabel: 'Хаб',
          icon: Settings,
          color: 'text-indigo-400',
          badge: 'Шлюзы',
        };
      default:
        return {
          id: 'starmap',
          label: 'Главная',
          shortLabel: 'Главная',
          icon: Globe,
          color: 'text-cyan-400',
          badge: 'Сектор 1',
        };
    }
  };

  // Screens available in dropdown for privileged roles
  const getAllowedScreens = () => {
    if (userRole === 'admin') {
      return [
        getScreenDetails('stage_director'),
        getScreenDetails('admin'),
        getScreenDetails('mcc'),
        getScreenDetails('inspectors'),
        getScreenDetails('ship'),
        getScreenDetails('starmap'),
        getScreenDetails('quiz'),
        getScreenDetails('wiki'),
      ];
    }
    if (userRole === 'organizer') {
      return [
        getScreenDetails('mcc'),
        getScreenDetails('inspectors'),
        getScreenDetails('ship'),
        getScreenDetails('starmap'),
        getScreenDetails('quiz'),
        getScreenDetails('wiki'),
      ];
    }
    // Fixed screen for each standard role
    if (userRole === 'expert') {
      return [getScreenDetails('inspectors'), getScreenDetails('quiz'), getScreenDetails('wiki')];
    }
    if (userRole === 'mentor') {
      return [
        getScreenDetails('ship'),
        getScreenDetails('quiz'),
        getScreenDetails('wiki'),
        getScreenDetails('starmap'),
      ];
    }
    if (userRole === 'participant') {
      return [getScreenDetails('ship'), getScreenDetails('quiz'), getScreenDetails('wiki')];
    }
    return [getScreenDetails('starmap'), getScreenDetails('quiz'), getScreenDetails('wiki')];
  };

  const allowedScreens = getAllowedScreens();
  const currentInfo = getScreenDetails(currentScreen);
  const CurrentIcon = currentInfo.icon;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-20 flex items-center justify-between gap-2">
        {/* Zone 1: Logo Wordmark & Mobile Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Открыть меню навигации"
            aria-label="Открыть меню навигации"
          >
            <Compass className="w-5 h-5 text-cyan-400" />
          </button>

          <button
            onClick={() => {
              if (canSwitchScreens || userRole === 'guest') {
                onSelectScreen('starmap');
              }
            }}
            className="flex items-center gap-3 text-left group focus-visible:outline-none cursor-pointer shrink-0"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black text-xl tracking-wider shadow-inner">
              КП
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-indigo-400 transition-colors leading-tight">
                КОСМОПОРТ
              </span>
              <span className="text-[13px] sm:text-sm text-slate-400 hidden sm:inline font-mono tracking-wide">
                Кейс-чемпионат 2026
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Role-Driven Screen Selection (Dropdown for Admin & Organizers, Single Default Item for others) */}
        <nav className="hidden md:flex items-center text-xs font-semibold">
          {canSwitchScreens ? (
            /* Privileged Dropdown Menu for Admin & Organizers */
            <div className="relative">
              {isScreensDropdownOpen && (
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setIsScreensDropdownOpen(false)}
                />
              )}

              <button
                type="button"
                onClick={() => setIsScreensDropdownOpen(!isScreensDropdownOpen)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-indigo-500/40 hover:border-indigo-400/80 text-xs font-bold text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer relative z-50"
                title="Выпадающее меню экранов (доступно ЦУП и Администратору)"
              >
                <CurrentIcon className={`w-4 h-4 ${currentInfo.color} shrink-0`} />
                <span>{currentInfo.label}</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                  {currentInfo.badge}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isScreensDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isScreensDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 space-y-1 text-xs animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 border-b border-slate-800 flex items-center justify-between">
                    <span>ВЫПАДАЮЩЕЕ МЕНЮ ЭКРАНОВ:</span>
                    <span className="text-amber-400 font-bold">
                      {userRole === 'admin' ? 'Администратор' : 'Организатор ЦУП'}
                    </span>
                  </div>

                  {allowedScreens.map((screen) => {
                    const ScreenIcon = screen.icon;
                    const isActive = currentScreen === screen.id;

                    return (
                      <button
                        key={screen.id}
                        type="button"
                        onClick={() => {
                          onSelectScreen(screen.id as any);
                          setIsScreensDropdownOpen(false);
                          audioService.playClickSound();
                        }}
                        className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600/30 text-white font-bold ring-1 ring-indigo-500/50'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ScreenIcon className={`w-4 h-4 ${screen.color} shrink-0`} />
                          <div className="min-w-0">
                            <span className="block truncate">{screen.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {screen.badge}
                            </span>
                          </div>
                        </div>
                        {isActive && (
                          <span className="text-cyan-400 font-bold text-xs ml-2">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Single Assigned Default Item for Standard Roles (Passenger, Crew, Inspectors) */
            <div
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-2 shadow-inner"
              title={`Закрепленный рабочий экран: ${currentInfo.label}`}
            >
              <CurrentIcon className={`w-4 h-4 ${currentInfo.color} shrink-0`} />
              <span>{currentInfo.label}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-400 text-[10px] font-mono flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-slate-500" />
                По умолчанию
              </span>
            </div>
          )}
        </nav>

        {/* Zone 3: Actions & Notifications */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 relative transition-colors cursor-pointer"
            title="Оповещения ЦУП"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Toggle Right Sidebar Navigation Button */}
          <button
            onClick={onToggleSidebar}
            className={`px-3 py-2 rounded-xl border transition-all cursor-pointer ml-1 flex items-center gap-1.5 shadow-sm ${
              !isSidebarCollapsed
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isSidebarCollapsed ? 'Развернуть меню навигации ЦУП' : 'Свернуть меню навигации'}
            aria-label={
              isSidebarCollapsed ? 'Развернуть меню навигации ЦУП' : 'Свернуть меню навигации'
            }
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold hidden md:inline">Меню</span>
            {isSidebarCollapsed ? (
              <PanelRightOpen className="w-4 h-4 text-slate-400" />
            ) : (
              <PanelRightClose className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
