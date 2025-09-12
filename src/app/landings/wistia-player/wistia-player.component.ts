import { Component, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-wistia-player',
  standalone: true,
  imports: [],
  templateUrl: './wistia-player.component.html',
  styleUrl: './wistia-player.component.css',
})
export class WistiaPlayerComponent implements OnInit, OnDestroy {
  @Input() mediaId!: string;
  wistiaHtml!: SafeHtml;
  private scriptsLoaded = false;

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!this.mediaId) {
      console.error('El ID de Wistia no fue proporcionado.');
      return;
    }

    // Solo cargar scripts si no se han cargado antes y estamos en el navegador
    if (!this.scriptsLoaded && isPlatformBrowser(this.platformId)) {
      this.loadWistiaScripts();
      this.scriptsLoaded = true;
    }

    const wistiaCode = `
      <style>wistia-player[media-id='${this.mediaId}']:not(:defined) { background: #f8f9fa center / contain no-repeat url('https://fast.wistia.com/embed/medias/${this.mediaId}/swatch'); display: block; padding-top:56.25%; }</style>
      <wistia-player media-id="${this.mediaId}" aspect="1.7777777777777777"></wistia-player>
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

  ngOnDestroy(): void {
    // Limpiar cuando el componente se destruye
    this.scriptsLoaded = false;
  }
}
