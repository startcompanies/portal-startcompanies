import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WizardStateService } from '../../../../../shared/services/wizard-state.service';

@Component({
  selector: 'app-llc-type-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  templateUrl: './llc-type-step.component.html',
  styleUrl: './llc-type-step.component.css'
})
export class LlcTypeStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 5;

  form!: FormGroup;
  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService
  ) {
    const savedData = this.wizardStateService.getStepData(this.stepNumber) || {};

    this.form = new FormGroup({
      llcType: new FormControl(
        savedData.llcType || '',
        Validators.required
      )
    });
  }

  ngOnInit(): void {
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
    }

    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.saveStepData();
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  private saveStepData() {
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
    }

    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.saveStepData();
    });
  }
}
