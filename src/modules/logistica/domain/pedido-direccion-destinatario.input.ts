/** Bloque de contacto + dirección (recogida, entrega o destino de recogida). */
export type PedidoDireccionDestinatarioInput = {
  nombreDestinatario: string;
  telefonoDestinatario: string;
  tipoViaNombre: string;
  nombreVia: string;
  numeroPlaca: string;
  numeroSecundario: string;
  idCiudad: number;
  idDepartamento: number;
  idPais: number;
  idZonaBogota?: number;
  observacionesDireccion?: string;
};
