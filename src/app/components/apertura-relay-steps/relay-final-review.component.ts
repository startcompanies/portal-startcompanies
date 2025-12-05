import { Component } from '@angular/core';
import {
  IWizardStep,
  FormWizardService,
  FormWizardStepBaseComponent,
} from 'ngx-form-wizard';
import { FormControl, Validators } from '@angular/forms';
import { SharedModule } from '../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-relay-final-review',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  template: `<div class="p-4">
    <h4 class="mb-4">{{ 'RELAY_WIZARD.step6.title' | transloco }}</h4>

    <p class="text-muted mb-4">
      {{ 'RELAY_WIZARD.step6.description' | transloco }}
    </p>

    <div *ngFor="let item of prevSteps" class="mb-3 border-bottom pb-3">
      <h6 class="text-primary mb-2">{{ item.title }}</h6>
      <div class="bg-light p-3 rounded">
        <pre class="mb-0 small">{{ item.data | json }}</pre>
      </div>
    </div>

    <div [formGroup]="form" class="form-check mt-4">
      <input
        type="checkbox"
        class="form-check-input"
        id="confirmCheck"
        formControlName="confirm"
      />
      <label class="form-check-label" for="confirmCheck">
        {{ 'RELAY_WIZARD.step6.confirm_label' | transloco }}
      </label>
      <div
        *ngIf="form.get('confirm')?.touched && form.get('confirm')?.invalid"
        class="text-danger mt-1"
      >
        {{ 'RELAY_WIZARD.step6.confirm_required' | transloco }}
      </div>
    </div>
  </div> `,
})
export class RelayFinalReviewComponent extends FormWizardStepBaseComponent {
  prevSteps: IWizardStep[] = [];

  constructor(private wizardService: FormWizardService) {
    const formcontrols = {
      confirm: new FormControl(false, [Validators.requiredTrue]),
    };

    super(6, wizardService.getSteps(), true, formcontrols);

    this.prevSteps = this.steps.slice(0, this.stepNo - 1);
  }
}

