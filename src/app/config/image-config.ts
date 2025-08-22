// Configuración de imágenes responsive generada automáticamente
export const IMAGE_CONFIG = {
  "hero": {
    "mobile": "/assets/hero-bg-mobile.webp",
    "tablet": "/assets/hero-bg-tablet.webp",
    "desktop": "/assets/hero-bg.webp",
    "fallback": "/assets/hero-bg.webp",
    "alt": "Hero Background",
    "mobileWidth": 768,
    "mobileHeight": 512, // 768 / 1.50 = 512
    "tabletWidth": 1024,
    "tabletHeight": 683, // 1024 / 1.50 = 683
    "desktopWidth": 1920,
    "desktopHeight": 1280, // 1920 / 1.50 = 1280
    "priority": true // Solo el hero es LCP element
  },
  "pricing": {
    "mobile": "/assets/pricing-bg-mobile.webp",
    "tablet": "/assets/pricing-bg-tablet.webp",
    "desktop": "/assets/pricing-bg.webp",
    "fallback": "/assets/pricing-bg.webp",
    "alt": "Pricing Background",
    "mobileWidth": 768,
    "mobileHeight": 512, // 768 / 1.50 = 512
    "tabletWidth": 1024,
    "tabletHeight": 683, // 1024 / 1.50 = 683
    "desktopWidth": 1920,
    "desktopHeight": 1280, // 1920 / 1.50 = 1280
    "priority": false // Pricing NO es LCP element
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
    "desktopHeight": 90,
    "priority": false // Logo NO es LCP element
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
  priority?: boolean;
}
