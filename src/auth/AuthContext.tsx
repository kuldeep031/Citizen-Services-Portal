import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type User, type UserRole, type AuthTokens, type AuthState, type LoginCredentials } from './types';
import { api, ApiError } from '../lib/api';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  setAuth: (userData: any, tokenData: any) => void;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'citizen_portal_auth';

function loadPersistedAuth(): { user: User; tokens: AuthTokens } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed.user || !parsed.tokens) return null;
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const persisted = loadPersistedAuth();
    if (persisted) {
      setState({
        user: persisted.user,
        tokens: persisted.tokens,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const data = await api.post<{
        user: { id: string; name: string; email: string; role: UserRole; department?: string; phone?: string; mustChangePassword?: boolean };
        tokens: { accessToken: string; refreshToken: string; expiresIn: number };
      }>('auth/login', credentials);

      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        department: data.user.department,
        phone: data.user.phone,
        mustChangePassword: data.user.mustChangePassword,
      };

      const tokens: AuthTokens = {
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        expiresAt: Date.now() + data.tokens.expiresIn * 1000,
      };

      const authData = { user, tokens };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));

      setState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(err.message);
      }
      throw new Error('Login failed. Please try again.');
    }
  }, []);

  const setAuth = useCallback((userData: any, tokenData: any) => {
    const user: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      phone: userData.phone,
    };

    const tokens: AuthTokens = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: Date.now() + (tokenData.expiresIn || 900) * 1000,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tokens }));
    setState({ user, tokens, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { tokens } = JSON.parse(stored);
        await api.post('auth/logout', { refreshToken: tokens?.refreshToken }).catch(() => {});
      }
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      setState({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]) => {
    if (!state.user) return false;
    if (Array.isArray(role)) return role.includes(state.user.role);
    return state.user.role === role;
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, setAuth, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
