import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  FormWizardService,
  FormWizardStepBaseComponent,
} from 'ngx-form-wizard';
import { SharedModule } from '../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-registered-agent-address',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  template: `
    <div class="p-4">
      <h4 class="mb-4">
        {{ 'RELAY_WIZARD.step2.title' | transloco }}
      </h4>

      <form [formGroup]="form">
        <!-- Calle y número -->
        <div class="form-group mb-3">
          <label for="street">
            {{ 'RELAY_WIZARD.step2.street' | transloco }} *
          </label>
          <input
            id="street"
            type="text"
            class="form-control"
            formControlName="street"
            [placeholder]="'RELAY_WIZARD.step2.street_placeholder' | transloco"
          />
          <div
            *ngIf="form.get('street')?.touched && form.get('street')?.invalid"
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step2.street_required' | transloco }}
          </div>
        </div>

        <!-- Apto / Suite / PO Box -->
        <div class="form-group mb-3">
          <label for="aptSuite">
            {{ 'RELAY_WIZARD.step2.apt_suite' | transloco }}
          </label>
          <input
            id="aptSuite"
            type="text"
            class="form-control"
            formControlName="aptSuite"
            [placeholder]="'RELAY_WIZARD.step2.apt_suite_placeholder' | transloco"
          />
        </div>

        <!-- Ciudad y Estado en fila -->
        <div class="row mb-3">
          <div class="col-md-6">
            <div class="form-group">
              <label for="city">
                {{ 'RELAY_WIZARD.step2.city' | transloco }} *
              </label>
              <input
                id="city"
                type="text"
                class="form-control"
                formControlName="city"
                [placeholder]="'RELAY_WIZARD.step2.city_placeholder' | transloco"
              />
              <div
                *ngIf="form.get('city')?.touched && form.get('city')?.invalid"
                class="text-danger mt-1"
              >
                {{ 'RELAY_WIZARD.step2.city_required' | transloco }}
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="state">
                {{ 'RELAY_WIZARD.step2.state' | transloco }} *
              </label>
              <input
                id="state"
                type="text"
                class="form-control"
                formControlName="state"
                [placeholder]="'RELAY_WIZARD.step2.state_placeholder' | transloco"
              />
              <div
                *ngIf="form.get('state')?.touched && form.get('state')?.invalid"
                class="text-danger mt-1"
              >
                {{ 'RELAY_WIZARD.step2.state_required' | transloco }}
              </div>
            </div>
          </div>
        </div>

        <!-- Postal / Zip Code y Country en fila -->
        <div class="row mb-3">
          <div class="col-md-6">
            <div class="form-group">
              <label for="zipCode">
                {{ 'RELAY_WIZARD.step2.zip_code' | transloco }} *
              </label>
              <input
                id="zipCode"
                type="text"
                class="form-control"
                formControlName="zipCode"
                [placeholder]="'RELAY_WIZARD.step2.zip_code_placeholder' | transloco"
              />
              <div
                *ngIf="
                  form.get('zipCode')?.touched &&
                  form.get('zipCode')?.invalid
                "
                class="text-danger mt-1"
              >
                {{ 'RELAY_WIZARD.step2.zip_code_required' | transloco }}
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="country">
                {{ 'RELAY_WIZARD.step2.country' | transloco }} *
              </label>
              <input
                id="country"
                type="text"
                class="form-control"
                formControlName="country"
                value="United States"
                readonly
              />
            </div>
          </div>
        </div>

        <small class="form-text text-muted mb-3 d-block">
          {{ 'RELAY_WIZARD.step2.address_hint' | transloco }}
        </small>

        <!-- Estado de constitución -->
        <div class="form-group mb-3">
          <label for="incorporationState">
            {{ 'RELAY_WIZARD.step2.incorporation_state' | transloco }} *
          </label>
          <select
            id="incorporationState"
            class="form-control"
            formControlName="incorporationState"
          >
            <option value="">
              {{ 'RELAY_WIZARD.step2.select_state' | transloco }}
            </option>
            <option value="Delaware">Delaware</option>
            <option value="Wyoming">Wyoming</option>
            <option value="Florida">Florida</option>
            <option value="Texas">Texas</option>
            <option value="Nevada">Nevada</option>
            <option value="California">California</option>
            <option value="New York">New York</option>
            <option value="Other">Otro</option>
          </select>
          <div
            *ngIf="
              form.get('incorporationState')?.touched &&
              form.get('incorporationState')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step2.incorporation_state_required' | transloco }}
          </div>
        </div>

        <!-- Mes y Año de Incorporación -->
        <div class="form-group mb-3">
          <label for="incorporationDate">
            {{ 'RELAY_WIZARD.step2.incorporation_date' | transloco }} *
          </label>
          <input
            id="incorporationDate"
            type="month"
            class="form-control"
            formControlName="incorporationDate"
          />
          <div
            *ngIf="
              form.get('incorporationDate')?.touched &&
              form.get('incorporationDate')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step2.incorporation_date_required' | transloco }}
          </div>
        </div>

        <!-- Países donde haces negocios -->
        <div class="form-group mb-3">
          <label for="businessCountries">
            {{
              'RELAY_WIZARD.step2.business_countries' | transloco
            }}
            *
          </label>
          <select
            id="businessCountries"
            class="form-control"
            formControlName="businessCountries"
            multiple
          >
            <option value="US">Estados Unidos</option>
            <option value="MX">México</option>
            <option value="CA">Canadá</option>
            <option value="CO">Colombia</option>
            <option value="AR">Argentina</option>
            <option value="CL">Chile</option>
            <option value="ES">España</option>
            <option value="Other">Otro</option>
          </select>
          <small class="form-text text-muted">
            {{ 'RELAY_WIZARD.step2.business_countries_hint' | transloco }}
          </small>
          <div
            *ngIf="
              form.get('businessCountries')?.touched &&
              form.get('businessCountries')?.invalid
            "
            class="text-danger mt-1"
          >
            {{
              'RELAY_WIZARD.step2.business_countries_required' | transloco
            }}
          </div>
        </div>
      </form>
    </div>
  `,
})
export class RegisteredAgentAddressComponent
  extends FormWizardStepBaseComponent
{
  constructor(private wizardService: FormWizardService) {
    const formControls = {
      street: new FormControl('', Validators.required),
      aptSuite: new FormControl(''),
      city: new FormControl('', Validators.required),
      state: new FormControl('', Validators.required),
      zipCode: new FormControl('', Validators.required),
      country: new FormControl('United States', Validators.required),
      incorporationState: new FormControl('', Validators.required),
      incorporationDate: new FormControl('', Validators.required),
      businessCountries: new FormControl([], Validators.required),
    };

    super(2, wizardService.getSteps(), true, formControls);
  }
}

