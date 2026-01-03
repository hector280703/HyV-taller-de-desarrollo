import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { logout, login } from '@services/auth.service.js';
import { useCarroCompras } from '@context/CarroComprasContext';
import '@styles/navbar.css';
import { useState, useEffect } from "react";
import useLogin from '@hooks/auth/useLogin.jsx';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { obtenerCantidadItems, limpiarCarritoUsuario } = useCarroCompras();
    const cantidadItemsCarrito = obtenerCantidadItems();
    const user = JSON.parse(sessionStorage.getItem('usuario')) || '';
    const userRole = user?.rol;
    const isAuthenticated = user ? true : false;
    const [menuOpen, setMenuOpen] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const {
        errorEmail,
        errorPassword,
        errorData,
        handleInputChange
    } = useLogin();

    // Efecto para detectar scroll
    useEffect(() => {
        const handleScroll = () => {
            const offset = window.scrollY;
            setScrolled(offset > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Cerrar menús al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserMenu && !event.target.closest('.user-menu-container')) {
                setShowUserMenu(false);
            }
            if (showSearch && !event.target.closest('.search-container')) {
                setShowSearch(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserMenu, showSearch]);

    const logoutSubmit = () => {
        try {
            // Limpiar el sessionStorage del usuario
            sessionStorage.removeItem('usuario');
            
            // Disparar evento personalizado para que el carrito se actualice inmediatamente
            window.dispatchEvent(new Event('userSessionChanged'));
            
            // Llamar al servicio de logout
            logout();
            
            // Recargar la página para refrescar todo el estado
            window.location.reload();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
            setShowSearch(false);
            setSearchQuery('');
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
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            {/* Logo */}
            <div className="navbar-brand" onClick={() => navigate('/home')}>
                <span className="logo-icon">🏗️</span>
                <span className="logo-text">HyV</span>
            </div>

            {/* Barra de búsqueda expandible */}
            <div className={`search-container ${showSearch ? 'active' : ''}`}>
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <button type="submit" className="search-btn">
                        🔍
                    </button>
                </form>
            </div>

            {/* Menú de navegación */}
            <div className={`nav-menu ${menuOpen ? 'activado' : ''}`}>
                <ul>
                    <li>
                        <NavLink 
                            to="/home" 
                            onClick={() => { 
                                setMenuOpen(false); 
                                addActiveClass();
                            }} 
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            <span className="nav-icon">🏠</span>
                            <span>Inicio</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/products" 
                            onClick={() => { 
                                setMenuOpen(false); 
                                addActiveClass();
                            }} 
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            <span className="nav-icon">📦</span>
                            <span>Productos</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/carroCompras" 
                            onClick={() => { 
                                setMenuOpen(false); 
                                addActiveClass();
                            }} 
                            className={({ isActive }) => `cart-nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon">🛒</span>
                            <span>Carrito</span>
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
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                <span className="nav-icon">👥</span>
                                <span>Usuarios</span>
                            </NavLink>
                        </li>
                    )}
                </ul>
            </div>

            {/* Acciones del navbar */}
            <div className="navbar-actions">
                {/* Botón de búsqueda */}
                <button 
                    className={`action-btn search-toggle-btn ${showSearch ? 'active' : ''}`}
                    onClick={() => setShowSearch(!showSearch)}
                    title="Buscar"
                >
                    🔍
                </button>

                {/* Usuario autenticado */}
                {isAuthenticated ? (
                    <div className="user-menu-container">
                        <button 
                            className="user-menu-btn"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                        >
                            <span className="user-avatar">
                                {user.nombreCompleto?.charAt(0).toUpperCase() || '👤'}
                            </span>
                            <span className="user-name">{user.nombreCompleto || 'Usuario'}</span>
                            <span className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`}>▼</span>
                        </button>
                        
                        {showUserMenu && (
                            <div className="user-dropdown">
                                <div className="user-info">
                                    <div className="user-avatar-large">
                                        {user.nombreCompleto?.charAt(0).toUpperCase() || '👤'}
                                    </div>
                                    <div className="user-details">
                                        <p className="user-name-large">{user.nombreCompleto}</p>
                                        <p className="user-email">{user.email}</p>
                                        <span className={`user-role-badge ${userRole}`}>
                                            {userRole === 'administrador' ? '👑 Admin' : '👤 Usuario'}
                                        </span>
                                    </div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <button 
                                    className="dropdown-item"
                                    onClick={() => {
                                        navigate('/profile');
                                        setShowUserMenu(false);
                                    }}
                                >
                                    <span>👤</span>
                                    Mi Perfil
                                </button>
                                <button 
                                    className="dropdown-item"
                                    onClick={() => {
                                        navigate('/orders');
                                        setShowUserMenu(false);
                                    }}
                                >
                                    <span>📦</span>
                                    Mis Pedidos
                                </button>
                                <button 
                                    className="dropdown-item"
                                    onClick={() => {
                                        navigate('/carroCompras');
                                        setShowUserMenu(false);
                                    }}
                                >
                                    <span>🛒</span>
                                    Mi Carrito
                                </button>
                                {userRole === 'administrador' && (
                                    <>
                                        <button 
                                            className="dropdown-item"
                                            onClick={() => {
                                                navigate('/users');
                                                setShowUserMenu(false);
                                            }}
                                        >
                                            <span>👥</span>
                                            Administrar Usuarios
                                        </button>
                                        <button 
                                            className="dropdown-item"
                                            onClick={() => {
                                                navigate('/admin/orders');
                                                setShowUserMenu(false);
                                            }}
                                        >
                                            <span>📊</span>
                                            Administrar Pedidos
                                        </button>
                                    </>
                                )}
                                <div className="dropdown-divider"></div>
                                <button 
                                    className="dropdown-item logout"
                                    onClick={() => {
                                        logoutSubmit();
                                        setShowUserMenu(false);
                                    }}
                                >
                                    <span>🚪</span>
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button 
                        className="login-btn" 
                        onClick={() => setShowLoginForm(!showLoginForm)}
                    >
                        <span>🔑</span>
                        <span>{showLoginForm ? 'Cerrar' : 'Iniciar Sesión'}</span>
                    </button>
                )}
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
            
            {/* Hamburger menu */}
            <div className={`hamburger ${menuOpen ? 'activado' : ''}`} onClick={toggleMenu}>
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
            </div>
        </nav>
    );
};

export default Navbar;