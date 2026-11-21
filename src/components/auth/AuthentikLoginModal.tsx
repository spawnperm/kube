import React, { useState, useMemo } from 'react';
import {
  Shield,
  Lock,
  User,
  Key,
  LogIn,
  Search,
  ExternalLink,
  X,
  Sparkles,
  Users,
  QrCode,
} from 'lucide-react';
import { useAuthentikAuth } from '../../contexts/auth/AuthentikAuthContext';
import type { UserRole } from '../../types';

interface AuthentikLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
}

export const AuthentikLoginModal: React.FC<AuthentikLoginModalProps> = ({
  isOpen,
  onClose,
  onOpenRegister,
}) => {
  const { login, allUsers, isLoading } = useAuthentikAuth();

  const [activeTab, setActiveTab] = useState<'quick' | 'form'>('quick');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('123');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      if (selectedRoleFilter !== 'all' && u.role !== selectedRoleFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.team_name && u.team_name.toLowerCase().includes(q)) ||
        (u.school && u.school.toLowerCase().includes(q))
      );
    });
  }, [allUsers, selectedRoleFilter, searchQuery]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setIsSubmitting(true);
    await login(identifier.trim(), password);
    setIsSubmitting(false);
  };

  const handleQuickLogin = async (email: string) => {
    setIsSubmitting(true);
    await login(email, '123');
    setIsSubmitting(false);
  };

  const roleMeta: Record<
    UserRole | 'guest',
    { label: string; badge: string; color: string; icon: string }
  > = {
    admin: {
      label: 'Администратор',
      badge: 'Координатор ЦУП',
      color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: '🛡️',
    },
    organizer: {
      label: 'Организатор',
      badge: 'Оргкомитет',
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: '🛰️',
    },
    mentor: {
      label: 'Наставник',
      badge: 'Учитель / Капитан',
      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: '👨‍✈️',
    },
    participant: {
      label: 'Участник',
      badge: 'Школьник / Экипаж',
      color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: '🚀',
    },
    jury: {
      label: 'Жюри',
      badge: 'Судейская коллегия',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: '⚖️',
    },
    expert: {
      label: 'Эксперт',
      badge: 'Член жюри',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: '⚖️',
    },
    guest: {
      label: 'Гость',
      badge: 'Зритель',
      color: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      icon: '👤',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Authentik Branding */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border-b border-slate-800 p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-500 via-rose-500 to-indigo-600 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Авторизация Authentik</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                  authentik IdP
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>Единая точка входа на портале кейс-чемпионата «МИРОВИЗОР»</span>
                <a
                  href="https://github.com/goauthentik/authentik"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5 text-[11px]"
                  title="Репозиторий goauthentik/authentik на GitHub"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>authentik</span>
                </a>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Быстрый выбор / Форма */}
        <div className="grid grid-cols-2 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'quick'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Реестр участников (1 клик)</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300">
              {allUsers.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'form'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <LogIn className="w-4 h-4 text-orange-400" />
            <span>Вход по логину / паролю</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'quick' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    Все участники, наставники, организаторы и администратор предзагружены в
                    PostgreSQL с паролем{' '}
                    <strong className="text-white font-mono bg-indigo-900/80 px-1 py-0.5 rounded">
                      123
                    </strong>
                    .
                  </span>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по ФИО, школе, команде или email..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="all">Все роли ({allUsers.length})</option>
                  <option value="admin">Администратор (1)</option>
                  <option value="organizer">Организаторы (2)</option>
                  <option value="mentor">Наставники-педагоги (16)</option>
                  <option value="participant">Школьники-участники (48)</option>
                </select>
              </div>

              {/* User cards list */}
              <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Пользователи не найдены по запросу
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const meta = roleMeta[u.role] || roleMeta.guest;
                    return (
                      <div
                        key={u.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                              {u.full_name}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${meta.color}`}
                            >
                              {meta.icon} {meta.label}
                            </span>
                            {u.team_name && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                                «{u.team_name}»
                              </span>
                            )}
                            {u.grade && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                                {u.grade}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 truncate">
                            <span className="font-mono text-cyan-400/90">{u.email}</span>
                            {u.school && (
                              <>
                                <span>•</span>
                                <span className="truncate text-slate-500">{u.school}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isSubmitting || isLoading}
                          onClick={() => handleQuickLogin(u.email)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/50 font-bold text-xs transition-all shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Войти</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-md mx-auto py-2">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-orange-400" />
                  <span>Авторизация через Authentik SSO Flow</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Введите ваш рабочий email или ФИО. Пароль для всех зарегистрированных учетных
                  записей: <strong className="text-white font-mono">123</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email или ФИО пользователя:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="info@mirovisor.com или Смирнов Александр..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Пароль:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль (по умолчанию 123)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 via-rose-600 to-indigo-600 hover:from-orange-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Проверка Authentik...' : 'Войти через Authentik IdP'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PostgreSQL база данных активна</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenRegister && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegister();
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Быстрая регистрация (QR / форма)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
