import { Component, OnInit } from '@angular/core';
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
  ],
  templateUrl: './llc-apertura.component.html',
  styleUrls: ['./llc-apertura.component.css']
})
export class LLCAperturaComponent implements OnInit {
  flowConfig!: any;
  currentStepIndex = 0;
  stepTitles: { [key: number]: string } = {};
  currentLang = 'es';
  
  stepIcons: { [key: number]: string } = {
    1: 'bi-person-plus',
    2: 'bi-geo-alt',
    3: 'bi-credit-card',
    4: 'bi-person-vcard',
    5: 'bi-check-circle',
  };

  constructor(
    private wizardConfigService: WizardConfigService,
    private wizardStateService: WizardStateService,
    private transloco: TranslocoService,
    private languageService: LanguageService,
    public translocoService: TranslocoService,
    private router: Router
  ) {}

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
      this.transloco.selectTranslate('WIZARD.steps.state'),
      this.transloco.selectTranslate('WIZARD.steps.payment'),
      this.transloco.selectTranslate('WIZARD.steps.client'),
      this.transloco.selectTranslate('WIZARD.steps.review'),
    ]).subscribe(([register, state, payment, client, review]) => {
      this.stepTitles = {
        1: register,
        2: state,
        3: payment,
        4: client,
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
