import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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
