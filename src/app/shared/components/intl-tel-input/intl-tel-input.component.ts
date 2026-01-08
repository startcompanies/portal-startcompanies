import { Component, Input, forwardRef, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import intlTelInput from 'intl-tel-input';

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
  @Input() formatOnDisplay: boolean = true;
  @Input() separateDialCode: boolean = false;

  private iti: any = null;
  private onChange = (value: string) => { };
  private onTouched = () => { };
  private inputTimeout: any = null;

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
        autoPlaceholder: 'polite', // Mostrar placeholder con formato del país
        utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js'
      };

      if (this.initialCountry) {
        options.initialCountry = this.initialCountry;
      }

      this.iti = intlTelInput(this.telInput.nativeElement, options);

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
        this.onTouched();

        // Primero actualizar el valor para construir el número completo
        this.updateValue();

        // Luego validar el número completo
        this.showError = true;
        this.validateNumber();
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
   * Obtiene el formato esperado del teléfono según el país seleccionado
   */
  private getExpectedFormat(): string {
    if (!this.iti) {
      return '';
    }

    const countryData = this.iti.getSelectedCountryData();
    if (!countryData) {
      return '';
    }

    const dialCode = countryData.dialCode || '';

    // Ejemplos de formato estándar (código de país + número completo, sin espacios)
    const formatExamples: { [key: string]: string } = {
      'us': `+1XXXXXXXXXX (ej: +15551234567) - El código +1 se agrega automáticamente`,
      'mx': `+52XXXXXXXXXX (ej: +52553879345) - El código +52 se agrega automáticamente`,
      'co': `+57XXXXXXXXXX (ej: +573001234567) - El código +57 se agrega automáticamente`,
      'ar': `+54XXXXXXXXXX (ej: +541112345678) - El código +54 se agrega automáticamente`,
      'cl': `+56XXXXXXXXXX (ej: +56912345678) - El código +56 se agrega automáticamente`,
      'pe': `+51XXXXXXXXXX (ej: +51987654321) - El código +51 se agrega automáticamente`,
      'es': `+34XXXXXXXXXX (ej: +34612345678) - El código +34 se agrega automáticamente`,
    };

    const countryCode = countryData.iso2?.toLowerCase() || '';
    if (formatExamples[countryCode]) {
      return formatExamples[countryCode];
    }

    // Formato genérico: código de país + número completo
    return `+${dialCode}XXXXXXXXXX (formato: +código+número completo) - El código +${dialCode} se agrega automáticamente`;
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
   * Valida el número de teléfono y actualiza el estado de error
   * Valida usando el número completo con código de país (el que se guardará)
   */
  private validateNumber(): void {
    if (!this.iti || !this.telInput?.nativeElement) {
      return;
    }

    const inputValue = this.telInput.nativeElement.value.trim();

    // Si está vacío y es requerido, mostrar error
    if (this.required && !inputValue) {
      this.isValid = false;
      this.errorMessage = 'El teléfono es requerido';
      this.showError = true;
      return;
    }

    // Si está vacío y no es requerido, es válido
    if (!inputValue) {
      this.isValid = true;
      this.errorMessage = '';
      this.showError = false;
      return;
    }

    // Construir el número completo con código de país
    const fullNumber = this.buildFullNumber(inputValue);

    if (!fullNumber || fullNumber === '') {
      this.isValid = false;
      this.showError = true;
      this.errorMessage = 'El teléfono es requerido';
      return;
    }

    // Validar el número completo
    // Hacer una validación híbrida: usar intl-tel-input si es posible, sino validación básica
    let isValid = false;
    let validationError = null;

    // Validación básica: el número completo debe tener al menos código de país + 7 dígitos
    const minLength = 8; // +1 (código) + 7 (mínimo de dígitos del número local)
    const maxLength = 16; // Longitud máxima razonable para un número internacional

    if (fullNumber.length < minLength) {
      isValid = false;
      validationError = 0; // TOO_SHORT
    } else if (fullNumber.length > maxLength) {
      isValid = false;
      validationError = 1; // TOO_LONG
    } else if (!/^\+[1-9]\d{7,14}$/.test(fullNumber)) {
      // Validar formato básico: debe empezar con + seguido de código de país (1-9) y luego 7-14 dígitos
      isValid = false;
      validationError = 4; // NOT_A_NUMBER
    } else {
      // Si pasa la validación básica, intentar validar con intl-tel-input
      try {
        // Guardar el estado actual del input
        const currentInputValue = this.telInput.nativeElement.value;
        const currentCountry = this.iti.getSelectedCountryData()?.iso2;

        // Establecer el número completo en intl-tel-input para validarlo
        this.iti.setNumber(fullNumber);

        // Validar el número completo
        isValid = this.iti.isValidNumber();
        validationError = this.iti.getValidationError();

        // Si intl-tel-input dice que es inválido pero pasó nuestra validación básica,
        // considerar válido (puede ser un número válido que intl-tel-input no reconoce)
        if (!isValid && validationError !== null) {
          // Si el error es solo de formato pero el número tiene longitud válida, considerarlo válido
          if (fullNumber.length >= minLength && fullNumber.length <= maxLength) {
            isValid = true;
            validationError = null;
          }
        }

        // Restaurar el input visual al formato local
        this.telInput.nativeElement.value = currentInputValue;
        if (currentCountry) {
          this.iti.setCountry(currentCountry);
        }
        if (currentInputValue) {
          this.iti.setNumber(currentInputValue);
        }
      } catch (error) {
        // Si hay error con intl-tel-input, usar la validación básica
        isValid = fullNumber.length >= minLength && fullNumber.length <= maxLength && /^\+[1-9]\d{7,14}$/.test(fullNumber);
        validationError = isValid ? null : -1;
      }
    }

    // Actualizar el estado de validación
    this.updateValidationState(isValid, validationError, fullNumber);
  }

  /**
   * Actualiza el estado de validación y el FormControl
   */
  private updateValidationState(isValid: boolean, validationError: number | null, fullNumber: string): void {
    // Asegurar que el valor en el FormControl se actualice con el número completo
    // Esto es importante porque el número completo es el que se guardará
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
      this.showError = true;

      // Obtener el formato esperado
      const expectedFormat = this.getExpectedFormat();

      // Mensajes de error más amigables según el tipo de error
      switch (validationError) {
        case 0: // TOO_SHORT
          this.errorMessage = `El número de teléfono es demasiado corto. ${expectedFormat}`;
          break;
        case 1: // TOO_LONG
          this.errorMessage = `El número de teléfono es demasiado largo. ${expectedFormat}`;
          break;
        case 2: // INVALID_COUNTRY_CODE
          this.errorMessage = `Código de país inválido. ${expectedFormat}`;
          break;
        case 3: // INVALID_LENGTH
          this.errorMessage = `Longitud de número inválida. ${expectedFormat}`;
          break;
        case 4: // NOT_A_NUMBER
          this.errorMessage = `No es un número válido. ${expectedFormat}`;
          break;
        default:
          this.errorMessage = `Formato de teléfono inválido. ${expectedFormat}`;
      }
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
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

  // Public method to get the full number with country code
  getFullNumber(): string {
    console.log('[IntlTelInputComponent] getFullNumber called', this.iti);
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

  /**
   * Fuerza la validación del número (útil para validación del formulario)
   */
  validate(): void {
    this.showError = true;
    this.validateNumber();
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

