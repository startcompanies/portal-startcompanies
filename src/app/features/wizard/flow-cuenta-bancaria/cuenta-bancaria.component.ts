import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router, ActivatedRoute } from '@angular/router';
import { LanguageService } from '../../../shared/services/language.service';
import { WizardStateService } from '../services/wizard-state.service';
import { WizardConfigService, WizardFlowType } from '../services/wizard-config.service';
import { WizardBaseComponent } from '../wizard-base.component';
import { combineLatest } from 'rxjs';

// Componentes reutilizables
import { WizardBasicRegisterStepComponent } from '../components/basic-register-step/basic-register-step.component';
import { WizardPaymentStepComponent } from '../components/payment-step/payment-step.component';
import { WizardFinalReviewStepComponent } from '../components/final-review-step/final-review-step.component';

// Formulario específico de cuenta bancaria
import { ClientFormCuentaComponent } from './steps/client-form-cuenta.component';
import { AplicantInfoStepComponent } from './steps/aplicant-info-step/aplicant-info-step.component';
import { CompanyAddressStepComponent } from './steps/company-address-step/company-address-step.component';
import { BankAccountInfoStepComponent } from "./steps/bank-account-info-step/bank-account-info-step.component";
import { LlcTypeStepComponent } from "./steps/llc-type-step/llc-type-step.component";
import { OwnersIdentificationStepComponent } from "./steps/owners-identification-step/owners-identification-step.component";

/**
 * Componente principal para el flujo de cuenta bancaria
 * Soporta dos variantes: con pago y sin pago
 */
@Component({
  selector: 'app-cuenta-bancaria',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    WizardBaseComponent,
    TranslocoPipe,
    WizardBasicRegisterStepComponent,
    WizardPaymentStepComponent,
    ClientFormCuentaComponent,
    AplicantInfoStepComponent,
    CompanyAddressStepComponent,
    WizardFinalReviewStepComponent,
    BankAccountInfoStepComponent,
    LlcTypeStepComponent,    
    OwnersIdentificationStepComponent
],
  templateUrl: './cuenta-bancaria.component.html',
  styleUrls: ['./cuenta-bancaria.component.css']
})
export class CuentaBancariaComponent implements OnInit {
  withPayment: boolean = false;

  flowConfig!: any;
  currentStepIndex = 0;
  stepTitles: { [key: number]: string } = {};
  stepIcons: { [key: number]: string } = {};
  currentLang = 'es';

  constructor(
    private wizardConfigService: WizardConfigService,
    private wizardStateService: WizardStateService,
    private transloco: TranslocoService,
    private languageService: LanguageService,
    public translocoService: TranslocoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Determinar el tipo de flujo basado en la ruta o parámetro
    this.route.data.subscribe(data => {
      this.withPayment = data['withPayment'] || false;
      
      // Determinar el tipo de flujo basado en el parámetro withPayment
      const flowType = this.withPayment 
        ? WizardFlowType.CUENTA_BANCARIA_CON_PAGO 
        : WizardFlowType.CUENTA_BANCARIA_SIN_PAGO;
      
      this.flowConfig = this.wizardConfigService.getFlowConfig(flowType);
      console.log('Total steps', this.flowConfig.totalSteps);
      this.initializeStepIcons();
      this.initializeStepTitles();
    });
    
    this.currentLang = this.languageService.currentLang;
    this.translocoService.langChanges$.subscribe((l) => {
      this.currentLang = l;
      this.initializeStepTitles();
    });
  }

  private initializeStepIcons(): void {
    this.stepIcons = {};
    this.flowConfig.steps.forEach((step: any) => {
      this.stepIcons[step.stepNumber] = step.icon;
    });
  }

  private initializeStepTitles(): void {
    const translationKeys = this.flowConfig.steps.map((step: any) => 
      this.transloco.selectTranslate(step.translationKey)
    );

    combineLatest(translationKeys).subscribe((translations: any) => {
      this.flowConfig.steps.forEach((step: any, index: number) => {
        this.stepTitles[step.stepNumber] = translations[index];
      });
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
    console.log('✅ Datos finales del wizard Cuenta Bancaria:', allData);
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
