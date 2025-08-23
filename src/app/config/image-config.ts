// Configuración de imágenes responsive optimizada para LCP
export const IMAGE_CONFIG = {
  "hero": {
    "mobile": "/assets/hero-bg-mobile.webp",
    "tablet": "/assets/hero-bg-tablet.webp",
    "desktop": "/assets/hero-bg.webp",
    "fallback": "/assets/hero-bg.webp",
    "alt": "Hero Background",
    "priority": true, // LCP element
    "mobileWidth": 768,
    "mobileHeight": 1024,
    "tabletWidth": 1024,
    "tabletHeight": 1365,
    "desktopWidth": 1920,
    "desktopHeight": 1280
  },
  "pricing": {
    "mobile": "/assets/pricing-bg-mobile.webp",
    "tablet": "/assets/pricing-bg-tablet.webp",
    "desktop": "/assets/pricing-bg.webp",
    "fallback": "/assets/pricing-bg.webp",
    "alt": "Pricing Background",
    "priority": false,
    "mobileWidth": 768,
    "mobileHeight": 1024,
    "tabletWidth": 1024,
    "tabletHeight": 1365,
    "desktopWidth": 1920,
    "desktopHeight": 1280
  },
  "logo": {
    "mobile": "/assets/logo-mobile.webp",
    "tablet": "/assets/logo-tablet.webp",
    "desktop": "/assets/logo.webp",
    "fallback": "/assets/logo.webp",
    "alt": "Start Companies Logo",
    "priority": true, // Critical for above-the-fold
    "mobileWidth": 60,
    "mobileHeight": 60,
    "tabletWidth": 70,
    "tabletHeight": 70,
    "desktopWidth": 70,
    "desktopHeight": 70
  }
};

export interface ImageConfig {
  mobile: string;
  tablet: string;
  desktop: string;
  fallback: string;
  alt: string;
  priority: boolean;
  mobileWidth: number;
  mobileHeight: number;
  tabletWidth: number;
  tabletHeight: number;
  desktopWidth: number;
  desktopHeight: number;
}
