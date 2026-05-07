export class Direccion {
  constructor(
    public readonly idDireccion: number,
    public readonly fkTipoVia: number,
    public readonly fkPais: number,
    public readonly fkDepartamento: number,
    public readonly fkCiudad: number,
    public readonly zona: string,
    public readonly numeroPrincipal: string,
    public readonly numeroSecundario: string,
    public readonly creadoEn: Date,
  ) {}
}
