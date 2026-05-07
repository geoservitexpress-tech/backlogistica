export class Usuario {
  constructor(
    public readonly idUsuario: number,
    public readonly nombres: string,
    public readonly apellidos: string,
    public readonly fkTipoDocumento: number,
    public readonly documento: string,
    public readonly correo: string,
    public readonly telefono: string,
    public readonly creadoEn: Date,
  ) {}
}
