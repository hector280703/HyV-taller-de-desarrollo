import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, updateProduct, createProduct, deleteProduct, getLowStockProducts } from '@services/product.service.js';
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from '@helpers/sweetAlert.js';
import { formatPrice } from '@helpers/formatData.js';
import CountUp from '../components/CountUp.jsx';
import Popup from '../components/Popup';
import useCreateProduct from '@hooks/products/useCreateProduct.jsx';
import useEditProduct from '@hooks/products/useEditProduct.jsx';
import '@styles/inventory.css';

// Utilidad para exportar a CSV
const exportToCSV = (products) => {
  const lines = [];
  const fecha = new Date().toLocaleDateString('es-CL');
  const hora = new Date().toLocaleTimeString('es-CL');

  lines.push('INFORME DE INVENTARIO - HyV Construcciones');
  lines.push(`Generado el: ${fecha} a las ${hora}`);
  lines.push('');

  lines.push('Código,Nombre,Categoría,Precio,Stock,Unidad Medida,Estado');
  products.forEach(p => {
    lines.push(
      `"${p.codigo}","${p.nombre}","${p.categoria || ''}",$${p.precio},${p.stock},"${p.unidadMedida}","${p.activo ? 'Activo' : 'Inactivo'}"`
    );
  });

  const BOM = '\uFEFF';
  const csvContent = BOM + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inventario_hyv_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Utilidad para exportar a PDF (HTML/Print)
const exportToPDF = (products, stats) => {
  const fecha = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const hora = new Date().toLocaleTimeString('es-CL');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Inventario - HyV Construcciones</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #2c3e50; padding: 40px; background: white; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 4px solid #3498db; }
        .header h1 { font-size: 28px; color: #2c3e50; margin-bottom: 5px; }
        .header .subtitle { font-size: 18px; color: #3498db; font-weight: 600; }
        .header .date { font-size: 13px; color: #7f8c8d; margin-top: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
        .stat-box { background: #f8f9fa; border-radius: 10px; padding: 15px; text-align: center; border: 1px solid #ecf0f1; }
        .stat-box .label { font-size: 11px; color: #7f8c8d; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
        .stat-box .value { font-size: 22px; font-weight: bold; color: #2c3e50; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        th { background: #2c3e50; color: white; padding: 10px 12px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
        td { padding: 8px 12px; border-bottom: 1px solid #ecf0f1; }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ecf0f1; color: #7f8c8d; font-size: 11px; }
        .text-right { text-align: right; }
        .badge { padding: 3px 8px; border-radius: 10px; font-weight: bold; color: white; font-size: 10px;}
        .bg-red { background: #e74c3c; }
        .bg-green { background: #2ecc71; }
        @media print { body { padding: 20px; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📦 HyV Construcciones</h1>
        <div class="subtitle">Reporte General de Inventario</div>
        <div class="date">Generado el ${fecha} a las ${hora}</div>
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <div class="label">Total Productos</div>
          <div class="value">${stats.totalProductos}</div>
        </div>
        <div class="stat-box">
          <div class="label">Valorización Total</div>
          <div class="value">${formatPrice(stats.valorizacionTotal)}</div>
        </div>
        <div class="stat-box">
          <div class="label">Productos Bajo Stock</div>
          <div class="value">${stats.productosBajoStock}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th class="text-right">Precio</th>
            <th class="text-right">Stock</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr>
              <td><strong>${p.codigo}</strong></td>
              <td>${p.nombre}</td>
              <td>${p.categoria || 'N/A'}</td>
              <td class="text-right">${formatPrice(p.precio)}</td>
              <td class="text-right"><strong>${p.stock}</strong> <small>${p.unidadMedida}</small></td>
              <td><span class="badge ${p.stock <= 5 ? 'bg-red' : 'bg-green'}">${p.stock <= 5 ? 'Bajo Stock' : 'Normal'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>HyV Construcciones — La Cantera N°5, Laraquete, Arauco, Región del Bío Bío</p>
        <p>Este informe fue generado automáticamente desde el panel de bodega/administración.</p>
      </div>

      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};

export default function Inventory() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('usuario'));

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Para exportar todos
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalProductos: 0, valorizacionTotal: 0, productosBajoStock: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const {
    handleCreate,
    isPopupOpen: isCreatePopupOpen,
    setIsPopupOpen: setIsCreatePopupOpen
  } = useCreateProduct(null, () => fetchData());

  const {
    handleUpdate,
    isPopupOpen: isEditPopupOpen,
    setIsPopupOpen: setIsEditPopupOpen,
    dataProduct,
    setDataProduct
  } = useEditProduct(null, () => fetchData());

  useEffect(() => {
    if (!user || (user.rol !== 'administrador' && user.rol !== 'bodeguero')) {
      showErrorAlert('Acceso denegado', 'No tienes permisos para acceder a esta página');
      navigate('/');
      return;
    }
    fetchData();
  }, [currentPage, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getProducts({ page: currentPage, limit: 12, search: searchTerm });
      setProducts(result.products || []);
      setTotalPages(result.totalPages || 1);

      // Cargar todos los productos sin limite para stats y exportación
      const allResult = await getProducts({ page: 1, limit: 10000 });
      const totalProds = allResult.products || [];
      setAllProducts(totalProds);

      const lowStock = await getLowStockProducts();
      
      const valorizacion = totalProds.reduce((sum, p) => sum + (Number(p.precio) * Number(p.stock)), 0);

      setStats({
        totalProductos: allResult.total || 0,
        valorizacionTotal: valorizacion,
        productosBajoStock: lowStock.length,
      });

    } catch (error) {
      showErrorAlert('Error', 'No se pudo cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirmAlert('¿Eliminar producto?', 'Esta acción no se puede deshacer');
    if (!confirmed) return;
    try {
      await deleteProduct(id);
      showSuccessAlert('Eliminado', 'El producto fue eliminado');
      fetchData();
    } catch (error) {
      showErrorAlert('Error', 'No se pudo eliminar el producto');
    }
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>📦 Gestión de Inventario</h1>
        <p className="inventory-subtitle">Control de stock, productos y reportes</p>
        
        <div className="export-actions">
          <button
            className="btn-export btn-export-csv"
            onClick={() => {
              exportToCSV(allProducts);
              showSuccessAlert('Exportado', 'El inventario CSV se ha descargado');
            }}
          >
            📄 Exportar CSV
          </button>
          <button
            className="btn-export btn-export-pdf"
            onClick={() => exportToPDF(allProducts, stats)}
          >
            📑 Exportar PDF
          </button>
          <button
            className="btn-add-product"
            onClick={() => setIsCreatePopupOpen(true)}
          >
            ➕ Nuevo Producto
          </button>
        </div>
      </div>

      <div className="inventory-stats-grid">
        <div className="inventory-stat-card">
          <div className="inventory-stat-icon">📦</div>
          <div className="stat-content">
            <p className="inventory-stat-label">Total Productos</p>
            <p className="inventory-stat-value"><CountUp end={stats.totalProductos} /></p>
          </div>
        </div>
        <div className="inventory-stat-card">
          <div className="inventory-stat-icon">💰</div>
          <div className="stat-content">
            <p className="inventory-stat-label">Valorización del Stock</p>
            <p className="inventory-stat-value"><CountUp end={stats.valorizacionTotal} isCurrency={true} /></p>
          </div>
        </div>
        <div className="inventory-stat-card">
          <div className="inventory-stat-icon alert-icon">🚨</div>
          <div className="stat-content">
            <p className="inventory-stat-label">Productos Bajo Stock</p>
            <p className="inventory-stat-value text-red"><CountUp end={stats.productosBajoStock} /></p>
          </div>
        </div>
      </div>

      <div className="inventory-content">
        <div className="content-header">
          <h2>Lista de Productos</h2>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Buscar por código o nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">Cargando inventario...</div>
        ) : (
          <div className="table-responsive">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.codigo}</strong></td>
                      <td>{p.nombre}</td>
                      <td>{p.categoria || 'Sin Categoría'}</td>
                      <td>{formatPrice(p.precio)}</td>
                      <td>
                        <span className={`stock-badge ${p.stock <= 5 ? 'stock-low' : 'stock-ok'}`}>
                          {p.stock} {p.unidadMedida}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${p.activo ? 'active' : 'inactive'}`}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-edit" onClick={() => {
                            setDataProduct([p]);
                            setIsEditPopupOpen(true);
                          }} title="Editar">✏️</button>
                          {user.rol === 'administrador' && (
                            <button className="btn-delete" onClick={() => handleDelete(p.id)} title="Eliminar">🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">No se encontraron productos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(c => c - 1)}
            >
              Anterior
            </button>
            <span>Página {currentPage} de {totalPages}</span>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(c => c + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Popup para crear producto */}
      <Popup 
        show={isCreatePopupOpen} 
        setShow={setIsCreatePopupOpen} 
        data={[]} 
        action={handleCreate}
        isProductForm={true}
        isCreateMode={true}
      />
      
      {/* Popup para editar producto */}
      <Popup 
        show={isEditPopupOpen} 
        setShow={setIsEditPopupOpen} 
        data={dataProduct} 
        action={handleUpdate}
        isProductForm={true}
        isCreateMode={false}
      />
    </div>
  );
}
