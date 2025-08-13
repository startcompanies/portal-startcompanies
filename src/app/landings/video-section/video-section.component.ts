import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare var YT: any;

@Component({
  selector: 'app-video-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-section.component.html',
  styleUrl: './video-section.component.css',
})
export class VideoSectionComponent {
  @Input() subtitle: string = '';
  @Input() title: string = '';
  @Input() titleHighlight: string = '';
  @Input() description: string = '';
  @Input() videoUrl: string = '';
  @Input() videoTitle: string = 'Video';

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getSafeUrl(url: string): SafeResourceUrl {
    // Agregar parámetros de autoplay y muted para asegurar que el video esté silenciado por defecto
    let processedUrl = url;
    if (url.includes('youtube.com/embed/') || url.includes('youtu.be/')) {
      const separator = url.includes('?') ? '&' : '?';
      // Asegurar que el video esté silenciado por defecto
      processedUrl = `${url}${separator}autoplay=1&mute=1&loop=1&rel=0`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(processedUrl);
  }
}
