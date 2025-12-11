import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useEditProfile from '@hooks/profile/useEditProfile';
import '@styles/profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('usuario')) || null;
    const { handleUpdate, errorNombreCompleto, errorEmail, errorRut } = useEditProfile();

    const [formData, setFormData] = useState({
        nombreCompleto: '',
        email: '',
        rut: '',
        telefono: '',
        direccion: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        setFormData({
            nombreCompleto: user.nombreCompleto || '',
            email: user.email || '',
            rut: user.rut || '',
            telefono: user.telefono || '',
            direccion: user.direccion || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    }, [user, navigate]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (field === 'newPassword' || field === 'confirmPassword') {
            setPasswordError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones básicas
        if (!formData.nombreCompleto || formData.nombreCompleto.trim().length < 3) {
            setPasswordError('El nombre debe tener al menos 3 caracteres');
            return;
        }

        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setPasswordError('Ingresa un email válido');
            return;
        }

        if (!formData.rut || formData.rut.trim().length < 9) {
            setPasswordError('Ingresa un RUT válido');
            return;
        }

        if (formData.telefono && !/^\+?[\d\s-]{8,20}$/.test(formData.telefono)) {
            setPasswordError('Ingresa un teléfono válido');
            return;
        }

        if (formData.direccion && formData.direccion.length > 500) {
            setPasswordError('La dirección no debe exceder 500 caracteres');
            return;
        }

        // Validar contraseñas si se está cambiando
        if (showPasswordSection) {
            if (!formData.currentPassword) {
                setPasswordError('Debes ingresar tu contraseña actual');
                return;
            }
            if (formData.currentPassword.length < 8) {
                setPasswordError('La contraseña actual debe tener al menos 8 caracteres');
                return;
            }
            if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
                setPasswordError('Las contraseñas nuevas no coinciden');
                return;
            }
            if (formData.newPassword && formData.newPassword.length < 8) {
                setPasswordError('La nueva contraseña debe tener al menos 8 caracteres');
                return;
            }
            if (formData.newPassword && formData.newPassword === formData.currentPassword) {
                setPasswordError('La nueva contraseña debe ser diferente a la actual');
                return;
            }
        }

        const dataToUpdate = {
            nombreCompleto: formData.nombreCompleto.trim(),
            email: formData.email.trim(),
            rut: formData.rut.trim(),
            telefono: formData.telefono?.trim() || '',
            direccion: formData.direccion?.trim() || ''
        };

        if (showPasswordSection && formData.newPassword) {
            dataToUpdate.currentPassword = formData.currentPassword;
            dataToUpdate.newPassword = formData.newPassword;
        }

        const success = await handleUpdate(dataToUpdate);
        
        if (success) {
            // Actualizar sessionStorage con los nuevos datos
            const updatedUser = {
                ...user,
                nombreCompleto: formData.nombreCompleto.trim(),
                email: formData.email.trim(),
                rut: formData.rut.trim(),
                telefono: formData.telefono?.trim() || '',
                direccion: formData.direccion?.trim() || ''
            };
            sessionStorage.setItem('usuario', JSON.stringify(updatedUser));
            
            // Limpiar campos de contraseña
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
            setShowPasswordSection(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar-large">
                        {user.nombreCompleto?.charAt(0).toUpperCase() || '👤'}
                    </div>
                    <h1>Mi Perfil</h1>
                    <p className="profile-role-badge">
                        {user.rol === 'administrador' ? '👑 Administrador' : '👤 Usuario'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-section">
                        <h2>Información Personal</h2>
                        
                        <div className="form-group">
                            <label htmlFor="nombreCompleto">
                                <span className="label-icon">👤</span>
                                Nombre Completo
                            </label>
                            <input
                                type="text"
                                id="nombreCompleto"
                                value={formData.nombreCompleto}
                                onChange={(e) => handleInputChange('nombreCompleto', e.target.value)}
                                placeholder="Juan Pérez"
                                required
                            />
                            {errorNombreCompleto && (
                                <span className="error-message">{errorNombreCompleto}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                <span className="label-icon">📧</span>
                                Correo Electrónico
                            </label>
                            <input
                                type="text"
                                id="email"
                                name="email-profile"
                                value={formData.email || ''}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="ejemplo@gmail.com"
                                required
                                autoComplete="new-password"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                data-form-type="other"
                            />
                            {errorEmail && (
                                <span className="error-message">{errorEmail}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="rut">
                                <span className="label-icon">🆔</span>
                                RUT
                            </label>
                            <input
                                type="text"
                                id="rut"
                                value={formData.rut}
                                onChange={(e) => handleInputChange('rut', e.target.value)}
                                placeholder="12345678-9"
                                required
                            />
                            {errorRut && (
                                <span className="error-message">{errorRut}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="telefono">
                                <span className="label-icon">📱</span>
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                id="telefono"
                                value={formData.telefono}
                                onChange={(e) => handleInputChange('telefono', e.target.value)}
                                placeholder="+56 9 1234 5678"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="direccion">
                                <span className="label-icon">📍</span>
                                Dirección
                            </label>
                            <input
                                type="text"
                                id="direccion"
                                value={formData.direccion}
                                onChange={(e) => handleInputChange('direccion', e.target.value)}
                                placeholder="Calle 123, Ciudad"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="password-section-header">
                            <h2>Seguridad</h2>
                            <button
                                type="button"
                                className="toggle-password-btn"
                                onClick={() => setShowPasswordSection(!showPasswordSection)}
                            >
                                {showPasswordSection ? '🔒 Cancelar cambio' : '🔑 Cambiar contraseña'}
                            </button>
                        </div>

                        {showPasswordSection && (
                            <div className="password-fields">
                                <div className="form-group">
                                    <label htmlFor="currentPassword">
                                        <span className="label-icon">🔐</span>
                                        Contraseña Actual
                                    </label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="newPassword">
                                        <span className="label-icon">🔑</span>
                                        Nueva Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        value={formData.newPassword}
                                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">
                                        <span className="label-icon">✅</span>
                                        Confirmar Nueva Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>

                                {passwordError && (
                                    <span className="error-message">{passwordError}</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => navigate(-1)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="btn-save">
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
