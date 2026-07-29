import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Security Headers ──────────────────────────────────────────────────────
  app.use(helmet());

  // ─── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ─── Request Size Limits ───────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ─── Global Exception Filter ───────────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ─── Startup ───────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 4000;
  void app.listen(port);
}
bootstrap();
