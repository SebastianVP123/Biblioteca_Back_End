import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const libroSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    minlength: [2, 'El título debe tener al menos 2 caracteres'],
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  isbn: {
    type: String,
    required: [true, 'El ISBN es obligatorio'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Validación básica de ISBN (10 o 13 dígitos)
        return /^\d{10}(\d{3})?$/.test(v.replace(/-/g, ''));
      },
      message: 'ISBN inválido'
    }
  },
  genero: {
    type: String,
    trim: true,
    default: '',
    maxlength: [50, 'El género no puede exceder 50 caracteres']
  },
  anioPublicacion: {
    type: Number,
    required: [true, 'El año de publicación es obligatorio'],
    min: [1000, 'Año de publicación inválido'],
    max: [new Date().getFullYear() + 1, 'Año de publicación no puede ser futuro']
  },
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Autor',
    required: [true, 'El autor es obligatorio']
  },
  imagenUrl: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true; // Permitir vacío
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL de imagen inválida'
    }
  },
  existencias: {
    type: Number,
    default: 1,
    min: [0, 'Las existencias no pueden ser negativas']
  },
  idiomaOriginal: {
    type: String,
    trim: true,
    default: 'Español',
    enum: {
      values: ['Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Otro'],
      message: 'Idioma no válido'
    }
  }
}, {
  timestamps: true
});

// Índices para mejorar rendimiento de búsquedas
libroSchema.index({ titulo: 'text', genero: 'text' });
libroSchema.index({ autor: 1 });
libroSchema.index({ anioPublicacion: 1 });
libroSchema.index({ existencias: 1 });

// Plugin de paginación
libroSchema.plugin(mongoosePaginate);

const Libro = mongoose.model('Libro', libroSchema);

export default Libro;