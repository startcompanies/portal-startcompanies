import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { LanguageService } from '../../../shared/services/language.service';
import { WizardStateService } from '../services/wizard-state.service';
import { WizardConfigService, WizardFlowType } from '../services/wizard-config.service';
import { combineLatest } from 'rxjs';

// Componentes reutilizables
import { WizardBasicRegisterStepComponent } from '../components/basic-register-step/basic-register-step.component';
import { WizardPaymentStepComponent } from '../components/payment-step/payment-step.component';
import { WizardFinalReviewStepComponent } from '../components/final-review-step/final-review-step.component';

// Componente wrapper para información de cuenta bancaria
import { WizardCuentaBancariaInformationStepComponent } from './steps/wizard-cuenta-bancaria-information-step/wizard-cuenta-bancaria-information-step.component';

/**
 * Componente principal para el flujo de cuenta bancaria
 * Soporta dos variantes: con pago y sin pago
 */
@Component({
  selector: 'app-cuenta-bancaria',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoPipe,
    WizardBasicRegisterStepComponent,
    WizardPaymentStepComponent,
    WizardFinalReviewStepComponent,
    WizardCuentaBancariaInformationStepComponent
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

  // Para controlar la visibilidad de botones en el paso de información de cuenta bancaria
  cuentaBancariaInfoCurrentSection = 1;

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

  // Estado de carga de archivos
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};

  constructor(
    private wizardConfigService: WizardConfigService,
    private wizardStateService: WizardStateService,
    private transloco: TranslocoService,
    private languageService: LanguageService,
    public translocoService: TranslocoService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    // Inicializar el formulario de datos del servicio
    this.serviceDataForm = this.fb.group({});
    this.initializeCuentaBancariaForm(this.serviceDataForm);
  }

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
    // No ejecutar onFinish automáticamente, el usuario debe hacer clic en el botón
  }

  onFinish(): void {
    const allData = this.wizardStateService.getAllData();
    console.log('✅ Datos finales del wizard Cuenta Bancaria:', allData);
    /*this.currentLang === 'es'
      ? this.router.navigate(['/'])
      : this.router.navigate(['/en']);*/
  }

  onCancel(): void {
    this.wizardStateService.clear();
    this.currentLang === 'es'
      ? this.router.navigate(['/'])
      : this.router.navigate(['/en']);
  }

  /**
   * Inicializa el formulario de cuenta bancaria
   */
  private initializeCuentaBancariaForm(group: FormGroup): void {
    // Paso 1: Información de la LLC
    group.addControl('businessType', this.fb.control(''));
    group.addControl('legalBusinessName', this.fb.control(''));
    group.addControl('industry', this.fb.control(''));
    group.addControl('numberOfEmployees', this.fb.control(''));
    group.addControl('briefDescription', this.fb.control(''));
    group.addControl('websiteOrSocialMedia', this.fb.control(''));
    group.addControl('einLetterUrl', this.fb.control(''));
    group.addControl('einNumber', this.fb.control(''));
    group.addControl('articlesOrCertificateUrl', this.fb.control(''));
    
    // Paso 2: Dirección del Registered Agent
    group.addControl('registeredAgentStreet', this.fb.control(''));
    group.addControl('registeredAgentUnit', this.fb.control(''));
    group.addControl('registeredAgentCity', this.fb.control(''));
    group.addControl('registeredAgentState', this.fb.control(''));
    group.addControl('registeredAgentZipCode', this.fb.control(''));
    group.addControl('registeredAgentCountry', this.fb.control('United States'));
    group.addControl('incorporationState', this.fb.control(''));
    group.addControl('incorporationMonthYear', this.fb.control(''));
    group.addControl('countriesWhereBusiness', this.fb.control([]));
    
    // Paso 3: Información de la persona que verificará la cuenta bancaria
    group.addControl('validatorMemberId', this.fb.control(''));
    group.addControl('validatorTitle', this.fb.control(''));
    group.addControl('validatorIncomeSource', this.fb.control(''));
    group.addControl('validatorAnnualIncome', this.fb.control(''));
    group.addControl('validatorFirstName', this.fb.control(''));
    group.addControl('validatorLastName', this.fb.control(''));
    group.addControl('validatorDateOfBirth', this.fb.control(''));
    group.addControl('validatorNationality', this.fb.control(''));
    group.addControl('validatorCitizenship', this.fb.control(''));
    group.addControl('validatorPassportNumber', this.fb.control(''));
    group.addControl('validatorPassportUrl', this.fb.control(''));
    group.addControl('validatorWorkEmail', this.fb.control(''));
    group.addControl('validatorPhone', this.fb.control(''));
    group.addControl('canReceiveSMS', this.fb.control(false));
    group.addControl('isUSResident', this.fb.control(''));
    
    // Paso 4: Dirección personal del propietario
    group.addControl('ownerPersonalStreet', this.fb.control(''));
    group.addControl('ownerPersonalUnit', this.fb.control(''));
    group.addControl('ownerPersonalCity', this.fb.control(''));
    group.addControl('ownerPersonalState', this.fb.control(''));
    group.addControl('ownerPersonalCountry', this.fb.control(''));
    group.addControl('ownerPersonalPostalCode', this.fb.control(''));
    group.addControl('serviceBillUrl', this.fb.control(''));
    
    // Paso 5: Tipo de LLC
    group.addControl('isMultiMember', this.fb.control(''));
    group.addControl('llcType', this.fb.control(''));
    
    // Paso 6: Propietarios (FormArray)
    group.addControl('owners', this.fb.array([]));
  }

  /**
   * Maneja la selección de archivos
   */
  onFileSelected(event: { event: Event; formControlPath: string; fileKey: string }): void {
    // Implementar lógica de carga de archivos si es necesario
    console.log('File selected:', event);
  }

  /**
   * Maneja la limpieza de archivos
   */
  onFileCleared(event: { fileKey: string; formControlPath: string; inputId: string }): void {
    // Implementar lógica de limpieza de archivos si es necesario
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
      firstName: [''],
      lastName: [''],
      dateOfBirth: [''],
      nationality: [''],
      passportNumber: [''],
      ssnItin: [''],
      cuit: [''],
      participationPercentage: [''],
      passportFileUrl: ['']
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
