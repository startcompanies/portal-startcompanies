import { Component, OnInit } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { FormWizardModule, FormWizardService, IStepperOptions, IWizardStep } from 'ngx-form-wizard';
import { LanguageService } from '../../services/language.service';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { LlcInformationComponent } from '../../components/apertura-relay-steps/llc-information.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { SharedModule } from '../../shared/shared/shared.module';
import { RegisteredAgentAddressComponent } from '../../components/apertura-relay-steps/registered-agent-address.component';
import { AccountVerifierInfoComponent } from '../../components/apertura-relay-steps/account-verifier-info.component';
import { OwnerPersonalAddressComponent } from '../../components/apertura-relay-steps/owner-personal-address.component';
import { LlcTypeComponent } from '../../components/apertura-relay-steps/llc-type.component';
import { RelayFinalReviewComponent } from '../../components/apertura-relay-steps/relay-final-review.component';
import { RelaySubmitComponent } from '../../components/apertura-relay-steps/relay-submit.component';

@Component({
  selector: 'app-create-bank-account',
  standalone: true,
  imports: [ResponsiveImageComponent, TranslocoPipe, FormWizardModule, SharedModule],
  templateUrl: './create-bank-account.component.html',
  styleUrl: './create-bank-account.component.css'
})
export class CreateBankAccountComponent implements OnInit {
  // Hero images
  heroImages = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Create Bank Account Hero Background',
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
    private translocoService: TranslocoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeSteps();    
  }

  private initializeSteps(): void {
    combineLatest([
      this.transloco.selectTranslate('CREATE_BANK_ACCOUNT.steps.llcInfo'),
      this.transloco.selectTranslate('CREATE_BANK_ACCOUNT.steps.registeredAgent'),
      this.transloco.selectTranslate('CREATE_BANK_ACCOUNT.steps.accountVerifier'),
      this.transloco.selectTranslate('CREATE_BANK_ACCOUNT.steps.ownerAddress'),
      this.transloco.selectTranslate('CREATE_BANK_ACCOUNT.steps.llcType'),
      this.transloco.selectTranslate('CREATE_BANK_ACCOUNT.steps.finalReview'),
      this.transloco.selectTranslate('CREATE_BANK_ACCOUNT.steps.submit'),
    ]).subscribe(([llcInfo, registeredAgent, accountVerifier, ownerAddress, llcType, finalReview, submit]) => {
      this.steps = [
        {
          id: 1,
          title: llcInfo,
          description: '',
          component: LlcInformationComponent
        },
        {
          id: 2,
          title: registeredAgent,
          description: '',
          component: RegisteredAgentAddressComponent
        },
        {
          id: 3,
          title: accountVerifier,
          description: '',
          component: AccountVerifierInfoComponent
        },
        {
          id: 4,
          title: ownerAddress,
          description: '',
          component: OwnerPersonalAddressComponent
        },
        {
          id: 5,
          title: llcType,
          description: '',
          component: LlcTypeComponent
        },
        {
          id: 6,
          title: finalReview,
          description: '',
          component: RelayFinalReviewComponent
        },
        {
          id: 7,
          title: submit,
          description: '',
          component: RelaySubmitComponent
        }
      ];
    })
  }

  onFinish() {
    console.log('Finished');
  }

  onCancel() {
    console.log('Cancelled');
  }
}
