import { Component, Input, OnInit, OnDestroy, HostBinding, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { ResponsiveImageService, ResponsiveImage } from '../../../services/responsive-image.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-responsive-image',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <img
      [ngSrc]="fallbackSrc"
      [alt]="alt"
      [width]="imageWidth"
      [height]="imageHeight"
      [priority]="isPriority"
      [loading]="!isPriority ? loading : undefined"
      (load)="onImageLoad()"
      (error)="onImageError()" />
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      /*min-height: 100%;*/
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transition: opacity 0.3s ease;
    }
    
    /* Estilos específicos para logos */
    :host.logo img {
      object-fit: contain;
      object-position: center;
    }
    
    img.loading {
      opacity: 0.7;
    }
    
    img.loaded {
      opacity: 1;
    }
  `]
})
export class ResponsiveImageComponent implements OnInit, OnDestroy, OnChanges {
  @Input() images!: ResponsiveImage;
  @Input() context: 'hero' | 'content' | 'thumbnail' | 'logo' | 'logo-footer' | 'tabs' = 'logo';
  @Input() loading: 'lazy' | 'eager' = 'lazy';
  @Input() cssClass: string = '';

  @HostBinding('class') get hostClass() {
    return this.cssClass;
  }

  fallbackSrc: string = '';
  alt: string = '';
  imageWidth: number = 0;
  imageHeight: number = 0;
  isPriority: boolean = false;

  private subscription = new Subscription();

  constructor(private responsiveImageService: ResponsiveImageService) {}

  ngOnInit() {
    if (this.images) {
      this.setupResponsiveImage();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['images'] && changes['images'].currentValue) {
      this.setupResponsiveImage();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private setupResponsiveImage() {
    // Configurar fallback
    this.fallbackSrc = this.images.fallback;
    this.alt = this.images.alt;

    // Configurar dimensiones y prioridad según la configuración de la imagen
    this.setImageDimensions();
  }

  private setImageDimensions() {
    // Usar la configuración de prioridad de la imagen
    this.isPriority = this.images.priority || false;
    
    // Configurar dimensiones apropiadas para evitar advertencias NG0913
    // Las imágenes reales tienen aspect ratio 1.50 (4096x2731)
    switch (this.context) {
      case 'hero':
        this.imageWidth = 1920;
        this.imageHeight = 1080; // Aspect ratio 16:9 para hero
        break;
      case 'content':
        this.imageWidth = 800;
        this.imageHeight = 600; // Aspect ratio 4:3 para content
        break;
      case 'thumbnail':
        this.imageWidth = 300;
        this.imageHeight = 200; // Aspect ratio 3:2 para thumbnail
        break;
      case 'logo':
        this.imageWidth = 70;
        this.imageHeight = 70; // Aspect ratio 1:1 (cuadrado) para logos de headers, tamaño real de renderizado
        break;
      case 'logo-footer':
        this.imageWidth = 120;
        this.imageHeight = 120; // Aspect ratio 1:1 (cuadrado) para logos de footer, tamaño real de renderizado
        break;
      case 'tabs':
        this.imageWidth = 570;
        this.imageHeight = 550; // Dimensiones específicas para tabs en laptop
        break;
      default:
        this.imageWidth = 800;
        this.imageHeight = 600; // Aspect ratio 4:3 por defecto
    }
  }

  onImageLoad() {
    // Imagen cargada exitosamente
  }

  onImageError() {
    // Fallback en caso de error
  }
}
