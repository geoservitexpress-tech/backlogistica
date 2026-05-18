import {
  CIUDAD_ID_BOGOTA_DC,
  DEPARTAMENTO_ID_BOGOTA,
  PAIS_ID_COLOMBIA,
  ZONA_BOGOTA_EJEMPLO_ID,
} from '../../modules/logistica/logistica-geografia.constants';
import { ESTADO_PEDIDO_ASIGNADO_ID } from '../../modules/logistica/logistica-pedido-estados.constants';
import { METODO_RECEPCION_ID_ENTREGA } from '../../modules/logistica/logistica-metodo-recepcion.constants';
import { TIPO_PEDIDO_ID_NORMAL } from '../../modules/logistica/logistica-tipo-pedido.constants';
import { EJEMPLO_FOTO_PAQUETE_DATA_URL } from '../../modules/logistica/presentation/http/ejemplo-foto-paquete.data-url';

/** POST /pedidos — entrega en Bogotá, tipo Normal (solicitante = JWT, no va en el body). */
export const EJEMPLO_CREAR_PEDIDO_DESPACHO_BOGOTA = {
  idTipoPedido: TIPO_PEDIDO_ID_NORMAL,
  fechaEntrega: '2026-05-20',
  idMetodoRecepcion: METODO_RECEPCION_ID_ENTREGA,
  nombreDestinatario: 'María Pérez',
  telefonoDestinatario: '3001234567',
  tipoViaNombre: 'Calle',
  nombreVia: '11b',
  numeroPlaca: '15',
  numeroSecundario: '40',
  idCiudad: CIUDAD_ID_BOGOTA_DC,
  idDepartamento: DEPARTAMENTO_ID_BOGOTA,
  idPais: PAIS_ID_COLOMBIA,
  idZonaBogota: ZONA_BOGOTA_EJEMPLO_ID,
  observacionesDireccion: 'Torre norte, apto 502',
  tipoProductoNombre: 'Electrónicos',
  pesoKg: 2.5,
  valorDeclarado: 1500000,
  fragil: true,
  observacionesManifiesto:
    'Manipular con cuidado, llamar al recibir al número indicado en la etiqueta.',
  fotosPaqueteBase64: [EJEMPLO_FOTO_PAQUETE_DATA_URL],
};

/** Mismo alta con énfasis en carga de fotos (Storage `evidencias/pedidos/{id}/`). */
export const EJEMPLO_CREAR_PEDIDO_CON_FOTOS_PAQUETE = {
  ...EJEMPLO_CREAR_PEDIDO_DESPACHO_BOGOTA,
  fotosPaqueteBase64: [EJEMPLO_FOTO_PAQUETE_DATA_URL],
};

/** PATCH /pedidos/{id} — asignar estado y método de recepción. */
export const EJEMPLO_PATCH_PEDIDO_ESTADO = {
  idEstadoPedido: ESTADO_PEDIDO_ASIGNADO_ID,
  idMetodoRecepcion: METODO_RECEPCION_ID_ENTREGA,
  fechaEntrega: '2026-05-21',
};
