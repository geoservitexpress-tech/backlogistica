import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

const logger = new Logger('DatabaseModule');

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        if (!url?.trim()) {
          throw new Error(
            'DATABASE_URL no está definida. En Supabase: Project Settings → Database → URI (usa el pooler :6543 para la API).',
          );
        }

        const useDirect =
          config.get<string>('DATABASE_USE_DIRECT_HOST', 'false').toLowerCase() === 'true';
        const usesPooler = url.includes('pooler.supabase.com');

        // Comprobar el host directo solo si la cadena NO es del pooler (evita falsos positivos y
        // errores de `new URL()` cuando la contraseña lleva `@` sin codificar).
        if (!usesPooler && !useDirect) {
          try {
            const normalized = url.replace(/^postgres:\/\//i, 'postgresql://');
            const parsed = new URL(normalized);
            const host = parsed.hostname;

            if (host.startsWith('db.') && host.endsWith('.supabase.co')) {
              throw new Error(
                [
                  'DATABASE_URL apunta al host directo de Supabase (db.*.supabase.co).',
                  'En muchas redes solo hay IPv4 y ese nombre no resuelve → getaddrinfo ENOTFOUND.',
                  '',
                  'Solución: en el dashboard → Connect → Postgres → Session o Transaction pooler,',
                  'copia la URI (debe contener …pooler.supabase.com). Sustituye DATABASE_URL en tu .env.',
                  '',
                  'Si la contraseña tiene @ u otros símbolos, codifícala en la URL (ej. @ → %40).',
                  'Si de verdad tienes IPv6 y quieres el host directo: DATABASE_USE_DIRECT_HOST=true',
                ].join('\n'),
              );
            }
          } catch (e) {
            if (e instanceof Error && e.message.startsWith('DATABASE_URL apunta')) {
              throw e;
            }
            // URL no parseable; TypeORM seguirá con la cadena tal cual
          }
        }

        if (useDirect && url.includes('db.') && url.includes('.supabase.co')) {
          logger.warn(
            'DATABASE_USE_DIRECT_HOST=true: usando host db.*.supabase.co (requiere IPv6 o red compatible).',
          );
        }

        const synchronize = config.get<string>('TYPEORM_SYNC', 'false') === 'true';

        return {
          type: 'postgres' as const,
          url,
          autoLoadEntities: true,
          synchronize,
          ssl:
            config.get<string>('DATABASE_SSL', 'true') !== 'false'
              ? { rejectUnauthorized: false }
              : false,
          // Pooler de Supabase (puerto 6543): desactiva prepared statements en el driver `pg`.
          extra:
            url.includes('pooler.supabase.com') || url.includes(':6543')
              ? { prepareThreshold: 0 }
              : undefined,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
