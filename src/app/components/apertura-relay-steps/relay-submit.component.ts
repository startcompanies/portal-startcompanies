import { Component } from '@angular/core';
import {
  FormWizardService,
  FormWizardStepBaseComponent,
} from 'ngx-form-wizard';
import { FormControl, Validators } from '@angular/forms';
import { SharedModule } from '../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-relay-submit',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  template: `
    <div class="p-4">
      <!-- Confirmación de Veracidad y Firma Electrónica -->
      <div class="mb-4">
        <h5 class="mb-3">
          {{ 'RELAY_WIZARD.step7.veracity_title' | transloco }} *
        </h5>
        
        <!-- Área de texto para firma electrónica -->
        <div class="form-group mb-3">
          <textarea
            class="form-control"
            formControlName="electronicSignature"
            rows="5"
            [placeholder]="'RELAY_WIZARD.step7.signature_placeholder' | transloco"
          ></textarea>
        </div>

        <!-- Checkbox de confirmación -->
        <div class="form-check mb-3">
          <input
            class="form-check-input"
            type="checkbox"
            id="veracityCheck"
            formControlName="veracityAccepted"
          />
          <label class="form-check-label" for="veracityCheck">
            {{ 'RELAY_WIZARD.step7.veracity_checkbox' | transloco }}
          </label>
          <div
            *ngIf="
              form.get('veracityAccepted')?.touched &&
              form.get('veracityAccepted')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step7.veracity_required' | transloco }}
          </div>
        </div>
      </div>

      <!-- Términos y Condiciones -->
      <div class="mb-4">
        <h5 class="mb-3">
          {{ 'RELAY_WIZARD.step7.terms_title' | transloco }} *
        </h5>

        <!-- Área de texto scrollable con términos -->
        <div class="form-group mb-3">
          <div
            class="border rounded p-3"
            style="max-height: 300px; overflow-y: auto; background-color: #f8f9fa;"
          >
            <div class="mb-3">
              <strong>{{ 'RELAY_WIZARD.step7.terms.what_includes.title' | transloco }}</strong>
              <ul class="mb-0 mt-2">
                <li>{{ 'RELAY_WIZARD.step7.terms.what_includes.item1' | transloco }}</li>
                <li>{{ 'RELAY_WIZARD.step7.terms.what_includes.item2' | transloco }}</li>
                <li>{{ 'RELAY_WIZARD.step7.terms.what_includes.item3' | transloco }}</li>
                <li>{{ 'RELAY_WIZARD.step7.terms.what_includes.item4' | transloco }}</li>
              </ul>
            </div>

            <div class="mb-3">
              <strong>{{ 'RELAY_WIZARD.step7.terms.what_not_includes.title' | transloco }}</strong>
              <ul class="mb-0 mt-2">
                <li>{{ 'RELAY_WIZARD.step7.terms.what_not_includes.item1' | transloco }}</li>
                <li>{{ 'RELAY_WIZARD.step7.terms.what_not_includes.item2' | transloco }}</li>
                <li>{{ 'RELAY_WIZARD.step7.terms.what_not_includes.item3' | transloco }}</li>
              </ul>
            </div>

            <div>
              <strong>{{ 'RELAY_WIZARD.step7.terms.guarantee.title' | transloco }}</strong>
              <p class="mb-0 mt-2">
                {{ 'RELAY_WIZARD.step7.terms.guarantee.content' | transloco }}
              </p>
            </div>
          </div>
        </div>

        <!-- Checkbox de aceptación de términos -->
        <div class="form-check mb-3">
          <input
            class="form-check-input"
            type="checkbox"
            id="termsCheck"
            formControlName="termsAccepted"
          />
          <label class="form-check-label" for="termsCheck">
            {{ 'RELAY_WIZARD.step7.terms_checkbox' | transloco }}
          </label>
          <div
            *ngIf="
              form.get('termsAccepted')?.touched &&
              form.get('termsAccepted')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step7.terms_required' | transloco }}
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RelaySubmitComponent extends FormWizardStepBaseComponent {
  constructor(private wizardService: FormWizardService) {
    const formControls = {
      electronicSignature: new FormControl('', Validators.required),
      veracityAccepted: new FormControl(false, [Validators.requiredTrue]),
      termsAccepted: new FormControl(false, [Validators.requiredTrue]),
    };

    // Este paso es el número 7 (último)
    super(7, wizardService.getSteps(), true, formControls);
  }
}

