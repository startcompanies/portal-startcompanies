import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { filter, take } from 'rxjs';
import { WhatsappFloatComponent } from '../shared/components/whatsapp-float/whatsapp-float.component';
import { CarouselSwipeService } from '../shared/services/carousel-swipe.service';
import { AuthService } from '../features/panel/services/auth.service';
import { BrowserService } from '../shared/services/browser.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, WhatsappFloatComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'portal-startcompanies';

  private readonly carouselSwipeService = inject(CarouselSwipeService);
  private readonly authService = inject(AuthService);
  private readonly browser = inject(BrowserService);

  ngOnInit(): void {
    this.carouselSwipeService.init();

    /**
     * Elimina el #app-boot-splash del index.html cuando /auth/me resuelve.
     * El splash solo está visible en rutas /panel (el script inline del index.html
     * lo activa condicionalmente según location.pathname al parsear el HTML).
     */
    this.authService.authReady$.pipe(
      filter(Boolean),
      take(1),
    ).subscribe(() => {
      const el = this.browser.window?.document?.getElementById('app-boot-splash');
      if (el) {
        el.style.transition = 'opacity .2s ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 220);
      }
    });

  }
}
