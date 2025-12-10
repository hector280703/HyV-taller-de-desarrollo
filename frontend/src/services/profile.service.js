import axios from './root.service.js';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert.js';

export async function updateProfile(data) {
    try {
        const response = await axios.put('/user/profile', data);
        showSuccessAlert('¡Perfil actualizado!', 'Tus datos han sido actualizados correctamente');
        return response.data;
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        const errorMessage = error.response?.data?.message || 'Error al actualizar el perfil';
        showErrorAlert('Error', errorMessage);
        throw error;
    }
}
