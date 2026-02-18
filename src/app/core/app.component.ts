import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImagePreloaderComponent } from '../shared/components/image-preloader/image-preloader.component';
import { WhatsappFloatComponent } from '../shared/components/whatsapp-float/whatsapp-float.component';
import { LanguageService } from '../shared/services/language.service';
import { CarouselSwipeService } from '../shared/services/carousel-swipe.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ImagePreloaderComponent, WhatsappFloatComponent, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'portal-startcompanies';

  constructor(
    private readonly languageService: LanguageService,
    private readonly carouselSwipeService: CarouselSwipeService
  ) {}

  get initialTranslationsReady$() {
    return this.languageService.initialTranslationsReady$;
  }

  ngOnInit(): void {
    this.carouselSwipeService.init();
  }
}
