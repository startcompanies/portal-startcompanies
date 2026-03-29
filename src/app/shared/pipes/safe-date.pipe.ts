import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

/**
 * Igual que DatePipe pero sin lanzar NG02100 si el valor es null, vacío o fecha inválida
 * (p. ej. new Date(undefined), string "Invalid Date").
 */
@Pipe({
  name: 'safeDate',
  standalone: true,
})
export class SafeDatePipe implements PipeTransform {
  private readonly datePipe: DatePipe;

  constructor(@Inject(LOCALE_ID) locale: string) {
    this.datePipe = new DatePipe(locale);
  }

  transform(value: unknown, format = 'short', timezone?: string, locale?: string): string {
    const d = this.toValidDate(value);
    if (!d) {
      return '—';
    }
    return this.datePipe.transform(d, format, timezone, locale) ?? '—';
  }

  private toValidDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'string') {
      const t = value.trim();
      if (t === '' || /^invalid date$/i.test(t)) {
        return null;
      }
    }
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    const d = new Date(value as string | number);
    return isNaN(d.getTime()) ? null : d;
  }
}
