import Devolucion from '../models/Devolucion.js';
import Prestamo from '../models/Prestamo.js';
import Libro from '../models/Libro.js';

class DevolucionService {
  // Crear una nueva devolución
  async crearDevolucion(datos) {
    try {
      // Verificar que el préstamo existe y está activo
      const prestamo = await Prestamo.findById(datos.prestamo)
        .populate('usuario')
        .populate('libro');

      if (!prestamo) {
        throw new Error('Préstamo no encontrado');
      }

      if (prestamo.estado !== 'activo') {
        throw new Error('El préstamo ya ha sido devuelto o está vencido');
      }

      // Calcular si la devolución es a tiempo o retrasada
      const fechaActual = new Date();
      const estado = fechaActual <= prestamo.fechaDevolucion ? 'a_tiempo' : 'retrasado';

      // Calcular multa si es retrasada (ejemplo: $1 por día de retraso)
      let multa = 0;
      if (estado === 'retrasado') {
        const diasRetraso = Math.ceil((fechaActual - prestamo.fechaDevolucion) / (1000 * 60 * 60 * 24));
        multa = diasRetraso * 1; // $1 por día
      }

      // Crear la devolución
      const nuevaDevolucion = new Devolucion({
        prestamo: datos.prestamo,
        usuario: prestamo.usuario._id,
        libro: prestamo.libro._id,
        fechaDevolucionReal: fechaActual,
        fechaDevolucionEsperada: prestamo.fechaDevolucion,
        estado: estado,
        condicionLibro: datos.condicionLibro || 'bueno',
        observaciones: datos.observaciones || '',
        multa: multa
      });

      const devolucionGuardada = await nuevaDevolucion.save();

      return await devolucionGuardada.populate(['prestamo', 'usuario', 'libro']);

    } catch (error) {
      throw new Error(`Error al crear devolución: ${error.message}`);
    }
  }

  // Obtener todas las devoluciones con paginación
  async obtenerDevoluciones(filtros = {}, pagina = 1, limite = 10) {
    try {
      const opciones = {
        page: pagina,
        limit: limite,
        populate: [
          { path: 'prestamo' },
          { path: 'usuario', select: 'nombre email' },
          { path: 'libro', select: 'titulo autor' }
        ],
        sort: { createdAt: -1 }
      };

      const resultado = await Devolucion.paginate(filtros, opciones);
      return resultado;

    } catch (error) {
      throw new Error(`Error al obtener devoluciones: ${error.message}`);
    }
  }

  // Obtener devolución por ID
  async obtenerDevolucionPorId(id) {
    try {
      const devolucion = await Devolucion.findById(id)
        .populate('prestamo')
        .populate('usuario', 'nombre email')
        .populate('libro', 'titulo autor');

      if (!devolucion) {
        throw new Error('Devolución no encontrada');
      }

      return devolucion;

    } catch (error) {
      throw new Error(`Error al obtener devolución: ${error.message}`);
    }
  }

  // Actualizar devolución
  async actualizarDevolucion(id, datos) {
    try {
      const devolucionActualizada = await Devolucion.findByIdAndUpdate(
        id,
        datos,
        { new: true, runValidators: true }
      ).populate(['prestamo', 'usuario', 'libro']);

      if (!devolucionActualizada) {
        throw new Error('Devolución no encontrada');
      }

      return devolucionActualizada;

    } catch (error) {
      throw new Error(`Error al actualizar devolución: ${error.message}`);
    }
  }

  // Eliminar devolución
  async eliminarDevolucion(id) {
    try {
      const devolucion = await Devolucion.findById(id);
      if (!devolucion) {
        throw new Error('Devolución no encontrada');
      }

      // Revertir el estado del préstamo a 'activo' si se elimina la devolución
      await Prestamo.findByIdAndUpdate(devolucion.prestamo, { estado: 'activo' });

      // Decrementar las existencias del libro
      await Libro.findByIdAndUpdate(devolucion.libro, { $inc: { existencias: -1 } });

      await Devolucion.findByIdAndDelete(id);

      return { mensaje: 'Devolución eliminada correctamente' };

    } catch (error) {
      throw new Error(`Error al eliminar devolución: ${error.message}`);
    }
  }

  // Obtener estadísticas de devoluciones
  async obtenerEstadisticas() {
    try {
      const stats = await Devolucion.aggregate([
        {
          $group: {
            _id: null,
            totalDevoluciones: { $sum: 1 },
            devolucionesATiempo: {
              $sum: { $cond: [{ $eq: ['$estado', 'a_tiempo'] }, 1, 0] }
            },
            devolucionesRetrasadas: {
              $sum: { $cond: [{ $eq: ['$estado', 'retrasado'] }, 1, 0] }
            },
            totalMultas: { $sum: '$multa' },
            promedioMultas: { $avg: '$multa' }
          }
        }
      ]);

      return stats[0] || {
        totalDevoluciones: 0,
        devolucionesATiempo: 0,
        devolucionesRetrasadas: 0,
        totalMultas: 0,
        promedioMultas: 0
      };

    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }
}

export default new DevolucionService();