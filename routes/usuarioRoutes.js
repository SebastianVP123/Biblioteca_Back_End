import express from 'express';
import Usuario from '../models/Usuario.js';

const router = express.Router();

// GET /api/usuarios - Obtener todos los usuarios con filtros y paginación
router.get('/usuarios', async (req, res) => {
  try {
    const {
      nombre,
      correo,
      rol,
      genero,
      page = 1,
      limit = 10,
      sort = 'createdAt'
    } = req.query;

    let query = {};

    // Filtros
    if (nombre) query.nombre = new RegExp(nombre, 'i');
    if (correo) query.correo = new RegExp(correo, 'i');
    if (rol) query.rol = rol;
    if (genero) query.genero = genero;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sort === 'createdAt' ? { createdAt: -1 } : { nombre: 1 },
      select: '-contrasena' // Excluir contraseña
    };

    const usuarios = await Usuario.paginate(query, options);

    res.json({
      usuarios: usuarios.docs,
      total: usuarios.totalDocs,
      pagina: usuarios.page,
      paginas: usuarios.totalPages,
      limite: usuarios.limit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/usuarios/:id - Obtener un usuario por ID
router.get('/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-contrasena');
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/usuarios - Crear un nuevo usuario
router.post('/usuarios', async (req, res) => {
  console.log('POST /usuarios - Datos recibidos:', req.body);

  const usuarioData = {
    nombre: req.body.nombre,
    correo: req.body.correo,
    telefono: req.body.telefono,
    rol: req.body.rol || 'user',
    // Campos adicionales para lectores
    apellido: req.body.apellido,
    direccion: req.body.direccion,
    genero: req.body.genero,
    tipoIdentificacion: req.body.tipoIdentificacion,
    numeroIdentificacion: req.body.numeroIdentificacion
  };

  // Solo incluir contraseña si se proporciona
  if (req.body.contrasena) {
    usuarioData.contrasena = req.body.contrasena;
  }

  console.log('Datos del usuario a crear:', usuarioData);

  const usuario = new Usuario(usuarioData);

  try {
    const nuevoUsuario = await usuario.save();
    console.log('Usuario creado exitosamente:', nuevoUsuario._id);
    // No devolver contraseña
    const { contrasena, ...usuarioSinPassword } = nuevoUsuario.toObject();
    res.status(201).json(usuarioSinPassword);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/usuarios/:id - Actualizar un usuario
router.put('/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    usuario.nombre = req.body.nombre || usuario.nombre;
    usuario.correo = req.body.correo || usuario.correo;
    usuario.telefono = req.body.telefono !== undefined ? req.body.telefono : usuario.telefono;
    if (req.body.contrasena) {
      usuario.contrasena = req.body.contrasena; // Se hasheará automáticamente
    }
    usuario.rol = req.body.rol || usuario.rol;
    // Campos adicionales para lectores
    usuario.apellido = req.body.apellido !== undefined ? req.body.apellido : usuario.apellido;
    usuario.direccion = req.body.direccion !== undefined ? req.body.direccion : usuario.direccion;
    usuario.genero = req.body.genero || usuario.genero;
    usuario.tipoIdentificacion = req.body.tipoIdentificacion || usuario.tipoIdentificacion;
    usuario.numeroIdentificacion = req.body.numeroIdentificacion !== undefined ? req.body.numeroIdentificacion : usuario.numeroIdentificacion;

    const usuarioActualizado = await usuario.save();
    const { contrasena, ...usuarioSinPassword } = usuarioActualizado.toObject();
    res.json(usuarioSinPassword);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/usuarios/:id - Eliminar un usuario
router.delete('/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/usuarios/login - Login de usuario
router.post('/usuarios/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    const usuario = await Usuario.findOne({ correo });

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await usuario.comparePassword(contrasena);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const { contrasena: _, ...usuarioSinPassword } = usuario.toObject();
    res.json({ message: 'Login exitoso', usuario: usuarioSinPassword });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
