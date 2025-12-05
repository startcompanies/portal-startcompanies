import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  FormWizardService,
  FormWizardStepBaseComponent,
} from 'ngx-form-wizard';
import { SharedModule } from '../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-llc-information',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  template: `
    <div class="p-4">
      <h4 class="mb-4">{{ 'RELAY_WIZARD.step1.title' | transloco }}</h4>

      <form [formGroup]="form">
        <!-- Tipo de negocio -->
        <div class="form-group mb-3">
          <label for="businessType">
            {{ 'RELAY_WIZARD.step1.business_type' | transloco }} *
          </label>
          <select
            id="businessType"
            class="form-control"
            formControlName="businessType"
            (change)="form.get('customBusinessType')?.setValue('')"
          >
            <option value="">
              {{ 'RELAY_WIZARD.step1.select_business_type' | transloco }}
            </option>
            <option value="retail">LLC</option>
            <option value="services">Corporation</option>
            <option value="other">Otro</option>
          </select>
          <div
            *ngIf="
              form.get('businessType')?.touched &&
              form.get('businessType')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step1.business_type_required' | transloco }}
          </div>
        </div>

        <!-- Tipo de negocio personalizado (cuando se selecciona "Otro") -->
        <div class="form-group mb-3" *ngIf="form.get('businessType')?.value === 'other'">
          <label for="customBusinessType">
            {{ 'RELAY_WIZARD.step1.custom_business_type' | transloco }} *
          </label>
          <input
            id="customBusinessType"
            type="text"
            class="form-control"
            formControlName="customBusinessType"
            [placeholder]="'RELAY_WIZARD.step1.custom_business_type_placeholder' | transloco"
          />
          <div
            *ngIf="
              form.get('customBusinessType')?.touched &&
              form.get('customBusinessType')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step1.custom_business_type_required' | transloco }}
          </div>
        </div>

        <!-- Nombre legal del negocio -->
        <div class="form-group mb-3">
          <label for="legalName">
            {{ 'RELAY_WIZARD.step1.legal_name' | transloco }} *
          </label>
          <input
            id="legalName"
            type="text"
            class="form-control"
            formControlName="legalName"
            [placeholder]="'RELAY_WIZARD.step1.legal_name_placeholder' | transloco"
          />
          <small class="form-text text-muted">
            {{ 'RELAY_WIZARD.step1.legal_name_hint' | transloco }}
          </small>
          <div
            *ngIf="
              form.get('legalName')?.touched &&
              form.get('legalName')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step1.legal_name_required' | transloco }}
          </div>
        </div>

        <!-- Industria / Rubro -->
        <div class="form-group mb-3">
          <label for="industry">
            {{ 'RELAY_WIZARD.step1.industry' | transloco }} *
          </label>
          <input
            id="industry"
            type="text"
            class="form-control"
            formControlName="industry"
            [placeholder]="'RELAY_WIZARD.step1.industry_placeholder' | transloco"
          />
          <div
            *ngIf="
              form.get('industry')?.touched && form.get('industry')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step1.industry_required' | transloco }}
          </div>
        </div>

        <!-- Cantidad de empleados -->
        <div class="form-group mb-3">
          <label for="employees">
            {{ 'RELAY_WIZARD.step1.employees' | transloco }} *
          </label>
          <select id="employees" class="form-control" formControlName="employees">
            <option value="">
              {{ 'RELAY_WIZARD.step1.select_employees' | transloco }}
            </option>
            <option value="1">1</option>
            <option value="2-5">2-5</option>
            <option value="6-10">6-10</option>
            <option value="11-50">11-50</option>
            <option value="51+">51+</option>
          </select>
          <div
            *ngIf="
              form.get('employees')?.touched &&
              form.get('employees')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step1.employees_required' | transloco }}
          </div>
        </div>

        <!-- Descripción breve -->
        <div class="form-group mb-3">
          <label for="description">
            {{ 'RELAY_WIZARD.step1.description' | transloco }} *
          </label>
          <textarea
            id="description"
            class="form-control"
            formControlName="description"
            rows="4"
            [placeholder]="'RELAY_WIZARD.step1.description_placeholder' | transloco"
            maxlength="300"
          ></textarea>
          <small class="form-text text-muted">
            {{ 'RELAY_WIZARD.step1.description_hint' | transloco }}
          </small>
          <div class="text-muted text-end">
            {{ form.get('description')?.value?.length || 0 }}/300
          </div>
          <div
            *ngIf="
              form.get('description')?.touched &&
              form.get('description')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step1.description_required' | transloco }}
          </div>
        </div>

        <!-- Checkbox: No tengo sitio web -->
        <div class="form-check mb-3">
          <input
            class="form-check-input"
            type="checkbox"
            id="noWebsite"
            formControlName="noWebsite"
          />
          <label class="form-check-label" for="noWebsite">
            {{ 'RELAY_WIZARD.step1.no_website' | transloco }}
          </label>
        </div>

        <!-- Sitio web o red social -->
        <div class="form-group mb-3" *ngIf="!form.get('noWebsite')?.value">
          <label for="website">
            {{ 'RELAY_WIZARD.step1.website' | transloco }}
          </label>
          <input
            id="website"
            type="url"
            class="form-control"
            formControlName="website"
            [placeholder]="'RELAY_WIZARD.step1.website_placeholder' | transloco"
          />
        </div>

        <!-- Adjuntar EIN Letter -->
        <div class="form-group mb-3">
          <label for="einLetter">
            {{ 'RELAY_WIZARD.step1.ein_letter' | transloco }} *
          </label>
          <input
            id="einLetter"
            type="file"
            class="form-control"
            formControlName="einLetter"
            accept=".pdf,.jpg,.jpeg,.png"
            (change)="onFileChange($event, 'einLetter')"
          />
          <small class="form-text text-muted">
            {{ 'RELAY_WIZARD.step1.ein_letter_hint' | transloco }}
          </small>
          <div
            *ngIf="
              form.get('einLetter')?.touched &&
              form.get('einLetter')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step1.ein_letter_required' | transloco }}
          </div>
        </div>

        <!-- Número de EIN -->
        <div class="form-group mb-3">
          <label for="einNumber">
            {{ 'RELAY_WIZARD.step1.ein_number' | transloco }} *
          </label>
          <input
            id="einNumber"
            type="text"
            class="form-control"
            formControlName="einNumber"
            [placeholder]="'RELAY_WIZARD.step1.ein_number_placeholder' | transloco"
            pattern="[0-9]{2}-[0-9]{7}"
          />
          <div
            *ngIf="
              form.get('einNumber')?.touched &&
              form.get('einNumber')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step1.ein_number_required' | transloco }}
          </div>
        </div>

        <!-- Adjuntar Artículos de Organización -->
        <div class="form-group mb-3">
          <label for="articlesOfOrganization">
            {{
              'RELAY_WIZARD.step1.articles_of_organization' | transloco
            }}
            *
          </label>
          <input
            id="articlesOfOrganization"
            type="file"
            class="form-control"
            formControlName="articlesOfOrganization"
            accept=".pdf,.jpg,.jpeg,.png"
            (change)="onFileChange($event, 'articlesOfOrganization')"
          />
          <div
            *ngIf="
              form.get('articlesOfOrganization')?.touched &&
              form.get('articlesOfOrganization')?.invalid
            "
            class="text-danger mt-1"
          >
            {{
              'RELAY_WIZARD.step1.articles_of_organization_required'
                | transloco
            }}
          </div>
        </div>
      </form>
    </div>
  `,
})
export class LlcInformationComponent
  extends FormWizardStepBaseComponent
  implements OnInit
{
  constructor(private wizardService: FormWizardService) {
    const formControls = {
      businessType: new FormControl('', Validators.required),
      customBusinessType: new FormControl(''),
      legalName: new FormControl('', Validators.required),
      industry: new FormControl('', Validators.required),
      employees: new FormControl('', Validators.required),
      description: new FormControl('', [
        Validators.required,
        Validators.maxLength(300),
      ]),
      noWebsite: new FormControl(false),
      website: new FormControl(''),
      einLetter: new FormControl(null, Validators.required),
      einNumber: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d{2}-\d{7}$/),
      ]),
      articlesOfOrganization: new FormControl(null, Validators.required),
    };

    super(1, wizardService.getSteps(), true, formControls);
  }

  ngOnInit(): void {
    // Escuchar cambios en businessType para actualizar validaciones de customBusinessType
    this.form.get('businessType')?.valueChanges.subscribe((value) => {
      const customBusinessTypeControl = this.form.get('customBusinessType');
      if (value === 'other') {
        customBusinessTypeControl?.setValidators(Validators.required);
        customBusinessTypeControl?.updateValueAndValidity();
      } else {
        customBusinessTypeControl?.clearValidators();
        customBusinessTypeControl?.setValue('');
        customBusinessTypeControl?.updateValueAndValidity();
      }
    });
  }

  onFileChange(event: any, controlName: string): void {
    const file = event.target.files[0];
    if (file) {
      this.form.get(controlName)?.setValue(file);
    }
  }
}

