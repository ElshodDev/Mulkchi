import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly isProduction = environment.production;
  private readonly minLevel = this.isProduction ? LogLevel.ERROR : LogLevel.DEBUG;

  debug(message: string, ...data: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...data);
  }

  info(message: string, ...data: unknown[]): void {
    this.log(LogLevel.INFO, message, ...data);
  }

  warn(message: string, ...data: unknown[]): void {
    this.log(LogLevel.WARN, message, ...data);
  }

  error(message: string, ...data: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...data);
  }

  private log(level: LogLevel, message: string, ...data: unknown[]): void {
    if (level < this.minLevel) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${LogLevel[level]}]`;

    // In production, send to external logging service (e.g., Sentry)
    if (this.isProduction && level >= LogLevel.ERROR) {
      // Note: External logging integration (e.g., Sentry) should be configured in main.ts
    }

    // Development: safe logging (no sensitive data)
    if (!this.isProduction) {
      const sanitizedData = data.map((d) => this.sanitizeForLogging(d));

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(prefix, message, ...sanitizedData);
          break;
        case LogLevel.INFO:
          console.info(prefix, message, ...sanitizedData);
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, ...sanitizedData);
          break;
        case LogLevel.ERROR:
          console.error(prefix, message, ...sanitizedData);
          break;
      }
    }
  }

  private sanitizeForLogging(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) return data;

    const sensitiveKeys = [
      'token',
      'password',
      'secret',
      'authorization',
      'accessToken',
      'refreshToken',
    ];
    const sanitized = { ...(data as object) };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        (sanitized as Record<string, unknown>)[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
