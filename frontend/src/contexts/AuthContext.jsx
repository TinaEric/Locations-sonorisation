import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../data/Api';
import { profileClient } from '../data/UserService';

const AuthContext = createContext(null);

function lireSession() {
  try {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') ?? 'null');
    return token && user ? { token, user } : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

const decoderJwt = (token) => {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(lireSession);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setSession({ token: null, user: null });
  }, []);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const token = data.access_token;
      const payload = decoderJwt(token);
      const dataUser = { idUser: payload.sub, email: payload.username, role: payload.role };
      const user = await profileClient(payload.sub);
      
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(dataUser));
      setSession({ token, user });

      return { success: true, role: user.role };
    } catch (error) {
      const brut = error.response?.data?.message;
      const message = Array.isArray(brut) ? brut.join(' · ') : brut;
      return {
        success: false,
        message: message || (error.response ? 'Identifiants incorrects' : 'Le serveur ne répond pas'),
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: session.user,
        token: session.token,
        role: session.user?.role ?? null,
        isAuthenticated: !!session.token,
        loading: false,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  return context;
}

export const redirectionRouteParRole = (role) => {
  switch (role) {
    case 'LOCATAIRE':
        return '/';
    case 'ADMIN':
        return '/admin/';
    case 'GESTIONNAIRE':
        return '/admin/';
    default:
        return '/auth/login';
  }
};