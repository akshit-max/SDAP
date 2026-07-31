import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import { csrfMiddleware } from './common/middleware/csrf.middleware';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  // ─── Security Headers ──────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cookieParser());
  app.use(csrfMiddleware);

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

  // ─── Swagger ───────────────────────────────────────────────────────────────
  const isProduction = process.env.NODE_ENV === 'production';
  const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true';

  if (!isProduction || swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('SDAP API')
      .setDescription('Secure Delegation & Approval Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // ─── Startup ───────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 4000;
  void app.listen(port);
}
bootstrap();
