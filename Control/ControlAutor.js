import Autor from '../classes/Autor.js';

// Crear instancias de autores
const autor1 = new Autor("Gabriel García Márquez", "Colombiano", "1927-03-06");
const autor2 = new Autor("Isabel Allende", "Chilena", "1942-08-02");

// Mostrar resultados
console.log("Autores registrados:");
console.log(autor1.getNombre(), "-", autor1.getNacionalidad());
console.log(autor2.getNombre(), "-", autor2.getNacionalidad());

// Función para listar autores
function listarAutores() {
  return [autor1, autor2];
}

export { autor1, autor2, listarAutores };