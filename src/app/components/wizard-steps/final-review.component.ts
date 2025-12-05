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
  selector: 'app-final-review',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  template: `<div class="p-4">
    <h4 class="mb-4">{{ 'WIZARD.review.title' | transloco }}</h4>

    <p class="text-muted">
      {{ 'WIZARD.review.description' | transloco }}
    </p>

    <div *ngFor="let item of prevSteps" class="mb-3 border-bottom pb-2">
      <h6 class="text-primary">{{ item.title }}</h6>
      <pre class="bg-light p-2 rounded small">{{ item.data | json }}</pre>
    </div>

    <div [formGroup]="form" class="form-check mt-3">
      <input
        type="checkbox"
        class="form-check-input"
        id="confirmCheck"
        formControlName="confirm"
      />
      <label class="form-check-label" for="confirmCheck">
        {{ 'WIZARD.review.confirm_label' | transloco }}
      </label>
    </div>
  </div> `,
})
export class FinalReviewComponent extends FormWizardStepBaseComponent {
  prevSteps: IWizardStep[] = [];

  constructor(private wizardService: FormWizardService) {
    // ✅ Paso 5 con control reactivo formal dentro de los formcontrols
    const formcontrols = {
      confirm: new FormControl(false, [Validators.requiredTrue]),
    };

    // (stepNo, steps, isFormStep, formcontrols)
    super(5, wizardService.getSteps(), true, formcontrols);

    this.prevSteps = this.steps.slice(0, this.stepNo - 1);
  }
}
