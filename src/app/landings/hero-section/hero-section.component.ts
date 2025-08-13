import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ScrollService } from '../../services/scroll.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.css',
})
export class HeroSectionComponent implements OnInit {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private scrollService: ScrollService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {}

  navigateToCalendlySection() {
    this.scrollService.scrollTo('calendlySection');
  }

  getSafeUrl(url: string): SafeResourceUrl {
    // Extrae el ID del video de la URL
    // Se asume que la URL ya está en el formato de incrustación de YouTube
    const videoIdMatch = url.match(/(?:\/embed\/|v=)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    // Parámetros que quieres añadir
    const params = [
      'rel=0', // Evita videos relacionados
      'autoplay=1', // Reproducción automática
      'mute=1', // Silencia el video por defecto
    ];

    // Si se detecta un ID, añade el parámetro de playlist para que loop funcione
    if (videoId) {
      params.push(`playlist=${videoId}`);
      params.push('loop=1'); // Ahora loop funciona correctamente
    }

    // Une los parámetros en una cadena
    const finalParams = params.join('&');

    // Asegura que la URL de YouTube sea la base para evitar conflictos
    const processedUrl = `https://www.youtube.com/embed/${videoId}?${finalParams}`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(processedUrl);
  }
}
