import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { RequestFlowStateService } from '../../services/request-flow-state.service';
import { RequestFlowStep, ServiceType } from '../../models/request-flow-context';

/**
 * Componente para seleccionar el tipo de servicio
 * Usado en flujos PANEL_CLIENT y PANEL_PARTNER cuando no viene serviceType en la URL
 */
@Component({
  selector: 'app-service-type-selection-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './service-type-selection-step.component.html',
  styleUrls: ['./service-type-selection-step.component.css']
})
export class ServiceTypeSelectionStepComponent implements OnInit {
  @Input() stepNumber: number = 1;
  @Input() context: string = 'panel';
  
  @Output() serviceTypeSelected = new EventEmitter<ServiceType>();
  @Output() stepValid = new EventEmitter<boolean>();
  
  form!: FormGroup;
  selectedServiceType: ServiceType | null = null;
  
  serviceTypes: Array<{
    value: ServiceType;
    labelKey: string;
    descriptionKey: string;
    icon: string;
  }> = [
    {
      value: 'apertura-llc',
      labelKey: 'PANEL.select_service.types.apertura_llc.label',
      descriptionKey: 'PANEL.select_service.types.apertura_llc.description',
      icon: 'bi bi-building'
    },
    {
      value: 'renovacion-llc',
      labelKey: 'PANEL.select_service.types.renovacion_llc.label',
      descriptionKey: 'PANEL.select_service.types.renovacion_llc.description',
      icon: 'bi bi-arrow-repeat'
    },
    {
      value: 'cuenta-bancaria',
      labelKey: 'PANEL.select_service.types.cuenta_bancaria.label',
      descriptionKey: 'PANEL.select_service.types.cuenta_bancaria.description',
      icon: 'bi bi-bank'
    }
  ];
  
  constructor(
    private fb: FormBuilder,
    private flowStateService: RequestFlowStateService
  ) {
    // Cargar datos guardados si existen
    const savedData = this.flowStateService.getStepData(RequestFlowStep.SERVICE_TYPE_SELECTION);
    
    this.form = this.fb.group({
      serviceType: [savedData?.serviceType || null, Validators.required]
    });
  }
  
  ngOnInit(): void {
    // Guardar cambios en el estado
    this.form.valueChanges.subscribe(() => {
      const serviceType = this.form.get('serviceType')?.value;
      this.selectedServiceType = serviceType;
      
      if (serviceType) {
        this.flowStateService.setStepData(RequestFlowStep.SERVICE_TYPE_SELECTION, { serviceType });
        this.serviceTypeSelected.emit(serviceType);
        this.updateStepValidity();
      }
    });
    
    // Si hay un tipo guardado, seleccionarlo
    const savedServiceType = this.form.get('serviceType')?.value;
    if (savedServiceType) {
      this.selectedServiceType = savedServiceType;
      this.updateStepValidity();
    }
  }
  
  /**
   * Selecciona un tipo de servicio
   */
  selectServiceType(serviceType: ServiceType): void {
    this.form.patchValue({ serviceType }, { emitEvent: true });
  }
  
  /**
   * Actualiza la validez del paso
   */
  private updateStepValidity(): void {
    const isValid = this.selectedServiceType !== null;
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
    return {
      serviceType: this.selectedServiceType
    };
  }
  
  get serviceType() {
    return this.form.get('serviceType');
  }
}
