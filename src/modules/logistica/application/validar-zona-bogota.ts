import { BadRequestException } from '@nestjs/common';
import { CIUDAD_ID_BOGOTA_DC } from '../logistica-geografia.constants';

/** `idZonaBogota` solo aplica a entregas en Bogotá D.C. (`idCiudad` = 149). */
export function validarIdZonaBogotaParaCiudad(idCiudad: number, idZonaBogota?: number | null): void {
  if (idZonaBogota == null) return;
  if (idCiudad !== CIUDAD_ID_BOGOTA_DC) {
    throw new BadRequestException(
      `idZonaBogota solo aplica cuando idCiudad es Bogotá D.C. (${CIUDAD_ID_BOGOTA_DC}). ` +
        'Para otras ciudades no envíe este campo. Catálogo: GET /catalogo/zonas-bogota.',
    );
  }
}

export function esCiudadBogotaDc(idCiudad: number): boolean {
  return idCiudad === CIUDAD_ID_BOGOTA_DC;
}
