import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../services/wizard-state.service';
import { Subscription } from 'rxjs';

/**
 * Formulario específico para el flujo de apertura de LLC
 * Este es el único paso que no se repite entre flujos
 */
@Component({
  selector: 'app-client-form-llc',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './client-form-llc.component.html',
  styleUrls: ['./client-form-llc.component.css']
})
export class ClientFormLLCComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 4;
  
  form!: FormGroup;
  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService
  ) {
    // Cargar datos guardados si existen
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    
    this.form = new FormGroup({
      fullName: new FormControl(savedData.fullName || '', Validators.required),
      phone: new FormControl(savedData.phone || '', Validators.required),
      address: new FormControl(savedData.address || '', Validators.required),
      // Campos específicos de LLC
      businessName: new FormControl(savedData.businessName || '', Validators.required),
      ein: new FormControl(savedData.ein || ''),
    });
  }

  ngOnInit(): void {
    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
    }

    // Guardar datos cuando el formulario cambia
    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.saveStepData();
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  /**
   * Guarda los datos del paso
   */
  private saveStepData(): void {
    if (this.form.valid) {
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }
}
