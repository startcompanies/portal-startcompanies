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
import { LandingLpGtmService } from '../../../../shared/services/landing-lp-gtm.service';
import { LandingStaticLpBootstrapService } from '../../../../shared/services/landing-static-lp-bootstrap.service';
import { BrowserService } from '../../../../shared/services/browser.service';

@Component({
  selector: 'app-landing-abre-tu-llc-google',
  standalone: true,
  templateUrl: './landing-abre-tu-llc-google.component.html',
  styleUrl: './landing-abre-tu-llc-google.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LandingAbreTuLlcGoogleComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('root', { static: false }) rootRef!: ElementRef<HTMLElement>;

  constructor(
    private facebookPixelService: FacebookPixelService,
    private landingLpGtm: LandingLpGtmService,
    private bootstrap: LandingStaticLpBootstrapService,
    private browser: BrowserService
  ) {}

  ngOnInit(): void {
    if (this.browser.isBrowser) {
      document.body.classList.add('lp-campaign-page');
      this.landingLpGtm.enable();
    }
    this.facebookPixelService.initializePixel('llc');
    this.facebookPixelService.trackViewContent('Abre tu LLC Google', 'LLC Services');
  }

  ngOnDestroy(): void {
    if (this.browser.isBrowser) {
      this.landingLpGtm.disable();
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
