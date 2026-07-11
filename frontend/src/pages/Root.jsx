import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '@components/Navbar';
import { AuthProvider } from '@context/AuthContext';
import { CarroComprasProvider } from '@context/CarroComprasContext';

function Root()  {
return (
    <AuthProvider>
        <CarroComprasProvider>
            <PageRoot/>
        </CarroComprasProvider>
    </AuthProvider>
);
}

function PageRoot() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(sessionStorage.getItem('usuario'));
    const isRepartidor = user?.rol === 'repartidor';
    
    useEffect(() => {
        // Si es repartidor, solo puede acceder a /repartidor
        if (user && user.rol === 'repartidor') {
            const allowedPaths = ['/repartidor'];
            if (!allowedPaths.includes(location.pathname)) {
                navigate('/repartidor', { replace: true });
            }
        }
    }, [location.pathname, navigate]);

    const adminPaths = [
        '/admin/dashboard',
        '/admin/orders',
        '/inventory',
        '/warehouses',
        '/invoices',
        '/stock-movements',
        '/users',
        '/vendedor-presencial'
    ];
    const isAuthPath = ['/register', '/login'].includes(location.pathname);
    const isAdminPath = adminPaths.includes(location.pathname);
    const isAdmin = user?.rol === 'administrador';
    
    const shouldHideNavbar = isRepartidor || isAuthPath || (isAdmin && (isAdminPath || location.pathname === '/' || location.pathname === '/home'));

    return (
        <>
            {!shouldHideNavbar && <Navbar />}
            <Outlet />
        </>
    );
}

export default Root;