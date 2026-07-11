import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "@services/product.service";
import { createPresentialSale } from "@services/order.service";
import { logout } from "@services/auth.service";
import { showErrorAlert } from "@helpers/sweetAlert";
import { formatPrice } from "@helpers/formatData";
import "@styles/vendedor.css";

function VendedorPresencial() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saleResult, setSaleResult] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("usuario"));

  useEffect(() => {
    if (!user || (user.rol !== "vendedor_presencial" && user.rol !== "administrador")) {
      showErrorAlert("Acceso denegado", "No tienes permisos para acceder a esta pagina");
      navigate("/");
      return;
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.nombre?.toLowerCase().includes(q) ||
            p.codigo?.toLowerCase().includes(q) ||
            p.categoria?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts({ limit: 200 });
      if (response && response.products) {
        const activos = (response.products || []).filter((p) => p.stock > 0);
        setProducts(activos);
        setFilteredProducts(activos);
      }
    } catch (error) {
      showErrorAlert("Error", "No se pudieron cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.product.id === product.id);
      if (exists) {
        if (exists.cantidad >= product.stock) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { product, cantidad: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateCantidad = (productId, cantidad) => {
    const product = products.find((p) => p.id === productId);
    if (cantidad < 1 || cantidad > product?.stock) return;
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, cantidad } : i))
    );
  };

  const calcTotal = () =>
    cart.reduce((acc, item) => {
      const precio = item.product.precio;
      const desc = item.product.descuento || 0;
      return acc + (precio - (precio * desc) / 100) * item.cantidad;
    }, 0);

  const calcSubtotal = () =>
    cart.reduce((acc, item) => acc + item.product.precio * item.cantidad, 0);

  const calcDescuento = () => calcSubtotal() - calcTotal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showErrorAlert("Carrito vacio", "Agrega al menos un producto al carrito");
      return;
    }
    try {
      setSubmitting(true);
      const saleData = {
        items: cart.map((i) => ({ productId: i.product.id, cantidad: i.cantidad })),
        metodoPago,
        clienteNombre,
        clienteEmail,
        telefonoContacto,
        notas,
      };
      const response = await createPresentialSale(saleData);
      if (response && response.data) {
        setSaleResult(response.data);
      }
    } catch (error) {
      showErrorAlert("Error", error.message || "No se pudo registrar la venta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewSale = () => {
    setSaleResult(null);
    setCart([]);
    setClienteNombre("");
    setClienteEmail("");
    setTelefonoContacto("");
    setNotas("");
    setMetodoPago("efectivo");
    setSearchQuery("");
    fetchProducts();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("usuario");
    window.dispatchEvent(new Event("userSessionChanged"));
    logout();
    window.location.href = "/";
  };

  if (saleResult) {
    const { order, codigoEntrega } = saleResult;
    return (
      <div className="vp-container">
        <div className="vp-success-screen">
          <div className="vp-success-header">
            <div className="vp-success-icon">checkmark</div>
            <h1>Venta Registrada!</h1>
            <p className="vp-order-num">
              Orden: <strong>{order.numeroOrden}</strong>
            </p>
          </div>

          <div className="vp-code-box">
            <p className="vp-code-label">CODIGO DE ENTREGA</p>
            <p className="vp-code-value">{codigoEntrega}</p>
            <p className="vp-code-hint">
              Este codigo fue enviado al email del cliente.
              <br />
              El bodeguero lo necesita para confirmar la entrega.
            </p>
          </div>

          <div className="vp-success-details">
            <div className="vp-detail-row">
              <span>Cliente:</span>
              <span>{order.clienteNombre}</span>
            </div>
            <div className="vp-detail-row">
              <span>Email:</span>
              <span>{order.clienteEmail}</span>
            </div>
            <div className="vp-detail-row">
              <span>Total:</span>
              <span className="vp-total-value">{formatPrice(order.total)}</span>
            </div>
            <div className="vp-detail-row">
              <span>Pago:</span>
              <span>
                {order.metodoPago === "efectivo" ? "Efectivo" : "Transferencia"}
              </span>
            </div>
          </div>

          <div className="vp-success-actions">
            <button className="vp-btn-primary" onClick={handleNewSale}>
              Nueva Venta
            </button>
            <button className="vp-btn-secondary" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vp-container">
      <div className="vp-header">
        <div className="vp-header-left">
          <h1>Panel de Venta Presencial</h1>
          <p>
            Bienvenido, <strong>{user?.nombreCompleto}</strong>
          </p>
        </div>
        <button className="vp-logout-btn" onClick={handleLogout}>
          Salir
        </button>
      </div>

      <div className="vp-main">
        <div className="vp-products-panel">
          <div className="vp-search-box">
            <input
              type="text"
              placeholder="Buscar productos por nombre, codigo o categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="vp-search-input"
            />
          </div>

          {loading ? (
            <div className="vp-loading">
              <div className="vp-spinner"></div>
              <p>Cargando productos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="vp-empty">
              <p>No se encontraron productos disponibles</p>
            </div>
          ) : (
            <div className="vp-products-grid">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                const precio = product.precio;
                const desc = product.descuento || 0;
                const precioFinal = precio - (precio * desc) / 100;
                return (
                  <div
                    key={product.id}
                    className={`vp-product-card ${inCart ? "in-cart" : ""}`}
                  >
                    {product.imagen && (
                      <img
                        src={product.imagen}
                        alt={product.nombre}
                        className="vp-product-img"
                      />
                    )}
                    <div className="vp-product-info">
                      <p className="vp-product-name">{product.nombre}</p>
                      <p className="vp-product-code">{product.codigo}</p>
                      <div className="vp-product-price-row">
                        {desc > 0 ? (
                          <>
                            <span className="vp-price-original">
                              {formatPrice(precio)}
                            </span>
                            <span className="vp-price-final">
                              {formatPrice(precioFinal)}
                            </span>
                            <span className="vp-badge-desc">-{desc}%</span>
                          </>
                        ) : (
                          <span className="vp-price-final">
                            {formatPrice(precio)}
                          </span>
                        )}
                      </div>
                      <p className="vp-stock">Stock: {product.stock}</p>
                    </div>
                    <button
                      className="vp-add-btn"
                      onClick={() => addToCart(product)}
                      disabled={inCart?.cantidad >= product.stock}
                    >
                      {inCart
                        ? `En carrito (${inCart.cantidad})`
                        : "Agregar"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="vp-right-panel">
          <div className="vp-cart">
            <h2>Carrito</h2>
            {cart.length === 0 ? (
              <p className="vp-cart-empty">
                Agrega productos desde la lista
              </p>
            ) : (
              <>
                <div className="vp-cart-items">
                  {cart.map((item) => {
                    const precio = item.product.precio;
                    const desc = item.product.descuento || 0;
                    const precioFinal = precio - (precio * desc) / 100;
                    return (
                      <div key={item.product.id} className="vp-cart-item">
                        <div className="vp-cart-item-info">
                          <p className="vp-cart-item-name">
                            {item.product.nombre}
                          </p>
                          <p className="vp-cart-item-price">
                            {formatPrice(precioFinal)} c/u
                          </p>
                        </div>
                        <div className="vp-cart-item-controls">
                          <button
                            onClick={() =>
                              updateCantidad(
                                item.product.id,
                                item.cantidad - 1
                              )
                            }
                          >
                            -
                          </button>
                          <span>{item.cantidad}</span>
                          <button
                            onClick={() =>
                              updateCantidad(
                                item.product.id,
                                item.cantidad + 1
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                        <div className="vp-cart-item-subtotal">
                          {formatPrice(precioFinal * item.cantidad)}
                        </div>
                        <button
                          className="vp-remove-btn"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          X
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="vp-cart-totals">
                  {calcDescuento() > 0 && (
                    <>
                      <div className="vp-total-row">
                        <span>Subtotal:</span>
                        <span>{formatPrice(calcSubtotal())}</span>
                      </div>
                      <div className="vp-total-row vp-discount">
                        <span>Descuento:</span>
                        <span>-{formatPrice(calcDescuento())}</span>
                      </div>
                    </>
                  )}
                  <div className="vp-total-row vp-final-total">
                    <span>Total:</span>
                    <span>{formatPrice(calcTotal())}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <form className="vp-form" onSubmit={handleSubmit}>
            <h2>Datos del Cliente</h2>
            <div className="vp-form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej: Juan Perez"
                required
                minLength={2}
              />
            </div>
            <div className="vp-form-group">
              <label>Email *</label>
              <input
                type="email"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                placeholder="Ej: juan@email.com"
                required
              />
            </div>
            <div className="vp-form-group">
              <label>Telefono *</label>
              <input
                type="tel"
                value={telefonoContacto}
                onChange={(e) => setTelefonoContacto(e.target.value)}
                placeholder="Ej: +56912345678"
                required
              />
            </div>

            <h2>Metodo de Pago</h2>
            <div className="vp-payment-options">
              <label
                className={`vp-payment-option ${
                  metodoPago === "efectivo" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  value="efectivo"
                  checked={metodoPago === "efectivo"}
                  onChange={() => setMetodoPago("efectivo")}
                />
                <span>Efectivo</span>
              </label>
              <label
                className={`vp-payment-option ${
                  metodoPago === "transferencia" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  value="transferencia"
                  checked={metodoPago === "transferencia"}
                  onChange={() => setMetodoPago("transferencia")}
                />
                <span>Transferencia</span>
              </label>
            </div>

            <div className="vp-form-group">
              <label>Notas (opcional)</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={2}
              />
            </div>

            <div className="vp-form-info">
              El cliente recibira un email con el codigo de entrega
              necesario para retirar su pedido.
            </div>

            <button
              type="submit"
              className="vp-submit-btn"
              disabled={submitting || cart.length === 0}
            >
              {submitting
                ? "Procesando..."
                : `Registrar Venta - ${formatPrice(calcTotal())}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VendedorPresencial;
