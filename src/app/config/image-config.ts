// Configuración de imágenes responsive generada automáticamente
export const IMAGE_CONFIG = {
  "hero": {
    "mobile": "/assets/hero-bg-mobile.jpg",
    "tablet": "/assets/hero-bg-tablet.jpg",
    "desktop": "/assets/hero-bg.jpg",
    "fallback": "/assets/hero-bg.jpg",
    "alt": "Hero Background",
    "mobileWidth": 768,
    "mobileHeight": 432,
    "tabletWidth": 1024,
    "tabletHeight": 576,
    "desktopWidth": 1920,
    "desktopHeight": 1080
  },
  "pricing": {
    "mobile": "/assets/pricing-bg-mobile.jpg",
    "tablet": "/assets/pricing-bg-tablet.jpg",
    "desktop": "/assets/pricing-bg.jpg",
    "fallback": "/assets/pricing-bg.jpg",
    "alt": "Pricing Background",
    "mobileWidth": 768,
    "mobileHeight": 432,
    "tabletWidth": 1024,
    "tabletHeight": 576,
    "desktopWidth": 1920,
    "desktopHeight": 1080
  },
  "logo": {
    "mobile": "/assets/logo-mobile.png",
    "tablet": "/assets/logo-tablet.png",
    "desktop": "/assets/logo.png",
    "fallback": "/assets/logo.png",
    "alt": "Start Companies Logo",
    "mobileWidth": 200,
    "mobileHeight": 60,
    "tabletWidth": 250,
    "tabletHeight": 75,
    "desktopWidth": 300,
    "desktopHeight": 90
  }
};

export interface ImageConfig {
  mobile: string;
  tablet: string;
  desktop: string;
  fallback: string;
  alt: string;
  mobileWidth?: number;
  mobileHeight?: number;
  tabletWidth?: number;
  tabletHeight?: number;
  desktopWidth?: number;
  desktopHeight?: number;
}
