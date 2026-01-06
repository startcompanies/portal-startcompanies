import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
   * Obtiene el código de país basado en la IP del usuario
   * Usa ipapi.co como servicio de geolocalización
   * @returns Observable con el código de país (ej: 'us', 'mx', 'co')
   */
  getCountryCodeByIP(): Observable<string> {
    // Si ya tenemos el código en caché, lo retornamos
    if (this.cachedCountryCode) {
      return of(this.cachedCountryCode.toLowerCase());
    }

    // Usamos ipapi.co que es gratuito y no requiere API key
    return this.http.get<any>('https://ipapi.co/json/').pipe(
      map((data: any) => {
        const countryCode = data.country_code?.toLowerCase() || 'us';
        // Guardamos en caché para futuras llamadas
        this.cachedCountryCode = countryCode;
        return countryCode;
      }),
      catchError((error) => {
        console.warn('Error al obtener geolocalización por IP, usando "us" por defecto:', error);
        // En caso de error, retornamos 'us' como país por defecto
        return of('us');
      })
    );
  }

  /**
   * Obtiene información completa de geolocalización
   * @returns Observable con datos de geolocalización
   */
  getGeolocationData(): Observable<GeolocationData> {
    return this.http.get<any>('https://ipapi.co/json/').pipe(
      map((data: any) => ({
        countryCode: data.country_code?.toLowerCase() || 'us',
        countryName: data.country_name || 'United States'
      })),
      catchError((error) => {
        console.warn('Error al obtener geolocalización:', error);
        return of({
          countryCode: 'us',
          countryName: 'United States'
        });
      })
    );
  }

  /**
   * Limpia la caché del código de país
   */
  clearCache(): void {
    this.cachedCountryCode = null;
  }
}

