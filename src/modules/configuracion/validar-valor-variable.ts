import { BadRequestException } from '@nestjs/common';
import { VAR } from './variable.keys';

export function validarValorVariable(clave: string, tipo: string, valor: string): void {
  const v = valor.trim();
  if (!v) {
    throw new BadRequestException('valor no puede estar vacío.');
  }

  switch (tipo.trim().toLowerCase()) {
    case 'boolean': {
      const lower = v.toLowerCase();
      if (!['true', 'false', '1', '0', 'yes', 'no', 'si', 'sí'].includes(lower)) {
        throw new BadRequestException(
          `valor inválido para tipo boolean (${clave}): use true/false, 1/0, yes/no o si/no.`,
        );
      }
      break;
    }
    case 'integer': {
      if (!/^-?\d+$/.test(v)) {
        throw new BadRequestException(`valor inválido para tipo integer (${clave}): debe ser un entero.`);
      }
      validarReglasNegocioVariable(clave, Number.parseInt(v, 10));
      break;
    }
    case 'integer_list': {
      const partes = v
        .split(/[,;\s]+/)
        .map((x) => x.trim())
        .filter(Boolean);
      if (partes.length === 0) {
        throw new BadRequestException(
          `valor inválido para tipo integer_list (${clave}): indique al menos un entero separado por coma.`,
        );
      }
      if (!partes.every((p) => /^\d+$/.test(p))) {
        throw new BadRequestException(
          `valor inválido para tipo integer_list (${clave}): solo enteros positivos separados por coma.`,
        );
      }
      break;
    }
    case 'json': {
      try {
        JSON.parse(v);
      } catch {
        throw new BadRequestException(`valor inválido para tipo json (${clave}): JSON mal formado.`);
      }
      break;
    }
    case 'text':
      break;
    default:
      break;
  }
}

function validarReglasNegocioVariable(clave: string, n: number): void {
  if (clave === VAR.PAQUETE_PESO_MAX_KG && (n < 25 || n > 30)) {
    throw new BadRequestException('PAQUETE_PESO_MAX_KG debe estar entre 25 y 30 kg.');
  }
  if (clave === VAR.ASIGNACION_MAX_ENTREGAS_POR_REPARTIDOR_DIA && (n < 1 || n > 500)) {
    throw new BadRequestException('ASIGNACION_MAX_ENTREGAS_POR_REPARTIDOR_DIA debe estar entre 1 y 500.');
  }
  if (
    (clave === VAR.PAQUETE_ALTO_MAX_CM ||
      clave === VAR.PAQUETE_ANCHO_MAX_CM ||
      clave === VAR.PAQUETE_LARGO_MAX_CM) &&
    (n < 1 || n > 500)
  ) {
    throw new BadRequestException(`${clave} debe estar entre 1 y 500 cm.`);
  }
  if (clave === VAR.PAQUETE_SUMA_LADOS_MAX_CM && (n < 0 || n > 2000)) {
    throw new BadRequestException('PAQUETE_SUMA_LADOS_MAX_CM debe estar entre 0 y 2000 (0 = desactivado).');
  }
  if (clave === VAR.TARIFA_EXPRESS_MIN_COP && (n < 1 || n > 1_000_000)) {
    throw new BadRequestException('TARIFA_EXPRESS_MIN_COP fuera de rango.');
  }
  if (clave === VAR.TARIFA_EXPRESS_MAX_COP && (n < 1 || n > 1_000_000)) {
    throw new BadRequestException('TARIFA_EXPRESS_MAX_COP fuera de rango.');
  }
  if (clave === VAR.TARIFA_PESO_BASE_KG && (n < 1 || n > 30)) {
    throw new BadRequestException('TARIFA_PESO_BASE_KG debe estar entre 1 y 30.');
  }
}
