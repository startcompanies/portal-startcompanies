import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  FormWizardService,
  FormWizardStepBaseComponent,
} from 'ngx-form-wizard';
import { SharedModule } from '../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { SafeStorageService } from '../../services/safe-storage.service';

@Component({
  selector: 'app-state-selection',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  template: `
    <div class="p-4">
      <h4 class="mb-3">{{ 'WIZARD.state_step.title' | transloco }}</h4>

      <form [formGroup]="form">
        <div class="form-group">
          <label for="state">{{ 'WIZARD.state_step.label' | transloco }}</label>
          <select id="state" class="form-control" formControlName="state">
            <option value="">
              {{ 'WIZARD.state_step.placeholder' | transloco }}
            </option>
            <option *ngFor="let state of states" [value]="state">
              {{
                'WIZARD.state_step.options.' + state.toLowerCase() | transloco
              }}
            </option>
          </select>

          <div
            *ngIf="form.get('state')?.touched && form.get('state')?.invalid"
            class="text-danger mt-1"
          >
            {{ 'WIZARD.state_step.required' | transloco }}
          </div>
        </div>
      </form>
    </div>
  `,
})
export class StateSelectionComponent
  extends FormWizardStepBaseComponent
  implements OnInit
{
  //form: FormGroup;
  states = ['Florida', 'Delaware', 'Texas', 'Wyoming'];

  constructor(
    private wizardService: FormWizardService,
    private storage: SafeStorageService
  ) {
    const formControls = {
      state: new FormControl('', Validators.required),
      service: new FormControl(''),
    };

    // 🔹 Super importante: aquí pasamos el índice del paso y los controles
    super(1, wizardService.getSteps(), true, formControls);
  }

  ngOnInit(): void {
    this.form.get('service')?.setValue(this.storage.getItem('selectedPlan'));
  }
}
