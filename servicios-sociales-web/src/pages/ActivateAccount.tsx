import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  UserCheck,
  ChevronRight,
  Mail
} from 'lucide-react';

const ActivateAccount: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/auth/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al activar la cuenta');
            }

            setIsSuccess(true);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsLoading(true);
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        window.location.href = `${apiUrl}/oauth/google?state=activate_${token}`;
    };

    const containerStyle: React.CSSProperties = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        padding: '1rem',
        fontFamily: 'inherit'
    };

    const cardStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '2.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    };

    if (isSuccess) {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', backgroundColor: '#10b981', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <CheckCircle size={32} color="white" />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'white' }}>¡Cuenta Activada!</h1>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '2rem' }}>Tu perfil de personal ha sido configurado exitosamente.</p>
                        <button onClick={() => navigate('/staff-gate')} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                            Ir al Inicio de Sesión
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '60px', height: '60px', backgroundColor: '#2563eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                        <ShieldCheck size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'white', letterSpacing: '-0.02em' }}>
                        Activa tu Cuenta
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        Hola, <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{email || 'usuario'}</span>. Configura tu acceso institucional.
                    </p>
                </div>

                {/* Opción SSO - Primero como pediste */}
                <div>
                    <button 
                        onClick={handleGoogleLogin}
                        className="btn"
                        style={{ width: '100%', background: 'white', border: '1px solid #d1d5db', color: '#374151', fontSize: '0.8125rem', gap: '8px', cursor: 'pointer', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Activar con Google (SSO)
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
                        <span style={{ padding: '0 10px', fontSize: '0.6875rem', color: '#64748b', fontWeight: '700' }}>O DEFINE UNA CONTRASEÑA</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
                    </div>
                </div>

                <form onSubmit={handleActivate}>
                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={14}/> Nueva Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', paddingRight: '40px' }}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><UserCheck size={14}/> Confirmar Contraseña</label>
                        <input 
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || !password || password !== confirmPassword}
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '12px', gap: '8px' }}>
                        {isLoading ? 'Activando...' : 'Completar Activación'}
                        {!isLoading && <ChevronRight size={18} />}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', lineHeight: '1.5' }}>
                        Al activar tu cuenta, aceptas las políticas de uso y privacidad institucional.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ActivateAccount;
