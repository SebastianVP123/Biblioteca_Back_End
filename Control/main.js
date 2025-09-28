import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import librosRoutes from "../routes/libroRoutes.js";
import autorRoutes from "../routes/autorRoutes.js";
import usuarioRoutes from "../routes/usuarioRoutes.js";
import prestamoRoutes from "../routes/prestamoRoutes.js";
import devolucionRoutes from "../routes/devolucionRoutes.js";
import reportesRoutes from "../routes/reportesRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Configuración de middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Conexión a MongoDB exitosa"))
.catch((error) => console.error("Error al conectar a MongoDB:", error));

// Usar las rutas
app.use("/api", librosRoutes);
app.use("/api", autorRoutes);
app.use("/api", usuarioRoutes);
app.use("/api", prestamoRoutes);
app.use("/api", devolucionRoutes);
app.use("/api/reportes", reportesRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api`);
});