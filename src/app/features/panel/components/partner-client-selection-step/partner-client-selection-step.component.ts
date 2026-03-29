import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RequestFlowStateService } from '../../../../shared/services/request-flow-state.service';
import { RequestFlowStep } from '../../../../shared/models/request-flow-context';
import { PartnerClientsService } from '../../services/partner-clients.service';
import { IntlTelInputComponent } from '../../../../shared/components/intl-tel-input/intl-tel-input.component';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * Componente para seleccionar o crear un cliente del partner
 * Usado en el flujo PANEL_PARTNER
 */
@Component({
  selector: 'app-partner-client-selection-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IntlTelInputComponent, TranslocoPipe],
  templateUrl: './partner-client-selection-step.component.html',
  styleUrls: ['./partner-client-selection-step.component.css']
})
export class PartnerClientSelectionStepComponent implements OnInit {
  @Input() stepNumber: number = 1;
  @Input() context: string = 'panel-partner';
  
  @Output() clientSelected = new EventEmitter<{ clientId: number; client: any }>();
  @Output() clientCreated = new EventEmitter<{ clientId: number; client: any }>();
  @Output() stepValid = new EventEmitter<boolean>();
  
  form!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  
  constructor(
    private fb: FormBuilder,
    private flowStateService: RequestFlowStateService,
    private partnerClientsService: PartnerClientsService
  ) {
    // Cargar datos guardados si existen
    const savedData = this.flowStateService.getStepData(RequestFlowStep.CLIENT_SELECTION);
    
    this.form = this.fb.group({
      clientFirstName: [savedData.clientFirstName || '', Validators.required],
      clientLastName: [savedData.clientLastName || '', Validators.required],
      clientEmail: [savedData.clientEmail || '', [Validators.required, Validators.email]],
      clientPhone: [savedData.clientPhone || '']
    });
  }
  
  ngOnInit(): void {
    // Guardar cambios en el estado
    this.form.valueChanges.subscribe(() => {
      this.flowStateService.setStepData(RequestFlowStep.CLIENT_SELECTION, this.form.value);
      this.updateStepValidity();
    });
    
    // Validar inicialmente
    this.updateStepValidity();
  }
  
  /**
   * Actualiza la validez del paso
   */
  private updateStepValidity(): void {
    const isValid = this.form.valid;
    this.stepValid.emit(isValid);
  }
  
  /**
   * Valida el paso actual
   */
  validate(): boolean {
    this.form.markAllAsTouched();
    return this.form.valid;
  }
  
  /**
   * Obtiene los datos del formulario
   */
  getFormData(): any {
    return this.form.value;
  }
  
  get clientFirstName() {
    return this.form.get('clientFirstName');
  }
  
  get clientLastName() {
    return this.form.get('clientLastName');
  }
  
  get clientEmail() {
    return this.form.get('clientEmail');
  }
  
  get clientPhone() {
    return this.form.get('clientPhone');
  }
}
