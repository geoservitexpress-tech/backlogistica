import { METODO_PAGO_EFECTIVO_ID } from '../../modules/logistica/logistica-metodo-pago.constants';
import {
  RESULTADO_ENTREGA_EXITO_ID,
  RESULTADO_ENTREGA_NO_ENTREGADO_ID,
  RESULTADO_ENTREGA_NOVEDADES_ID,
} from '../../modules/logistica/logistica-resultado-entrega.constants';
import { ESTADO_PEDIDO_ENTREGADO_ID } from '../../modules/logistica/logistica-pedido-estados.constants';
import { TIPO_PEDIDO_ID_NORMAL } from '../../modules/logistica/logistica-tipo-pedido.constants';
import { EJEMPLO_FOTO_ENTREGA_DATA_URL } from '../../modules/logistica/presentation/http/ejemplo-foto-entrega.data-url';
import { EJEMPLO_FOTO_PAQUETE_DATA_URL } from '../../modules/logistica/presentation/http/ejemplo-foto-paquete.data-url';
import { SWAGGER_EJEMPLO_ID_PEDIDO } from '../swagger-ejemplos';

/** Varias evidencias en un mismo cierre (cada una → fila en `descripcion_seguimiento`; observaciones en la primera). */
export const EJEMPLO_FOTOS_ENTREGA_BASE64 = [
  EJEMPLO_FOTO_ENTREGA_DATA_URL,
  EJEMPLO_FOTO_PAQUETE_DATA_URL,
] as const;

export const EJEMPLO_ENTREGA_EXITO_EFECTIVO = {
  idResultadoEntrega: RESULTADO_ENTREGA_EXITO_ID,
  pagadoPorRemitente: false,
  idMetodoPago: METODO_PAGO_EFECTIVO_ID,
  valorRecaudado: 15000,
  observaciones: 'Se entregó en portería con el vigilante Juan Pérez',
  fotosEntregaBase64: [...EJEMPLO_FOTOS_ENTREGA_BASE64],
} as const;

export const EJEMPLO_ENTREGA_NOVEDADES = {
  idResultadoEntrega: RESULTADO_ENTREGA_NOVEDADES_ID,
  pagadoPorRemitente: true,
  valorRecaudado: 0,
  observaciones: 'Caja con golpe menor; cliente aceptó el paquete',
  fotosEntregaBase64: [...EJEMPLO_FOTOS_ENTREGA_BASE64],
} as const;

export const EJEMPLO_ENTREGA_NO_ENTREGADO = {
  idResultadoEntrega: RESULTADO_ENTREGA_NO_ENTREGADO_ID,
  pagadoPorRemitente: false,
  valorRecaudado: 0,
  observaciones: 'Domicilio cerrado, cliente ausente; se intentó llamar dos veces',
} as const;

/** Respuesta típica tras entrega exitosa (`POST …/confirmar-entrega`). */
export const EJEMPLO_RESPUESTA_PEDIDO_ENTREGADO = {
  idPedido: SWAGGER_EJEMPLO_ID_PEDIDO,
  numGuia: 'GUA-001-2026',
  creadoEn: '2026-05-02T18:49:07.288Z',
  tipoPedido: 'Normal',
  tipoOperacion: 'DESPACHO',
  fechaEntrega: '2026-05-20',
  idEstadoPedido: ESTADO_PEDIDO_ENTREGADO_ID,
  estadoPedido: 'Entregado',
  idTipoPedido: TIPO_PEDIDO_ID_NORMAL,
  metodoRecepcion: 'Entrega',
  usuarioSolicitud: 'Juan Pérez',
  usuarioRecolector: null,
  usuarioRepartidor: 'Carlos Repartidor',
  paquete: 'Electrónicos',
  direccion: 'Bogotá, Bogotá D.C., Calle 11b # 15-40, Torre norte, apto 502',
  idZonaBogota: 1,
  zonaBogota: 'Usaquén',
  destinatarioNombre: 'María Pérez',
  destinatarioTelefono: '3001234567',
  fragil: true,
  observacionesManifiesto: 'Manipular con cuidado, llamar al recibir.',
  fotosPaqueteUrls: ['https://example.supabase.co/storage/v1/object/public/evidencias/pedidos/1/foto-1.jpg'],
} as const;
