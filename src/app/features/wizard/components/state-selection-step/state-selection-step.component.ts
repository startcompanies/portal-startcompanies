import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../services/wizard-state.service';
import { Subscription } from 'rxjs';
import { WizardPlansService } from '../../services/wizard-plans.service';

/**
 * Componente reutilizable para la selección de estado
 * Usado en flujos que requieren selección de estado/precio
 */
@Component({
  selector: 'app-wizard-state-selection-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './state-selection-step.component.html',
  styleUrls: ['./state-selection-step.component.css']
})
export class WizardStateSelectionStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 2;
  
  form!: FormGroup;
  // Renovación LLC: estados soportados para cotización directa (centralizado en WizardPlansService)
  states: string[] = [];
  llcTypes = [
    { value: 'single', label: 'Single Member LLC' },
    { value: 'multi', label: 'Multi Member LLC' }
  ];
  amount: number | null = null;
  showUnsupportedAlert = false;
  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService,
    private wizardPlansService: WizardPlansService
  ) {
    this.states = this.wizardPlansService.getRenewalStates();

    // Cargar datos guardados si existen
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    
    this.form = new FormGroup({
      state: new FormControl(savedData.state || '', Validators.required),
      llcType: new FormControl(savedData.llcType || '', Validators.required),
      service: new FormControl(savedData.service || ''),
      amount: new FormControl(savedData.amount || null),
    });
  }

  ngOnInit(): void {
    // Renovación: setear etiqueta de servicio para que se muestre en el resumen de pago si hace falta
    const serviceLabel = this.wizardPlansService.getServiceLabel(this.wizardStateService.getServiceType());
    if (serviceLabel && !this.form.get('service')?.value) {
      this.form.get('service')?.setValue(serviceLabel, { emitEvent: false });
    }

    // Guardar datos cuando el formulario cambia
    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.recalculateAmount();
      this.saveStepData();
    });

    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
    }

    // Calcular monto inicial
    this.recalculateAmount();
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  getFormData(): Record<string, unknown> {
    return this.form.value;
  }

  /**
   * Guarda los datos del paso
   */
  private saveStepData(): void {
    // Guardar aunque no sea válido para que el padre pueda leer estado/alerta
    this.wizardStateService.setStepData(this.stepNumber, this.form.value);
  }

  /**
   * Calcula el monto de renovación según estado + tipo de LLC.
   * Si el estado no está soportado, muestra alerta y deja amount=null.
   */
  private recalculateAmount(): void {
    const state = this.form.get('state')?.value as string;
    const llcType = this.form.get('llcType')?.value as 'single' | 'multi' | '';

    if (!state || !llcType) {
      this.amount = null;
      this.showUnsupportedAlert = false;
      this.form.get('amount')?.setValue(null, { emitEvent: false });
      return;
    }

    const result = this.wizardPlansService.calculateRenewalAmount(state, llcType);
    this.showUnsupportedAlert = !result.supported;
    this.amount = result.amount;
    this.form.get('amount')?.setValue(result.amount, { emitEvent: false });
  }
}
