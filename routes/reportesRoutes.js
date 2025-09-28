import express from 'express';
import Usuario from '../models/Usuario.js';
import Libro from '../models/Libro.js';
import Autor from '../models/Autor.js';
import Prestamo from '../models/Prestamo.js';
import Devolucion from '../models/Devolucion.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const router = express.Router();

// GET /api/reportes/estadisticas-generales - Estadísticas generales del sistema
router.get('/estadisticas-generales', async (req, res) => {
  try {
    const [
      totalUsuarios,
      totalLibros,
      totalAutores,
      totalPrestamos,
      prestamosActivos,
      prestamosVencidos,
      librosDisponibles,
      librosPrestados
    ] = await Promise.all([
      Usuario.countDocuments(),
      Libro.countDocuments(),
      Autor.countDocuments(),
      Prestamo.countDocuments(),
      Prestamo.countDocuments({ estado: 'activo' }),
      Prestamo.countDocuments({ estado: 'vencido' }),
      Libro.countDocuments({ existencias: { $gt: 0 } }),
      Libro.aggregate([
        { $match: { existencias: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$existencias' } } }
      ])
    ]);

    // Calcular porcentaje de libros disponibles
    const porcentajeDisponibles = totalLibros > 0 ?
      Math.round((librosDisponibles / totalLibros) * 100) : 0;

    // Obtener préstamos recientes (últimos 7 días)
    const fechaHace7Dias = new Date();
    fechaHace7Dias.setDate(fechaHace7Dias.getDate() - 7);

    const prestamosRecientes = await Prestamo.countDocuments({
      createdAt: { $gte: fechaHace7Dias }
    });

    // Libros más prestados
    const librosMasPrestados = await Prestamo.aggregate([
      { $match: { estado: { $in: ['activo', 'devuelto', 'vencido'] } } },
      { $group: { _id: '$libro', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'libros',
          localField: '_id',
          foreignField: '_id',
          as: 'libro'
        }
      },
      { $unwind: '$libro' },
      {
        $project: {
          titulo: '$libro.titulo',
          count: 1,
          autor: '$libro.autor'
        }
      },
      {
        $lookup: {
          from: 'autores',
          localField: 'autor',
          foreignField: '_id',
          as: 'autor'
        }
      },
      { $unwind: { path: '$autor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          titulo: 1,
          count: 1,
          autorNombre: '$autor.nombre'
        }
      }
    ]);

    res.json({
      estadisticas: {
        totalUsuarios,
        totalLibros,
        totalAutores,
        totalPrestamos,
        prestamosActivos,
        prestamosVencidos,
        librosDisponibles,
        librosPrestados: librosPrestados[0]?.total || 0,
        porcentajeDisponibles,
        prestamosRecientes
      },
      librosMasPrestados
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/prestamos-por-mes - Préstamos agrupados por mes
router.get('/prestamos-por-mes', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const prestamosPorMes = await Prestamo.aggregate([
      {
        $match: {
          fechaPrestamo: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$fechaPrestamo' },
          count: { $sum: 1 },
          activos: {
            $sum: { $cond: [{ $eq: ['$estado', 'activo'] }, 1, 0] }
          },
          devueltos: {
            $sum: { $cond: [{ $eq: ['$estado', 'devuelto'] }, 1, 0] }
          },
          vencidos: {
            $sum: { $cond: [{ $eq: ['$estado', 'vencido'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const resultado = meses.map((mes, index) => {
      const data = prestamosPorMes.find(p => p._id === index + 1);
      return {
        mes,
        total: data?.count || 0,
        activos: data?.activos || 0,
        devueltos: data?.devueltos || 0,
        vencidos: data?.vencidos || 0
      };
    });

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/usuarios-por-rol - Distribución de usuarios por rol
router.get('/usuarios-por-rol', async (req, res) => {
  try {
    const usuariosPorRol = await Usuario.aggregate([
      { $group: { _id: '$rol', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json(usuariosPorRol.map(item => ({
      rol: item._id,
      count: item.count,
      porcentaje: 0 // Se calculará en el front-end
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/libros-por-genero - Libros agrupados por género
router.get('/libros-por-genero', async (req, res) => {
  try {
    const librosPorGenero = await Libro.aggregate([
      { $match: { genero: { $ne: '', $exists: true } } },
      { $group: { _id: '$genero', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json(librosPorGenero);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/prestamos-vencidos - Lista de préstamos vencidos
router.get('/prestamos-vencidos', async (req, res) => {
  try {
    const hoy = new Date();

    const prestamosVencidos = await Prestamo.find({
      estado: 'activo',
      fechaDevolucion: { $lt: hoy }
    })
    .populate('usuario', 'nombre correo')
    .populate('libro', 'titulo isbn')
    .sort({ fechaDevolucion: 1 });

    // Calcular días de retraso
    const resultado = prestamosVencidos.map(prestamo => ({
      ...prestamo.toObject(),
      diasRetraso: Math.floor((hoy - prestamo.fechaDevolucion) / (1000 * 60 * 60 * 24))
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/dashboard-admin - Dashboard completo para administradores
router.get('/dashboard-admin', async (req, res) => {
  try {
    // Estadísticas rápidas
    const [
      totalUsuarios,
      totalLibros,
      totalPrestamos,
      prestamosActivos,
      prestamosVencidos
    ] = await Promise.all([
      Usuario.countDocuments(),
      Libro.countDocuments(),
      Prestamo.countDocuments(),
      Prestamo.countDocuments({ estado: 'activo' }),
      Prestamo.countDocuments({ estado: 'vencido' })
    ]);

    // Actividad reciente (últimos 10 préstamos)
    const actividadReciente = await Prestamo.find()
      .populate('usuario', 'nombre')
      .populate('libro', 'titulo')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('estado fechaPrestamo createdAt');

    // Usuarios más activos (con más préstamos)
    const usuariosMasActivos = await Prestamo.aggregate([
      { $match: { estado: { $in: ['activo', 'devuelto', 'vencido'] } } },
      { $group: { _id: '$usuario', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'usuario'
        }
      },
      { $unwind: '$usuario' },
      {
        $project: {
          nombre: '$usuario.nombre',
          correo: '$usuario.correo',
          count: 1
        }
      }
    ]);

    res.json({
      estadisticasRapidas: {
        totalUsuarios,
        totalLibros,
        totalPrestamos,
        prestamosActivos,
        prestamosVencidos
      },
      actividadReciente: actividadReciente.map(item => ({
        tipo: 'préstamo',
        descripcion: `${item.usuario.nombre} ${item.estado === 'activo' ? 'prestó' : item.estado === 'devuelto' ? 'devolvió' : 'tiene vencido'} "${item.libro.titulo}"`,
        fecha: item.createdAt,
        estado: item.estado
      })),
      usuariosMasActivos
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/usuarios/pdf - Reporte PDF de usuarios
router.get('/usuarios/pdf', async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-contrasena');

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=usuarios.pdf');
    doc.pipe(res);

    // Título
    doc.fontSize(18).text('Reporte de Usuarios', { align: 'center' });
    doc.moveDown(2);

    // Información del reporte
    doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' });
    doc.text(`Total de usuarios: ${usuarios.length}`, { align: 'right' });
    doc.moveDown();

    // Configuración de tabla
    const tableTop = 150;
    const colWidths = [80, 80, 150, 80, 60]; // Anchos de columna
    const rowHeight = 20;
    let yPosition = tableTop;

    // Función para dibujar fila
    const drawRow = (data, isHeader = false) => {
      let xPosition = 50;
      doc.fontSize(isHeader ? 10 : 9).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');

      data.forEach((text, index) => {
        const cellText = text || '';
        const maxWidth = colWidths[index] - 10; // Padding

        // Dibujar borde de celda
        doc.rect(xPosition, yPosition, colWidths[index], rowHeight).stroke();

        // Texto con wrapping si es necesario
        const lines = doc.heightOfString(cellText, { width: maxWidth });
        if (lines > rowHeight - 5) {
          // Truncar si es muy largo
          const truncated = cellText.length > 20 ? cellText.substring(0, 17) + '...' : cellText;
          doc.text(truncated, xPosition + 5, yPosition + 5, { width: maxWidth, height: rowHeight - 5 });
        } else {
          doc.text(cellText, xPosition + 5, yPosition + 5, { width: maxWidth });
        }

        xPosition += colWidths[index];
      });

      yPosition += rowHeight;
    };

    // Headers
    drawRow(['Nombre', 'Apellido', 'Correo', 'Teléfono', 'Rol'], true);

    // Datos
    usuarios.forEach((user, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
        drawRow(['Nombre', 'Apellido', 'Correo', 'Teléfono', 'Rol'], true);
      }

      drawRow([
        user.nombre || '',
        user.apellido || '',
        user.correo || '',
        user.telefono || '',
        user.rol || ''
      ]);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/usuarios/excel - Reporte Excel de usuarios
router.get('/usuarios/excel', async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-contrasena');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios');

    // Configurar columnas con mejor formato
    worksheet.columns = [
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Apellido', key: 'apellido', width: 20 },
      { header: 'Correo', key: 'correo', width: 35 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Rol', key: 'rol', width: 12 },
      { header: 'Fecha Registro', key: 'fechaRegistro', width: 15 }
    ];

    // Estilo para el header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Agregar filas de datos
    usuarios.forEach(user => {
      const row = worksheet.addRow({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        correo: user.correo || '',
        telefono: user.telefono || '',
        rol: user.rol || '',
        fechaRegistro: user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : ''
      });

      // Formato condicional para roles
      const rolCell = row.getCell(5);
      if (user.rol === 'admin') {
        rolCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFD700' }
        };
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.values) {
        const maxLength = column.values.reduce((max, value) =>
          Math.max(max, value ? value.toString().length : 0), 0);
        column.width = Math.min(Math.max(column.width, maxLength + 2), 50);
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=usuarios.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/libros/pdf - Reporte PDF de libros
router.get('/libros/pdf', async (req, res) => {
  try {
    const libros = await Libro.find().populate('autor', 'nombre');

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=libros.pdf');
    doc.pipe(res);

    // Título
    doc.fontSize(18).text('Reporte de Libros', { align: 'center' });
    doc.moveDown(2);

    // Información del reporte
    doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' });
    doc.text(`Total de libros: ${libros.length}`, { align: 'right' });
    doc.moveDown();

    // Configuración de tabla
    const tableTop = 150;
    const colWidths = [100, 70, 60, 50, 80, 50]; // Anchos de columna
    const rowHeight = 20;
    let yPosition = tableTop;

    // Función para dibujar fila
    const drawRow = (data, isHeader = false) => {
      let xPosition = 50;
      doc.fontSize(isHeader ? 10 : 9).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');

      data.forEach((text, index) => {
        const cellText = text || '';
        const maxWidth = colWidths[index] - 10; // Padding

        // Dibujar borde de celda
        doc.rect(xPosition, yPosition, colWidths[index], rowHeight).stroke();

        // Texto con wrapping si es necesario
        const lines = doc.heightOfString(cellText, { width: maxWidth });
        if (lines > rowHeight - 5) {
          // Truncar si es muy largo
          const truncated = cellText.length > 15 ? cellText.substring(0, 12) + '...' : cellText;
          doc.text(truncated, xPosition + 5, yPosition + 5, { width: maxWidth, height: rowHeight - 5 });
        } else {
          doc.text(cellText, xPosition + 5, yPosition + 5, { width: maxWidth });
        }

        xPosition += colWidths[index];
      });

      yPosition += rowHeight;
    };

    // Headers
    drawRow(['Título', 'ISBN', 'Género', 'Año', 'Autor', 'Existencias'], true);

    // Datos
    libros.forEach((libro, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
        drawRow(['Título', 'ISBN', 'Género', 'Año', 'Autor', 'Existencias'], true);
      }

      drawRow([
        libro.titulo || '',
        libro.isbn || '',
        libro.genero || '',
        libro.anioPublicacion?.toString() || '',
        libro.autor?.nombre || '',
        libro.existencias?.toString() || ''
      ]);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/libros/excel - Reporte Excel de libros
router.get('/libros/excel', async (req, res) => {
  try {
    const libros = await Libro.find().populate('autor', 'nombre');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Libros');

    // Configurar columnas
    worksheet.columns = [
      { header: 'Título', key: 'titulo', width: 35 },
      { header: 'ISBN', key: 'isbn', width: 18 },
      { header: 'Género', key: 'genero', width: 20 },
      { header: 'Año Publicación', key: 'anioPublicacion', width: 15 },
      { header: 'Autor', key: 'autor', width: 25 },
      { header: 'Existencias', key: 'existencias', width: 12 },
      { header: 'Idioma', key: 'idioma', width: 15 }
    ];

    // Estilo para el header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Agregar filas de datos
    libros.forEach(libro => {
      const row = worksheet.addRow({
        titulo: libro.titulo || '',
        isbn: libro.isbn || '',
        genero: libro.genero || '',
        anioPublicacion: libro.anioPublicacion || '',
        autor: libro.autor?.nombre || '',
        existencias: libro.existencias || 0,
        idioma: libro.idiomaOriginal || ''
      });

      // Formato condicional para existencias bajas
      const existenciasCell = row.getCell(6);
      if (libro.existencias <= 1) {
        existenciasCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF6B6B' }
        };
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=libros.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/autores/pdf - Reporte PDF de autores
router.get('/autores/pdf', async (req, res) => {
  try {
    const autores = await Autor.find();

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=autores.pdf');
    doc.pipe(res);

    // Título
    doc.fontSize(18).text('Reporte de Autores', { align: 'center' });
    doc.moveDown(2);

    // Información del reporte
    doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' });
    doc.text(`Total de autores: ${autores.length}`, { align: 'right' });
    doc.moveDown();

    // Configuración de tabla
    const tableTop = 150;
    const colWidths = [120, 80, 80, 120]; // Anchos de columna
    const rowHeight = 20;
    let yPosition = tableTop;

    // Función para dibujar fila
    const drawRow = (data, isHeader = false) => {
      let xPosition = 50;
      doc.fontSize(isHeader ? 10 : 9).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');

      data.forEach((text, index) => {
        const cellText = text || '';
        const maxWidth = colWidths[index] - 10; // Padding

        // Dibujar borde de celda
        doc.rect(xPosition, yPosition, colWidths[index], rowHeight).stroke();

        // Texto con wrapping si es necesario
        const lines = doc.heightOfString(cellText, { width: maxWidth });
        if (lines > rowHeight - 5) {
          // Truncar si es muy largo
          const truncated = cellText.length > 20 ? cellText.substring(0, 17) + '...' : cellText;
          doc.text(truncated, xPosition + 5, yPosition + 5, { width: maxWidth, height: rowHeight - 5 });
        } else {
          doc.text(cellText, xPosition + 5, yPosition + 5, { width: maxWidth });
        }

        xPosition += colWidths[index];
      });

      yPosition += rowHeight;
    };

    // Headers
    drawRow(['Nombre', 'Nacionalidad', 'Fecha Nacimiento', 'Sitio Web'], true);

    // Datos
    autores.forEach((autor, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
        drawRow(['Nombre', 'Nacionalidad', 'Fecha Nacimiento', 'Sitio Web'], true);
      }

      drawRow([
        autor.nombre || '',
        autor.nacionalidad || '',
        autor.fechaNacimiento ? new Date(autor.fechaNacimiento).toLocaleDateString('es-ES') : '',
        autor.sitioWeb || ''
      ]);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/autores/excel - Reporte Excel de autores
router.get('/autores/excel', async (req, res) => {
  try {
    const autores = await Autor.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Autores');

    // Configurar columnas
    worksheet.columns = [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Nacionalidad', key: 'nacionalidad', width: 20 },
      { header: 'Fecha Nacimiento', key: 'fechaNacimiento', width: 18 },
      { header: 'Sitio Web', key: 'sitioWeb', width: 35 },
      { header: 'Biografía', key: 'biografia', width: 60 }
    ];

    // Estilo para el header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Agregar filas de datos
    autores.forEach(autor => {
      worksheet.addRow({
        nombre: autor.nombre || '',
        nacionalidad: autor.nacionalidad || '',
        fechaNacimiento: autor.fechaNacimiento ? new Date(autor.fechaNacimiento).toLocaleDateString('es-ES') : '',
        sitioWeb: autor.sitioWeb || '',
        biografia: autor.biografia || ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=autores.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/prestamos/pdf - Reporte PDF de préstamos activos
router.get('/prestamos/pdf', async (req, res) => {
  try {
    const prestamos = await Prestamo.find({ estado: 'activo' }).populate('usuario', 'nombre').populate('libro', 'titulo');

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=prestamos.pdf');
    doc.pipe(res);

    // Título
    doc.fontSize(18).text('Reporte de Préstamos Activos', { align: 'center' });
    doc.moveDown(2);

    // Información del reporte
    doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' });
    doc.text(`Total de préstamos activos: ${prestamos.length}`, { align: 'right' });
    doc.moveDown();

    // Configuración de tabla
    const tableTop = 150;
    const colWidths = [80, 120, 70, 70, 50]; // Anchos de columna
    const rowHeight = 20;
    let yPosition = tableTop;

    // Función para dibujar fila
    const drawRow = (data, isHeader = false) => {
      let xPosition = 50;
      doc.fontSize(isHeader ? 10 : 9).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');

      data.forEach((text, index) => {
        const cellText = text || '';
        const maxWidth = colWidths[index] - 10; // Padding

        // Dibujar borde de celda
        doc.rect(xPosition, yPosition, colWidths[index], rowHeight).stroke();

        // Texto con wrapping si es necesario
        const lines = doc.heightOfString(cellText, { width: maxWidth });
        if (lines > rowHeight - 5) {
          // Truncar si es muy largo
          const truncated = cellText.length > 15 ? cellText.substring(0, 12) + '...' : cellText;
          doc.text(truncated, xPosition + 5, yPosition + 5, { width: maxWidth, height: rowHeight - 5 });
        } else {
          doc.text(cellText, xPosition + 5, yPosition + 5, { width: maxWidth });
        }

        xPosition += colWidths[index];
      });

      yPosition += rowHeight;
    };

    // Headers
    drawRow(['Usuario', 'Libro', 'Fecha Préstamo', 'Fecha Devolución', 'Estado'], true);

    // Datos
    prestamos.forEach((prestamo, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
        drawRow(['Usuario', 'Libro', 'Fecha Préstamo', 'Fecha Devolución', 'Estado'], true);
      }

      drawRow([
        prestamo.usuario?.nombre || '',
        prestamo.libro?.titulo || '',
        prestamo.fechaPrestamo ? new Date(prestamo.fechaPrestamo).toLocaleDateString('es-ES') : '',
        prestamo.fechaDevolucion ? new Date(prestamo.fechaDevolucion).toLocaleDateString('es-ES') : '',
        prestamo.estado || ''
      ]);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/prestamos/excel - Reporte Excel de préstamos activos
router.get('/prestamos/excel', async (req, res) => {
  try {
    const prestamos = await Prestamo.find({ estado: 'activo' }).populate('usuario', 'nombre').populate('libro', 'titulo');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Préstamos Activos');
    worksheet.columns = [
      { header: 'Usuario', key: 'usuario', width: 20 },
      { header: 'Libro', key: 'libro', width: 30 },
      { header: 'Fecha Préstamo', key: 'fechaPrestamo', width: 15 },
      { header: 'Fecha Devolución', key: 'fechaDevolucion', width: 15 },
      { header: 'Estado', key: 'estado', width: 10 }
    ];

    prestamos.forEach(prestamo => {
      worksheet.addRow({
        usuario: prestamo.usuario?.nombre || '',
        libro: prestamo.libro?.titulo || '',
        fechaPrestamo: prestamo.fechaPrestamo,
        fechaDevolucion: prestamo.fechaDevolucion,
        estado: prestamo.estado
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=prestamos.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/devoluciones/pdf - Reporte PDF de devoluciones
router.get('/devoluciones/pdf', async (req, res) => {
  try {
    const devoluciones = await Devolucion.find()
      .populate('usuario', 'nombre')
      .populate('libro', 'titulo')
      .populate('prestamo');

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=devoluciones.pdf');
    doc.pipe(res);

    // Título
    doc.fontSize(18).text('Reporte de Devoluciones', { align: 'center' });
    doc.moveDown(2);

    // Información del reporte
    doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' });
    doc.text(`Total de devoluciones: ${devoluciones.length}`, { align: 'right' });
    doc.moveDown();

    // Configuración de tabla
    const tableTop = 150;
    const colWidths = [80, 100, 60, 60, 50, 40]; // Anchos de columna
    const rowHeight = 20;
    let yPosition = tableTop;

    // Función para dibujar fila
    const drawRow = (data, isHeader = false) => {
      let xPosition = 50;
      doc.fontSize(isHeader ? 10 : 9).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');

      data.forEach((text, index) => {
        const cellText = text || '';
        const maxWidth = colWidths[index] - 10; // Padding

        // Dibujar borde de celda
        doc.rect(xPosition, yPosition, colWidths[index], rowHeight).stroke();

        // Texto con wrapping si es necesario
        const lines = doc.heightOfString(cellText, { width: maxWidth });
        if (lines > rowHeight - 5) {
          // Truncar si es muy largo
          const truncated = cellText.length > 12 ? cellText.substring(0, 9) + '...' : cellText;
          doc.text(truncated, xPosition + 5, yPosition + 5, { width: maxWidth, height: rowHeight - 5 });
        } else {
          doc.text(cellText, xPosition + 5, yPosition + 5, { width: maxWidth });
        }

        xPosition += colWidths[index];
      });

      yPosition += rowHeight;
    };

    // Headers
    drawRow(['Usuario', 'Libro', 'Fecha Real', 'Fecha Esperada', 'Estado', 'Multa'], true);

    // Datos
    devoluciones.forEach((devolucion, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
        drawRow(['Usuario', 'Libro', 'Fecha Real', 'Fecha Esperada', 'Estado', 'Multa'], true);
      }

      drawRow([
        devolucion.usuario?.nombre || '',
        devolucion.libro?.titulo || '',
        devolucion.fechaDevolucionReal ? new Date(devolucion.fechaDevolucionReal).toLocaleDateString('es-ES') : '',
        devolucion.fechaDevolucionEsperada ? new Date(devolucion.fechaDevolucionEsperada).toLocaleDateString('es-ES') : '',
        devolucion.estado || '',
        devolucion.multa?.toString() || '0'
      ]);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reportes/devoluciones/excel - Reporte Excel de devoluciones
router.get('/devoluciones/excel', async (req, res) => {
  try {
    const devoluciones = await Devolucion.find()
      .populate('usuario', 'nombre')
      .populate('libro', 'titulo')
      .populate('prestamo');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Devoluciones');

    // Configurar columnas
    worksheet.columns = [
      { header: 'Usuario', key: 'usuario', width: 25 },
      { header: 'Libro', key: 'libro', width: 35 },
      { header: 'Fecha Devolución Real', key: 'fechaDevolucionReal', width: 20 },
      { header: 'Fecha Devolución Esperada', key: 'fechaDevolucionEsperada', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Condición Libro', key: 'condicionLibro', width: 15 },
      { header: 'Multa', key: 'multa', width: 10 },
      { header: 'Observaciones', key: 'observaciones', width: 30 }
    ];

    // Estilo para el header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Agregar filas de datos
    devoluciones.forEach(devolucion => {
      const row = worksheet.addRow({
        usuario: devolucion.usuario?.nombre || '',
        libro: devolucion.libro?.titulo || '',
        fechaDevolucionReal: devolucion.fechaDevolucionReal ? new Date(devolucion.fechaDevolucionReal).toLocaleDateString('es-ES') : '',
        fechaDevolucionEsperada: devolucion.fechaDevolucionEsperada ? new Date(devolucion.fechaDevolucionEsperada).toLocaleDateString('es-ES') : '',
        estado: devolucion.estado || '',
        condicionLibro: devolucion.condicionLibro || '',
        multa: devolucion.multa || 0,
        observaciones: devolucion.observaciones || ''
      });

      // Formato condicional para estados
      const estadoCell = row.getCell(5);
      if (devolucion.estado === 'retrasado') {
        estadoCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF6B6B' }
        };
      } else if (devolucion.estado === 'a_tiempo') {
        estadoCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF90EE90' }
        };
      }

      // Formato condicional para multas
      const multaCell = row.getCell(7);
      if (devolucion.multa > 0) {
        multaCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFD700' }
        };
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=devoluciones.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;