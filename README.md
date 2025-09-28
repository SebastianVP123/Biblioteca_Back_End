# API de Gestión de Biblioteca

Una API REST completa para la gestión de bibliotecas, desarrollada con Node.js, Express y MongoDB. Permite administrar libros, autores, usuarios, préstamos y generar reportes detallados.

## 🚀 Características

- **Gestión completa de libros**: CRUD de libros con validaciones, búsqueda y filtros
- **Sistema de usuarios**: Autenticación, roles (admin/user), perfiles detallados
- **Control de préstamos**: Gestión de préstamos activos, vencidos y devoluciones
- **Reportes avanzados**: Generación de reportes en PDF y Excel
- **Estadísticas y dashboard**: Métricas en tiempo real del sistema
- **API RESTful**: Endpoints bien documentados con paginación
- **Validaciones robustas**: Validaciones en modelos y rutas
- **Seguridad**: Hashing de contraseñas con bcrypt

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js con Express.js
- **Base de datos**: MongoDB con Mongoose ODM
- **Autenticación**: bcrypt para hashing de contraseñas
- **Reportes**: pdfkit para PDF, exceljs para Excel
- **Validaciones**: Validaciones integradas en Mongoose
- **Paginación**: mongoose-paginate-v2
- **CORS**: Configurado para desarrollo frontend

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- MongoDB (local o Atlas)
- npm o yarn

## 🔧 Instalación

1. **Clona el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd biblioteca-back-end
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**:
   Crea un archivo `.env` en la raíz del proyecto con:
   ```env
   PORT=5001
   MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/nombre-db?retryWrites=true&w=majority
   MONGO_USER=tu_usuario_mongodb
   MONGO_PASSWORD=tu_password_mongodb
   ```

4. **Ejecuta la aplicación**:
   ```bash
   npm run dev
   ```

   O para crear un administrador inicial:
   ```bash
   npm run create-admin
   ```

## 📖 Uso

### Scripts Disponibles

- `npm run dev`: Inicia el servidor en modo desarrollo
- `npm run create-admin`: Crea un usuario administrador inicial

### Endpoints Principales

#### Libros
- `GET /api/libros` - Lista libros con filtros y paginación
- `POST /api/libros` - Crear libro
- `PUT /api/libros/:id` - Actualizar libro
- `DELETE /api/libros/:id` - Eliminar libro
- `GET /api/libros/disponibles` - Libros disponibles para préstamo

#### Usuarios
- `GET /api/usuarios` - Lista usuarios
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario
- `POST /api/usuarios/login` - Login de usuario

#### Préstamos
- `GET /api/prestamos` - Lista préstamos
- `POST /api/prestamos` - Crear préstamo
- `PUT /api/prestamos/:id` - Actualizar préstamo (cambiar estado)
- `DELETE /api/prestamos/:id` - Eliminar préstamo

#### Autores
- `GET /api/autores` - Lista autores
- `POST /api/autores` - Crear autor
- `PUT /api/autores/:id` - Actualizar autor
- `DELETE /api/autores/:id` - Eliminar autor

#### Devoluciones
- `GET /api/devoluciones` - Lista devoluciones
- `POST /api/devoluciones` - Registrar devolución
- `PUT /api/devoluciones/:id` - Actualizar devolución

#### Reportes
- `GET /api/reportes/estadisticas-generales` - Estadísticas del sistema
- `GET /api/reportes/dashboard-admin` - Dashboard para administradores
- `GET /api/reportes/prestamos-vencidos` - Préstamos vencidos
- `GET /api/reportes/usuarios/pdf` - Reporte PDF de usuarios
- `GET /api/reportes/libros/excel` - Reporte Excel de libros
- `GET /api/reportes/prestamos/pdf` - Reporte PDF de préstamos activos

## 🏗️ Estructura del Proyecto

```
biblioteca-back-end/
├── classes/                 # Clases auxiliares (opcional)
├── Control/                 # Controladores de lógica de negocio
│   ├── ControlAutor.js
│   ├── ControlLibro.js
│   ├── ControlPrestamo.js
│   ├── ControlUsuario.js
│   └── main.js             # Punto de entrada
├── models/                  # Modelos de Mongoose
│   ├── Autor.js
│   ├── Devolucion.js
│   ├── Libro.js
│   ├── Prestamo.js
│   └── Usuario.js
├── routes/                  # Definición de rutas
│   ├── autorRoutes.js
│   ├── devolucionRoutes.js
│   ├── libroRoutes.js
│   ├── prestamoRoutes.js
│   ├── reportesRoutes.js
│   ├── usuarioRoutes.js
│   └── libros.js
├── scripts/                 # Scripts utilitarios
│   └── createAdmin.js
├── .env                     # Variables de entorno
├── package.json
└── README.md
```

## 📊 Modelos de Datos

### Usuario
- nombre, correo, teléfono, contraseña (hasheada)
- rol (admin/user), dirección, género, identificación

### Libro
- título, ISBN, género, año publicación, autor
- imagen URL, existencias, idioma original

### Autor
- nombre, nacionalidad, fecha nacimiento, sitio web, biografía

### Préstamo
- usuario, libro, fechas de préstamo/devolución, estado

### Devolución
- usuario, libro, fechas, estado, multa, condición del libro

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Validaciones de entrada en todos los modelos
- CORS configurado para orígenes específicos
- Exclusión de campos sensibles en respuestas JSON

## 📈 Reportes y Estadísticas

La API incluye un sistema completo de reportes:

- **Estadísticas generales**: Totales, porcentajes, actividad reciente
- **Dashboard administrativo**: Métricas rápidas y usuarios más activos
- **Reportes por entidad**: Usuarios, libros, autores, préstamos, devoluciones
- **Formatos**: JSON, PDF y Excel
- **Filtros temporales**: Por mes, año, fechas específicas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

Para preguntas o soporte, por favor contacta al desarrollador.

---

**Nota**: Asegúrate de configurar correctamente las variables de entorno antes de ejecutar la aplicación. La base de datos MongoDB debe estar accesible y las credenciales válidas.