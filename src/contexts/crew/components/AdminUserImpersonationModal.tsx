import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  UserCheck,
  LogIn,
  X,
  Building,
  Rocket,
  Check,
  Filter,
  Users,
  Compass,
  Award,
  Crown,
} from 'lucide-react';
import { UserRole, UserProfile } from '@/src/shared/types';
import {
  ROLES_CONFIG,
  getAllPortalUsers,
  canChangeUserRole,
} from '@/src/contexts/crew/services/rolePermissionService';

interface AdminUserImpersonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onImpersonate: (targetUser: UserProfile, targetTeamId?: string) => void;
  onUpdateUserRole: (targetUserId: string, newRole: UserRole) => void;
}

export const AdminUserImpersonationModal: React.FC<AdminUserImpersonationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onImpersonate,
  onUpdateUserRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [roleChangeSuccess, setRoleChangeSuccess] = useState<string | null>(null);

  // Load all users from the system (mock + 16 teams CRM)
  const allUsers = useMemo(() => getAllPortalUsers(), []);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      // Category filter
      if (selectedCategory !== 'all' && u.profile.role !== selectedCategory) {
        return false;
      }

      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.profile.name.toLowerCase().includes(q) ||
        u.profile.email.toLowerCase().includes(q) ||
        u.profile.school.toLowerCase().includes(q) ||
        (u.teamName && u.teamName.toLowerCase().includes(q)) ||
        ROLES_CONFIG[u.profile.role]?.alias.toLowerCase().includes(q)
      );
    });
  }, [allUsers, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleRoleSelect = (targetProfile: UserProfile, newRole: UserRole) => {
    if (!canChangeUserRole(currentUser, targetProfile.role, newRole)) {
      return;
    }
    onUpdateUserRole(targetProfile.id, newRole);
    setRoleChangeSuccess(
      `Роль пользователя «${targetProfile.name}» успешно изменена на «${ROLES_CONFIG[newRole].alias}»`,
    );
    setTimeout(() => setRoleChangeSuccess(null), 3000);
  };

  const categories = [
    { id: 'all', label: 'Все пользователи', count: allUsers.length },
    {
      id: 'admin',
      label: 'Координаторы ЦУП (Админы)',
      count: allUsers.filter((u) => u.profile.role === 'admin').length,
    },
    {
      id: 'organizer',
      label: 'Командиры ЦУП (Организаторы)',
      count: allUsers.filter((u) => u.profile.role === 'organizer').length,
    },
    {
      id: 'expert',
      label: 'Лётные Эксперты',
      count: allUsers.filter((u) => u.profile.role === 'expert').length,
    },
    {
      id: 'mentor',
      label: 'Командиры кораблей (16 капитанов)',
      count: allUsers.filter((u) => u.profile.role === 'mentor').length,
    },
    {
      id: 'participant',
      label: 'Члены экипажей (Школьники)',
      count: allUsers.filter((u) => u.profile.role === 'participant').length,
    },
    {
      id: 'guest',
      label: 'Пассажиры (Гости)',
      count: allUsers.filter((u) => u.profile.role === 'guest').length,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-rose-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Центр авторизации и вход под пользователями
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono border border-rose-500/40 uppercase">
                  Mirovisor ЦУП
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Администратор: <strong className="text-white">{currentUser.name}</strong> (
                {currentUser.email})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по ФИО, email, школе, кораблю или роли..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3 h-3" />
              Фильтр:
            </span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-xs whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label} <span className="opacity-60 text-[10px]">({cat.count})</span>
              </button>
            ))}
          </div>

          {roleChangeSuccess && (
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{roleChangeSuccess}</span>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
            <span>НАЙДЕНО ПОЛЬЗОВАТЕЛЕЙ: {filteredUsers.length}</span>
            <span>КЛИК ПО «ВОЙТИ» АВТОРИЗУЕТ ВАС ПОД ЭТИМ ПОЛЬЗОВАТЕЛЕМ</span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Пользователи не найдены по заданному фильтру</p>
            </div>
          ) : (
            filteredUsers.map((item) => {
              const u = item.profile;
              const isCurrent = u.id === currentUser.id;
              const roleMeta = ROLES_CONFIG[u.role] || ROLES_CONFIG.guest;

              return (
                <div
                  key={u.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/20'
                      : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/80'
                  }`}
                >
                  {/* User info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 overflow-hidden flex items-center justify-center font-bold text-white text-sm">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          u.name.slice(0, 1)
                        )}
                      </div>
                      {isCurrent && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] text-white font-bold flex items-center justify-center ring-2 ring-slate-900"
                          title="Это ваш текущий профиль"
                        >
                          ★
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white truncate">{u.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${roleMeta.badgeColor}`}
                        >
                          {roleMeta.alias}
                        </span>
                        {item.teamName && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 font-mono">
                            <Rocket className="w-3 h-3" />
                            {item.teamName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                        <span className="text-slate-300 font-mono text-[11px]">{u.email}</span>
                        {u.school && (
                          <span className="flex items-center gap-1 text-[11px] truncate max-w-xs">
                            <Building className="w-3 h-3 text-slate-500 shrink-0" />
                            {u.school}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Role Select */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    {/* Role changer dropdown */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 hidden md:inline">Роль:</span>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleSelect(u, e.target.value as UserRole)}
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        title="Сменить роль пользователю"
                      >
                        <option value="admin">Координатор ЦУП (Админ)</option>
                        <option value="organizer">Командир ЦУП (Организатор)</option>
                        <option value="expert">Лётный Эксперт</option>
                        <option value="mentor">Командир корабля (Наставник)</option>
                        <option value="participant">Член экипажа (Школьник)</option>
                        <option value="guest">Пассажир (Гость)</option>
                      </select>
                    </div>

                    {/* Impersonate button */}
                    {isCurrent ? (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Активен
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onImpersonate(u, item.teamId);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Войти</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>
              Режим суперпользователя активен для{' '}
              <strong className="text-white">info@mirovisor.com</strong>.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Закрыть окно
          </button>
        </div>
      </div>
    </div>
  );
};
