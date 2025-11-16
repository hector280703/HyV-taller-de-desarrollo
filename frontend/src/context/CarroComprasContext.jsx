import { createContext, useContext, useState, useEffect } from 'react';

const CarroComprasContext = createContext();

export const useCarroCompras = () => {
  const context = useContext(CarroComprasContext);
  if (!context) {
    throw new Error('useCarroCompras debe ser usado dentro de un CarroComprasProvider');
  }
  return context;
};

export const CarroComprasProvider = ({ children }) => {
  const [carroCompras, setCarroCompras] = useState(() => {
    const savedCarroCompras = localStorage.getItem('carroCompras');
    return savedCarroCompras ? JSON.parse(savedCarroCompras) : [];
  });

  useEffect(() => {
    localStorage.setItem('carroCompras', JSON.stringify(carroCompras));
  }, [carroCompras]);

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
        carroCompras,
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidad,
        vaciarCarrito,
        obtenerTotal,
        obtenerCantidadItems,
        estaEnCarrito,
        obtenerCantidadItem,
      }}
    >
      {children}
    </CarroComprasContext.Provider>
  );
};
