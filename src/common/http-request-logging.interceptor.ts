import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

type RequestWithResolvedStatus = Request & { resolvedHttpStatus?: number };

/**
 * Registra cada petición HTTP: en error incluye mensaje y stack (Nest Logger → stdout en prod).
 * Guarda el código HTTP real cuando la cadena falla con HttpException (res.statusCode puede ir tarde).
 */
@Injectable()
export class HttpRequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithResolvedStatus>();
    const res = http.getResponse<Response>();
    const started = Date.now();
    const method = req.method;
    const path = req.originalUrl ?? req.url;

    return next.handle().pipe(
      catchError((err: unknown) => {
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (err instanceof HttpException) {
          status = err.getStatus();
        }
        req.resolvedHttpStatus = status;
        const msg = err instanceof Error ? err.message : String(err);
        const detail =
          err instanceof HttpException
            ? JSON.stringify(err.getResponse())
            : undefined;
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(
          `${method} ${path} → ${status} ${msg}${detail ? ` ${detail}` : ''}`,
          stack,
        );
        return throwError(() => err);
      }),
      finalize(() => {
        const ms = Date.now() - started;
        const status = req.resolvedHttpStatus ?? res.statusCode;
        const line = `${method} ${path} ${status} ${ms}ms`;
        if (status >= 500) {
          this.logger.error(line);
        } else if (status >= 400) {
          this.logger.warn(line);
        } else {
          this.logger.log(line);
        }
      }),
    );
  }
}
