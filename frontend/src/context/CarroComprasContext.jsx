import { createContext, useContext, useState, useEffect } from 'react';
import { getProducts } from '../services/product.service';
import { showErrorAlert } from '../helpers/sweetAlert';

const CarroComprasContext = createContext();

export const useCarroCompras = () => {
  const context = useContext(CarroComprasContext);
  if (!context) {
    throw new Error('useCarroCompras debe ser usado dentro de un CarroComprasProvider');
  }
  return context;
};

export const CarroComprasProvider = ({ children }) => {
  // Obtener el usuario actual
  const getCurrentUser = () => {
    const user = sessionStorage.getItem('usuario');
    return user ? JSON.parse(user) : null;
  };

  // Estado para rastrear el ID del usuario actual
  const [currentUserId, setCurrentUserId] = useState(() => {
    const user = getCurrentUser();
    return user?.id || null;
  });

  // Obtener la clave del localStorage específica para el usuario
  const getCarritoKey = () => {
    const user = getCurrentUser();
    return user ? `carroCompras_${user.id}` : 'carroCompras_guest';
  };

  const [carroCompras, setCarroCompras] = useState(() => {
    const carritoKey = getCarritoKey();
    const savedCarroCompras = localStorage.getItem(carritoKey);
    return savedCarroCompras ? JSON.parse(savedCarroCompras) : [];
  });

  // Validar stock al cargar el carrito
  const validarStockCarrito = async (carrito, carritoKey) => {
    try {
      const productos = await getProducts();
      const productosEliminados = [];
      const carritoActualizado = [];

      for (const item of carrito) {
        const productoActual = productos.find(p => p.id === item.id);
        
        if (!productoActual || productoActual.stock === 0) {
          // Producto sin stock o eliminado
          productosEliminados.push(item.nombre);
        } else if (productoActual.stock < item.quantity) {
          // Ajustar cantidad si el stock es menor
          carritoActualizado.push({
            ...item,
            quantity: productoActual.stock,
            stock: productoActual.stock
          });
        } else {
          // Producto válido
          carritoActualizado.push({
            ...item,
            stock: productoActual.stock
          });
        }
      }

      // Actualizar carrito
      setCarroCompras(carritoActualizado);
      localStorage.setItem(carritoKey, JSON.stringify(carritoActualizado));

      // Notificar productos eliminados
      if (productosEliminados.length > 0) {
        const mensaje = productosEliminados.length === 1
          ? `El producto "${productosEliminados[0]}" fue eliminado del carrito porque no hay stock disponible.`
          : `Los siguientes productos fueron eliminados del carrito por falta de stock: ${productosEliminados.join(', ')}`;
        
        showErrorAlert('Productos sin stock', mensaje);
      }
    } catch (error) {
      console.error('Error al validar stock del carrito:', error);
      setCarroCompras(carrito);
    }
  };

  // Validar stock al montar el componente
  useEffect(() => {
    const validarStockInicial = async () => {
      if (carroCompras.length > 0) {
        const carritoKey = getCarritoKey();
        await validarStockCarrito(carroCompras, carritoKey);
      }
    };
    
    validarStockInicial();
  }, []); // Solo se ejecuta al montar

  // Efecto para guardar en localStorage con la clave específica del usuario
  useEffect(() => {
    const carritoKey = getCarritoKey();
    localStorage.setItem(carritoKey, JSON.stringify(carroCompras));
  }, [carroCompras]);

  // Efecto para detectar cambios de usuario y recargar el carrito
  useEffect(() => {
    const checkUserChange = async () => {
      const user = getCurrentUser();
      const newUserId = user?.id || null;
      
      if (newUserId !== currentUserId) {
        setCurrentUserId(newUserId);
        const carritoKey = user ? `carroCompras_${user.id}` : 'carroCompras_guest';
        const savedCarroCompras = localStorage.getItem(carritoKey);
        
        if (savedCarroCompras) {
          const carritoGuardado = JSON.parse(savedCarroCompras);
          // Validar stock de productos
          await validarStockCarrito(carritoGuardado, carritoKey);
        } else {
          setCarroCompras([]);
        }
      }
    };

    // Verificar cambios periódicamente
    const interval = setInterval(checkUserChange, 500);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const agregarAlCarrito = (product, quantity = 1) => {
    setCarroCompras(prevCarroCompras => {
      const existingItem = prevCarroCompras.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCarroCompras.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      
      return [...prevCarroCompras, { ...product, quantity: Math.min(quantity, product.stock) }];
    });
  };

  const eliminarDelCarrito = (productId) => {
    setCarroCompras(prevCarroCompras => prevCarroCompras.filter(item => item.id !== productId));
  };

  const actualizarCantidad = (productId, quantity) => {
    if (quantity <= 0) {
      eliminarDelCarrito(productId);
      return;
    }

    setCarroCompras(prevCarroCompras =>
      prevCarroCompras.map(item => {
        if (item.id === productId) {
          const maxQuantity = item.stock || 999;
          return { ...item, quantity: Math.min(quantity, maxQuantity) };
        }
        return item;
      })
    );
  };

  const vaciarCarrito = () => {
    setCarroCompras([]);
  };

  const limpiarCarritoUsuario = () => {
    const carritoKey = getCarritoKey();
    localStorage.removeItem(carritoKey);
    setCarroCompras([]);
  };

  const obtenerTotal = () => {
    return carroCompras.reduce((total, item) => {
      const price = item.descuento > 0 
        ? item.precio - (item.precio * item.descuento / 100)
        : item.precio;
      return total + (price * item.quantity);
    }, 0);
  };

  const obtenerCantidadItems = () => {
    return carroCompras.reduce((count, item) => count + item.quantity, 0);
  };

  const estaEnCarrito = (productId) => {
    return carroCompras.some(item => item.id === productId);
  };

  const obtenerCantidadItem = (productId) => {
    const item = carroCompras.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <CarroComprasContext.Provider
      value={{
        carrito: carroCompras,
        carroCompras,
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidad,
        vaciarCarrito,
        limpiarCarritoUsuario,
        obtenerTotal,
        totalCarrito: obtenerTotal(),
        obtenerCantidadItems,
        estaEnCarrito,
        obtenerCantidadItem,
      }}
    >
      {children}
    </CarroComprasContext.Provider>
  );
};
