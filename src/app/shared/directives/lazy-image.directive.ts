import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appLazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit {
  @Input() appLazyImage: string = '';
  @Input() fallback: string = '';
  @Input() alt: string = '';
  @Input() loading: 'lazy' | 'eager' = 'lazy';

  private img: HTMLImageElement;
  private observer: IntersectionObserver | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    this.img = this.el.nativeElement;
  }

  ngOnInit() {
    if (this.loading === 'eager') {
      this.loadImage();
    } else {
      this.setupLazyLoading();
    }
  }

  private setupLazyLoading() {
    // Configurar Intersection Observer para lazy loading
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
            this.observer?.unobserve(this.img);
          }
        });
      },
      {
        rootMargin: '50px 0px', // Cargar 50px antes de que sea visible
        threshold: 0.01
      }
    );

    this.observer.observe(this.img);
  }

  private loadImage() {
    // Verificar si el navegador soporta WebP
    const supportsWebP = this.checkWebPSupport();
    
    // Crear imagen temporal para precargar
    const tempImg = new Image();
    
    tempImg.onload = () => {
      // Imagen cargada exitosamente
      this.renderer.setAttribute(this.img, 'src', tempImg.src);
      this.renderer.addClass(this.img, 'loaded');
      this.renderer.removeClass(this.img, 'loading');
    };

    tempImg.onerror = () => {
      // Fallback si WebP falla
      if (supportsWebP && this.appLazyImage.endsWith('.webp')) {
        const fallbackUrl = this.appLazyImage.replace('.webp', '.jpg');
        this.renderer.setAttribute(this.img, 'src', fallbackUrl);
      } else if (this.fallback) {
        this.renderer.setAttribute(this.img, 'src', this.fallback);
      }
      this.renderer.addClass(this.img, 'loaded');
      this.renderer.removeClass(this.img, 'loading');
    };

    // Agregar clases CSS para estados
    this.renderer.addClass(this.img, 'loading');
    
    // Establecer atributos
    if (this.alt) {
      this.renderer.setAttribute(this.img, 'alt', this.alt);
    }
    
    // Cargar imagen optimizada
    if (supportsWebP && this.appLazyImage.endsWith('.jpg')) {
      // Intentar cargar WebP primero
      const webpUrl = this.appLazyImage.replace('.jpg', '.webp');
      tempImg.src = webpUrl;
    } else {
      tempImg.src = this.appLazyImage;
    }
  }

  private checkWebPSupport(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
