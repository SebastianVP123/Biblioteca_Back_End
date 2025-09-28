import Libro from "../classes/Libro.js";
import { autor1, autor2 } from "./ControlAutor.js";

// Crear instancias de libros
const libro1 = new Libro("Cien años de soledad", "978-3-16-148410-0", autor1, 1967);
const libro2 = new Libro("La casa de los espíritus", "978-84-376-0494-7", autor2, 1982);

// Mostrar resultados
console.log("Libros registrados:");
console.log(libro1.getTitulo(), "-", libro1.getAutor().getNombre());
console.log(libro2.getTitulo(), "-", libro2.getAutor().getNombre());

// Función para listar libros
function listarLibros() {
  return [libro1, libro2];
}

export { libro1, libro2, listarLibros };