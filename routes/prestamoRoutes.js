import express from 'express';
import Prestamo from '../models/Prestamo.js';
import Libro from '../models/Libro.js';

const router = express.Router();

// GET /api/prestamos - Obtener todos los préstamos con filtros y paginación
router.get('/prestamos', async (req, res) => {
  try {
    const {
      usuario,
      libro,
      estado,
      fechaDesde,
      fechaHasta,
      page = 1,
      limit = 10,
      sort = 'fechaPrestamo'
    } = req.query;

    let query = {};

    // Filtros
    if (usuario) query.usuario = usuario; // ID del usuario
    if (libro) query.libro = libro; // ID del libro
    if (estado) query.estado = estado;

    // Filtros de fecha
    if (fechaDesde || fechaHasta) {
      query.fechaPrestamo = {};
      if (fechaDesde) query.fechaPrestamo.$gte = new Date(fechaDesde);
      if (fechaHasta) query.fechaPrestamo.$lte = new Date(fechaHasta);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sort === 'fechaPrestamo' ? { fechaPrestamo: -1 } : { createdAt: -1 },
      populate: [
        { path: 'usuario', select: 'nombre correo' },
        { path: 'libro', select: 'titulo isbn' }
      ]
    };

    const prestamos = await Prestamo.paginate(query, options);

    res.json({
      prestamos: prestamos.docs,
      total: prestamos.totalDocs,
      pagina: prestamos.page,
      paginas: prestamos.totalPages,
      limite: prestamos.limit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/prestamos/:id - Obtener un préstamo por ID
router.get('/prestamos/:id', async (req, res) => {
  try {
    const prestamo = await Prestamo.findById(req.params.id)
      .populate('usuario', 'nombre correo')
      .populate('libro', 'titulo isbn');
    if (!prestamo) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }
    res.json(prestamo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/prestamos - Crear un nuevo préstamo
router.post('/prestamos', async (req, res) => {
  try {
    // Verificar si el libro existe
    const libro = await Libro.findById(req.body.libro);
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    // Verificar si hay existencias disponibles
    if (libro.existencias <= 0) {
      return res.status(400).json({ message: 'Libro no disponible para préstamo' });
    }

    const prestamo = new Prestamo({
      usuario: req.body.usuario,
      libro: req.body.libro,
      fechaPrestamo: req.body.fechaPrestamo || new Date(),
      fechaDevolucion: req.body.fechaDevolucion
    });

    const nuevoPrestamo = await prestamo.save();

    // Decrementar existencias del libro
    libro.existencias -= 1;
    await libro.save();

    await nuevoPrestamo.populate('usuario', 'nombre correo');
    await nuevoPrestamo.populate('libro', 'titulo isbn');
    res.status(201).json(nuevoPrestamo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/prestamos/:id - Actualizar un préstamo
router.put('/prestamos/:id', async (req, res) => {
  try {
    const prestamo = await Prestamo.findById(req.params.id);
    if (!prestamo) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    const estadoAnterior = prestamo.estado;
    const nuevoEstado = req.body.estado || prestamo.estado;

    // Validar cambio de estado
    if (req.body.estado) {
      const libro = await Libro.findById(prestamo.libro);
      if (!libro) {
        return res.status(404).json({ message: 'Libro no encontrado' });
      }

      // Lógica de existencias basada en cambio de estado
      if (estadoAnterior !== nuevoEstado) {
        if (nuevoEstado === 'activo') {
          // Cambiando a activo: verificar y restar existencias
          if (libro.existencias <= 0) {
            return res.status(400).json({ message: 'No hay existencias disponibles para activar este préstamo' });
          }
          libro.existencias -= 1;
        } else if (nuevoEstado === 'devuelto') {
          // Cambiando a devuelto: sumar existencias si venía de activo o vencido
          if (estadoAnterior === 'activo' || estadoAnterior === 'vencido') {
            libro.existencias += 1;
          }
        } else if (nuevoEstado === 'vencido') {
          // Cambiando a vencido: si venía de devuelto, restar existencias
          if (estadoAnterior === 'devuelto') {
            if (libro.existencias <= 0) {
              return res.status(400).json({ message: 'No hay existencias disponibles para marcar como vencido este préstamo' });
            }
            libro.existencias -= 1;
          }
          // Si venía de activo, no cambiar existencias (el libro sigue prestado)
        }

        await libro.save();
      }
    }

    prestamo.estado = nuevoEstado;
    if (req.body.fechaDevolucion) {
      prestamo.fechaDevolucion = req.body.fechaDevolucion;
    }

    const prestamoActualizado = await prestamo.save();

    await prestamoActualizado.populate('usuario', 'nombre correo');
    await prestamoActualizado.populate('libro', 'titulo isbn');
    res.json(prestamoActualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/prestamos/:id - Eliminar un préstamo
router.delete('/prestamos/:id', async (req, res) => {
  try {
    const prestamo = await Prestamo.findById(req.params.id);
    if (!prestamo) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    // Incrementar existencias si se elimina un préstamo activo
    if (prestamo.estado === 'activo') {
      const libro = await Libro.findById(prestamo.libro);
      if (libro) {
        libro.existencias += 1;
        await libro.save();
      }
    }

    await Prestamo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Préstamo eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
