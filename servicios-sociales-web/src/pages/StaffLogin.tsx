import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ChevronRight, Key, RefreshCcw, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const StaffLoginPage: React.FC = () => {
    const { login, verifyInternalOtp } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const isExpired = searchParams.get('expired') === 'true' || location.state?.expired;

    // Form fields
    const [step, setStep] = useState(1);
    const [otpStep, setOtpStep] = useState(false);
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [captchaId, setCaptchaId] = useState('');
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [refreshingCaptcha, setRefreshingCaptcha] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');

    const { executeRecaptcha } = useGoogleReCaptcha();

    const fetchCaptcha = useCallback(async () => {
        setRefreshingCaptcha(true);
        try {
            const { data } = await api.get('auth/captcha');
            setCaptchaSvg(data.data);
            setCaptchaId(data.id);
            setCaptchaAnswer('');
        } catch (err) {
            console.error('Error fetching captcha:', err);
        } finally {
            setRefreshingCaptcha(false);
        }
    }, []);

    React.useEffect(() => {
        if (!otpStep) {
            fetchCaptcha();
        }
    }, [otpStep, fetchCaptcha]);

    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!executeRecaptcha) return;
        setLoading(true);
        setError('');
        try {
            const captchaToken = await executeRecaptcha('staff_login');
            const result = await login({
                email: email.trim(),
                password: password.trim(),
                captchaToken,
                captchaAnswer,
                captchaId
            });
            setSuccessMessage(result.message);
            setStep(2);
            setOtpStep(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Credenciales de acceso inválidas');
            fetchCaptcha();
        } finally {
            setLoading(false);
        }
    }, [executeRecaptcha, login, email, password, captchaAnswer, captchaId, fetchCaptcha]);

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await verifyInternalOtp({
                email: email.trim(),
                code: otpCode.trim()
            });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Código OTP inválido o expirado');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        window.location.href = `${apiUrl}/oauth/google`;
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-color)',
            padding: '1rem'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '420px', backgroundColor: '#1e293b' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: '#2563eb',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem'
                    }}>
                        {step === 1 ? <ShieldCheck size={32} color="white" /> : <Key size={32} color="white" />}
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '-0.02em', color: 'white' }}>
                        Servicios Sociales — Personal
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        {step === 1 ? 'Acceso exclusivo para personal administrativo y médico' : 'Verificación de dos pasos requerida'}
                    </p>
                </div>

                {isExpired && step === 1 && (
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <h3 style={{ color: '#991b1b', fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>Sesión Vencida</h3>
                            <p style={{ color: '#b91c1c', fontSize: '0.8125rem', margin: 0, lineHeight: 1.4 }}>
                                Por motivos de seguridad tu sesión ha sido cerrada debido a inactividad o expiración del token de acceso de 15 minutos. Por favor, vuelve a iniciar sesión para continuar.
                            </p>
                        </div>
                    </div>
                )}

                {step === 1 ? (
                    <>
                        <form onSubmit={handleLogin}>
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ color: '#e2e8f0' }}><Mail size={14} style={{ marginRight: '4px' }} /> Correo Institucional</label>
                                <input
                                    type="email"
                                    placeholder="usuario@institucion.gob.sv"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ backgroundColor: '#334155', color: 'white', border: '1px solid #475569' }}
                                />
                            </div>
                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ color: '#e2e8f0' }}><Lock size={14} style={{ marginRight: '4px' }} /> Contraseña</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ backgroundColor: '#334155', color: 'white', border: '1px solid #475569' }}
                                />
                            </div>

                            {/* Visual CAPTCHA Block - Diseño Premium Integrado */}
                            <div style={{
                                backgroundColor: 'transparent',
                                border: '1px solid #475569',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1.5rem',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
                                        <ShieldCheck size={14} color="#10b981" /> VERIFICACIÓN HUMANA
                                    </label>
                                    <button
                                        type="button"
                                        onClick={fetchCaptcha}
                                        disabled={refreshingCaptcha}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '0.7rem',
                                            fontWeight: '600'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.color = '#60a5fa'}
                                        onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                                    >
                                        <RefreshCcw size={12} className={refreshingCaptcha ? 'animate-spin' : ''} /> Actualizar
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div
                                        dangerouslySetInnerHTML={{ __html: captchaSvg.replace('<svg ', '<svg style="width:100%; height:100%;" ') }}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: '6px',
                                            height: '42px',
                                            flex: '1.2',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            border: '1px solid #475569'
                                        }}
                                    />
                                    <div style={{ flex: '1' }}>
                                        <input
                                            type="text"
                                            placeholder="Ingrese el texto"
                                            required
                                            autoComplete="off"
                                            value={captchaAnswer}
                                            onChange={(e) => setCaptchaAnswer(e.target.value)}
                                            style={{
                                                textAlign: 'center',
                                                fontWeight: '800',
                                                letterSpacing: '2px',
                                                textTransform: 'uppercase',
                                                fontSize: '0.9rem',
                                                height: '42px',
                                                width: '100%',
                                                padding: '0',
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #475569',
                                                color: 'white'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center', backgroundColor: '#451a1a', padding: '0.5rem', borderRadius: '6px' }}>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !executeRecaptcha}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '12px', gap: '8px', marginBottom: '1.5rem' }}>
                                {loading ? 'Verificando...' : 'Iniciar Sesión'}
                                {!loading && <ChevronRight size={18} />}
                            </button>

                            <div style={{ textAlign: 'center' }}>
                                <a href="#" style={{ color: '#60a5fa', fontSize: '0.8125rem', textDecoration: 'none', fontWeight: '500' }}>
                                    ¿Problemas de acceso? Contacte a soporte IT
                                </a>
                            </div>
                        </form>

                        <div style={{ marginTop: '2.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
                                <span style={{ padding: '0 10px', fontSize: '0.6875rem', color: '#94a3b8', fontWeight: '700' }}>O CONTINUAR CON SSO</span>
                                <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                <button
                                    className="btn"
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    style={{ background: '#334155', border: 'none', color: 'white', fontSize: '0.8125rem', gap: '8px', cursor: 'pointer' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                                    </svg>
                                    Google
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleVerifyOtp} style={{
                        animation: 'fadeIn 0.3s ease-out forwards'
                    }}>
                        <div style={{ backgroundColor: '#064e3b', color: '#a7f3d0', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid #059669' }}>
                            {successMessage}
                        </div>

                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ textAlign: 'center', fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '1rem' }}>
                                Introduce el código de 6 dígitos que enviamos a<br />
                                <strong style={{ color: 'white' }}>{email}</strong>
                            </label>
                            <input
                                type="text"
                                placeholder="0 0 0 0 0 0"
                                required
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                style={{
                                    letterSpacing: '0.5em',
                                    textAlign: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    padding: '1rem',
                                    backgroundColor: '#334155',
                                    color: 'white',
                                    border: '2px solid #3b82f6'
                                }}
                            />
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center', backgroundColor: '#451a1a', padding: '0.5rem', borderRadius: '6px' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || otpCode.length !== 6}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '12px', gap: '8px', marginBottom: '1rem' }}>
                            {loading ? 'Validando...' : 'Verificar y Entrar'}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setStep(1); setOtpCode(''); setError(''); }}
                            className="btn"
                            style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #475569', color: '#94a3b8' }}>
                            Regresar e intentar con otra cuenta
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default StaffLoginPage;
