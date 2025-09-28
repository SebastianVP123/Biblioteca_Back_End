import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const autorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del autor es obligatorio'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    validate: {
      validator: function(v) {
        return /^[a-zA-ZÀ-ÿ\s\-\.]+$/.test(v);
      },
      message: 'El nombre solo puede contener letras, espacios, guiones y puntos'
    }
  },
  nacionalidad: {
    type: String,
    trim: true,
    maxlength: [50, 'La nacionalidad no puede exceder 50 caracteres'],
    validate: {
      validator: function(v) {
        if (!v) return true; // Permitir vacío
        return /^[a-zA-ZÀ-ÿ\s]+$/.test(v);
      },
      message: 'La nacionalidad solo puede contener letras y espacios'
    }
  },
  fechaNacimiento: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true; // Permitir vacío
        const hoy = new Date();
        const nacimiento = new Date(v);
        const edad = hoy.getFullYear() - nacimiento.getFullYear();
        return edad >= 10 && edad <= 150; // Edad razonable
      },
      message: 'Fecha de nacimiento inválida'
    }
  },
  sitioWeb: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Permitir vacío
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL del sitio web inválida'
    }
  },
  biografia: {
    type: String,
    trim: true,
    maxlength: [1000, 'La biografía no puede exceder 1000 caracteres']
  },
  imagenUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Permitir vacío
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL de imagen inválida'
    }
  }
}, {
  timestamps: true
});

// Índices para mejorar rendimiento de búsquedas
autorSchema.index({ nombre: 'text', nacionalidad: 'text' });
autorSchema.index({ fechaNacimiento: 1 });

// Plugin de paginación
autorSchema.plugin(mongoosePaginate);

const Autor = mongoose.model('Autor', autorSchema);

export default Autor;