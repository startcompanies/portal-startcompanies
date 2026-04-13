import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { IntlTelInputComponent } from '../../../components/intl-tel-input/intl-tel-input.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { COUNTRY_NAMES } from '../../../constants/countries';
import { patchControlWithNormalizedPublicUrl } from '../../../validators/web-url.validator';
import { isPassportPhotoRequired } from '../../../utils/passport-photo-file.util';

/**
 * Formulario compartido para Apertura LLC
 * Componente presentacional puro - sin lógica de negocio
 * Usado tanto en wizard como en panel
 */
@Component({
  selector: 'app-apertura-llc-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IntlTelInputComponent, TranslocoPipe],
  templateUrl: './apertura-llc-form.component.html',
  styleUrl: './apertura-llc-form.component.css'
})
export class AperturaLlcFormComponent implements OnInit, OnChanges {
  @Input() serviceDataForm!: FormGroup;
  @Input() usStates: any[] = [];
  @Input() fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};
  @Input() forceSingleMember: boolean = false;
  
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
  @Output() memberFileSelected = new EventEmitter<{ event: Event; memberIndex: number; formControlPath: string; fileKey: string }>();
  @Output() fileCleared = new EventEmitter<{ fileKey: string; formControlPath: string; inputId: string }>();
  @Output() memberFileCleared = new EventEmitter<{ memberIndex: number; formControlPath: string; fileKey: string; inputId: string }>();
  @Output() llcTypeChanged = new EventEmitter<string>();
  @Output() addMemberRequested = new EventEmitter<void>();
  @Output() removeMemberRequested = new EventEmitter<number>();

  totalSections = 3; // Total de secciones para Apertura LLC

  constructor() {}

  ngOnInit(): void {
    // Suscribirse a cambios en llcType
    const llcTypeControl = this.serviceDataForm.get('llcType');
    if (llcTypeControl) {
      llcTypeControl.valueChanges.subscribe((llcType: string) => {
        this.llcTypeChanged.emit(llcType);
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Detectar cambios en currentSection para forzar actualización
    if (changes['currentSection']) {
      const newValue = Number(changes['currentSection'].currentValue);
      if (newValue !== this._currentSection) {
        this._currentSection = newValue;
      }
    }
  }

  get membersFormArray(): FormArray | null {
    const membersArray = this.serviceDataForm.get('members') as FormArray;
    return membersArray || null;
  }

  /**
   * Verifica si se debe mostrar la sección de miembros
   */
  shouldShowMembersSection(): boolean {
    const llcType = this.serviceDataForm.get('llcType')?.value;
    const hasMembersArray = !!this.membersFormArray;
    return (llcType === 'single' || llcType === 'multi') && hasMembersArray;
  }

  isSingleMember(): boolean {
    return this.serviceDataForm?.get('llcType')?.value === 'single';
  }

  isMultiMember(): boolean {
    return this.serviceDataForm?.get('llcType')?.value === 'multi';
  }

  isPassportPhotoRequiredForRow(memberIndex: number): boolean {
    const llcType = this.serviceDataForm?.get('llcType')?.value;
    return isPassportPhotoRequired(llcType, memberIndex);
  }

  getFileUploadState(key: string): { file: File | null; uploading: boolean; progress: number } {
    return this.fileUploadStates[key] || { file: null, uploading: false, progress: 0 };
  }

  getMemberAddressForm(member: any): FormGroup | null {
    return member?.get('memberAddress') as FormGroup | null;
  }

  onFileSelected(event: Event, formControlPath: string, fileKey: string): void {
    this.fileSelected.emit({ event, formControlPath, fileKey });
  }

  onMemberFileSelected(event: Event, memberIndex: number, formControlPath: string, fileKey: string): void {
    this.memberFileSelected.emit({ event, memberIndex, formControlPath, fileKey });
  }

  clearFile(fileKey: string, formControlPath: string, inputId: string): void {
    this.fileCleared.emit({ fileKey, formControlPath, inputId });
  }

  clearMemberFile(memberIndex: number, formControlPath: string, fileKey: string, inputId: string): void {
    this.memberFileCleared.emit({ memberIndex, formControlPath, fileKey, inputId });
  }

  addMember(): void {
    this.addMemberRequested.emit();
  }

  removeMember(index: number): void {
    this.removeMemberRequested.emit(index);
  }

  /**
   * Obtiene el label del estado con su abreviación
   */
  getStateLabelWithAbbreviation(stateValue: string): string {
    const state = this.usStates.find(s => s.value === stateValue);
    if (state) {
      return `${state.label} (${state.abbreviation})`;
    }
    return stateValue;
  }

  onBlurNormalizePublicUrl(controlName: string): void {
    patchControlWithNormalizedPublicUrl(this.serviceDataForm?.get(controlName));
  }
}
