class Prestamo {
  constructor(usuario, libro, fechaPrestamo, fechaDevolucion, estado = 'activo') {
    this.usuario = usuario;   // objeto Usuario
    this.libro = libro;       // objeto Libro
    this.fechaPrestamo = fechaPrestamo;
    this.fechaDevolucion = fechaDevolucion;
    this.estado = estado; // activo o devuelto
  }

  get libro() {
    return this._libro;
  }

  get usuario() {
    return this._usuario;
  }

  get fechaPrestamo() {
    return this._fechaPrestamo;
  }

  get fechaDevolucion() {
    return this._fechaDevolucion;
  }

  get estado() {
    return this._estado;
  }

  set libro(value) {
    this._libro = value;
  }

  set usuario(value) {
    this._usuario = value;
  }

  set fechaPrestamo(value) {
    this._fechaPrestamo = value;
  }

  set fechaDevolucion(value) {
    this._fechaDevolucion = value;
  }

  set estado(value) {
    this._estado = value;
  }

  // Métodos adicionales para compatibilidad
  getUsuario() {
    return this.usuario;
  }

  getLibro() {
    return this.libro;
  }

  getFechaPrestamo() {
    return this.fechaPrestamo;
  }

  getFechaDevolucion() {
    return this.fechaDevolucion;
  }

  getEstado() {
    return this.estado;
  }
}

export default Prestamo;