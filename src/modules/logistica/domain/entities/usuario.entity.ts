export class Usuario {
  constructor(
    public readonly idUsuario: number,
    public readonly authUserId: string,
    public readonly nombres: string,
    public readonly apellidos: string,
  ) {}
}
