import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  FormWizardService,
  FormWizardStepBaseComponent,
} from 'ngx-form-wizard';
import { SharedModule } from '../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  template: `<div class="p-4">
    <h4 class="mb-3">{{ 'WIZARD.client.title' | transloco }}</h4>

    <form [formGroup]="form">
      <div class="form-group mb-3">
        <label for="fullName">{{
          'WIZARD.client.full_name' | transloco
        }}</label>
        <input
          id="fullName"
          class="form-control"
          formControlName="fullName"
          [placeholder]="'WIZARD.client.full_name_placeholder' | transloco"
        />
        <div
          *ngIf="form.get('fullName')?.touched && form.get('fullName')?.invalid"
          class="text-danger mt-1"
        >
          {{ 'WIZARD.client.full_name_required' | transloco }}
        </div>
      </div>

      <div class="form-group mb-3">
        <label for="phone">{{ 'WIZARD.client.phone' | transloco }}</label>
        <input
          id="phone"
          class="form-control"
          formControlName="phone"
          [placeholder]="'WIZARD.client.phone_placeholder' | transloco"
        />
        <div
          *ngIf="form.get('phone')?.touched && form.get('phone')?.invalid"
          class="text-danger mt-1"
        >
          {{ 'WIZARD.client.phone_required' | transloco }}
        </div>
      </div>

      <div class="form-group mb-3">
        <label for="address">{{ 'WIZARD.client.address' | transloco }}</label>
        <input
          id="address"
          class="form-control"
          formControlName="address"
          [placeholder]="'WIZARD.client.address_placeholder' | transloco"
        />
        <div
          *ngIf="form.get('address')?.touched && form.get('address')?.invalid"
          class="text-danger mt-1"
        >
          {{ 'WIZARD.client.address_required' | transloco }}
        </div>
      </div>
    </form>
  </div> `,
})
export class ClientFormComponent extends FormWizardStepBaseComponent {
  //form: FormGroup;

  constructor(private wizardService: FormWizardService) {
    const formControls = {
      fullName: new FormControl('', Validators.required),
      phone: new FormControl('', Validators.required),
      address: new FormControl('', Validators.required),
    };

    // 🔹 stepId: 4 (o el número correspondiente en tu secuencia)
    super(4, wizardService.getSteps(), true, formControls);
  }
}
