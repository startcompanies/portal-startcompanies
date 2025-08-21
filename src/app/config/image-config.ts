// Configuración de imágenes responsive generada automáticamente
export const IMAGE_CONFIG = {
  "hero": {
    "mobile": "/assets/hero-bg-mobile.jpg",
    "tablet": "/assets/hero-bg-tablet.jpg",
    "desktop": "/assets/hero-bg.jpg",
    "fallback": "/assets/hero-bg.jpg",
    "alt": "Hero Background"
  },
  "pricing": {
    "mobile": "/assets/pricing-bg-mobile.jpg",
    "tablet": "/assets/pricing-bg-tablet.jpg",
    "desktop": "/assets/pricing-bg.jpg",
    "fallback": "/assets/pricing-bg.jpg",
    "alt": "Pricing Background"
  },
  "logo": {
    "mobile": "/assets/logo-mobile.png",
    "tablet": "/assets/logo-tablet.png",
    "desktop": "/assets/logo.png",
    "fallback": "/assets/logo.png",
    "alt": "Start Companies Logo"
  }
};

export interface ImageConfig {
  mobile: string;
  tablet: string;
  desktop: string;
  fallback: string;
  alt: string;
}
