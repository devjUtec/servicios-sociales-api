import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DataTable } from '../components/common/DataTable';
import { 
    Search, Plus, Activity, User, X, FileText, CheckCircle, 
    AlertCircle, Stethoscope, Calendar, ClipboardList, MapPin, 
    MessageSquare, Hash, Briefcase, Filter, Loader2
} from 'lucide-react';

interface MedicalRecord {
    id: string;
    recordNumber: string;
    recordType: string;
    diagnosis: string;
    treatment: string;
    notes: string;
    visitDate: string;
    priority: string;
    status: string;
    createdAt: string;
    citizen: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface NewRecordForm {
    citizenId: string;
    recordNumber: string;
    recordType: string;
    diagnosis: string;
    treatment: string;
    primaryDoctor: string;
    specialty: string;
    department: string;
    visitDate: string;
    priority: string;
    notes: string;
}

const defaultForm: (doctorName?: string) => NewRecordForm = (doctorName) => ({
    citizenId: '',
    recordNumber: `EXP-${Date.now()}`,
    recordType: 'Consulta General',
    diagnosis: '',
    treatment: '',
    primaryDoctor: doctorName || '',
    specialty: '',
    department: '',
    visitDate: new Date().toISOString().split('T')[0],
    priority: 'normal',
    notes: '',
});

const MedicalRecordsPage: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<NewRecordForm>(defaultForm(user?.firstName ? `Dr/a. ${user.firstName} ${user.lastName || ''}` : ''));
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Búsqueda de Ciudadano
    const [affNumber, setAffNumber] = useState('');
    const [searchingCitizen, setSearchingCitizen] = useState(false);
    const [foundCitizen, setFoundCitizen] = useState<any>(null);

    const isDoctor = user?.roles?.includes('doctor') || user?.roles?.includes('super_admin');

    const fetchData = async () => {
        try {
            const response = await api.get('/medical-record');
            setData(response.data);
        } catch (err) {
            console.error('Error fetching medical records:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const searchCitizenByAffiliation = async () => {
        if (!affNumber.trim()) return;
        setSearchingCitizen(true);
        setFoundCitizen(null);
        try {
            // Buscamos directamente la afiliación por número
            const response = await api.get(`/affiliation/find/${affNumber.trim()}`);
            
            if (response.data && response.data.citizen) {
                setFoundCitizen(response.data.citizen);
                setForm({ ...form, citizenId: response.data.citizen.id });
                setToast({ type: 'success', message: 'Paciente identificado.' });
            } else {
                setToast({ type: 'error', message: 'No se encontró el carnet o el ciudadano.' });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Número de carnet no válido o inexistente.' });
        } finally {
            setSearchingCitizen(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    const filteredData = data.filter(item => {
        const matchesSearch =
            item.citizen.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.citizen.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = !filterDate || new Date(item.visitDate).toLocaleDateString() === new Date(filterDate).toLocaleDateString();
        return matchesSearch && matchesDate;
    });

    const handleOpenModal = () => {
        setForm({ ...defaultForm(user?.firstName ? `Dr/a. ${user.firstName} ${user.lastName || ''}` : ''), recordNumber: `EXP-${Date.now()}` });
        setAffNumber('');
        setFoundCitizen(null);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.citizenId) {
            setToast({ type: 'error', message: 'Debe buscar y seleccionar un paciente primero.' });
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/medical-record', {
                ...form,
                visitDate: new Date(form.visitDate).toISOString(),
            });
            setShowModal(false);
            setToast({ type: 'success', message: 'Consulta registrada exitosamente.' });
            await fetchData();
        } catch (err: any) {
            setToast({ type: 'error', message: err?.response?.data?.message || 'Error al registrar la consulta.' });
        } finally {
            setSubmitting(false);
            setTimeout(() => setToast(null), 4000);
        }
    };

    const priorityBadge = (p: string) => {
        const map: Record<string, { bg: string; color: string; label: string }> = {
            low: { bg: '#f0fdf4', color: '#166534', label: 'Baja' },
            normal: { bg: '#eff6ff', color: '#1e40af', label: 'Normal' },
            high: { bg: '#fff7ed', color: '#9a3412', label: 'Alta' },
            urgent: { bg: '#fef2f2', color: '#991b1b', label: 'Urgente' },
        };
        const s = map[p] || map['normal'];
        return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.color}20` }}>{s.label}</span>;
    };

    const columns = [
        {
            header: 'Paciente',
            accessor: (item: MedicalRecord) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                        <User size={18} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.citizen.firstName} {item.citizen.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.citizen.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'N° Expediente',
            accessor: (item: MedicalRecord) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>
                    <Hash size={14} /> {item.recordNumber}
                </div>
            )
        },
        {
            header: 'Diagnóstico',
            accessor: (item: MedicalRecord) => (
                <div style={{ 
                    maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', 
                    textOverflow: 'ellipsis', fontWeight: 600, color: '#334155' 
                }}>
                    <FileText size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#ef4444' }} />
                    {item.diagnosis || '—'}
                </div>
            )
        },
        {
            header: 'Prioridad',
            accessor: (item: MedicalRecord) => priorityBadge(item.priority)
        },
        {
            header: 'Fecha Visita',
            accessor: (item: MedicalRecord) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: 500 }}>
                    <Calendar size={14} /> {new Date(item.visitDate).toLocaleDateString()}
                </div>
            )
        },
        {
            header: 'Acciones',
            accessor: () => (
                <button style={{ 
                    color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2', 
                    padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', 
                    fontSize: '0.75rem', fontWeight: 700
                }}>
                    Detalles
                </button>
            )
        },
    ];

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem 1.5rem', borderRadius: '12px',
                    backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', 
                    fontWeight: 600, fontSize: '0.875rem'
                }}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {toast.message}
                </div>
            )}

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                        Historial de Consultas
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
                        Registro y seguimiento médico institucional.
                    </p>
                </div>
                {isDoctor && (
                    <button
                        onClick={handleOpenModal}
                        className="btn btn-primary"
                        style={{ 
                            padding: '0.875rem 1.5rem', gap: '0.75rem', 
                            backgroundColor: '#ef4444', borderRadius: '12px',
                            fontWeight: 700
                        }}
                    >
                        <Plus size={20} /> Registrar Consulta
                    </button>
                )}
            </div>

            {/* Filters Section */}
            <div style={{ border: '1px solid #f1f5f9', background: 'white', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 2, minWidth: '300px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Buscar por paciente, diagnóstico o N° expediente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                paddingLeft: '3rem', width: '100%', backgroundColor: '#f8fafc', 
                                border: '1px solid #e2e8f0', borderRadius: '12px', height: '48px',
                                fontSize: '0.95rem', color: '#1e293b'
                            }}
                        />
                    </div>
                    <button className="btn" style={{ height: '48px', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', gap: '0.6rem', padding: '0 1.25rem', borderRadius: '12px', fontWeight: 600 }} onClick={() => { setSearchTerm(''); setFilterDate(''); }}>
                        <Filter size={18} /> Limpiar
                    </button>
                    <div style={{ height: '48px', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1.5rem', backgroundColor: '#fef2f2', borderRadius: '12px', color: '#ef4444', fontSize: '1rem', fontWeight: 700, border: '1px solid #fee2e2' }}>
                        <ClipboardList size={20} /> {filteredData.length} Casos
                    </div>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                <DataTable columns={columns} data={filteredData} isLoading={loading} />
            </div>

            {/* Modal Nueva Consulta (REDISEÑADO + BÚSQUEDA POR AFILIACIÓN) */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '750px', maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                        {/* Header */}
                        <div style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Stethoscope size={24} color="#ef4444" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Registro de Consulta Médica</h2>
                                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Identifique al paciente por su carnet o afiliación</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                            
                            {/* PASO 1: BÚSQUEDA DE PACIENTE */}
                            <div style={{ marginBottom: '2.5rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: '#64748b' }}>
                                    <User size={16} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Búsqueda de Paciente</span>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: foundCitizen ? '1rem' : 0 }}>
                                    <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                        <label style={{ color: '#1e293b', fontWeight: 700 }}>N° de Afiliación (ISSS/AFP) *</label>
                                        <div style={{ position: 'relative' }}>
                                            <Hash size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input 
                                                required 
                                                placeholder="Ej: ISS-12345" 
                                                value={affNumber} 
                                                onChange={e => setAffNumber(e.target.value)} 
                                                style={{ paddingLeft: '2.75rem', backgroundColor: 'white', border: '1px solid #cbd5e1', height: '48px', color: '#0f172a' }} 
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={searchCitizenByAffiliation}
                                        disabled={searchingCitizen}
                                        style={{ height: '48px', padding: '0 1.5rem', borderRadius: '12px', background: '#0f172a', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                                    >
                                        {searchingCitizen ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                                        {searchingCitizen ? 'Buscando...' : 'Verificar'}
                                    </button>
                                </div>

                                {foundCitizen && (
                                    <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CheckCircle size={24} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>Paciente Identificado</p>
                                            <p style={{ margin: 0, fontSize: '1rem', color: '#047857', fontWeight: 800 }}>{foundCitizen.firstName} {foundCitizen.lastName}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* PASO 2: DATOS DE LA CONSULTA */}
                            <div style={{ opacity: foundCitizen ? 1 : 0.4, pointerEvents: foundCitizen ? 'all' : 'none', transition: 'all 0.3s' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label style={{ color: '#1e293b', fontWeight: 700 }}>Médico Responsable (Logueado)</label>
                                        <div style={{ position: 'relative' }}>
                                            <Stethoscope size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input disabled value={form.primaryDoctor} style={{ paddingLeft: '2.75rem', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', height: '48px', color: '#64748b', fontWeight: 600 }} />
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label style={{ color: '#1e293b', fontWeight: 700 }}>Prioridad de Atención</label>
                                        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: '100%', height: '48px', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0 1rem', color: '#0f172a', fontWeight: 600, backgroundColor: 'white' }}>
                                            <option value="low">Baja - Control</option>
                                            <option value="normal">Normal - Consulta</option>
                                            <option value="high">Alta - Urgente</option>
                                            <option value="urgent">Crítica - Emergencia</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label style={{ color: '#1e293b', fontWeight: 700 }}>Especialidad / Unidad</label>
                                        <div style={{ position: 'relative' }}>
                                            <Briefcase size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input placeholder="Ej: Medicina Interna" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} style={{ paddingLeft: '2.75rem', backgroundColor: 'white', border: '1px solid #cbd5e1', height: '48px', color: '#0f172a' }} />
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label style={{ color: '#1e293b', fontWeight: 700 }}>Departamento / Clínica</label>
                                        <div style={{ position: 'relative' }}>
                                            <MapPin size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input required placeholder="Ej: San Salvador" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={{ paddingLeft: '2.75rem', backgroundColor: 'white', border: '1px solid #cbd5e1', height: '48px', color: '#0f172a' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ color: '#1e293b', fontWeight: 700 }}>Diagnóstico Clínico *</label>
                                    <textarea required placeholder="Describa el diagnóstico..." value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} rows={3} style={{ width: '100%', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0.75rem', color: '#0f172a', fontSize: '0.95rem', fontWeight: 500, backgroundColor: 'white' }} />
                                </div>

                                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ color: '#1e293b', fontWeight: 700 }}>Plan de Tratamiento y Receta</label>
                                    <textarea placeholder="Medicamentos o indicaciones..." value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} rows={2} style={{ width: '100%', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0.75rem', color: '#0f172a', fontSize: '0.95rem', fontWeight: 500, backgroundColor: 'white' }} />
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.875rem 1.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={submitting || !foundCitizen} style={{ 
                                    padding: '0.875rem 2.25rem', borderRadius: '12px', border: 'none', 
                                    background: '#ef4444', color: 'white', fontWeight: 700, 
                                    cursor: (submitting || !foundCitizen) ? 'not-allowed' : 'pointer', 
                                    opacity: (submitting || !foundCitizen) ? 0.7 : 1, display: 'flex', 
                                    alignItems: 'center', gap: '0.75rem',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                                }}>
                                    {submitting ? 'Guardando...' : <><Plus size={20} /> Registrar Consulta</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicalRecordsPage;
