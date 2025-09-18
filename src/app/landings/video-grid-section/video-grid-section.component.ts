import { Component, Input, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LazyWistiaDirective } from '../../shared/directives/lazy-wistia.directive';

@Component({
  selector: 'app-video-grid-section',
  standalone: true,
  imports: [CommonModule, LazyWistiaDirective],
  templateUrl: './video-grid-section.component.html',
  styleUrl: './video-grid-section.component.css',
})
export class VideoGridSectionComponent {
  @Input() title: string = '';
  @Input() titleHighlight: string = '';
  @Input() description: string = '';
  @Input() maxVideosPerRow: number = 3;
  isMobile: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize();
      window.addEventListener('resize', () => this.checkScreenSize());
    }
  }

  private checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth <= 768;
    }
  }
}
