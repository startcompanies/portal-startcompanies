import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResponsiveImageService, ResponsiveImage } from '../../../services/responsive-image.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-responsive-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <picture>
      <!-- WebP sources con srcset responsive -->
      <source 
        [srcset]="webpSrcSet" 
        type="image/webp"
        [sizes]="sizes">
      
      <!-- JPEG sources con srcset responsive -->
      <source 
        [srcset]="jpegSrcSet" 
        type="image/jpeg"
        [sizes]="sizes">
      
      <!-- Imagen principal con fallback -->
      <img 
        [src]="fallbackSrc" 
        [alt]="alt"
        [loading]="loading"
        [class]="cssClass"
        (load)="onImageLoad()"
        (error)="onImageError()">
    </picture>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.3s ease;
    }
    
    img.loading {
      opacity: 0.7;
    }
    
    img.loaded {
      opacity: 1;
    }
  `]
})
export class ResponsiveImageComponent implements OnInit, OnDestroy {
  @Input() images!: ResponsiveImage;
  @Input() context: 'hero' | 'content' | 'thumbnail' = 'content';
  @Input() loading: 'lazy' | 'eager' = 'lazy';
  @Input() cssClass: string = '';

  webpSrcSet: string = '';
  jpegSrcSet: string = '';
  sizes: string = '';
  fallbackSrc: string = '';
  alt: string = '';

  private subscription = new Subscription();

  constructor(private responsiveImageService: ResponsiveImageService) {}

  ngOnInit() {
    if (this.images) {
      this.setupResponsiveImage();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private setupResponsiveImage() {
    // Configurar srcset para WebP
    this.webpSrcSet = this.responsiveImageService.getSrcSet({
      mobile: this.images.mobile.replace('.jpg', '.webp').replace('.png', '.webp'),
      tablet: this.images.tablet.replace('.jpg', '.webp').replace('.png', '.webp'),
      desktop: this.images.desktop.replace('.jpg', '.webp').replace('.png', '.webp'),
      fallback: this.images.fallback,
      alt: this.images.alt
    });

    // Configurar srcset para JPEG/PNG
    this.jpegSrcSet = this.responsiveImageService.getSrcSet(this.images);

    // Configurar sizes según el contexto
    this.sizes = this.responsiveImageService.getSizes(this.context);

    // Configurar fallback
    this.fallbackSrc = this.images.fallback;
    this.alt = this.images.alt;

    // DEBUG: Log para verificar qué se está configurando
    console.log('🔍 DEBUG ResponsiveImage:', {
      context: this.context,
      webpSrcSet: this.webpSrcSet,
      jpegSrcSet: this.jpegSrcSet,
      sizes: this.sizes,
      fallback: this.fallbackSrc
    });
  }

  onImageLoad() {
    // La imagen se cargó exitosamente
    console.log(`✅ Imagen cargada: ${this.alt}`);
    
    // DEBUG: Verificar qué imagen se cargó realmente
    const imgElement = event?.target as HTMLImageElement;
    if (imgElement) {
      console.log('🔍 DEBUG Imagen cargada:', {
        src: imgElement.src,
        naturalWidth: imgElement.naturalWidth,
        naturalHeight: imgElement.naturalHeight,
        offsetWidth: imgElement.offsetWidth,
        offsetHeight: imgElement.offsetHeight,
        alt: imgElement.alt
      });
    }
  }

  onImageError() {
    // Fallback en caso de error
    console.warn(`⚠️ Error cargando imagen: ${this.alt}, usando fallback`);
  }
}
