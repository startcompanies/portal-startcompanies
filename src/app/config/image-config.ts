// Configuración de imágenes responsive generada automáticamente
export const IMAGE_CONFIG = {
  "hero": {
    "mobile": "/assets/hero-bg-mobile.webp",
    "tablet": "/assets/hero-bg-tablet.webp",
    "desktop": "/assets/hero-bg.webp",
    "fallback": "/assets/hero-bg.webp",
    "alt": "Hero Background"
  },
  "pricing": {
    "mobile": "/assets/pricing-bg-mobile.webp",
    "tablet": "/assets/pricing-bg-tablet.webp",
    "desktop": "/assets/pricing-bg.webp",
    "fallback": "/assets/pricing-bg.webp",
    "alt": "Pricing Background"
  },
  "logo": {
    "mobile": "/assets/logo-mobile.webp",
    "tablet": "/assets/logo-tablet.webp",
    "desktop": "/assets/logo.webp",
    "fallback": "/assets/logo.webp",
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
