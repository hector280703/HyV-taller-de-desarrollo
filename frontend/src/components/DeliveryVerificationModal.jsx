import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Modal de verificación de entrega.
 * Permite al repartidor confirmar una entrega escaneando el QR
 * o ingresando manualmente el número de orden.
 *
 * Props:
 *  - order: objeto con la orden a verificar (debe tener numeroOrden)
 *  - onConfirm: función llamada cuando la verificación es exitosa
 *  - onClose: función para cerrar el modal
 */
function DeliveryVerificationModal({ order, onConfirm, onClose }) {
  const [tab, setTab] = useState('manual'); // 'manual' | 'scanner'
  const [manualCode, setManualCode] = useState('');
  const [scannerError, setScannerError] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [scannedValue, setScannedValue] = useState(null);

  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  const SCANNER_ID = 'delivery-qr-scanner';

  // Limpiar el escáner al desmontar o cambiar de tab
  const stopScanner = async () => {
    if (html5QrcodeRef.current && scannerActive) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (_) {
        // ignorar error al detener
      }
      setScannerActive(false);
    }
  };

  const startScanner = async () => {
    setScannerError(null);
    setScannedValue(null);
    setVerificationError(null);

    try {
      const html5Qrcode = new Html5Qrcode(SCANNER_ID);
      html5QrcodeRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          // Éxito al escanear
          setScannedValue(decodedText);
          stopScanner();
          validateCode(decodedText);
        },
        () => {
          // Error de frame (silencioso)
        }
      );
      setScannerActive(true);
    } catch (err) {
      setScannerError(
        'No se pudo acceder a la cámara. Por favor, permite el acceso o usa el modo manual.'
      );
    }
  };

  useEffect(() => {
    if (tab === 'scanner') {
      // Pequeño delay para que el div esté renderizado
      const timer = setTimeout(() => startScanner(), 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateCode = (code) => {
    const trimmedCode = code?.trim().toUpperCase();
    const expectedCode = order?.numeroOrden?.trim().toUpperCase();

    if (trimmedCode === expectedCode) {
      setVerificationError(null);
      onConfirm();
    } else {
      setVerificationError(
        `❌ Código incorrecto. Se esperaba "${order?.numeroOrden}" pero se ingresó "${code?.trim()}".`
      );
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setVerificationError(null);
    validateCode(manualCode);
  };

  const handleTabChange = (newTab) => {
    setVerificationError(null);
    setScannedValue(null);
    setManualCode('');
    setTab(newTab);
  };

  return (
    <div className="dvmodal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dvmodal-container" role="dialog" aria-modal="true" aria-labelledby="dvmodal-title">

        {/* Cabecera */}
        <div className="dvmodal-header">
          <div className="dvmodal-header-icon">✅</div>
          <div>
            <h2 id="dvmodal-title" className="dvmodal-title">Verificar Entrega</h2>
            <p className="dvmodal-subtitle">Orden: <strong>{order?.numeroOrden}</strong></p>
          </div>
          <button className="dvmodal-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Tabs */}
        <div className="dvmodal-tabs">
          <button
            className={`dvmodal-tab ${tab === 'manual' ? 'active' : ''}`}
            onClick={() => handleTabChange('manual')}
          >
            ⌨️ Código Manual
          </button>
          <button
            className={`dvmodal-tab ${tab === 'scanner' ? 'active' : ''}`}
            onClick={() => handleTabChange('scanner')}
          >
            📷 Escanear QR
          </button>
        </div>

        {/* Contenido */}
        <div className="dvmodal-body">

          {/* Tab: Manual */}
          {tab === 'manual' && (
            <div className="dvmodal-manual">
              <p className="dvmodal-instruction">
                Ingresa el número de orden que aparece en el comprobante del cliente:
              </p>
              <form onSubmit={handleManualSubmit} className="dvmodal-form">
                <input
                  id="dvmodal-code-input"
                  type="text"
                  className="dvmodal-input"
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value);
                    setVerificationError(null);
                  }}
                  placeholder="Ej: ORD-20260627-001"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  className="dvmodal-verify-btn"
                  disabled={!manualCode.trim()}
                >
                  🔍 Verificar Código
                </button>
              </form>
            </div>
          )}

          {/* Tab: Escáner QR */}
          {tab === 'scanner' && (
            <div className="dvmodal-scanner">
              <p className="dvmodal-instruction">
                Apunta la cámara al código QR que aparece en el comprobante del cliente:
              </p>

              {/* Contenedor del escáner */}
              <div className="dvmodal-scanner-wrapper">
                <div id={SCANNER_ID} ref={scannerRef} className="dvmodal-qr-reader" />
                {!scannerActive && !scannedValue && !scannerError && (
                  <div className="dvmodal-scanner-loading">
                    <div className="dvmodal-spinner" />
                    <p>Iniciando cámara...</p>
                  </div>
                )}
              </div>

              {scannerError && (
                <div className="dvmodal-error-box">
                  <p>{scannerError}</p>
                  <button
                    className="dvmodal-retry-btn"
                    onClick={() => { setScannerError(null); startScanner(); }}
                  >
                    🔄 Reintentar
                  </button>
                </div>
              )}

              {scannedValue && !verificationError && (
                <div className="dvmodal-scanned-ok">
                  <p>✅ Código escaneado: <strong>{scannedValue}</strong></p>
                </div>
              )}
            </div>
          )}

          {/* Error de verificación (compartido entre tabs) */}
          {verificationError && (
            <div className="dvmodal-verification-error">
              <p>{verificationError}</p>
              <button
                className="dvmodal-retry-btn"
                onClick={() => {
                  setVerificationError(null);
                  setScannedValue(null);
                  if (tab === 'scanner') startScanner();
                }}
              >
                🔄 Intentar de nuevo
              </button>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="dvmodal-footer">
          <button className="dvmodal-cancel-btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeliveryVerificationModal;
