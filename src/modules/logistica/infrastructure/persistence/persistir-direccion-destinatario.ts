import { BadRequestException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { PedidoDireccionDestinatarioInput } from '../../domain/pedido-direccion-destinatario.input';
import { validarIdZonaBogotaParaCiudad } from '../../application/validar-zona-bogota';
import { CiudadOrmEntity } from './ciudad.orm-entity';
import { DepartamentoOrmEntity } from './departamento.orm-entity';
import { DestinatarioOrmEntity } from './destinatario.orm-entity';
import { DireccionOrmEntity } from './direccion.orm-entity';
import { PaisOrmEntity } from './pais.orm-entity';
import { TipoViaOrmEntity } from './tipo-via.orm-entity';
import { ZonaBogotaOrmEntity } from './zona-bogota.orm-entity';

function armarZonaResumida(
  tipoViaNombre: string,
  nombreVia: string,
  placa: string,
  secundaria: string,
): string {
  let z =
    `${tipoViaNombre.trim()} ${nombreVia.trim()} # ${placa.trim()}-${secundaria.trim()}`.trim();
  if (z.length > 160) z = `${z.slice(0, 157)}...`;
  return z;
}

async function resolverTipoVia(manager: EntityManager, nombre: string): Promise<TipoViaOrmEntity> {
  const rows = await manager.getRepository(TipoViaOrmEntity).find();
  const key = nombre.trim().toLowerCase();
  const found = rows.find((r) => r.nombre.trim().toLowerCase() === key);
  if (!found) {
    throw new BadRequestException(`Tipo de vía no encontrado: "${nombre}"`);
  }
  return found;
}

async function resolverZonaBogotaOpcional(
  manager: EntityManager,
  idCiudad: number,
  idZonaBogota?: number,
): Promise<ZonaBogotaOrmEntity | null> {
  validarIdZonaBogotaParaCiudad(idCiudad, idZonaBogota);
  if (idZonaBogota == null) return null;
  const zona = await manager.getRepository(ZonaBogotaOrmEntity).findOne({
    where: { idZona: idZonaBogota },
  });
  if (!zona) {
    throw new BadRequestException(
      `zona_bogota no encontrada: id_zona=${idZonaBogota}. Use GET /catalogo/zonas-bogota.`,
    );
  }
  return zona;
}

export type DireccionDestinatarioPersistido = {
  direccion: DireccionOrmEntity;
  destinatario: DestinatarioOrmEntity;
  ciudad: CiudadOrmEntity;
  departamento: DepartamentoOrmEntity;
};

export async function persistirDireccionYDestinatario(
  manager: EntityManager,
  input: PedidoDireccionDestinatarioInput,
  creadoEn: Date,
): Promise<DireccionDestinatarioPersistido> {
  const tipoVia = await resolverTipoVia(manager, input.tipoViaNombre);

  const ciudad = await manager.getRepository(CiudadOrmEntity).findOne({
    where: { idCiudad: input.idCiudad },
  });
  if (!ciudad) {
    throw new BadRequestException(`Ciudad no encontrada por id_ciudad=${input.idCiudad}`);
  }

  const departamento = await manager.getRepository(DepartamentoOrmEntity).findOne({
    where: { idDepartamento: input.idDepartamento },
  });
  if (!departamento) {
    throw new BadRequestException(
      `Departamento no encontrado por id_departamento=${input.idDepartamento}`,
    );
  }

  const pais = await manager.getRepository(PaisOrmEntity).findOne({
    where: { idPais: input.idPais },
  });
  if (!pais) {
    throw new BadRequestException(`País no encontrado por id_pais=${input.idPais}`);
  }

  const zonaBogota = await resolverZonaBogotaOpcional(manager, input.idCiudad, input.idZonaBogota);
  const nombreViaNorm = input.nombreVia.trim().slice(0, 120);
  const zona = armarZonaResumida(
    tipoVia.nombre,
    nombreViaNorm,
    input.numeroPlaca,
    input.numeroSecundario,
  );

  const direccion = manager.getRepository(DireccionOrmEntity).create({
    tipoVia: { idTipoVia: tipoVia.idTipoVia },
    pais: { idPais: pais.idPais },
    departamento: { idDepartamento: departamento.idDepartamento },
    ciudad: { idCiudad: ciudad.idCiudad },
    zonaBogota,
    observacionesEntrega: input.observacionesDireccion?.trim() || null,
    zona,
    numeroPrincipal: input.numeroPlaca.trim().slice(0, 32),
    numeroSecundario: input.numeroSecundario.trim().slice(0, 32),
    creadoEn,
  });
  await manager.getRepository(DireccionOrmEntity).save(direccion);

  const destinatario = manager.getRepository(DestinatarioOrmEntity).create({
    nombre: input.nombreDestinatario.trim().slice(0, 200),
    telefono: input.telefonoDestinatario.trim().slice(0, 32),
    creadoEn,
  });
  await manager.getRepository(DestinatarioOrmEntity).save(destinatario);

  return { direccion, destinatario, ciudad, departamento };
}

export function textoDireccionEntrega(
  ciudad: CiudadOrmEntity,
  departamento: DepartamentoOrmEntity,
  direccion: DireccionOrmEntity,
): string {
  return [
    ciudad.nombre,
    departamento.nombre,
    direccion.zona,
    direccion.observacionesEntrega,
  ]
    .filter(Boolean)
    .join(', ');
}
