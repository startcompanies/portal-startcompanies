import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { IntlTelInputComponent } from '../../../components/intl-tel-input/intl-tel-input.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { COUNTRY_NAMES } from '../../../constants/countries';
import { patchControlWithNormalizedPublicUrl } from '../../../validators/web-url.validator';

@Component({
  selector: 'app-cuenta-bancaria-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IntlTelInputComponent, TranslocoPipe],
  templateUrl: './cuenta-bancaria-form.component.html',
  styleUrl: './cuenta-bancaria-form.component.css'
})
export class CuentaBancariaFormComponent implements OnInit, OnChanges {
  @Input() serviceDataForm!: FormGroup;
  @Input() usStates: any[] = [];
  @Input() llcTypes: any[] = [];
  @Input() fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};
  
  readonly countries = COUNTRY_NAMES;
  
  private _currentSection: number = 1;
  
  @Input()
  set currentSection(value: number) {
    this._currentSection = Number(value);
  }
  
  get currentSection(): number {
    return this._currentSection;
  }
  
  @Output() fileSelected = new EventEmitter<{ event: Event; formControlPath: string; fileKey: string }>();
  @Output() fileCleared = new EventEmitter<{ fileKey: string; formControlPath: string; inputId: string }>();
  @Output() addOwnerRequested = new EventEmitter<void>();
  @Output() removeOwnerRequested = new EventEmitter<number>();

  totalSections = 6; // Total de secciones para Cuenta Bancaria

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Asegurar que hay al menos un propietario cuando se inicializa el paso 6
    if (this.currentSection === 6) {
      this.ensureOwnerExists();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentSection'] && this.currentSection === 6) {
      // Cuando se cambia al paso 6, asegurar que hay al menos un propietario
      setTimeout(() => {
        this.ensureOwnerExists();
      }, 100);
    }
  }

  get ownersFormArray(): FormArray | null {
    const formGroup = this.serviceDataForm;
    if (!formGroup) return null;
    const ownersControl = formGroup.get('owners');
    if (!ownersControl) return null;
    return ownersControl as FormArray;
  }

  get isMultiMember(): boolean {
    const isMultiMemberValue = this.serviceDataForm?.get('isMultiMember')?.value;
    return isMultiMemberValue === 'yes';
  }

  private ensureOwnerExists(): void {
    if (this.currentSection === 6) {
      const ownersArray = this.ownersFormArray;
      const isMultiMember = this.isMultiMember;
      
      if (!ownersArray || ownersArray.length === 0) {
        // Si no hay propietarios, crear según el tipo
        if (isMultiMember) {
          // Multi-member: crear 2 propietarios
          this.addOwnerRequested.emit();
          setTimeout(() => {
            this.addOwnerRequested.emit();
          }, 50);
        } else {
          // Single-member: crear 1 propietario
          this.addOwnerRequested.emit();
        }
      } else if (!isMultiMember && ownersArray.length > 1) {
        // Si es single-member y hay más de 1, eliminar extras
        while (ownersArray.length > 1) {
          this.removeOwnerRequested.emit(ownersArray.length - 1);
        }
      } else if (isMultiMember && ownersArray.length < 2) {
        // Si es multi-member y hay menos de 2, agregar hasta tener 2
        while (ownersArray.length < 2) {
          this.addOwnerRequested.emit();
        }
      }
    }
  }

  getFileUploadState(key: string): { file: File | null; uploading: boolean; progress: number } {
    return this.fileUploadStates[key] || { file: null, uploading: false, progress: 0 };
  }

  getCompanyAddressForm(): FormGroup | null {
    return this.serviceDataForm?.get('companyAddress') as FormGroup | null;
  }

  getOwnerPersonalAddressForm(): FormGroup | null {
    return this.serviceDataForm?.get('ownerPersonalAddress') as FormGroup | null;
  }

  getRegisteredAgentAddressForm(): FormGroup | null {
    return this.serviceDataForm?.get('registeredAgentAddress') as FormGroup | null;
  }

  onFileSelected(event: Event, formControlPath: string, fileKey: string): void {
    this.fileSelected.emit({ event, formControlPath, fileKey });
  }

  clearFile(fileKey: string, formControlPath: string, inputId: string): void {
    this.fileCleared.emit({ fileKey, formControlPath, inputId });
  }

  addOwner(): void {
    this.addOwnerRequested.emit();
  }

  removeOwner(index: number): void {
    this.removeOwnerRequested.emit(index);
  }

  onBlurNormalizePublicUrl(controlName: string): void {
    patchControlWithNormalizedPublicUrl(this.serviceDataForm?.get(controlName));
  }
}

