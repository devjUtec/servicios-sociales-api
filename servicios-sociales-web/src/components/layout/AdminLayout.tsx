import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, FileText, Activity, 
  Database, Settings, LogOut, ChevronRight, UserCircle 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['super_admin', 'admin', 'staff', 'institution_staff', 'doctor'] },
  { title: 'Afiliaciones', path: '/dashboard/affiliations', icon: <Users size={20} />, roles: ['super_admin', 'admin', 'staff', 'institution_staff'] },
  { title: 'Cotizaciones', path: '/dashboard/contributions', icon: <Database size={20} />, roles: ['super_admin', 'admin', 'staff', 'institution_staff'] },
  { title: 'Expedientes', path: '/dashboard/medical-records', icon: <Activity size={20} />, roles: ['super_admin', 'admin', 'staff', 'institution_staff', 'doctor'] },
  { title: 'Usuarios', path: '/dashboard/users', icon: <UserCircle size={20} />, roles: ['super_admin'] },
  { title: 'Auditoría', path: '/dashboard/audit', icon: <FileText size={20} />, roles: ['super_admin', 'admin'] },
  { title: 'Configuración', path: '/dashboard/settings', icon: <Settings size={20} />, roles: ['super_admin'] },
];

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const filteredMenu = menuItems.filter(item => 
    item.roles.some(role => user?.roles?.includes(role))
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        backgroundColor: '#0f172a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', background: '#2563eb', borderRadius: '8px' }}></div>
            SIS-SOCIAL
          </h2>
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 0.75rem' }}>
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  textDecoration: 'none',
                  color: isActive ? 'white' : '#94a3b8',
                  backgroundColor: isActive ? '#1e293b' : 'transparent',
                  borderRadius: '8px',
                  marginBottom: '0.25rem',
                  transition: 'all 0.2s',
                  fontSize: '0.9375rem',
                  fontWeight: 500
                }}>
                {item.icon}
                {item.title}
                {isActive && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid #1e293b' }}>
          <button 
            onClick={() => logout()}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: 'transparent',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: 500,
              textAlign: 'left'
            }}>
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{
          height: '64px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{user?.firstName} {user?.lastName}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{user?.roles?.join(', ')}</p>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#e2e8f0',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}>
              <UserCircle size={28} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <div className="container" style={{ maxWidth: '100%' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
