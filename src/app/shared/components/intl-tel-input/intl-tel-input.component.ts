import { Component, Input, forwardRef, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import intlTelInput from 'intl-tel-input';
import { take } from 'rxjs/operators';
import { GeolocationService } from '../../services/geolocation.service';

@Component({
  selector: 'app-intl-tel-input',
  standalone: true,
  imports: [CommonModule],
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
  /** Sin formateo agresivo por país (estilo WhatsApp: prefijo + dígitos). */
  @Input() formatOnDisplay: boolean = false;
  /** Prefijo (+52, etc.) aparte del campo numérico. */
  @Input() separateDialCode: boolean = true;
  /** Si es false, no se muestra el mensaje bajo el input (el padre puede usar solo el FormControl). */
  @Input() showInlineErrors: boolean = true;
  /** Si es true, ajusta el país al detectado por IP cuando el campo arranca vacío (no sobrescribe valor E.164 existente). */
  @Input() useGeoIpCountry: boolean = true;

  private iti: any = null;
  /** Evita blur/onTouched espurios al montar el plugin o al cambiar país por IP. */
  private userHasFocusedInput = false;
  /** true si el FormControl ya trae número (evita pisar país al aplicar geo por IP). */
  private skipGeoIpApply = false;
  private onChange = (value: string) => {};
  private onTouched = () => {};
  private inputTimeout: any = null;

  constructor(private geolocationService: GeolocationService) {}

  value: string = '';
  isValid: boolean = true;
  errorMessage: string = '';
  showError: boolean = false;

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
        autoPlaceholder: 'off',
        // Sin utils.js: evita warnings en consola y no usamos isValidNumber() del plugin
      };
      
      if (this.initialCountry) {
        options.initialCountry = this.initialCountry;
      }
      
      this.iti = intlTelInput(this.telInput.nativeElement, options);

      this.telInput.nativeElement.addEventListener('focus', () => {
        this.userHasFocusedInput = true;
      });

      // Listen for changes
      this.telInput.nativeElement.addEventListener('countrychange', () => {
        // Cuando cambia el país, actualizar el valor para incluir el nuevo código de país
        this.updateValue();
      });

      // Usar debounce para evitar ejecuciones excesivas durante la escritura
      this.telInput.nativeElement.addEventListener('input', () => {
        // Limpiar timeout anterior
        if (this.inputTimeout) {
          clearTimeout(this.inputTimeout);
        }
        
        // Actualizar el valor después de un breve delay (debounce)
        this.inputTimeout = setTimeout(() => {
          this.updateValue();
        }, 150); // Esperar 150ms después de que el usuario deje de escribir
      });

      this.telInput.nativeElement.addEventListener('blur', () => {
        this.updateValue();
        if (!this.userHasFocusedInput) {
          this.applyValidationState(false);
          return;
        }
        this.onTouched();
        this.applyValidationState(true);
      });

      // Set initial value if exists
      if (this.value) {
        this.skipGeoIpApply = true;
        try {
          this.iti.setNumber(this.value);
        } catch {
          this.telInput.nativeElement.value = this.value;
        }
      }

      this.applyGeoIpCountryIfEligible();
    }
  }

  /**
   * País por IP solo si el campo está vacío y no hay valor precargado desde el FormControl.
   */
  private applyGeoIpCountryIfEligible(): void {
    if (!this.useGeoIpCountry || this.skipGeoIpApply || !this.iti) {
      return;
    }
    this.geolocationService
      .getCountryCodeByIP()
      .pipe(take(1))
      .subscribe((code) => {
        if (!this.iti || !this.useGeoIpCountry || this.skipGeoIpApply) {
          return;
        }
        const raw = (this.telInput?.nativeElement?.value || '').trim();
        const stored = (this.value || '').trim();
        if (raw || stored) {
          return;
        }
        this.setCountry(code);
      });
  }

  /**
   * Actualiza el país seleccionado después de la inicialización
   * Útil para establecer el país basado en geolocalización por IP
   */
  setCountry(countryCode: string): void {
    if (this.iti && countryCode) {
      try {
        this.iti.setCountry(countryCode.toLowerCase());
      } catch {
        /* país desconocido para el plugin */
      }
    }
  }

  ngOnDestroy(): void {
    if (this.iti) {
      this.iti.destroy();
    }
    // Limpiar cualquier timeout pendiente
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
      this.inputTimeout = null;
    }
  }

  private updateValue(): void {
    if (this.iti && this.telInput?.nativeElement) {
      // Obtener el valor del input directamente (ya formateado por intl-tel-input)
      const inputValue = this.telInput.nativeElement.value.trim();
      
      // Si hay valor en el input, construir el número completo
      if (inputValue) {
        // Construir el número completo usando buildFullNumber
        const fullNumber = this.buildFullNumber(inputValue);
        
        // Guardar el número completo en el FormControl
        // Este es el valor que se guardará en la BD
        this.value = fullNumber;
        this.onChange(fullNumber);
        
        // NO establecer el número completo en intl-tel-input aquí
        // Lo haremos solo cuando validemos para no afectar la UX del input
        // NO validar en tiempo real durante la escritura para evitar consumo excesivo de recursos
        // La validación solo se ejecutará cuando el usuario salga del campo (blur)
      } else {
        // Si el input está vacío, limpiar el valor
        this.value = '';
        this.onChange('');
        this.isValid = true;
        this.errorMessage = '';
      }
    }
  }

  /**
   * E.164 relajado: +, código país (empieza en 1-9), 6–14 dígitos más (total hasta 15 dígitos sin el +).
   */
  private isE164Simple(full: string): boolean {
    return /^\+[1-9]\d{6,14}$/.test(full);
  }

  /**
   * Construye el número completo con código de país (el que se guardará)
   */
  private buildFullNumber(inputValue: string): string {
    if (!this.iti) {
      return '';
    }

    // Limpiar el input de espacios, guiones, paréntesis, etc.
    const cleanNumber = inputValue.replace(/[\s\-\(\)]/g, '').trim();
    
    if (!cleanNumber) {
      return '';
    }

    // Obtener datos del país seleccionado
    const countryData = this.iti.getSelectedCountryData();
    const dialCode = countryData?.dialCode || '';
    
    // Si el número ya tiene código de país (empieza con +), usarlo directamente
    if (cleanNumber.startsWith('+')) {
      return cleanNumber;
    }
    
    // Si no tiene código de país, agregarlo automáticamente
    if (dialCode) {
      // Si el número empieza con el código de país (sin +), removerlo primero
      // Ejemplo: si el usuario escribe "15053172925" con país USA, remover el "1" inicial
      let numberWithoutCode = cleanNumber;
      if (cleanNumber.startsWith(dialCode)) {
        numberWithoutCode = cleanNumber.substring(dialCode.length);
      }
      
      return `+${dialCode}${numberWithoutCode}`;
    }
    
    // Si no hay código de país disponible, agregar + al inicio
    return `+${cleanNumber}`;
  }

  /**
   * Sincroniza valor hacia el FormControl sin mostrar errores en UI (p. ej. canProceed en cada CD).
   */
  syncToFormControl(): void {
    this.updateValue();
    this.applyValidationState(false);
  }

  /**
   * @param showUi si false, solo actualiza isValid/errorMessage interno; no muestra bloque bajo el input ni is-invalid.
   */
  private applyValidationState(showUi: boolean): void {
    if (!this.iti || !this.telInput?.nativeElement) {
      return;
    }

    const inputValue = this.telInput.nativeElement.value.trim();
    const expose = showUi && this.showInlineErrors;

    if (this.required && !inputValue) {
      this.isValid = false;
      this.errorMessage = 'El teléfono es requerido';
      this.showError = expose;
      this.value = '';
      this.onChange('');
      return;
    }

    if (!inputValue) {
      this.isValid = true;
      this.errorMessage = '';
      this.showError = false;
      this.value = '';
      this.onChange('');
      return;
    }

    const fullNumber = this.buildFullNumber(inputValue);

    if (!fullNumber || fullNumber === '') {
      this.isValid = false;
      this.value = '';
      this.onChange('');
      this.errorMessage = 'El teléfono es requerido';
      this.showError = expose;
      return;
    }

    const ok = this.isE164Simple(fullNumber);
    let validationError: number | null = null;
    if (!ok) {
      if (fullNumber.length < 8) {
        validationError = 0;
      } else if (fullNumber.length > 16) {
        validationError = 1;
      } else {
        validationError = 4;
      }
    }

    this.updateValidationState(ok, validationError, fullNumber, expose);
  }

  private updateValidationState(
    isValid: boolean,
    validationError: number | null,
    fullNumber: string,
    exposeUi: boolean
  ): void {
    if (fullNumber && fullNumber !== this.value) {
      this.value = fullNumber;
      this.onChange(fullNumber);
    }

    if (isValid) {
      this.isValid = true;
      this.errorMessage = '';
      this.showError = false;
    } else {
      this.isValid = false;
      this.showError = exposeUi;
      const hint =
        'Elige el país en el selector e introduce solo el número (como en WhatsApp). Se guardará con prefijo internacional (+…).';
      switch (validationError) {
        case 0:
          this.errorMessage = `El número es demasiado corto. ${hint}`;
          break;
        case 1:
          this.errorMessage = `El número es demasiado largo. ${hint}`;
          break;
        default:
          this.errorMessage = `Introduce un número válido con el prefijo elegido. ${hint}`;
      }
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
    if (value) {
      this.skipGeoIpApply = true;
    }
    if (this.iti && this.telInput?.nativeElement) {
      if (value) {
        try {
          // Si el valor ya tiene formato internacional (+código+número), usarlo directamente
          // intl-tel-input lo formateará automáticamente para mostrar en el input
          this.iti.setNumber(value);
          
          // El plugin formatea automáticamente el número en el input según el país
          // El valor se guardará en formato internacional completo cuando se actualice
        } catch (error) {
          // Si setNumber falla, establecer el valor directamente en el input
          this.telInput.nativeElement.value = value;
        }
      } else {
        this.telInput.nativeElement.value = '';
        if (this.iti) {
          this.iti.setNumber('');
        }
      }
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

  getFullNumber(): string {
    if (this.iti && this.telInput?.nativeElement) {
      const raw = this.telInput.nativeElement.value.trim();
      if (raw) {
        return this.buildFullNumber(raw);
      }
    }
    return this.value || '';
  }

  // Public method to get the country code
  getCountryCode(): string {
    if (this.iti) {
      return this.iti.getSelectedCountryData().iso2 || '';
    }
    return '';
  }

  isValidNumber(): boolean {
    const full = this.getFullNumber();
    return !full ? !this.required : this.isE164Simple(full);
  }

  /**
   * Fuerza la validación del número (útil para validación del formulario)
   */
  validate(): void {
    this.userHasFocusedInput = true;
    this.applyValidationState(true);
  }

  /**
   * Limpia el estado de error
   */
  clearError(): void {
    this.showError = false;
    this.errorMessage = '';
    this.isValid = true;
  }
}

