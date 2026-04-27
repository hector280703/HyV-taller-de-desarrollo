import { useNavigate } from 'react-router-dom';
import '@styles/error404.css';

const Error404 = () => {
    const navigate = useNavigate();

    return (
      <main className="error_404">
        <div className="error-particles">
          <span></span><span></span><span></span>
          <span></span><span></span><span></span>
        </div>

        <div className="error-card">
          <div className="error-icon-wrapper">
            <span className="error-icon">🔧</span>
          </div>

          <h1 className="error-code">
            <span className="digit">4</span>
            <span className="digit zero">0</span>
            <span className="digit">4</span>
          </h1>

          <div className="error-divider"></div>

          <h2 className="error-title">Página no encontrada</h2>
          <p className="error-description">
            Lo sentimos, la página que estás buscando no existe o fue movida.
          </p>

          <div className="error-actions">
            <button className="error-btn primary" onClick={() => navigate('/')}>
              <span>🏠</span> Volver al Inicio
            </button>
            <button className="error-btn secondary" onClick={() => navigate(-1)}>
              <span>←</span> Página Anterior
            </button>
          </div>
        </div>
      </main>
    );
  };
  
export default Error404;