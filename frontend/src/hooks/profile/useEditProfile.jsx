import { useState } from 'react';
import { updateProfile } from '@services/profile.service.js';

const useEditProfile = () => {
    const [errorNombreCompleto, setErrorNombreCompleto] = useState('');
    const [errorEmail, setErrorEmail] = useState('');
    const [errorRut, setErrorRut] = useState('');

    const handleUpdate = async (data) => {
        // Limpiar errores previos
        setErrorNombreCompleto('');
        setErrorEmail('');
        setErrorRut('');

        try {
            await updateProfile(data);
            return true;
        } catch (error) {
            if (error.response?.data?.details) {
                const details = error.response.data.details;
                
                details.forEach(detail => {
                    if (detail.path.includes('nombreCompleto')) {
                        setErrorNombreCompleto(detail.message);
                    } else if (detail.path.includes('email')) {
                        setErrorEmail(detail.message);
                    } else if (detail.path.includes('rut')) {
                        setErrorRut(detail.message);
                    }
                });
            }
            return false;
        }
    };

    return {
        handleUpdate,
        errorNombreCompleto,
        errorEmail,
        errorRut
    };
};

export default useEditProfile;
