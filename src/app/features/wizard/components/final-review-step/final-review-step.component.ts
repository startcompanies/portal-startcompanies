import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { WizardStateService } from '../../services/wizard-state.service';
import { Subscription } from 'rxjs';
import { SignaturePadComponent } from '../../../../shared/components/signature-pad/signature-pad.component';

/**
 * Componente reutilizable para el paso de revisión final
 * Muestra un resumen completo de toda la información capturada
 * También maneja la vista de éxito después de enviar
 */
@Component({
  selector: 'app-wizard-final-review-step',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, ReactiveFormsModule, SignaturePadComponent],
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
  @Output() submitRequest = new EventEmitter<{ signature: string | null }>();
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
      confirm: new FormControl(false, [Validators.requiredTrue]),
      signature: new FormControl(null, [Validators.required]),
    });
  }

  /**
   * Emite el evento para enviar la solicitud
   */
  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores de validación
    this.form.markAllAsTouched();
    
    if (this.form.valid) {
      // Emitir evento con los datos del formulario (incluyendo la firma)
      const signature = this.form.get('signature')?.value || null;
      this.submitRequest.emit({ signature });
    }
  }

  /**
   * Obtiene el FormControl de la firma de manera segura
   */
  get signatureControl(): FormControl {
    return this.form.get('signature') as FormControl;
  }

  /**
   * Obtiene los datos del formulario incluyendo la firma
   */
  getFormData(): { confirm: boolean; signature: string | null } {
    return {
      confirm: this.form.get('confirm')?.value || false,
      signature: this.form.get('signature')?.value || null
    };
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
    
    // Para cuenta bancaria, intentar recargar los datos después de un pequeño delay
    // para asegurar que los datos se hayan guardado correctamente
    if (this.serviceType === 'cuenta-bancaria') {
      setTimeout(() => {
        this.loadAllData();
      }, 100);
    }

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
      // Para cuenta bancaria, los datos pueden estar en step2 o step3 dependiendo del flujo
      // El stepNumber del componente de información es: withPayment ? 3 : 2
      // Primero intentar obtener desde el formulario registrado (step 2 o 3)
      let formData: any = null;
      
      // Intentar primero en step 2 y 3 (los más comunes)
      for (const stepNum of [2, 3]) {
        const form = this.wizardStateService.getForm(stepNum);
        if (form) {
          const formValue = form.value;
          // Verificar si este formulario tiene datos de cuenta bancaria
          if (formValue.businessType || formValue.legalBusinessName || formValue.validatorFirstName || formValue.owners || 
              formValue.registeredAgentStreet || formValue.ownerPersonalStreet) {
            formData = formValue;
            console.log(`[FinalReviewStep] Datos encontrados en formulario step${stepNum}`);
            break;
          }
        }
      }
      
      // Si no encontramos en step 2 o 3, buscar en otros pasos
      if (!formData) {
        for (let i = 4; i <= 7; i++) {
          const form = this.wizardStateService.getForm(i);
          if (form) {
            const formValue = form.value;
            if (formValue.businessType || formValue.legalBusinessName || formValue.validatorFirstName || formValue.owners) {
              formData = formValue;
              console.log(`[FinalReviewStep] Datos encontrados en formulario step${i}`);
              break;
            }
          }
        }
      }
      
      // Si encontramos datos en un formulario, usarlos
      if (formData && Object.keys(formData).length > 0) {
        this.serviceData = formData;
      } else {
        // Si no, buscar en los datos guardados (stepData)
        // Priorizar step2 y step3
        this.serviceData = allData.step2 || allData.step3 || allData.step4 || {};
        
        // Si aún no encontramos datos, buscar en todos los pasos
        if (!this.serviceData || Object.keys(this.serviceData).length === 0) {
          for (let i = 2; i <= 7; i++) {
            const stepData = allData[`step${i}`] || {};
            // Verificar si este paso tiene datos de cuenta bancaria
            if (stepData.businessType || stepData.legalBusinessName || stepData.validatorFirstName || 
                stepData.owners || stepData.registeredAgentStreet || stepData.ownerPersonalStreet) {
              this.serviceData = stepData;
              console.log(`[FinalReviewStep] Datos encontrados en stepData step${i}`);
              break;
            }
          }
        }
      }
      
      // Debug: Log para verificar qué datos se están cargando
      console.log('[FinalReviewStep] Cuenta Bancaria - Resumen de carga:', {
        allDataKeys: Object.keys(allData),
        step2Data: allData.step2 ? Object.keys(allData.step2) : 'vacío',
        step3Data: allData.step3 ? Object.keys(allData.step3) : 'vacío',
        serviceDataKeys: this.serviceData ? Object.keys(this.serviceData) : 'vacío',
        serviceDataSample: this.serviceData ? {
          businessType: this.serviceData.businessType,
          legalBusinessName: this.serviceData.legalBusinessName,
          hasOwners: !!this.serviceData.owners,
          ownersCount: this.serviceData.owners?.length || 0
        } : null,
        hasData: this.serviceData && Object.keys(this.serviceData).length > 0
      });
      
      // Para cuenta bancaria, construir los propietarios
      // El propietario 1 siempre es el verificador (datos de sección 3 y 4)
      // Solo si es multi-member se agregan propietarios adicionales (sección 6)
      const isMultiMember = this.serviceData.isMultiMember === 'yes';
      
      // Verificar si hay datos del verificador para construir el propietario 1
      const hasValidatorData = this.serviceData.validatorFirstName || this.serviceData.validatorLastName || 
                               this.serviceData.validatorWorkEmail || this.serviceData.validatorPhone;
      
      if (hasValidatorData) {
        // Construir el propietario 1 desde los datos del verificador
        const validatorAsFirstMember = this.buildValidatorAsFirstMember();
        
        if (isMultiMember && this.serviceData.owners && this.serviceData.owners.length > 0) {
          // Multi-member: verificador + owners adicionales
          // Filtrar owners vacíos (sin nombre) para no mostrar duplicados
          const additionalOwners = this.serviceData.owners.filter((owner: any) => 
            owner && (owner.firstName || owner.lastName || owner.name) && !owner.validatesBankAccount
          );
          this.members = [validatorAsFirstMember, ...additionalOwners];
        } else {
          // Single member: solo el verificador
          this.members = [validatorAsFirstMember];
        }
        
        console.log('[FinalReviewStep] Propietario 1 construido desde datos del verificador:', validatorAsFirstMember);
      } else if (this.serviceData.owners && this.serviceData.owners.length > 0) {
        // No hay datos del verificador pero hay owners, usarlos directamente
        // Filtrar owners vacíos
        this.members = this.serviceData.owners.filter((owner: any) => 
          owner && (owner.firstName || owner.lastName || owner.name)
        );
      } else {
        this.members = [];
      }
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
   * Filtra valores falsy de un array
   */
  filterTruthy(arr: any[]): any[] {
    return arr.filter(item => Boolean(item));
  }

  /**
   * Obtiene campos específicos para apertura LLC
   * Basado en wizard-apertura-llc-form.component.html
   */
  getAperturaLlcFields(): { label: string; value: any }[] {
    const fields: { label: string; value: any }[] = [];
    const data = this.serviceData;
    
    // Sección 1: Información de la LLC
    if (data.llcName) fields.push({ label: 'Nombre de la LLC (Opción 1)', value: data.llcName });
    if (data.llcNameOption2) fields.push({ label: 'Nombre de la LLC (Opción 2)', value: data.llcNameOption2 });
    if (data.llcNameOption3) fields.push({ label: 'Nombre de la LLC (Opción 3)', value: data.llcNameOption3 });
    if (data.incorporationState) fields.push({ label: 'Estado de Incorporación', value: data.incorporationState });
    if (data.businessDescription) fields.push({ label: 'Actividad Principal', value: data.businessDescription });
    if (data.llcType) fields.push({ label: 'Estructura Societaria', value: data.llcType === 'single' ? 'Single Member' : 'Multi Member' });
    if (data.linkedin) fields.push({ label: 'LinkedIn', value: data.linkedin });
    
    // Sección 3: Información para Apertura Bancaria
    if (data.periodicIncome10k) fields.push({ label: '¿Tendrá ingresos periódicos que suman USD 10,000 o más?', value: data.periodicIncome10k });
    if (data.bankAccountLinkedEmail) fields.push({ label: 'Correo Electrónico Vinculado a la Cuenta Bancaria', value: data.bankAccountLinkedEmail });
    if (data.bankAccountLinkedPhone) fields.push({ label: 'Número de Teléfono Vinculado a la Cuenta Bancaria', value: data.bankAccountLinkedPhone });
    if (data.actividadFinancieraEsperada) fields.push({ label: 'Actividad financiera esperada', value: data.actividadFinancieraEsperada });
    if (data.projectOrCompanyUrl) fields.push({ label: 'URL del Proyecto o Empresa', value: data.projectOrCompanyUrl });
    
    // Archivos
    if (data.serviceBillUrl) fields.push({ label: 'Factura de Servicio (Prueba de Dirección)', value: 'Archivo subido ✓' });
    if (data.bankStatementUrl) fields.push({ label: 'Resumen Bancario', value: 'Archivo subido ✓' });
    
    return fields;
  }

  /**
   * Obtiene campos específicos para renovación LLC
   * Basado en wizard-renovacion-llc-form.component.html
   */
  getRenovacionLlcFields(): { label: string; value: any }[] {
    const fields: { label: string; value: any }[] = [];
    const data = this.serviceData;
    
    // Sección 1: Información de la LLC
    if (data.llcName) fields.push({ label: 'Nombre de la LLC', value: data.llcName });
    if (data.state) fields.push({ label: 'Estado de Registro de la LLC', value: data.state });
    if (data.llcType) fields.push({ label: 'Estructura Societaria', value: data.llcType === 'single' ? 'Single Member' : 'Multi Member' });
    if (data.mainActivity) fields.push({ label: 'Actividad Principal de la LLC', value: data.mainActivity });
    if (data.hasPropertyInUSA !== undefined) fields.push({ label: '¿Tu empresa posee o renta alguna propiedad inmobiliaria en Estados Unidos?', value: this.formatBoolean(data.hasPropertyInUSA) });
    if (data.almacenaProductosDepositoUSA !== undefined) fields.push({ label: '¿Tu empresa almacena productos físicos en un depósito en Estados Unidos?', value: this.formatBoolean(data.almacenaProductosDepositoUSA) });
    if (data.contrataServiciosUSA !== undefined) fields.push({ label: '¿Tu empresa contrata servicios de personas o empresas de Estados Unidos regularmente?', value: this.formatBoolean(data.contrataServiciosUSA) });
    if (data.tieneCuentasBancarias !== undefined) fields.push({ label: '¿Tu LLC tiene cuentas bancarias a su nombre?', value: this.formatBoolean(data.tieneCuentasBancarias) });
    if (data.einNumber) fields.push({ label: 'Número de EIN', value: data.einNumber });
    if (data.llcCreationDate) fields.push({ label: 'Fecha de creación de la LLC', value: this.formatDate(data.llcCreationDate) });
    if (data.countriesWhereLLCDoesBusiness && Array.isArray(data.countriesWhereLLCDoesBusiness) && data.countriesWhereLLCDoesBusiness.length > 0) {
      fields.push({ label: 'Países donde la LLC realiza negocios', value: data.countriesWhereLLCDoesBusiness.join(', ') });
    }
    
    // Tipo de declaración
    const declaraciones: string[] = [];
    if (data.declaracionInicial) declaraciones.push('Declaración Inicial');
    if (data.declaracionAnoCorriente) declaraciones.push('Declaración del año corriente (2025)');
    if (data.cambioDireccionRA) declaraciones.push('Cambio de dirección y de Registered Agent (RA)');
    if (data.cambioNombre) declaraciones.push('Cambio de nombre');
    if (data.declaracionAnosAnteriores) declaraciones.push('Declaración de años anteriores');
    if (data.agregarCambiarSocio) declaraciones.push('Agregar o cambiar socio');
    if (data.declaracionCierre) declaraciones.push('Declaracion de Cierre de tu LLC');
    if (declaraciones.length > 0) {
      fields.push({ label: 'Tipo de declaración', value: declaraciones.join(', ') });
    }
    
    // Sección 3: Información Contable de la LLC
    if (data.llcOpeningCost !== null && data.llcOpeningCost !== undefined) {
      fields.push({ label: '¿Cuánto costó abrir la LLC en Estados Unidos?', value: this.formatMoney(data.llcOpeningCost) });
    }
    if (data.paidToFamilyMembers !== null && data.paidToFamilyMembers !== undefined) {
      fields.push({ label: '¿Cuánto pagó la LLC a familiares del dueño por trabajos o servicios?', value: this.formatMoney(data.paidToFamilyMembers) });
    }
    if (data.paidToLocalCompanies !== null && data.paidToLocalCompanies !== undefined) {
      fields.push({ label: '¿Cuánto pagó la LLC a empresas locales del dueño por bienes o servicios?', value: this.formatMoney(data.paidToLocalCompanies) });
    }
    if (data.paidForLLCFormation !== null && data.paidForLLCFormation !== undefined) {
      fields.push({ label: '¿Cuánto se pagó por la formación de la LLC (Incorporation/State fees)?', value: this.formatMoney(data.paidForLLCFormation) });
    }
    if (data.paidForLLCDissolution !== null && data.paidForLLCDissolution !== undefined) {
      fields.push({ label: '¿Cuánto se pagó por la disolución de la LLC (si aplica)?', value: this.formatMoney(data.paidForLLCDissolution) });
    }
    if (data.bankAccountBalanceEndOfYear !== null && data.bankAccountBalanceEndOfYear !== undefined) {
      fields.push({ label: 'Saldo Al fin de año de las cuentas bancarias de la LLC', value: this.formatMoney(data.bankAccountBalanceEndOfYear) });
    }
    
    // Sección 4: Movimientos Financieros
    if (data.totalRevenue2025 !== null && data.totalRevenue2025 !== undefined) {
      fields.push({ label: 'Facturación total de la LLC en 2025', value: this.formatMoney(data.totalRevenue2025) });
    }
    
    // Sección 5: Información Adicional
    if (data.hasFinancialInvestmentsInUSA !== undefined) {
      fields.push({ label: '¿Posee la LLC inversiones financieras o activos dentro de Estados Unidos?', value: this.formatBoolean(data.hasFinancialInvestmentsInUSA) });
    }
    if (data.hasFiledTaxesBefore !== undefined) {
      fields.push({ label: '¿La LLC declaró impuestos anteriormente?', value: this.formatBoolean(data.hasFiledTaxesBefore) });
    }
    if (data.wasConstitutedWithStartCompanies !== undefined) {
      fields.push({ label: '¿La LLC se constituyó con Start Companies?', value: this.formatBoolean(data.wasConstitutedWithStartCompanies) });
    }
    
    // Archivos (solo si se respondió "No" a Start Companies)
    if (data.wasConstitutedWithStartCompanies === 'no' || data.wasConstitutedWithStartCompanies === false) {
      if (data.partnersPassportsFileUrl) fields.push({ label: 'Pasaportes de los socios', value: 'Archivo subido ✓' });
      if (data.operatingAgreementAdditionalFileUrl) fields.push({ label: 'Operating Agreement', value: 'Archivo subido ✓' });
      if (data.form147Or575FileUrl) fields.push({ label: 'Formulario 147 o 575', value: 'Archivo subido ✓' });
      if (data.articlesOfOrganizationAdditionalFileUrl) fields.push({ label: 'Artículos de Organización / Certificados de Organización', value: 'Archivo subido ✓' });
      if (data.boiReportFileUrl) fields.push({ label: 'Reporte BOI', value: 'Archivo subido ✓' });
    }
    if (data.bankStatementsFileUrl) fields.push({ label: 'Información bancaria', value: 'Archivo subido ✓' });
    
    return fields;
  }

  /**
   * Obtiene campos específicos para cuenta bancaria
   * Basado en wizard-cuenta-bancaria-form.component.html
   */
  getCuentaBancariaFields(): { label: string; value: any }[] {
    const fields: { label: string; value: any }[] = [];
    const data = this.serviceData;
    
    // Sección 1: Información de la LLC
    if (data.businessType) fields.push({ label: 'Tipo de negocio', value: data.businessType });
    if (data.legalBusinessName) fields.push({ label: 'Nombre legal del negocio', value: data.legalBusinessName });
    if (data.industry) fields.push({ label: 'Industria / Rubro', value: data.industry });
    if (data.numberOfEmployees) fields.push({ label: 'Cantidad de empleados', value: data.numberOfEmployees });
    if (data.briefDescription) fields.push({ label: 'Descripción breve', value: data.briefDescription });
    if (data.websiteOrSocialMedia) fields.push({ label: 'Sitio web o red social', value: data.websiteOrSocialMedia });
    if (data.einLetterUrl) fields.push({ label: 'Adjuntar EIN Letter', value: 'Archivo subido ✓' });
    if (data.einNumber) fields.push({ label: 'Numero de EIN', value: data.einNumber });
    if (data.articlesOrCertificateUrl) fields.push({ label: 'Adjuntar Articles de Organización o Certificate of Formation', value: 'Archivo subido ✓' });
    
    // Sección 2: Dirección del Registered Agent
    if (data.registeredAgentStreet) {
      const addrParts = [
        data.registeredAgentStreet,
        data.registeredAgentUnit,
        data.registeredAgentCity,
        data.registeredAgentState,
        data.registeredAgentZipCode,
        data.registeredAgentCountry
      ].filter(Boolean);
      if (addrParts.length > 0) {
        fields.push({ label: 'Dirección de tu empresa en USA', value: addrParts.join(', ') });
      }
    }
    if (data.incorporationState) fields.push({ label: 'Estado de constitución', value: data.incorporationState });
    if (data.incorporationMonthYear) fields.push({ label: 'Mes y Año de Incorporación', value: data.incorporationMonthYear });
    if (data.countriesWhereBusiness && Array.isArray(data.countriesWhereBusiness) && data.countriesWhereBusiness.length > 0) {
      fields.push({ label: 'Países donde haces negocios con tu LLC', value: data.countriesWhereBusiness.join(', ') });
    }
    
    // Sección 3: Información del Verificador
    if (data.validatorFirstName || data.validatorLastName) {
      fields.push({ label: 'Nombre del Verificador', value: `${data.validatorFirstName || ''} ${data.validatorLastName || ''}`.trim() });
    }
    if (data.validatorDateOfBirth) fields.push({ label: 'Fecha de Nacimiento del Verificador', value: this.formatDate(data.validatorDateOfBirth) });
    if (data.validatorNationality) fields.push({ label: 'Nacionalidad del Verificador', value: data.validatorNationality });
    if (data.validatorCitizenship) fields.push({ label: 'Ciudadanía del Verificador', value: data.validatorCitizenship });
    if (data.validatorPassportNumber) fields.push({ label: 'Número de pasaporte del Verificador', value: data.validatorPassportNumber });
    if (data.validatorPassportUrl) fields.push({ label: 'Copia escaneada del pasaporte del Verificador', value: 'Archivo subido ✓' });
    if (data.validatorWorkEmail) fields.push({ label: 'Email laboral del Verificador', value: data.validatorWorkEmail });
    if (data.validatorPhone) fields.push({ label: 'Teléfono del Verificador', value: data.validatorPhone });
    if (data.canReceiveSMS !== undefined) fields.push({ label: '¿Puede recibir SMS?', value: this.formatBoolean(data.canReceiveSMS) });
    if (data.isUSResident) fields.push({ label: '¿Es residente en EE.UU.?', value: data.isUSResident === 'yes' ? 'Sí' : 'No' });
    if (data.validatorTitle) fields.push({ label: 'Cargo / Título / Ocupación del Verificador', value: data.validatorTitle });
    if (data.validatorIncomeSource) fields.push({ label: 'Fuente de ingreso personal del Verificador', value: data.validatorIncomeSource });
    if (data.validatorAnnualIncome !== null && data.validatorAnnualIncome !== undefined) {
      fields.push({ label: '¿Cuánto ganas en el año? (Verificador)', value: this.formatMoney(data.validatorAnnualIncome) });
    }
    
    // Sección 4: Dirección personal del propietario
    if (data.ownerPersonalStreet) {
      const ownerAddrParts = [
        data.ownerPersonalStreet,
        data.ownerPersonalUnit,
        data.ownerPersonalCity,
        data.ownerPersonalState,
        data.ownerPersonalCountry,
        data.ownerPersonalPostalCode
      ].filter(Boolean);
      if (ownerAddrParts.length > 0) {
        fields.push({ label: 'Dirección personal del propietario', value: ownerAddrParts.join(', ') });
      }
    }
    if (data.serviceBillUrl) fields.push({ label: 'Adjuntar factura de servicio', value: 'Archivo subido ✓' });
    
    // Sección 5: Tipo de LLC
    if (data.isMultiMember !== undefined) {
      fields.push({ label: '¿Tu LLC es Multi-Member?', value: data.isMultiMember === 'yes' ? 'Sí' : 'No' });
    }
    
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

  /**
   * Construye el propietario 1 desde los datos del verificador
   * Solo incluye los campos que se muestran en el formulario de propietarios (sección 6):
   * - firstName, lastName, dateOfBirth, nationality, passportNumber, ssnItin, cuit, participationPercentage, passportFileUrl
   */
  private buildValidatorAsFirstMember(): any {
    // Buscar si hay un owner que ya tenga validatesBankAccount = true
    if (this.serviceData.owners && this.serviceData.owners.length > 0) {
      const validatorOwner = this.serviceData.owners.find((owner: any) => owner.validatesBankAccount);
      if (validatorOwner) {
        return validatorOwner;
      }
    }

    // Construir desde los datos del verificador (solo campos del formulario de propietarios)
    return {
      firstName: this.serviceData.validatorFirstName || '',
      lastName: this.serviceData.validatorLastName || '',
      dateOfBirth: this.serviceData.validatorDateOfBirth || '',
      nationality: this.serviceData.validatorNationality || '',
      passportNumber: this.serviceData.validatorPassportNumber || '',
      email: this.serviceData.validatorWorkEmail || '',
      phoneNumber: this.serviceData.validatorPhone || '',
      percentageOfParticipation: 100,
      // Campos adicionales del formulario de propietarios (sección 6)
      ssnItin: '', // No se captura para el verificador, solo para propietarios adicionales
      cuit: '', // No se captura para el verificador, solo para propietarios adicionales
      passportFileUrl: this.serviceData.validatorPassportUrl || ''
    };
  }
}
