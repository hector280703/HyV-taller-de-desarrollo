const Home = () => {
  const user = JSON.parse(sessionStorage.getItem('usuario')) || null;
  
  return (
    <div style={{ padding: '20px', marginTop: '9vh' }}>
      <h1>Bienvenido {user ? user.nombreCompleto || user.email : 'Invitado'}</h1>
      {!user && (
        <p>Por favor, inicia sesión desde el menú superior para acceder a todas las funcionalidades.</p>
      )}
      {user && user.rol === 'administrador' && (
        <p>Como administrador, tienes acceso a la gestión de usuarios.</p>
      )}
    </div>
  )
}

export default Home