import express from 'express';
import Libro from '../models/Libro.js';
import Autor from '../models/Autor.js';

const router = express.Router();

// GET /api/libros - Obtener todos los libros con filtros y paginación
router.get('/libros', async (req, res) => {
  try {
    const {
      titulo,
      autor,
      genero,
      anioPublicacion,
      disponible,
      page = 1,
      limit = 10,
      sort = 'titulo'
    } = req.query;

    let query = {};

    // Filtros
    if (titulo) query.titulo = new RegExp(titulo, 'i');
    if (autor) query.autor = autor; // ID del autor
    if (genero) query.genero = new RegExp(genero, 'i');
    if (anioPublicacion) query.anioPublicacion = parseInt(anioPublicacion);
    if (disponible === 'true') query.existencias = { $gt: 0 };
    if (disponible === 'false') query.existencias = { $lte: 0 };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sort === 'titulo' ? { titulo: 1 } : { createdAt: -1 },
      populate: { path: 'autor', select: 'nombre' }
    };

    const libros = await Libro.paginate(query, options);

    res.json({
      libros: libros.docs,
      total: libros.totalDocs,
      pagina: libros.page,
      paginas: libros.totalPages,
      limite: libros.limit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/libros/:id - Obtener un libro por ID
router.get('/libros/:id', async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id).populate('autor', 'nombre');
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    res.json(libro);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/libros - Crear un nuevo libro
router.post('/libros', async (req, res) => {
  try {
    // Verificar que el autor existe
    const autor = await Autor.findById(req.body.autor);
    if (!autor) {
      return res.status(404).json({ message: 'Autor no encontrado' });
    }

    const libro = new Libro({
      titulo: req.body.titulo,
      isbn: req.body.isbn,
      genero: req.body.genero,
      anioPublicacion: parseInt(req.body.anioPublicacion),
      autor: req.body.autor,
      imagenUrl: req.body.imagenUrl,
      existencias: parseInt(req.body.existencias) || 1,
      idiomaOriginal: req.body.idiomaOriginal || 'Español'
    });

    const nuevoLibro = await libro.save();
    await nuevoLibro.populate('autor', 'nombre');
    res.status(201).json(nuevoLibro);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Ya existe un libro con este ISBN' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// PUT /api/libros/:id - Actualizar un libro
router.put('/libros/:id', async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id);
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    // Verificar autor si se está cambiando
    if (req.body.autor) {
      const autor = await Autor.findById(req.body.autor);
      if (!autor) {
        return res.status(404).json({ message: 'Autor no encontrado' });
      }
    }

    libro.titulo = req.body.titulo || libro.titulo;
    libro.isbn = req.body.isbn || libro.isbn;
    libro.genero = req.body.genero !== undefined ? req.body.genero : libro.genero;
    libro.anioPublicacion = req.body.anioPublicacion ? parseInt(req.body.anioPublicacion) : libro.anioPublicacion;
    libro.autor = req.body.autor || libro.autor;
    libro.imagenUrl = req.body.imagenUrl !== undefined ? req.body.imagenUrl : libro.imagenUrl;
    libro.existencias = req.body.existencias !== undefined ? parseInt(req.body.existencias) : libro.existencias;
    libro.idiomaOriginal = req.body.idiomaOriginal || libro.idiomaOriginal;

    const libroActualizado = await libro.save();
    await libroActualizado.populate('autor', 'nombre');
    res.json(libroActualizado);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Ya existe un libro con este ISBN' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// DELETE /api/libros/:id - Eliminar un libro
router.delete('/libros/:id', async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id);
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    // Verificar que no hay préstamos activos
    const Prestamo = (await import('../models/Prestamo.js')).default;
    const prestamosActivos = await Prestamo.find({
      libro: req.params.id,
      estado: { $in: ['activo', 'vencido'] }
    });

    if (prestamosActivos.length > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar el libro porque tiene préstamos activos'
      });
    }

    await Libro.findByIdAndDelete(req.params.id);
    res.json({ message: 'Libro eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/libros/disponibles - Obtener libros disponibles para préstamo
router.get('/libros/disponibles', async (req, res) => {
  try {
    const libros = await Libro.find({ existencias: { $gt: 0 } })
      .populate('autor', 'nombre')
      .sort({ titulo: 1 });
    res.json(libros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
