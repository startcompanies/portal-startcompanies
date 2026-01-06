import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WizardStateService } from '../../../services/wizard-state.service';
import { WizardCuentaBancariaFormComponent } from '../wizard-cuenta-bancaria-form/wizard-cuenta-bancaria-form.component';
import { Subscription } from 'rxjs';

/**
 * Componente wrapper para usar wizard-cuenta-bancaria-form en el wizard
 * Este componente inicializa el formulario y maneja la integración con el wizard
 */
@Component({
  selector: 'app-wizard-cuenta-bancaria-information-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, WizardCuentaBancariaFormComponent],
  templateUrl: './wizard-cuenta-bancaria-information-step.component.html',
  styleUrls: ['./wizard-cuenta-bancaria-information-step.component.css']
})
export class WizardCuentaBancariaInformationStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 2;
  @Input() previousStepNumber: number = 1;
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

  totalSections = 6; // Total de secciones para Cuenta Bancaria

  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService,
    private fb: FormBuilder
  ) {
    // Inicializar formulario con estructura de cuenta-bancaria-form
    this.serviceDataForm = this.fb.group({});
    this.initializeCuentaBancariaForm(this.serviceDataForm);
  }

  ngOnInit(): void {
    this.wizardStateService.registerForm(this.stepNumber, this.serviceDataForm);
    
    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.serviceDataForm.patchValue(savedData);
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
