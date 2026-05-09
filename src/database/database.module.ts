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

        try {
          const parsed = new URL(url.replace(/^postgres:\/\//i, 'postgresql://'));
          const host = parsed.hostname;
          if (host.startsWith('db.') && host.endsWith('.supabase.co')) {
            logger.warn(
              'DATABASE_URL usa el host directo db.*.supabase.co (suele ser solo IPv6). ' +
                'Si ves ENOTFOUND o no conecta, cambia a la URI del pooler en Supabase → Connect (Session o Transaction, host …pooler.supabase.com).',
            );
          }
        } catch {
          // URL no parseable; TypeORM seguirá intentando con la cadena tal cual
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
