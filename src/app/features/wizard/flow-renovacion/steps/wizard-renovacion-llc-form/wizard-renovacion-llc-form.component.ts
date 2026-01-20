import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IntlTelInputComponent } from '../../../../../shared/components/intl-tel-input/intl-tel-input.component';

@Component({
  selector: 'app-wizard-renovacion-llc-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IntlTelInputComponent],
  templateUrl: './wizard-renovacion-llc-form.component.html',
  styleUrl: './wizard-renovacion-llc-form.component.css'
})
export class WizardRenovacionLlcFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() serviceDataForm!: FormGroup;
  @Input() usStates: any[] = [];
  @Input() llcTypes: any[] = [];
  @Input() fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};
  
  // Lista de países para el select múltiple
  countries: string[] = [
    'Åland Islands', 'Afghanistan', 'Akrotiri', 'Albania', 'Algeria', 'American Samoa', 'Andorra', 'Angola', 'Anguilla', 'Antarctica',
    'Antigua and Barbuda', 'Argentina', 'Armenia', 'Aruba', 'Ashmore and Cartier Islands', 'Australia', 'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh',
    'Barbados', 'Bassas Da India', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bermuda', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
    'Botswana', 'Bouvet Island', 'Brazil', 'British Indian Ocean Territory', 'British Virgin Islands', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burma', 'Burundi',
    'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Caribbean Netherlands', 'Cayman Islands', 'Central African Republic', 'Chad', 'Chile', 'China',
    'Christmas Island', 'Clipperton Island', 'Cocos (Keeling) Islands', 'Colombia', 'Comoros', 'Cook Islands', 'Coral Sea Islands', 'Costa Rica', 'Cote D\'Ivoire', 'Croatia',
    'Cuba', 'Curaçao', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Dhekelia', 'Djibouti', 'Dominica', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Europa Island', 'Falkland Islands (Islas Malvinas)', 'Faroe Islands',
    'Federated States of Micronesia', 'Fiji', 'Finland', 'France', 'French Guiana', 'French Polynesia', 'French Southern and Antarctic Lands', 'Gabon', 'Gaza Strip', 'Georgia',
    'Germany', 'Ghana', 'Gibraltar', 'Glorioso Islands', 'Greece', 'Greenland', 'Grenada', 'Guadeloupe', 'Guam', 'Guatemala',
    'Guernsey', 'Guinea', 'Guinea-bissau', 'Guyana', 'Haiti', 'Heard Island and Mcdonald Islands', 'Holy See (Vatican City)', 'Honduras', 'Hong Kong', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Isle of Man', 'Israel', 'Italy', 'Jamaica',
    'Jan Mayen', 'Japan', 'Jersey', 'Jordan', 'Juan De Nova Island', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait',
    'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Macau', 'Macedonia', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Martinique',
    'Mauritania', 'Mauritius', 'Mayotte', 'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Montserrat', 'Morocco',
    'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Navassa Island', 'Nepal', 'Netherlands', 'Netherlands Antilles', 'New Caledonia', 'New Zealand',
    'Nicaragua', 'Niger', 'Nigeria', 'Niue', 'Norfolk Island', 'North Korea', 'Northern Mariana Islands', 'Norway', 'Oman', 'Pakistan',
    'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paracel Islands', 'Paraguay', 'Peru', 'Philippines', 'Pitcairn Islands', 'Poland',
    'Portugal', 'Puerto Rico', 'Qatar', 'Republic of the Congo', 'Reunion', 'Romania', 'Russia', 'Rwanda', 'Saint BarthÃ©lemy', 'Saint Helena',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Martin', 'Saint Pierre and Miquelon', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
    'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Sint Maarten', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
    'South Georgia and the South Sandwich Islands', 'South Korea', 'South Sudan', 'Spain', 'Spratly Islands', 'Sri Lanka', 'Sudan', 'Suriname', 'Svalbard', 'Swaziland',
    'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'The Bahamas', 'The Gambia', 'Timor-leste',
    'Togo', 'Tokelau', 'Tonga', 'Trinidad and Tobago', 'Tromelin Island', 'Tunisia', 'Turkey', 'Turkmenistan', 'Turks and Caicos Islands', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam',
    'Virgin Islands', 'Wake Island', 'Wallis and Futuna', 'West Bank', 'Western Sahara', 'Yemen', 'Zambia', 'Zimbabwe'
  ];
  
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
  @Output() addMemberRequested = new EventEmitter<void>();
  @Output() removeMemberRequested = new EventEmitter<number>();
  @Output() addOwnerRequested = new EventEmitter<void>();
  @Output() removeOwnerRequested = new EventEmitter<number>();

  totalSections = 5; // Total de secciones para Renovación LLC
  currentYear = new Date().getFullYear();
  
  private destroy$ = new Subject<void>();
  private llcTypeSubscriptionSet = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Inicializar un propietario si el array está vacío y estamos en el paso 2
    this.ensureOwnerExists();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Detectar cambios en currentSection para forzar actualización
    if (changes['currentSection']) {
      const newValue = Number(changes['currentSection'].currentValue);
      if (newValue !== this._currentSection) {
        this._currentSection = newValue;
        // Si cambiamos al paso 2, asegurar que existe al menos un propietario
        if (newValue === 2) {
          setTimeout(() => {
            this.ensureOwnerExists();
          }, 100);
        }
      }
    }
    
    // Si cambia el tipo de LLC, ajustar propietarios (solo una vez)
    if (changes['serviceDataForm'] && this.serviceDataForm && !this.llcTypeSubscriptionSet) {
      const llcTypeControl = this.serviceDataForm.get('llcType');
      if (llcTypeControl) {
        this.llcTypeSubscriptionSet = true;
        llcTypeControl.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe((llcType: string) => {
            this.handleLlcTypeChangeForOwners(llcType);
          });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Asegura que existe al menos un propietario en el array
   */
  private ensureOwnerExists(): void {
    try {
      const ownersArray = this.ownersFormArray;
      if (ownersArray && ownersArray.length === 0 && this.currentSection === 2) {
        // Emitir evento para que el componente padre agregue el propietario
        this.addOwnerRequested.emit();
      }
    } catch (error) {
      console.error('Error al verificar ownersFormArray:', error);
      // Si hay error, intentar emitir el evento de todas formas
      if (this.currentSection === 2) {
        this.addOwnerRequested.emit();
      }
    }
  }

  /**
   * Maneja el cambio de tipo de LLC para propietarios
   * Si es 'single', asegura que hay exactamente 1 propietario
   * Si es 'multi', permite múltiples propietarios
   */
  private handleLlcTypeChangeForOwners(llcType: string): void {
    const ownersArray = this.ownersFormArray;
    if (!ownersArray) return;
    
    if (llcType === 'single') {
      // Si es single y no hay propietarios, crear uno automáticamente
      if (ownersArray.length === 0) {
        this.addOwnerRequested.emit();
      } else if (ownersArray.length > 1) {
        // Si hay más de 1 propietario, eliminar los extras y dejar solo el primero
        while (ownersArray.length > 1) {
          this.removeOwnerRequested.emit(ownersArray.length - 1);
        }
      }
    }
    // Si es 'multi', no hacer nada especial, el usuario puede agregar propietarios manualmente
  }

  get membersFormArray(): FormArray {
    return this.serviceDataForm.get('members') as FormArray;
  }

  get ownersFormArray(): FormArray | null {
    if (!this.serviceDataForm) {
      return null;
    }
    const ownersControl = this.serviceDataForm.get('owners');
    return ownersControl as FormArray | null;
  }

  getFileUploadState(key: string): { file: File | null; uploading: boolean; progress: number } {
    return this.fileUploadStates[key] || { file: null, uploading: false, progress: 0 };
  }

  getResponsiblePersonForm(): FormGroup | null {
    return this.serviceDataForm?.get('responsiblePerson') as FormGroup | null;
  }

  getRegisteredAgentInfoForm(): FormGroup | null {
    return this.serviceDataForm?.get('registeredAgentInfo') as FormGroup | null;
  }

  getMemberAddressForm(member: any): FormGroup | null {
    return member?.get('memberAddress') as FormGroup | null;
  }

  onFileSelected(event: Event, formControlPath: string, fileKey: string): void {
    this.fileSelected.emit({ event, formControlPath, fileKey });
  }

  clearFile(fileKey: string, formControlPath: string, inputId: string): void {
    this.fileCleared.emit({ fileKey, formControlPath, inputId });
  }

  addMember(): void {
    this.addMemberRequested.emit();
  }

  removeMember(index: number): void {
    this.removeMemberRequested.emit(index);
  }

  addOwner(): void {
    this.addOwnerRequested.emit();
  }

  removeOwner(index: number): void {
    this.removeOwnerRequested.emit(index);
  }
}

