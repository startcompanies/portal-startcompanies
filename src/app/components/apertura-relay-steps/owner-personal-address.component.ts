import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  FormWizardService,
  FormWizardStepBaseComponent,
} from 'ngx-form-wizard';
import { SharedModule } from '../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-owner-personal-address',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  template: `
    <div class="p-4">
      <h4 class="mb-4">
        {{ 'RELAY_WIZARD.step4.title' | transloco }}
      </h4>

      <form [formGroup]="form">
        <!-- Calle y número -->
        <div class="form-group mb-3">
          <label for="street">
            {{ 'RELAY_WIZARD.step4.street' | transloco }} *
          </label>
          <input
            id="street"
            type="text"
            class="form-control"
            formControlName="street"
            [placeholder]="'RELAY_WIZARD.step4.street_placeholder' | transloco"
          />
          <div
            *ngIf="form.get('street')?.touched && form.get('street')?.invalid"
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step4.street_required' | transloco }}
          </div>
        </div>

        <!-- Suite / Apto -->
        <div class="form-group mb-3">
          <label for="suiteApt">
            {{ 'RELAY_WIZARD.step4.suite_apt' | transloco }}
          </label>
          <input
            id="suiteApt"
            type="text"
            class="form-control"
            formControlName="suiteApt"
            [placeholder]="'RELAY_WIZARD.step4.suite_apt_placeholder' | transloco"
          />
        </div>

        <!-- Ciudad -->
        <div class="form-group mb-3">
          <label for="city">
            {{ 'RELAY_WIZARD.step4.city' | transloco }} *
          </label>
          <input
            id="city"
            type="text"
            class="form-control"
            formControlName="city"
            [placeholder]="'RELAY_WIZARD.step4.city_placeholder' | transloco"
          />
          <div
            *ngIf="form.get('city')?.touched && form.get('city')?.invalid"
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step4.city_required' | transloco }}
          </div>
        </div>

        <!-- Estado / Provincia -->
        <div class="form-group mb-3">
          <label for="stateProvince">
            {{ 'RELAY_WIZARD.step4.state_province' | transloco }} *
          </label>
          <input
            id="stateProvince"
            type="text"
            class="form-control"
            formControlName="stateProvince"
            [placeholder]="'RELAY_WIZARD.step4.state_province_placeholder' | transloco"
          />
          <div
            *ngIf="
              form.get('stateProvince')?.touched &&
              form.get('stateProvince')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step4.state_province_required' | transloco }}
          </div>
        </div>

        <!-- Postal / Zip Code -->
        <div class="form-group mb-3">
          <label for="zipCode">
            {{ 'RELAY_WIZARD.step4.zip_code' | transloco }} *
          </label>
          <input
            id="zipCode"
            type="text"
            class="form-control"
            formControlName="zipCode"
            [placeholder]="'RELAY_WIZARD.step4.zip_code_placeholder' | transloco"
          />
          <div
            *ngIf="
              form.get('zipCode')?.touched &&
              form.get('zipCode')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step4.zip_code_required' | transloco }}
          </div>
        </div>

        <!-- País -->
        <div class="form-group mb-3">
          <label for="country">
            {{ 'RELAY_WIZARD.step4.country' | transloco }} *
          </label>
          <select id="country" class="form-control" formControlName="country">
            <option value="">
              {{ 'RELAY_WIZARD.step4.select_country' | transloco }}
            </option>
            <option value="MX">México</option>
            <option value="US">Estados Unidos</option>
            <option value="CA">Canadá</option>
            <option value="CO">Colombia</option>
            <option value="AR">Argentina</option>
            <option value="CL">Chile</option>
            <option value="ES">España</option>
            <option value="Other">Otro</option>
          </select>
          <div
            *ngIf="
              form.get('country')?.touched && form.get('country')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step4.country_required' | transloco }}
          </div>
        </div>

        <!-- Adjuntar factura de servicio -->
        <div class="form-group mb-3">
          <label for="serviceBill">
            {{ 'RELAY_WIZARD.step4.service_bill' | transloco }} *
          </label>
          <input
            id="serviceBill"
            type="file"
            class="form-control"
            formControlName="serviceBill"
            accept=".pdf,.jpg,.jpeg,.png"
            (change)="onFileChange($event)"
          />
          <small class="form-text text-muted">
            <ul class="list-unstyled mt-2 mb-0">
              <li>
                • {{ 'RELAY_WIZARD.step4.service_bill_hint1' | transloco }}
              </li>
              <li>
                • {{ 'RELAY_WIZARD.step4.service_bill_hint2' | transloco }}
              </li>
              <li>
                • {{ 'RELAY_WIZARD.step4.service_bill_hint3' | transloco }}
              </li>
            </ul>
          </small>
          <div
            *ngIf="
              form.get('serviceBill')?.touched &&
              form.get('serviceBill')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step4.service_bill_required' | transloco }}
          </div>
        </div>
      </form>
    </div>
  `,
})
export class OwnerPersonalAddressComponent extends FormWizardStepBaseComponent {
  constructor(private wizardService: FormWizardService) {
    const formControls = {
      street: new FormControl('', Validators.required),
      suiteApt: new FormControl(''),
      city: new FormControl('', Validators.required),
      stateProvince: new FormControl('', Validators.required),
      zipCode: new FormControl('', Validators.required),
      country: new FormControl('', Validators.required),
      serviceBill: new FormControl(null, Validators.required),
    };

    super(4, wizardService.getSteps(), true, formControls);
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.form.get('serviceBill')?.setValue(file);
    }
  }
}

