import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  CreditCard, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';

const CitizenRegister: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        affiliationNumber: '',
        email: '',
        password: '',
    });

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setShowSuccess(true);
        }, 1500);
    };

    if (showSuccess) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.successIconContainer}>
                        <CheckCircle2 size={40} color="#10b981" />
                    </div>
                    <h2 style={styles.title}>¡Registro Exitoso!</h2>
                    <p style={styles.subtitle}>Te hemos enviado un código de activación a tu correo electrónico.</p>
                    <button onClick={() => navigate('/portal')} style={styles.primaryButton}>
                        Ir al Inicio de Sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Panel Izquierdo Decorativo */}
            <div style={styles.sidebar}>
                <div style={styles.sidebarBlob1}></div>
                <div style={styles.sidebarBlob2}></div>
                <div style={styles.sidebarHeader}>
                    <ShieldCheck color="#fff" size={32} />
                    <span style={{fontWeight: 800, fontSize: '20px'}}>Servicios Sociales SV</span>
                </div>
                <div style={styles.sidebarContent}>
                    <h1 style={styles.sidebarTitle}>Bienvenido al Portal Ciudadano Digital</h1>
                    <p style={styles.sidebarText}>Accede a tu historial médico, cotizaciones y trámites institucionales desde la comodidad de tu hogar.</p>
                </div>
                <div style={styles.sidebarFooter}>
                    <div style={styles.stat}>
                        <div style={styles.statVal}>+2.4M</div>
                        <div style={styles.statLabel}>Afiliados</div>
                    </div>
                </div>
            </div>

            {/* Panel Derecho de Formulario */}
            <div style={styles.formPanel}>
                <div style={styles.formContainer}>
                    <div style={styles.header}>
                        <Link to="/portal" style={styles.backLink}>← Volver</Link>
                        <h2 style={styles.title}>Crea tu Cuenta</h2>
                        <p style={styles.subtitle}>Únete a la red digital de beneficios sociales.</p>
                    </div>

                    <form onSubmit={handleRegister} style={styles.form}>
                        <div style={styles.row}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nombre</label>
                                <input type="text" placeholder="Juan" style={styles.input} required />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Apellido</label>
                                <input type="text" placeholder="Pérez" style={styles.input} required />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>DUI / N° Afiliación</label>
                            <input type="text" placeholder="00000000-0" style={styles.input} required />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Cerrero Electrónico</label>
                            <input type="email" placeholder="nombre@ejemplo.com" style={styles.input} required />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Contraseña</label>
                            <input type="password" placeholder="••••••••" style={styles.input} required />
                        </div>

                        <button type="submit" style={styles.primaryButton}>
                            {isLoading ? 'Registrando...' : 'Empezar ahora'} <ArrowRight size={18} />
                        </button>
                    </form>

                    <div style={styles.divider}>
                        <div style={styles.dividerLine}></div>
                        <span style={styles.dividerText}>O REGÍSTRATE CON</span>
                        <div style={styles.dividerLine}></div>
                    </div>

                    <button type="button" style={styles.googleButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        fontFamily: "'Outfit', sans-serif",
        backgroundColor: '#0f172a',
        color: '#fff',
        overflow: 'hidden'
    },
    sidebar: {
        flex: 1,
        backgroundColor: '#1e293b',
        padding: '64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
    },
    sidebarBlob1: {
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
        filter: 'blur(60px)',
    },
    sidebarBlob2: {
        position: 'absolute',
        bottom: '0',
        right: '0',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
        filter: 'blur(60px)',
    },
    sidebarHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 2
    },
    sidebarContent: {
        zIndex: 2,
        maxWidth: '440px'
    },
    sidebarTitle: {
        fontSize: '48px',
        fontWeight: 800,
        lineHeight: 1.1,
        marginBottom: '24px'
    },
    sidebarText: {
        fontSize: '18px',
        color: '#94a3b8',
        lineHeight: 1.6
    },
    sidebarFooter: {
        display: 'flex',
        gap: '32px',
        zIndex: 2
    },
    stat: { display: 'flex', flexDirection: 'column' },
    statVal: { fontSize: '24px', fontWeight: 800 },
    statLabel: { fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' },
    
    formPanel: {
        flex: 1,
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
    },
    formContainer: {
        width: '100%',
        maxWidth: '420px',
    },
    header: { marginBottom: '32px' },
    backLink: { color: '#6366f1', fontSize: '13px', fontWeight: 700, textDecoration: 'none', marginBottom: '16px', display: 'block' },
    title: { fontSize: '32px', fontWeight: 800, marginBottom: '8px' },
    subtitle: { color: '#94a3b8', fontSize: '15px' },
    
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    row: { display: 'flex', gap: '16px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
    label: { fontSize: '13px', fontWeight: 600, color: '#64748b' },
    input: {
        backgroundColor: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '16px',
        padding: '16px',
        color: '#fff',
        outline: 'none',
        fontSize: '15px'
    },
    primaryButton: {
        backgroundColor: '#6366f1',
        color: '#fff',
        border: 'none',
        borderRadius: '16px',
        padding: '16px',
        fontSize: '16px',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '12px'
    },
    divider: {
        marginTop: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    dividerLine: { flex: 1, height: '1px', backgroundColor: '#1f2937' },
    dividerText: { fontSize: '10px', color: '#475569', fontWeight: 700, letterSpacing: '1px' },
    
    googleButton: {
        marginTop: '24px',
        width: '100%',
        backgroundColor: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '16px',
        padding: '16px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontWeight: 600,
        cursor: 'pointer'
    },
    successIconContainer: {
        width: '80px', height: '80px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
    },
    card: {
        backgroundColor: '#1e293b', padding: '48px', borderRadius: '32px', textAlign: 'center', maxWidth: '400px', border: '1px solid #334155'
    }
};

export default CitizenRegister;
