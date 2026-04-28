import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Activity, History, TrendingUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Lógica para capturar login de Google
        const token = searchParams.get('token');
        const refresh = searchParams.get('refresh');
        const userStr = searchParams.get('user');

        if (token && refresh && userStr) {
            try {
                const userData = JSON.parse(decodeURIComponent(userStr));
                localStorage.setItem('accessToken', token);
                localStorage.setItem('refreshToken', refresh);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Limpiar URL
                searchParams.delete('token');
                searchParams.delete('refresh');
                searchParams.delete('user');
                setSearchParams(searchParams);
                
                // Forzar actualización del contexto
                window.location.reload(); 
            } catch (e) {
                console.error("Error procesando login de Google", e);
            }
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const { data } = await api.get('/stats/dashboard');
                setStatsData(data);
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardStats();
    }, []);

    const stats = [
        { 
            id: 'affiliations', 
            title: 'Total Afiliados', 
            value: statsData?.totalAffiliations ?? '...', 
            change: '+12%', 
            icon: <Users size={24} color="#3b82f6" />, 
            roles: ['super_admin', 'admin', 'staff', 'institution_staff'] 
        },
        { 
            id: 'revenue', 
            title: 'Ingresos Mensuales', 
            value: statsData?.monthlyRevenue ?? '$ 0.00', 
            change: '+5%', 
            icon: <TrendingUp size={24} color="#10b981" />, 
            roles: ['super_admin', 'admin', 'staff', 'institution_staff'] 
        },
        { 
            id: 'records', 
            title: 'Expedientes Abiertos', 
            value: statsData?.openMedicalRecords ?? '...', 
            change: '-2%', 
            icon: <Activity size={24} color="#ef4444" />, 
            roles: ['super_admin', 'admin', 'doctor'] 
        },
        { 
            id: 'audit', 
            title: 'Últimas Auditorías', 
            value: statsData?.recentAuditLogs ?? '...', 
            change: '+15', 
            icon: <History size={24} color="#64748b" />, 
            roles: ['super_admin', 'admin'] 
        },
    ];

    const filteredStats = stats.filter(stat =>
        stat.roles.some(role => user?.roles?.includes(role))
    );

    return (
        <div>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Panel de Control
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
                    Resumen general para el personal de <strong>{user?.roles?.join(', ')}</strong>
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
            }}>
                {filteredStats.map((stat) => (
                    <div key={stat.id} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: 'none', background: 'white', borderBottom: '4px solid #3b82f6' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '12px',
                            backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', border: '1px solid #e2e8f0'
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                {stat.title}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', opacity: loading ? 0.5 : 1 }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{stat.value}</span>
                                <span style={{ color: String(stat.change).startsWith('+') ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
