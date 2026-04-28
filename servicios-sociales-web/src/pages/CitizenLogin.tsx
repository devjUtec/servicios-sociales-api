import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, CreditCard, ChevronRight, AlertTriangle, Key, RefreshCcw, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const CitizenLoginPage: React.FC = () => {
    const { citizenLogin, verifyCitizenOtp } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [otpStep, setOtpStep] = useState(false);
    const isExpired = searchParams.get('expired') === 'true' || location.state?.expired;

    const [showSecurityModal, setShowSecurityModal] = useState(false);

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [affiliation, setAffiliation] = useState('');
    const [otp, setOtp] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [captchaId, setCaptchaId] = useState('');
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [refreshingCaptcha, setRefreshingCaptcha] = useState(false);

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
            const captchaToken = await executeRecaptcha('citizen_login');
            const result = await citizenLogin({ 
                email, 
                password, 
                affiliationNumber: affiliation, 
                captchaToken,
                captchaAnswer, // CAPTCHA manual
                captchaId      // ID del CAPTCHA manual
            });
            setSuccessMessage(result.message);
            setOtpStep(true);
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.response?.status === 429) {
                setShowSecurityModal(true);
            }
            const serverMessage = err.response?.data?.message || err.response?.data?.errorMessage || err.response?.data?.error;
            setError(serverMessage || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    }, [executeRecaptcha, citizenLogin, email, password, affiliation]);

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await verifyCitizenOtp({ email, code: otp });
            navigate('/portal/me');
        } catch (err: any) {
            if (err.response?.status === 429) {
                setShowSecurityModal(true);
            }
            setError(err.response?.data?.message || 'Código OTP inválido o expirado');
        } finally {
            setLoading(false);
        }
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
            {/* Modal de Seguridad */}
            {showSecurityModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '1rem'
                }}>
                    <div className="card" style={{
                        maxWidth: '450px',
                        width: '100%',
                        textAlign: 'center',
                        border: '2px solid #dc2626',
                        animation: 'scaleIn 0.3s ease-out'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem'
                        }}>
                            <AlertTriangle size={40} color="#dc2626" />
                        </div>
                        <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>Acceso Pausado por Seguridad</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
                            {error || 'Hemos detectado un comportamiento inusual. Tu acceso desde esta dirección IP ha sido restringido temporalmente para proteger tu cuenta.'}
                        </p>
                        <div style={{
                            backgroundColor: '#f8fafc',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '2rem',
                            fontSize: '0.8125rem',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}>
                            Si crees que esto es un error, por favor contacta a soporte técnico:
                            <br />
                            <strong style={{ color: 'var(--accent-color)' }}>soporte@test.sv</strong>
                        </div>
                        <button
                            onClick={() => setShowSecurityModal(false)}
                            className="btn btn-primary"
                            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', width: '100%' }}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: 'var(--accent-color)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem'
                    }}>
                        {!otpStep ? <User size={32} color="white" /> : <Key size={32} color="white" />}
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                        Portal del Ciudadano
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {!otpStep ? 'Acceda a sus servicios sociales de forma rápida y segura' : 'Verificación de dos pasos requerida'}
                    </p>
                </div>

                {isExpired && !otpStep && (
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <h3 style={{ color: '#991b1b', fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>Sesión Vencida</h3>
                            <p style={{ color: '#b91c1c', fontSize: '0.8125rem', margin: 0, lineHeight: 1.4 }}>
                                Por motivos de seguridad tu sesión ha sido cerrada debido a inactividad. Por favor, vuelve a iniciar sesión para continuar.
                            </p>
                        </div>
                    </div>
                )}

                {!otpStep ? (
                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label><Mail size={14} style={{ marginRight: '4px' }} /> Correo Electrónico</label>
                            <input type="email" placeholder="ejemplo@correo.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label><CreditCard size={14} style={{ marginRight: '4px' }} /> Número de Afiliación</label>
                            <input type="text" placeholder="Formato ISSS-12345" required value={affiliation} onChange={(e) => setAffiliation(e.target.value)} />
                        </div>
                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label><Lock size={14} style={{ marginRight: '4px' }} /> Contraseña</label>
                            <input type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>

                        {/* Visual CAPTCHA Block - Diseño Premium */}
                        <div style={{
                            backgroundColor: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            marginBottom: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
                                    <ShieldCheck size={14} color="var(--success)" /> VERIFICACIÓN HUMANA
                                </label>
                                <button 
                                    type="button" 
                                    onClick={fetchCaptcha} 
                                    disabled={refreshingCaptcha}
                                    style={{ 
                                        background: 'transparent', 
                                        border: 'none', 
                                        cursor: 'pointer', 
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: '600'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
                                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                >
                                    <RefreshCcw size={12} className={refreshingCaptcha ? 'animate-spin' : ''} /> Actualizar
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
                                <div 
                                    className="captcha-container"
                                    dangerouslySetInnerHTML={{ __html: captchaSvg.replace('<svg ', '<svg style="width:100%; height:100%;" ') }} 
                                    style={{ 
                                        backgroundColor: 'white', // Fondo blanco para máxima legibilidad del CAPTCHA
                                        borderRadius: '6px', 
                                        height: '48px',
                                        flex: '1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        border: '1px solid var(--border-color)'
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
                                            fontWeight: '700',
                                            letterSpacing: '3px',
                                            textTransform: 'uppercase',
                                            fontSize: '1rem',
                                            height: '48px',
                                            width: '100%',
                                            padding: '0',
                                            backgroundColor: '#0f172a',
                                            border: '1px solid var(--border-color)',
                                            color: 'white'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div style={{ color: 'var(--error)', fontSize: '0.8125rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !executeRecaptcha}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '12px', gap: '8px' }}>
                            {loading ? 'Procesando...' : 'Iniciar Sesión'}
                            {!loading && <ChevronRight size={18} />}
                        </button>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <a href="#" style={{ color: 'var(--accent-color)', fontSize: '0.8125rem', textDecoration: 'none', fontWeight: '500' }}>
                                ¿No recuerda su número de afiliación?
                            </a>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} style={{
                        animation: 'fadeIn 0.3s ease-out forwards'
                    }}>
                        <div style={{ backgroundColor: '#064e3b', color: '#a7f3d0', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid #059669' }}>
                            {successMessage}
                        </div>

                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'block' }}>
                                Introduce el código de 6 dígitos que enviamos a<br />
                                <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                            </label>
                            <input
                                type="text"
                                placeholder="0 0 0 0 0 0"
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                style={{
                                    letterSpacing: '0.5em',
                                    textAlign: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    padding: '1rem',
                                    backgroundColor: 'var(--bg-color)',
                                    color: 'var(--text-primary)',
                                    border: '2px solid var(--accent-color)',
                                    borderRadius: '8px',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center', backgroundColor: '#fef2f2', padding: '0.5rem', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '12px', gap: '8px', marginBottom: '1rem' }}>
                            {loading ? 'Validando...' : 'Verificar y Entrar'}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setOtpStep(false); setOtp(''); setError(''); }}
                            className="btn"
                            style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            Regresar e intentar de nuevo
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CitizenLoginPage;
