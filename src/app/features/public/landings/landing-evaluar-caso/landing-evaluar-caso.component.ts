import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FacebookPixelService } from '../../../../shared/services/facebook-pixel.service';
import { LandingStaticLpBootstrapService } from '../../../../shared/services/landing-static-lp-bootstrap.service';
import { BrowserService } from '../../../../shared/services/browser.service';

@Component({
  selector: 'app-landing-evaluar-caso',
  standalone: true,
  templateUrl: './landing-evaluar-caso.component.html',
  styleUrls: [
    '../landing-presentacion/landing-presentacion.component.css',
    './landing-evaluar-caso.component.css',
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LandingEvaluarCasoComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('root', { static: false }) rootRef!: ElementRef<HTMLElement>;

  constructor(
    private facebookPixelService: FacebookPixelService,
    private bootstrap: LandingStaticLpBootstrapService,
    private browser: BrowserService
  ) {}

  ngOnInit(): void {
    if (this.browser.isBrowser) {
      document.body.classList.add('lp-campaign-page');
    }
    this.facebookPixelService.initializePixel('llc');
    this.facebookPixelService.trackViewContent('Evaluar caso LLC', 'LLC Services');
  }

  ngOnDestroy(): void {
    if (this.browser.isBrowser) {
      document.body.classList.remove('lp-campaign-page');
    }
  }

  ngAfterViewInit(): void {
    if (!this.browser.isBrowser) {
      return;
    }
    const el = this.rootRef?.nativeElement;
    if (el) {
      this.bootstrap.setupCampaignLp(el);
    }
  }
}
