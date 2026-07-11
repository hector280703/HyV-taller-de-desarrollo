import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '@services/auth.service.js';
import {
  HomeIcon,
  TruckIcon,
  BoxIcon,
  FileTextIcon,
  StoreIcon,
  ActivityIcon,
  UserIcon,
  CartIcon,
  LogOutIcon
} from './Icons';
import '@styles/adminDashboard.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const user = JSON.parse(sessionStorage.getItem('usuario')) || null;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/home';
  };

  if (user?.rol !== 'administrador') {
    return <Outlet />;
  }

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className={`admin-dashboard-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* SIDEBAR DE NAVEGACION COMPARTIDO Y DESPLEGABLE */}
      <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo_hyv.png" alt="HyV Logo" className="sidebar-logo" />
          {!isCollapsed && <h2>HyV Admin</h2>}
          <button 
            className="sidebar-toggle-btn" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? '❯' : '❮'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">{isCollapsed ? '•••' : 'Principal'}</div>
          <button className={`nav-item ${isActive('/admin/dashboard')}`} onClick={() => navigate('/admin/dashboard')} title="Dashboard">
            <HomeIcon size={18} />
            {!isCollapsed && <span>Dashboard</span>}
          </button>
          <button className={`nav-item ${isActive('/admin/orders')}`} onClick={() => navigate('/admin/orders')} title="Pedidos">
            <TruckIcon size={18} />
            {!isCollapsed && <span>Pedidos</span>}
          </button>
          <button className={`nav-item ${isActive('/inventory')}`} onClick={() => navigate('/inventory')} title="Inventario">
            <BoxIcon size={18} />
            {!isCollapsed && <span>Inventario</span>}
          </button>
          
          <div className="nav-section-title">{isCollapsed ? '•••' : 'Contabilidad y Logística'}</div>
          <button className={`nav-item ${isActive('/invoices')}`} onClick={() => navigate('/invoices')} title="Facturas">
            <FileTextIcon size={18} />
            {!isCollapsed && <span>Facturas</span>}
          </button>
          <button className={`nav-item ${isActive('/warehouses')}`} onClick={() => navigate('/warehouses')} title="Almacenes">
            <StoreIcon size={18} />
            {!isCollapsed && <span>Almacenes</span>}
          </button>
          <button className={`nav-item ${isActive('/stock-movements')}`} onClick={() => navigate('/stock-movements')} title="Movimiento Stock">
            <ActivityIcon size={18} />
            {!isCollapsed && <span>Movimiento Stock</span>}
          </button>

          <div className="nav-section-title">{isCollapsed ? '•••' : 'Personal'}</div>
          <button className={`nav-item ${isActive('/users')}`} onClick={() => navigate('/users')} title="Usuarios">
            <UserIcon size={18} />
            {!isCollapsed && <span>Usuarios</span>}
          </button>
          <button className={`nav-item ${isActive('/vendedor-presencial')}`} onClick={() => navigate('/vendedor-presencial')} title="Venta Presencial">
            <CartIcon size={18} />
            {!isCollapsed && <span>Venta Presencial</span>}
          </button>
        </nav>

        {/* Profile Card & Log Out */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="user-profile-summary">
              <div className="avatar-letter">
                {user?.nombreCompleto?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="user-profile-info">
                <span className="profile-name">{user?.nombreCompleto || 'Administrador'}</span>
                <span className="profile-role">Admin General</span>
              </div>
            </div>
          )}
          <button className="btn-logout" onClick={handleLogout} title="Cerrar Sesión">
            <LogOutIcon size={18} />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ESPACIO DE TRABAJO DINÁMICO */}
      <div className="admin-dashboard-layout-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
