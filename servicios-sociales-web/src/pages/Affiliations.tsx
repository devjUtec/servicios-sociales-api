import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DataTable } from '../components/common/DataTable';
import { Search, Plus, Filter, User, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Affiliation {
    id: string;
    affiliationNumber: string;
    affiliationType: string;
    institutionType: string;
    employer: string;
    createdAt: string;
    citizen: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

const AffiliationsPage: React.FC = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.roles?.includes('super_admin');
    const [data, setData] = useState<Affiliation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        institution: '',
        date: '',
        employer: ''
    });
    const [showModal, setShowModal] = useState(false);
    const [newAffiliation, setNewAffiliation] = useState({
        firstName: '',
        lastName: '',
        email: '',
        idNumber: '',
        affiliationType: 'Trabajador Activo',
        institutionType: 'ISSS',
        employer: '',
        employerTaxId: '',
        department: 'San Salvador',
        observations: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/affiliation');
                setData(response.data);
            } catch (err) {
                console.error('Error fetching affiliations:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/affiliation', newAffiliation);
            setShowModal(false);
            // Reset form
            setNewAffiliation({
                firstName: '',
                lastName: '',
                email: '',
                idNumber: '',
                affiliationType: 'Trabajador Activo',
                institutionType: 'ISSS',
                employer: '',
                employerTaxId: '',
                department: 'San Salvador',
                observations: ''
            });
            // Refresh data
            const response = await api.get('/affiliation');
            setData(response.data);
        } catch (err) {
            console.error('Error creating affiliation:', err);
            alert('Error al crear la afiliación. Verifica los datos.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta afiliación?')) return;
        try {
            await api.delete(`/affiliation/${id}`);
            setData(data.filter(item => item.id !== id));
        } catch (err) {
            console.error('Error deleting affiliation:', err);
            alert('Error al eliminar la afiliación.');
        }
    };

    const uniqueEmployers = Array.from(new Set(data.map(d => d.employer).filter(Boolean)));


    const filteredData = data.filter(item => {
        const matchesSearch = 
            item.citizen.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.citizen.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.affiliationNumber.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesInstitution = !filters.institution || item.institutionType === filters.institution;
        const matchesEmployer = !filters.employer || (item.employer || '').toLowerCase().includes(filters.employer.toLowerCase());
        const matchesDate = !filters.date || new Date(item.createdAt).toLocaleDateString() === new Date(filters.date).toLocaleDateString();

        return matchesSearch && matchesInstitution && matchesEmployer && matchesDate;
    });

    const columns = [
        { 
            header: 'Ciudadano', 
            accessor: (item: Affiliation) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                        <User size={16} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{item.citizen.firstName} {item.citizen.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.citizen.email}</div>
                    </div>
                </div>
            ) 
        },
        { header: 'N° Afiliación', accessor: 'affiliationNumber' as keyof Affiliation },
        { 
            header: 'Institución', 
            accessor: (item: Affiliation) => (
                <span style={{ 
                    padding: '0.25rem 0.625rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem', 
                    fontWeight: 500,
                    backgroundColor: item.institutionType === 'ISSS' ? '#eff6ff' : '#f0fdf4',
                    color: item.institutionType === 'ISSS' ? '#3b82f6' : '#22c55e'
                }}>
                    {item.institutionType}
                </span>
            ) 
        },
        { header: 'Patrono / Empresa', accessor: 'employer' as keyof Affiliation },
        { 
            header: 'Fecha Reg.', 
            accessor: (item: Affiliation) => new Date(item.createdAt).toLocaleDateString() 
        },
        ...(isSuperAdmin ? [{
            header: 'Acciones',
            accessor: (item: Affiliation) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => alert('Edición en construcción...')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.25rem' }} title="Editar">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }} title="Eliminar">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }] : [])
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                        Gestión de Afiliaciones
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        Visualiza y administra todos los ciudadanos afiliados al sistema.
                    </p>
                </div>
                <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.75rem 1.25rem', gap: '0.5rem', display: 'flex', alignItems: 'center' }}
                    onClick={() => setShowModal(true)}
                >
                    <Plus size={18} /> Nueva Afiliación
                </button>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '16px',
                        width: '500px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ color: '#0f172a', marginBottom: '1.5rem' }}>Crear Nueva Afiliación</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Nombres</label>
                                    <input 
                                        type="text" 
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        value={newAffiliation.firstName}
                                        onChange={(e) => setNewAffiliation({...newAffiliation, firstName: e.target.value})}
                                        placeholder="Ej: Juan"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Apellidos</label>
                                    <input 
                                        type="text" 
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        value={newAffiliation.lastName}
                                        onChange={(e) => setNewAffiliation({...newAffiliation, lastName: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Correo / Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        value={newAffiliation.email}
                                        onChange={(e) => setNewAffiliation({...newAffiliation, email: e.target.value})}
                                        placeholder="Ej: juan@example.com"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>DUI (ID)</label>
                                    <input 
                                        type="text" 
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        value={newAffiliation.idNumber}
                                        onChange={(e) => setNewAffiliation({...newAffiliation, idNumber: e.target.value})}
                                        placeholder="Formato: 00000000-0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginBottom: '0.5rem' }}>* El sistema creará al ciudadano si no existe, o lo enlazarla automáticamente mediante el DUI.</label>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Tipo Afiliación</label>
                                    <input 
                                        type="text" 
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        value={newAffiliation.affiliationType}
                                        onChange={(e) => setNewAffiliation({...newAffiliation, affiliationType: e.target.value})}
                                        placeholder="Ej: Cotizante Activo"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Institución</label>
                                    <select 
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        value={newAffiliation.institutionType}
                                        onChange={(e) => setNewAffiliation({...newAffiliation, institutionType: e.target.value})}
                                    >
                                        <option value="ISSS">ISSS</option>
                                        <option value="AFP Crecer">AFP Crecer</option>
                                        <option value="ISBM">ISBM</option>
                                        <option value="IPSFA">IPSFA</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Departamento</label>
                                    <input 
                                        type="text" 
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        value={newAffiliation.department}
                                        onChange={(e) => setNewAffiliation({...newAffiliation, department: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Patrono / Empresa</label>
                                <input 
                                    type="text" 
                                    list="employers-list"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    value={newAffiliation.employer}
                                    onChange={(e) => setNewAffiliation({...newAffiliation, employer: e.target.value})}
                                />
                                <datalist id="employers-list">
                                    {uniqueEmployers.map((emp, index) => (
                                        <option key={index} value={emp} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>NIT Patrono</label>
                                <input 
                                    type="text" 
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    value={newAffiliation.employerTaxId}
                                    onChange={(e) => setNewAffiliation({...newAffiliation, employerTaxId: e.target.value})}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Observaciones</label>
                                <textarea 
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px' }}
                                    value={newAffiliation.observations}
                                    onChange={(e) => setNewAffiliation({...newAffiliation, observations: e.target.value})}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', position: 'sticky', bottom: 0, background: 'white', padding: '1rem 0' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, border: '1px solid #e2e8f0' }}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar Afiliación</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) }

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
                            placeholder="Buscar por nombre o número de afiliación..." 
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
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Fecha Registro</label>
                        <input 
                            type="date" 
                            style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0 0.5rem', color: '#1e293b' }} 
                            value={filters.date}
                            onChange={(e) => setFilters({...filters, date: e.target.value})}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Patrono / Empresa</label>
                        <input 
                            type="text" 
                            placeholder="Filtrar por empresa" 
                            style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0 0.5rem', color: '#1e293b' }} 
                            value={filters.employer}
                            onChange={(e) => setFilters({...filters, employer: e.target.value})}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <button 
                            className="btn" 
                            style={{ height: '40px', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', gap: '0.5rem' }}
                            onClick={() => {
                                setSearchTerm('');
                                setFilters({ institution: '', date: '', employer: '' });
                            }}
                        >
                            <Filter size={18} /> Limpiar
                        </button>
                    </div>
                </div>
            </div>

            <DataTable columns={columns} data={filteredData} isLoading={loading} />
        </div>
    );
};

export default AffiliationsPage;
