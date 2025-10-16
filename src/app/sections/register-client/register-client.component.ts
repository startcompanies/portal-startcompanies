import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared/shared.module';
import {
  FormWizardModule,
  FormWizardService,
  IStepperOptions,
  IWizardStep,
} from 'ngx-form-wizard';
import { BasicRegister } from '../../components/wizard-steps/basic-register.component';
import { ClientFormComponent } from '../../components/wizard-steps/client-form.component';
import { FinalReviewComponent } from '../../components/wizard-steps/final-review.component';
import { ZohoSubmitComponent } from '../../components/wizard-steps/zoho-submit.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { StateSelectionComponent } from '../../components/wizard-steps/state-selection.component';
import { CheckoutPaymentComponent } from '../../components/wizard-steps/checkout-payment.component';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../services/language.service';
import { combineLatest } from 'rxjs';
import { Router } from '@angular/router';
import { SafeStorageService } from '../../services/safe-storage.service';

@Component({
  selector: 'app-register-client',
  standalone: true,
  imports: [
    SharedModule,
    FormWizardModule,
    ResponsiveImageComponent,
    TranslocoPipe,
  ],
  templateUrl: './register-client.component.html',
  styleUrl: './register-client.component.css',
})
export class RegisterClientComponent implements OnInit {
  // 🔹 Imágenes del hero
  heroImages = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Blog Hero Background',
    priority: true,
  };

  steps: IWizardStep[] = [];

  stepperOptions: IStepperOptions = {
    position: 'top',
    custom: false,
  };
  currentLang = 'es';

  constructor(
    private transloco: TranslocoService,
    private wizardService: FormWizardService,
    private languageService: LanguageService,
    public translocoService: TranslocoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeSteps();
    this.currentLang = this.languageService.currentLang;
    this.translocoService.langChanges$.subscribe((l) => {
      this.currentLang = l;
    });
  }

  /**
   * Crea los pasos del wizard con títulos traducidos
   */
  private initializeSteps(): void {
    combineLatest([
      this.transloco.selectTranslate('WIZARD.steps.state'),
      this.transloco.selectTranslate('WIZARD.steps.register'),
      this.transloco.selectTranslate('WIZARD.steps.payment'),
      this.transloco.selectTranslate('WIZARD.steps.client'),
      this.transloco.selectTranslate('WIZARD.steps.review'),
      this.transloco.selectTranslate('WIZARD.steps.zoho'),
    ]).subscribe(([state, register, payment, client, review, zoho]) => {
      this.steps = [
        {
          id: 1,
          title: state,
          description: '',
          component: StateSelectionComponent,
        },
        {
          id: 2,
          title: register,
          description: '',
          component: BasicRegister,
        },
        {
          id: 3,
          title: payment,
          description: '',
          component: CheckoutPaymentComponent,
        },
        {
          id: 4,
          title: client,
          description: '',
          component: ClientFormComponent,
        },
        {
          id: 5,
          title: review,
          description: '',
          component: FinalReviewComponent,
        },
        {
          id: 6,
          title: zoho,
          description: '',
          component: ZohoSubmitComponent,
        },
      ];
    });
  }

  /**
   * Acción al finalizar el wizard
   */
  onFinish() {
    const allData = this.wizardService
      .getSteps()
      .reduce((acc, step) => ({ ...acc, [`step${step.id}`]: step.data }), {});
    console.log('✅ Datos finales del wizard:', allData);
    this.currentLang === 'es'
      ? this.router.navigate(['/es'])
      : this.router.navigate(['/en']);
  }

  /**
   * Acción al cancelar el wizard
   */
  onCancel() {
    this.currentLang === 'es'
      ? this.router.navigate(['/es'])
      : this.router.navigate(['/en']);
  }
}
