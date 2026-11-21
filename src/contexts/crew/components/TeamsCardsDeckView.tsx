import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  BookOpen,
  Users,
  School,
  UserCheck,
  Shield,
  Sparkles,
  Search,
  Grid,
  CreditCard,
  CheckCircle2,
  Mail,
  Phone,
  Layers,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';
import { UserProfile } from '@/src/shared/types';
import { canEditTeamCard } from '@/src/contexts/crew/services/rolePermissionService';
import { audioService } from '@/src/shared/lib/audioService';

interface TeamsCardsDeckViewProps {
  teams: CrmTeamRecord[];
  currentUser?: UserProfile;
  onUpdateTeam: (team: CrmTeamRecord) => void;
  onEditTeam: (team: CrmTeamRecord) => void;
  onDeleteTeam: (teamId: string) => void;
  onOpenTaskDirectory: (team: CrmTeamRecord) => void;
  onSelectTeamForDossier?: (teamId: string) => void;
  selectedTeamId?: string;
}

export const TeamsCardsDeckView: React.FC<TeamsCardsDeckViewProps> = ({
  teams,
  currentUser,
  onUpdateTeam,
  onEditTeam,
  onDeleteTeam,
  onOpenTaskDirectory,
  onSelectTeamForDossier,
  selectedTeamId,
}) => {
  const isAuthorizedToEditCards = canEditTeamCard(currentUser);
  const isCaptain = currentUser?.role === 'mentor' || (currentUser?.role as any) === 'captain';
  const isAdmin = currentUser?.role === 'admin';
  const isOrganizer = currentUser?.role === 'organizer';
  const canDeleteTeams = isAdmin || isOrganizer;

  // Navigation mode: 'grid_paged' (4-6 per page) or 'carousel' (card-by-card browser)
  const [deckMode, setDeckMode] = useState<'grid_paged' | 'carousel'>('grid_paged');
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsPerPage, setCardsPerPage] = useState<number>(6);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | '1U' | '2U' | '3U' | '6U'>('all');

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        t.shipName.toLowerCase().includes(q) ||
        t.shipCallsign.toLowerCase().includes(q) ||
        t.school.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.mentorName.toLowerCase().includes(q) ||
        (t.selectedTaskTitle && t.selectedTaskTitle.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (formatFilter !== 'all' && t.cubesatFormat !== formatFilter) return false;

      return true;
    });
  }, [teams, searchQuery, formatFilter]);

  // Adjust page count
  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / cardsPerPage));

  // Current page items
  const paginatedTeams = useMemo(() => {
    const start = (currentPage - 1) * cardsPerPage;
    return filteredTeams.slice(start, start + cardsPerPage);
  }, [filteredTeams, currentPage, cardsPerPage]);

  // Reset page when filter changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    setCarouselIndex(0);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      audioService.playClickSound();
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      audioService.playClickSound();
      setCurrentPage((p) => p + 1);
    }
  };

  const handlePrevCarousel = () => {
    audioService.playClickSound();
    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : filteredTeams.length - 1));
  };

  const handleNextCarousel = () => {
    audioService.playClickSound();
    setCarouselIndex((prev) => (prev < filteredTeams.length - 1 ? prev + 1 : 0));
  };

  const activeCarouselTeam = filteredTeams[carouselIndex] || filteredTeams[0];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Cards Deck Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Поиск по карточкам бортов…"
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format Filter */}
            <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] font-mono text-slate-500">Формат:</span>
              <select
                value={formatFilter}
                onChange={(e) => {
                  setFormatFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-cyan-400 font-mono focus:outline-none cursor-pointer"
              >
                <option value="all">Все (1U-6U)</option>
                <option value="1U">1U</option>
                <option value="2U">2U</option>
                <option value="3U">3U</option>
                <option value="6U">6U</option>
              </select>
            </div>

            {/* Mode Toggle: Grid Paged vs Carousel Deck */}
            <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  audioService.playClickSound();
                  setDeckMode('grid_paged');
                }}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  deckMode === 'grid_paged'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Сетка карточек с перелистыванием страниц"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Сетка</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  audioService.playClickSound();
                  setDeckMode('carousel');
                }}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  deckMode === 'carousel'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Карусель / Карточный терминал"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Терминал</span>
              </button>
            </div>
          </div>
        </div>

        {/* Role Permissions & Editing Access Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Право редактирования:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all ${
                  isAdmin
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 ring-1 ring-rose-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800/80'
                }`}
              >
                <Shield className="w-3 h-3 text-rose-400" />
                Администратор
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all ${
                  isOrganizer
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800/80'
                }`}
              >
                <Users className="w-3 h-3 text-amber-400" />
                Организатор
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all ${
                  isCaptain
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800/80'
                }`}
              >
                <UserCheck className="w-3 h-3 text-indigo-400" />
                Капитан команды
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthorizedToEditCards ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Редактирование доступно (
                  {isAdmin ? 'Администратор' : isOrganizer ? 'Организатор' : 'Капитан'})
                </span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-[11px]"
                title="Редактирование карточки доступно администратору, организатору или капитану команды"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Режим просмотра (Редактирование: Админ, Орг, Капитан)</span>
              </div>
            )}
          </div>
        </div>

        {/* Pager / Pagination Bar for Grid Mode */}
        {deckMode === 'grid_paged' && filteredTeams.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="text-slate-400 font-mono text-[11px]">
              Страница <strong className="text-white">{currentPage}</strong> из{' '}
              <strong className="text-white">{totalPages}</strong> • Всего бортов:{' '}
              <span className="text-cyan-400 font-bold">{filteredTeams.length}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => {
                        audioService.playClickSound();
                        setCurrentPage(pNum);
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        currentPage === pNum
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                          : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Вперед</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CAROUSEL / SINGLE CARD TERMINAL MODE */}
      {deckMode === 'carousel' && (
        <div className="space-y-4">
          {filteredTeams.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-mono bg-slate-900/60 rounded-3xl border border-slate-800">
              Команд по выбранному запросу не найдено
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-900/90 border border-indigo-500/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              {/* Glow background */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Carousel Header & Stepper */}
              <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-indigo-950 border border-indigo-500/50 font-mono font-bold text-cyan-300 text-sm">
                    {activeCarouselTeam.shipCallsign || `Борт-0${activeCarouselTeam.orderNumber}`}
                  </span>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                      «{activeCarouselTeam.shipName}»
                    </h2>
                    <span className="text-xs text-slate-400 font-mono">
                      Карточка #{carouselIndex + 1} из {filteredTeams.length}
                    </span>
                  </div>
                </div>

                {/* Flip controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevCarousel}
                    className="p-2.5 rounded-2xl bg-slate-800 hover:bg-indigo-600 text-white shadow transition-all cursor-pointer"
                    title="Предыдущая карточка"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextCarousel}
                    className="p-2.5 rounded-2xl bg-slate-800 hover:bg-indigo-600 text-white shadow transition-all cursor-pointer"
                    title="Следующая карточка"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left Column: Organization & Captain */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <School className="w-3.5 h-3.5" /> Образовательное учреждение
                    </span>
                    <div className="text-sm font-bold text-white">{activeCarouselTeam.school}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      Город: {activeCarouselTeam.city}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
                        Формат: {activeCarouselTeam.cubesatFormat}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                        Квота выделена
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Капитан корабля (Наставник)
                    </span>
                    <div className="text-sm font-bold text-white">
                      {activeCarouselTeam.mentorName}
                    </div>
                    <div className="text-xs text-cyan-300 font-mono flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {activeCarouselTeam.mentorEmail}
                    </div>
                    {activeCarouselTeam.mentorPhone && (
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {activeCarouselTeam.mentorPhone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Case Task & Crew */}
                <div className="space-y-4">
                  {/* Case Task Field (Clickable trigger) */}
                  <div
                    onClick={() => {
                      audioService.playClickSound();
                      onOpenTaskDirectory(activeCarouselTeam);
                    }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-950 border border-indigo-500/40 hover:border-cyan-400 transition-all cursor-pointer group shadow-lg"
                    title="Нажмите, чтобы открыть справочник заданий и изменить кейс"
                  >
                    <div className="flex items-center justify-between pb-1.5">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> Закрепленное кейс-задание
                      </span>
                      <span className="text-[10px] text-cyan-400 font-semibold group-hover:underline flex items-center gap-1">
                        Изменить в справочнике →
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                      {activeCarouselTeam.selectedTaskTitle || (
                        <span className="text-amber-400 italic">⚠️ Задание ещё не выбрано</span>
                      )}
                    </div>
                    {activeCarouselTeam.selectedTaskId && (
                      <div className="text-[11px] font-mono text-indigo-300 mt-1">
                        Код кейса: {activeCarouselTeam.selectedTaskId}
                      </div>
                    )}
                  </div>

                  {/* Crew members */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Исследовательский экипаж
                      </span>
                      <span className="text-slate-400">
                        {activeCarouselTeam.students.length} школьника
                      </span>
                    </span>

                    <div className="space-y-1.5 pt-1">
                      {activeCarouselTeam.students.map((st, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{st.name}</span>
                            <span className="text-[10px] text-indigo-400 font-mono">
                              {st.gradeText} • {st.roleTitle || st.assignedRole}
                            </span>
                          </div>
                          <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Согласие
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {canEditTeamCard(currentUser, activeCarouselTeam) ? (
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        onEditTeam(activeCarouselTeam);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Редактировать карточку</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-500 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed select-none"
                      title="Редактирование доступно администратору, организатору или капитану команды"
                    >
                      <Lock className="w-4 h-4 text-slate-500" />
                      <span>Только просмотр</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      audioService.playClickSound();
                      onOpenTaskDirectory(activeCarouselTeam);
                    }}
                    disabled={!canEditTeamCard(currentUser, activeCarouselTeam)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 ${
                      canEditTeamCard(currentUser, activeCarouselTeam)
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                        : 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Справочник заданий</span>
                  </button>
                </div>

                {canDeleteTeams && (
                  <button
                    onClick={() => {
                      if (confirm(`Удалить борт «${activeCarouselTeam.shipName}» из реестра?`)) {
                        onDeleteTeam(activeCarouselTeam.id);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить борт</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRID PAGED CARDS MODE */}
      {deckMode === 'grid_paged' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTeams.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 font-mono bg-slate-900/60 rounded-3xl border border-slate-800">
              Команд по выбранному запросу не найдено
            </div>
          ) : (
            paginatedTeams.map((team) => {
              const isSelected = selectedTeamId === team.id;
              const hasTask = !!team.selectedTaskId;

              return (
                <div
                  key={team.id}
                  className={`rounded-3xl border transition-all flex flex-col justify-between p-5 shadow-xl relative overflow-hidden group ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/80 ring-2 ring-amber-500/30'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Card Top: Callsign + Ship Name + Format */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-950 border border-indigo-500/40 font-mono font-bold text-cyan-300 text-xs">
                            {team.shipCallsign || `Борт-0${team.orderNumber}`}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-[11px] text-cyan-400 font-bold">
                            {team.cubesatFormat || '3U'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
                          «{team.shipName}»
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{team.school}</p>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold shrink-0">
                        Квота
                      </span>
                    </div>

                    {/* Mentor Info */}
                    <div className="text-xs space-y-1">
                      <div className="text-slate-300 font-medium flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{team.mentorName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono pl-5 truncate">
                        {team.mentorEmail}
                      </div>
                    </div>

                    {/* Case Task Clickable Field (Interactive trigger) */}
                    <div
                      onClick={() => {
                        audioService.playClickSound();
                        onOpenTaskDirectory(team);
                      }}
                      className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex flex-col gap-1 ${
                        hasTask
                          ? 'bg-slate-950 border-indigo-500/30 hover:border-cyan-400 hover:bg-slate-900'
                          : 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400 text-amber-300'
                      }`}
                      title="Кликните, чтобы открыть справочник заданий и закрепить задачу за бортом"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Кейс-задание:
                        </span>
                        <span className="text-cyan-400 underline">Справочник 🔍</span>
                      </div>
                      <div className="font-medium text-white text-xs line-clamp-2 leading-snug">
                        {team.selectedTaskTitle || '⚠️ Нажмите для выбора кейса…'}
                      </div>
                    </div>

                    {/* Students list */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Экипаж ({team.students.length} чел.):</span>
                        <span className="text-slate-500">г. {team.city}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {team.students.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono"
                          >
                            {s.name.split(' ')[0]} ({s.discipline ? s.discipline[0] : 'Ф'})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    {canEditTeamCard(currentUser, team) ? (
                      <button
                        onClick={() => {
                          audioService.playClickSound();
                          onEditTeam(team);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Редактировать</span>
                      </button>
                    ) : (
                      <div
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-500 text-xs flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
                        title="Редактирование карточки доступно только Администратору, Организатору или Капитану команды"
                      >
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>Только просмотр</span>
                      </div>
                    )}

                    {canDeleteTeams && (
                      <button
                        onClick={() => {
                          if (confirm(`Удалить борт «${team.shipName}» из реестра?`)) {
                            onDeleteTeam(team.id);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Удалить команду"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Bottom Paging bar for Grid Mode */}
      {deckMode === 'grid_paged' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Назад
          </button>
          <span className="text-xs font-mono text-slate-400 px-3">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
          >
            Вперед <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
