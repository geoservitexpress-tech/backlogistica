import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ExampleModule } from './modules/example/example.module';
import { HealthModule } from './modules/health/health.module';
import { LogisticaModule } from './modules/logistica/logistica.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    LogisticaModule,
    ExampleModule,
  ],
})
export class AppModule {}
