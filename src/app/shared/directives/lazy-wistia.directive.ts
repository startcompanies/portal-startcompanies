import { Directive, ElementRef, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appLazyWistia]',
  standalone: true
})
export class LazyWistiaDirective implements OnInit, OnDestroy {
  @Input() appLazyWistia!: string;
  @Input() aspectRatio: number = 1.7777777777777777; // 16:9 por defecto
  @Input() vertical: boolean = false;

  private observer: IntersectionObserver | null = null;
  private scriptsLoaded = false;

  constructor(
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.appLazyWistia) {
      console.error('El ID de Wistia no fue proporcionado.');
      return;
    }

    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback para navegadores que no soportan IntersectionObserver
      this.loadWistia();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadWistia();
            this.observer?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Cargar cuando esté a 50px de entrar en viewport
        threshold: 0.1
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  private loadWistia(): void {
    if (this.scriptsLoaded) {
      this.createWistiaPlayer();
      return;
    }

    this.loadWistiaScripts().then(() => {
      this.scriptsLoaded = true;
      this.createWistiaPlayer();
    });
  }

  private loadWistiaScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar si los scripts ya existen
      if (document.querySelector('script[src*="fast.wistia.com/player.js"]')) {
        resolve();
        return;
      }

      const playerScript = document.createElement('script');
      playerScript.src = 'https://fast.wistia.com/player.js';
      playerScript.async = true;
      playerScript.onload = () => resolve();
      playerScript.onerror = () => {
        console.warn('Error cargando Wistia player.js (ignorado)');
        resolve(); // Continuar aunque falle
      };
      document.head.appendChild(playerScript);
    });
  }

  private createWistiaPlayer(): void {
    const container = this.el.nativeElement;
    
    // Crear placeholder mientras carga
    const placeholder = document.createElement('div');
    placeholder.className = 'wistia-placeholder';
    placeholder.innerHTML = `
      <div class="wistia-loading">
        <div class="spinner"></div>
        <p>Cargando video...</p>
      </div>
    `;
    
    container.appendChild(placeholder);

    // Crear el player de Wistia
    const wistiaPlayer = document.createElement('wistia-player');
    wistiaPlayer.setAttribute('media-id', this.appLazyWistia);
    wistiaPlayer.setAttribute('aspect', this.aspectRatio.toString());
    
    // No aplicar padding-top manual; Wistia calculará el alto según 'aspect'

    // Agregar estilos para el placeholder
    const style = document.createElement('style');
    style.textContent = `
      .wistia-placeholder {
        position: relative;
        background: #f8f9fa;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        border-radius: 8px;
      }
      
      .wistia-loading {
        text-align: center;
        color: #666;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #006AFE;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      wistia-player {
        width: 100% !important;
        height: auto !important;
        display: block !important;
      }
    `;
    
    document.head.appendChild(style);

    // Reemplazar placeholder con el player
    setTimeout(() => {
      container.removeChild(placeholder);
      container.appendChild(wistiaPlayer);
      
      // Cargar el embed específico
      this.loadWistiaEmbed();
    }, 100);
  }

  private loadWistiaEmbed(): void {
    const embedScript = document.createElement('script');
    embedScript.src = `https://fast.wistia.com/embed/${this.appLazyWistia}.js`;
    embedScript.async = true;
    embedScript.type = 'module';
    embedScript.onerror = () => console.warn('Error cargando Wistia embed (ignorado)');
    document.head.appendChild(embedScript);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
