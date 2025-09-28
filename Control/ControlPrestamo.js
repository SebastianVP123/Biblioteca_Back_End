import Prestamo from "../classes/Prestamo.js";
import { usuario1 } from "./ControlUsuario.js";
import { libro1 } from "./ControlLibro.js";

// Crear préstamo
const prestamo1 = new Prestamo(usuario1, libro1, "2025-09-14", "2025-09-28");

// Mostrar resultados
console.log("Préstamo registrado:");
console.log("Usuario:", prestamo1.getUsuario().getNombre());
console.log("Libro:", prestamo1.getLibro().getTitulo());
console.log("Fecha de préstamo:", prestamo1.getFechaPrestamo());
console.log("Fecha de devolución:", prestamo1.getFechaDevolucion());

// Función para listar préstamos
function listarPrestamos() {
  return [prestamo1];
}

export { prestamo1, listarPrestamos };