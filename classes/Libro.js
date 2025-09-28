class Libro {
  constructor(titulo, isbn, autor, anioPublicacion, genero = '', estado = 'disponible') {
    this.titulo = titulo;
    this.isbn = isbn;
    this.genero = genero;
    this.anioPublicacion = anioPublicacion;
    this.autor = autor; // objeto Autor
    this.estado = estado; // disponible o prestado
  }

  get titulo() {
    return this._titulo;
  }

  get isbn() {
    return this._isbn;
  }

  get genero() {
    return this._genero;
  }

  get anioPublicacion() {
    return this._anioPublicacion;
  }

  get autor() {
    return this._autor;
  }

  get estado() {
    return this._estado;
  }

  set titulo(value) {
    this._titulo = value;
  }

  set isbn(value) {
    this._isbn = value;
  }

  set genero(value) {
    this._genero = value;
  }

  set anioPublicacion(value) {
    this._anioPublicacion = value;
  }

  set autor(value) {
    this._autor = value;
  }

  set estado(value) {
    this._estado = value;
  }

  // Métodos adicionales para compatibilidad
  getTitulo() {
    return this.titulo;
  }

  getIsbn() {
    return this.isbn;
  }

  getAutor() {
    return this.autor;
  }

  getAnioPublicacion() {
    return this.anioPublicacion;
  }

  getGenero() {
    return this.genero;
  }

  getEstado() {
    return this.estado;
  }
}

export default Libro;