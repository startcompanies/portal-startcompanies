import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface GeolocationData {
  countryCode: string;
  countryName: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private cachedCountryCode: string | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Código de país por IP vía API propia (Nest → ipapi), evita CORS del navegador a terceros.
   */
  getCountryCodeByIP(): Observable<string> {
    if (this.cachedCountryCode) {
      return of(this.cachedCountryCode.toLowerCase());
    }

    const url = `${environment.apiUrl.replace(/\/$/, '')}/wizard/geo/country`;
    return this.http.get<{ countryCode?: string }>(url).pipe(
      map((data) => (data?.countryCode || 'us').toLowerCase()),
      tap((code) => {
        this.cachedCountryCode = code;
      }),
      catchError(() => of('us'))
    );
  }

  /**
   * Obtiene información completa de geolocalización
   * @returns Observable con datos de geolocalización
   */
  getGeolocationData(): Observable<GeolocationData> {
    const url = `${environment.apiUrl.replace(/\/$/, '')}/wizard/geo/country`;
    return this.http.get<{ countryCode?: string; countryName?: string }>(url).pipe(
      map((data) => ({
        countryCode: (data?.countryCode || 'us').toLowerCase(),
        countryName: data?.countryName || 'United States'
      })),
      catchError(() =>
        of({
          countryCode: 'us',
          countryName: 'United States'
        })
      )
    );
  }

  /**
   * Limpia la caché del código de país
   */
  clearCache(): void {
    this.cachedCountryCode = null;
  }
}

