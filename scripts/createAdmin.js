import mongoose from 'mongoose';
import Usuario from '../models/Usuario.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/biblioteca');

    // Verificar si ya existe un administrador
    const existingAdmin = await Usuario.findOne({ rol: 'admin' });

    if (existingAdmin) {
      console.log('Ya existe un administrador en el sistema');
      console.log('Administrador:', existingAdmin.nombre, '-', existingAdmin.correo);
      process.exit(0);
    }

    // Crear administrador por defecto
    const adminData = {
      nombre: 'Administrador',
      correo: 'admin@biblioteca.com',
      contrasena: 'admin123',
      rol: 'admin',
      telefono: '1234567890'
    };

    const admin = new Usuario(adminData);
    await admin.save();

    console.log('✅ Administrador creado exitosamente!');
    console.log('Nombre:', admin.nombre);
    console.log('Correo:', admin.correo);
    console.log('Contraseña:', adminData.contrasena);
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

  } catch (error) {
    console.error('Error al crear administrador:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createAdmin();