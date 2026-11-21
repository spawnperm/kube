/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { UserRole } from '../../types';

export interface AuthentikUserRecord {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  team_id?: string | null;
  team_name?: string | null;
  school?: string | null;
  city?: string | null;
  grade?: string | null;
  authentik_sub?: string | null;
  metadata?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AuthentikJwtClaims {
  sub: string;
  email: string;
  name?: string;
  full_name?: string;
  role?: UserRole;
  team_id?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password?: string;
  role?: UserRole;
  teamName?: string;
  teamId?: string;
  school?: string;
  city?: string;
  grade?: string;
  inviteToken?: string;
}

interface AuthentikAuthContextValue {
  user: AuthentikUserRecord | null;
  token: string | null;
  jwtPayload: AuthentikJwtClaims | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  allUsers: AuthentikUserRecord[];
  isLoginModalOpen: boolean;
  isRegisterModalOpen: boolean;
  registerModalDefaultRole: UserRole;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openRegisterModal: (defaultRole?: UserRole) => void;
  closeRegisterModal: () => void;
  login: (identifier: string, password?: string) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  adminRegister: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  fetchProfile: () => Promise<AuthentikUserRecord | null>;
  isTokenValid: (tokenToCheck?: string | null) => boolean;
}

const AuthentikAuthContext = createContext<AuthentikAuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'cosmoport_authentik_token';
const USER_KEY = 'cosmoport_authentik_user';

/**
 * Декодирование полезной нагрузки JWT-токена Authentik на стороне клиента
 */
export function parseAuthentikJwt<T = AuthentikJwtClaims>(token: string): T | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}

/**
 * Проверка валидности и срока действия JWT-токена
 */
export function isAuthentikJwtValid(token: string | null | undefined): boolean {
  if (!token) return false;
  // Если токен в формате JWT
  if (token.split('.').length === 3) {
    const claims = parseAuthentikJwt<AuthentikJwtClaims>(token);
    if (!claims) return false;
    if (claims.exp) {
      const nowSec = Math.floor(Date.now() / 1000);
      return claims.exp > nowSec;
    }
    return true;
  }
  // Если токен сессионный (authentik_sess_...)
  return token.length > 10;
}

export const AuthentikAuthProvider: React.FC<{
  children: React.ReactNode;
  onRoleSync?: (role: UserRole, user: AuthentikUserRecord) => void;
}> = ({ children, onRoleSync }) => {
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved && !isAuthentikJwtValid(saved)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return saved;
  });

  const [user, setUser] = useState<AuthentikUserRecord | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [allUsers, setAllUsers] = useState<AuthentikUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [registerModalDefaultRole, setRegisterModalDefaultRole] = useState<UserRole>('participant');

  const jwtPayload = useMemo(() => {
    return token ? parseAuthentikJwt<AuthentikJwtClaims>(token) : null;
  }, [token]);

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/authentik/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
      }
    } catch {
      // offline fallback
    }
  }, []);

  /**
   * Получение профиля текущего авторизованного пользователя из базы PostgreSQL
   */
  const fetchProfile = useCallback(async (): Promise<AuthentikUserRecord | null> => {
    if (!token) return null;

    // Проверка срока действия JWT перед запросом
    if (!isAuthentikJwtValid(token)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
      return null;
    }

    try {
      // Вызываем защищенный эндпоинт GET /api/users/profile
      const res = await fetch('/api/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-authentik-token': token,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const profile = data.user || null;
        if (profile) {
          setUser(profile);
          localStorage.setItem(USER_KEY, JSON.stringify(profile));
          if (onRoleSync) {
            onRoleSync(profile.role, profile);
          }
          return profile;
        }
      } else if (res.status === 401) {
        // Несанкционированный доступ / токен не прошел проверку
        console.warn('[Authentik] JWT token rejected by backend (401 Unauthorized)');
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
        return null;
      } else {
        // Запасной fallback на /api/authentik/me
        const altRes = await fetch('/api/authentik/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (altRes.ok) {
          const altData = await altRes.json();
          if (altData.authenticated && altData.user) {
            setUser(altData.user);
            localStorage.setItem(USER_KEY, JSON.stringify(altData.user));
            return altData.user;
          }
        }
      }
    } catch (err) {
      console.warn('[Authentik] Network error during profile fetch:', err);
    }
    return user;
  }, [token, onRoleSync, user]);

  useEffect(() => {
    async function verifySession() {
      setIsLoading(true);
      if (token) {
        if (!isAuthentikJwtValid(token)) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        } else {
          await fetchProfile();
        }
      }
      await refreshUsers();
      setIsLoading(false);
    }

    verifySession();
  }, [token, fetchProfile, refreshUsers]);

  const login = async (identifier: string, password = '123'): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/authentik/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Ошибка входа через Authentik');
      }

      const data = await res.json();
      const receivedToken = data.token;
      setToken(receivedToken);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      if (onRoleSync) {
        onRoleSync(data.user.role, data.user);
      }
      setIsLoginModalOpen(false);

      // Загружаем подтвержденный профиль из PostgreSQL через GET /api/users/profile
      try {
        const profileRes = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${receivedToken}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.user) {
            setUser(profileData.user);
            localStorage.setItem(USER_KEY, JSON.stringify(profileData.user));
          }
        }
      } catch {
        // non-blocking
      }

      return true;
    } catch (e: any) {
      console.error('[Authentik login error]', e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/authentik/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Ошибка регистрации в PostgreSQL');
      }

      const data = await res.json();
      const receivedToken = data.token;
      setToken(receivedToken);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      if (onRoleSync) {
        onRoleSync(data.user.role, data.user);
      }
      setIsRegisterModalOpen(false);
      await refreshUsers();
      return true;
    } catch (e: any) {
      console.error('[Authentik registration error]', e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const adminRegister = async (payload: RegisterPayload) => {
    try {
      const res = await fetch('/api/authentik/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Ошибка регистрации' };
      }

      await refreshUsers();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Сетевая ошибка' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/authentik/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthentikAuthContext.Provider
      value={{
        user,
        token,
        jwtPayload,
        isAuthenticated: !!user,
        isLoading,
        allUsers,
        isLoginModalOpen,
        isRegisterModalOpen,
        registerModalDefaultRole,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        openRegisterModal: (role = 'participant') => {
          setRegisterModalDefaultRole(role);
          setIsRegisterModalOpen(true);
        },
        closeRegisterModal: () => setIsRegisterModalOpen(false),
        login,
        register,
        adminRegister,
        logout,
        refreshUsers,
        fetchProfile,
        isTokenValid: isAuthentikJwtValid,
      }}
    >
      {children}
    </AuthentikAuthContext.Provider>
  );
};

export function useAuthentikAuth(): AuthentikAuthContextValue {
  const context = useContext(AuthentikAuthContext);
  if (!context) {
    throw new Error('useAuthentikAuth must be used within AuthentikAuthProvider');
  }
  return context;
}
