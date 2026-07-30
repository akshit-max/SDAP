import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * RequestIdMiddleware
 *
 * Assigns a unique request ID to every inbound HTTP request.
 * The ID is:
 *   - Echoed back in the X-Request-Id response header
 *   - Available on req.requestId for downstream logging
 *
 * Usage:
 *   consumer.apply(RequestIdMiddleware).forRoutes('*');
 *
 * This enables cross-service request correlation when Sentry
 * captures exceptions — every error report carries the same
 * request ID that appears in the server logs.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request & { requestId?: string }, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      // Structured log line — parseable by log aggregators (Datadog, CloudWatch, etc.)
      this.logger.log(
        JSON.stringify({
          requestId,
          method,
          path: originalUrl,
          status: statusCode,
          durationMs: duration,
        }),
      );
    });

    next();
  }
}
