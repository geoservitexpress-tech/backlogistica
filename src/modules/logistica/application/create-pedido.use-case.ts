import { Inject, Injectable } from '@nestjs/common';
import type { CreatePedidoFormInput, PedidoWritePort } from '../domain/ports/pedido-write.port';
import { PEDIDO_WRITE } from '../pedidos.tokens';
import type { CreatePedidoBodyDto } from '../presentation/http/dto/create-pedido.body.dto';

@Injectable()
export class CreatePedidoUseCase {
  constructor(@Inject(PEDIDO_WRITE) private readonly write: PedidoWritePort) {}

  execute(body: CreatePedidoBodyDto, idUsuario: number) {
    const input: CreatePedidoFormInput = {
      idUsuario,
      idTipoPedido: body.idTipoPedido,
      fechaEntrega: body.fechaEntrega,
      idMetodoRecepcion: body.idMetodoRecepcion,
      nombreDestinatario: body.nombreDestinatario,
      telefonoDestinatario: body.telefonoDestinatario,
      tipoViaNombre: body.tipoViaNombre,
      nombreVia: body.nombreVia,
      numeroPlaca: body.numeroPlaca,
      numeroSecundario: body.numeroSecundario,
      idCiudad: body.idCiudad,
      idDepartamento: body.idDepartamento,
      idPais: body.idPais,
      ...(body.idZonaBogota != null && { idZonaBogota: body.idZonaBogota }),
      ...(body.observacionesDireccion != null && {
        observacionesDireccion: body.observacionesDireccion,
      }),
      tipoProductoNombre: body.tipoProductoNombre,
      pesoKg: body.pesoKg,
      valorDeclarado: body.valorDeclarado,
      fragil: body.fragil,
      ...(body.observacionesManifiesto != null && {
        observacionesManifiesto: body.observacionesManifiesto,
      }),
      ...(body.fotosPaqueteUrls != null && { fotosPaqueteUrls: body.fotosPaqueteUrls }),
      ...(body.fotosPaqueteBase64 != null && { fotosPaqueteBase64: body.fotosPaqueteBase64 }),
    };
    return this.write.createPedidoFromForm(input);
  }
}
