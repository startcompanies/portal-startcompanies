import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { LanguageService } from '../../../shared/services/language.service';
import { WizardStateService } from '../services/wizard-state.service';
import { WizardConfigService, WizardFlowType } from '../services/wizard-config.service';
import { combineLatest } from 'rxjs';

// Componentes reutilizables
import { WizardBasicRegisterStepComponent } from '../components/basic-register-step/basic-register-step.component';
import { WizardStateSelectionStepComponent } from '../components/state-selection-step/state-selection-step.component';
import { WizardPaymentStepComponent } from '../components/payment-step/payment-step.component';
import { WizardFinalReviewStepComponent } from '../components/final-review-step/final-review-step.component';

// Componente wrapper para información de renovación LLC
import { WizardRenovacionLlcInformationStepComponent } from './steps/wizard-renovacion-llc-information-step/wizard-renovacion-llc-information-step.component';

/**
 * Componente principal para el flujo de renovación de LLC
 */
@Component({
  selector: 'app-llc-renovacion',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoPipe,
    WizardBasicRegisterStepComponent,
    WizardStateSelectionStepComponent,
    WizardPaymentStepComponent,
    WizardRenovacionLlcInformationStepComponent,
    WizardFinalReviewStepComponent,
  ],
  templateUrl: './llc-renovacion.component.html',
  styleUrls: ['./llc-renovacion.component.css']
})
export class LLCRenovacionComponent implements OnInit {
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

  // Para controlar la visibilidad de botones en el paso 4 (Información LLC)
  renovacionInfoCurrentSection = 1;

  // Formulario de datos del servicio
  serviceDataForm!: FormGroup;
  
  // Estados de USA
  usStates = [
    { value: 'Alabama', label: 'Alabama', abbreviation: 'AL' },
    { value: 'Alaska', label: 'Alaska', abbreviation: 'AK' },
    { value: 'Arizona', label: 'Arizona', abbreviation: 'AZ' },
    { value: 'Arkansas', label: 'Arkansas', abbreviation: 'AR' },
    { value: 'California', label: 'California', abbreviation: 'CA' },
    { value: 'Colorado', label: 'Colorado', abbreviation: 'CO' },
    { value: 'Connecticut', label: 'Connecticut', abbreviation: 'CT' },
    { value: 'Delaware', label: 'Delaware', abbreviation: 'DE' },
    { value: 'Florida', label: 'Florida', abbreviation: 'FL' },
    { value: 'Georgia', label: 'Georgia', abbreviation: 'GA' },
    { value: 'Hawaii', label: 'Hawaii', abbreviation: 'HI' },
    { value: 'Idaho', label: 'Idaho', abbreviation: 'ID' },
    { value: 'Illinois', label: 'Illinois', abbreviation: 'IL' },
    { value: 'Indiana', label: 'Indiana', abbreviation: 'IN' },
    { value: 'Iowa', label: 'Iowa', abbreviation: 'IA' },
    { value: 'Kansas', label: 'Kansas', abbreviation: 'KS' },
    { value: 'Kentucky', label: 'Kentucky', abbreviation: 'KY' },
    { value: 'Louisiana', label: 'Louisiana', abbreviation: 'LA' },
    { value: 'Maine', label: 'Maine', abbreviation: 'ME' },
    { value: 'Maryland', label: 'Maryland', abbreviation: 'MD' },
    { value: 'Massachusetts', label: 'Massachusetts', abbreviation: 'MA' },
    { value: 'Michigan', label: 'Michigan', abbreviation: 'MI' },
    { value: 'Minnesota', label: 'Minnesota', abbreviation: 'MN' },
    { value: 'Mississippi', label: 'Mississippi', abbreviation: 'MS' },
    { value: 'Missouri', label: 'Missouri', abbreviation: 'MO' },
    { value: 'Montana', label: 'Montana', abbreviation: 'MT' },
    { value: 'Nebraska', label: 'Nebraska', abbreviation: 'NE' },
    { value: 'Nevada', label: 'Nevada', abbreviation: 'NV' },
    { value: 'New Hampshire', label: 'New Hampshire', abbreviation: 'NH' },
    { value: 'New Jersey', label: 'New Jersey', abbreviation: 'NJ' },
    { value: 'New Mexico', label: 'New Mexico', abbreviation: 'NM' },
    { value: 'New York', label: 'New York', abbreviation: 'NY' },
    { value: 'North Carolina', label: 'North Carolina', abbreviation: 'NC' },
    { value: 'North Dakota', label: 'North Dakota', abbreviation: 'ND' },
    { value: 'Ohio', label: 'Ohio', abbreviation: 'OH' },
    { value: 'Oklahoma', label: 'Oklahoma', abbreviation: 'OK' },
    { value: 'Oregon', label: 'Oregon', abbreviation: 'OR' },
    { value: 'Pennsylvania', label: 'Pennsylvania', abbreviation: 'PA' },
    { value: 'Rhode Island', label: 'Rhode Island', abbreviation: 'RI' },
    { value: 'South Carolina', label: 'South Carolina', abbreviation: 'SC' },
    { value: 'South Dakota', label: 'South Dakota', abbreviation: 'SD' },
    { value: 'Tennessee', label: 'Tennessee', abbreviation: 'TN' },
    { value: 'Texas', label: 'Texas', abbreviation: 'TX' },
    { value: 'Utah', label: 'Utah', abbreviation: 'UT' },
    { value: 'Vermont', label: 'Vermont', abbreviation: 'VT' },
    { value: 'Virginia', label: 'Virginia', abbreviation: 'VA' },
    { value: 'Washington', label: 'Washington', abbreviation: 'WA' },
    { value: 'West Virginia', label: 'West Virginia', abbreviation: 'WV' },
    { value: 'Wisconsin', label: 'Wisconsin', abbreviation: 'WI' },
    { value: 'Wyoming', label: 'Wyoming', abbreviation: 'WY' }
  ];

  // Tipos de LLC
  llcTypes = [
    { value: 'single', label: 'Single Member LLC', description: 'LLC con un solo miembro' },
    { value: 'multi', label: 'Multi Member LLC', description: 'LLC con múltiples miembros' }
  ];

  // Estado de carga de archivos
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};

  constructor(
    private wizardConfigService: WizardConfigService,
    private wizardStateService: WizardStateService,
    private transloco: TranslocoService,
    private languageService: LanguageService,
    public translocoService: TranslocoService,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Inicializar el formulario de datos del servicio
    this.serviceDataForm = this.fb.group({});
    this.initializeRenovacionLlcForm(this.serviceDataForm);
  }

  ngOnInit(): void {
    this.flowConfig = this.wizardConfigService.getFlowConfig(WizardFlowType.LLC_RENOVACION);
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
    console.log('✅ Datos finales del wizard LLC Renovación:', allData);
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

  /**
   * Inicializa el formulario de renovación LLC
   */
  private initializeRenovacionLlcForm(group: FormGroup): void {
    // Información básica de la LLC
    group.addControl('llcName', this.fb.control(''));
    group.addControl('state', this.fb.control(''));
    group.addControl('llcType', this.fb.control(''));
    group.addControl('mainActivity', this.fb.control(''));
    
    // Preguntas sobre la empresa
    group.addControl('hasPropertyInUSA', this.fb.control(''));
    group.addControl('almacenaProductosDepositoUSA', this.fb.control(''));
    group.addControl('contrataServiciosUSA', this.fb.control(''));
    group.addControl('tieneCuentasBancarias', this.fb.control(''));
    
    // EIN y otros datos
    group.addControl('einNumber', this.fb.control(''));
    group.addControl('countriesWhereLLCDoesBusiness', this.fb.control([]));
    group.addControl('llcCreationDate', this.fb.control(''));
    
    // Tipo de declaración (checkboxes)
    group.addControl('declaracionInicial', this.fb.control(false));
    group.addControl('declaracionAnoCorriente', this.fb.control(false));
    group.addControl('cambioDireccionRA', this.fb.control(false));
    group.addControl('cambioNombre', this.fb.control(false));
    group.addControl('declaracionAnosAnteriores', this.fb.control(false));
    group.addControl('agregarCambiarSocio', this.fb.control(false));
    group.addControl('declaracionCierre', this.fb.control(false));
    
    // Paso 2: Información de Propietarios (single o multimember)
    const ownersArray = this.fb.array([]);
    group.addControl('owners', ownersArray);
    
    // Paso 3: Información Contable de la LLC
    group.addControl('llcOpeningCost', this.fb.control(''));
    group.addControl('paidToFamilyMembers', this.fb.control(''));
    group.addControl('paidToLocalCompanies', this.fb.control(''));
    group.addControl('paidForLLCFormation', this.fb.control(''));
    group.addControl('paidForLLCDissolution', this.fb.control(''));
    group.addControl('bankAccountBalanceEndOfYear', this.fb.control(''));
    
    // Paso 4: Movimientos Financieros de la LLC en 2025
    group.addControl('totalRevenue2025', this.fb.control(''));
    
    // Paso 5: Información Adicional de la LLC
    group.addControl('hasFinancialInvestmentsInUSA', this.fb.control(''));
    group.addControl('hasFiledTaxesBefore', this.fb.control(''));
    group.addControl('wasConstitutedWithStartCompanies', this.fb.control(''));
    
    // Documentos adicionales
    group.addControl('partnersPassportsFileUrl', this.fb.control(''));
    group.addControl('operatingAgreementAdditionalFileUrl', this.fb.control(''));
    group.addControl('form147Or575FileUrl', this.fb.control(''));
    group.addControl('articlesOfOrganizationAdditionalFileUrl', this.fb.control(''));
    group.addControl('boiReportFileUrl', this.fb.control(''));
    group.addControl('bankStatementsFileUrl', this.fb.control(''));
  }

  /**
   * Maneja la selección de archivos
   */
  onFileSelected(event: { event: Event; formControlPath: string; fileKey: string }): void {
    console.log('File selected:', event);
  }

  /**
   * Maneja la limpieza de archivos
   */
  onFileCleared(event: { fileKey: string; formControlPath: string; inputId: string }): void {
    console.log('File cleared:', event);
  }

  /**
   * Maneja la adición de propietarios
   */
  onAddOwnerRequested(): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    if (!ownersArray) {
      this.serviceDataForm.addControl('owners', this.fb.array([]));
    }
    
    const ownerGroup = this.fb.group({
      name: [''],
      lastName: [''],
      dateOfBirth: [''],
      email: [''],
      phone: [''],
      fullAddress: [''],
      unit: [''],
      city: [''],
      stateRegion: [''],
      postalCode: [''],
      country: [''],
      nationality: [''],
      passportNumber: [''],
      ssnItin: [''],
      cuit: [''],
      capitalContributions2025: [0],
      loansToLLC2025: [0],
      loansRepaid2025: [0],
      capitalWithdrawals2025: [0],
      hasInvestmentsInUSA: [''],
      isUSCitizen: [''],
      taxCountry: [''],
      wasInUSA31Days2025: [''],
      participationPercentage: [0]
    });
    
    ownersArray.push(ownerGroup);
  }

  /**
   * Maneja la eliminación de propietarios
   */
  onRemoveOwnerRequested(index: number): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    if (ownersArray && ownersArray.length > index) {
      ownersArray.removeAt(index);
    }
  }
}
