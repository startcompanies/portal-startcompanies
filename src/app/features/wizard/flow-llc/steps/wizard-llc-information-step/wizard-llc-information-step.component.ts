import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WizardStateService } from '../../../services/wizard-state.service';
import { WizardAperturaLlcFormComponent } from '../wizard-apertura-llc-form/wizard-apertura-llc-form.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subscription } from 'rxjs';

/**
 * Componente wrapper para usar apertura-llc-form en el wizard
 * Este componente inicializa el formulario y maneja la integración con el wizard
 */
@Component({
  selector: 'app-wizard-llc-information-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, WizardAperturaLlcFormComponent, TranslocoPipe],
  templateUrl: './wizard-llc-information-step.component.html',
  styleUrls: ['./wizard-llc-information-step.component.css']
})
export class WizardLlcInformationStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 4;
  @Input() previousStepNumber: number = 3;
  @Output() sectionChanged = new EventEmitter<number>();

  serviceDataForm!: FormGroup;
  currentSection = 1;
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};
  
  // Lista de estados de USA (igual que en new-request)
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
    { value: 'Wyoming', label: 'Wyoming', abbreviation: 'WY' },
    { value: 'District of Columbia', label: 'District of Columbia', abbreviation: 'DC' },
  ];

  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService,
    private fb: FormBuilder
  ) {
    // Inicializar formulario con estructura de apertura-llc-form
    this.serviceDataForm = this.fb.group({
      llcType: [''],
      llcName: [''],
      llcNameOption2: [''],
      llcNameOption3: [''],
      businessDescription: [''],
      llcPhoneNumber: [''],
      website: [''],
      llcEmail: [''],
      linkedin: [''],
      incorporationState: [''], // Se establecerá desde el paso anterior
      incorporationDate: [''],
      hasEin: [false],
      einNumber: [''],
      einDocumentUrl: [''],
      noEinReason: [''],
      certificateOfFormationUrl: [''],
      accountType: [''],
      estadoConstitucion: [''],
      annualRevenue: [null],
      actividadFinancieraEsperada: [''],
      registeredAgentAddress: this.fb.group({
        street: [''],
        building: [''],
        city: [''],
        state: [''],
        postalCode: [''],
        country: ['']
      }),
      registeredAgentName: [''],
      registeredAgentEmail: [''],
      registeredAgentPhone: [''],
      registeredAgentType: [''],
      needsBankVerificationHelp: [false],
      bankAccountType: [''],
      bankName: [''],
      bankAccountNumber: [''],
      bankRoutingNumber: [''],
      bankStatementUrl: [''],
      serviceBillUrl: [''],
      periodicIncome10k: [''],
      bankAccountLinkedEmail: [''],
      bankAccountLinkedPhone: [''],
      projectOrCompanyUrl: [''],
      veracityConfirmation: [''],
      ownerNationality: [''],
      ownerCountryOfResidence: [''],
      ownerPersonalAddress: this.fb.group({
        street: [''],
        building: [''],
        city: [''],
        state: [''],
        postalCode: [''],
        country: ['']
      }),
      ownerPhoneNumber: [''],
      ownerEmail: [''],
      almacenaProductosDepositoUSA: [false],
      declaroImpuestosAntes: [false],
      llcConStartCompanies: [false],
      ingresosMayor250k: [false],
      activosEnUSA: [false],
      ingresosPeriodicos10k: [false],
      contrataServiciosUSA: [false],
      propiedadEnUSA: [false],
      tieneCuentasBancarias: [false],
      members: this.fb.array([])
    });
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
      // Establecer el estado en incorporationState (el estado viene del paso 2)
      const stateValue = statePlanData.state;
      this.serviceDataForm.get('incorporationState')?.setValue(stateValue);
      console.log('[WizardLlcInformationStep] Estado establecido desde paso anterior:', stateValue);
    }
    
    // También verificar si hay un estado guardado en los datos del paso actual
    if (savedData && savedData.incorporationState) {
      this.serviceDataForm.get('incorporationState')?.setValue(savedData.incorporationState);
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

    // Aquí se podría implementar la subida del archivo
    // Por ahora solo guardamos el estado
    const control = this.serviceDataForm.get(event.formControlPath);
    if (control) {
      control.setValue(file.name); // O la URL después de subir
    }
  }

  /**
   * Maneja la selección de archivos de miembros
   */
  onMemberFileSelected(event: { event: Event; memberIndex: number; formControlPath: string; fileKey: string }): void {
    const input = event.event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const fileKey = `member${event.memberIndex}_${event.fileKey}`;
    this.fileUploadStates[fileKey] = {
      file: file,
      uploading: false,
      progress: 0
    };

    const membersArray = this.serviceDataForm.get('members') as FormArray;
    const memberGroup = membersArray.at(event.memberIndex) as FormGroup;
    if (memberGroup) {
      const control = memberGroup.get(event.formControlPath);
      if (control) {
        control.setValue(file.name); // O la URL después de subir
      }
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
   * Limpia un archivo de miembro
   */
  onMemberFileCleared(event: { memberIndex: number; formControlPath: string; fileKey: string; inputId: string }): void {
    const fileKey = `member${event.memberIndex}_${event.fileKey}`;
    delete this.fileUploadStates[fileKey];
    const membersArray = this.serviceDataForm.get('members') as FormArray;
    const memberGroup = membersArray.at(event.memberIndex) as FormGroup;
    if (memberGroup) {
      const control = memberGroup.get(event.formControlPath);
      if (control) {
        control.setValue('');
      }
    }
  }

  /**
   * Agrega un miembro
   */
  addMember(): void {
    const membersArray = this.serviceDataForm.get('members') as FormArray;
    const memberGroup = this.fb.group({
      firstName: [''],
      lastName: [''],
      passportNumber: [''],
      scannedPassportUrl: [''],
      nationality: [''],
      dateOfBirth: [''],
      email: [''],
      phoneNumber: [''],
      percentageOfParticipation: [0],
      memberAddress: this.fb.group({
        street: [''],
        unit: [''],
        city: [''],
        stateRegion: [''],
        postalCode: [''],
        country: ['']
      }),
      ssnItin: [''],
      cuit: ['']
    });
    membersArray.push(memberGroup);
  }

  /**
   * Elimina un miembro
   */
  removeMember(index: number): void {
    const membersArray = this.serviceDataForm.get('members') as FormArray;
    if (membersArray.length > 1) {
      membersArray.removeAt(index);
    }
  }

  /**
   * Maneja el cambio de tipo de LLC
   */
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
    if (this.currentSection < 3) {
      this.currentSection++;
      this.sectionChanged.emit(this.currentSection);
    }
  }

  onLlcTypeChanged(llcType: string): void {
    const membersArray = this.serviceDataForm.get('members') as FormArray;
    
    if (llcType === 'single') {
      // Si cambia a single, mantener solo un miembro
      while (membersArray.length > 1) {
        membersArray.removeAt(membersArray.length - 1);
      }
      if (membersArray.length === 0) {
        this.addMember();
      }
    } else if (llcType === 'multi') {
      // Si cambia a multi, asegurar que hay al menos un miembro
      if (membersArray.length === 0) {
        this.addMember();
      }
    }
  }
}
