import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import { csrfMiddleware } from './common/middleware/csrf.middleware';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<import('@nestjs/platform-express').NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1');
  
  // Trust proxy is required for express-rate-limit when hosted on platforms like Render/Vercel
  app.set('trust proxy', 1);

  // ─── Security Headers ──────────────────────────────────────────────────────
  const isProd = process.env.NODE_ENV === 'production';

  app.use(
    helmet({
      // Content Security Policy — API only serves JSON, no HTML content.
      // Blocks any accidental browser rendering of API responses.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          scriptSrc: ["'none'"],
          styleSrc: ["'none'"],
          imgSrc: ["'none'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      // HTTP Strict Transport Security — 1 year, include subdomains in production
      hsts: isProd
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      // Disable X-Powered-By (already off by default in NestJS, belt+suspenders)
      hidePoweredBy: true,
      // Prevent MIME type sniffing
      noSniff: true,
      // Prevent clickjacking
      frameguard: { action: 'deny' },
      // Cross-Origin Resource Policy
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // Disable browser DNS prefetching
      dnsPrefetchControl: { allow: false },
      // Referrer leakage control
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // XSS filter (legacy browsers)
      xssFilter: true,
    }),
  );

  // ─── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = (process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000']).map(o => o.trim().replace(/\/$/, ''));
      const cleanOrigin = origin ? origin.trim().replace(/\/$/, '') : '';
      if (!origin || origin.startsWith('chrome-extension://') || allowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.use(cookieParser());
  app.use(csrfMiddleware);

  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  const { rateLimit } = require('express-rate-limit');
  const ttl = parseInt(process.env.RATE_LIMIT_TTL || '60', 10);
  const limit = parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10);
  
  app.use(
    rateLimit({
      windowMs: ttl * 1000,
      max: limit,
      standardHeaders: true,
      legacyHeaders: false,
      message: { statusCode: 429, message: 'Too many requests, please try again later.' },
    })
  );

  // ─── Request Size Limits ───────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ─── Validation & Exception Filter ──────────────────────────────────────────
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
