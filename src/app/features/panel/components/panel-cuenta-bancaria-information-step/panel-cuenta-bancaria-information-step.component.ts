import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RequestFlowStateService } from '../../../../shared/services/request-flow-state.service';
import { RequestFlowStep } from '../../../../shared/models/request-flow-context';
import { CuentaBancariaFormComponent } from '../../../../shared/components/service-forms/cuenta-bancaria-form/cuenta-bancaria-form.component';
import { RequestsService } from '../../services/requests.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { US_STATES } from '../../../../shared/constants/us-states.constant';
import { ServiceFormBuilderService } from '../../../../shared/services/form-builder.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { isMultiMemberParticipationTotal100 } from '../../../../shared/utils/member-participation-total.util';

/**
 * Componente wrapper para usar cuenta-bancaria-form en el panel.
 * Usa RequestFlowStateService (no WizardStateService) y RequestsService para API.
 */
@Component({
  selector: 'app-panel-cuenta-bancaria-information-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CuentaBancariaFormComponent],
  templateUrl: './panel-cuenta-bancaria-information-step.component.html',
  styleUrls: ['./panel-cuenta-bancaria-information-step.component.css']
})
export class PanelCuentaBancariaInformationStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 1;
  @Input() context: string = 'panel';
  @Input() serviceType: string = 'cuenta-bancaria';
  @Input() previousStepNumber: number = 0;
  @Input() requestId?: number;
  @Input() initialData?: any;
  @Input() flowStepNumber?: number;

  @Output() sectionChanged = new EventEmitter<number>();
  @Output() stepValid = new EventEmitter<boolean>();
  @Output() nextStepRequested = new EventEmitter<void>();
  @Output() requestCreated = new EventEmitter<{ requestId: number }>();

  serviceDataForm!: FormGroup;
  currentSection = 1;
  totalSections = 6;
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};

  /** ID del request creado en este paso cuando no existía (panel sin paso de pago para cuenta bancaria). */
  private _createdRequestId?: number;

  get isMultiMember(): boolean {
    return this.serviceDataForm.get('isMultiMember')?.value === 'yes';
  }

  get shouldShowSectionNavigation(): boolean {
    return this.currentSection < this.totalSections;
  }

  usStates = US_STATES;

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
    this.serviceDataForm = this.serviceFormBuilder.createCuentaBancariaForm();
  }

  ngOnInit(): void {
    const savedData = this.flowStateService.getStepData(RequestFlowStep.SERVICE_FORM);
    const dataToLoad = this.initialData || savedData;

    if (dataToLoad && Object.keys(dataToLoad).length > 0) {
      const { owners, currentSection, ...otherData } = dataToLoad;
      this.serviceDataForm.patchValue(otherData);
      if (currentSection) this.currentSection = currentSection;
      if (owners && Array.isArray(owners) && owners.length > 0) {
        const ownersArray = this.serviceDataForm.get('owners') as FormArray;
        ownersArray.clear();
        owners.forEach((ownerData: any) => {
          const ownerGroup = this.createOwnerFormGroup(ownerData.participationPercentage || 0);
          ownerGroup.patchValue(ownerData);
          ownersArray.push(ownerGroup);
        });
      }
    }

    // Inicializar propietarios según isMultiMember al arrancar
    const currentIsMultiMember = this.serviceDataForm.get('isMultiMember')?.value;
    if (currentIsMultiMember) {
      setTimeout(() => this.handleMultiMemberChange(currentIsMultiMember), 100);
    }

    // Reaccionar a cambios de isMultiMember
    this.serviceDataForm.get('isMultiMember')?.valueChanges.subscribe((value: string) => {
      this.handleMultiMemberChange(value);
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


  private createOwnerFormGroup(participationPercentage = 0): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      nationality: ['', Validators.required],
      passportNumber: ['', Validators.required],
      ssnItin: [''],
      cuit: [''],
      participationPercentage: [participationPercentage, [Validators.required, Validators.min(0), Validators.max(100)]],
      passportFileUrl: ['']
    });
  }

  private handleMultiMemberChange(isMultiMemberValue: string): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    const isMulti = isMultiMemberValue === 'yes';
    if (!ownersArray) return;

    if (!isMulti) {
      while (ownersArray.length > 1) ownersArray.removeAt(ownersArray.length - 1);
      if (ownersArray.length === 0) ownersArray.push(this.createOwnerFormGroup(100));
      (ownersArray.at(0) as FormGroup).get('participationPercentage')?.setValue(100, { emitEvent: false });
    } else {
      if (ownersArray.length === 0) {
        ownersArray.push(this.createOwnerFormGroup(0));
        ownersArray.push(this.createOwnerFormGroup(0));
      } else if (ownersArray.length === 1) {
        ownersArray.push(this.createOwnerFormGroup(0));
      }
    }
  }

  private saveStepData(): void {
    this.flowStateService.setStepData(RequestFlowStep.SERVICE_FORM, {
      ...this.serviceDataForm.value,
      currentSection: this.currentSection
    });
  }

  isSectionValid(): boolean {
    const f = this.serviceDataForm;
    switch (this.currentSection) {
      case 1:
        return !!(f.get('legalBusinessName')?.valid && f.get('industry')?.valid &&
                  f.get('numberOfEmployees')?.valid && f.get('briefDescription')?.valid);
      case 2:
        return !!(f.get('registeredAgentStreet')?.valid && f.get('registeredAgentCity')?.valid &&
                  f.get('registeredAgentState')?.valid && f.get('registeredAgentZipCode')?.valid);
      case 3:
        return !!(f.get('validatorTitle')?.valid && f.get('validatorFirstName')?.valid &&
                  f.get('validatorLastName')?.valid && f.get('validatorDateOfBirth')?.valid &&
                  f.get('validatorNationality')?.valid && f.get('validatorPassportNumber')?.valid &&
                  f.get('validatorWorkEmail')?.valid && f.get('validatorPhone')?.valid);
      case 4:
        return !!(f.get('ownerPersonalStreet')?.valid && f.get('ownerPersonalCity')?.valid &&
                  f.get('ownerPersonalState')?.valid && f.get('ownerPersonalCountry')?.valid &&
                  f.get('ownerPersonalPostalCode')?.valid);
      case 5:
        return !!f.get('isMultiMember')?.valid;
      case 6: {
        const ownersArray = f.get('owners') as FormArray;
        const minOwners = this.isMultiMember ? 2 : 1;
        if (!ownersArray || ownersArray.length < minOwners) return false;
        if (this.isMultiMember) {
          if (!isMultiMemberParticipationTotal100(ownersArray, 'participationPercentage')) {
            return false;
          }
        }
        return ownersArray.controls.every(owner => owner.valid);
      }
      default:
        return true;
    }
  }

  markSectionAsTouched(): void {
    const f = this.serviceDataForm;
    switch (this.currentSection) {
      case 1:
        ['legalBusinessName', 'industry', 'numberOfEmployees', 'briefDescription']
          .forEach(k => f.get(k)?.markAsTouched());
        break;
      case 2:
        ['registeredAgentStreet', 'registeredAgentCity', 'registeredAgentState', 'registeredAgentZipCode']
          .forEach(k => f.get(k)?.markAsTouched());
        break;
      case 3:
        ['validatorTitle', 'validatorFirstName', 'validatorLastName', 'validatorDateOfBirth',
         'validatorNationality', 'validatorPassportNumber', 'validatorWorkEmail', 'validatorPhone']
          .forEach(k => f.get(k)?.markAsTouched());
        break;
      case 4:
        ['ownerPersonalStreet', 'ownerPersonalCity', 'ownerPersonalState', 'ownerPersonalCountry', 'ownerPersonalPostalCode']
          .forEach(k => f.get(k)?.markAsTouched());
        break;
      case 5:
        f.get('isMultiMember')?.markAsTouched();
        break;
      case 6:
        (f.get('owners') as FormArray)?.controls.forEach(owner => (owner as FormGroup).markAllAsTouched());
        break;
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
    // Sección 5 sin multimember: saltar sección 6 y terminar paso
    if (this.currentSection === 5 && !this.isMultiMember) {
      const ok = await this.saveToApi();
      if (ok) {
        this.nextStepRequested.emit();
      }
      return;
    }
    if (this.currentSection < this.totalSections) {
      const ok = await this.saveToApi();
      if (!ok) {
        return;
      }
      this.currentSection++;
      if (this.currentSection === 6) {
        setTimeout(() => this.handleMultiMemberChange(this.serviceDataForm.get('isMultiMember')?.value), 100);
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
    const ok = await this.saveToApi();
    if (!ok) {
      return;
    }
    this.nextStepRequested.emit();
  }

  async saveToApi(): Promise<boolean> {
    this.saveError = null;

    let effectiveId = this._createdRequestId ?? this.requestId;

    if (!effectiveId) {
      // Crear request en el primer guardado (cuenta bancaria no tiene paso de pago en panel).
      try {
        const clientSelection = this.flowStateService.getStepData(RequestFlowStep.CLIENT_SELECTION) || {};
        const clientAssociation = this.flowStateService.getStepData(RequestFlowStep.CLIENT_ASSOCIATION) || {};
        const formData = this.serviceDataForm.getRawValue() as any;
        const validatorAsFirstMember = {
          firstName: formData.validatorFirstName || '',
          lastName: formData.validatorLastName || '',
          dateOfBirth: formData.validatorDateOfBirth || '',
          nationality: formData.validatorNationality || '',
          passportNumber: formData.validatorPassportNumber || '',
          email: formData.validatorWorkEmail || '',
          phoneNumber: formData.validatorPhone || '',
          scannedPassportUrl: formData.validatorPassportUrl || '',
          memberAddress: {
            street: formData.ownerPersonalStreet || '',
            unit: formData.ownerPersonalUnit || '',
            city: formData.ownerPersonalCity || '',
            stateRegion: formData.ownerPersonalState || '',
            postalCode: formData.ownerPersonalPostalCode || '',
            country: formData.ownerPersonalCountry || ''
          },
          percentageOfParticipation: 100,
          validatesBankAccount: true,
          ssnOrItin: '',
          nationalTaxId: '',
          taxFilingCountry: '',
          ownerContributions: 0,
          ownerLoansToLLC: 0,
          loansReimbursedByLLC: 0,
          profitDistributions: 0,
          spentMoreThan31DaysInUS: '',
          hasUSFinancialInvestments: '',
          isUSCitizen: formData.isUSResident === 'yes' ? 'si' : 'no'
        };
        const additionalOwners = formData.owners || [];
        const allMembers = [validatorAsFirstMember, ...additionalOwners];

        const requestData: any = {
          type: 'cuenta-bancaria',
          status: 'pendiente',
          paymentMethod: null,
          paymentAmount: 0,
          cuentaBancariaData: { ...formData, owners: allMembers }
        };
        if (clientSelection.clientId) {
          requestData.clientId = clientSelection.clientId;
        } else if (clientAssociation.clientId) {
          requestData.clientId = clientAssociation.clientId;
        } else if (
          clientSelection.clientFirstName ||
          clientSelection.clientLastName ||
          clientSelection.clientEmail
        ) {
          requestData.clientId = 0;
          requestData.clientData = {
            firstName: clientSelection.clientFirstName || clientAssociation.firstName || '',
            lastName: clientSelection.clientLastName || clientAssociation.lastName || '',
            email: clientSelection.clientEmail || clientAssociation.email || '',
            phone: clientSelection.clientPhone || clientAssociation.phone || ''
          };
        }

        this.logger.log('[PanelCuentaBancariaInformationStep] Creando request (sin paso de pago)');
        const response = await this.requestsService.createRequest(requestData);
        if (!response?.id) {
          this.logger.error('[PanelCuentaBancariaInformationStep] createRequest no devolvió id');
          this.saveError = 'No se pudo crear la solicitud. Intenta de nuevo.';
          return false;
        }
        this._createdRequestId = response.id;
        this.requestCreated.emit({ requestId: response.id });
        effectiveId = response.id;
      } catch (error: any) {
        this.logger.error('[PanelCuentaBancariaInformationStep] Error al crear request:', error);
        this.saveError = error?.error?.message || 'Error al crear la solicitud';
        return false;
      }
    }

    this.isSaving = true;
    try {
      const formData = this.serviceDataForm.getRawValue() as any;
      const validatorAsFirstMember = {
        firstName: formData.validatorFirstName || '',
        lastName: formData.validatorLastName || '',
        dateOfBirth: formData.validatorDateOfBirth || '',
        nationality: formData.validatorNationality || '',
        passportNumber: formData.validatorPassportNumber || '',
        email: formData.validatorWorkEmail || '',
        phoneNumber: formData.validatorPhone || '',
        scannedPassportUrl: formData.validatorPassportUrl || '',
        memberAddress: {
          street: formData.ownerPersonalStreet || '',
          unit: formData.ownerPersonalUnit || '',
          city: formData.ownerPersonalCity || '',
          stateRegion: formData.ownerPersonalState || '',
          postalCode: formData.ownerPersonalPostalCode || '',
          country: formData.ownerPersonalCountry || ''
        },
        percentageOfParticipation: 100,
        validatesBankAccount: true,
        ssnOrItin: '',
        nationalTaxId: '',
        taxFilingCountry: '',
        ownerContributions: 0,
        ownerLoansToLLC: 0,
        loansReimbursedByLLC: 0,
        profitDistributions: 0,
        spentMoreThan31DaysInUS: '',
        hasUSFinancialInvestments: '',
        isUSCitizen: formData.isUSResident === 'yes' ? 'si' : 'no'
      };
      const additionalOwners = formData.owners || [];
      const allMembers = [validatorAsFirstMember, ...additionalOwners];
      const payload: any = {
        type: 'cuenta-bancaria',
        currentStepNumber: this.currentSection,
        cuentaBancariaData: { ...formData, owners: allMembers }
      };
      if (typeof this.flowStepNumber === 'number' && this.flowStepNumber >= 1) {
        payload.currentStep = this.flowStepNumber;
      }
      await this.requestsService.updateRequest(effectiveId, payload);
      return true;
    } catch (error: any) {
      this.logger.error('[PanelCuentaBancariaInformationStep] Error al guardar:', error);
      this.saveError = error?.error?.message || 'Error al guardar los datos';
      return false;
    } finally {
      this.isSaving = false;
    }
  }

  async onFileSelected(event: { event: Event; formControlPath: string; fileKey: string }): Promise<void> {
    const input = event.event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    await this.uploadFile(input.files[0], event.formControlPath, event.fileKey);
  }

  async onOwnerFileSelected(event: { event: Event; ownerIndex: number; formControlPath: string; fileKey: string }): Promise<void> {
    const input = event.event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    await this.uploadFile(
      input.files[0],
      `owners.${event.ownerIndex}.${event.formControlPath}`,
      `owner${event.ownerIndex}_${event.fileKey}`
    );
  }

  async uploadFile(file: File, formControlPath: string, fileKey: string): Promise<void> {
    if (!file) return;
    this.fileUploadStates[fileKey] = { file, uploading: true, progress: 0 };
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('servicio', 'cuenta-bancaria');
      const effectiveRequestId = this._createdRequestId ?? this.requestId;
      if (effectiveRequestId) formData.append('requestUuid', effectiveRequestId.toString());
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
      this.logger.error(`[PanelCuentaBancariaInformationStep] Error al subir archivo ${fileKey}:`, error);
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

  onOwnerFileCleared(event: { ownerIndex: number; formControlPath: string; fileKey: string; inputId: string }): void {
    const fileKey = `owner${event.ownerIndex}_${event.fileKey}`;
    delete this.fileUploadStates[fileKey];
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    (ownersArray?.at(event.ownerIndex) as FormGroup)?.get(event.formControlPath)?.setValue('');
  }

  onAddOwnerRequested(): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    const defaultParticipation = this.isMultiMember ? 0 : 100;
    ownersArray.push(this.createOwnerFormGroup(defaultParticipation));
  }

  onRemoveOwnerRequested(index: number): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    if (!ownersArray || ownersArray.length <= index) return;
    if (!this.isMultiMember && ownersArray.length === 1) return;
    if (this.isMultiMember && ownersArray.length <= 2) return;
    ownersArray.removeAt(index);
  }

  validate(): boolean {
    this.markSectionAsTouched();
    return this.isSectionValid();
  }

  getFormData(): any {
    return { ...this.serviceDataForm.getRawValue(), currentSection: this.currentSection };
  }
}
