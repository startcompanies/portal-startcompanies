import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
// Comentado temporalmente - ngx-form-wizard incompatible con Angular 18
// import {
//   FormWizardService,
//   FormWizardStepBaseComponent,
// } from 'ngx-form-wizard';
import { SharedModule } from '../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-basic-register',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  template: `
    <div>
      <h4>{{ 'WIZARD.steps.register' | transloco }}</h4>
      <form [formGroup]="form">
        <div class="form-group">
          <label>{{ 'CONTACT.email' | transloco }}</label>
          <input class="form-control" formControlName="email" />
        </div>
        <div class="form-group">
          <label>{{ 'WIZARD.password' | transloco }}</label>
          <input
            type="password"
            class="form-control"
            formControlName="password"
          />
        </div>
      </form>
    </div>
  `,
})
// export class BasicRegister extends FormWizardStepBaseComponent { // Comentado temporalmente
export class BasicRegister {
  form: any; // Temporal
  constructor(/* private wizardService: FormWizardService */) { // Comentado temporalmente
    const formControls = {
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required),
    };
    // super(1, wizardService.getSteps(), true, formControls); // Comentado temporalmente
    this.form = formControls; // Temporal
  }
}
