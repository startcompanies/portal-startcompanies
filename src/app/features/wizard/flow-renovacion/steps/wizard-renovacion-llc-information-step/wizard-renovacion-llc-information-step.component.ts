import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WizardStateService } from '../../../services/wizard-state.service';
import { WizardRenovacionLlcFormComponent } from '../wizard-renovacion-llc-form/wizard-renovacion-llc-form.component';
import { Subscription } from 'rxjs';

/**
 * Componente wrapper para usar wizard-renovacion-llc-form en el wizard
 * Este componente inicializa el formulario y maneja la integración con el wizard
 */
@Component({
  selector: 'app-wizard-renovacion-llc-information-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, WizardRenovacionLlcFormComponent],
  templateUrl: './wizard-renovacion-llc-information-step.component.html',
  styleUrls: ['./wizard-renovacion-llc-information-step.component.css']
})
export class WizardRenovacionLlcInformationStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 4;
  @Input() previousStepNumber: number = 3;
  @Output() sectionChanged = new EventEmitter<number>();

  serviceDataForm!: FormGroup;
  currentSection = 1;
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};
  
  // Lista de estados de USA
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

  totalSections = 5; // Total de secciones para Renovación LLC

  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService,
    private fb: FormBuilder
  ) {
    // Inicializar formulario con estructura de renovacion-llc-form
    this.serviceDataForm = this.fb.group({});
    this.initializeRenovacionLlcForm(this.serviceDataForm);
  }

  ngOnInit(): void {
    this.wizardStateService.registerForm(this.stepNumber, this.serviceDataForm);
    
    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.serviceDataForm.patchValue(savedData);
    }

    // Obtener el estado seleccionado del paso anterior (estado y plan)
    const statePlanData = this.wizardStateService.getStepData(this.previousStepNumber);
    if (statePlanData && statePlanData.state) {
      const stateValue = statePlanData.state;
      this.serviceDataForm.get('state')?.setValue(stateValue);
    }
    
    if (savedData && savedData.state) {
      this.serviceDataForm.get('state')?.setValue(savedData.state);
    }

    // Guardar datos cuando el formulario cambia
    this.formSubscription = this.serviceDataForm.valueChanges.subscribe(() => {
      this.saveStepData();
    });

    // Emitir la sección inicial
    this.sectionChanged.emit(this.currentSection);
  }

  ngOnDestroy(): void {
    this.wizardStateService.unregisterForm(this.stepNumber);
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  /**
   * Guarda los datos del paso
   */
  private saveStepData(): void {
    this.wizardStateService.setStepData(this.stepNumber, this.serviceDataForm.value);
  }

  /**
   * Inicializa el formulario de renovación LLC
   */
  private initializeRenovacionLlcForm(group: FormGroup): void {
    group.addControl('llcName', this.fb.control(''));
    group.addControl('state', this.fb.control(''));
    group.addControl('llcType', this.fb.control(''));
    group.addControl('mainActivity', this.fb.control(''));
    group.addControl('hasPropertyInUSA', this.fb.control(''));
    group.addControl('almacenaProductosDepositoUSA', this.fb.control(''));
    group.addControl('contrataServiciosUSA', this.fb.control(''));
    group.addControl('tieneCuentasBancarias', this.fb.control(''));
    group.addControl('einNumber', this.fb.control(''));
    group.addControl('countriesWhereLLCDoesBusiness', this.fb.control([]));
    group.addControl('llcCreationDate', this.fb.control(''));
    group.addControl('declaracionInicial', this.fb.control(false));
    group.addControl('declaracionAnoCorriente', this.fb.control(false));
    group.addControl('cambioDireccionRA', this.fb.control(false));
    group.addControl('cambioNombre', this.fb.control(false));
    group.addControl('declaracionAnosAnteriores', this.fb.control(false));
    group.addControl('agregarCambiarSocio', this.fb.control(false));
    group.addControl('declaracionCierre', this.fb.control(false));
    group.addControl('owners', this.fb.array([]));
    group.addControl('llcOpeningCost', this.fb.control(''));
    group.addControl('paidToFamilyMembers', this.fb.control(''));
    group.addControl('paidToLocalCompanies', this.fb.control(''));
    group.addControl('paidForLLCFormation', this.fb.control(''));
    group.addControl('paidForLLCDissolution', this.fb.control(''));
    group.addControl('bankAccountBalanceEndOfYear', this.fb.control(''));
    group.addControl('totalRevenue2025', this.fb.control(''));
    group.addControl('hasFinancialInvestmentsInUSA', this.fb.control(''));
    group.addControl('hasFiledTaxesBefore', this.fb.control(''));
    group.addControl('wasConstitutedWithStartCompanies', this.fb.control(''));
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
    const input = event.event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.fileUploadStates[event.fileKey] = {
      file: file,
      uploading: false,
      progress: 0
    };

    const control = this.serviceDataForm.get(event.formControlPath);
    if (control) {
      control.setValue(file.name);
    }
  }

  /**
   * Limpia un archivo
   */
  onFileCleared(event: { fileKey: string; formControlPath: string; inputId: string }): void {
    delete this.fileUploadStates[event.fileKey];
    const control = this.serviceDataForm.get(event.formControlPath);
    if (control) {
      control.setValue('');
    }
  }

  /**
   * Agrega un propietario
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
   * Elimina un propietario
   */
  onRemoveOwnerRequested(index: number): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    if (ownersArray && ownersArray.length > index) {
      ownersArray.removeAt(index);
    }
  }

  /**
   * Navega a la sección anterior
   */
  goToPreviousSection(): void {
    if (this.currentSection > 1) {
      this.currentSection--;
      this.sectionChanged.emit(this.currentSection);
    }
  }

  /**
   * Navega a la siguiente sección
   */
  goToNextSection(): void {
    if (this.currentSection < this.totalSections) {
      this.currentSection++;
      this.sectionChanged.emit(this.currentSection);
    }
  }
}

