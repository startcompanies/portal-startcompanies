import { Component, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { LanguageService } from '../../../shared/services/language.service';
import { WizardStateService } from '../services/wizard-state.service';
import { WizardConfigService, WizardFlowType } from '../services/wizard-config.service';
import { WizardBaseComponent } from '../wizard-base.component';
import { combineLatest } from 'rxjs';

// Componentes reutilizables
import { WizardBasicRegisterStepComponent } from '../components/basic-register-step/basic-register-step.component';
import { WizardStateSelectionStepComponent } from '../components/state-selection-step/state-selection-step.component';
import { WizardPaymentStepComponent } from '../components/payment-step/payment-step.component';
import { WizardFinalReviewStepComponent } from '../components/final-review-step/final-review-step.component';

// Formulario específico de LLC
import { ClientFormLLCComponent } from './steps/client-form-llc.component';

import { WizardLlcInformationStepComponent } from './steps/llc-information-step/llc-information-step.component';
import { WizardStatePlanSelectionStepComponent } from './steps/state-plan-selection-step/state-plan-selection-step.component';
import { StripeService } from '../services/stripe.service';

/**
 * Componente principal para el flujo de apertura de LLC
 * Flujo: datos básicos → selección estado/precio → pago → información → revisión → envío
 */
@Component({
  selector: 'app-llc-apertura',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    WizardBaseComponent,
    TranslocoPipe,
    WizardBasicRegisterStepComponent,
    WizardStateSelectionStepComponent,
    WizardPaymentStepComponent,
    ClientFormLLCComponent,
    WizardFinalReviewStepComponent,
    WizardLlcInformationStepComponent,
    WizardStatePlanSelectionStepComponent,
  ],
  providers: [StripeService, TranslocoService],
  templateUrl: './llc-apertura.component.html',
  styleUrls: ['./llc-apertura.component.css']
})
export class LLCAperturaComponent implements OnInit {

  flowConfig!: any;
  currentStepIndex = 0;
  stepTitles: { [key: number]: string } = {};
  currentLang = 'es';

  packId: string = '';
  priceId: string = '';
  state: string = '';

  stepIcons: { [key: number]: string } = {
    1: 'bi-person-plus',
    2: 'bi-geo-alt',
    3: 'bi-credit-card',
    4: 'bi-briefcase',
    5: 'bi-check-circle',
  };

  constructor(
    private wizardConfigService: WizardConfigService,
    private wizardStateService: WizardStateService,
    private transloco: TranslocoService,
    private languageService: LanguageService,
    public translocoService: TranslocoService,
    private router: Router,
    private stripeService: StripeService
  ) { }

  ngOnInit(): void {
    this.flowConfig = this.wizardConfigService.getFlowConfig(WizardFlowType.LLC_APERTURA);
    this.initializeStepTitles();
    this.currentLang = this.languageService.currentLang;
    this.translocoService.langChanges$.subscribe((l) => {
      this.currentLang = l;
      this.initializeStepTitles();
    });
  }

  private initializeStepTitles(): void {
    combineLatest([
      this.transloco.selectTranslate('WIZARD.steps.register'),
      this.transloco.selectTranslate('WIZARD.steps.state_plan'),
      this.transloco.selectTranslate('WIZARD.steps.payment'),
      this.transloco.selectTranslate('WIZARD.steps.llc_info'),
      this.transloco.selectTranslate('WIZARD.steps.review'),
    ]).subscribe(([register, statePlan, payment, llcInfo, review]) => {
      this.stepTitles = {
        1: register,
        2: statePlan,
        3: payment,
        4: llcInfo,
        5: review,
      };
    });
  }

  onStepChanged(index: number): void {
    this.currentStepIndex = index;
    // Si llegamos al último paso (revisión), ejecutar onFinish
    if (index === this.flowConfig.totalSteps - 1) {
      setTimeout(() => {
        this.onFinish();
      }, 100);
    }

    if (index === 2) {
      this.packId = this.stripeService.getPackId();
      this.priceId = this.stripeService.getPriceId();
      this.state = this.stripeService.getState();
    }
  }

  onFinish(): void {
    const allData = this.wizardStateService.getAllData();
    console.log('✅ Datos finales del wizard LLC Apertura:', allData);
    this.currentLang === 'es'
      ? this.router.navigate(['/'])
      : this.router.navigate(['/en']);
  }

  onCancel(): void {
    this.wizardStateService.clear();
    this.currentLang === 'es'
      ? this.router.navigate(['/'])
      : this.router.navigate(['/en']);
  }
}
