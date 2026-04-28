import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Key, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CitizenActivatePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const email = searchParams.get('email') || '';
    const code = searchParams.get('code') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!email || !code) {
            setError('Enlace inválido o incompleto. Asegúrate de copiar el enlace completo de tu correo.');
        }
    }, [email, code]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${API_URL}/auth/citizen/activate`, {
                email,
                code,
                password
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/portal/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al activar la cuenta. Es posible que el enlace haya expirado.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1rem' }}>
                <div style={{ backgroundColor: 'white', padding: '3rem 2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', width: '100%', maxWidth: '450px', textAlign: 'center' }}>
                    <div style={{ backgroundColor: '#dcfce7', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <CheckCircle size={40} color="#16a34a" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>¡Cuenta Activada!</h2>
                    <p style={{ color: '#475569', marginBottom: '2rem' }}>
                        Tu cuenta ha sido verificada y tu contraseña guardada exitosamente.
                        Te redirigiremos al inicio de sesión...
                    </p>
                    <Loader2 size={24} color="#3b82f6" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1rem' }}>
            <div style={{ backgroundColor: 'white', padding: '2.5rem 2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', width: '100%', maxWidth: '450px' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ backgroundColor: '#eff6ff', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Key size={32} color="#3b82f6" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Activa tu Cuenta</h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Crea una contraseña segura para tu expediente oficial
                    </p>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: 0, lineHeight: 1.4 }}>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>Usuario (Correo)</label>
                        <input 
                            type="email" 
                            disabled 
                            value={email}
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#64748b', boxSizing: 'border-box' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>Nueva Contraseña</label>
                        <input 
                            type="password" 
                            required
                            placeholder="Mínimo 8 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={!email || !code}
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>Confirmar Contraseña</label>
                        <input 
                            type="password" 
                            required
                            placeholder="Vuelve a escribir la contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={!email || !code}
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || !email || !code}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: (loading || !email || !code) ? 'not-allowed' : 'pointer',
                            opacity: (loading || !email || !code) ? 0.7 : 1,
                            transition: 'background-color 0.2s'
                        }}>
                        {loading ? 'Activando...' : 'Guardar y Activar Cuenta'}
                    </button>
                    
                    <style dangerouslySetInnerHTML={{ __html: `
                        button:hover:not(:disabled) {
                            background-color: #2563eb !important;
                        }
                    `}} />
                </form>
            </div>
        </div>
    );
};

export default CitizenActivatePage;
