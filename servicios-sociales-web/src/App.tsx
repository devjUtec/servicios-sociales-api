import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import CitizenLoginPage from './pages/CitizenLogin';
import StaffLoginPage from './pages/StaffLogin';
import Dashboard from './pages/Dashboard';
import AffiliationsPage from './pages/Affiliations';
import ContributionsPage from './pages/Contributions';
import MedicalRecordsPage from './pages/MedicalRecords';
import UsersPage from './pages/Users';
import AuditPage from './pages/Audit';
import CitizenDashboard from './pages/CitizenDashboard';
import CitizenRegisterPage from './pages/CitizenRegister';
import ActivateAccountPage from './pages/ActivateAccount';
import CitizenActivatePage from './pages/CitizenActivate';
import AdminLayout from './components/layout/AdminLayout';

// Bloquea acceso si el usuario no autenticado intenta entrar al dashboard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <div style={{ padding: '2rem', color: 'white' }}>Verificando credenciales...</div>;
    return isAuthenticated ? <>{children}</> : <Navigate to="/staff-gate" />;
};

// Bloquea acceso si el usuario no tiene al menos uno de los roles requeridos
const RoleRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
    const { user } = useAuth();
    const hasRole = allowedRoles.some(role => user?.roles?.includes(role));
    if (!hasRole) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '4rem 2rem', textAlign: 'center'
            }}>
                <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '2rem', marginBottom: '1.5rem'
                }}>
                    🔒
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                    Acceso Denegado
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.9375rem', maxWidth: '400px', lineHeight: 1.6 }}>
                    No tienes permisos para acceder a esta sección. Contacta con un administrador si crees que esto es un error.
                </p>
                <p style={{ marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.8125rem' }}>
                    Tu rol actual: <strong style={{ color: '#475569' }}>{user?.roles?.join(', ')}</strong>
                </p>
            </div>
        );
    }
    return <>{children}</>;
};

function App() {
    // CAPTURAR TOKENS DE OAUTH (GOOGLE/AZURE)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenToken = urlParams.get('token');
        const refresh = urlParams.get('refresh');
        const userStr = urlParams.get('user');

        if (tokenToken && refresh && userStr) {
            try {
                const userData = JSON.parse(decodeURIComponent(userStr));
                localStorage.setItem('accessToken', tokenToken);
                localStorage.setItem('refreshToken', refresh);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Limpiar la URL de parámetros feos
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
                
                // Recargar para que el AuthContext se actualice
                window.location.reload();
            } catch (e) {
                console.error("Error procesando login de OAuth", e);
            }
        }
    }, []);

    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Portal Público para Ciudadanos */}
                    <Route path="/portal" element={<CitizenLoginPage />} />
                    <Route path="/portal/activate" element={<CitizenActivatePage />} />

                    <Route path="/register" element={<CitizenRegisterPage />} />
                    <Route path="/activate-account" element={<ActivateAccountPage />} />
                    
                    <Route 
                        path="/portal/me" 
                        element={
                            <ProtectedRoute>
                                <CitizenDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Puerta de Enlace Oculta para Personal */}
                    <Route path="/staff-gate" element={<StaffLoginPage />} />
                    
                    {/* Dashboard Administrativo Protegido con Layout */}
                    <Route 
                        path="/dashboard/*" 
                        element={
                            <ProtectedRoute>
                                <AdminLayout>
                                    <Routes>
                                        <Route index element={
                                            <RoleRoute allowedRoles={['super_admin', 'admin', 'institution_staff', 'staff', 'doctor']}>
                                                <Dashboard />
                                            </RoleRoute>
                                        } />
                                        
                                        {/* Solo super_admin e institution_staff (según tu DB) */}
                                        <Route path="affiliations" element={
                                            <RoleRoute allowedRoles={['super_admin', 'admin', 'institution_staff', 'staff']}>
                                                <AffiliationsPage />
                                            </RoleRoute>
                                        } />

                                        <Route path="contributions" element={
                                            <RoleRoute allowedRoles={['super_admin', 'admin', 'institution_staff', 'staff']}>
                                                <ContributionsPage />
                                            </RoleRoute>
                                        } />

                                        {/* Solo super_admin, staff y doctores */}
                                        <Route path="medical-records" element={
                                            <RoleRoute allowedRoles={['super_admin', 'admin', 'institution_staff', 'staff', 'doctor']}>
                                                <MedicalRecordsPage />
                                            </RoleRoute>
                                        } />

                                        {/* Solo super_admin y admin */}
                                        <Route path="users" element={
                                            <RoleRoute allowedRoles={['super_admin', 'admin']}>
                                                <UsersPage />
                                            </RoleRoute>
                                        } />

                                        <Route path="audit" element={
                                            <RoleRoute allowedRoles={['super_admin', 'admin']}>
                                                <AuditPage />
                                            </RoleRoute>
                                        } />

                                        <Route path="settings" element={<div style={{ padding: '2rem' }}>Configuración (Próximamente)</div>} />
                                    </Routes>
                                </AdminLayout>
                            </ProtectedRoute>
                        } 
                    />

                    {/* Redirección por defecto al Portal del Ciudadano */}
                    <Route path="/" element={<Navigate to="/portal" />} />
                    <Route path="*" element={<Navigate to="/portal" />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
