import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const prestamoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario es obligatorio']
  },
  libro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Libro',
    required: [true, 'El libro es obligatorio']
  },
  fechaPrestamo: {
    type: Date,
    required: [true, 'La fecha de préstamo es obligatoria'],
    default: Date.now,
    validate: {
      validator: function(v) {
        return v <= new Date(); // No puede ser futura
      },
      message: 'La fecha de préstamo no puede ser futura'
    }
  },
  fechaDevolucion: {
    type: Date,
    required: [true, 'La fecha de devolución es obligatoria'],
    validate: {
      validator: function(v) {
        return v > this.fechaPrestamo; // Debe ser posterior al préstamo
      },
      message: 'La fecha de devolución debe ser posterior a la fecha de préstamo'
    }
  },
  estado: {
    type: String,
    enum: {
      values: ['activo', 'devuelto', 'vencido'],
      message: 'Estado inválido'
    },
    default: 'activo'
  }
}, {
  timestamps: true
});

// Validación personalizada para evitar préstamos duplicados activos
prestamoSchema.pre('save', async function(next) {
  // Solo validar cuando se está cambiando a estado 'activo'
  if (this.estado === 'activo' && this.isModified('estado')) {
    // Verificar que no haya otro préstamo activo del mismo libro
    const Prestamo = mongoose.model('Prestamo');
    const prestamoActivo = await Prestamo.findOne({
      libro: this.libro,
      estado: 'activo',
      _id: { $ne: this._id || null } // Excluir este documento si tiene _id
    });

    if (prestamoActivo) {
      return next(new Error('Este libro ya está prestado actualmente'));
    }
  }
  next();
});

// Índices para mejorar rendimiento de búsquedas
prestamoSchema.index({ usuario: 1 });
prestamoSchema.index({ libro: 1 });
prestamoSchema.index({ estado: 1 });
prestamoSchema.index({ fechaPrestamo: 1 });

// Plugin de paginación
prestamoSchema.plugin(mongoosePaginate);

const Prestamo = mongoose.model('Prestamo', prestamoSchema);

export default Prestamo;