import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface VideoTestimonial {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
}

@Component({
  selector: 'app-video-grid-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-grid-section.component.html',
  styleUrl: './video-grid-section.component.css',
})
export class VideoGridSectionComponent {
  @Input() title: string = '';
  @Input() titleHighlight: string = '';
  @Input() description: string = '';
  @Input() videos: VideoTestimonial[] = [];
  @Input() maxVideosPerRow: number = 3;

  constructor(private sanitizer: DomSanitizer, @Inject(PLATFORM_ID) private platformId: Object) {}

  /*getSafeUrl(url: string): SafeResourceUrl {
    // Agregar parámetros de autoplay y muted para asegurar que el video esté silenciado por defecto
    let processedUrl = url;
    if (url.includes('youtube.com/embed/') || url.includes('youtu.be/')) {
      const separator = url.includes('?') ? '&' : '?';
      // Asegurar que el video esté silenciado por defecto
      processedUrl = `${url}${separator}autoplay=1&mute=1&loop=1&rel=0`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(processedUrl);
  }*/
  getSafeUrl(url: string): SafeResourceUrl {
    // 1. Extrae el ID del video de la URL
    const videoIdMatch = url.match(
      /(?:\/embed\/|v=|\/vi\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (videoId) {
      // 2. Construye el objeto de parámetros
      const params = new URLSearchParams({
        rel: '0', // Restringe videos relacionados (al mismo canal)
        controls: '1', // Muestra los controles del reproductor
        autoplay: '1', // Inicia la reproducción automáticamente
        mute: '1', // Silencia el video (necesario para autoplay en la mayoría de navegadores)
        enablejsapi: '1', // Habilita la API de JavaScript para controlar el reproductor
        origin: '', // Se llenará dinámicamente
      });

      // 3. Establece el origen dinámicamente (¡MUY IMPORTANTE!)
      // Este parámetro es requerido por 'enablejsapi=1'
      if (isPlatformBrowser(this.platformId)) {
        params.set('origin', window.location.origin);
      }

      // 4. Construye la URL final y correcta
      const finalUrl = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;

      // 5. Sanitiza y devuelve la URL
      return this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
    }

    // Si no se encuentra un videoId, devuelve la URL original sanitizada
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getVideosInRows(): VideoTestimonial[][] {
    const rows: VideoTestimonial[][] = [];
    for (let i = 0; i < this.videos.length; i += this.maxVideosPerRow) {
      rows.push(this.videos.slice(i, i + this.maxVideosPerRow));
    }
    return rows;
  }
}
