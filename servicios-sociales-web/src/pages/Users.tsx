import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DataTable } from '../components/common/DataTable';
import { 
    Search, UserPlus, Shield, X, Mail, User, Key, CheckCircle, 
    AlertCircle, Activity, Trash2, Edit 
} from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    roles: {
        role: {
            name: string;
        }
    }[];
}

const UsersPage: React.FC = () => {
    const [data, setData] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        roleName: 'doctor'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users');
            setData(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenCreate = () => {
        setIsEditing(false);
        setEditingId(null);
        setNewUser({ email: '', password: '', firstName: '', lastName: '', roleName: 'doctor' });
        setShowModal(true);
    };

    const handleOpenEdit = (user: UserData) => {
        setIsEditing(true);
        setEditingId(user.id);
        setNewUser({
            email: user.email,
            password: '', 
            firstName: user.firstName,
            lastName: user.lastName,
            roleName: user.roles[0]?.role.name || 'doctor'
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Está seguro de eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${id}`);
            setToast({ type: 'success', message: 'Usuario eliminado.' });
            await fetchData();
        } catch (err) {
            setToast({ type: 'error', message: 'Error al eliminar.' });
        } finally {
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing && editingId) {
                await api.patch(`/users/${editingId}`, {
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    email: newUser.email,
                    isActive: true
                });
                setToast({ type: 'success', message: 'Actualizado correctamente.' });
            } else {
                await api.post('/users', newUser);
                setToast({ type: 'success', message: 'Creado correctamente.' });
            }
            setShowModal(false);
            await fetchData();
        } catch (err: any) {
            setToast({ type: 'error', message: err?.response?.data?.message || 'Error en la operación.' });
        } finally {
            setSubmitting(false);
            setTimeout(() => setToast(null), 4000);
        }
    };

    const filteredData = data.filter(item => {
        const matchesSearch = 
            item.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !selectedRole || item.roles.some(r => r.role.name === selectedRole);
        return matchesSearch && matchesRole;
    });

    const columns = [
        { 
            header: 'Nombre Completo', 
            accessor: (item: UserData) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', border: '1px solid #e0f2fe' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{item.firstName[0]}{item.lastName[0]}</span>
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.firstName} {item.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.email}</div>
                    </div>
                </div>
            ) 
        },
        { 
            header: 'Rol', 
            accessor: (item: UserData) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={14} color="#6366f1" />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#4338ca', textTransform: 'capitalize', backgroundColor: '#eef2ff', padding: '2px 8px', borderRadius: '6px' }}>
                        {item.roles[0]?.role.name.replace('_', ' ') || 'Ninguno'}
                    </span>
                </div>
            )
        },
        { 
            header: 'Acciones', 
            accessor: (item: UserData) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenEdit(item)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' }}>
                        <Edit size={16}/>
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #fee2e2', background: 'white', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16}/>
                    </button>
                </div>
            ) 
        },
    ];

    // ESTILO COMÚN PARA INPUTS
    const inputStyle = {
        width: '100%',
        height: '48px',
        padding: '0 1rem 0 2.75rem',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#ffffff', // FORZAMOS BLANCO
        color: '#0f172a',           // FORZAMOS TEXTO OSCURO
        fontSize: '0.95rem',
        fontWeight: 500,
        outline: 'none',
        transition: 'border-color 0.2s'
    };

    return (
        <div>
            {toast && (
                <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', borderRadius: '12px', backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 600 }}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {toast.message}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Usuarios del Sistema</h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Personal con acceso a módulos internos.</p>
                </div>
                <button onClick={handleOpenCreate} className="btn btn-primary" style={{ padding: '0.875rem 1.5rem', gap: '0.75rem', backgroundColor: '#6366f1', borderRadius: '12px', fontWeight: 700 }}>
                    <UserPlus size={20} /> Crear Usuario
                </button>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 2, minWidth: '300px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="text" placeholder="Buscar usuarios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: '3rem', backgroundColor: '#f8fafc' }} />
                    </div>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                <DataTable columns={columns} data={filteredData} isLoading={loading} />
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '580px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSaveUser} style={{ padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label style={{ color: '#475569', fontWeight: 700 }}>Nombres *</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input required value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} style={inputStyle} />
                                    </div>
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label style={{ color: '#475569', fontWeight: 700 }}>Apellidos *</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input required value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} style={inputStyle} />
                                    </div>
                                </div>
                            </div>

                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ color: '#475569', fontWeight: 700 }}>Email Institucional *</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={inputStyle} />
                                </div>
                            </div>

                            {!isEditing && (
                                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ color: '#475569', fontWeight: 700 }}>Contraseña *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Key size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} style={inputStyle} />
                                    </div>
                                </div>
                            )}

                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ color: '#475569', fontWeight: 700 }}>Rol del Usuario *</label>
                                <div style={{ position: 'relative' }}>
                                    <Shield size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <select required value={newUser.roleName} onChange={e => setNewUser({...newUser, roleName: e.target.value})} style={{ ...inputStyle, paddingLeft: '2.75rem', fontWeight: 700 }}>
                                        <option value="doctor">Médico / Especialista</option>
                                        <option value="institution_staff">Staff Administrativo</option>
                                        <option value="super_admin">Super Administrador</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.875rem 1.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700 }}>Cancelar</button>
                                <button type="submit" disabled={submitting} style={{ padding: '0.875rem 2.25rem', borderRadius: '12px', border: 'none', background: '#6366f1', color: 'white', fontWeight: 700, pointerEvents: submitting ? 'none' : 'auto', opacity: submitting ? 0.7 : 1 }}>
                                    {submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Usuario')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
