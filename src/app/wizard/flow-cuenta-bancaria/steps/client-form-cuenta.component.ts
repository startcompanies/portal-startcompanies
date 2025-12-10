import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../services/wizard-state.service';
import { Subscription } from 'rxjs';

/**
 * Formulario específico para el flujo de cuenta bancaria
 */
@Component({
  selector: 'app-client-form-cuenta',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './client-form-cuenta.component.html',
  styleUrls: ['./client-form-cuenta.component.css']
})
export class ClientFormCuentaComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 2; // Puede variar según el flujo
  
  form!: FormGroup;
  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService
  ) {
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    
    this.form = new FormGroup({
      fullName: new FormControl(savedData.fullName || '', Validators.required),
      phone: new FormControl(savedData.phone || '', Validators.required),
      address: new FormControl(savedData.address || '', Validators.required),
      // Campos específicos de cuenta bancaria
      accountType: new FormControl(savedData.accountType || '', Validators.required),
      bankName: new FormControl(savedData.bankName || '', Validators.required),
      taxId: new FormControl(savedData.taxId || '', Validators.required),
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

  private saveStepData(): void {
    if (this.form.valid) {
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }
}
