import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { logout, login } from '@services/auth.service.js';
import { useCarroCompras } from '@context/CarroComprasContext';
import '@styles/navbar.css';
import { useState } from "react";
import useLogin from '@hooks/auth/useLogin.jsx';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { obtenerCantidadItems } = useCarroCompras();
    const cantidadItemsCarrito = obtenerCantidadItems();
    const user = JSON.parse(sessionStorage.getItem('usuario')) || '';
    const userRole = user?.rol;
    const isAuthenticated = user ? true : false;
    const [menuOpen, setMenuOpen] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);
    
    const {
        errorEmail,
        errorPassword,
        errorData,
        handleInputChange
    } = useLogin();

    const logoutSubmit = () => {
        try {
            logout();
            sessionStorage.removeItem('usuario');
            window.location.reload();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const loginSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        
        try {
            const response = await login(data);
            if (response.status === 'Success') {
                setShowLoginForm(false);
                window.location.reload();
            } else if (response.status === 'Client error') {
                errorData(response.details);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const toggleMenu = () => {
        if (!menuOpen) {
            removeActiveClass();
        } else {
            addActiveClass();
        }
        setMenuOpen(!menuOpen);
    };

    const removeActiveClass = () => {
        const activeLinks = document.querySelectorAll('.nav-menu ul li a.active');
        activeLinks.forEach(link => link.classList.remove('active'));
    };

    const addActiveClass = () => {
        const links = document.querySelectorAll('.nav-menu ul li a');
        links.forEach(link => {
            if (link.getAttribute('href') === location.pathname) {
                link.classList.add('active');
            }
        });
    };

    return (
        <nav className="navbar">
            <div className={`nav-menu ${menuOpen ? 'activado' : ''}`}>
                <ul>
                    <li>
                        <NavLink 
                            to="/home" 
                            onClick={() => { 
                                setMenuOpen(false); 
                                addActiveClass();
                            }} 
                            activeClassName="active"
                        >
                            Inicio
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/products" 
                            onClick={() => { 
                                setMenuOpen(false); 
                                addActiveClass();
                            }} 
                            activeClassName="active"
                        >
                            Productos
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/carroCompras" 
                            onClick={() => { 
                                setMenuOpen(false); 
                                addActiveClass();
                            }} 
                            activeClassName="active"
                            className="cart-nav-link"
                        >
                            🛒 Carrito
                            {cantidadItemsCarrito > 0 && (
                                <span className="cart-badge">{cantidadItemsCarrito}</span>
                            )}
                        </NavLink>
                    </li>
                    {isAuthenticated && userRole === 'administrador' && (
                        <li>
                            <NavLink 
                                to="/users" 
                                onClick={() => { 
                                    setMenuOpen(false); 
                                    addActiveClass();
                                }} 
                                activeClassName="active"
                            >
                                Usuarios
                            </NavLink>
                        </li>
                    )}
                    {!isAuthenticated ? (
                        <li className="login-nav-item">
                            <button 
                                className="login-btn" 
                                onClick={() => setShowLoginForm(!showLoginForm)}
                            >
                                {showLoginForm ? 'Cerrar' : 'Iniciar Sesión'}
                            </button>
                        </li>
                    ) : (
                        <li>
                            <button 
                                className="logout-btn"
                                onClick={() => { 
                                    logoutSubmit(); 
                                    setMenuOpen(false); 
                                }} 
                            >
                                Cerrar sesión
                            </button>
                        </li>
                    )}
                </ul>
            </div>
            
            {showLoginForm && !isAuthenticated && (
                <div className="login-form-container">
                    <form className="navbar-login-form" onSubmit={loginSubmit} autoComplete="off">
                        <div className="form-group">
                            <label htmlFor="email">Correo electrónico</label>
                            <input
                                type="text"
                                id="email"
                                name="email"
                                placeholder="example@gmail.cl"
                                required
                                autoComplete="new-password"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                onChange={(e) => handleInputChange('email', e.target.value)}
                            />
                            {errorEmail && <span className="error-message">{errorEmail}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Contraseña</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="**********"
                                required
                                autoComplete="new-password"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                onChange={(e) => handleInputChange('password', e.target.value)}
                            />
                            {errorPassword && <span className="error-message">{errorPassword}</span>}
                        </div>
                        <button type="submit" className="submit-btn">Entrar</button>
                        <p className="register-link">
                            ¿No tienes cuenta? <a href="/register">¡Regístrate aquí!</a>
                        </p>
                    </form>
                </div>
            )}
            
            <div className="hamburger" onClick={toggleMenu}>
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
            </div>
        </nav>
    );
};

export default Navbar;