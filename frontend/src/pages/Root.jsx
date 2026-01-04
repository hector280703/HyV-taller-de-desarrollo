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

    return (
        <>
            {!isRepartidor && <Navbar />}
            <Outlet />
        </>
    );
}

export default Root;