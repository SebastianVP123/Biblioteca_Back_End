import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import mongoosePaginate from 'mongoose-paginate-v2';

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
    validate: {
      validator: function(v) {
        return /^[a-zA-ZÀ-ÿ\s]+$/.test(v);
      },
      message: 'El nombre solo puede contener letras y espacios'
    }
  },
  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Formato de correo electrónico inválido'
    }
  },
  telefono: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Permitir vacío
        return /^[\d\s\-\+\(\)]{7,15}$/.test(v);
      },
      message: 'Formato de teléfono inválido'
    }
  },
  contrasena: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  rol: {
    type: String,
    enum: {
      values: ['admin', 'user'],
      message: 'Rol inválido'
    },
    default: 'user'
  },
  // Campos adicionales para lectores
  apellido: {
    type: String,
    trim: true,
    maxlength: [50, 'El apellido no puede exceder 50 caracteres'],
    validate: {
      validator: function(v) {
        if (!v) return true; // Permitir vacío
        return /^[a-zA-ZÀ-ÿ\s]+$/.test(v);
      },
      message: 'El apellido solo puede contener letras y espacios'
    }
  },
  direccion: {
    type: String,
    trim: true,
    maxlength: [200, 'La dirección no puede exceder 200 caracteres']
  },
  genero: {
    type: String,
    enum: {
      values: ['masculino', 'femenino', 'otro', 'prefiero_no_decir'],
      message: 'Género inválido'
    },
    trim: true
  },
  tipoIdentificacion: {
    type: String,
    enum: {
      values: ['cc', 'ce', 'ti', 'pasaporte'],
      message: 'Tipo de identificación inválido'
    },
    trim: true
  },
  numeroIdentificacion: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Permitir vacío
        // Validar formato básico de identificación
        return /^[\d\-a-zA-Z]{5,20}$/.test(v);
      },
      message: 'Formato de número de identificación inválido'
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('contrasena')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.contrasena = await bcrypt.hash(this.contrasena, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
usuarioSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.contrasena);
};

// Índices para mejorar rendimiento de búsquedas
usuarioSchema.index({ nombre: 'text', correo: 'text' });
usuarioSchema.index({ rol: 1 });
usuarioSchema.index({ genero: 1 });

// Plugin de paginación
usuarioSchema.plugin(mongoosePaginate);

const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;