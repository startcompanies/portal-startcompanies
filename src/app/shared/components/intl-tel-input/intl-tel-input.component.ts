import { Component, Input, forwardRef, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import intlTelInput from 'intl-tel-input';

@Component({
  selector: 'app-intl-tel-input',
  standalone: true,
  templateUrl: './intl-tel-input.component.html',
  styleUrls: ['./intl-tel-input.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IntlTelInputComponent),
      multi: true
    }
  ]
})
export class IntlTelInputComponent implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy {
  @ViewChild('telInput', { static: false }) telInput!: ElementRef<HTMLInputElement>;
  @Input() id?: string;
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() preferredCountries: string[] = ['us', 'mx', 'co', 'ar', 'cl', 'pe'];
  @Input() initialCountry: string | undefined = 'us';
  @Input() allowDropdown: boolean = true;
  @Input() formatOnDisplay: boolean = true;
  @Input() separateDialCode: boolean = false;

  private iti: any = null;
  private onChange = (value: string) => {};
  private onTouched = () => {};

  value: string = '';

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    if (this.telInput?.nativeElement) {
      const options: any = {
        preferredCountries: this.preferredCountries,
        allowDropdown: this.allowDropdown,
        formatOnDisplay: this.formatOnDisplay,
        separateDialCode: this.separateDialCode,
        utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js'
      };
      
      if (this.initialCountry) {
        options.initialCountry = this.initialCountry;
      }
      
      this.iti = intlTelInput(this.telInput.nativeElement, options);

      // Listen for changes
      this.telInput.nativeElement.addEventListener('countrychange', () => {
        this.updateValue();
      });

      this.telInput.nativeElement.addEventListener('input', () => {
        this.updateValue();
      });

      this.telInput.nativeElement.addEventListener('blur', () => {
        this.onTouched();
      });

      // Set initial value if exists
      if (this.value) {
        this.telInput.nativeElement.value = this.value;
        this.iti.setNumber(this.value);
      }
    }
  }

  /**
   * Actualiza el país seleccionado después de la inicialización
   * Útil para establecer el país basado en geolocalización por IP
   */
  setCountry(countryCode: string): void {
    if (this.iti && countryCode) {
      try {
        this.iti.setCountry(countryCode.toLowerCase());
      } catch (error) {
        console.warn('Error al establecer el país:', error);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.iti) {
      this.iti.destroy();
    }
  }

  private updateValue(): void {
    if (this.iti && this.telInput?.nativeElement) {
      const number = this.iti.getNumber();
      this.value = number || '';
      this.onChange(this.value);
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
    if (this.iti && this.telInput?.nativeElement && value) {
      this.iti.setNumber(value);
    } else if (this.telInput?.nativeElement) {
      this.telInput.nativeElement.value = '';
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.telInput?.nativeElement) {
      this.telInput.nativeElement.disabled = isDisabled;
    }
  }

  // Public method to get the full number with country code
  getFullNumber(): string {
    if (this.iti) {
      return this.iti.getNumber() || '';
    }
    return '';
  }

  // Public method to get the country code
  getCountryCode(): string {
    if (this.iti) {
      return this.iti.getSelectedCountryData().iso2 || '';
    }
    return '';
  }

  // Public method to check if the number is valid
  isValidNumber(): boolean {
    if (this.iti) {
      return this.iti.isValidNumber();
    }
    return false;
  }
}

