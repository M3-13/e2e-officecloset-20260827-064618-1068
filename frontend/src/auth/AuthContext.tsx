import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch, clearToken, getToken, setToken } from '../api/client';

export interface User {
  id: string;
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthResponse {
  access_token: string;
  token_type: string;
}

function decodeSub(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload)) as { sub?: unknown };
    return typeof decoded.sub === 'string' ? decoded.sub : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenValue] = useState<string | null>(() => getToken());

  const user = useMemo<User | null>(() => {
    if (!token) {
      return null;
    }
    const sub = decodeSub(token);
    return sub ? { id: sub } : null;
  }, [token]);

  const login = async (email: string, password: string): Promise<void> => {
    const data = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      token: null,
    });
    setToken(data.access_token);
    setTokenValue(data.access_token);
  };

  const register = async (email: string, password: string): Promise<void> => {
    const data = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { email, password },
      token: null,
    });
    setToken(data.access_token);
    setTokenValue(data.access_token);
  };

  const logout = (): void => {
    clearToken();
    setTokenValue(null);
  };

  const value: AuthContextValue = {
    token,
    user,
    isAuthenticated: token !== null,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
