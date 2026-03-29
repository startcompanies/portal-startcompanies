import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RequestFlowStateService } from '../../../../shared/services/request-flow-state.service';
import { RequestFlowStep } from '../../../../shared/models/request-flow-context';
import { IntlTelInputComponent } from '../../../../shared/components/intl-tel-input/intl-tel-input.component';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * Componente para asociar un cliente existente en el panel
 * Usado en el flujo PANEL_CLIENT donde el usuario ya está autenticado
 */
@Component({
  selector: 'app-client-association-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IntlTelInputComponent, TranslocoPipe],
  templateUrl: './client-association-step.component.html',
  styleUrls: ['./client-association-step.component.css']
})
export class ClientAssociationStepComponent implements OnInit {
  @Input() stepNumber: number = 1;
  @Input() context: string = 'panel-client';
  
  @Output() clientAssociated = new EventEmitter<{ clientId: number; client: any }>();
  @Output() stepValid = new EventEmitter<boolean>();
  
  form!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  
  constructor(
    private fb: FormBuilder,
    private flowStateService: RequestFlowStateService
  ) {
    // Cargar datos guardados si existen
    const savedData = this.flowStateService.getStepData(RequestFlowStep.CLIENT_ASSOCIATION);
    
    this.form = this.fb.group({
      clientId: [savedData.clientId || null, Validators.required],
      clientFirstName: [savedData.clientFirstName || ''],
      clientLastName: [savedData.clientLastName || ''],
      clientEmail: [savedData.clientEmail || '', [Validators.required, Validators.email]],
      clientPhone: [savedData.clientPhone || '']
    });
  }
  
  ngOnInit(): void {
    // Guardar cambios en el estado
    this.form.valueChanges.subscribe(() => {
      this.flowStateService.setStepData(RequestFlowStep.CLIENT_ASSOCIATION, this.form.value);
      this.stepValid.emit(this.form.valid);
    });
    
    // Emitir estado inicial
    this.stepValid.emit(this.form.valid);
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
  
  get clientId() {
    return this.form.get('clientId');
  }
  
  get clientEmail() {
    return this.form.get('clientEmail');
  }
  
  get clientFirstName() {
    return this.form.get('clientFirstName');
  }
  
  get clientLastName() {
    return this.form.get('clientLastName');
  }
  
  get clientPhone() {
    return this.form.get('clientPhone');
  }
}
