import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormWizardService,
  FormWizardStepBaseComponent,
  IWizardStep,
} from 'ngx-form-wizard';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-zoho-submit',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  template: `<div class="p-4 text-center">
    <h4 class="mb-3">{{ 'WIZARD.zoho_step.title' | transloco }}</h4>
    <p>{{ 'WIZARD.zoho_step.subtitle' | transloco }}</p>
  </div>`,
})
export class ZohoSubmitComponent extends FormWizardStepBaseComponent {
  loading = false;
  success = false;
  error = false;
  prevSteps: IWizardStep[] = [];

  constructor(private wizardService: FormWizardService) {
    // Este paso es el número 6 (último)
    super(6, wizardService.getSteps(), false);
    this.prevSteps = this.steps.slice(0, this.stepNo - 1);
  }
}
