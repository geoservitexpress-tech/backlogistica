import type { PedidoListado } from '../../domain/read-models/pedido-listado';
import { formatFechaEntregaYyyyMmDd } from '../../domain/pedido-fecha-entrega';
import type { PedidoTipoOperacion } from '../../domain/pedido-tipo-operacion';
import { lineaNomenclaturaColombiana } from '../../application/direccion-colombiana-texto';
import type { DireccionOrmEntity } from './direccion.orm-entity';
import type { PedidoOrmEntity } from './pedido.orm-entity';
import type { UsuarioOrmEntity } from './usuario.orm-entity';

function nombreUsuario(u: UsuarioOrmEntity): string {
  return `${u.nombres} ${u.apellidos}`.trim();
}

function inferirTipoOperacionDesdeMetodoRecepcion(nombreMetodo: string): PedidoTipoOperacion | null {
  if (/recogida|recolec|recolecta|pickup|retiro/i.test(nombreMetodo)) return 'RECOLECCION';
  if (/entrega|domicilio|delivery|despacho/i.test(nombreMetodo)) return 'DESPACHO';
  return null;
}

/** Texto del solicitante: nombre completo del usuario (`fk_usuario_solicitud`). */
function etiquetaSolicitante(row: PedidoOrmEntity): string {
  return nombreUsuario(row.usuarioSolicitud);
}

/** Ciudad, depto, línea de nomenclatura CO (`tipo` + `zona` antes de `#` + placas) y observaciones. */
function etiquetaDireccion(d: DireccionOrmEntity): string {
  const obs = d.observacionesEntrega?.trim();
  const obsCorta =
    obs && obs.length > 100 ? `${obs.slice(0, 97).replace(/\s+$/, '')}…` : (obs ?? null);
  const viaLine = lineaNomenclaturaColombiana(d);
  const localidad = d.zonaBogota?.nombre;
  const partes = [localidad, d.ciudad?.nombre, d.departamento?.nombre, viaLine, obsCorta].filter(
    Boolean,
  );
  return partes.join(', ');
}

export function pedidoOrmToListado(row: PedidoOrmEntity): PedidoListado {
  return {
    idPedido: row.idPedido,
    numGuia: row.numGuia,
    creadoEn: row.creadoEn.toISOString(),
    tipoPedido: row.tipoPedido.nombre,
    tipoOperacion: inferirTipoOperacionDesdeMetodoRecepcion(row.metodoRecepcion.nombre),
    fechaEntrega: formatFechaEntregaYyyyMmDd(row.fechaEntrega),
    idEstadoPedido: row.estadoPedido.idEstadoPedido,
    estadoPedido: row.estadoPedido.nombre,
    idTipoPedido: row.tipoPedido.idTipoPedido,
    metodoRecepcion: row.metodoRecepcion.nombre,
    usuarioSolicitud: etiquetaSolicitante(row),
    usuarioRecolector: row.usuarioRecolector ? nombreUsuario(row.usuarioRecolector) : null,
    usuarioRepartidor: row.usuarioRepartidor ? nombreUsuario(row.usuarioRepartidor) : null,
    paquete: row.paquete.nombre,
    direccion: etiquetaDireccion(row.direccion),
    idZonaBogota: row.direccion.zonaBogota?.idZona ?? null,
    zonaBogota: row.direccion.zonaBogota?.nombre ?? null,
    destinatarioNombre: row.destinatario?.nombre ?? null,
    destinatarioTelefono: row.destinatario?.telefono ?? null,
    direccionDestino: row.direccionDestino ? etiquetaDireccion(row.direccionDestino) : null,
    destinatarioDestinoNombre: row.destinatarioDestino?.nombre ?? null,
    destinatarioDestinoTelefono: row.destinatarioDestino?.telefono ?? null,
    fragil: row.fragil ?? false,
    observacionesManifiesto: row.observacionesManifiesto ?? null,
    fotosPaqueteUrls: row.fotosPaqueteUrls ?? null,
    pagadoPorRemitente: row.pagadoPorRemitente ?? false,
    precio: row.precio ?? 0,
  };
}
