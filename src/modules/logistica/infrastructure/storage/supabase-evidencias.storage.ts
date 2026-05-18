import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { RealtimeClientOptions } from '@supabase/realtime-js';
import WebSocket from 'ws';

const BUCKET = 'evidencias';
/** ~6 MB por imagen decodificada (límite razonable para JSON + base64). */
const MAX_BYTES_PER_IMAGE = 6 * 1024 * 1024;
const DATA_URL_RE = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/is;

function extensionFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('gif')) return 'gif';
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
  return 'bin';
}

function pickSupabaseUrl(c: ConfigService): string {
  return (
    c.get<string>('SUPABASE_URL')?.trim() ||
    c.get<string>('NEXT_PUBLIC_SUPABASE_URL')?.trim() ||
    ''
  );
}

/** Clave `service_role` (JWT largo); la clave `anon` no sirve para subir a Storage desde el backend. */
function pickServiceRoleKey(c: ConfigService): string {
  return (
    c.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim() ||
    c.get<string>('SUPABASE_SERVICE_KEY')?.trim() ||
    ''
  );
}

@Injectable()
export class SupabaseEvidenciasStorage implements OnModuleInit {
  private readonly logger = new Logger(SupabaseEvidenciasStorage.name);
  private readonly client: SupabaseClient | null;

  constructor(private readonly config: ConfigService) {
    const url = pickSupabaseUrl(config);
    const key = pickServiceRoleKey(config);
    this.client =
      url && key
        ? createClient(url, key, {
            auth: { persistSession: false },
            // Node.js < 22: Realtime necesita el transporte `ws` (WebSocket global no disponible).
            realtime: {
              transport: WebSocket as unknown as NonNullable<RealtimeClientOptions['transport']>,
            },
          })
        : null;
  }

  onModuleInit(): void {
    if (!this.client) {
      this.logger.warn(
        'Supabase Storage desactivado: defina SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env (service_role, no anon) para subir fotos en base64.',
      );
    }
  }

  /** URLs públicas de archivos en `evidencias/pedidos/{id}/` (excluye `manifiesto.txt`). */
  async listarUrlsFotosPedido(idPedido: string | number): Promise<string[]> {
    const client = this.client;
    if (!client) return [];
    const prefix = `pedidos/${idPedido}`;
    const { data, error } = await client.storage.from(BUCKET).list(prefix, {
      limit: 50,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error || !data?.length) {
      if (error) this.logger.debug(`Storage list ${prefix}: ${error.message}`);
      return [];
    }
    return data
      .filter((f) => f.name && f.name !== 'manifiesto.txt')
      .filter((f) => /\.(png|jpe?g|webp|gif|bin)$/i.test(f.name))
      .map((f) => client.storage.from(BUCKET).getPublicUrl(`${prefix}/${f.name}`).data.publicUrl);
  }

  /** Texto guardado en `pedidos/{id}/manifiesto.txt` (UTF-8), si existe. */
  async leerManifiestoPedido(idPedido: string | number): Promise<string | null> {
    const client = this.client;
    if (!client) return null;
    const path = `pedidos/${idPedido}/manifiesto.txt`;
    const { data, error } = await client.storage.from(BUCKET).download(path);
    if (error || !data) return null;
    try {
      return (await data.text()).trim() || null;
    } catch {
      return null;
    }
  }

  /** JSON del formulario de entrega del repartidor (`entrega-formulario.json`). */
  async guardarFormularioEntrega(idPedido: string | number, payload: unknown): Promise<void> {
    const client = this.client;
    if (!client) return;
    const path = `pedidos/${idPedido}/entrega-formulario.json`;
    const body = Buffer.from(JSON.stringify(payload, null, 2), 'utf8');
    const { error } = await client.storage.from(BUCKET).upload(path, body, {
      contentType: 'application/json; charset=utf-8',
      upsert: true,
    });
    if (error) {
      this.logger.warn(`Storage entrega JSON ${path}: ${error.message}`);
    }
  }

  /** Sube una foto de evidencia de entrega; devuelve URL pública. */
  async subirFotoEntrega(idPedido: string | number, entrada: string): Promise<string> {
    const urls = await this.resolverFotosPedido(idPedido, [entrada]);
    if (!urls[0]) {
      throw new BadRequestException('No se pudo procesar la foto de entrega.');
    }
    return urls[0];
  }

  /** Persiste observaciones del manifiesto en Storage (no requiere columna en `pedidos`). */
  async guardarManifiestoPedido(idPedido: string | number, texto: string): Promise<void> {
    const client = this.client;
    if (!client) return;
    const path = `pedidos/${idPedido}/manifiesto.txt`;
    const body = Buffer.from(texto, 'utf8');
    const { error } = await client.storage.from(BUCKET).upload(path, body, {
      contentType: 'text/plain; charset=utf-8',
      upsert: true,
    });
    if (error) {
      this.logger.warn(`Storage manifiesto ${path}: ${error.message}`);
    }
  }

  /**
   * Convierte cada entrada en URL pública: `https?://` se deja igual;
   * `data:image/...;base64,...` o base64 crudo (jpeg por defecto) se sube a `evidencias/pedidos/{idPedido}/…`.
   */
  async resolverFotosPedido(idPedido: string | number, entradas: string[]): Promise<string[]> {
    const trimmed = entradas.map((e) => e.trim()).filter(Boolean);
    if (!trimmed.length) return [];
    const needsUpload = trimmed.some((s) => !/^https?:\/\//i.test(s));
    if (!needsUpload) return trimmed;

    const client = this.client;
    if (!client) {
      throw new BadRequestException(
        'Hay fotos en base64 pero el servidor no tiene cliente Supabase. ' +
          '1) Cree o edite el archivo `.env` en la raíz del proyecto (mismo directorio que `package.json`). ' +
          '2) Añada SUPABASE_URL=https://<ref>.supabase.co y SUPABASE_SERVICE_ROLE_KEY=<clave service_role> ' +
          '(Supabase → Project Settings → API → *service_role* secret; no use la clave *anon*). ' +
          '3) Reinicie Nest (`npm run start:dev`). ' +
          'Si solo envía URLs https públicas, use `fotosPaqueteUrls` sin base64 y no necesita estas variables.',
      );
    }
    const out: string[] = [];
    for (let i = 0; i < trimmed.length; i++) {
      const raw = trimmed[i]!;
      if (!raw) continue;
      if (/^https?:\/\//i.test(raw)) {
        out.push(raw);
        continue;
      }
      const { buffer, mime } = this.parseImagenBase64(raw, i + 1);
      if (buffer.byteLength > MAX_BYTES_PER_IMAGE) {
        throw new BadRequestException(
          `La foto ${i + 1} supera el máximo de ${MAX_BYTES_PER_IMAGE} bytes tras decodificar.`,
        );
      }
      const ext = extensionFromMime(mime);
      const path = `pedidos/${idPedido}/${i}-${randomUUID()}.${ext}`;
      const { error } = await client.storage.from(BUCKET).upload(path, buffer, {
        contentType: mime,
        upsert: false,
      });
      if (error) {
        this.logger.warn(`Supabase storage.upload: ${error.message}`);
        throw new BadRequestException(`No se pudo subir la foto ${i + 1}: ${error.message}`);
      }
      const { data } = client.storage.from(BUCKET).getPublicUrl(path);
      out.push(data.publicUrl);
    }
    return out;
  }

  private parseImagenBase64(s: string, index: number): { buffer: Buffer; mime: string } {
    const m = s.match(DATA_URL_RE);
    if (m?.[1] && m[2]) {
      const mime = m[1].toLowerCase();
      if (!mime.startsWith('image/')) {
        throw new BadRequestException(`La foto ${index} debe ser una imagen (data URL con image/*).`);
      }
      const b64 = m[2].replace(/\s/g, '');
      const buffer = Buffer.from(b64, 'base64');
      if (!buffer.length) {
        throw new BadRequestException(`Base64 inválido en la foto ${index}.`);
      }
      return { buffer, mime };
    }
    const stripped = s.replace(/^data:[^;]+;base64,/i, '').replace(/\s/g, '');
    const buffer = Buffer.from(stripped, 'base64');
    if (!buffer.length) {
      throw new BadRequestException(
        `La foto ${index} no es una URL http(s) ni un base64 de imagen reconocible.`,
      );
    }
    return { buffer, mime: 'image/jpeg' };
  }
}
