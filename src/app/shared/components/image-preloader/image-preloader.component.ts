import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-preloader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preload-critical">
      <img 
        *ngFor="let image of criticalImages" 
        [src]="image.src" 
        [alt]="image.alt"
        (load)="onImageLoad(image)"
        (error)="onImageError(image)"
        class="preload-img"
      />
    </div>
  `,
  styles: [`
    .preload-critical {
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
      z-index: -1;
    }
    
    .preload-img {
      width: 1px;
      height: 1px;
      opacity: 0;
    }
  `]
})
export class ImagePreloaderComponent implements OnInit {
  @Input() criticalImages: Array<{src: string, alt: string, loaded: boolean}> = [];

  ngOnInit() {
    // Imágenes críticas que deben precargarse
    this.criticalImages = [
      { src: '/assets/logo.png', alt: 'Logo Start Companies', loaded: false },
      { src: '/assets/hero-bg.jpg', alt: 'Hero Background', loaded: false },
      { src: '/assets/pricing-bg.jpg', alt: 'Pricing Background', loaded: false }
    ];

    // Intentar precargar versiones WebP si están disponibles
    this.preloadWebPVersions();
  }

  private preloadWebPVersions() {
    const webpImages = [
      '/assets/logo.webp',
      '/assets/hero-bg.webp',
      '/assets/pricing-bg.webp'
    ];

    webpImages.forEach(webpSrc => {
      const img = new Image();
      img.onload = () => {
        // WebP disponible, actualizar src de las imágenes críticas
        this.updateCriticalImageSrc(webpSrc);
      };
      img.src = webpSrc;
    });
  }

  private updateCriticalImageSrc(webpSrc: string) {
    const originalSrc = webpSrc.replace('.webp', '.jpg');
    const criticalImage = this.criticalImages.find(img => 
      img.src === originalSrc || img.src === webpSrc.replace('.webp', '.png')
    );
    
    if (criticalImage) {
      criticalImage.src = webpSrc;
    }
  }

  onImageLoad(image: {src: string, alt: string, loaded: boolean}) {
    image.loaded = true;
    console.log(`✅ Imagen precargada: ${image.src}`);
  }

  onImageError(image: {src: string, alt: string, loaded: boolean}) {
    console.warn(`⚠️ Error al precargar imagen: ${image.src}`);
    
    // Fallback a formato original si WebP falla
    if (image.src.endsWith('.webp')) {
      const fallbackSrc = image.src.replace('.webp', '.jpg');
      image.src = fallbackSrc;
      
      // Intentar cargar el fallback
      const img = new Image();
      img.onload = () => {
        image.loaded = true;
        console.log(`✅ Fallback cargado: ${fallbackSrc}`);
      };
      img.src = fallbackSrc;
    }
  }
}
