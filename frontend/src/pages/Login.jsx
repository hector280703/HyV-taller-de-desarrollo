import { useNavigate } from 'react-router-dom';
import { login } from '@services/auth.service.js';
import Form from '@components/Form';
import useLogin from '@hooks/auth/useLogin.jsx';
import { HomeIcon } from '../components/Icons';
import '@styles/form.css';

const Login = () => {
    const navigate = useNavigate();
    const {
        errorEmail,
        errorPassword,
        errorData,
        handleInputChange
    } = useLogin();

    const loginSubmit = async (data) => {
        try {
            const response = await login(data);
            if (response.status === 'Success') {
                window.location.href = '/home';
            } else if (response.status === 'Client error') {
                errorData(response.details);
            }
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <main className="auth-container">
            <div className="auth-sidebar">
                <div className="auth-sidebar-content">
                    <img src="/logo_hyv.png" alt="HyV Construcciones" className="auth-sidebar-logo" />
                    <h1>HyV Construcciones</h1>
                    <p className="auth-sidebar-desc">
                        Todo en materiales de construcción para tus proyectos. Calidad y asesoría profesional en Laraquete.
                    </p>
                </div>
            </div>
            <div className="auth-form-content">
                <button className="auth-back-btn" onClick={() => navigate('/home')}>
                    <HomeIcon size={18} />
                    <span>Volver al Inicio</span>
                </button>
                <Form
                    title="Iniciar sesión"
                    fields={[
                        {
                            label: "Correo electrónico",
                            name: "email",
                            placeholder: "example@gmail.com",
                            fieldType: 'input',
                            type: "email",
                            required: true,
                            minLength: 15,
                            maxLength: 30,
                            errorMessageData: errorEmail,
                            validate: {
                                emailDomain: (value) => value.endsWith('@gmail.cl') || value.endsWith('@gmail.com') || 'El correo debe terminar en @gmail.cl o @gmail.com'
                            },
                            onChange: (e) => handleInputChange('email', e.target.value),
                        },
                        {
                            label: "Contraseña",
                            name: "password",
                            placeholder: "**********",
                            fieldType: 'input',
                            type: "password",
                            required: true,
                            minLength: 8,
                            maxLength: 26,
                            pattern: /^[a-zA-Z0-9]+$/,
                            patternMessage: "Debe contener solo letras y números",
                            errorMessageData: errorPassword,
                            onChange: (e) => handleInputChange('password', e.target.value)
                        },
                    ]}
                    buttonText="Iniciar sesión"
                    onSubmit={loginSubmit}
                    footerContent={
                        <p>
                            ¿No tienes cuenta?, <a href="/register">¡Regístrate aquí!</a>
                        </p>
                    }
                />
            </div>
        </main>
    );
};

export default Login;