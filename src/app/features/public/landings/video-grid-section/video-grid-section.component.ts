import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyWistiaDirective } from '../../../../shared/directives/lazy-wistia.directive';
import { BrowserService } from '../../../../shared/services/browser.service';

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

  constructor(private browser: BrowserService) {
    if (this.browser.isBrowser) {
      this.checkScreenSize();
      const win = this.browser.window;
      if (win) {
        win.addEventListener('resize', () => this.checkScreenSize());
      }
    }
  }

  private checkScreenSize(): void {
    const win = this.browser.window;
    if (win) {
      this.isMobile = win.innerWidth <= 768;
    }
  }
}
