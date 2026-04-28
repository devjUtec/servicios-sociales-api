import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<any>;
  verifyInternalOtp: (credentials: { email: string; code: string }) => Promise<any>;
  citizenLogin: (credentials: any) => Promise<any>;
  verifyCitizenOtp: (credentials: any) => Promise<any>;
  logout: (expired?: boolean) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Basic check if token exists (mock for now or check backend)
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } else {
        localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  // Timer para verificar expiración del token cada 1 segundo
  useEffect(() => {
    if (!user) {
      setShowWarning(false);
      return;
    }

    const interval = setInterval(() => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const decoded = parseJwt(token);
      if (!decoded || !decoded.exp) return;

      const expirationTime = decoded.exp * 1000;
      const currentTime = Date.now();
      const difference = expirationTime - currentTime;

      // Si falta menos de 1 minuto (60000ms) pero más de 0, mostrar warning
      if (difference > 0 && difference <= 60000) {
        setShowWarning(true);
        setTimeLeft(Math.ceil(difference / 1000));
      } else if (difference <= 0) {
        // Expirado
        setShowWarning(false);
        logout(true); // Pass expired flag
      } else {
        setShowWarning(false);
      }
    }, 1000); // revisar cada 1 segundo

    return () => clearInterval(interval);
  }, [user]);

  const login = async (credentials: any) => {
    const { data } = await api.post('auth/login', credentials);
    return data; // Retorna mensaje y OTP (Paso 1)
  };

  const verifyInternalOtp = async (credentials: { email: string; code: string }) => {
    const { data } = await api.post('auth/verify-otp', credentials);
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  };

  const citizenLogin = async (credentials: any) => {
    const { data } = await api.post('auth/citizen/login', credentials);
    return data; // Returns OTP state
  };

  const verifyCitizenOtp = async (credentials: any) => {
    const { data } = await api.post('auth/citizen/verify-otp', credentials);
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  };

  const logout = async (expired: boolean = false) => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('auth/logout', { refreshToken });
      } catch (e) {
        console.error('Error during logout', e);
      }
    }
    setUser(null);
    setShowWarning(false);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Redirect logic with clean URL
    const isDashboard = window.location.pathname.startsWith('/dashboard');
    const path = isDashboard ? '/staff-gate' : '/portal';
    navigate(path, { state: { expired } });
  };

  const refreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      logout();
      return;
    }
    try {
      const { data } = await api.post('auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      setShowWarning(false);
    } catch (error) {
      console.error('Error refreshing token', error);
      logout();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, verifyInternalOtp, logout, citizenLogin, verifyCitizenOtp, refreshSession }}>
      {children}
      {showWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '12px',
            maxWidth: '400px', width: '90%', textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <AlertTriangle size={48} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>
              Tu sesión está por expirar
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Por inactividad, tu sesión se cerrará en <strong>{timeLeft} segundos</strong>. ¿Deseas mantener tu sesión activa?
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => logout(false)}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '8px', 
                  border: '1px solid #e2e8f0', background: 'transparent',
                  color: '#64748b', fontWeight: '600', cursor: 'pointer'
                }}>
                Cerrar Sesión
              </button>
              <button 
                onClick={refreshSession}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '8px', 
                  border: 'none', background: '#2563eb',
                  color: 'white', fontWeight: '600', cursor: 'pointer'
                }}>
                Mantener Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
