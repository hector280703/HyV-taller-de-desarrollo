# 🐳 Guía de Docker - HyV Taller de Desarrollo

Esta guía te ayudará a ejecutar el proyecto usando Docker y Docker Compose.

## 📋 Requisitos Previos

- Docker instalado (versión 20.10 o superior)
- Docker Compose instalado (versión 2.0 o superior)
- Al menos 5GB de espacio libre en disco

## 🚀 Inicio Rápido

### Instalación Automática (Linux)

Si estás en Linux, puedes usar el script de instalación automática:

```bash
chmod +x setup.sh test-docker.sh logs.sh
./test-docker.sh    # Verificar que Docker esté instalado
./setup.sh          # Instalar y ejecutar el proyecto
```

### Instalación Manual

1. **Clonar el repositorio** (si aún no lo has hecho)
   ```bash
   git clone <tu-repositorio>
   cd HyV-taller-de-desarrollo
   ```

2. **Construir y ejecutar los contenedores**
   ```bash
   docker-compose up --build -d
   ```

3. **Verificar que los contenedores estén corriendo**
   ```bash
   docker-compose ps
   ```

4. **Acceder a la aplicación**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api
   - Base de datos PostgreSQL: localhost:5432

## 🛠️ Comandos Útiles

### Ver logs en tiempo real
```bash
./logs.sh                           # Con script (Linux)
docker-compose logs -f              # Todos los servicios
docker-compose logs -f backend      # Solo backend
docker-compose logs -f frontend     # Solo frontend
docker-compose logs -f database     # Solo base de datos
```

### Detener los contenedores
```bash
docker-compose down
```

### Detener y eliminar volúmenes (datos de la base de datos)
```bash
docker-compose down -v
```

### Reiniciar un servicio específico
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart database
```

### Ver el estado de los contenedores
```bash
docker-compose ps
```

### Reconstruir los contenedores
```bash
docker-compose up --build -d
```

### Ejecutar comandos dentro de un contenedor
```bash
# Acceder al contenedor del backend
docker-compose exec backend sh

# Acceder al contenedor de la base de datos
docker-compose exec database psql -U postgres -d hyv_taller_desarrollo
```

## 📦 Estructura de Docker

El proyecto utiliza tres contenedores principales:

### 1. Database (PostgreSQL 15)
- Puerto: 5432
- Usuario: postgres
- Contraseña: admin1234
- Base de datos: hyv_taller_desarrollo
- Volumen persistente: postgres_data

### 2. Backend (Node.js)
- Puerto: 3000
- Framework: Express
- ORM: TypeORM
- Se conecta automáticamente a la base de datos

### 3. Frontend (React + Vite)
- Puerto: 5173 (mapeado internamente al 80)
- Servidor: Nginx
- Proxy configurado para `/api/` hacia el backend

## 🔧 Configuración

### Variables de Entorno

El `docker-compose.yml` ya incluye las variables de entorno necesarias:

**Backend:**
- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT=3000`
- `DB_HOST=database`
- `DB_USERNAME=postgres`
- `PASSWORD=admin1234`
- `DATABASE=hyv_taller_desarrollo`

**Frontend:**
- `NODE_ENV=production`

### Modificar la configuración

Si necesitas cambiar alguna configuración, edita el archivo `docker-compose.yml` en la raíz del proyecto.

## 🐛 Solución de Problemas

### Los contenedores no inician
```bash
# Ver logs para identificar el error
docker-compose logs

# Reiniciar Docker
sudo systemctl restart docker
docker-compose up --build -d
```

### Error de permisos
```bash
# Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesión y volver a iniciar sesión, o usar:
newgrp docker
```

### Puerto ya en uso
```bash
# Ver qué está usando el puerto
sudo lsof -i :5173
sudo lsof -i :3000
sudo lsof -i :5432

# Detener el proceso o cambiar el puerto en docker-compose.yml
```

### La base de datos no se conecta
```bash
# Verificar que el contenedor de la base de datos esté corriendo
docker-compose ps

# Ver logs de la base de datos
docker-compose logs database

# Reiniciar el servicio de la base de datos
docker-compose restart database
```

### Limpiar todo y empezar de nuevo
```bash
# Detener y eliminar todos los contenedores, redes y volúmenes
docker-compose down -v

# Eliminar imágenes construidas
docker-compose down --rmi all

# Reconstruir todo
docker-compose up --build -d
```

## 📝 Desarrollo

### Modo desarrollo sin Docker

Si prefieres ejecutar el proyecto sin Docker para desarrollo:

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Base de datos:**
Necesitarás PostgreSQL instalado localmente o usar el contenedor de la base de datos:
```bash
docker-compose up database -d
```

### Hot Reload

El `docker-compose.yml` actual no incluye hot reload. Para desarrollo, se recomienda usar el modo desarrollo sin Docker (arriba) o agregar volúmenes de sincronización:

```yaml
# Ejemplo para habilitar hot reload (añadir a docker-compose.yml)
backend:
  volumes:
    - ./backend/src:/app/src
  command: npm run dev

frontend:
  volumes:
    - ./frontend/src:/app/src
  command: npm run dev
```

## 🔒 Seguridad

⚠️ **Importante:** Las credenciales en `docker-compose.yml` son para desarrollo local. En producción:

1. Usa variables de entorno externas
2. Utiliza Docker secrets
3. Configura credenciales seguras
4. Habilita HTTPS
5. Configura un firewall apropiado

## 📚 Recursos Adicionales

- [Documentación de Docker](https://docs.docker.com/)
- [Documentación de Docker Compose](https://docs.docker.com/compose/)
- [Mejores prácticas de Docker](https://docs.docker.com/develop/dev-best-practices/)

## 🆘 Soporte

Si encuentras problemas, verifica:
1. Los logs con `docker-compose logs`
2. El estado de los contenedores con `docker-compose ps`
3. Que los puertos no estén en uso
4. Que tengas espacio suficiente en disco
5. Que Docker esté actualizado
