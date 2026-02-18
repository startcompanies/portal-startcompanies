# Componente de Teléfono Internacional con Selector de Países

Esta documentación describe cómo implementar un componente de teléfono internacional con selector de países usando Angular y la librería `intl-tel-input`.

## 📋 Tabla de Contenidos

1. [Descripción](#descripción)
2. [Dependencias](#dependencias)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Instalación](#instalación)
5. [Implementación del Componente](#implementación-del-componente)
6. [Servicio de Geolocalización (Opcional)](#servicio-de-geolocalización-opcional)
7. [Uso del Componente](#uso-del-componente)
8. [Configuración](#configuración)
9. [Características](#características)
10. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 📝 Descripción

El componente `IntlTelInputComponent` es un input de teléfono internacional que:
- Permite seleccionar el país desde un dropdown
- Formatea automáticamente el número según el país seleccionado
- Valida el número de teléfono
- Guarda el número en formato internacional completo (ej: `+15551234567`)
- Se integra perfectamente con Angular Reactive Forms
- Soporta detección automática de país por IP (opcional)

---

## 📦 Dependencias

### NPM Packages

```bash
npm install intl-tel-input
npm install --save-dev @types/intl-tel-input
```

### Versiones utilizadas

- `intl-tel-input`: `^25.14.1`
- `@types/intl-tel-input`: `^18.1.4`

### Configuración en `angular.json`

Agregar el CSS de `intl-tel-input` en la sección `styles`:

```json
{
  "styles": [
    "src/styles.css",
    "node_modules/intl-tel-input/build/css/intlTelInput.css"
  ]
}
```

---

## 📁 Estructura de Archivos

```
src/app/shared/components/intl-tel-input/
├── intl-tel-input.component.ts
├── intl-tel-input.component.html
└── intl-tel-input.component.css
```

---

## 🚀 Instalación

1. **Instalar dependencias:**

```bash
npm install intl-tel-input @types/intl-tel-input
```

2. **Configurar `angular.json`** (ver sección anterior)

3. **Crear la estructura de carpetas** y los archivos del componente

---

## 💻 Implementación del Componente

### 1. Componente TypeScript (`intl-tel-input.component.ts`)

```typescript
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
  private onChange = (value: string) => {};
  private onTouched = () => {};
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
        autoPlaceholder: 'polite',
        utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js'
      };
      
      if (this.initialCountry) {
        options.initialCountry = this.initialCountry;
      }
      
      this.iti = intlTelInput(this.telInput.nativeElement, options);

      // Listen for country changes
      this.telInput.nativeElement.addEventListener('countrychange', () => {
        this.updateValue();
      });

      // Debounce input changes
      this.telInput.nativeElement.addEventListener('input', () => {
        if (this.inputTimeout) {
          clearTimeout(this.inputTimeout);
        }
        
        this.inputTimeout = setTimeout(() => {
          this.updateValue();
        }, 150);
      });

      this.telInput.nativeElement.addEventListener('blur', () => {
        this.onTouched();
        this.updateValue();
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
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
      this.inputTimeout = null;
    }
  }

  private updateValue(): void {
    if (this.iti && this.telInput?.nativeElement) {
      const inputValue = this.telInput.nativeElement.value.trim();
      
      if (inputValue) {
        const fullNumber = this.buildFullNumber(inputValue);
        this.value = fullNumber;
        this.onChange(fullNumber);
      } else {
        this.value = '';
        this.onChange('');
        this.isValid = true;
        this.errorMessage = '';
      }
    }
  }

  private getExpectedFormat(): string {
    if (!this.iti) {
      return '';
    }

    const countryData = this.iti.getSelectedCountryData();
    if (!countryData) {
      return '';
    }

    const dialCode = countryData.dialCode || '';
    const countryCode = countryData.iso2?.toLowerCase() || '';
    
    const formatExamples: { [key: string]: string } = {
      'us': `+1XXXXXXXXXX (ej: +15551234567)`,
      'mx': `+52XXXXXXXXXX (ej: +52553879345)`,
      'co': `+57XXXXXXXXXX (ej: +573001234567)`,
      'ar': `+54XXXXXXXXXX (ej: +541112345678)`,
      'cl': `+56XXXXXXXXXX (ej: +56912345678)`,
      'pe': `+51XXXXXXXXXX (ej: +51987654321)`,
      'es': `+34XXXXXXXXXX (ej: +34612345678)`,
    };

    if (formatExamples[countryCode]) {
      return formatExamples[countryCode];
    }

    return `+${dialCode}XXXXXXXXXX (formato: +código+número completo)`;
  }

  private buildFullNumber(inputValue: string): string {
    if (!this.iti) {
      return '';
    }

    const cleanNumber = inputValue.replace(/[\s\-\(\)]/g, '').trim();
    
    if (!cleanNumber) {
      return '';
    }

    const countryData = this.iti.getSelectedCountryData();
    const dialCode = countryData?.dialCode || '';
    
    if (cleanNumber.startsWith('+')) {
      return cleanNumber;
    }
    
    if (dialCode) {
      let numberWithoutCode = cleanNumber;
      if (cleanNumber.startsWith(dialCode)) {
        numberWithoutCode = cleanNumber.substring(dialCode.length);
      }
      
      return `+${dialCode}${numberWithoutCode}`;
    }
    
    return `+${cleanNumber}`;
  }

  private validateNumber(): void {
    if (!this.iti || !this.telInput?.nativeElement) {
      return;
    }

    const inputValue = this.telInput.nativeElement.value.trim();
    
    if (this.required && !inputValue) {
      this.isValid = false;
      this.errorMessage = 'El teléfono es requerido';
      this.showError = true;
      return;
    }

    if (!inputValue) {
      this.isValid = true;
      this.errorMessage = '';
      this.showError = false;
      return;
    }

    const fullNumber = this.buildFullNumber(inputValue);
    
    if (!fullNumber || fullNumber === '') {
      this.isValid = false;
      this.showError = true;
      this.errorMessage = 'El teléfono es requerido';
      return;
    }
    
    const minLength = 8;
    const maxLength = 16;
    
    let isValid = false;
    let validationError = null;
    
    if (fullNumber.length < minLength) {
      isValid = false;
      validationError = 0;
    } else if (fullNumber.length > maxLength) {
      isValid = false;
      validationError = 1;
    } else if (!/^\+[1-9]\d{7,14}$/.test(fullNumber)) {
      isValid = false;
      validationError = 4;
    } else {
      try {
        const currentInputValue = this.telInput.nativeElement.value;
        const currentCountry = this.iti.getSelectedCountryData()?.iso2;
        
        this.iti.setNumber(fullNumber);
        isValid = this.iti.isValidNumber();
        validationError = this.iti.getValidationError();
        
        if (!isValid && validationError !== null) {
          if (fullNumber.length >= minLength && fullNumber.length <= maxLength) {
            isValid = true;
            validationError = null;
          }
        }
        
        this.telInput.nativeElement.value = currentInputValue;
        if (currentCountry) {
          this.iti.setCountry(currentCountry);
        }
        if (currentInputValue) {
          this.iti.setNumber(currentInputValue);
        }
      } catch (error) {
        isValid = fullNumber.length >= minLength && fullNumber.length <= maxLength && /^\+[1-9]\d{7,14}$/.test(fullNumber);
        validationError = isValid ? null : -1;
      }
    }
    
    this.updateValidationState(isValid, validationError, fullNumber);
  }

  private updateValidationState(isValid: boolean, validationError: number | null, fullNumber: string): void {
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
      
      const expectedFormat = this.getExpectedFormat();
      
      switch (validationError) {
        case 0:
          this.errorMessage = `El número de teléfono es demasiado corto. ${expectedFormat}`;
          break;
        case 1:
          this.errorMessage = `El número de teléfono es demasiado largo. ${expectedFormat}`;
          break;
        case 2:
          this.errorMessage = `Código de país inválido. ${expectedFormat}`;
          break;
        case 3:
          this.errorMessage = `Longitud de número inválida. ${expectedFormat}`;
          break;
        case 4:
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
          this.iti.setNumber(value);
        } catch (error) {
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

  // Public methods
  getFullNumber(): string {
    if (this.iti) {
      return this.iti.getNumber() || '';
    }
    return '';
  }

  getCountryCode(): string {
    if (this.iti) {
      return this.iti.getSelectedCountryData().iso2 || '';
    }
    return '';
  }

  isValidNumber(): boolean {
    if (this.iti) {
      return this.iti.isValidNumber();
    }
    return false;
  }

  validate(): void {
    this.showError = true;
    this.validateNumber();
  }

  clearError(): void {
    this.showError = false;
    this.errorMessage = '';
    this.isValid = true;
  }
}
```

### 2. Template HTML (`intl-tel-input.component.html`)

```html
<div class="intl-tel-input-wrapper">
  <input
    #telInput
    type="tel"
    [id]="id"
    [placeholder]="placeholder"
    [required]="required"
    [disabled]="disabled"
    [class.is-invalid]="showError && !isValid"
    [class.is-valid]="showError && isValid && value"
    class="form-control"
  />
  <div *ngIf="showError && !isValid && errorMessage" class="invalid-feedback d-block">
    {{ errorMessage }}
  </div>
</div>
```

### 3. Estilos CSS (`intl-tel-input.component.css`)

```css
/* Estilos para el input de teléfono internacional */
:host {
  display: block;
  width: 100%;
}

/* Contenedor principal de intl-tel-input */
:host .iti {
  width: 100%;
}

.intl-tel-input-wrapper {
  width: 100%;
}

/* Estilos para estados de validación */
:host .is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 3.6 .4.4.4-.4m0 4.8-.4-.4-.4.4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

:host .is-valid {
  border-color: #198754;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='m2.3 6.73.98-.98-.98-.98-.98.98.98.98zm2.84-2.84L4.16 4.67l.98.98.98-.98-.98-.98z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
}
```

---

## 🌍 Servicio de Geolocalización (Opcional)

Si deseas detectar automáticamente el país del usuario por su IP, puedes crear este servicio:

### `geolocation.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface GeolocationData {
  countryCode: string;
  countryName: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private cachedCountryCode: string | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el código de país basado en la IP del usuario
   * Usa ipapi.co como servicio de geolocalización
   * @returns Observable con el código de país (ej: 'us', 'mx', 'co')
   */
  getCountryCodeByIP(): Observable<string> {
    if (this.cachedCountryCode) {
      return of(this.cachedCountryCode.toLowerCase());
    }

    return this.http.get<any>('https://ipapi.co/json/').pipe(
      map((data: any) => {
        const countryCode = data.country_code?.toLowerCase() || 'us';
        this.cachedCountryCode = countryCode;
        return countryCode;
      }),
      catchError((error) => {
        console.warn('Error al obtener geolocalización por IP, usando "us" por defecto:', error);
        return of('us');
      })
    );
  }

  getGeolocationData(): Observable<GeolocationData> {
    return this.http.get<any>('https://ipapi.co/json/').pipe(
      map((data: any) => ({
        countryCode: data.country_code?.toLowerCase() || 'us',
        countryName: data.country_name || 'United States'
      })),
      catchError((error) => {
        console.warn('Error al obtener geolocalización:', error);
        return of({
          countryCode: 'us',
          countryName: 'United States'
        });
      })
    );
  }

  clearCache(): void {
    this.cachedCountryCode = null;
  }
}
```

---

## 📖 Uso del Componente

### Uso Básico en un Formulario Reactivo

```typescript
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IntlTelInputComponent } from './shared/components/intl-tel-input/intl-tel-input.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, IntlTelInputComponent],
  template: `
    <form [formGroup]="form">
      <div class="form-group">
        <label>Teléfono <span class="text-danger">*</span></label>
        <app-intl-tel-input
          formControlName="phone"
          [placeholder]="'Ingresa tu teléfono'"
          [required]="true"
        ></app-intl-tel-input>
      </div>
    </form>
  `
})
export class RegisterComponent implements OnInit {
  @ViewChild(IntlTelInputComponent) phoneInput?: IntlTelInputComponent;
  
  form = new FormGroup({
    phone: new FormControl('')
  });

  ngOnInit(): void {
    // El valor se guarda automáticamente en formato internacional
    // Ejemplo: +15551234567
    this.form.get('phone')?.valueChanges.subscribe(value => {
      console.log('Teléfono:', value);
    });
  }
}
```

### Uso con Detección Automática de País

```typescript
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IntlTelInputComponent } from './shared/components/intl-tel-input/intl-tel-input.component';
import { GeolocationService } from './shared/services/geolocation.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, IntlTelInputComponent],
  template: `
    <form [formGroup]="form">
      <div class="form-group">
        <label>Teléfono <span class="text-danger">*</span></label>
        <app-intl-tel-input
          #phoneInput
          formControlName="phone"
          [placeholder]="'Ingresa tu teléfono'"
          [required]="true"
          [initialCountry]="detectedCountryCode"
        ></app-intl-tel-input>
      </div>
    </form>
  `
})
export class RegisterComponent implements OnInit {
  @ViewChild(IntlTelInputComponent) phoneInput?: IntlTelInputComponent;
  detectedCountryCode: string = 'us';
  
  form = new FormGroup({
    phone: new FormControl('')
  });

  constructor(private geolocationService: GeolocationService) {}

  ngOnInit(): void {
    // Obtener país por IP y establecerlo en el input de teléfono
    this.geolocationService.getCountryCodeByIP().subscribe(countryCode => {
      this.detectedCountryCode = countryCode;
      // Actualizar el país en el input después de que se inicialice
      setTimeout(() => {
        if (this.phoneInput) {
          this.phoneInput.setCountry(countryCode);
        }
      }, 500);
    });
  }
}
```

---

## ⚙️ Configuración

### Inputs del Componente

| Input | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `id` | `string` | `undefined` | ID del input HTML |
| `placeholder` | `string` | `''` | Placeholder del input |
| `required` | `boolean` | `false` | Si el campo es requerido |
| `disabled` | `boolean` | `false` | Si el campo está deshabilitado |
| `preferredCountries` | `string[]` | `['us', 'mx', 'co', 'ar', 'cl', 'pe']` | Países preferidos en el dropdown |
| `initialCountry` | `string` | `'us'` | País inicial seleccionado |
| `allowDropdown` | `boolean` | `true` | Permitir dropdown de países |
| `formatOnDisplay` | `boolean` | `true` | Formatear número al mostrarlo |
| `separateDialCode` | `boolean` | `false` | Separar código de país del número |

### Métodos Públicos

| Método | Retorno | Descripción |
|--------|---------|-------------|
| `setCountry(countryCode: string)` | `void` | Establece el país seleccionado |
| `getFullNumber()` | `string` | Obtiene el número completo con código de país |
| `getCountryCode()` | `string` | Obtiene el código ISO del país seleccionado |
| `isValidNumber()` | `boolean` | Verifica si el número es válido |
| `validate()` | `void` | Fuerza la validación del número |
| `clearError()` | `void` | Limpia el estado de error |

---

## ✨ Características

### 1. **Formato Automático**
- El número se formatea automáticamente según el país seleccionado
- El usuario solo necesita escribir el número local

### 2. **Validación Inteligente**
- Valida el formato del número según el país
- Muestra mensajes de error descriptivos
- Soporta validación en tiempo real y al perder el foco

### 3. **Formato de Guardado**
- El valor se guarda siempre en formato internacional completo
- Ejemplo: `+15551234567` (USA), `+52553879345` (México)

### 4. **Integración con Reactive Forms**
- Implementa `ControlValueAccessor`
- Compatible con validadores de Angular
- Soporta `required`, `disabled`, etc.

### 5. **Detección Automática de País (Opcional)**
- Detecta el país del usuario por su IP
- Establece automáticamente el país en el selector

---

## 📚 Ejemplos de Uso

### Ejemplo 1: Formulario de Registro Básico

```typescript
// component.ts
form = new FormGroup({
  fullName: new FormControl(''),
  phone: new FormControl('', Validators.required),
  email: new FormControl('', [Validators.required, Validators.email])
});

// component.html
<form [formGroup]="form">
  <div class="form-group">
    <label>Teléfono <span class="text-danger">*</span></label>
    <app-intl-tel-input
      formControlName="phone"
      placeholder="Ingresa tu teléfono"
      [required]="true"
    ></app-intl-tel-input>
    <div *ngIf="form.get('phone')?.touched && form.get('phone')?.invalid" 
         class="text-danger mt-1">
      El teléfono es requerido
    </div>
  </div>
</form>
```

### Ejemplo 2: Con País Preferido Específico

```html
<app-intl-tel-input
  formControlName="phone"
  [preferredCountries]="['mx', 'us', 'co']"
  [initialCountry]="'mx'"
  placeholder="Teléfono de contacto"
></app-intl-tel-input>
```

### Ejemplo 3: Con Código de País Separado

```html
<app-intl-tel-input
  formControlName="phone"
  [separateDialCode]="true"
  placeholder="Número de teléfono"
></app-intl-tel-input>
```

### Ejemplo 4: Accediendo al Componente desde el TypeScript

```typescript
@ViewChild(IntlTelInputComponent) phoneInput?: IntlTelInputComponent;

ngOnInit(): void {
  // Obtener el número completo
  const fullNumber = this.phoneInput?.getFullNumber();
  console.log('Número completo:', fullNumber);
  
  // Obtener el código de país
  const countryCode = this.phoneInput?.getCountryCode();
  console.log('Código de país:', countryCode);
  
  // Validar manualmente
  const isValid = this.phoneInput?.isValidNumber();
  console.log('¿Es válido?', isValid);
  
  // Cambiar el país programáticamente
  this.phoneInput?.setCountry('mx');
}
```

---

## 🔧 Solución de Problemas

### El componente no se inicializa correctamente

- Asegúrate de que el CSS de `intl-tel-input` esté incluido en `angular.json`
- Verifica que el `ViewChild` tenga `static: false` si el componente está dentro de un `*ngIf`

### El país no se detecta automáticamente

- Verifica que el servicio de geolocalización esté funcionando
- Usa un `setTimeout` para establecer el país después de la inicialización del componente
- Revisa la consola del navegador para errores de CORS

### El formato del número no es correcto

- El componente guarda el número en formato internacional completo (`+código+número`)
- Si necesitas solo el número local, puedes extraerlo del valor completo
- El formato visual en el input puede diferir del valor guardado (esto es normal)

---

## 📝 Notas Importantes

1. **Formato de Guardado**: El componente siempre guarda el número en formato internacional completo (ej: `+15551234567`). Esto es intencional para mantener consistencia en la base de datos.

2. **Validación**: La validación se ejecuta principalmente cuando el usuario sale del campo (`blur`). Esto mejora la experiencia de usuario al no mostrar errores mientras escribe.

3. **Dependencia Externa**: El componente usa un script externo de `intl-tel-input` desde CDN para la validación. Asegúrate de tener conexión a internet o considera descargar el script localmente.

4. **Compatibilidad**: El componente es compatible con Angular 18+ y usa standalone components. Si usas módulos, necesitarás ajustar las importaciones.

---

## 📄 Licencia

Este componente utiliza la librería `intl-tel-input` que tiene su propia licencia. Consulta la documentación oficial para más detalles: https://github.com/jackocnr/intl-tel-input

---

## 🔗 Referencias

- [Documentación oficial de intl-tel-input](https://github.com/jackocnr/intl-tel-input)
- [Angular Reactive Forms](https://angular.io/guide/reactive-forms)
- [ControlValueAccessor](https://angular.io/api/forms/ControlValueAccessor)
