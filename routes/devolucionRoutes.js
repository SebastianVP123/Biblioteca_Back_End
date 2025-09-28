import express from 'express';
import ControlDevolucion from '../Control/ControlDevolucion.js';

const router = express.Router();

// Crear devolución
router.post('/devoluciones', ControlDevolucion.crearDevolucion);

// Obtener todas las devoluciones
router.get('/devoluciones', ControlDevolucion.obtenerDevoluciones);

// Obtener devolución por ID
router.get('/devoluciones/:id', ControlDevolucion.obtenerDevolucionPorId);

// Actualizar devolución
router.put('/devoluciones/:id', ControlDevolucion.actualizarDevolucion);

// Eliminar devolución
router.delete('/devoluciones/:id', ControlDevolucion.eliminarDevolucion);

// Obtener estadísticas de devoluciones
router.get('/devoluciones/estadisticas/general', ControlDevolucion.obtenerEstadisticas);

export default router;