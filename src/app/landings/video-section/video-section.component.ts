import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-section.component.html',
  styleUrl: './video-section.component.css'
})
export class VideoSectionComponent {
  @Input() subtitle: string = '';
  @Input() title: string = '';
  @Input() titleHighlight: string = '';
  @Input() description: string = '';
  @Input() videoUrl: string = '';
  @Input() videoTitle: string = 'Video';

  constructor(private sanitizer: DomSanitizer) {}

  getSafeUrl(url: string): SafeResourceUrl {
    // Agregar parámetros de autoplay y muted para asegurar que el video esté silenciado por defecto
    let processedUrl = url;
    if (url.includes('youtube.com/embed/') || url.includes('youtu.be/')) {
      const separator = url.includes('?') ? '&' : '?';
      // Asegurar que el video esté silenciado por defecto
      processedUrl = `${url}${separator}autoplay=1&muted=1`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(processedUrl);
  }
}
