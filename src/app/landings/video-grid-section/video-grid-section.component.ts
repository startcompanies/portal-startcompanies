import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  styleUrl: './video-grid-section.component.css'
})
export class VideoGridSectionComponent {
  @Input() title: string = '';
  @Input() titleHighlight: string = '';
  @Input() description: string = '';
  @Input() videos: VideoTestimonial[] = [];
  @Input() maxVideosPerRow: number = 3;

  constructor(private sanitizer: DomSanitizer) {}

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

  getVideosInRows(): VideoTestimonial[][] {
    const rows: VideoTestimonial[][] = [];
    for (let i = 0; i < this.videos.length; i += this.maxVideosPerRow) {
      rows.push(this.videos.slice(i, i + this.maxVideosPerRow));
    }
    return rows;
  }
}
