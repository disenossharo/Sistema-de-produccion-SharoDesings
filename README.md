# Sistema de Producción Sharo

Sistema de gestión de producción para la empresa Sharo, desarrollado con React + Vite (frontend) y Node.js + Express + PostgreSQL (backend).

## 🚀 Características

- **Autenticación**: Sistema de login con roles (Admin, Supervisor, Empleado)
- **Panel de Administración**: Gestión de empleados, producción y reportes
- **Panel de Empleado**: Registro de tareas y producción
- **Base de Datos**: PostgreSQL con esquema optimizado
- **API REST**: Endpoints para todas las funcionalidades

## 🛠️ Tecnologías

### Frontend
- React 19.1.0
- Vite 7.0.4
- Bootstrap 5.3.7
- React Bootstrap
- Chart.js para gráficos
- React Router DOM

### Backend
- Node.js
- Express 4.18.2
- PostgreSQL
- JWT para autenticación
- bcryptjs para hash de contraseñas
- CORS configurado

## 📦 Instalación

### Prerrequisitos
- Node.js (versión 16 o superior)
- PostgreSQL
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/jeronimoMC/Sistema-de-produccion-Sharo.git
cd Sistema-de-produccion-Sharo
```

### 2. Configurar la base de datos
```bash
# Crear base de datos PostgreSQL
createdb sharo_production

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales de PostgreSQL
```

### 3. Instalar dependencias
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Ejecutar la aplicación
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 URLs de desarrollo
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **API**: http://localhost:3001/api

## 👥 Usuarios de prueba

### Administrador
- **Email**: admin@sharo.com
- **Contraseña**: admin123

### Supervisor
- **Email**: supervisor@sharo.com
- **Contraseña**: supervisor123

### Empleados
- **Email**: empleado1@sharo.com
- **Contraseña**: empleado123
- **Email**: empleado2@sharo.com
- **Contraseña**: empleado123

## 📁 Estructura del proyecto

```
Sistema-de-produccion-Sharo/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── services/        # Servicios API
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── backend/                  # API Node.js
│   ├── src/
│   │   ├── controllers/     # Controladores
│   │   ├── routes/          # Rutas API
│   │   ├── middleware/      # Middleware
│   │   ├── config/          # Configuración DB
│   │   └── index.js         # Punto de entrada
│   └── package.json
├── vercel.json              # Configuración Vercel
├── railway.json             # Configuración Railway
└── README.md
```

## 🚀 Despliegue

### Vercel (Frontend)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático

### Railway (Backend + Database)
1. Conectar repositorio a Railway
2. Configurar PostgreSQL
3. Configurar variables de entorno
4. Deploy automático

## 📝 Variables de entorno

### Backend (.env)
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sharo_production
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
JWT_SECRET=tu_jwt_secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**JeronimoMC**
- GitHub: [@jeronimoMC](https://github.com/jeronimoMC)

## 📞 Soporte

Si tienes alguna pregunta o problema, por favor abre un issue en el repositorio.