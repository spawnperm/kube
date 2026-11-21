import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Rocket,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  Award,
  AlertTriangle,
  Mail,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Check,
  Building,
  GraduationCap,
  Radio,
  FileText,
  MapPin,
  Trash2,
  Bell,
  RefreshCw,
  Table,
  CreditCard,
  Edit3,
  Eye,
} from 'lucide-react';
import {
  UserProfile,
  Team,
  ChampionshipNews,
  RouteSheetItem,
  SystemAlert,
} from '@/src/shared/types/index';
import { CRM_TEAMS_DATABASE, CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';
import { CASE_TASKS } from '@/src/shared/data/mockData';
import { audioService } from '@/src/shared/lib/audioService';
import { canEditTeamCard } from '@/src/contexts/crew/services/rolePermissionService';
import { TeamsCardsDeckView } from '@/src/contexts/crew/components/TeamsCardsDeckView';
import { TeamsTableView } from '@/src/contexts/crew/components/TeamsTableView';
import { TeamEditModal } from '@/src/contexts/crew/components/TeamEditModal';
import { CaseTaskDirectoryModal } from '@/src/contexts/project/components/CaseTaskDirectoryModal';

interface MccOrganizersScreenProps {
  currentUser: UserProfile;
  newsList: ChampionshipNews[];
  routeSheet: RouteSheetItem[];
  systemAlerts: SystemAlert[];
  allTeams?: CrmTeamRecord[];
  onAddNews: (news: ChampionshipNews) => void;
  onDeleteNews: (newsId: string) => void;
  onSendAlert: (alert: SystemAlert) => void;
  onUpdateRouteStep?: (stepId: string, status: RouteSheetItem['status']) => void;
  onSelectTeam?: (teamId: string) => void;
  onUpdateTeamRecord?: (team: CrmTeamRecord) => void;
  onAddTeamRecord?: (team: CrmTeamRecord) => void;
  onDeleteTeamRecord?: (teamId: string) => void;
  onImpersonateCaptain?: (team: CrmTeamRecord) => void;
}

export const MccOrganizersScreen: React.FC<MccOrganizersScreenProps> = ({
  currentUser,
  newsList,
  routeSheet,
  systemAlerts,
  allTeams = CRM_TEAMS_DATABASE,
  onAddNews,
  onDeleteNews,
  onSendAlert,
  onUpdateRouteStep,
  onSelectTeam,
  onUpdateTeamRecord,
  onAddTeamRecord,
  onDeleteTeamRecord,
  onImpersonateCaptain,
}) => {
  const [activeMccTab, setActiveMccTab] = useState<'crm' | 'news' | 'alerts' | 'route'>('crm');
  const [searchQuery, setSearchQuery] = useState('');

  // Local synced state for teams
  const [localTeams, setLocalTeams] = useState<CrmTeamRecord[]>(allTeams);

  useEffect(() => {
    setLocalTeams(allTeams);
  }, [allTeams]);

  // CRM View mode: 'cards' or 'table'
  const [crmViewMode, setCrmViewMode] = useState<'cards' | 'table'>('cards');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<CrmTeamRecord | null>(null);
  const [isAddingNewTeam, setIsAddingNewTeam] = useState(false);

  // Task Directory State
  const [isTaskDirectoryOpen, setIsTaskDirectoryOpen] = useState(false);
  const [taskDirectoryTargetTeam, setTaskDirectoryTargetTeam] = useState<CrmTeamRecord | null>(
    null,
  );

  // CRM selected team detail drawer
  const [selectedCrmTeamId, setSelectedCrmTeamId] = useState<string>(allTeams[0]?.id || 'team-1');

  // News form state
  const [isNewNewsModalOpen, setIsNewNewsModalOpen] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState<
    'event' | 'announcement' | 'navigation' | 'deadline' | 'results'
  >('announcement');
  const [newsLocation, setNewsLocation] = useState('');
  const [newsPinned, setNewsPinned] = useState(false);
  const [newsAttachmentName, setNewsAttachmentName] = useState('');

  // System alert form state
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertPriority, setAlertPriority] = useState<'info' | 'warning' | 'urgent'>('info');
  const [alertTargetTeamId, setAlertTargetTeamId] = useState('all');

  const handleUpdateTeamRecord = (updatedTeam: CrmTeamRecord) => {
    setLocalTeams((prev) => prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)));
    if (onUpdateTeamRecord) {
      onUpdateTeamRecord(updatedTeam);
    }
    if (selectedCrmTeamId === updatedTeam.id) {
      setSelectedCrmTeamId(updatedTeam.id);
    }
  };

  const handleAddTeamRecord = (newTeam: CrmTeamRecord) => {
    setLocalTeams((prev) => [...prev, newTeam]);
    if (onAddTeamRecord) {
      onAddTeamRecord(newTeam);
    }
    setSelectedCrmTeamId(newTeam.id);
  };

  const handleDeleteTeamRecord = (teamId: string) => {
    setLocalTeams((prev) => prev.filter((t) => t.id !== teamId));
    if (onDeleteTeamRecord) {
      onDeleteTeamRecord(teamId);
    }
  };

  const handleOpenEditTeam = (team: CrmTeamRecord) => {
    if (!canEditTeamCard(currentUser, team)) {
      audioService.playTimerWarning();
      alert(
        'Редактирование карточки команды разрешено только пользователям с ролями: Администратор, Организатор или Капитан команды.',
      );
      return;
    }
    setEditingTeam(team);
    setIsAddingNewTeam(false);
    setIsEditModalOpen(true);
  };

  const handleOpenAddNewTeam = () => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'organizer') {
      audioService.playTimerWarning();
      alert('Добавление новой команды доступно только Администратору или Организатору.');
      return;
    }
    setEditingTeam(null);
    setIsAddingNewTeam(true);
    setIsEditModalOpen(true);
  };

  const handleOpenTaskDirectory = (team: CrmTeamRecord) => {
    setTaskDirectoryTargetTeam(team);
    setIsTaskDirectoryOpen(true);
  };

  const handleSelectTaskFromDirectory = (taskId: string, taskTitle: string) => {
    if (!taskDirectoryTargetTeam) return;

    const updatedTeam: CrmTeamRecord = {
      ...taskDirectoryTargetTeam,
      selectedTaskId: taskId || undefined,
      selectedTaskTitle: taskTitle || undefined,
    };

    handleUpdateTeamRecord(updatedTeam);
    setTaskDirectoryTargetTeam(updatedTeam);

    if (editingTeam && editingTeam.id === updatedTeam.id) {
      setEditingTeam(updatedTeam);
    }
  };

  const handleCreateNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) return;

    const categoryLabels: Record<string, string> = {
      event: 'Главное событие',
      announcement: 'Оповещение ЦУП',
      navigation: 'Навигация и локация',
      deadline: 'Экспертиза и жюри',
      results: 'Итоги чемпионата',
    };

    const newNewsItem: ChampionshipNews = {
      id: `news-${Date.now()}`,
      title: newsTitle.trim(),
      content: newsContent.trim(),
      category: newsCategory,
      categoryLabel: categoryLabels[newsCategory] || 'Новость',
      publishedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      authorName: currentUser.name,
      authorRole: currentUser.role === 'admin' ? 'Координатор ЦУП' : 'Оргкомитет ЦУП',
      locationBadge: newsLocation.trim() || undefined,
      pinned: newsPinned,
      attachmentName: newsAttachmentName.trim() || undefined,
    };

    onAddNews(newNewsItem);
    setIsNewNewsModalOpen(false);
    setNewsTitle('');
    setNewsContent('');
    setNewsAttachmentName('');
    audioService.playSuccessChime();
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;

    const targetTeam =
      alertTargetTeamId === 'all' ? undefined : allTeams.find((t) => t.id === alertTargetTeamId);

    const newAlert: SystemAlert = {
      id: `alert-${Date.now()}`,
      title: alertTitle.trim(),
      message: alertMessage.trim(),
      priority: alertPriority,
      senderName: `${currentUser.name} (ЦУП)`,
      targetTeamId: alertTargetTeamId === 'all' ? undefined : alertTargetTeamId,
      targetTeamName: targetTeam ? targetTeam.shipName || targetTeam.cubesatName : undefined,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stageName: 'Текущий этап',
    };

    onSendAlert(newAlert);
    setAlertTitle('');
    setAlertMessage('');
    audioService.playSuccessChime();
  };

  const filteredTeams = allTeams.filter(
    (t) =>
      t.shipName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mentorName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedCrmTeam = allTeams.find((t) => t.id === selectedCrmTeamId) || allTeams[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. MCC HEADER */}
      <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>ЦЕНТР УПРАВЛЕНИЯ ПОЛЁТАМИ (ЦУП) • ОРГКОМИТЕТ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Организационный штаб и CRM-система
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Командир ЦУПа: <strong>{currentUser.name}</strong> • МАОУ ДПО «ЦРСО» / Оргкомитет
            </p>
          </div>

          {/* Quick Action to publish news or alert */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewNewsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Опубликовать новость</span>
            </button>
          </div>
        </div>

        {/* 2. MCC NAVIGATION TABS */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'crm', label: '📋 CRM-реестр 16 команд', icon: Users },
            { id: 'news', label: '📰 Публикации в блог на главную', icon: FileText },
            { id: 'alerts', label: '📢 Оповещения экипажей', icon: Bell },
            { id: 'route', label: '🗺️ Маршрутный лист дня', icon: MapPin },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMccTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMccTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: CRM SYSTEM */}
      {activeMccTab === 'crm' && (
        <div className="space-y-5">
          {/* CRM Header & View Switcher Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Users className="w-4 h-4" />
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Центр управления квотами и заявками ЦУП
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-cyan-300">
                  Всего: {localTeams.length} бортов
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Реестр школьных экипажей чемпионата «КОСМОПОРТ»
              </h2>
              <p className="text-xs text-slate-400">
                Листайте карточки команд, редактируйте все поля через профессиональную таблицу,
                добавляйте новые экипажи и закрепляйте уникальные кейс-задания из справочника.
              </p>
            </div>

            {/* View Switcher & Add Team Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Cards vs Table Switcher */}
              <div className="flex items-center rounded-2xl bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    audioService.playClickSound();
                    setCrmViewMode('cards');
                  }}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    crmViewMode === 'cards'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Вид в виде интерактивных карточек с перелистыванием"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Карточки команд</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioService.playClickSound();
                    setCrmViewMode('table');
                  }}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    crmViewMode === 'table'
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Профессиональная табличная форма для редактирования всех полей команды"
                >
                  <Table className="w-4 h-4" />
                  <span>Табличная форма</span>
                </button>
              </div>

              {/* Open 500 Task Directory Button */}
              <button
                type="button"
                onClick={() => {
                  setTaskDirectoryTargetTeam(localTeams[0] || null);
                  setIsTaskDirectoryOpen(true);
                  audioService.playClickSound();
                }}
                className="px-3.5 py-2.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                title="Справочник 500 кейс-заданий CubeSat по 10 направлениям"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Справочник кейсов</span>
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-cyan-300 text-[10px] font-mono">
                  500
                </span>
              </button>

              {/* Add New Team Button (Only for Admin & Organizer) */}
              {(currentUser.role === 'admin' || currentUser.role === 'organizer') && (
                <button
                  type="button"
                  onClick={handleOpenAddNewTeam}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Добавить команду</span>
                </button>
              )}
            </div>
          </div>

          {/* Impersonation & Quick Actions Bar for selected team in CRM */}
          {selectedCrmTeam && onImpersonateCaptain && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900 border border-purple-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Rocket className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs text-white font-bold flex items-center gap-2">
                    <span>Выбранный борт: «{selectedCrmTeam.shipName}»</span>
                    <span className="text-[10px] text-cyan-300 font-mono">
                      ({selectedCrmTeam.shipCallsign})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Капитан: <strong>{selectedCrmTeam.mentorName}</strong> (
                    {selectedCrmTeam.mentorEmail}) • {selectedCrmTeam.school}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onImpersonateCaptain(selectedCrmTeam)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
                title="Войти в систему от лица капитана этой команды, чтобы просмотреть или настроить пульт корабля и слайды"
              >
                <Eye className="w-4 h-4" />
                <span>Войти под капитаном команды</span>
              </button>
            </div>
          )}

          {/* CRM CONTENT: CARDS OR TABLE */}
          {crmViewMode === 'cards' ? (
            <TeamsCardsDeckView
              teams={localTeams}
              currentUser={currentUser}
              onUpdateTeam={handleUpdateTeamRecord}
              onEditTeam={handleOpenEditTeam}
              onDeleteTeam={handleDeleteTeamRecord}
              onOpenTaskDirectory={handleOpenTaskDirectory}
              onSelectTeamForDossier={(id) => setSelectedCrmTeamId(id)}
              selectedTeamId={selectedCrmTeamId}
            />
          ) : (
            <TeamsTableView
              teams={localTeams}
              currentUser={currentUser}
              onUpdateTeam={handleUpdateTeamRecord}
              onEditTeam={handleOpenEditTeam}
              onDeleteTeam={handleDeleteTeamRecord}
              onOpenTaskDirectory={handleOpenTaskDirectory}
              onSelectTeamForDossier={(id) => setSelectedCrmTeamId(id)}
              selectedTeamId={selectedCrmTeamId}
            />
          )}
        </div>
      )}

      {/* TAB 2: NEWS MANAGEMENT & BLOG PUBLISHER */}
      {activeMccTab === 'news' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Управление новостями и блогом главной страницы</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Все опубликованные здесь новости мгновенно отображаются на Звёздной карте для всех
                гостей и участников
              </p>
            </div>

            <button
              onClick={() => setIsNewNewsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Создать новость</span>
            </button>
          </div>

          {/* Published News List with Delete / Edit capability */}
          <div className="space-y-3">
            {newsList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                      {item.categoryLabel || item.category}
                    </span>
                    {item.pinned && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                        Закреплено
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">{item.publishedAt}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2">{item.content}</p>

                  <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                    <span>Автор: {item.authorName}</span>
                    {item.locationBadge && (
                      <>
                        <span>•</span>
                        <span className="text-cyan-300">{item.locationBadge}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onDeleteNews(item.id)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors cursor-pointer"
                    title="Удалить новость"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ALERTS BROADCAST TO SHIPS & CREWS */}
      {activeMccTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Broadcast Form */}
          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span>Отправка оперативного оповещения экипажам</span>
              </h3>
              <p className="text-xs text-slate-400">
                Рассылка пуш-уведомлений командирам кораблей и штурманам Кубик
              </p>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Адресат оповещения:</label>
                <select
                  value={alertTargetTeamId}
                  onChange={(e) => setAlertTargetTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">📢 ВСЕМ 16 КОРАБЛЯМ (Общий космический эфир)</option>
                  {allTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.shipCallsign || t.shipName}: «{t.shipName}» ({t.school})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Приоритет сигнала:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'info', label: 'Информация', color: 'border-cyan-500 bg-cyan-600/30' },
                    { id: 'warning', label: 'Внимание', color: 'border-amber-500 bg-amber-600/30' },
                    {
                      id: 'urgent',
                      label: 'Срочный сбор',
                      color: 'border-rose-500 bg-rose-600/30',
                    },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAlertPriority(p.id as any)}
                      className={`py-1.5 rounded-xl font-bold border transition-colors cursor-pointer ${
                        alertPriority === p.id
                          ? `${p.color} text-white`
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Тема оповещения:</label>
                <input
                  type="text"
                  placeholder="Например: Готовность к очной защите"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Текст сообщения:</label>
                <textarea
                  rows={3}
                  placeholder="Инструкция для командира и экипажа..."
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Отправить оповещение в эфир</span>
              </button>
            </form>
          </div>

          {/* Right: Sent Alerts Log */}
          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Журнал отправленных сигналов ЦУП</span>
              </h3>
              <p className="text-xs text-slate-400">История недавних оповещений</p>
            </div>

            <div className="space-y-3">
              {systemAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                        alt.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300'
                          : alt.priority === 'warning'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {alt.priority.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{alt.sentAt}</span>
                  </div>

                  <h4 className="font-bold text-white">{alt.title}</h4>
                  <p className="text-slate-300 leading-relaxed">{alt.message}</p>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
                    <span>
                      Адресат:{' '}
                      <strong className="text-cyan-300">
                        {alt.targetTeamName ? `«${alt.targetTeamName}»` : 'Все корабли'}
                      </strong>
                    </span>
                    <span>Отправитель: {alt.senderName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ROUTE SHEET & STAGES MANAGEMENT */}
      {activeMccTab === 'route' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Управление расписанием и маршрутным листом дня</span>
            </h3>
            <p className="text-xs text-slate-400">
              Статусы контрольных этапов, переходы между залами и требования проверки
            </p>
          </div>

          <div className="space-y-3">
            {routeSheet.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-amber-400">ЭТАП {item.stepNumber}</span>
                    <span className="text-slate-400">({item.timeSlot})</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        item.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.status === 'current'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.status === 'completed'
                        ? 'Завершен'
                        : item.status === 'current'
                          ? 'Идет сейчас'
                          : 'Предстоящий'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <p className="text-slate-300 leading-relaxed">{item.description}</p>
                  <p className="text-[11px] text-cyan-300">Локация: {item.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MODAL: CREATE NEWS */}
      {isNewNewsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Опубликовать новость в блог на главную</span>
              </h3>
              <button
                onClick={() => setIsNewNewsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNews} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Заголовок новости:</label>
                <input
                  type="text"
                  placeholder="Например: Открытие зоны очных защит в Главном зале"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Категория:</label>
                  <select
                    value={newsCategory}
                    onChange={(e) => setNewsCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="event">🚀 Главное событие</option>
                    <option value="announcement">📢 Оповещение ЦУП</option>
                    <option value="navigation">🗺️ Навигация и локация</option>
                    <option value="deadline">⚖️ Экспертиза и жюри</option>
                    <option value="results">🏆 Итоги этапа</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Локация / Аудитория:</label>
                  <input
                    type="text"
                    value={newsLocation}
                    onChange={(e) => setNewsLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Текст новости:</label>
                <textarea
                  rows={4}
                  placeholder="Подробный текст сообщения для всех участников чемпионата..."
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newsPinned}
                    onChange={(e) => setNewsPinned(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>Закрепить новость в топе ленты</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewNewsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Опубликовать на главной
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM EDIT & ADD MODAL */}
      <TeamEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        team={editingTeam}
        currentUser={currentUser}
        isNew={isAddingNewTeam}
        nextOrderNumber={localTeams.length + 1}
        onSave={(savedTeam) => {
          if (isAddingNewTeam) {
            handleAddTeamRecord(savedTeam);
          } else {
            handleUpdateTeamRecord(savedTeam);
          }
        }}
        onOpenTaskDirectory={(team) => {
          handleOpenTaskDirectory(team);
        }}
      />

      {/* CASE TASK DIRECTORY MODAL */}
      <CaseTaskDirectoryModal
        isOpen={isTaskDirectoryOpen}
        onClose={() => setIsTaskDirectoryOpen(false)}
        targetTeam={taskDirectoryTargetTeam}
        allTeams={localTeams}
        tasks={CASE_TASKS}
        onSelectTask={handleSelectTaskFromDirectory}
        onClearTask={() => handleSelectTaskFromDirectory('', '')}
      />
    </div>
  );
};
