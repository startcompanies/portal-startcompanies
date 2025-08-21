import { Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponsiveImage {
  mobile: string;
  tablet: string;
  desktop: string;
  fallback: string;
  alt: string;
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

@Injectable({
  providedIn: 'root'
})
export class ResponsiveImageService {
  constructor(private breakpointObserver: BreakpointObserver) {}

  /**
   * Detecta si el dispositivo es móvil
   */
  isMobile(): Observable<boolean> {
    return this.breakpointObserver.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).pipe(map(result => result.matches));
  }

  /**
   * Detecta si el dispositivo es tablet
   */
  isTablet(): Observable<boolean> {
    return this.breakpointObserver.observe([
      Breakpoints.TabletPortrait,
      Breakpoints.TabletLandscape
    ]).pipe(map(result => result.matches));
  }

  /**
   * Detecta si el dispositivo es desktop
   */
  isDesktop(): Observable<boolean> {
    return this.breakpointObserver.observe([
      Breakpoints.Web
    ]).pipe(map(result => result.matches));
  }

  /**
   * Obtiene el tipo de dispositivo actual
   */
  getDeviceType(): Observable<DeviceType> {
    return this.breakpointObserver.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape,
      Breakpoints.TabletPortrait,
      Breakpoints.TabletLandscape,
      Breakpoints.Web
    ]).pipe(
      map(result => {
        if (result.breakpoints[Breakpoints.HandsetPortrait] || 
            result.breakpoints[Breakpoints.HandsetLandscape]) {
          return 'mobile';
        }
        if (result.breakpoints[Breakpoints.TabletPortrait] || 
            result.breakpoints[Breakpoints.TabletLandscape]) {
          return 'tablet';
        }
        return 'desktop';
      })
    );
  }

  /**
   * Obtiene la URL de imagen óptima para el dispositivo actual
   */
  getOptimalImageUrl(images: ResponsiveImage): Observable<string> {
    return this.getDeviceType().pipe(
      map(deviceType => {
        switch (deviceType) {
          case 'mobile':
            return images.mobile;
          case 'tablet':
            return images.tablet;
          case 'desktop':
            return images.desktop;
          default:
            return images.desktop;
        }
      })
    );
  }

  /**
   * Obtiene el srcset completo para una imagen
   */
  getSrcSet(images: ResponsiveImage): string {
    return `${images.mobile} 768w, ${images.tablet} 1024w, ${images.desktop} 1920w`;
  }

  /**
   * Obtiene el sizes apropiado para el contexto
   */
  getSizes(context: 'hero' | 'content' | 'thumbnail' = 'content'): string {
    switch (context) {
      case 'hero':
        return '(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw';
      case 'content':
        return '(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw';
      case 'thumbnail':
        return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 300px';
      default:
        return '(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw';
    }
  }
}
