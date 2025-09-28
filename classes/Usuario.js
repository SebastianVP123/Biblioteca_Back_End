class Usuario {
  constructor(nombre, correo, telefono, contrasena = '', rol = 'lector') {
    this.nombre = nombre;
    this.correo = correo;
    this.telefono = telefono;
    this.contrasena = contrasena;
    this.rol = rol; // admin o lector
  }

  get nombre() {
    return this._nombre;
  }

  get correo() {
    return this._correo;
  }

  get telefono() {
    return this._telefono;
  }

  get contrasena() {
    return this._contrasena;
  }

  get rol() {
    return this._rol;
  }

  set nombre(value) {
    this._nombre = value;
  }

  set correo(value) {
    this._correo = value;
  }

  set telefono(value) {
    this._telefono = value;
  }

  set contrasena(value) {
    this._contrasena = value;
  }

  set rol(value) {
    this._rol = value;
  }

  // Métodos adicionales para compatibilidad
  getNombre() {
    return this.nombre;
  }

  getEmail() {
    return this.correo;
  }

  getCorreo() {
    return this.correo;
  }

  getTelefono() {
    return this.telefono;
  }

  getRol() {
    return this.rol;
  }
}

export default Usuario;