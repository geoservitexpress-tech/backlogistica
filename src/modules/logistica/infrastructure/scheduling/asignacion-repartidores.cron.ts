import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VAR } from '../../../configuracion/variable.keys';
import { VariablesService } from '../../../configuracion/variables.service';
import { estaEnVentanaHorariaExpress, horaMinutoBogota } from '../../application/asignacion-fecha-bogota';
import { AsignacionRepartidoresService } from '../../application/asignacion-repartidores.service';

/**
 * Dos crons de asignación (zona `America/Bogota`):
 * - **20:00** — Normal (tipo 1) con entrega **mañana**, por `zona_bogota`.
 * - **Cada minuto (8:00–14:00)** — Express + Normal pendiente a repartidores **libres**.
 */
@Injectable()
export class AsignacionRepartidoresCron implements OnApplicationBootstrap {
  private readonly logger = new Logger(AsignacionRepartidoresCron.name);

  constructor(
    private readonly variables: VariablesService,
    private readonly asignacion: AsignacionRepartidoresService,
  ) {}

  /** Una corrida al levantar la API (útil para pruebas; no espera al próximo minuto). */
  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Arranque API: programando asignación Express inicial…');
    await this.ejecutarExpressRepartidoresLibres({ ignorarVentanaHoraria: true, origen: 'bootstrap' });
  }

  private async expressHabilitado(): Promise<boolean> {
    const master = await this.variables.getBoolean(VAR.CRON_ASIGNAR_REPARTIDORES_ENABLED, true);
    return this.variables.getBoolean(VAR.CRON_ASIGNAR_EXPRESS_20MIN_ENABLED, master);
  }

  /** 20:00 todos los días — pedidos Normal para entrega al día siguiente, agrupados por zona Bogotá. */
  @Cron('0 0 20 * * *', {
    timeZone: 'America/Bogota',
    name: 'asignar-normal-20h-manana',
  })
  async ejecutarNormalNocturno(): Promise<void> {
    const master = await this.variables.getBoolean(VAR.CRON_ASIGNAR_REPARTIDORES_ENABLED, true);
    const enabled = await this.variables.getBoolean(VAR.CRON_ASIGNAR_NORMAL_20H_ENABLED, master);
    if (!enabled) {
      this.logger.log(
        'Cron Normal 20h omitido (CRON_ASIGNAR_NORMAL_20H_ENABLED o CRON_ASIGNAR_REPARTIDORES_ENABLED=false).',
      );
      return;
    }
    try {
      const res = await this.asignacion.ejecutarAsignacionNormalNocturna();
      this.logger.log(`Cron Normal 20h: ${JSON.stringify(res)}`);
    } catch (e) {
      this.logger.error(
        `Cron Normal 20h falló: ${e instanceof Error ? e.message : String(e)}`,
        e instanceof Error ? e.stack : undefined,
      );
    }
  }

  /**
   * Express + backlog: **cada minuto** (segundo 0), ventana 8:00–14:00 Bogotá.
   * Nest usa 6 campos: `segundo minuto hora día mes díaSemana` → `0 * * * * *`.
   * (Con 5 campos `0 * * * *` NO es cada minuto en Nest.)
   */
  @Cron('0 * * * * *', {
    timeZone: 'America/Bogota',
    name: 'asignar-express-repartidores-libres',
  })
  async ejecutarExpressRepartidoresLibresCron(): Promise<void> {
    await this.ejecutarExpressRepartidoresLibres({ origen: 'cron' });
  }

  async ejecutarExpressRepartidoresLibres(opts?: {
    ignorarVentanaHoraria?: boolean;
    origen?: 'cron' | 'bootstrap';
  }): Promise<void> {
    const { hour, minute } = horaMinutoBogota();
    const enVentana = estaEnVentanaHorariaExpress();
    const origen = opts?.origen ?? 'manual';

    this.logger.log(
      `Cron Express [${origen}] tick ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} Bogotá ` +
        `ventana_8_14=${enVentana} ignorar_ventana=${opts?.ignorarVentanaHoraria === true}`,
    );

    if (!opts?.ignorarVentanaHoraria && !enVentana) {
      this.logger.log(
        'Cron Express omitido: fuera de ventana 08:00–14:00 (America/Bogota). ' +
          'Se ejecutará al iniciar la API o dentro del horario.',
      );
      return;
    }

    const enabled = await this.expressHabilitado();
    if (!enabled) {
      this.logger.warn(
        'Cron Express omitido: CRON_ASIGNAR_EXPRESS_20MIN_ENABLED o CRON_ASIGNAR_REPARTIDORES_ENABLED=false en public.variable.',
      );
      return;
    }

    try {
      const res = await this.asignacion.ejecutarAsignacionExpressYBacklog();
      this.logger.log(`Cron Express [${origen}] resultado: ${JSON.stringify(res)}`);
    } catch (e) {
      this.logger.error(
        `Cron Express [${origen}] falló: ${e instanceof Error ? e.message : String(e)}`,
        e instanceof Error ? e.stack : undefined,
      );
    }
  }
}
