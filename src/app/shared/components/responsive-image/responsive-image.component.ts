import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, HostBinding, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ResponsiveImage } from '../../../services/responsive-image.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-responsive-image',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <img
      [ngSrc]="currentImageSrc"
      [alt]="alt"
      [width]="currentWidth"
      [height]="currentHeight"
      [priority]="isPriority"
      [loading]="!isPriority ? loading : undefined"
      [fill]="false"
      [sizes]="currentSizes"
      (load)="onImageLoad()"
      (error)="onImageError()" />
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transition: opacity 0.3s ease;
      /* Estilos específicos para Safari */
      -webkit-user-select: none;
      -webkit-user-drag: none;
      -webkit-appearance: none;
      /* Asegurar que Safari respete las dimensiones */
      max-width: none;
      max-height: none;
    }
    
    /* Estilos específicos para logos */
    :host.logo img {
      object-fit: contain;
      object-position: center;
      /* Estilos adicionales para logos en Safari */
      -webkit-box-sizing: border-box;
      box-sizing: border-box;
      /* Prevenir que Safari cambie el aspect-ratio */
      aspect-ratio: auto;
    }
    
    /* Estilos específicos para Safari */
    @supports (-webkit-appearance: none) {
      :host.logo img {
        /* Forzar dimensiones en Safari */
        width: 70px !important;
        height: 70px !important;
        /* Asegurar que Safari no aplique estilos por defecto */
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
      }
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

  currentImageSrc: string = '';
  currentWidth: number = 70;
  currentHeight: number = 70;
  currentSizes: string = '';
  isPriority: boolean = false;
  isMobile: boolean = false;
  isTablet: boolean = false;
  isDesktop: boolean = false;
  alt: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupBreakpointObserver();
    this.setupResponsiveImage();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['images'] && changes['images'].currentValue) {
      this.setupResponsiveImage();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupBreakpointObserver() {
    this.breakpointObserver
      .observe([
        Breakpoints.HandsetPortrait,
        Breakpoints.TabletPortrait,
        Breakpoints.WebPortrait
      ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.breakpoints[Breakpoints.HandsetPortrait];
        this.isTablet = result.breakpoints[Breakpoints.TabletPortrait];
        this.isDesktop = result.breakpoints[Breakpoints.WebPortrait];
        
        this.updateImageForBreakpoint();
        this.cdr.detectChanges();
      });
  }

  private updateImageForBreakpoint() {
    if (this.isMobile) {
      this.currentImageSrc = this.images.mobile;
    } else if (this.isTablet) {
      this.currentImageSrc = this.images.tablet;
    } else {
      this.currentImageSrc = this.images.desktop;
    }
  }

  private getDefaultWidth(breakpoint: 'mobile' | 'tablet' | 'desktop'): number {
    switch (breakpoint) {
      case 'mobile': return 768;
      case 'tablet': return 1024;
      case 'desktop': return 1920;
      default: return 800;
    }
  }

  private getDefaultHeight(breakpoint: 'mobile' | 'tablet' | 'desktop'): number {
    switch (breakpoint) {
      case 'mobile': return 1024;
      case 'tablet': return 1365;
      case 'desktop': return 1280;
      default: return 600;
    }
  }

  private setupResponsiveImage() {
    if (!this.images) return;

    this.isPriority = this.images.priority || false;
    this.alt = this.images.alt;
    
    // Establecer dimensiones estáticas basadas en el contexto
    this.setImageDimensions();
    
    // Establecer sizes estático para evitar el error de NgOptimizedImage
    this.currentSizes = '(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw';
    
    // Actualizar solo la fuente de la imagen según el breakpoint
    this.updateImageForBreakpoint();
  }

  private setImageDimensions() {
    switch (this.context) {
      case 'hero':
        this.currentWidth = 1920;
        this.currentHeight = 1280;
        break;
      case 'content':
        this.currentWidth = 800;
        this.currentHeight = 600;
        break;
      case 'thumbnail':
        this.currentWidth = 300;
        this.currentHeight = 200;
        break;
      case 'logo':
        this.currentWidth = 70;
        this.currentHeight = 70;
        break;
      case 'logo-footer':
        this.currentWidth = 120;
        this.currentHeight = 120;
        break;
      case 'tabs':
        this.currentWidth = 570;
        this.currentHeight = 550;
        break;
      default:
        this.currentWidth = 800;
        this.currentHeight = 600;
    }
  }

  onImageLoad() {
    // Imagen cargada exitosamente
    console.log(`✅ Imagen cargada: ${this.currentImageSrc}`);
  }

  onImageError() {
    // Fallback a imagen por defecto
    console.warn(`⚠️ Error cargando imagen: ${this.currentImageSrc}, usando fallback`);
    this.currentImageSrc = this.images.fallback;
    this.cdr.detectChanges();
  }
}
