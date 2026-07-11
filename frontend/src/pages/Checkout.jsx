import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarroCompras } from '../context/CarroComprasContext';
import { createOrder, calculateShipping, getDeliveryAvailability } from '../services/order.service.js';
import { createPaymentPreference } from '../services/payment.service.js';
import { showErrorAlert, showSuccessAlert } from '../helpers/sweetAlert.js';
import { formatPrice } from '../helpers/formatData.js';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/checkout.css';

// Fix para el ícono de Leaflet que no carga por defecto en bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Ícono personalizado para el marcador de entrega
const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Componente para manejar clicks en el mapa
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Componente para mover el mapa a una ubicación
function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

// Coordenadas del centro de Laraquete
const LARAQUETE_COORDS = { lat: -37.1653, lng: -73.1835 };

// Calcular distancia en Km entre dos puntos usando la fórmula de Haversine
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Determinar la zona de entrega basándose en la distancia y los detalles de la dirección
function determinarZona(lat, lng, addressObj = {}) {
  const dist = getDistanceKm(lat, lng, LARAQUETE_COORDS.lat, LARAQUETE_COORDS.lng);
  
  const county = (addressObj.county || '').toLowerCase();
  const state = (addressObj.state || '').toLowerCase();
  const city = (addressObj.city || addressObj.town || addressObj.village || addressObj.suburb || '').toLowerCase();

  // 1. Local (Laraquete): distancia <= 6 km o ciudad/pueblo es Laraquete
  if (city.includes('laraquete') || dist <= 6) {
    return 'local';
  }

  // 2. Provincia de Arauco: si el county/comuna explícitamente dice Arauco
  // o si está en la Región del Bío Bío y dist <= 35 km
  if (county.includes('arauco') || ((state.includes('bío') || state.includes('bio')) && dist <= 35)) {
    return 'arauco';
  }

  // Fallback de distancia corta si no hay detalles de dirección
  if (!addressObj.country && dist <= 40) {
    return 'arauco';
  }

  // 3. Región del Bío Bío: si el estado es Biobío / Bío Bío o la distancia es <= 180 km
  if (state.includes('bío') || state.includes('bio') || dist <= 180) {
    return 'biobio';
  }

  // Fallback si no hay dirección pero está dentro de 180 km
  if (!addressObj.country && dist <= 180) {
    return 'biobio';
  }

  // 4. Regional: Otras regiones cercanas a Biobío (distancia <= 500 km)
  if (dist <= 500) {
    return 'regional';
  }

  // 5. Nacional: Todo lo demás
  return 'nacional';
}

export default function Checkout() {
  const navigate = useNavigate();
  const { carrito, totalCarrito, vaciarCarrito } = useCarroCompras();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Detectar si el usuario es vendedor presencial
  const user = JSON.parse(sessionStorage.getItem('usuario'));
  const isVendedorPresencial = user?.rol === 'vendedor_presencial';

  // Estado del mapa
  const [mapPosition, setMapPosition] = useState(null);
  const [mapCenter] = useState([-37.1653, -73.1835]); // Laraquete, Chile
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Estados de costo de envío
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingZone, setShippingZone] = useState('');
  const [shippingZoneName, setShippingZoneName] = useState('');
  const [shippingDetails, setShippingDetails] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Email del cliente (solo para vendedor presencial)
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');

  const [formData, setFormData] = useState({
    direccionEnvio: '',
    telefonoContacto: '',
    metodoPago: 'efectivo',
    notas: '',
    fechaEntrega: '',
  });

  const [tipoEntrega, setTipoEntrega] = useState(isVendedorPresencial ? 'retiro' : 'envio');
  const [blockedDates, setBlockedDates] = useState([]);

  // Cargar disponibilidad al montar el componente
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await getDeliveryAvailability();
        if (response.status === 'Success') {
          setBlockedDates(response.data);
        }
      } catch (err) {
        console.error("Error al obtener disponibilidad de entregas:", err);
      }
    };
    fetchAvailability();
  }, []);

  // Calcular fecha mínima (hoy + 2 días)
  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2);
    return minDate.toISOString().split('T')[0];
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      // Validar domingo (0 en getUTCDay() ya que es ISO YYYY-MM-DD)
      const dateObj = new Date(selectedDate);
      if (dateObj.getUTCDay() === 0) {
        showErrorAlert('Día no permitido', 'No realizamos entregas ni retiros los días domingo. Por favor selecciona otro día.');
        setFormData(prev => ({ ...prev, fechaEntrega: '' }));
        return;
      }

      // Validar si la fecha está bloqueada
      if (blockedDates.includes(selectedDate)) {
        showErrorAlert(
          'Cupo completo',
          `El límite de entregas diarias para el día ${selectedDate} se ha completado (Límite: 10 pedidos). Por favor, selecciona otra fecha.`
        );
        setFormData(prev => ({ ...prev, fechaEntrega: '' }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, fechaEntrega: selectedDate }));
  };

  const calcularPesoTotal = () => {
    return carrito.reduce((acc, item) => {
      const peso = item.peso ? parseFloat(item.peso) : 1;
      return acc + (peso * (item.quantity || item.cantidad));
    }, 0);
  };

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escuchar cambios de mapPosition para geocodificación inversa y cálculo de envío
  useEffect(() => {
    if (tipoEntrega === 'retiro') {
      setShippingCost(0);
      setShippingZone('');
      setShippingZoneName('Retiro en tienda');
      setShippingDetails(null);
      return;
    }

    if (mapPosition) {
      const [lat, lng] = mapPosition;
      
      const fetchAddressAndCalculate = async () => {
        setLoadingShipping(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`,
            { headers: { 'User-Agent': 'HyV-Construcciones-App' } }
          );
          
          let address = {};
          let displayName = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
          
          if (response.ok) {
            const data = await response.json();
            address = data?.address || {};
            displayName = data?.display_name || displayName;
          }
          
          setFormData(prev => ({
            ...prev,
            direccionEnvio: displayName,
          }));
          setSearchQuery(displayName);

          const pesoTotal = calcularPesoTotal();
          const zona = determinarZona(lat, lng, address);
          setShippingZone(zona);
          
          const res = await calculateShipping(zona, pesoTotal);
          if (res && res.data) {
            setShippingCost(parseFloat(res.data.costoEnvio));
            setShippingZoneName(res.data.zona);
            setShippingDetails(res.data.detalle);
          }
        } catch (error) {
          console.error('Error al actualizar envío:', error);
          // Fallback con sólo distancia si falla el geocoding
          const pesoTotal = calcularPesoTotal();
          const zona = determinarZona(lat, lng, {});
          setShippingZone(zona);
          try {
            const res = await calculateShipping(zona, pesoTotal);
            if (res && res.data) {
              setShippingCost(parseFloat(res.data.costoEnvio));
              setShippingZoneName(res.data.zona);
              setShippingDetails(res.data.detalle);
            }
          } catch (innerError) {
            console.error('Error en cálculo de envío fallback:', innerError);
          }
        } finally {
          setLoadingShipping(false);
        }
      };

      fetchAddressAndCalculate();
    } else {
      setShippingCost(0);
      setShippingZone('');
      setShippingZoneName('');
      setShippingDetails(null);
    }
  }, [mapPosition, tipoEntrega]);

  // Búsqueda de direcciones con Nominatim
  const searchAddress = useCallback(async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Chile')}&limit=5&addressdetails=1&accept-language=es`,
        { headers: { 'User-Agent': 'HyV-Construcciones-App' } }
      );
      const data = await response.json();
      setSearchResults(data || []);
      setShowResults(data && data.length > 0);
    } catch (error) {
      console.error('Error buscando dirección:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce para la búsqueda
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value);
    }, 500);
  };

  // Seleccionar resultado de búsqueda
  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapPosition([lat, lng]);
    setShowResults(false);
    setSearchResults([]);
  };

  // Click en el mapa
  const handleMapClick = (latlng) => {
    setMapPosition([latlng.lat, latlng.lng]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación de carrito vacío
    if (carrito.length === 0) {
      showErrorAlert('Carrito vacío', 'Agrega productos antes de finalizar la compra');
      return;
    }

    // Dirección de envío / retiro
    let direccion = '';
    if (tipoEntrega === 'retiro') {
      direccion = "Retiro en Tienda: La Cantera N°5, Laraquete, Arauco, Región del Bío Bío";
    } else {
      direccion = formData.direccionEnvio.trim();
      if (!direccion || direccion.length < 10) {
        showErrorAlert('Dirección inválida', 'La dirección debe tener al menos 10 caracteres. Usa el mapa o escribe la dirección completa.');
        return;
      }
      if (direccion.length > 500) {
        showErrorAlert('Dirección muy larga', 'La dirección no debe exceder 500 caracteres');
        return;
      }
    }

    // Validación de ubicación en mapa (solo si es envío)
    if (tipoEntrega === 'envio' && !mapPosition) {
      showErrorAlert('Ubicación requerida', 'Haz clic en el mapa o busca una dirección para marcar el punto de entrega.');
      return;
    }

    // Validación de teléfono mejorada
    const telefono = formData.telefonoContacto.trim();
    if (!telefono) {
      showErrorAlert('Teléfono requerido', 'Debes ingresar un teléfono de contacto');
      return;
    }
    // Acepta formatos: +56912345678, 912345678, +56 9 1234 5678, 9-1234-5678
    if (!/^\+?[\d\s-]{8,20}$/.test(telefono)) {
      showErrorAlert('Teléfono inválido', 'Ingresa un número de teléfono válido (ej: +56 9 1234 5678)');
      return;
    }

    // Validación de método de pago
    if (!formData.metodoPago) {
      showErrorAlert('Método de pago requerido', 'Selecciona un método de pago');
      return;
    }

    // Validación de email del cliente (solo para vendedor presencial)
    if (isVendedorPresencial) {
      if (!clienteEmail || !clienteEmail.trim()) {
        showErrorAlert('Email requerido', 'Debes ingresar el email del cliente para enviar el código de retiro');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clienteEmail.trim())) {
        showErrorAlert('Email inválido', 'Ingresa un email válido para el cliente');
        return;
      }
    }

    // Validación de fecha (no requerida para retiro en tienda)
    if (tipoEntrega !== 'retiro' && !formData.fechaEntrega) {
      showErrorAlert('Fecha requerida', 'Selecciona una fecha de entrega');
      return;
    }

    // Validación de notas (opcional)
    if (formData.notas && formData.notas.length > 1000) {
      showErrorAlert('Notas muy largas', 'Las notas no deben exceder 1000 caracteres');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmOrder = async () => {
    setLoading(true);

    try {
      let direccion = '';
      if (tipoEntrega === 'retiro') {
        direccion = "Retiro en Tienda: La Cantera N°5, Laraquete, Arauco, Región del Bío Bío";
      } else {
        direccion = formData.direccionEnvio.trim();
      }
      const telefono = formData.telefonoContacto.trim();

      const items = carrito.map(item => ({
        productId: item.id,
        cantidad: item.quantity || item.cantidad
      }));

      // Incluir coordenadas en la dirección si es despacho a domicilio
      const coordsInfo = (tipoEntrega === 'envio' && mapPosition)
        ? ` [📍 ${mapPosition[0].toFixed(6)}, ${mapPosition[1].toFixed(6)}]`
        : '';

      const orderData = {
        items,
        metodoPago: formData.metodoPago,
        direccionEnvio: direccion + coordsInfo,
        telefonoContacto: telefono,
        notas: formData.notas?.trim() || undefined,
        zonaEnvio: tipoEntrega === 'envio' ? (shippingZone || undefined) : undefined,
        tipoEntrega,
        fechaEntrega: tipoEntrega === 'retiro' ? undefined : formData.fechaEntrega,
        ...(isVendedorPresencial && clienteEmail ? { clienteEmail: clienteEmail.trim() } : {}),
        ...(isVendedorPresencial && clienteNombre ? { clienteNombre: clienteNombre.trim() } : {}),
      };

      const response = await createOrder(orderData);
      const orderId = response.data.id;
      
      // Si se eligió Mercado Pago, crear preferencia y redirigir
      if (formData.metodoPago === 'mercadopago') {
        try {
          const paymentRes = await createPaymentPreference(orderId);
          const initPoint = paymentRes.data.initPoint || paymentRes.data.sandboxInitPoint;
          
          if (initPoint) {
            vaciarCarrito();
            // Redirigir a Mercado Pago
            window.location.href = initPoint;
            return;
          } else {
            showErrorAlert(
              'Error con Mercado Pago',
              'No se pudo generar el enlace de pago. Tu orden fue creada, puedes pagar después desde tus pedidos.'
            );
          }
        } catch (mpError) {
          console.error('Error al crear preferencia MP:', mpError);
          showErrorAlert(
            'Error con Mercado Pago',
            'No se pudo conectar con Mercado Pago. Tu orden fue creada con estado pendiente de pago.'
          );
        }
      }
      
      vaciarCarrito();
      setShowConfirmModal(false);
      
      showSuccessAlert(
        '¡Pedido realizado exitosamente!',
        `Tu orden #${response.data.numeroOrden} ha sido creada. Pronto recibirás confirmación.`
      );
      
      navigate('/orders');
    } catch (error) {
      console.error('Error al crear orden:', error);
      const errorMessage = error.message || error.details || 'Ocurrió un error al procesar tu pedido. Por favor intenta nuevamente.';
      showErrorAlert('Error al procesar pedido', errorMessage);
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  const calcularSubtotal = () => {
    return carrito.reduce((acc, item) => acc + (item.precio * (item.quantity || item.cantidad)), 0);
  };

  const calcularDescuentos = () => {
    return carrito.reduce((acc, item) => {
      const descuento = item.descuento || 0;
      return acc + (item.precio * descuento / 100 * (item.quantity || item.cantidad));
    }, 0);
  };

  if (carrito.length === 0) {
    return (
      <div className="checkout-container">
        <div className="checkout-empty">
          <h2>Carrito Vacío</h2>
          <p>No tienes productos en tu carrito</p>
          <button onClick={() => navigate('/products')} className="btn-primary">
            Ver Productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        <div className="checkout-summary">
          <h2>Resumen del Pedido</h2>
          <div className="order-items">
            {carrito.map((item) => {
              const precioConDescuento = item.precio - (item.precio * (item.descuento || 0) / 100);
              return (
                <div key={item.id} className="order-item">
                  {item.imagenUrl ? (
                    <img src={item.imagenUrl} alt={item.nombre} />
                  ) : (
                    <div className="order-item-placeholder">📦</div>
                  )}
                  <div className="item-details">
                    <h4>{item.nombre}</h4>
                    <p>Cantidad: {item.quantity || item.cantidad}</p>
                    {item.descuento > 0 && (
                      <span className="item-discount">{item.descuento}% OFF</span>
                    )}
                  </div>
                  <div className="item-price">
                    {item.descuento > 0 && (
                      <span className="price-original">{formatPrice(item.precio)}</span>
                    )}
                    <span className="price-final">
                      {formatPrice(precioConDescuento)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{formatPrice(calcularSubtotal())}</span>
            </div>
            {calcularDescuentos() > 0 && (
              <div className="total-row discount">
                <span>Descuentos:</span>
                <span>-{formatPrice(calcularDescuentos())}</span>
              </div>
            )}
            <div className="total-row shipping">
              <span>Envío ({shippingZoneName || 'No seleccionado'}):</span>
              <span>
                {loadingShipping ? (
                  <span className="loading-spinner-small">⏳</span>
                ) : tipoEntrega === 'retiro' ? (
                  formatPrice(0)
                ) : mapPosition ? (
                  formatPrice(shippingCost)
                ) : (
                  <em className="text-muted">Seleccione ubicación</em>
                )}
              </span>
            </div>
            {shippingDetails && tipoEntrega !== 'retiro' && (
              <div className="shipping-detail-info">
                <small>
                  Peso total: {shippingDetails.pesoTotal?.toFixed(2)} kg 
                  {shippingDetails.pesoGratis > 0 && ` (Incluye ${shippingDetails.pesoGratis} kg gratis)`}
                </small>
              </div>
            )}
            <div className="total-row total">
              <span>Total a Pagar:</span>
              <span>{formatPrice(totalCarrito + (tipoEntrega === 'retiro' ? 0 : shippingCost))}</span>
            </div>
          </div>
        </div>

        <div className="checkout-form-container">
          <h2>Información de Envío / Entrega</h2>
          <form onSubmit={handleSubmit} className="checkout-form">
            
            {/* Método de Entrega */}
            <div className="form-group">
              <label>📦 Método de Entrega *</label>
              <div className="delivery-type-selector">
                <label className={`delivery-type-option ${tipoEntrega === 'envio' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="tipoEntrega"
                    value="envio"
                    checked={tipoEntrega === 'envio'}
                    onChange={() => setTipoEntrega('envio')}
                  />
                  <div className="option-content">
                    <span className="option-icon">🚚</span>
                    <div className="option-text">
                      <span className="option-title">Despacho a Domicilio</span>
                      <span className="option-desc">Recibe en tu dirección (costo según zona y peso)</span>
                    </div>
                  </div>
                </label>
                
                <label className={`delivery-type-option ${tipoEntrega === 'retiro' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="tipoEntrega"
                    value="retiro"
                    checked={tipoEntrega === 'retiro'}
                    onChange={() => setTipoEntrega('retiro')}
                  />
                  <div className="option-content">
                    <span className="option-icon">🏢</span>
                    <div className="option-text">
                      <span className="option-title">Retiro en Tienda</span>
                      <span className="option-desc">Retira gratis en nuestro local (Laraquete)</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {tipoEntrega === 'envio' ? (
              <>
                {/* Sección del Mapa */}
                <div className="form-group">
                  <label>📍 Ubicación de Entrega *</label>
                  <div className="map-search-container" ref={searchContainerRef}>
                    <div className="map-search-input-wrapper">
                      <span className="map-search-icon">🔍</span>
                      <input
                        type="text"
                        className="map-search-input"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                        placeholder="Buscar dirección... (ej: Av. O'Higgins 500, Concepción)"
                      />
                      {isSearching && <span className="map-search-loading">⏳</span>}
                      {searchQuery && (
                        <button
                          type="button"
                          className="map-search-clear"
                          onClick={() => {
                            setSearchQuery('');
                            setSearchResults([]);
                            setShowResults(false);
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    {/* Resultados de búsqueda */}
                    {showResults && searchResults.length > 0 && (
                      <div className="map-search-results">
                        {searchResults.map((result, index) => (
                          <button
                            key={index}
                            type="button"
                            className="map-search-result-item"
                            onClick={() => handleSelectResult(result)}
                          >
                            <span className="result-icon">📍</span>
                            <span className="result-text">{result.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="map-wrapper">
                    <MapContainer
                      center={mapCenter}
                      zoom={13}
                      className="checkout-map"
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapClickHandler onMapClick={handleMapClick} />
                      {mapPosition && (
                        <>
                          <FlyToLocation position={mapPosition} />
                          <Marker position={mapPosition} icon={deliveryIcon} />
                        </>
                      )}
                    </MapContainer>
                    <div className="map-hint">
                      {mapPosition ? (
                        <span className="map-hint-selected">
                          ✅ Ubicación seleccionada — Haz clic en otro punto para cambiar
                        </span>
                      ) : (
                        <span className="map-hint-default">
                          👆 Haz clic en el mapa o busca una dirección para marcar el punto de entrega
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dirección (se llena automáticamente o se puede editar) */}
                <div className="form-group">
                  <label htmlFor="direccionEnvio">Dirección de Envío *</label>
                  <textarea
                    id="direccionEnvio"
                    name="direccionEnvio"
                    value={formData.direccionEnvio}
                    onChange={handleChange}
                    placeholder="Selecciona en el mapa o escribe la dirección completa..."
                    required
                    minLength={10}
                    maxLength={500}
                    rows={3}
                  />
                  <small className="form-help">
                    Se completa automáticamente al seleccionar en el mapa. Puedes editarla para agregar detalles ({formData.direccionEnvio.length}/500)
                  </small>
                </div>
              </>
            ) : (
              <div className="form-group pickup-address-display">
                <label>🏢 Dirección de Retiro</label>
                <div className="pickup-address-card">
                  <p className="pickup-address-text"><strong>HyV Construcciones</strong></p>
                  <p className="pickup-address-subtext">La Cantera N°5, Laraquete, Arauco, Región del Bío Bío</p>
                  <p className="pickup-schedule"><strong>Horario de atención:</strong> Lunes a Viernes: 08:30 - 18:30 | Sábado: 09:00 - 14:00</p>
                  <span className="pickup-badge">✓ Retiro Gratis</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="telefonoContacto">Teléfono de Contacto *</label>
              <input
                type="tel"
                id="telefonoContacto"
                name="telefonoContacto"
                value={formData.telefonoContacto}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                required
                maxLength={20}
              />
              <small className="form-help">
                Formato: +56 9 XXXX XXXX (incluye código de país)
              </small>
            </div>

            {/* Email del cliente - Solo visible para vendedor presencial */}
            {isVendedorPresencial && (
              <>
                <div className="form-group">
                  <label htmlFor="clienteNombre">👤 Nombre del Cliente *</label>
                  <input
                    type="text"
                    id="clienteNombre"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder="Nombre completo del cliente"
                    required
                    minLength={2}
                    className="checkout-input"
                  />
                  <small className="form-help">
                    Nombre del cliente que realiza la compra presencial
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="clienteEmail">✉️ Email del Cliente *</label>
                  <input
                    type="email"
                    id="clienteEmail"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    required
                    className="checkout-input"
                  />
                  <small className="form-help">
                    El cliente recibirá un correo con el código de retiro de su producto
                  </small>
                </div>
              </>
            )}

            {/* Fecha de entrega - Deshabilitada para retiro en tienda */}
            {tipoEntrega === 'retiro' ? (
              <div className="form-group">
                <label>📅 Fecha de Retiro</label>
                <div className="pickup-address-card">
                  <p className="pickup-address-text"><strong>Retiro Inmediato</strong></p>
                  <p className="pickup-address-subtext">Al elegir retiro en tienda, el pedido estará disponible para ser retirado de inmediato.</p>
                  <span className="pickup-badge">✓ Disponible ahora</span>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="fechaEntrega">📅 Fecha Estimada de Entrega *</label>
                <input
                  type="date"
                  id="fechaEntrega"
                  name="fechaEntrega"
                  value={formData.fechaEntrega}
                  onChange={handleDateChange}
                  min={getMinDate()}
                  required
                  className="checkout-input"
                />
                <small className="form-help">
                  Selecciona una fecha (mínimo 2 días de anticipación). Los días domingo no están disponibles.
                </small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="metodoPago">Método de Pago *</label>
              <select
                id="metodoPago"
                name="metodoPago"
                value={formData.metodoPago}
                onChange={handleChange}
                required
              >
                <option value="efectivo">💵 Efectivo (pago contra entrega)</option>
                <option value="transferencia">🏦 Transferencia Bancaria</option>
                <option value="tarjeta">💳 Tarjeta de Crédito</option>
                <option value="debito">💳 Tarjeta de Débito</option>
                <option value="mercadopago">🟦 Mercado Pago (Pago Online)</option>
              </select>
              {formData.metodoPago === 'mercadopago' && (
                <div className="mercadopago-info">
                  <div className="mp-badge">
                    <span className="mp-icon">🟦</span>
                    <div className="mp-text">
                      <strong>Mercado Pago</strong>
                      <small>Serás redirigido a Mercado Pago para completar el pago de forma segura. Acepta tarjetas de crédito, débito y más.</small>
                    </div>
                  </div>
                </div>
              )}
              <small className="form-help">
                Selecciona tu forma de pago preferida
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="notas">Notas del Pedido (Opcional)</label>
              <textarea
                id="notas"
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                placeholder="Indicaciones adicionales para la entrega, horario preferido, etc."
                maxLength={1000}
                rows={3}
              />
              <small className="form-help">
                Información adicional para el repartidor ({formData.notas.length}/1000)
              </small>
            </div>

            <div className="checkout-actions">
              <button
                type="button"
                onClick={() => navigate('/carroCompras')}
                className="btn-secondary"
                disabled={loading}
              >
                Volver al Carrito
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading 
                  ? 'Procesando...' 
                  : formData.metodoPago === 'mercadopago' 
                    ? '🟦 Pagar con Mercado Pago' 
                    : 'Finalizar Pedido'
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal-content">
            <div className="modal-header">
              <h2>Confirmar Detalles de Compra</h2>
              <button className="btn-close-modal" onClick={() => setShowConfirmModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-summary-section">
                <h3>Resumen de Productos</h3>
                <div className="modal-items-list">
                  {carrito.map(item => (
                    <div key={item.id} className="modal-item">
                      <span className="modal-item-name">{item.nombre} (x{item.quantity || item.cantidad})</span>
                      <span className="modal-item-price">{formatPrice((item.precio - (item.precio * (item.descuento || 0) / 100)) * (item.quantity || item.cantidad))}</span>
                    </div>
                  ))}
                </div>
                <div className="modal-totals">
                  <div className="modal-total-row">
                    <span>Subtotal:</span>
                    <span>{formatPrice(calcularSubtotal())}</span>
                  </div>
                  {calcularDescuentos() > 0 && (
                    <div className="modal-total-row discount">
                      <span>Descuentos:</span>
                      <span>-{formatPrice(calcularDescuentos())}</span>
                    </div>
                  )}
                  <div className="modal-total-row">
                    <span>Envío:</span>
                    <span>{tipoEntrega === 'retiro' ? 'Gratis' : formatPrice(shippingCost)}</span>
                  </div>
                  <div className="modal-total-row final-total">
                    <span>Total a Pagar:</span>
                    <span>{formatPrice(totalCarrito + (tipoEntrega === 'retiro' ? 0 : shippingCost))}</span>
                  </div>
                </div>
              </div>

              <div className="modal-details-section">
                <h3>Detalles de Entrega y Pago</h3>
                <div className="modal-detail-item">
                  <strong>Método de Entrega:</strong>
                  <p>{tipoEntrega === 'retiro' ? '🏢 Retiro en Tienda' : '🚚 Despacho a Domicilio'}</p>
                </div>
                <div className="modal-detail-item">
                  <strong>Ubicación:</strong>
                  <p>{tipoEntrega === 'retiro' ? 'La Cantera N°5, Laraquete, Arauco' : formData.direccionEnvio}</p>
                </div>
                <div className="modal-detail-item">
                  <strong>Fecha de {tipoEntrega === 'retiro' ? 'Retiro' : 'Entrega'}:</strong>
                  <p>{tipoEntrega === 'retiro' ? 'Retiro Inmediato' : formData.fechaEntrega}</p>
                </div>
                {isVendedorPresencial && clienteEmail && (
                  <div className="modal-detail-item">
                    <strong>Email del Cliente:</strong>
                    <p>{clienteEmail}</p>
                  </div>
                )}
                {isVendedorPresencial && clienteNombre && (
                  <div className="modal-detail-item">
                    <strong>Nombre del Cliente:</strong>
                    <p>{clienteNombre}</p>
                  </div>
                )}
                <div className="modal-detail-item">
                  <strong>Teléfono de Contacto:</strong>
                  <p>{formData.telefonoContacto}</p>
                </div>
                <div className="modal-detail-item">
                  <strong>Método de Pago:</strong>
                  <p style={{textTransform: 'capitalize'}}>{formData.metodoPago}</p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowConfirmModal(false)} disabled={loading}>
                Volver para editar
              </button>
              <button className="btn-primary" onClick={confirmOrder} disabled={loading}>
                {loading ? 'Procesando...' : (formData.metodoPago === 'mercadopago' ? 'Confirmar (MercadoPago)' : 'Confirmar Pedido')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
