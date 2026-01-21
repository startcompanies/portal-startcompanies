import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { WizardStateService } from '../../services/wizard-state.service';
import { Subscription } from 'rxjs';

/**
 * Componente reutilizable para el paso de revisión final
 * Muestra un resumen completo de toda la información capturada
 * También maneja la vista de éxito después de enviar
 */
@Component({
  selector: 'app-wizard-final-review-step',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './final-review-step.component.html',
  styleUrls: ['./final-review-step.component.css']
})
export class WizardFinalReviewStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 5;
  @Input() previousSteps: number[] = [1, 2, 3, 4];
  @Input() serviceType: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria' = 'apertura-llc';
  
  // Estado para mostrar vista de éxito
  @Input() isSubmitted: boolean = false;
  @Input() isSubmitting: boolean = false;
  @Input() submitError: string | null = null;
  
  // Eventos para comunicar con el componente padre
  @Output() submitRequest = new EventEmitter<void>();
  @Output() goToPanel = new EventEmitter<void>();
  @Output() goToHome = new EventEmitter<void>();
  
  form!: FormGroup;
  private formSubscription?: Subscription;
  
  // Datos organizados para mostrar
  registrationData: any = {};
  statePlanData: any = {};
  paymentData: any = {};
  serviceData: any = {};
  members: any[] = [];

  constructor(
    private wizardStateService: WizardStateService,
    private router: Router
  ) {
    this.form = new FormGroup({
      confirm: new FormControl(false),
    });
  }

  /**
   * Emite el evento para enviar la solicitud
   */
  onSubmit(): void {
    if (this.form.get('confirm')?.value) {
      this.submitRequest.emit();
    }
  }

  /**
   * Navega al panel del usuario
   */
  navigateToPanel(): void {
    this.goToPanel.emit();
    this.router.navigate(['/panel']);
  }

  /**
   * Navega al home
   */
  navigateToHome(): void {
    this.goToHome.emit();
    this.router.navigate(['/']);
  }

  ngOnInit(): void {
    this.loadAllData();

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

  /**
   * Carga todos los datos de los pasos anteriores
   */
  private loadAllData(): void {
    const allData = this.wizardStateService.getAllData();
    
    // Paso 1: Datos de registro
    this.registrationData = allData.step1 || {};
    
    // Paso 2: Estado/Plan (para apertura y renovación)
    this.statePlanData = allData.step2 || {};
    
    // Paso 3: Datos de pago
    this.paymentData = allData.step3 || {};
    
    // Paso 4+: Datos del servicio específico
    if (this.serviceType === 'apertura-llc') {
      this.serviceData = allData.step4 || {};
      this.members = this.serviceData.members || [];
    } else if (this.serviceType === 'renovacion-llc') {
      this.serviceData = allData.step4 || {};
      this.members = this.serviceData.owners || [];
    } else if (this.serviceType === 'cuenta-bancaria') {
      // Para cuenta bancaria, los datos están en step2 o step3 dependiendo del flujo
      this.serviceData = allData.step3 || allData.step2 || {};
      this.members = this.serviceData.owners || [];
    }
  }

  /**
   * Guarda los datos del paso
   */
  private saveStepData(): void {
    this.wizardStateService.setStepData(this.stepNumber, this.form.value);
  }

  /**
   * Obtiene el título del servicio
   */
  getServiceTitle(): string {
    switch (this.serviceType) {
      case 'apertura-llc':
        return 'Apertura de LLC';
      case 'renovacion-llc':
        return 'Renovación de LLC';
      case 'cuenta-bancaria':
        return 'Cuenta Bancaria';
      default:
        return 'Servicio';
    }
  }

  /**
   * Formatea un valor booleano para mostrar
   */
  formatBoolean(value: any): string {
    if (value === true || value === 'true' || value === 'si' || value === 'yes') {
      return 'Sí';
    }
    if (value === false || value === 'false' || value === 'no') {
      return 'No';
    }
    return value || '-';
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatDate(value: string): string {
    if (!value) return '-';
    try {
      const date = new Date(value);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return value;
    }
  }

  /**
   * Formatea un monto de dinero
   */
  formatMoney(value: number): string {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  /**
   * Verifica si hay datos de miembros/propietarios
   */
  hasMembers(): boolean {
    return this.members && this.members.length > 0;
  }

  /**
   * Obtiene campos específicos para apertura LLC
   */
  getAperturaLlcFields(): { label: string; value: any }[] {
    const fields: { label: string; value: any }[] = [];
    const data = this.serviceData;
    
    if (data.llcName) fields.push({ label: 'Nombre de la LLC (Opción 1)', value: data.llcName });
    if (data.llcNameOption2) fields.push({ label: 'Nombre de la LLC (Opción 2)', value: data.llcNameOption2 });
    if (data.llcNameOption3) fields.push({ label: 'Nombre de la LLC (Opción 3)', value: data.llcNameOption3 });
    if (data.incorporationState) fields.push({ label: 'Estado de Incorporación', value: data.incorporationState });
    if (data.businessDescription) fields.push({ label: 'Actividad Principal', value: data.businessDescription });
    if (data.llcType) fields.push({ label: 'Tipo de LLC', value: data.llcType === 'single' ? 'Single Member' : 'Multi Member' });
    if (data.hasEin !== undefined) fields.push({ label: '¿Tiene EIN?', value: this.formatBoolean(data.hasEin) });
    if (data.einNumber) fields.push({ label: 'Número de EIN', value: data.einNumber });
    if (data.linkedin) fields.push({ label: 'LinkedIn', value: data.linkedin });
    if (data.website) fields.push({ label: 'Sitio Web', value: data.website });
    if (data.llcEmail) fields.push({ label: 'Email de la LLC', value: data.llcEmail });
    if (data.llcPhoneNumber) fields.push({ label: 'Teléfono de la LLC', value: data.llcPhoneNumber });
    
    return fields;
  }

  /**
   * Obtiene campos específicos para renovación LLC
   */
  getRenovacionLlcFields(): { label: string; value: any }[] {
    const fields: { label: string; value: any }[] = [];
    const data = this.serviceData;
    
    if (data.llcName) fields.push({ label: 'Nombre de la LLC', value: data.llcName });
    if (data.state) fields.push({ label: 'Estado', value: data.state });
    if (data.llcType) fields.push({ label: 'Tipo de LLC', value: data.llcType === 'single' ? 'Single Member' : 'Multi Member' });
    if (data.mainActivity) fields.push({ label: 'Actividad Principal', value: data.mainActivity });
    if (data.einNumber) fields.push({ label: 'Número de EIN', value: data.einNumber });
    if (data.llcCreationDate) fields.push({ label: 'Fecha de Creación', value: this.formatDate(data.llcCreationDate) });
    if (data.hasPropertyInUSA !== undefined) fields.push({ label: '¿Tiene propiedades en USA?', value: this.formatBoolean(data.hasPropertyInUSA) });
    if (data.tieneCuentasBancarias !== undefined) fields.push({ label: '¿Tiene cuentas bancarias?', value: this.formatBoolean(data.tieneCuentasBancarias) });
    if (data.totalRevenue2025) fields.push({ label: 'Ingresos Totales 2025', value: this.formatMoney(data.totalRevenue2025) });
    
    return fields;
  }

  /**
   * Obtiene campos específicos para cuenta bancaria
   */
  getCuentaBancariaFields(): { label: string; value: any }[] {
    const fields: { label: string; value: any }[] = [];
    const data = this.serviceData;
    
    if (data.legalBusinessName) fields.push({ label: 'Nombre Legal del Negocio', value: data.legalBusinessName });
    if (data.businessType) fields.push({ label: 'Tipo de Negocio', value: data.businessType });
    if (data.industry) fields.push({ label: 'Industria', value: data.industry });
    if (data.numberOfEmployees) fields.push({ label: 'Número de Empleados', value: data.numberOfEmployees });
    if (data.briefDescription) fields.push({ label: 'Descripción del Negocio', value: data.briefDescription });
    if (data.einNumber) fields.push({ label: 'Número de EIN', value: data.einNumber });
    if (data.incorporationState) fields.push({ label: 'Estado de Incorporación', value: data.incorporationState });
    if (data.websiteOrSocialMedia) fields.push({ label: 'Sitio Web / Red Social', value: data.websiteOrSocialMedia });
    if (data.validatorFirstName) fields.push({ label: 'Nombre del Validador', value: `${data.validatorFirstName} ${data.validatorLastName || ''}` });
    if (data.validatorWorkEmail) fields.push({ label: 'Email del Validador', value: data.validatorWorkEmail });
    if (data.isMultiMember !== undefined) fields.push({ label: '¿Es Multi-Member?', value: this.formatBoolean(data.isMultiMember) });
    
    return fields;
  }

  /**
   * Obtiene los campos del servicio según el tipo
   */
  getServiceFields(): { label: string; value: any }[] {
    switch (this.serviceType) {
      case 'apertura-llc':
        return this.getAperturaLlcFields();
      case 'renovacion-llc':
        return this.getRenovacionLlcFields();
      case 'cuenta-bancaria':
        return this.getCuentaBancariaFields();
      default:
        return [];
    }
  }
}
