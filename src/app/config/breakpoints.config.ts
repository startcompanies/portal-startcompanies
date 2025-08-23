import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

// Configuración de breakpoints optimizada para LCP y performance
export const BREAKPOINT_CONFIG = {
  // Breakpoints para dispositivos móviles (prioridad alta para LCP)
  MOBILE: {
    maxWidth: 768,
    sizes: '(max-width: 768px) 100vw',
    priority: 'high'
  },
  
  // Breakpoints para tablets (prioridad media)
  TABLET: {
    maxWidth: 1024,
    sizes: '(max-width: 1024px) 100vw',
    priority: 'medium'
  },
  
  // Breakpoints para desktop (prioridad baja, lazy loading)
  DESKTOP: {
    minWidth: 1025,
    sizes: '100vw',
    priority: 'low'
  }
};

// Configuración de breakpoints para Angular CDK
export const CDK_BREAKPOINTS = [
  Breakpoints.HandsetPortrait,      // Mobile portrait
  Breakpoints.HandsetLandscape,     // Mobile landscape
  Breakpoints.TabletPortrait,       // Tablet portrait
  Breakpoints.TabletLandscape,      // Tablet landscape
  Breakpoints.WebPortrait,          // Desktop portrait
  Breakpoints.WebLandscape          // Desktop landscape
];

// Configuración de breakpoints personalizados para imágenes
export const IMAGE_BREAKPOINTS = {
  // Hero images (LCP elements)
  HERO: {
    mobile: { width: 768, height: 1024, quality: 85 },
    tablet: { width: 1024, height: 1365, quality: 85 },
    desktop: { width: 1920, height: 1280, quality: 85 }
  },
  
  // Logo images (above-the-fold)
  LOGO: {
    mobile: { width: 60, height: 60, quality: 90 },
    tablet: { width: 70, height: 70, quality: 90 },
    desktop: { width: 70, height: 70, quality: 90 }
  },
  
  // Content images (lazy loading)
  CONTENT: {
    mobile: { width: 768, height: 1024, quality: 80 },
    tablet: { width: 1024, height: 1365, quality: 80 },
    desktop: { width: 1920, height: 1280, quality: 80 }
  },
  
  // Thumbnail images
  THUMBNAIL: {
    mobile: { width: 300, height: 200, quality: 75 },
    tablet: { width: 400, height: 267, quality: 75 },
    desktop: { width: 500, height: 333, quality: 75 }
  }
};

// Utilidades para breakpoints
export class BreakpointUtils {
  static isMobile(breakpointObserver: BreakpointObserver): boolean {
    return breakpointObserver.isMatched(Breakpoints.HandsetPortrait);
  }
  
  static isTablet(breakpointObserver: BreakpointObserver): boolean {
    return breakpointObserver.isMatched(Breakpoints.TabletPortrait);
  }
  
  static isDesktop(breakpointObserver: BreakpointObserver): boolean {
    return breakpointObserver.isMatched(Breakpoints.WebPortrait);
  }
  
  static getImageSizes(breakpointObserver: BreakpointObserver): string {
    if (this.isMobile(breakpointObserver)) {
      return BREAKPOINT_CONFIG.MOBILE.sizes;
    } else if (this.isTablet(breakpointObserver)) {
      return BREAKPOINT_CONFIG.TABLET.sizes;
    } else {
      return BREAKPOINT_CONFIG.DESKTOP.sizes;
    }
  }
  
  static getImageDimensions(breakpointObserver: BreakpointObserver, type: keyof typeof IMAGE_BREAKPOINTS) {
    if (this.isMobile(breakpointObserver)) {
      return IMAGE_BREAKPOINTS[type].mobile;
    } else if (this.isTablet(breakpointObserver)) {
      return IMAGE_BREAKPOINTS[type].tablet;
    } else {
      return IMAGE_BREAKPOINTS[type].desktop;
    }
  }
}
