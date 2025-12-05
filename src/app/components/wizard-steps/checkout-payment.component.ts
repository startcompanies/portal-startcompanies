import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  FormWizardService,
  FormWizardStepBaseComponent,
  IWizardStep,
} from 'ngx-form-wizard';
import { SharedModule } from '../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-checkout-payment',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  template: `
    <div class="p-4">
      <h4 class="mb-3">{{ 'WIZARD.checkout.title' | transloco }}</h4>
      <p>{{ 'WIZARD.checkout.summary' | transloco }}</p>

      <ul class="list-group mb-4">
        <li class="list-group-item">
          <strong>{{ 'WIZARD.checkout.service_label' | transloco }}:</strong>
          {{
            prevSteps[0].data.service || ('WIZARD.checkout.not_specified' | transloco)
          }}
        </li>
        <li class="list-group-item">
          <strong>{{ 'WIZARD.checkout.state_label' | transloco }}:</strong>
          {{
            prevSteps[0].data.state ||
              ('WIZARD.checkout.not_selected' | transloco)
          }}
        </li>
      </ul>

      <form [formGroup]="form">
        <div class="form-group">
          <label for="paymentMethod">{{
            'WIZARD.checkout.payment_method' | transloco
          }}</label>
          <select
            id="paymentMethod"
            class="form-control"
            formControlName="paymentMethod"
          >
            <option value="">
              {{ 'WIZARD.checkout.select_method' | transloco }}
            </option>
            <option value="card">
              {{ 'WIZARD.checkout.card' | transloco }}
            </option>
            <option value="paypal">
              {{ 'WIZARD.checkout.paypal' | transloco }}
            </option>
          </select>

          <div
            *ngIf="
              form.get('paymentMethod')?.touched &&
              form.get('paymentMethod')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'WIZARD.checkout.required_method' | transloco }}
          </div>
        </div>
      </form>
    </div>
  `,
})
export class CheckoutPaymentComponent extends FormWizardStepBaseComponent {
  prevSteps: IWizardStep[] = [];

  constructor(private wizardService: FormWizardService) {
    const formControls = {
      paymentMethod: new FormControl('', Validators.required),
    };

    // 🔹 El número del paso (por ejemplo 3) debe ser único y secuencial
    super(3, wizardService.getSteps(), true, formControls);

    this.prevSteps = this.steps.slice(0, this.stepNo - 1);

    console.log(this.prevSteps);
  }
}
