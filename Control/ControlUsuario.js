import Usuario from "../classes/Usuario.js";

// Crear instancias de usuarios
const usuario1 = new Usuario("Juan Pérez", "juanperez@mail.com", "123456789");
const usuario2 = new Usuario("María López", "marialopez@mail.com", "987654321");

// Mostrar resultados
console.log("Usuarios registrados:");
console.log(usuario1.getNombre(), "-", usuario1.getEmail());
console.log(usuario2.getNombre(), "-", usuario2.getEmail());

// Función para listar usuarios
function listarUsuarios() {
  return [usuario1, usuario2];
}

export { usuario1, usuario2, listarUsuarios };