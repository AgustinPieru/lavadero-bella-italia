import { createContext, useState, useCallback, ReactNode } from 'react';
import api from '@/lib/axios';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Contexto y provider conviven a propósito en el mismo archivo; el costo es
// solo un refresh completo (en vez de HMR) al editar este archivo en dev.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      // Un valor corrupto acá (de una sesión vieja/rota) no puede tirar
      // abajo TODA la app al cargar — ni siquiera las páginas públicas
      // (turnero, encuesta) pasan por acá, pero el AuthProvider envuelve
      // todo el árbol. Se descarta y se trata como "sin sesión".
      localStorage.removeItem('user');
      return null;
    }
  });

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
