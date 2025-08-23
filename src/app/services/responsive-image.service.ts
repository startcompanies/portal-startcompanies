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
  priority: boolean;
  mobileWidth?: number;
  mobileHeight?: number;
  tabletWidth?: number;
  tabletHeight?: number;
  desktopWidth?: number;
  desktopHeight?: number;
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
   * Obtiene el srcset completo para una imagen con dimensiones específicas
   */
  getSrcSet(images: ResponsiveImage): string {
    const mobileWidth = images.mobileWidth || 768;
    const tabletWidth = images.tabletWidth || 1024;
    const desktopWidth = images.desktopWidth || 1920;
    
    return `${images.mobile} ${mobileWidth}w, ${images.tablet} ${tabletWidth}w, ${images.desktop} ${desktopWidth}w`;
  }

  /**
   * Obtiene el sizes apropiado para el contexto con dimensiones más específicas
   */
  getSizes(context: 'hero' | 'content' | 'thumbnail' | 'logo' = 'content'): string {
    switch (context) {
      case 'hero':
        return '(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw';
      case 'content':
        return '(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw';
      case 'thumbnail':
        return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 300px';
      case 'logo':
        return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 300px';
      default:
        return '(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw';
    }
  }

  /**
   * Obtiene las dimensiones óptimas para el dispositivo actual
   */
  getOptimalDimensions(images: ResponsiveImage): Observable<{width: number, height: number}> {
    return this.getDeviceType().pipe(
      map(deviceType => {
        switch (deviceType) {
          case 'mobile':
            return {
              width: images.mobileWidth || 768,
              height: images.mobileHeight || 576
            };
          case 'tablet':
            return {
              width: images.tabletWidth || 1024,
              height: images.tabletHeight || 768
            };
          case 'desktop':
            return {
              width: images.desktopWidth || 1920,
              height: images.desktopHeight || 1080
            };
          default:
            return {
              width: images.desktopWidth || 1920,
              height: images.desktopHeight || 1080
            };
        }
      })
    );
  }

  // Método para crear configuración de imagen optimizada para LCP
  static createOptimizedImage(
    mobile: string,
    tablet: string,
    desktop: string,
    fallback: string,
    alt: string,
    priority: boolean = false,
    mobileWidth: number = 0,
    mobileHeight: number = 0,
    tabletWidth: number = 0,
    tabletHeight: number = 0,
    desktopWidth: number = 0,
    desktopHeight: number = 0
  ): ResponsiveImage {
    return {
      mobile,
      tablet,
      desktop,
      fallback,
      alt,
      priority,
      mobileWidth,
      mobileHeight,
      tabletWidth,
      tabletHeight,
      desktopWidth,
      desktopHeight
    };
  }

  // Método para crear imagen hero (LCP element)
  static createHeroImage(
    mobile: string,
    tablet: string,
    desktop: string,
    fallback: string,
    alt: string
  ): ResponsiveImage {
    return this.createOptimizedImage(
      mobile, tablet, desktop, fallback, alt,
      true, // priority = true para LCP
      768, 1024, // mobile dimensions
      1024, 1365, // tablet dimensions
      1920, 1280 // desktop dimensions
    );
  }

  // Método para crear logo (above-the-fold)
  static createLogoImage(
    mobile: string,
    tablet: string,
    desktop: string,
    fallback: string,
    alt: string
  ): ResponsiveImage {
    return this.createOptimizedImage(
      mobile, tablet, desktop, fallback, alt,
      true, // priority = true para above-the-fold
      60, 60, // mobile dimensions
      70, 70, // tablet dimensions
      70, 70 // desktop dimensions
    );
  }

  // Método para crear imagen de contenido (lazy loading)
  static createContentImage(
    mobile: string,
    tablet: string,
    desktop: string,
    fallback: string,
    alt: string
  ): ResponsiveImage {
    return this.createOptimizedImage(
      mobile, tablet, desktop, fallback, alt,
      false, // priority = false para lazy loading
      768, 1024, // mobile dimensions
      1024, 1365, // tablet dimensions
      1920, 1280 // desktop dimensions
    );
  }
}
