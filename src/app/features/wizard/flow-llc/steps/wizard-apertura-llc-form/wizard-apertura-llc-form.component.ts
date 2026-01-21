import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IntlTelInputComponent } from '../../../../../shared/components/intl-tel-input/intl-tel-input.component';

@Component({
  selector: 'app-wizard-apertura-llc-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IntlTelInputComponent],
  templateUrl: './wizard-apertura-llc-form.component.html',
  styleUrl: './wizard-apertura-llc-form.component.css'
})
export class WizardAperturaLlcFormComponent implements OnInit, OnChanges {
  @Input() serviceDataForm!: FormGroup;
  @Input() usStates: any[] = [];
  @Input() fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};
  @Input() forceSingleMember: boolean = false;
  
  // Lista de países/nacionalidades
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
  @Output() memberFileSelected = new EventEmitter<{ event: Event; memberIndex: number; formControlPath: string; fileKey: string }>();
  @Output() fileCleared = new EventEmitter<{ fileKey: string; formControlPath: string; inputId: string }>();
  @Output() memberFileCleared = new EventEmitter<{ memberIndex: number; formControlPath: string; fileKey: string; inputId: string }>();
  @Output() llcTypeChanged = new EventEmitter<string>();
  @Output() addMemberRequested = new EventEmitter<void>();
  @Output() removeMemberRequested = new EventEmitter<number>();

  totalSections = 3; // Total de secciones para Apertura LLC

  constructor(private fb: FormBuilder) {}

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

}

