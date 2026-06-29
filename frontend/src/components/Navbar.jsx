import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { logout, login } from '@services/auth.service.js';
import { useCarroCompras } from '@context/CarroComprasContext';
import { getLowStockProducts } from '@services/product.service.js';
import { getOrders } from '@services/order.service.js';
import '@styles/navbar.css';
import { useState, useEffect, useRef } from "react";
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
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [stockIncidents, setStockIncidents] = useState([]);
    const [showStockPanel, setShowStockPanel] = useState(false);
    const stockPanelRef = useRef(null);
    
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
            if (showStockPanel && !event.target.closest('.stock-notification-container')) {
                setShowStockPanel(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserMenu, showSearch, showStockPanel]);

    // Cargar alertas de stock bajo e incidencias (solo para administradores)
    useEffect(() => {
        if (userRole === 'administrador') {
            const fetchAlerts = async () => {
                try {
                    const products = await getLowStockProducts();
                    setLowStockProducts(products);
                    
                    const orders = await getOrders();
                    if (orders) {
                        const incidents = orders.filter(o => o.estado === 'incidencia_stock');
                        setStockIncidents(incidents);
                    }
                } catch (error) {
                    console.error("Error al cargar alertas:", error);
                }
            };
            fetchAlerts();
            // Refrescar cada 5 minutos
            const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [userRole]);

    const totalAlerts = lowStockProducts.length + stockIncidents.length;

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
                const loggedUser = JSON.parse(sessionStorage.getItem('usuario'));
                if (loggedUser && loggedUser.rol === 'bodeguero') {
                    window.location.href = '/bodega';
                } else if (loggedUser && loggedUser.rol === 'repartidor') {
                    window.location.href = '/repartidor';
                } else {
                    window.location.reload();
                }
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
                <img src="/logo_hyv.png" alt="HyV Construcciones" className="navbar-logo-img" />
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
                    {userRole !== 'repartidor' && userRole !== 'bodeguero' && (
                        <>
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
                        </>
                    )}
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
                    {isAuthenticated && userRole === 'repartidor' && (
                        <li>
                            <NavLink 
                                to="/repartidor" 
                                onClick={() => { 
                                    setMenuOpen(false); 
                                    addActiveClass();
                                }} 
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                <span className="nav-icon">🚚</span>
                                <span>Mis Entregas</span>
                            </NavLink>
                        </li>
                    )}
                    {isAuthenticated && userRole === 'bodeguero' && (
                        <li>
                            <NavLink 
                                to="/bodega" 
                                onClick={() => { 
                                    setMenuOpen(false); 
                                    addActiveClass();
                                }} 
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                <span className="nav-icon">🏭</span>
                                <span>Panel de Bodega</span>
                            </NavLink>
                        </li>
                    )}
                    {isAuthenticated && (userRole === 'administrador' || userRole === 'bodeguero') && (
                        <li>
                            <NavLink 
                                to="/inventory" 
                                onClick={() => { 
                                    setMenuOpen(false); 
                                    addActiveClass();
                                }} 
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                <span className="nav-icon">📦</span>
                                <span>Inventario</span>
                            </NavLink>
                        </li>
                    )}
                </ul>
            </div>

            {/* Acciones del navbar */}
            <div className="navbar-actions">
                {/* Botón de búsqueda */}
                {userRole !== 'repartidor' && userRole !== 'bodeguero' && (
                    <button 
                        className={`action-btn search-toggle-btn ${showSearch ? 'active' : ''}`}
                        onClick={() => setShowSearch(!showSearch)}
                        title="Buscar"
                    >
                        🔍
                    </button>
                )}

                {/* Campanita de notificaciones de stock - solo admin */}
                {isAuthenticated && userRole === 'administrador' && (
                    <div className="stock-notification-container" ref={stockPanelRef}>
                        <button
                            className={`action-btn stock-notification-btn ${showStockPanel ? 'active' : ''} ${totalAlerts > 0 ? 'has-alerts' : ''}`}
                            onClick={() => setShowStockPanel(!showStockPanel)}
                            title={totalAlerts > 0 ? `${totalAlerts} alerta${totalAlerts > 1 ? 's' : ''}` : 'Sin alertas'}
                        >
                            🔔
                            {totalAlerts > 0 && (
                                <span className="stock-badge">{totalAlerts > 99 ? '99+' : totalAlerts}</span>
                            )}
                        </button>

                        {showStockPanel && (
                            <div className="stock-notification-panel">
                                <div className="stock-panel-header">
                                    <span className="stock-panel-title">
                                        {totalAlerts > 0 ? '🚨' : '✅'} Centro de Alertas
                                    </span>
                                    <span className="stock-panel-count">
                                        {totalAlerts} alerta{totalAlerts !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="stock-panel-body">
                                    {totalAlerts === 0 ? (
                                        <div className="stock-panel-empty">
                                            <span>✅</span>
                                            <p>Todo en orden. No hay alertas.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {stockIncidents.map((order) => (
                                                <div
                                                    key={`incidencia-${order.id}`}
                                                    className="stock-panel-item sin-stock"
                                                    style={{ cursor: 'pointer', borderLeft: '3px solid #ef4444' }}
                                                    onClick={() => {
                                                        navigate('/admin/orders');
                                                        setShowStockPanel(false);
                                                    }}
                                                >
                                                    <div className="stock-panel-item-icon">🚫</div>
                                                    <div className="stock-panel-item-info">
                                                        <span className="stock-panel-item-name" style={{ color: '#b91c1c' }}>
                                                            Quiebre en Orden {order.numeroOrden}
                                                        </span>
                                                        <span className="stock-panel-item-stock" style={{ color: '#ef4444' }}>
                                                            Bodega reportó falta física
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {lowStockProducts.map((product) => (
                                                <div
                                                    key={`low-stock-${product.id}`}
                                                    className={`stock-panel-item ${product.sinStock ? 'sin-stock' : 'stock-bajo'}`}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => {
                                                        navigate('/inventory');
                                                        setShowStockPanel(false);
                                                    }}
                                                >
                                                    <div className="stock-panel-item-icon">
                                                        {product.sinStock ? '❌' : '⚠️'}
                                                    </div>
                                                    <div className="stock-panel-item-info">
                                                        <span className="stock-panel-item-name">{product.nombre}</span>
                                                        <span className="stock-panel-item-stock">
                                                            {product.sinStock ? 'Sin stock' : `${product.stock} unidades`}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                                            {userRole === 'administrador' ? '👑 Admin' : userRole === 'repartidor' ? '🚚 Repartidor' : userRole === 'bodeguero' ? '🏭 Bodeguero' : '👤 Usuario'}
                                        </span>
                                    </div>
                                </div>
                                <div className="dropdown-divider"></div>
                                {userRole !== 'repartidor' && userRole !== 'bodeguero' && (
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
                                )}
                                {userRole !== 'repartidor' && userRole !== 'bodeguero' && (
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
                                )}
                                {userRole !== 'repartidor' && userRole !== 'bodeguero' && (
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
                                )}
                                {userRole === 'repartidor' && (
                                    <button 
                                        className="dropdown-item"
                                        onClick={() => {
                                            navigate('/repartidor');
                                            setShowUserMenu(false);
                                        }}
                                    >
                                        <span>🚚</span>
                                        Panel de Repartidor
                                    </button>
                                )}
                                {userRole === 'bodeguero' && (
                                    <button 
                                        className="dropdown-item"
                                        onClick={() => {
                                            navigate('/bodega');
                                            setShowUserMenu(false);
                                        }}
                                    >
                                        <span>🏭</span>
                                        Panel de Bodega
                                    </button>
                                )}
                                {(userRole === 'administrador' || userRole === 'bodeguero') && (
                                    <button 
                                        className="dropdown-item"
                                        onClick={() => {
                                            navigate('/inventory');
                                            setShowUserMenu(false);
                                        }}
                                    >
                                        <span>📦</span>
                                        Inventario
                                    </button>
                                )}
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
                                placeholder="example@gmail.com"
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