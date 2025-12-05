import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  FormWizardService,
  FormWizardStepBaseComponent,
} from 'ngx-form-wizard';
import { SharedModule } from '../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-llc-type',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  template: `
    <div class="p-4">
      <h4 class="mb-4">{{ 'RELAY_WIZARD.step5.title' | transloco }}</h4>

      <form [formGroup]="form">
        <div class="form-group">
          <label class="d-block mb-3">
            {{ 'RELAY_WIZARD.step5.question' | transloco }}
          </label>

          <div class="form-check mb-3">
            <input
              class="form-check-input"
              type="radio"
              id="singleMember"
              formControlName="llcType"
              value="single"
            />
            <label class="form-check-label" for="singleMember">
              {{ 'RELAY_WIZARD.step5.single_member' | transloco }}
            </label>
          </div>

          <div class="form-check mb-3">
            <input
              class="form-check-input"
              type="radio"
              id="multiMember"
              formControlName="llcType"
              value="multi"
            />
            <label class="form-check-label" for="multiMember">
              {{ 'RELAY_WIZARD.step5.multi_member' | transloco }}
            </label>
          </div>

          <div
            *ngIf="
              form.get('llcType')?.touched && form.get('llcType')?.invalid
            "
            class="text-danger mt-2"
          >
            {{ 'RELAY_WIZARD.step5.llc_type_required' | transloco }}
          </div>
        </div>
      </form>
    </div>
  `,
})
export class LlcTypeComponent extends FormWizardStepBaseComponent {
  constructor(private wizardService: FormWizardService) {
    const formControls = {
      llcType: new FormControl('', Validators.required),
    };

    super(5, wizardService.getSteps(), true, formControls);
  }
}

