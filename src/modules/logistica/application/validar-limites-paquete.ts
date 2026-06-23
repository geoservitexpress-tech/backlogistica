import { BadRequestException } from '@nestjs/common';
import { VAR } from '../../configuracion/variable.keys';
import type { VariablesService } from '../../configuracion/variables.service';

export interface LimitesPaqueteConfig {
  pesoMaxKg: number;
  altoMaxCm: number;
  anchoMaxCm: number;
  largoMaxCm: number;
  sumaLadosMaxCm: number;
  dimensionesObligatorias: boolean;
}

export interface PaqueteMedidasInput {
  pesoKg?: number;
  altoCm?: number | null;
  anchoCm?: number | null;
  largoCm?: number | null;
}

export async function cargarLimitesPaquete(variables: VariablesService): Promise<LimitesPaqueteConfig> {
  const [pesoMaxKg, altoMaxCm, anchoMaxCm, largoMaxCm, sumaLadosMaxCm, dimensionesObligatorias] =
    await Promise.all([
      variables.getInt(VAR.PAQUETE_PESO_MAX_KG, 30, { min: 25, max: 30 }),
      variables.getInt(VAR.PAQUETE_ALTO_MAX_CM, 60, { min: 1, max: 500 }),
      variables.getInt(VAR.PAQUETE_ANCHO_MAX_CM, 60, { min: 1, max: 500 }),
      variables.getInt(VAR.PAQUETE_LARGO_MAX_CM, 100, { min: 1, max: 500 }),
      variables.getInt(VAR.PAQUETE_SUMA_LADOS_MAX_CM, 200, { min: 0, max: 2000 }),
      variables.getBoolean(VAR.PAQUETE_DIMENSIONES_OBLIGATORIAS, false),
    ]);

  return {
    pesoMaxKg,
    altoMaxCm,
    anchoMaxCm,
    largoMaxCm,
    sumaLadosMaxCm,
    dimensionesObligatorias,
  };
}

function tieneValorDimension(v: number | null | undefined): v is number {
  return v != null && Number.isFinite(v);
}

export function validarLimitesPaquete(
  input: PaqueteMedidasInput,
  limites: LimitesPaqueteConfig,
  opts?: { esCreacion?: boolean },
): void {
  if (input.pesoKg != null) {
    if (!Number.isFinite(input.pesoKg) || input.pesoKg <= 0) {
      throw new BadRequestException('pesoKg debe ser mayor que 0.');
    }
    if (input.pesoKg > limites.pesoMaxKg) {
      throw new BadRequestException(
        `pesoKg (${input.pesoKg} kg) supera el máximo permitido (${limites.pesoMaxKg} kg). ` +
          'Ajuste PAQUETE_PESO_MAX_KG en public.variable (25–30).',
      );
    }
  }

  const dims = {
    altoCm: input.altoCm,
    anchoCm: input.anchoCm,
    largoCm: input.largoCm,
  };
  const algunaDimension = Object.values(dims).some(tieneValorDimension);
  const todasDimensiones = Object.values(dims).every(tieneValorDimension);

  if (opts?.esCreacion && limites.dimensionesObligatorias && !todasDimensiones) {
    throw new BadRequestException(
      'altoCm, anchoCm y largoCm son obligatorios (PAQUETE_DIMENSIONES_OBLIGATORIAS=true en public.variable).',
    );
  }

  if (algunaDimension && !todasDimensiones) {
    throw new BadRequestException(
      'Envíe altoCm, anchoCm y largoCm juntos, o ninguno.',
    );
  }

  if (!todasDimensiones) return;

  const alto = dims.altoCm!;
  const ancho = dims.anchoCm!;
  const largo = dims.largoCm!;

  if (alto <= 0 || ancho <= 0 || largo <= 0) {
    throw new BadRequestException('altoCm, anchoCm y largoCm deben ser mayores que 0.');
  }

  if (alto > limites.altoMaxCm) {
    throw new BadRequestException(
      `altoCm (${alto} cm) supera el máximo (${limites.altoMaxCm} cm). Revise PAQUETE_ALTO_MAX_CM.`,
    );
  }
  if (ancho > limites.anchoMaxCm) {
    throw new BadRequestException(
      `anchoCm (${ancho} cm) supera el máximo (${limites.anchoMaxCm} cm). Revise PAQUETE_ANCHO_MAX_CM.`,
    );
  }
  if (largo > limites.largoMaxCm) {
    throw new BadRequestException(
      `largoCm (${largo} cm) supera el máximo (${limites.largoMaxCm} cm). Revise PAQUETE_LARGO_MAX_CM.`,
    );
  }

  if (limites.sumaLadosMaxCm > 0) {
    const suma = alto + ancho + largo;
    if (suma > limites.sumaLadosMaxCm) {
      throw new BadRequestException(
        `La suma de dimensiones (${suma} cm) supera el máximo (${limites.sumaLadosMaxCm} cm). ` +
          'Revise PAQUETE_SUMA_LADOS_MAX_CM.',
      );
    }
  }
}
