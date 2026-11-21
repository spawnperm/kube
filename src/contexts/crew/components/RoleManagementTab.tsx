import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Check,
  RotateCcw,
  Search,
  Users,
  Settings,
  Edit3,
  Download,
  Upload,
  Radio,
  FileCheck,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { UserRole, UserRoleDefinition, RolePermissionItem } from '@/src/shared/types';
import {
  roleService,
  ROLE_PERMISSIONS_CATALOG,
  DEFAULT_ROLE_DEFINITIONS,
} from '@/src/shared/lib/roleService';
import { audioService } from '@/src/shared/lib/audioService';

interface RoleManagementTabProps {
  currentUserRole?: UserRole;
  onRoleChanged?: () => void;
}

export const RoleManagementTab: React.FC<RoleManagementTabProps> = ({
  currentUserRole = 'admin',
  onRoleChanged,
}) => {
  // Loaded roles dictionary
  const [roles, setRoles] = useState<Record<UserRole, UserRoleDefinition>>(() =>
    roleService.getRoles(),
  );

  // Selected role for editing
  const [selectedRoleKey, setSelectedRoleKey] = useState<UserRole>('mentor');

  // Working draft for current role to allow canceling/saving
  const [draftRole, setDraftRole] = useState<UserRoleDefinition>(() => roles[selectedRoleKey]);

  // Filters & Search for permissions
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'screens' | 'teams' | 'judging' | 'comms' | 'system'
  >('all');

  // Save notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync draft when selected role changes
  useEffect(() => {
    setDraftRole(roles[selectedRoleKey]);
  }, [selectedRoleKey, roles]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle permission
  const handleTogglePermission = (permId: string) => {
    setDraftRole((prev) => {
      const exists = prev.permissions.includes(permId);
      const nextPermissions = exists
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId];
      return {
        ...prev,
        permissions: nextPermissions,
      };
    });
  };

  // Select all permissions in current view / all
  const handleSelectAllPermissions = () => {
    const allIds = ROLE_PERMISSIONS_CATALOG.map((p) => p.id);
    setDraftRole((prev) => ({
      ...prev,
      permissions: Array.from(new Set([...prev.permissions, ...allIds])),
    }));
    audioService.playClickSound();
  };

  // Clear all permissions
  const handleClearAllPermissions = () => {
    if (selectedRoleKey === 'admin') {
      if (
        !confirm(
          'Вы уверены, что хотите снять права с роли Администратора? Это может ограничить доступ.',
        )
      ) {
        return;
      }
    }
    setDraftRole((prev) => ({
      ...prev,
      permissions: [],
    }));
    audioService.playClickSound();
  };

  // Reset current role to default definition
  const handleResetCurrentRoleToDefault = () => {
    const defaultDef = DEFAULT_ROLE_DEFINITIONS[selectedRoleKey];
    setDraftRole({ ...defaultDef });
    audioService.playClickSound();
    showToast(`Параметры роли «${defaultDef.name}» сброшены к стандарту`);
  };

  // Reset ALL roles
  const handleResetAllToDefaults = () => {
    if (
      confirm('Сбросить ВСЕ роли, их названия и матрицу прав к исходным стандартам чемпионата?')
    ) {
      const res = roleService.resetToDefaults();
      setRoles(res);
      setDraftRole(res[selectedRoleKey]);
      audioService.playSuccessChime();
      showToast('Все роли успешно сброшены к эталонным настройкам!');
      if (onRoleChanged) onRoleChanged();
    }
  };

  // Save changes to current role
  const handleSaveRoleChanges = () => {
    if (!draftRole.name.trim()) {
      alert('Название роли не может быть пустым!');
      return;
    }

    const updatedRoles = {
      ...roles,
      [selectedRoleKey]: {
        ...draftRole,
        name: draftRole.name.trim(),
        badgeTitle: draftRole.badgeTitle.trim() || draftRole.name.trim(),
        updatedAt: new Date().toISOString(),
      },
    };

    roleService.saveRoles(updatedRoles);
    setRoles(updatedRoles);
    audioService.playSuccessChime();
    showToast(`Роль «${draftRole.name}» успешно обновлена!`);
    if (onRoleChanged) onRoleChanged();
  };

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return ROLE_PERMISSIONS_CATALOG.filter((perm) => {
      const matchesCat = activeCategory === 'all' || perm.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        perm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        perm.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Color theme helpers
  const getColorClasses = (scheme: string, isSelected: boolean) => {
    switch (scheme) {
      case 'rose':
        return isSelected
          ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/40'
          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-rose-500/40';
      case 'amber':
        return isSelected
          ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/40'
          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-amber-500/40';
      case 'purple':
        return isSelected
          ? 'bg-purple-500/20 border-purple-500 text-purple-300 ring-2 ring-purple-500/40'
          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-purple-500/40';
      case 'indigo':
        return isSelected
          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/40'
          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-indigo-500/40';
      case 'cyan':
        return isSelected
          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/40'
          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-cyan-500/40';
      default:
        return isSelected
          ? 'bg-slate-800 border-slate-400 text-white ring-2 ring-slate-400/40'
          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700';
    }
  };

  const getBadgeBg = (scheme: string) => {
    switch (scheme) {
      case 'rose':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'purple':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'indigo':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'cyan':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const isDirty = useMemo(() => {
    const original = roles[selectedRoleKey];
    if (!original) return false;
    if (original.name !== draftRole.name) return true;
    if (original.badgeTitle !== draftRole.badgeTitle) return true;
    if (original.description !== draftRole.description) return true;
    if (original.colorScheme !== draftRole.colorScheme) return true;
    if (original.icon !== draftRole.icon) return true;
    if (original.permissions.length !== draftRole.permissions.length) return true;
    const s1 = new Set(original.permissions);
    for (const p of draftRole.permissions) {
      if (!s1.has(p)) return true;
    }
    return false;
  }, [roles, selectedRoleKey, draftRole]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-500/90 text-white font-bold text-xs shadow-2xl flex items-center gap-2 backdrop-blur-md border border-emerald-400/50 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HEADER & RBAC STATS */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>МОДУЛЬ АДМИНИСТРАТИВНОГО ДОСТУПА (RBAC)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Управление ролями и матрицей прав доступа</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Администратор может настраивать отображаемые названия ролей для портала чемпионата,
              короткие бейджи, описания обязанностей и персональный набор разрешений для каждой
              категории пользователей.
            </p>
          </div>

          {/* Global Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAllToDefaults}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Сбросить все роли и права к заводским настройкам"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Сбросить всё к стандарту</span>
            </button>
          </div>
        </div>

        {/* 2. ROLES SELECTOR CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          {(Object.keys(DEFAULT_ROLE_DEFINITIONS) as UserRole[]).map((rKey) => {
            const rDef = roles[rKey] || DEFAULT_ROLE_DEFINITIONS[rKey];
            const isSelected = selectedRoleKey === rKey;
            const activePermsCount = isSelected
              ? draftRole.permissions.length
              : rDef.permissions.length;

            return (
              <button
                key={rKey}
                onClick={() => {
                  setSelectedRoleKey(rKey);
                  audioService.playClickSound();
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${getColorClasses(
                  rDef.colorScheme,
                  isSelected,
                )}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">{rDef.icon}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase border ${getBadgeBg(
                        rDef.colorScheme,
                      )}`}
                    >
                      {rDef.badgeTitle}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight line-clamp-2">
                    {rDef.name}
                  </h4>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono">
                    {activePermsCount} / {ROLE_PERMISSIONS_CATALOG.length} прав
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE ROLE EDITOR & PERMISSIONS MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Role Details & Live Name Editor (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-400" />
                <span>Параметры и название роли</span>
              </h3>

              {isDirty && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
                  Есть несохраненные правки
                </span>
              )}
            </div>

            {/* Editable Role Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Название роли на портале (редактируемое):
              </label>
              <input
                type="text"
                value={draftRole.name}
                onChange={(e) => setDraftRole({ ...draftRole, name: e.target.value })}
                placeholder="Введите название роли..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
              <span className="text-[10px] text-slate-500 block">
                Системный идентификатор роли: <code className="text-slate-400">{draftRole.id}</code>
              </span>
            </div>

            {/* Editable Badge Label */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Короткий бейдж (для шапок карточек и списков):
              </label>
              <input
                type="text"
                value={draftRole.badgeTitle}
                onChange={(e) => setDraftRole({ ...draftRole, badgeTitle: e.target.value })}
                placeholder="Например: Капитан, Жюри, Эксперт..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-bold text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Editable Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Описание обязанностей и полномочий:
              </label>
              <textarea
                rows={3}
                value={draftRole.description}
                onChange={(e) => setDraftRole({ ...draftRole, description: e.target.value })}
                placeholder="Краткое описание функций роли на чемпионате..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Emoji Icon & Color Scheme */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  Иконка / Эмодзи роли:
                </label>
                <div className="flex flex-wrap gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  {['🛡️', '🛰️', '⚖️', '👨‍✈️', '🚀', '🌐', '🔧', '🔬', '📡', '🎯'].map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setDraftRole({ ...draftRole, icon: ico })}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform hover:scale-110 ${
                        draftRole.icon === ico ? 'bg-indigo-600 shadow-sm' : 'hover:bg-slate-900'
                      }`}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  Цветовая схема:
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-[10px]">
                  {(['rose', 'amber', 'purple', 'indigo', 'cyan', 'slate'] as const).map(
                    (colorKey) => (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => setDraftRole({ ...draftRole, colorScheme: colorKey })}
                        className={`py-1 rounded-md font-bold uppercase transition-all ${
                          draftRole.colorScheme === colorKey
                            ? getBadgeBg(colorKey) + ' font-extrabold ring-1 ring-white/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {colorKey}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">
                Превью бейджа и карточки:
              </span>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-2xl">{draftRole.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {draftRole.name || 'Название роли'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getBadgeBg(
                        draftRole.colorScheme,
                      )}`}
                    >
                      {draftRole.badgeTitle || 'Бейдж'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {draftRole.description || 'Описание отсутствует'}
                  </p>
                </div>
              </div>
            </div>

            {/* Save & Reset Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleSaveRoleChanges}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Сохранить параметры роли</span>
              </button>

              <button
                onClick={handleResetCurrentRoleToDefault}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                title="Сбросить данную роль к стандарту"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Permissions Checklist Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Матрица прав доступа для: «{draftRole.name}»</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Активно прав:{' '}
                  <strong className="text-cyan-300">{draftRole.permissions.length}</strong> из{' '}
                  {ROLE_PERMISSIONS_CATALOG.length}
                </span>
              </div>

              {/* Batch Toggle Actions */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={handleSelectAllPermissions}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-all cursor-pointer"
                >
                  Выбрать все
                </button>
                <button
                  onClick={handleClearAllPermissions}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
                >
                  Снять все
                </button>
              </div>
            </div>

            {/* Filter Categories Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'Все права', count: ROLE_PERMISSIONS_CATALOG.length },
                {
                  id: 'screens',
                  label: '🖥️ Экраны',
                  count: ROLE_PERMISSIONS_CATALOG.filter((p) => p.category === 'screens').length,
                },
                {
                  id: 'teams',
                  label: '🚀 Команды',
                  count: ROLE_PERMISSIONS_CATALOG.filter((p) => p.category === 'teams').length,
                },
                {
                  id: 'judging',
                  label: '⚖️ Жюри',
                  count: ROLE_PERMISSIONS_CATALOG.filter((p) => p.category === 'judging').length,
                },
                {
                  id: 'comms',
                  label: '📢 Связь/Файлы',
                  count: ROLE_PERMISSIONS_CATALOG.filter((p) => p.category === 'comms').length,
                },
                {
                  id: 'system',
                  label: '⚙️ Система',
                  count: ROLE_PERMISSIONS_CATALOG.filter((p) => p.category === 'system').length,
                },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{cat.label}</span>{' '}
                  <span className="text-[10px] opacity-70">({cat.count})</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или описанию полномочий..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Permissions List Cards */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {filteredPermissions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs">
                  Ничего не найдено по вашему запросу.
                </div>
              ) : (
                filteredPermissions.map((perm) => {
                  const isChecked = draftRole.permissions.includes(perm.id);

                  return (
                    <div
                      key={perm.id}
                      onClick={() => handleTogglePermission(perm.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-slate-950/90 border-indigo-500/50 hover:border-indigo-400'
                          : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-60 hover:opacity-90'
                      }`}
                    >
                      {/* Checkbox indicator */}
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold transition-colors ${
                              isChecked ? 'text-white' : 'text-slate-400'
                            }`}
                          >
                            {perm.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 shrink-0">
                            {perm.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                          {perm.description}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom notification indicator */}
            <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center gap-2.5 text-xs text-indigo-300">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Изменения прав роли сохраняются по кнопке{' '}
                <strong>«Сохранить параметры роли»</strong> слева и действуют для всех пользователей
                с данной ролью.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
