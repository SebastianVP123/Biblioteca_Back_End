import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const devolucionSchema = new mongoose.Schema({
  prestamo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestamo',
    required: [true, 'El préstamo es obligatorio']
  },
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
  fechaDevolucionReal: {
    type: Date,
    required: [true, 'La fecha de devolución real es obligatoria'],
    default: Date.now
  },
  fechaDevolucionEsperada: {
    type: Date,
    required: [true, 'La fecha de devolución esperada es obligatoria']
  },
  estado: {
    type: String,
    enum: {
      values: ['a_tiempo', 'retrasado', 'dañado'],
      message: 'Estado de devolución inválido'
    },
    required: [true, 'El estado de la devolución es obligatorio']
  },
  condicionLibro: {
    type: String,
    enum: {
      values: ['excelente', 'bueno', 'regular', 'dañado'],
      message: 'Condición del libro inválida'
    },
    default: 'bueno'
  },
  observaciones: {
    type: String,
    maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres'],
    trim: true
  },
  multa: {
    type: Number,
    min: [0, 'La multa no puede ser negativa'],
    default: 0
  }
}, {
  timestamps: true
});

// Validación personalizada para asegurar que la fecha real no sea futura
devolucionSchema.pre('save', function(next) {
  if (this.fechaDevolucionReal > new Date()) {
    return next(new Error('La fecha de devolución real no puede ser futura'));
  }
  next();
});

// Índices para mejorar rendimiento de búsquedas
devolucionSchema.index({ prestamo: 1 });
devolucionSchema.index({ usuario: 1 });
devolucionSchema.index({ libro: 1 });
devolucionSchema.index({ estado: 1 });
devolucionSchema.index({ fechaDevolucionReal: 1 });

// Plugin de paginación
devolucionSchema.plugin(mongoosePaginate);

const Devolucion = mongoose.model('Devolucion', devolucionSchema);

export default Devolucion;