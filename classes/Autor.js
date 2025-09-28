class Autor {
  constructor(nombre, nacionalidad, fechaNacimiento, biografia = '') {
    this.nombre = nombre;
    this.nacionalidad = nacionalidad;
    this.fechaNacimiento = fechaNacimiento;
    this.biografia = biografia;
  }

  get nombre() {
    return this._nombre;
  }

  get nacionalidad() {
    return this._nacionalidad;
  }

  get fechaNacimiento() {
    return this._fechaNacimiento;
  }

  get biografia() {
    return this._biografia;
  }

  set nombre(value) {
    this._nombre = value;
  }

  set nacionalidad(value) {
    this._nacionalidad = value;
  }

  set fechaNacimiento(value) {
    this._fechaNacimiento = value;
  }

  set biografia(value) {
    this._biografia = value;
  }

  // Métodos adicionales para compatibilidad
  getNombre() {
    return this.nombre;
  }

  getNacionalidad() {
    return this.nacionalidad;
  }

  getFechaNacimiento() {
    return this.fechaNacimiento;
  }

  getBiografia() {
    return this.biografia;
  }
}

export default Autor;