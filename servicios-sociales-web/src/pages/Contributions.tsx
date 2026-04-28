import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DataTable } from '../components/common/DataTable';
import { Search, Download, CreditCard, User } from 'lucide-react';

interface Contribution {
    id: string;
    period: string;
    baseAmount: number;
    contributionAmount: number;
    employer: string;
    status: string;
    paymentDate: string;
    citizen: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

const ContributionsPage: React.FC = () => {
    const [data, setData] = useState<Contribution[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        institution: '',
        month: '',
        employer: ''
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchDui, setSearchDui] = useState('');
    const [foundCitizen, setFoundCitizen] = useState<any>(null);
    const [newContribution, setNewContribution] = useState({
        affiliationId: '',
        citizenId: '',
        employer: '',
        employerTaxId: '',
        period: '',
        baseAmount: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/contribution');
            setData(response.data);
        } catch (err) {
            console.error('Error fetching contributions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter(item => {
        const matchesSearch = 
            item.citizen?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.citizen?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.employer?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesEmployer = !filters.employer || item.employer?.toLowerCase().includes(filters.employer.toLowerCase());
        const matchesMonth = !filters.month || item.period?.includes(filters.month);
        
        return matchesSearch && matchesEmployer && matchesMonth;
    });

    const handleSearchAffiliation = async () => {
        if (!searchDui) return;
        setIsSearching(true);
        setFoundCitizen(null);
        try {
            // Buscamos la afiliación por N°
            const response = await api.get(`/affiliation/find/${searchDui}`);
            if (response.data && response.data.id) {
                const aff = response.data;
                setFoundCitizen(aff.citizen);
                setNewContribution({
                    ...newContribution,
                    affiliationId: aff.id,
                    citizenId: aff.citizenId,
                    employer: aff.employer || '',
                    employerTaxId: aff.employerTaxId || ''
                });
            } else {
                alert('No se encontró ninguna afiliación con ese número.');
            }
        } catch (error) {
            console.error(error);
            alert('Error al buscar la afiliación.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreateContribution = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContribution.citizenId || !newContribution.affiliationId) {
            alert('Por favor busque y seleccione una afiliación válida primero.');
            return;
        }

        setIsSubmitting(true);
        try {
            const base = parseFloat(newContribution.baseAmount);
            const contributionAmount = parseFloat((base * 0.075).toFixed(2));

            await api.post('/contribution', {
                affiliationId: newContribution.affiliationId,
                citizenId: newContribution.citizenId,
                period: newContribution.period,
                baseAmount: base,
                contributionAmount: contributionAmount,
                employer: newContribution.employer,
                employerTaxId: newContribution.employerTaxId,
                status: 'paid', // Por defecto pagado al registrarlo manualmente
                paymentDate: new Date().toISOString()
            });
            
            alert('Cotización registrada exitosamente en la base de datos.');
            setIsModalOpen(false);
            setFoundCitizen(null);
            setSearchDui('');
            setNewContribution({
                affiliationId: '', citizenId: '', employer: '', employerTaxId: '', period: '', baseAmount: ''
            });
            
            // Recargar datos reales
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Error al crear la cotización. Revise la consola para más detalles.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        { 
            header: 'Ciudadano', 
            accessor: (item: Contribution) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                        <User size={16} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{item.citizen?.firstName} {item.citizen?.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.citizen?.email}</div>
                    </div>
                </div>
            ) 
        },
        { header: 'Periodo', accessor: 'period' as keyof Contribution },
        { 
            header: 'Monto Base', 
            accessor: (item: Contribution) => `$${Number(item.baseAmount).toFixed(2)}` 
        },
        { 
            header: 'Cotización', 
            accessor: (item: Contribution) => (
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    ${Number(item.contributionAmount).toFixed(2)}
                </span>
            ) 
        },
        { header: 'Patrono', accessor: 'employer' as keyof Contribution },
        { 
            header: 'Estado', 
            accessor: (item: Contribution) => (
                <span style={{ 
                    padding: '0.25rem 0.625rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    backgroundColor: item.status === 'paid' ? '#f0fdf4' : '#fff7ed',
                    color: item.status === 'paid' ? '#16a34a' : '#ea580c'
                }}>
                    {item.status?.toUpperCase()}
                </span>
            ) 
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                        Historial de Cotizaciones
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        Registro global de pagos y aportaciones a la seguridad social.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-primary" 
                        style={{ padding: '0.75rem 1.25rem', gap: '0.5rem' }}>
                        <CreditCard size={18} /> Crear Cotización
                    </button>
                    <button className="btn" style={{ padding: '0.75rem 1.25rem', gap: '0.5rem', backgroundColor: '#10b981', color: 'white', border: 'none' }}>
                        <Download size={18} /> Exportar
                    </button>
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
                            placeholder="Buscar por ciudadano o empresa..." 
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
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Institución</label>
                        <select 
                            style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0 0.5rem', color: '#1e293b' }}
                            value={filters.institution}
                            onChange={(e) => setFilters({...filters, institution: e.target.value})}
                        >
                            <option value="">Todas</option>
                            <option value="ISSS">ISSS</option>
                            <option value="AFP Crecer">AFP Crecer</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Fecha (Mes)</label>
                        <input 
                            type="month" 
                            style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0 0.5rem', color: '#1e293b' }} 
                            value={filters.month}
                            onChange={(e) => setFilters({...filters, month: e.target.value})}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Patrono</label>
                        <input 
                            type="text" 
                            placeholder="Nombre empresa" 
                            style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0 0.5rem', color: '#1e293b' }} 
                            value={filters.employer}
                            onChange={(e) => setFilters({...filters, employer: e.target.value})}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1.25rem', backgroundColor: '#ecfdf5', borderRadius: '8px', color: '#065f46', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #cefade' }}>
                            <CreditCard size={18} />
                            Total: $ {(filteredData.reduce((acc, curr) => acc + Number(curr.contributionAmount || 0), 0)).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            <DataTable columns={columns} data={filteredData} isLoading={loading} />

            {/* Modal de Creación */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CreditCard size={24} color="#3b82f6" /> Nueva Cotización
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                        </div>

                        {/* Paso 1: Buscar Afiliación */}
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Buscar por N° de Afiliación (ej. ISS-12345)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    type="text" 
                                    placeholder="Ingrese el N° de Afiliación"
                                    value={searchDui}
                                    onChange={(e) => setSearchDui(e.target.value)}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                                <button type="button" onClick={handleSearchAffiliation} disabled={isSearching} style={{ padding: '0 1rem', borderRadius: '8px', background: '#e2e8f0', color: '#475569', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                                    {isSearching ? '...' : 'Buscar'}
                                </button>
                            </div>
                            
                            {foundCitizen && (
                                <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#065f46', fontWeight: 600 }}>Usuario Encontrado:</p>
                                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#047857' }}>{foundCitizen.firstName} {foundCitizen.lastName} ({foundCitizen.idNumber})</p>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleCreateContribution} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: foundCitizen ? 1 : 0.5, pointerEvents: foundCitizen ? 'auto' : 'none' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Empresa (Patrono)</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Nombre de la empresa"
                                        value={newContribution.employer}
                                        onChange={(e) => setNewContribution({...newContribution, employer: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>NIT Empresa</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="0000-000000-000-0"
                                        value={newContribution.employerTaxId}
                                        onChange={(e) => setNewContribution({...newContribution, employerTaxId: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Periodo</label>
                                    <input 
                                        type="month" 
                                        required
                                        value={newContribution.period}
                                        onChange={(e) => setNewContribution({...newContribution, period: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Salario Base ($)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={newContribution.baseAmount}
                                        onChange={(e) => setNewContribution({...newContribution, baseAmount: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                        Cotización (7.5%): ${ newContribution.baseAmount ? (Number(newContribution.baseAmount) * 0.075).toFixed(2) : '0.00' }
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={isSubmitting || !foundCitizen} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: foundCitizen ? '#3b82f6' : '#94a3b8', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                                    {isSubmitting ? 'Guardando...' : 'Guardar Cotización'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContributionsPage;
