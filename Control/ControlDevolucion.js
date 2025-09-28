import Devolucion from '../classes/Devolucion.js';

class ControlDevolucion {
  // Crear devolución
  async crearDevolucion(req, res) {
    try {
      const devolucion = await Devolucion.crearDevolucion(req.body);
      res.status(201).json({
        success: true,
        message: 'Devolución creada exitosamente',
        data: devolucion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener todas las devoluciones
  async obtenerDevoluciones(req, res) {
    try {
      const pagina = parseInt(req.query.pagina) || 1;
      const limite = parseInt(req.query.limite) || 10;
      const filtros = {};

      // Aplicar filtros si existen
      if (req.query.estado) filtros.estado = req.query.estado;
      if (req.query.usuario) filtros.usuario = req.query.usuario;
      if (req.query.libro) filtros.libro = req.query.libro;
      if (req.query.fechaDesde) {
        filtros.fechaDevolucionReal = { $gte: new Date(req.query.fechaDesde) };
      }
      if (req.query.fechaHasta) {
        filtros.fechaDevolucionReal = {
          ...filtros.fechaDevolucionReal,
          $lte: new Date(req.query.fechaHasta)
        };
      }

      const resultado = await Devolucion.obtenerDevoluciones(filtros, pagina, limite);

      res.json({
        devoluciones: resultado.docs,
        total: resultado.totalDocs,
        pagina: resultado.page,
        paginas: resultado.totalPages,
        limite: resultado.limit
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener devolución por ID
  async obtenerDevolucionPorId(req, res) {
    try {
      const devolucion = await Devolucion.obtenerDevolucionPorId(req.params.id);
      res.json({
        success: true,
        data: devolucion
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Actualizar devolución
  async actualizarDevolucion(req, res) {
    try {
      const devolucion = await Devolucion.actualizarDevolucion(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Devolución actualizada exitosamente',
        data: devolucion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Eliminar devolución
  async eliminarDevolucion(req, res) {
    try {
      const resultado = await Devolucion.eliminarDevolucion(req.params.id);
      res.json({
        success: true,
        message: resultado.mensaje
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener estadísticas
  async obtenerEstadisticas(req, res) {
    try {
      const estadisticas = await Devolucion.obtenerEstadisticas();
      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new ControlDevolucion();