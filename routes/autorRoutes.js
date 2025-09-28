import express from 'express';
import Autor from '../models/Autor.js';

const router = express.Router();

// GET /api/autores - Obtener todos los autores con filtros y paginación
router.get('/autores', async (req, res) => {
  try {
    const {
      nombre,
      nacionalidad,
      anioNacimiento,
      page = 1,
      limit = 10,
      sort = 'nombre'
    } = req.query;

    let query = {};

    // Filtros
    if (nombre) query.nombre = new RegExp(nombre, 'i');
    if (nacionalidad) query.nacionalidad = new RegExp(nacionalidad, 'i');
    if (anioNacimiento) {
      const year = parseInt(anioNacimiento);
      query.fechaNacimiento = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sort === 'nombre' ? { nombre: 1 } : { createdAt: -1 }
    };

    const autores = await Autor.paginate(query, options);

    res.json({
      autores: autores.docs,
      total: autores.totalDocs,
      pagina: autores.page,
      paginas: autores.totalPages,
      limite: autores.limit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/autores/:id - Obtener un autor por ID
router.get('/autores/:id', async (req, res) => {
  try {
    const autor = await Autor.findById(req.params.id);
    if (!autor) {
      return res.status(404).json({ message: 'Autor no encontrado' });
    }
    res.json(autor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/autores - Crear un nuevo autor
router.post('/autores', async (req, res) => {
  const autor = new Autor({
    nombre: req.body.nombre,
    nacionalidad: req.body.nacionalidad,
    fechaNacimiento: req.body.fechaNacimiento,
    sitioWeb: req.body.sitioWeb,
    biografia: req.body.biografia,
    imagenUrl: req.body.imagenUrl
  });

  try {
    const nuevoAutor = await autor.save();
    res.status(201).json(nuevoAutor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/autores/:id - Actualizar un autor
router.put('/autores/:id', async (req, res) => {
  try {
    const autor = await Autor.findById(req.params.id);
    if (!autor) {
      return res.status(404).json({ message: 'Autor no encontrado' });
    }

    autor.nombre = req.body.nombre || autor.nombre;
    autor.nacionalidad = req.body.nacionalidad || autor.nacionalidad;
    autor.fechaNacimiento = req.body.fechaNacimiento !== undefined ? req.body.fechaNacimiento : autor.fechaNacimiento;
    autor.sitioWeb = req.body.sitioWeb !== undefined ? req.body.sitioWeb : autor.sitioWeb;
    autor.biografia = req.body.biografia !== undefined ? req.body.biografia : autor.biografia;
    autor.imagenUrl = req.body.imagenUrl !== undefined ? req.body.imagenUrl : autor.imagenUrl;

    const autorActualizado = await autor.save();
    res.json(autorActualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/autores/:id - Eliminar un autor
router.delete('/autores/:id', async (req, res) => {
  try {
    const autor = await Autor.findById(req.params.id);
    if (!autor) {
      return res.status(404).json({ message: 'Autor no encontrado' });
    }

    await Autor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Autor eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
