import { useState, useEffect } from 'react';
import { reportStockIssue } from '@services/order.service';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert';
import '@styles/repartidor.css'; // Reusing some base styles
import '@styles/checkout.css'; // For modal styles

export default function PreparationChecklist({ order, onClose, onSuccess }) {
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (order && order.orderItems) {
      setItems(
        order.orderItems.map((item) => ({
          ...item,
          foundQuantity: item.cantidad, // Default to required quantity
        }))
      );
    }
  }, [order]);

  const handleQuantityChange = (productId, value) => {
    const numValue = parseInt(value) || 0;
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            foundQuantity: Math.min(Math.max(0, numValue), item.cantidad), // Clamp between 0 and requested
          };
        }
        return item;
      })
    );
  };

  const hasDiscrepancy = items.some((item) => item.foundQuantity < item.cantidad);

  const handleSubmit = async () => {
    if (submitting) return;

    if (!hasDiscrepancy) {
      // If no discrepancy, just proceed with normal status update to 'listo_para_envio' or 'listo_para_retiro'
      const targetStatus = order.tipoEntrega === 'retiro' ? 'listo_para_retiro' : 'listo_para_envio';
      onSuccess(order.id, targetStatus);
      return;
    }

    // If there is discrepancy, report stock issue
    try {
      setSubmitting(true);
      const issues = items
        .filter((item) => item.foundQuantity < item.cantidad)
        .map((item) => ({
          productId: item.product.id,
          foundQuantity: item.foundQuantity,
        }));

      await reportStockIssue(order.id, issues);
      showSuccessAlert('Incidencia Reportada', 'Se ha ajustado el inventario y la orden ha sido pausada.');
      onSuccess(order.id, 'incidencia_stock'); // Pass special status so parent refetches
      onClose();
    } catch (error) {
      showErrorAlert('Error', error.message || 'No se pudo reportar la incidencia');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <div className="checkout-modal-overlay">
      <div className="checkout-modal-content" style={{ maxWidth: '600px', padding: '30px', background: '#ffffff', color: '#1e293b' }}>
        <button className="close-modal-btn" onClick={onClose} style={{ color: '#64748b' }}>×</button>
        
        <h2 style={{ color: '#0f172a', marginBottom: '15px', fontSize: '24px', fontWeight: '800' }}>
          📋 Checklist de Preparación
        </h2>
        <p style={{ color: '#475569', marginBottom: '25px', fontSize: '15px' }}>
          Verifica físicamente el stock de cada producto para la orden <strong>{order.numeroOrden}</strong>.
        </p>

        <div className="order-items" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
          {items.map((item) => (
            <div 
              key={item.id} 
              style={{ 
                background: '#f8fafc', 
                padding: '16px', 
                borderRadius: '12px', 
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: item.foundQuantity < item.cantidad ? '2px solid #ef4444' : '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ flex: 1, paddingRight: '15px' }}>
                <strong style={{ color: '#1e293b', display: 'block', marginBottom: '6px', fontSize: '15px' }}>{item.product.nombre}</strong>
                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Requerido: {item.cantidad}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#475569', fontSize: '14px', fontWeight: '600' }}>Encontrado:</span>
                <input 
                  type="number" 
                  min="0" 
                  max={item.cantidad}
                  value={item.foundQuantity}
                  onChange={(e) => handleQuantityChange(item.product.id, e.target.value)}
                  style={{
                    width: '70px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '800',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
          <button 
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '10px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '15px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.target.style.background = '#e2e8f0'; }}
            onMouseOut={(e) => { e.target.style.background = '#f1f5f9'; }}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 2,
              padding: '14px',
              borderRadius: '10px',
              background: hasDiscrepancy ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: '700',
              fontSize: '15px',
              opacity: submitting ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: hasDiscrepancy ? '0 4px 14px rgba(239, 68, 68, 0.4)' : '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
            onMouseOver={(e) => { if(!submitting) e.target.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { if(!submitting) e.target.style.transform = 'translateY(0)'; }}
          >
            {submitting ? '⏳ Procesando...' : 
              (hasDiscrepancy ? '⚠️ Reportar Falta de Stock' : (order.tipoEntrega === 'retiro' ? '✅ Confirmar y Listo para Retiro' : '✅ Confirmar y Listo para Envío'))}
          </button>
        </div>
      </div>
    </div>
  );
}
