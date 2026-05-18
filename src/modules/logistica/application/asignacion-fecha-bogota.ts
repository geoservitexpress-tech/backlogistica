export const ZONA_HORARIA_ASIGNACION = 'America/Bogota';

/** `YYYY-MM-DD` en la zona indicada (p. ej. America/Bogota). */
export function fechaYmdEnZona(d: Date, timeZone: string = ZONA_HORARIA_ASIGNACION): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(d);
}

export function hoyYmdBogota(): string {
  return fechaYmdEnZona(new Date());
}

/** Suma días civiles a un `YYYY-MM-DD` (UTC date math). */
export function sumarDiasYmd(ymd: string, dias: number): string {
  const [ys, ms, ds] = ymd.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  const dt = new Date(Date.UTC(y, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

export function mananaYmdBogota(): string {
  return sumarDiasYmd(hoyYmdBogota(), 1);
}

export function horaMinutoBogota(d: Date = new Date()): { hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA_ASIGNACION,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return { hour, minute };
}

/** Ventana del cron Express: 08:00–14:00 inclusive (Bogotá). */
export function estaEnVentanaHorariaExpress(d: Date = new Date()): boolean {
  const { hour, minute } = horaMinutoBogota(d);
  const desde = 8 * 60;
  const hasta = 14 * 60;
  const actual = hour * 60 + minute;
  return actual >= desde && actual <= hasta;
}
