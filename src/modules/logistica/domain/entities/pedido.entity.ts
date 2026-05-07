/** Agregado principal de la logística: pedido y sus referencias por ID (sin acoplar a persistencia). */
export class Pedido {
  constructor(
    public readonly idPedido: number,
    public readonly numGuia: string,
    public readonly fkTipoPedido: number,
    public readonly fkUsuarioSolicitud: number,
    public readonly fkUsuarioRecolector: number | null,
    public readonly fkUsuarioRepartidor: number | null,
    public readonly fkMetodoRecepcion: number,
    public readonly fkPaquete: number,
    public readonly fkDireccion: number,
    public readonly fkEstadoPedido: number,
    public readonly creadoEn: Date,
  ) {}
}
