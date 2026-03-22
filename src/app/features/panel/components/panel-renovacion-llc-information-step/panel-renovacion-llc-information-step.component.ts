import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RequestFlowStateService } from '../../../../shared/services/request-flow-state.service';
import { RequestFlowStep } from '../../../../shared/models/request-flow-context';
import { RenovacionLlcFormComponent } from '../../../../shared/components/service-forms/renovacion-llc-form/renovacion-llc-form.component';
import { RequestsService } from '../../services/requests.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { US_STATES } from '../../../../shared/constants/us-states.constant';
import { ServiceFormBuilderService } from '../../../../shared/services/form-builder.service';
import { LoggerService } from '../../../../shared/services/logger.service';

/**
 * Componente wrapper para usar renovacion-llc-form en el panel.
 * Usa RequestFlowStateService (no WizardStateService) y RequestsService para API.
 */
@Component({
  selector: 'app-panel-renovacion-llc-information-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RenovacionLlcFormComponent],
  templateUrl: './panel-renovacion-llc-information-step.component.html',
  styleUrls: ['./panel-renovacion-llc-information-step.component.css']
})
export class PanelRenovacionLlcInformationStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 1;
  @Input() context: string = 'panel';
  @Input() serviceType: string = 'renovacion-llc';
  @Input() previousStepNumber: number = 0;
  @Input() requestId?: number;
  @Input() initialData?: any;
  @Input() flowStepNumber?: number;

  @Output() sectionChanged = new EventEmitter<number>();
  @Output() stepValid = new EventEmitter<boolean>();
  @Output() nextStepRequested = new EventEmitter<void>();

  serviceDataForm!: FormGroup;
  currentSection = 1;
  totalSections = 5;
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};
  usStates = US_STATES;

  llcTypes = [
    { value: 'single', label: 'Single Member LLC', description: 'LLC con un solo miembro' },
    { value: 'multi', label: 'Multi Member LLC', description: 'LLC con múltiples miembros' }
  ];

  private formSubscription?: Subscription;
  isSaving = false;
  saveError: string | null = null;

  constructor(
    private flowStateService: RequestFlowStateService,
    private requestsService: RequestsService,
    private fb: FormBuilder,
    private http: HttpClient,
    private serviceFormBuilder: ServiceFormBuilderService,
    private logger: LoggerService
  ) {
    this.serviceDataForm = this.serviceFormBuilder.createRenovacionLlcForm();
  }

  ngOnInit(): void {
    const savedData = this.flowStateService.getStepData(RequestFlowStep.SERVICE_FORM);
    const dataToLoad = this.initialData || savedData;

    if (dataToLoad && Object.keys(dataToLoad).length > 0) {
      const { owners, currentSection, ...otherData } = dataToLoad;
      this.serviceDataForm.patchValue(otherData);
      if (currentSection) {
        this.currentSection = currentSection;
      }
      if (owners && Array.isArray(owners) && owners.length > 0) {
        const ownersArray = this.serviceDataForm.get('owners') as FormArray;
        ownersArray.clear();
        owners.forEach((ownerData: any) => {
          const ownerGroup = this.createOwnerFormGroup();
          ownerGroup.patchValue(ownerData);
          ownersArray.push(ownerGroup);
        });
      }
    }

    // Pre-llenar estado desde paso anterior (STATE_SELECTION)
    const stateData = this.flowStateService.getStepData(RequestFlowStep.STATE_SELECTION);
    if (stateData?.state) {
      this.serviceDataForm.get('state')?.setValue(stateData.state, { emitEvent: false });
    }
    if (stateData?.llcType) {
      this.serviceDataForm.get('llcType')?.setValue(stateData.llcType, { emitEvent: false });
    }

    // Inicializar propietarios si hay llcType pero no hay owners
    setTimeout(() => {
      const llcType = this.serviceDataForm.get('llcType')?.value;
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      if (llcType && ownersArray && ownersArray.length === 0) {
        this.onAddOwnerRequested();
      }
    }, 100);

    // Reaccionar a cambios de llcType
    this.serviceDataForm.get('llcType')?.valueChanges.subscribe((newLlcType: string) => {
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      if (!ownersArray) return;
      if (ownersArray.length === 0) {
        this.onAddOwnerRequested();
      } else if (newLlcType === 'single' && ownersArray.length > 1) {
        while (ownersArray.length > 1) {
          ownersArray.removeAt(ownersArray.length - 1);
        }
        (ownersArray.at(0) as FormGroup).get('participationPercentage')?.setValue(100, { emitEvent: false });
      } else if (newLlcType === 'single' && ownersArray.length === 1) {
        (ownersArray.at(0) as FormGroup).get('participationPercentage')?.setValue(100, { emitEvent: false });
      }
    });

    this.formSubscription = this.serviceDataForm.valueChanges.subscribe(() => {
      this.saveStepData();
      this.stepValid.emit(this.isSectionValid());
    });

    this.sectionChanged.emit(this.currentSection);
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }


  private createOwnerFormGroup(): FormGroup {
    const llcType = this.serviceDataForm.get('llcType')?.value;
    const defaultParticipation = llcType === 'single' ? 100 : 0;
    return this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      fullAddress: ['', Validators.required],
      unit: [''],
      city: ['', Validators.required],
      stateRegion: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
      nationality: ['', Validators.required],
      passportNumber: ['', Validators.required],
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
      participationPercentage: [defaultParticipation, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  private saveStepData(): void {
    this.flowStateService.setStepData(RequestFlowStep.SERVICE_FORM, {
      ...this.serviceDataForm.value,
      currentSection: this.currentSection
    });
  }

  isSectionValid(): boolean {
    if (this.currentSection === 1) {
      return !!(this.serviceDataForm.get('llcName')?.valid && this.serviceDataForm.get('llcType')?.valid);
    }
    if (this.currentSection === 2) {
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      const llcType = this.serviceDataForm.get('llcType')?.value;
      const minOwners = llcType === 'multi' ? 2 : 1;
      if (!ownersArray || ownersArray.length < minOwners) return false;
      return ownersArray.controls.every(owner => owner.valid);
    }

    if (this.currentSection === 5) {
      // Sección 5: archivos adicionales si la LLC NO se constituyó con Start Companies
      const wasConstituted = this.serviceDataForm.get('wasConstitutedWithStartCompanies')?.value;
      if (wasConstituted === 'no') {
        return !!(
          this.serviceDataForm.get('form147Or575FileUrl')?.valid &&
          this.serviceDataForm.get('articlesOfOrganizationAdditionalFileUrl')?.valid
        );
      }

      return true;
    }

    return true;
  }

  markSectionAsTouched(): void {
    if (this.currentSection === 1) {
      this.serviceDataForm.get('llcName')?.markAsTouched();
      this.serviceDataForm.get('llcType')?.markAsTouched();
    }
    if (this.currentSection === 2) {
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      ownersArray?.controls.forEach(owner => (owner as FormGroup).markAllAsTouched());
    }

    if (this.currentSection === 5) {
      const wasConstituted = this.serviceDataForm.get('wasConstitutedWithStartCompanies')?.value;
      if (wasConstituted === 'no') {
        this.serviceDataForm.get('form147Or575FileUrl')?.markAsTouched();
        this.serviceDataForm.get('articlesOfOrganizationAdditionalFileUrl')?.markAsTouched();
      }
    }
  }

  goToPreviousSection(): void {
    if (this.currentSection > 1) {
      this.currentSection--;
      this.sectionChanged.emit(this.currentSection);
      this.saveStepData();
      this.stepValid.emit(this.isSectionValid());
    }
  }

  async goToNextSection(): Promise<void> {
    if (!this.isSectionValid()) {
      this.markSectionAsTouched();
      return;
    }
    if (this.currentSection < this.totalSections) {
      await this.saveToApi();
      this.currentSection++;
      if (this.currentSection === 2) {
        const ownersArray = this.serviceDataForm.get('owners') as FormArray;
        if (this.serviceDataForm.get('llcType')?.value && ownersArray?.length === 0) {
          this.onAddOwnerRequested();
        }
      }
      this.sectionChanged.emit(this.currentSection);
      this.saveStepData();
      this.stepValid.emit(this.isSectionValid());
    }
  }

  async onLastSectionNext(): Promise<void> {
    if (!this.isSectionValid()) {
      this.markSectionAsTouched();
      return;
    }
    this.saveStepData();
    await this.saveToApi();
    if (this.saveError) {
      return;
    }
    this.nextStepRequested.emit();
  }

  async saveToApi(): Promise<void> {
    if (!this.requestId) return;
    this.isSaving = true;
    this.saveError = null;
    try {
      const formData = this.serviceDataForm.getRawValue() as Record<string, unknown>;
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      const members = ownersArray ? ownersArray.controls.map((ctrl: any) => {
        const v = (ctrl as FormGroup).getRawValue();
        return {
          firstName: v.name || '',
          name: v.name || '',
          lastName: v.lastName || '',
          dateOfBirth: v.dateOfBirth || '',
          email: v.email || '',
          phone: v.phone || '',
          phoneNumber: v.phone || '',
          fullAddress: v.fullAddress || '',
          unit: v.unit || '',
          city: v.city || '',
          stateRegion: v.stateRegion || '',
          postalCode: v.postalCode || '',
          country: v.country || '',
          passportNumber: v.passportNumber || '',
          nationality: v.nationality || '',
          ssnItin: v.ssnItin || '',
          cuit: v.cuit || '',
          capitalContributions2025: v.capitalContributions2025 || 0,
          loansToLLC2025: v.loansToLLC2025 || 0,
          loansRepaid2025: v.loansRepaid2025 || 0,
          capitalWithdrawals2025: v.capitalWithdrawals2025 || 0,
          hasInvestmentsInUSA: v.hasInvestmentsInUSA || '',
          isUSCitizen: v.isUSCitizen || '',
          taxCountry: v.taxCountry || '',
          wasInUSA31Days2025: v.wasInUSA31Days2025 || '',
          participationPercentage: v.participationPercentage || 0,
          percentageOfParticipation: v.participationPercentage || 0,
        };
      }) : [];
      const { owners: _owners, ...restOfFormData } = formData;
      const payload: any = {
        type: 'renovacion-llc',
        currentStepNumber: this.currentSection,
        renovacionLlcData: { ...restOfFormData, members }
      };
      if (typeof this.flowStepNumber === 'number' && this.flowStepNumber >= 1) {
        payload.currentStep = this.flowStepNumber;
      }
      await this.requestsService.updateRequest(this.requestId, payload);
    } catch (error: any) {
      this.logger.error('[PanelRenovacionLlcInformationStep] Error al guardar:', error);
      this.saveError = error?.error?.message || 'Error al guardar los datos';
    } finally {
      this.isSaving = false;
    }
  }

  async onFileSelected(event: { event: Event; formControlPath: string; fileKey: string }): Promise<void> {
    const input = event.event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    await this.uploadFile(input.files[0], event.formControlPath, event.fileKey);
  }

  async uploadFile(file: File, formControlPath: string, fileKey: string): Promise<void> {
    if (!file) return;
    this.fileUploadStates[fileKey] = { file, uploading: true, progress: 0 };
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('servicio', 'renovacion-llc');
      if (this.requestId) formData.append('requestUuid', this.requestId.toString());
      const response = await firstValueFrom(
        this.http.post<{ url: string; key: string; message: string }>(`${environment.apiUrl}/upload-file`, formData)
      );
      if (response?.url) {
        const control = this.findFormControl(formControlPath);
        if (control) {
          control.setValue(response.url, { emitEvent: true });
          control.markAsTouched();
          control.markAsDirty();
        }
        this.fileUploadStates[fileKey].file = null;
      }
    } catch (error: any) {
      this.logger.error(`[PanelRenovacionLlcInformationStep] Error al subir archivo ${fileKey}:`, error);
      this.fileUploadStates[fileKey].file = null;
    } finally {
      this.fileUploadStates[fileKey].uploading = false;
      this.fileUploadStates[fileKey].progress = 0;
    }
  }

  findFormControl(path: string): any {
    if (!path.includes('.')) return this.serviceDataForm.get(path);
    const parts = path.split('.');
    let current: any = this.serviceDataForm;
    for (const part of parts) {
      if (current instanceof FormArray) {
        current = current.at(parseInt(part, 10));
      } else if (current instanceof FormGroup) {
        current = current.get(part);
      } else {
        return null;
      }
      if (!current) return null;
    }
    return current;
  }

  onFileCleared(event: { fileKey: string; formControlPath: string; inputId: string }): void {
    delete this.fileUploadStates[event.fileKey];
    this.serviceDataForm.get(event.formControlPath)?.setValue('');
  }

  onAddOwnerRequested(): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    ownersArray.push(this.createOwnerFormGroup());
  }

  onRemoveOwnerRequested(index: number): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    if (ownersArray && ownersArray.length > index) {
      ownersArray.removeAt(index);
    }
  }

  validate(): boolean {
    this.markSectionAsTouched();
    return this.isSectionValid();
  }

  getFormData(): any {
    return { ...this.serviceDataForm.getRawValue(), currentSection: this.currentSection };
  }
}
