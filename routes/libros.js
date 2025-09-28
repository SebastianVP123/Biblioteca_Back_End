import express from 'express';
import Libro from '../models/Libro.js';

const router = express.Router();

// GET /api/libros - Obtener todos los libros
router.get('/libros', async (req, res) => {
  try {
    const libros = await Libro.find().populate('autor', 'nombre nacionalidad');
    // Asegurar que todos los libros tengan imagenUrl
    libros.forEach(libro => {
      if (!libro.imagenUrl) {
        libro.imagenUrl = `https://picsum.photos/120/120?random=${libro._id}`;
      }
    });
    res.json(libros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/libros/:id - Obtener un libro por ID
router.get('/libros/:id', async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id).populate('autor', 'nombre nacionalidad');
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
  const libro = new Libro({
    titulo: req.body.titulo,
    isbn: req.body.isbn,
    genero: req.body.genero,
    anioPublicacion: req.body.anioPublicacion,
    autor: req.body.autor,
    imagenUrl: req.body.imagenUrl,
    idiomaOriginal: req.body.idiomaOriginal,
    existencias: req.body.existencias || 1
  });

  try {
    const nuevoLibro = await libro.save();
    await nuevoLibro.populate('autor', 'nombre nacionalidad');
    res.status(201).json(nuevoLibro);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/libros/:id - Actualizar un libro
router.put('/libros/:id', async (req, res) => {
  console.log('PUT /libros/:id - ID:', req.params.id, 'Body:', req.body);
  try {
    const libro = await Libro.findById(req.params.id);
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    libro.titulo = req.body.titulo || libro.titulo;
    libro.isbn = req.body.isbn || libro.isbn;
    libro.genero = req.body.genero || libro.genero;
    libro.anioPublicacion = req.body.anioPublicacion || libro.anioPublicacion;
    libro.autor = req.body.autor || libro.autor;
    libro.imagenUrl = req.body.imagenUrl !== undefined ? req.body.imagenUrl : libro.imagenUrl;
    libro.idiomaOriginal = req.body.idiomaOriginal || libro.idiomaOriginal;
    libro.existencias = req.body.existencias !== undefined ? req.body.existencias : libro.existencias;

    console.log('Estado antes:', libro.estado, 'Estado nuevo:', req.body.estado);
    const libroActualizado = await libro.save();
    console.log('Libro actualizado:', libroActualizado.estado);
    await libroActualizado.populate('autor', 'nombre nacionalidad');
    res.json(libroActualizado);
  } catch (error) {
    console.error('Error actualizando libro:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/libros/:id - Eliminar un libro
router.delete('/libros/:id', async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id);
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    await Libro.findByIdAndDelete(req.params.id);
    res.json({ message: 'Libro eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;