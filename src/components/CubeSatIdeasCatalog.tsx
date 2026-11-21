import React, { useState, useMemo, useEffect } from 'react';
import {
  CUBESAT_IDEAS_CATALOG,
  CUBESAT_1000_IDEAS,
  CREW_ROLES,
  MISSION_CATEGORIES,
  type CubeSatMissionIdea,
  type CrewRole,
} from '../data/cubesatMissionIdeas';
import { TeamMember } from '../types';
import {
  Search,
  Filter,
  Users,
  CheckCircle2,
  Sparkles,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Orbit,
  Cpu,
  Star,
  Tag,
  PlusCircle,
  Printer,
  Download,
  FileDown,
} from 'lucide-react';
import { AddCustomIdeaModal } from './AddCustomIdeaModal';
import { PrintableCardsModal } from './PrintableCardsModal';

interface CubeSatIdeasCatalogProps {
  selectedIdeaId?: string;
  onSelectIdea: (idea: CubeSatMissionIdea) => void;
  currentTrackId?: string;
  teamMembers?: TeamMember[];
}

const PAGE_SIZE = 12;

export const ALL_CATALOG_ROLES = [
  'Инженер',
  'Биолог',
  'Навигатор',
  'Астрофизик',
  'Военный',
  'Историк',
  'Архивариус',
  'Переводчик',
  'Картограф',
  'Журналист',
  'Программист',
  'Радиоинженер',
  'Исследователь',
  'Химик',
  'Эколог',
  'Метеоролог',
  'Аналитик',
] as const;

export const ROLE_ICONS: Record<string, string> = {
  Инженер: '🛠️',
  Биолог: '🧬',
  Навигатор: '🧭',
  Астрофизик: '🔭',
  Военный: '🛡️',
  Историк: '🏛️',
  Архивариус: '📜',
  Переводчик: '🌐',
  Картограф: '🗺️',
  Журналист: '📰',
  Программист: '💻',
  Радиоинженер: '📡',
  Исследователь: '🔬',
  Химик: '🧪',
  Эколог: '🌿',
  Метеоролог: '☁️',
  Аналитик: '📊',
};

/**
 * Цветовой стиль для плашки категории миссии CubeSat
 */
export function getCategoryBadgeStyle(category: string): string {
  const lower = (category || '').toLowerCase();
  if (lower.includes('биолог') || lower.includes('медицин')) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  }
  if (lower.includes('дистанционн') || lower.includes('дзз')) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }
  if (lower.includes('астрофизик') || lower.includes('космофизик')) {
    return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
  }
  if (lower.includes('связь') || lower.includes('iot') || lower.includes('телеком')) {
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  }
  if (lower.includes('технолог') || lower.includes('эксперимент')) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }
  if (lower.includes('эколог') || lower.includes('климат')) {
    return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
  }
  if (lower.includes('военн') || lower.includes('безопасн')) {
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  }
  if (lower.includes('гуманитарн') || lower.includes('историч')) {
    return 'bg-pink-500/20 text-pink-300 border-pink-500/40';
  }
  if (lower.includes('археолог') || lower.includes('картограф')) {
    return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
  }
  if (lower.includes('метеоролог') || lower.includes('атмосфер')) {
    return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
  }
  if (lower.includes('радиофизик') || lower.includes('навигац')) {
    return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
  }
  return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
}

/**
 * Преобразует роль члена экипажа (из формы состава команды) в тег роли миссий CubeSat
 * Поддерживает роли: Историк, Архивариус, Переводчик, Картограф, Журналист, Астрофизик, Военный и др.
 */
export function mapMemberRoleToIdeaTag(role: string): string {
  const r = (role || '').trim();
  if (!r) return '';
  const lower = r.toLowerCase();

  if (lower.includes('астрофизик') || lower.includes('астроном')) return 'Астрофизик';
  if (lower.includes('военный') || lower.includes('оборон') || lower.includes('безопасност'))
    return 'Военный';
  if (lower.includes('картограф') || lower.includes('геодез') || lower.includes('топограф'))
    return 'Картограф';
  if (lower.includes('историк') || lower.includes('археолог')) return 'Историк';
  if (lower.includes('архивариус') || lower.includes('архив')) return 'Архивариус';
  if (lower.includes('переводчик') || lower.includes('лингвист') || lower.includes('филолог'))
    return 'Переводчик';
  if (lower.includes('журналист') || lower.includes('медиа') || lower.includes('корреспондент'))
    return 'Журналист';
  if (lower.includes('биолог')) return 'Биолог';
  if (lower.includes('навигатор') || lower.includes('баллистик')) return 'Навигатор';
  if (lower.includes('исследовател')) return 'Исследователь';
  if (lower.includes('программист') || lower.includes('бортового по')) return 'Программист';
  if (lower.includes('радиоинженер') || lower.includes('радиоканал')) return 'Радиоинженер';
  if (lower.includes('метеоролог') || lower.includes('атмосфер')) return 'Метеоролог';
  if (lower.includes('химик')) return 'Химик';
  if (lower.includes('эколог')) return 'Эколог';
  if (lower.includes('аналитик')) return 'Аналитик';
  if (
    lower.includes('инженер') ||
    lower.includes('конструктор') ||
    lower.includes('разработчик пн')
  )
    return 'Инженер';
  return r;
}

export const CubeSatIdeasCatalog: React.FC<CubeSatIdeasCatalogProps> = ({
  selectedIdeaId,
  onSelectIdea,
  currentTrackId,
  teamMembers = [],
}) => {
  const LOCAL_STORAGE_CUSTOM_IDEAS_KEY = 'cosmoport_custom_cubesat_ideas';

  const [customIdeas, setCustomIdeas] = useState<CubeSatMissionIdea[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_IDEAS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const [filterByCrew, setFilterByCrew] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Все категории');
  const [selectedScope, setSelectedScope] = useState<string>('Все сферы');
  const [selectedRoleTag, setSelectedRoleTag] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Объединяем банк идей: авторские идеи команды (сверху) + 340 идей кейс-чемпионата
  const allCatalogIdeas = useMemo(() => {
    return [...customIdeas, ...CUBESAT_IDEAS_CATALOG];
  }, [customIdeas]);

  const nextCustomNumber = useMemo(() => {
    const maxNum = Math.max(
      CUBESAT_IDEAS_CATALOG.length,
      ...allCatalogIdeas.map((i) => i.number || 0),
    );
    return maxNum + 1;
  }, [allCatalogIdeas]);

  const handleAddCustomIdea = (newIdea: CubeSatMissionIdea) => {
    const updated = [newIdea, ...customIdeas];
    setCustomIdeas(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_IDEAS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save custom idea to localStorage', e);
    }
    onSelectIdea(newIdea);
  };

  // Список активных ролей экипажа, определенных в блоке «Состав команды»
  const activeCrewRoles = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0) return [];
    const rolesSet = new Set<string>();
    teamMembers.forEach((member) => {
      const tag = mapMemberRoleToIdeaTag(member.role);
      if (tag && tag !== 'Капитан') {
        rolesSet.add(tag);
      }
    });
    return Array.from(rolesSet);
  }, [teamMembers]);

  // Фильтрация каталога идей
  const filteredIdeas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allCatalogIdeas.filter((idea) => {
      // 1. Поиск по строке (название, описание, прибор, ID, роли, категория)
      if (query) {
        const matchesQuery =
          idea.title.toLowerCase().includes(query) ||
          idea.description.toLowerCase().includes(query) ||
          idea.payload.toLowerCase().includes(query) ||
          idea.category.toLowerCase().includes(query) ||
          idea.creativityHighlight.toLowerCase().includes(query) ||
          idea.roles.some((r) => r.toLowerCase().includes(query)) ||
          idea.id.toLowerCase().includes(query) ||
          String(idea.number).includes(query);
        if (!matchesQuery) return false;
      }

      // 2. Фильтр по категории
      if (selectedCategory !== 'Все категории' && idea.category !== selectedCategory) {
        return false;
      }

      // 3. Фильтр по сфере назначения
      if (selectedScope !== 'Все сферы' && idea.scope !== selectedScope) {
        return false;
      }

      // 4. Фильтрация в зависимости от уже выбранных ролей для участников команды
      if (filterByCrew && activeCrewRoles.length > 0) {
        const matchesCrewRole = activeCrewRoles.some((role) => idea.roles.includes(role));
        if (!matchesCrewRole) return false;
      }

      // 5. Визуальный фильтр по выбранному тегу роли участника
      if (selectedRoleTag !== 'all') {
        if (!idea.roles.includes(selectedRoleTag)) {
          return false;
        }
      }

      return true;
    });
  }, [
    allCatalogIdeas,
    searchQuery,
    selectedCategory,
    selectedScope,
    selectedRoleTag,
    filterByCrew,
    activeCrewRoles,
  ]);

  // Сброс страницы при смене фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedScope,
    selectedRoleTag,
    filterByCrew,
    activeCrewRoles,
  ]);

  // Пагинация
  const totalPages = Math.max(1, Math.ceil(filteredIdeas.length / PAGE_SIZE));
  const paginatedIdeas = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredIdeas.slice(start, start + PAGE_SIZE);
  }, [filteredIdeas, currentPage]);

  // Случайный выбор карточки для вдохновения
  const handlePickRandom = () => {
    if (filteredIdeas.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredIdeas.length);
    const randomIdea = filteredIdeas[randomIndex];
    onSelectIdea(randomIdea);
  };

  const selectedIdea = useMemo(() => {
    return allCatalogIdeas.find((i) => i.id === selectedIdeaId);
  }, [allCatalogIdeas, selectedIdeaId]);

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Блок компетенций экипажа (автоматически из блока 2 «Состав команды») */}
      <div className="rounded-xl border border-cyan-900/60 bg-gradient-to-r from-slate-900/90 via-slate-950 to-indigo-950/40 p-3.5 sm:p-4 space-y-2.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">
                Компетенции экипажа корабля
              </h4>
            </div>
          </div>

          {activeCrewRoles.length > 0 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterByCrew(!filterByCrew)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterByCrew
                    ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/80 shadow-xs ring-1 ring-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>
                  {filterByCrew
                    ? 'Фильтр по экипажу активен'
                    : `Показать все ${CUBESAT_IDEAS_CATALOG.length} идей`}
                </span>
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-amber-300/80 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              Назначьте роли в блоке 2 «Состав команды» для автоподбора идей
            </div>
          )}
        </div>

        {activeCrewRoles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">Роли вашей команды:</span>
            {activeCrewRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 rounded-md bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-200 border border-cyan-500/40"
              >
                <span>{ROLE_ICONS[role] || '👤'}</span>
                <span>{role}</span>
              </span>
            ))}
            <span className="text-[11px] text-cyan-400/90 ml-auto font-medium">
              {filterByCrew
                ? `Подобрано под роли команды: ${filteredIdeas.length} из ${CUBESAT_IDEAS_CATALOG.length}`
                : `Все идеи каталога: ${filteredIdeas.length} из ${CUBESAT_IDEAS_CATALOG.length}`}
            </span>
          </div>
        )}
      </div>

      {/* 2. Панель поиска, категорий, создания своей идеи и печати карточек */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2.5">
        {/* Кнопки действий: Внести свою идею и Печать карточек с полями реза */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddCustomModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer transition-all transform active:scale-95"
              title="Внести авторскую идею вашей команды в банк решений CubeSat"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Внести свою идею</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm border border-indigo-400/30 cursor-pointer transition-colors"
              title="Настроить и скачать карточки с полями реза для выдачи командам на бумаге"
            >
              <Printer className="h-4 w-4" />
              <span>Карточки для печати (с полями реза)</span>
            </button>

            <a
              href="/api/export/cards-pdf?layout=9perPage"
              download="cubesat_cards_340pcs_min_sheets.pdf"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm border border-emerald-400/30 cursor-pointer transition-colors"
              title="Быстро скачать PDF со всеми 340 карточками (минимальный расход бумаги: 9 на лист А4, 38 стр.)"
            >
              <FileDown className="h-4 w-4" />
              <span>Скачать PDF (мин. листов: 9/лист)</span>
            </a>
          </div>

          {customIdeas.length > 0 && (
            <div className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Своих идей команды в банке: {customIdeas.length}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          {/* Поле поиска */}
          <div className="md:col-span-5 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск идей (прибор, роль, цель)..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Фильтр категории */}
          <div className="md:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              {MISSION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Фильтр сферы (гражданское/военное/научное/двойное) */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="Все сферы">Все сферы</option>
              <option value="Гражданское">Гражданское</option>
              <option value="Научное">Научное</option>
              <option value="Военное">Военное</option>
              <option value="Двойное">Двойное назначение</option>
              <option value="Экологическое">Экологическое</option>
              <option value="Образовательное">Образовательное</option>
            </select>

            <button
              type="button"
              onClick={handlePickRandom}
              title="Случайная идея для вдохновения"
              className="p-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors shrink-0 cursor-pointer"
            >
              <Shuffle className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Индикатор результатов и выбранной идеи */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-2 text-slate-400">
            <span>
              Отобрано: <strong className="text-white">{filteredIdeas.length}</strong> из{' '}
              {CUBESAT_IDEAS_CATALOG.length} миссий
            </span>
            {filterByCrew && activeCrewRoles.length > 0 && (
              <span className="text-emerald-400 font-mono">
                [Роли команды: {activeCrewRoles.join(', ')}]
              </span>
            )}
            {selectedRoleTag !== 'all' && (
              <span className="text-cyan-400 font-mono">[Тег: {selectedRoleTag}]</span>
            )}
          </div>

          {selectedIdea && (
            <div className="flex items-center gap-1.5 text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-medium truncate max-w-xs sm:max-w-md">
                Выбрана миссия: #{selectedIdea.number} {selectedIdea.title}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Визуальный фильтр по тегам ролей участников в блоке с карточками */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            <span>Фильтр по ролям участников миссии:</span>
            {selectedRoleTag !== 'all' && (
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-md border border-cyan-500/30 flex items-center gap-1">
                <span>{ROLE_ICONS[selectedRoleTag] || '👤'}</span>
                <span>{selectedRoleTag}</span>
              </span>
            )}
          </div>
          {selectedRoleTag !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedRoleTag('all')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Показать все роли</span>
              <span className="font-mono text-xs">✕</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedRoleTag('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRoleTag === 'all'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <span>Все роли</span>
          </button>
          {ALL_CATALOG_ROLES.map((role) => {
            const isSelected = selectedRoleTag === role;
            const isInCrew = activeCrewRoles.includes(role as CrewRole);
            const icon = ROLE_ICONS[role] || '👤';

            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRoleTag(isSelected ? 'all' : role)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-300 shadow-sm shadow-cyan-500/25 ring-1 ring-cyan-400'
                    : isInCrew
                      ? 'bg-slate-950 text-emerald-300 border-emerald-500/50 hover:border-emerald-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{icon}</span>
                <span>{role}</span>
                {isInCrew && !isSelected && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    title="Роль назначена в составе экипажа команды"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Список карточек идей CubeSat */}
      {paginatedIdeas.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
          <Sparkles className="h-8 w-8 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-medium">По заданным фильтрам идей не найдено</p>
          <p className="text-slate-500 text-[11px]">
            Попробуйте выбрать другую роль, категорию или сферу назначения.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Все категории');
              setSelectedScope('Все сферы');
              setSelectedRoleTag('all');
              setFilterByCrew(false);
            }}
            className="mt-2 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors text-xs cursor-pointer"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginatedIdeas.map((idea) => {
            const isSelected = selectedIdeaId === idea.id;
            const matchedRoles = idea.roles.filter((r) => activeCrewRoles.includes(r as CrewRole));

            return (
              <div
                key={idea.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectIdea(idea)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onSelectIdea(idea);
                  }
                }}
                className={`relative flex flex-col justify-between rounded-xl p-3.5 cursor-pointer border text-left transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-gradient-to-b from-cyan-950/50 via-slate-900 to-indigo-950/40 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/60'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  {/* Верхняя плашка карточки с категорией (без сокращений) и рейтингом */}
                  <div className="flex items-start justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">
                        #{String(idea.number).padStart(4, '0')}
                      </span>
                      {/* Значение поля Категория в полном виде (не сокращается) */}
                      <span
                        className={`rounded px-2 py-0.5 text-[9.5px] font-semibold border leading-tight ${getCategoryBadgeStyle(
                          idea.category,
                        )}`}
                        title={`Категория: ${idea.category}`}
                      >
                        {idea.category}
                      </span>
                      {idea.isCustom && (
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-bold border bg-emerald-500/25 text-emerald-300 border-emerald-400 shadow-xs shrink-0">
                          ✨ Идея команды
                        </span>
                      )}
                    </div>

                    {/* Визуальные иконки звезд рейтинга: меньше по размеру и сдвинуты повыше, чтобы идеально влазить в карточку */}
                    <div
                      className="flex items-center gap-[2px] bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800 shrink-0 self-start -mt-0.5 shadow-xs"
                      title={`Рейтинг: ${idea.rating} из 5 звезд`}
                      aria-label={`Рейтинг: ${idea.rating} из 5 звезд`}
                    >
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-2.5 w-2.5 ${
                            i < idea.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Заголовок */}
                  <h4 className="font-bold text-white text-xs leading-snug line-clamp-2">
                    {idea.title}
                  </h4>

                  {/* Выделенный блок инновационности (без слова Новизна) */}
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 text-[10px] text-amber-200">
                    <Sparkles className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <span className="text-amber-100 font-medium">{idea.creativityHighlight}</span>
                    </div>
                  </div>

                  {/* Описание миссии (без сокращений, полное и понятное) */}
                  <p className="mt-2 text-[11px] text-slate-300 leading-relaxed font-normal">
                    {idea.description}
                  </p>

                  {/* Характеристики полезной нагрузки и орбиты (без сокращений) */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1 text-[10px] font-mono">
                    <div className="flex items-start gap-1.5 text-cyan-300">
                      <Cpu className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="break-words leading-tight">{idea.payload}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Orbit className="h-3 w-3 text-indigo-400 shrink-0" />
                      <span className="break-words leading-tight">{idea.orbit}</span>
                    </div>
                  </div>
                </div>

                {/* Теги ролей участников миссии CubeSat */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-medium text-slate-300">
                      <Users className="h-3 w-3 text-cyan-400" />
                      Роли участников:
                    </span>
                    {matchedRoles.length > 0 && (
                      <span className="text-emerald-400 font-mono text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {matchedRoles.length} в экипаже ✓
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {idea.roles.map((role) => {
                      const isInCrew = activeCrewRoles.includes(role as CrewRole);
                      const isFilterActive = selectedRoleTag === role;
                      const icon = ROLE_ICONS[role] || '👤';

                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoleTag(selectedRoleTag === role ? 'all' : role);
                          }}
                          title={`Фильтровать по роли: ${role}`}
                          className={`rounded-md px-2 py-0.5 text-[10px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                            isFilterActive
                              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-300 shadow-xs ring-1 ring-cyan-400'
                              : isInCrew
                                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 hover:border-emerald-300 font-semibold'
                                : 'bg-slate-800/90 text-slate-300 border-slate-700/60 hover:border-slate-500 hover:text-white'
                          }`}
                        >
                          <span>{icon}</span>
                          <span>{role}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Пагинация */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            Страница <strong className="text-white">{currentPage}</strong> из{' '}
            <strong className="text-white">{totalPages}</strong> (показано {paginatedIdeas.length}{' '}
            из {filteredIdeas.length})
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3 w-3" />
              <span>Назад</span>
            </button>

            {/* Быстрые кнопки страниц */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = Math.min(totalPages - 4 + i, currentPage - 2 + i);
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <span>Вперед</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно внесения авторской идеи команды */}
      <AddCustomIdeaModal
        isOpen={isAddCustomModalOpen}
        onClose={() => setIsAddCustomModalOpen(false)}
        onAddIdea={handleAddCustomIdea}
        nextNumber={nextCustomNumber}
      />

      {/* Модальное окно скачивания/печати подробных карточек с полями реза */}
      <PrintableCardsModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        filteredIdeas={filteredIdeas}
        allIdeas={allCatalogIdeas}
        selectedIdea={selectedIdea}
      />
    </div>
  );
};
