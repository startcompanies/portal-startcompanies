import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-wistia-vertical-player',
  standalone: true,
  imports: [],
  templateUrl: './wistia-vertical-player.component.html',
  styleUrl: './wistia-vertical-player.component.css'
})
export class WistiaVerticalPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() mediaId!: string;
  @ViewChild('wistiaContainer', { static: false }) wistiaContainer!: ElementRef;
  wistiaHtml!: SafeHtml;
  private scriptsLoaded = false;

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ){}

  ngOnInit(): void {
    if (!this.mediaId) {
      console.error('El ID de Wistia no fue proporcionado.');
      return;
    }

    // Solo cargar scripts si no se han cargado antes
    if (!this.scriptsLoaded && isPlatformBrowser(this.platformId)) {
      this.loadWistiaScripts();
      this.scriptsLoaded = true;
    }

    const wistiaCode = `
      <style>
        wistia-player[media-id='${this.mediaId}']:not(:defined) { 
          background: #f8f9fa center / contain no-repeat url('https://fast.wistia.com/embed/medias/${this.mediaId}/swatch'); 
          display: block; 
          padding-top:177.78%; /* relación vertical 9:16 */
        }
      </style>
      <wistia-player media-id="${this.mediaId}" aspect="0.5625"></wistia-player>
    `;

    this.wistiaHtml = this.sanitizer.bypassSecurityTrustHtml(wistiaCode);
  }

  private loadWistiaScripts(): void {
    // Verificar si los scripts ya existen
    if (document.querySelector('script[src*="fast.wistia.com/player.js"]')) {
      return;
    }

    // Cargar scripts solo una vez
    const playerScript = document.createElement('script');
    playerScript.src = 'https://fast.wistia.com/player.js';
    playerScript.async = true;
    playerScript.onerror = () => console.warn('Error cargando Wistia player.js (ignorado)');
    document.head.appendChild(playerScript);
  }

  ngAfterViewInit(): void {
    // Solo ejecutar en el navegador
    if (isPlatformBrowser(this.platformId)) {
      // Verificar cuando Wistia esté cargado
      const checkWistiaLoaded = () => {
        if (this.wistiaContainer) {
          const wistiaPlayer = this.wistiaContainer.nativeElement.querySelector('wistia-player');
          if (wistiaPlayer) {
            // Verificar si tiene contenido visible (iframe, video, etc.)
            const hasContent = wistiaPlayer.offsetHeight > 0 || 
                             wistiaPlayer.querySelector('iframe') || 
                             wistiaPlayer.querySelector('video') ||
                             wistiaPlayer.querySelector('canvas');
            
            if (hasContent) {
              // Ocultar el indicador de carga
              const container = this.wistiaContainer.nativeElement.closest('.mobile-video-container');
              if (container) {
                container.classList.add('wistia-loaded');
                console.log('Wistia cargado - ocultando indicador');
              }
              return;
            }
          }
          
          // Verificar de nuevo en 200ms si no está cargado
          setTimeout(checkWistiaLoaded, 200);
        }
      };
      
      // Iniciar verificación después de 200ms
      setTimeout(checkWistiaLoaded, 200);
    }
  }

  ngOnDestroy(): void {
    // Limpiar cuando el componente se destruye
    this.scriptsLoaded = false;
  }
}
