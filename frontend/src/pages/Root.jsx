import { Outlet } from 'react-router-dom';
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
return (
    <>
        <Navbar />
        <Outlet />
    </>
);
}

export default Root;