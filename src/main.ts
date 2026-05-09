import './preload';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Application } from 'express';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger/setup-swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  setupSwagger(app);

  const expressApp = app.getHttpAdapter().getInstance() as Application;
  expressApp.get('/doc', (_req, res) => {
    res.redirect(301, '/docs');
  });
  expressApp.get('/swagger', (_req, res) => {
    res.redirect(301, '/docs');
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
