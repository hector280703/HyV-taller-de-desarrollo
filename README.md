#  E-Commerce de Materiales de Construcción

Plataforma web profesional para la venta de materiales de construcción, desarrollada para HyV Construcciones.

##  Características Principales

### **Para Visitantes y Clientes:**
-  **Catálogo Público**: Visualización completa de productos sin necesidad de registro
-  **Búsqueda y Filtros**: Búsqueda por código y filtrado por categorías
-  **Vista de Productos**: Información detallada con precios, descuentos y stock
-  **Doble Vista**: Cambio entre vista de tabla y vista de tarjetas
-  **Responsive**: Diseño adaptable a todos los dispositivos

### **Para Administradores:**
-  **Gestión de Productos**: Crear, editar y eliminar productos
-  **Gestión de Usuarios**: Control total de usuarios del sistema
-  **Panel de Administración**: Interfaz intuitiva para control total
-  **Sistema de Autenticación**: Login seguro con JWT

##  Tecnologías Utilizadas

### **Backend:**
- Node.js + Express.js
- TypeORM (PostgreSQL)
- JWT para autenticación
- Passport.js
- Joi para validaciones

### **Frontend:**
- React + Vite
- React Router DOM
- Axios para peticiones HTTP
- Tabulator para tablas interactivas
- CSS Modules

##  Estructura del Proyecto

```
HyV-taller-de-desarrollo/
├── backend/
│   ├── src/
│   │   ├── entity/          # Modelos de base de datos
│   │   ├── controllers/     # Controladores
│   │   ├── services/        # Lógica de negocio
│   │   ├── routes/          # Rutas de la API
│   │   ├── middlewares/     # Autenticación y autorización
│   │   ├── validations/     # Validaciones con Joi
│   │   └── config/          # Configuración DB y entorno
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/      # Componentes reutilizables
    │   ├── pages/           # Páginas principales
    │   ├── services/        # Servicios de API
    │   ├── hooks/           # Custom hooks
    │   ├── context/         # Context API
    │   └── styles/          # Archivos CSS
    └── package.json
```

##  Categorías de Productos

-  Cemento y Morteros
-  Ladrillos y Bloques
-  Fierro y Acero
-  Arena y Ripio
-  Madera
-  Pintura
-  Herramientas
-  Fontanería
-  Electricidad
-  Cerámica y Porcelanato

##  Campos de Productos

Cada producto incluye:
- Nombre
- Código único
- Descripción
- Categoría
- Unidad de medida (kg, m, m², m³, litro, saco, caja, etc.)
- Marca
- Precio
- Descuento (%)
- Stock
- Peso (kg)
- Dimensiones
- URL de imagen
- Estado (activo/inactivo)

##  Roles de Usuario

### **Administrador:**
- Acceso completo al sistema
- Gestión de productos (CRUD)
- Gestión de usuarios

### **Usuario Regular:**
- Visualización de productos
- Acceso al catálogo público

### **Visitante (Sin registro):**
- Visualización de productos
- Navegación por categorías

##  Instalación y Configuración

### **Prerrequisitos:**
- Node.js (v16 o superior)
- PostgreSQL
- Git

### **Backend:**

```bash
cd backend
npm install

# Configurar variables de entorno (.env)
# DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
# JWT_SECRET

npm run dev
```

### **Frontend:**

```bash
cd frontend
npm install

# Configurar variables de entorno (.env)
# VITE_BASE_URL=http://localhost:3500/api

npm run dev
```

##  Capturas de Pantalla

*(Próximamente)*

##  Contribuciones

Proyecto desarrollado para HyV Construcciones.

##  Contacto

Para consultas y soporte técnico, contactar al equipo de desarrollo de HyV Construcciones.

---

**Desarrollado con ❤️ para HyV Construcciones**