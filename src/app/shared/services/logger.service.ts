import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Servicio de logging centralizado.
 * En producción suprime los mensajes debug/info para reducir ruido en la consola.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly isProd = environment.production;

  log(message: string, ...args: any[]): void {
    if (!this.isProd) {
      console.log(message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(message, ...args);
  }
}
