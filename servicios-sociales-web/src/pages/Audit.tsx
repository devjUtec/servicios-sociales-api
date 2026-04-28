import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DataTable } from '../components/common/DataTable';
import { Search, History, ShieldAlert, Cpu } from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    metadata: any;
    resourceType: string;
    resourceId: string;
    email?: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    user?: {
        email: string;
    };
    citizen?: {
        id: string;
        email: string;
    };
}

const AuditPage: React.FC = () => {
    const [data, setData] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/audit');
                setData(response.data);
            } catch (err) {
                console.error('Error fetching audit logs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredData = data.filter(item => {
        const matchesSearch = 
            item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.citizen?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const logDate = new Date(item.createdAt);
        const matchesStart = !dateRange.start || logDate >= new Date(dateRange.start);
        const matchesEnd = !dateRange.end || logDate <= new Date(dateRange.end + 'T23:59:59');
        
        return matchesSearch && matchesStart && matchesEnd;
    });

    const columns = [
        { 
            header: 'Acción / Evento', 
            accessor: (item: AuditLog) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <ShieldAlert size={16} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#334155' }}>{item.action}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Por: {item.email || item.user?.email || item.citizen?.email || 'Sistema'}</div>
                    </div>
                </div>
            ) 
        },
        { 
            header: 'Detalles / Destino', 
            accessor: (item: AuditLog) => (
                <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'pre-wrap', maxWidth: '300px' }}>
                    {item.resourceType && <div style={{ fontWeight: 600 }}>Tipo: {item.resourceType}</div>}
                    {item.resourceId && <div>ID Recurso: {item.resourceId}</div>}
                    {item.citizen?.id && <div>ID Destino: {item.citizen.id}</div>}
                    {item.metadata && Object.keys(item.metadata).length > 0 && <div style={{ marginTop: '0.25rem', color: '#94a3b8', fontSize: '0.70rem' }}>{JSON.stringify(item.metadata)}</div>}
                </div>
            )
        },
        { 
            header: 'Dispositivo', 
            accessor: (item: AuditLog) => (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    <div>{item.ipAddress || '—'}</div>
                    <div style={{ fontSize: '0.65rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.userAgent}</div>
                </div>
            )
        },
        { 
            header: 'Timestamp', 
            accessor: (item: AuditLog) => (
                <div style={{ fontSize: '0.8125rem', color: '#1e293b', fontWeight: 500 }}>
                    {new Date(item.createdAt).toLocaleString()}
                </div>
            )
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                        Logs de Auditoría
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        Registro detallado de todas las acciones críticas realizadas en el sistema.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', backgroundColor: '#334155', color: 'white', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                    <Cpu size={18} /> Sistema Seguro
                </div>
            </div>

            <div style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 2 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por acción o correo de usuario..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                paddingLeft: '2.75rem', 
                                width: '100%', 
                                backgroundColor: '#f8fafc', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                height: '44px'
                            }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Fecha Inicio</label>
                        <input 
                            type="date" 
                            style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0 0.5rem', color: '#1e293b' }} 
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Fecha Fin</label>
                        <input 
                            type="date" 
                            style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0 0.5rem', color: '#1e293b' }} 
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <button 
                            className="btn" 
                            style={{ height: '40px', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', gap: '0.5rem' }}
                            onClick={() => {
                                setSearchTerm('');
                                setDateRange({ start: '', end: '' });
                            }}
                        >
                            <History size={18} /> Limpiar
                        </button>
                    </div>
                </div>
            </div>

            <DataTable columns={columns} data={filteredData} isLoading={loading} />
        </div>
    );
};

export default AuditPage;
