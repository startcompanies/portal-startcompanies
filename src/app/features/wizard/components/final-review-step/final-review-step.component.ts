import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WizardStateService } from '../../services/wizard-state.service';
import { WizardApiService } from '../../services/wizard-api.service';
import { merge, Subscription } from 'rxjs';
import { SignaturePadComponent } from '../../../../shared/components/signature-pad/signature-pad.component';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  APERTURA_LLC_REVIEW_KEYS,
  CUENTA_BANCARIA_REVIEW_KEYS,
  pickServiceDataForReview,
  RENOVACION_LLC_REVIEW_KEYS,
} from '../../../../shared/constants/service-form-review-keys';

/**
 * Componente reutilizable para el paso de revisión final
 * Muestra un resumen completo de toda la información capturada
 * También maneja la vista de éxito después de enviar
 */
@Component({
  selector: 'app-wizard-final-review-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SignaturePadComponent, TranslocoPipe],
  templateUrl: './final-review-step.component.html',
  styleUrls: ['./final-review-step.component.css']
})
export class WizardFinalReviewStepComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @ViewChild(SignaturePadComponent) private signaturePad?: SignaturePadComponent;

  @Input() stepNumber: number = 5;
  @Input() previousSteps: number[] = [1, 2, 3, 4];
  @Input() serviceType: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria' = 'apertura-llc';
  /** Panel cliente edición staff: no pedir firma; solo confirmación y botón de actualizar. */
  @Input() skipSignature = false;
  
  // Estado para mostrar vista de éxito
  @Input() isSubmitted: boolean = false;
  @Input() isSubmitting: boolean = false;
  @Input() submitError: string | null = null;
  @Input() submitFailed: boolean = false;
  
  // Eventos para comunicar con el componente padre
  @Output() submitRequest = new EventEmitter<{
    signature?: string | null;
    signatureUrl?: string | null;
  }>();
  @Output() goToPanel = new EventEmitter<void>();
  @Output() goToHome = new EventEmitter<void>();
  
  form!: FormGroup;
  private formSubscription?: Subscription;
  /** Estado local al hacer clic en Enviar para mostrar "Enviando..." de inmediato */
  submittingLocal = false;
  /** Error al subir la firma cuando ya existe solicitud (evita depender solo del padre) */
  signatureUploadError: string | null = null;

  // Datos organizados para mostrar
  registrationData: any = {};
  statePlanData: any = {};
  paymentData: any = {};
  serviceData: any = {};
  members: any[] = [];

  constructor(
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = new FormGroup({
      confirm: new FormControl(false, [Validators.requiredTrue]),
      /** Valor data URL solo en memoria; no se persiste en wizard state (ver saveStepData). */
      signature: new FormControl<string | null>(null),
      signatureUrl: new FormControl<string | null>(null),
    });
  }

  /** Botón enviar: checkbox + trazo (o solo checkbox si skipSignature). */
  get canSubmitFinal(): boolean {
    const confirmed = !!this.form.get('confirm')?.value;
    if (this.skipSignature) {
      return confirmed;
    }
    return confirmed && (this.signaturePad?.hasSignature() ?? false);
  }

  onSignatureCanvasChange(): void {
    this.cdr.markForCheck();
  }

  /**
   * Emite el evento para enviar la solicitud.
   * Si ya hay requestId, sube el PNG a almacenamiento y emite solo la URL (no base64 en estado).
   */
  async onSubmit(): Promise<void> {
    this.signaturePad?.flushToFormControl();
    this.form.get('confirm')?.markAsTouched();

    if (!this.form.get('confirm')?.valid) {
      return;
    }

    if (this.skipSignature) {
      this.submittingLocal = true;
      this.signatureUploadError = null;
      try {
        this.submitRequest.emit({
          signature: null,
          signatureUrl: null,
        });
      } finally {
        this.submittingLocal = false;
      }
      return;
    }

    if (!this.signaturePad?.hasSignature()) {
      return;
    }

    const dataUrl = this.signaturePad?.getSignatureData() ?? this.form.get('signature')?.value;
    if (!dataUrl || !String(dataUrl).startsWith('data:image')) {
      return;
    }

    this.submittingLocal = true;
    this.signatureUploadError = null;

    try {
      const requestId = this.wizardStateService.getRequestId();
      let signatureUrl: string | null = null;

      if (requestId) {
        signatureUrl = await this.wizardApiService.uploadSignaturePngFromDataUrl(
          dataUrl,
          this.serviceType,
          this.wizardStateService.getRequestUuid(),
        );
        if (!signatureUrl) {
          this.signatureUploadError =
            'No se pudo subir la firma. Comprueba tu conexión e inténtalo de nuevo. Si el problema continúa, tu sesión puede haber expirado (vuelve a verificar tu email).';
          return;
        }
        this.form.patchValue({ signatureUrl }, { emitEvent: true });
        this.saveStepData();
      }

      this.submitRequest.emit({
        signature: signatureUrl ? null : dataUrl,
        signatureUrl: signatureUrl ?? null,
      });
    } finally {
      this.submittingLocal = false;
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
  getFormData(): { confirm: boolean; signatureUrl?: string | null } {
    return {
      confirm: this.form.get('confirm')?.value || false,
      signatureUrl: this.form.get('signatureUrl')?.value || null,
    };
  }

  /** True cuando el flujo corre bajo rutas /panel/* (no mostrar "Ir al Panel" en la vista de éxito). */
  isInsidePanelShell(): boolean {
    return this.router.url.startsWith('/panel');
  }

  /**
   * Navega al panel del usuario
   */
  navigateToPanel(): void {
    this.goToPanel.emit();
    const isPanelContext = this.router.url.startsWith('/panel');
    this.router.navigate([isPanelContext ? '/panel/my-requests' : '/panel/login']);
  }

  /**
   * Navega al home
   */
  navigateToHome(): void {
    this.goToHome.emit();
    const isPanelContext = this.router.url.startsWith('/panel');
    this.router.navigate([isPanelContext ? '/panel/my-requests' : '/']);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['submitFailed'] && changes['submitFailed'].currentValue === true) {
      this.submittingLocal = false;
    }
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
      this.form.patchValue({
        confirm: !!savedData.confirm,
        signatureUrl: typeof savedData.signatureUrl === 'string' ? savedData.signatureUrl : null,
        signature: null,
      });
    }

    const confirmCtrl = this.form.get('confirm');
    const signatureUrlCtrl = this.form.get('signatureUrl');
    if (confirmCtrl && signatureUrlCtrl) {
      this.formSubscription = merge(
        confirmCtrl.valueChanges,
        signatureUrlCtrl.valueChanges
      ).subscribe(() => this.saveStepData());
    }
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  ngAfterViewInit(): void {
    const url = this.form.get('signatureUrl')?.value;
    if (url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
      setTimeout(() => this.signaturePad?.loadSignature(url), 0);
    }
  }

  /**
   * Carga todos los datos de los pasos anteriores
   */
  private loadAllData(): void {
    const allData = this.wizardStateService.getAllData();
    
    // Paso 1: Datos de registro (sin password)
    const step1 = allData.step1 || {};
    const { password: _p, ...restStep1 } = step1 as { password?: string; [k: string]: unknown };
    this.registrationData = { ...restStep1 };
    const rd = this.registrationData as Record<string, unknown>;
    // Si syncToWizardState pisó el paso 1 con solo userId/email, recuperar nombre y teléfono del JWT del wizard.
    const wUser = this.wizardApiService.getUser();
    let enrichedFromWizardUser = false;
    if (wUser) {
      if (!(rd['phone'] as string)?.trim() && (wUser.phone || '').trim()) {
        rd['phone'] = wUser.phone;
        enrichedFromWizardUser = true;
      }
      if (!(rd['firstName'] as string)?.trim() && (wUser.firstName || '').trim()) {
        rd['firstName'] = wUser.firstName;
        enrichedFromWizardUser = true;
      }
      if (!(rd['lastName'] as string)?.trim() && (wUser.lastName || '').trim()) {
        rd['lastName'] = wUser.lastName;
        enrichedFromWizardUser = true;
      }
      const fn = (rd['firstName'] as string) || '';
      const ln = (rd['lastName'] as string) || '';
      const fromParts = `${fn} ${ln}`.trim();
      const usernameRaw = (wUser.username || '').trim();
      const usernameOk = usernameRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usernameRaw);
      if (!(rd['fullName'] as string)?.trim() && (fromParts || (usernameOk ? usernameRaw : ''))) {
        rd['fullName'] = fromParts || (usernameOk ? usernameRaw : '');
        enrichedFromWizardUser = true;
      }
    }
    // No usar el email como nombre mostrado (evita duplicar correo en "Nombre completo").
    rd['fullName'] =
      (rd['fullName'] as string) || [rd['firstName'], rd['lastName']].filter(Boolean).join(' ').trim() || '';

    if (enrichedFromWizardUser) {
      const prev = this.wizardStateService.getStepData(1) || {};
      this.wizardStateService.setStepData(1, { ...prev, ...rd });
    }

    // Paso 2: Estado/Plan (para apertura y renovación)
    this.statePlanData = allData.step2 || {};

    // Paso 3: Datos de pago
    this.paymentData = allData.step3 || {};

    // Paso 4+: Datos del servicio específico
    if (this.serviceType === 'apertura-llc') {
      this.serviceData = allData.step4 || {};
      this.members = this.serviceData.members || [];
    } else if (this.serviceType === 'renovacion-llc') {
      const rl = this.wizardStateService.getRenovacionStorageLayout();
      this.statePlanData = allData[`step${rl.stateStep}`] || this.statePlanData;
      this.paymentData = allData[`step${rl.paymentStep}`] || this.paymentData;
      this.serviceData = allData[`step${rl.infoStep}`] || allData.step4 || {};
      this.members = this.serviceData.owners || [];
    } else if (this.serviceType === 'cuenta-bancaria') {
      // No usar step2 como estado/plan LLC (en flujo con pago suele ser el paso de pago con `state`).
      this.statePlanData = {};

      // Para cuenta bancaria, los datos pueden estar en step2 o step3 dependiendo del flujo
      // El stepNumber del componente de información es: withPayment ? 3 : 2
      // Primero intentar obtener desde el formulario registrado (step 2 o 3)
      let formData: any = null;

      // Intentar primero en step 2 y 3 (los más comunes)
      for (const stepNum of [2, 3]) {
        const form = this.wizardStateService.getForm(stepNum);
        if (form) {
          const formValue = form.getRawValue();
          // Verificar si este formulario tiene datos de cuenta bancaria
          if (
            formValue.businessType ||
            formValue.legalBusinessName ||
            formValue.validatorFirstName ||
            formValue.owners ||
            formValue.registeredAgentStreet ||
            formValue.ownerPersonalStreet
          ) {
            formData = formValue;
            break;
          }
        }
      }

      // Si no encontramos en step 2 o 3, buscar en otros pasos
      if (!formData) {
        for (let i = 4; i <= 7; i++) {
          const form = this.wizardStateService.getForm(i);
          if (form) {
            const formValue = form.getRawValue();
            if (
              formValue.businessType ||
              formValue.legalBusinessName ||
              formValue.validatorFirstName ||
              formValue.owners
            ) {
              formData = formValue;
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
            if (
              stepData.businessType ||
              stepData.legalBusinessName ||
              stepData.validatorFirstName ||
              stepData.owners ||
              stepData.registeredAgentStreet ||
              stepData.ownerPersonalStreet
            ) {
              this.serviceData = stepData;
              break;
            }
          }
        }
      }

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
    const confirm = this.form.get('confirm')?.value;
    const signatureUrl = this.form.get('signatureUrl')?.value;
    this.wizardStateService.setStepData(this.stepNumber, {
      confirm: !!confirm,
      ...(signatureUrl ? { signatureUrl } : {}),
    });
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
   * Formatea un objeto de dirección a texto
   */
  private formatAddress(addr: any): string {
    if (!addr || typeof addr !== 'object') return '';
    const parts = [addr.street, addr.building, addr.unit, addr.city, addr.state, addr.stateRegion, addr.postalCode, addr.zipCode, addr.country].filter(Boolean);
    return parts.join(', ');
  }

  /** Estado/plan LLC: solo apertura y renovación (evita confundir con `state` del paso de pago en banco). */
  showStatePlanSection(): boolean {
    if (this.serviceType !== 'apertura-llc' && this.serviceType !== 'renovacion-llc') {
      return false;
    }
    const sp = this.statePlanData;
    return !!(sp && (sp.state || sp.plan));
  }

  /** Renovación: no listar cadenas vacías ni arrays vacíos como respuesta. */
  private renovacionScalarMeaningful(v: unknown): boolean {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string' && v.trim() === '') return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  }

  private renovacionMoneyMeaningful(v: unknown): boolean {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string' && v.trim() === '') return false;
    if (typeof v === 'number' && Number.isNaN(v)) return false;
    return true;
  }

  /**
   * Obtiene todos los campos del formulario de Apertura LLC para el resumen de confirmación
   */
  getAperturaLlcFields(): { label: string; value: any }[] {
    const fields: { label: string; value: any }[] = [];
    const data: any = pickServiceDataForReview(
      this.serviceData as Record<string, unknown>,
      APERTURA_LLC_REVIEW_KEYS,
    );
    if (!data || Object.keys(data).length === 0) return fields;

    // Sección 1: Información de la LLC
    if (data.llcName) fields.push({ label: 'Nombre de la LLC (Opción 1)', value: data.llcName });
    if (data.llcNameOption2) fields.push({ label: 'Nombre de la LLC (Opción 2)', value: data.llcNameOption2 });
    if (data.llcNameOption3) fields.push({ label: 'Nombre de la LLC (Opción 3)', value: data.llcNameOption3 });
    if (data.incorporationState) fields.push({ label: 'Estado de Incorporación', value: data.incorporationState });
    if (data.businessDescription) fields.push({ label: 'Actividad Principal', value: data.businessDescription });
    if (data.llcType) fields.push({ label: 'Estructura Societaria', value: data.llcType === 'single' ? 'Single Member' : 'Multi Member' });
    if (data.llcPhoneNumber) fields.push({ label: 'Teléfono de la LLC', value: data.llcPhoneNumber });
    if (data.website) fields.push({ label: 'Sitio web', value: data.website });
    if (data.llcEmail) fields.push({ label: 'Email de la LLC', value: data.llcEmail });
    if (data.linkedin) fields.push({ label: 'LinkedIn', value: data.linkedin });
    if (data.incorporationDate) fields.push({ label: 'Fecha de incorporación', value: this.formatDate(data.incorporationDate) });
    if (data.hasEin === true) {
      fields.push({ label: '¿Tiene EIN?', value: this.formatBoolean(data.hasEin) });
    }
    if (data.einNumber) fields.push({ label: 'Número de EIN', value: data.einNumber });
    if (data.einDocumentUrl) fields.push({ label: 'Documento EIN', value: 'Archivo subido ✓' });
    if (data.noEinReason) fields.push({ label: 'Motivo sin EIN', value: data.noEinReason });
    if (data.certificateOfFormationUrl) fields.push({ label: 'Certificado de Formación', value: 'Archivo subido ✓' });
    if (data.accountType) fields.push({ label: 'Tipo de cuenta', value: data.accountType });
    if (data.estadoConstitucion) fields.push({ label: 'Estado de constitución', value: data.estadoConstitucion });
    if (data.annualRevenue !== null && data.annualRevenue !== undefined) fields.push({ label: 'Ingresos anuales', value: this.formatMoney(data.annualRevenue) });

    // Dirección Registered Agent
    const raAddr = this.formatAddress(data.registeredAgentAddress);
    if (raAddr) fields.push({ label: 'Dirección del Registered Agent', value: raAddr });
    if (data.registeredAgentName) fields.push({ label: 'Nombre del Registered Agent', value: data.registeredAgentName });
    if (data.registeredAgentEmail) fields.push({ label: 'Email del Registered Agent', value: data.registeredAgentEmail });
    if (data.registeredAgentPhone) fields.push({ label: 'Teléfono del Registered Agent', value: data.registeredAgentPhone });
    if (data.registeredAgentType) fields.push({ label: 'Tipo de Registered Agent', value: data.registeredAgentType });

    // Información bancaria / apertura bancaria (solo si marcó que sí; evita "No" por defecto)
    if (data.needsBankVerificationHelp === true) {
      fields.push({ label: '¿Necesita ayuda con verificación bancaria?', value: this.formatBoolean(data.needsBankVerificationHelp) });
    }
    if (data.bankAccountType) fields.push({ label: 'Tipo de cuenta bancaria', value: data.bankAccountType });
    if (data.bankName) fields.push({ label: 'Banco', value: data.bankName });
    if (data.bankAccountNumber) fields.push({ label: 'Número de cuenta', value: data.bankAccountNumber });
    if (data.bankRoutingNumber) fields.push({ label: 'Routing number', value: data.bankRoutingNumber });
    if (data.bankStatementUrl) fields.push({ label: 'Resumen Bancario', value: 'Archivo subido ✓' });
    if (data.serviceBillUrl) fields.push({ label: 'Factura de Servicio (Prueba de Dirección)', value: 'Archivo subido ✓' });
    if (data.periodicIncome10k) fields.push({ label: '¿Ingresos periódicos USD 10,000 o más?', value: data.periodicIncome10k });
    if (data.bankAccountLinkedEmail) fields.push({ label: 'Correo vinculado a la cuenta bancaria', value: data.bankAccountLinkedEmail });
    if (data.bankAccountLinkedPhone) fields.push({ label: 'Teléfono vinculado a la cuenta bancaria', value: data.bankAccountLinkedPhone });
    if (data.actividadFinancieraEsperada) fields.push({ label: 'Actividad financiera esperada', value: data.actividadFinancieraEsperada });
    if (data.projectOrCompanyUrl) fields.push({ label: 'URL del Proyecto o Empresa', value: data.projectOrCompanyUrl });
    if (data.veracityConfirmation) fields.push({ label: 'Confirmación de veracidad', value: data.veracityConfirmation });

    // Dirección personal del propietario
    const ownerAddr = this.formatAddress(data.ownerPersonalAddress);
    if (ownerAddr) fields.push({ label: 'Dirección personal del propietario', value: ownerAddr });
    if (data.ownerNationality) fields.push({ label: 'Nacionalidad del propietario', value: data.ownerNationality });
    if (data.ownerCountryOfResidence) fields.push({ label: 'País de residencia del propietario', value: data.ownerCountryOfResidence });
    if (data.ownerPhoneNumber) fields.push({ label: 'Teléfono del propietario', value: data.ownerPhoneNumber });
    if (data.ownerEmail) fields.push({ label: 'Email del propietario', value: data.ownerEmail });

    // Preguntas sí/no (defaults false en el form: solo mostrar si el usuario marcó Sí)
    if (data.almacenaProductosDepositoUSA === true) {
      fields.push({ label: '¿Almacena productos en depósito en EE.UU.?', value: this.formatBoolean(data.almacenaProductosDepositoUSA) });
    }
    if (data.declaroImpuestosAntes === true) {
      fields.push({ label: '¿Declaró impuestos antes?', value: this.formatBoolean(data.declaroImpuestosAntes) });
    }
    if (data.llcConStartCompanies === true) {
      fields.push({ label: '¿LLC con Start Companies?', value: this.formatBoolean(data.llcConStartCompanies) });
    }
    if (data.ingresosMayor250k === true) {
      fields.push({ label: '¿Ingresos mayores a 250k?', value: this.formatBoolean(data.ingresosMayor250k) });
    }
    if (data.activosEnUSA === true) {
      fields.push({ label: '¿Activos en EE.UU.?', value: this.formatBoolean(data.activosEnUSA) });
    }
    if (data.ingresosPeriodicos10k === true) {
      fields.push({ label: '¿Ingresos periódicos 10k?', value: this.formatBoolean(data.ingresosPeriodicos10k) });
    }
    if (data.contrataServiciosUSA === true) {
      fields.push({ label: '¿Contrata servicios en EE.UU.?', value: this.formatBoolean(data.contrataServiciosUSA) });
    }
    if (data.propiedadEnUSA === true) {
      fields.push({ label: '¿Propiedad en EE.UU.?', value: this.formatBoolean(data.propiedadEnUSA) });
    }
    if (data.tieneCuentasBancarias === true) {
      fields.push({ label: '¿Tiene cuentas bancarias?', value: this.formatBoolean(data.tieneCuentasBancarias) });
    }

    return fields;
  }

  /**
   * Obtiene campos específicos para renovación LLC
   * Basado en wizard-renovacion-llc-form.component.html
   */
  getRenovacionLlcFields(): { label: string; value: any }[] {
    const fields: { label: string; value: any }[] = [];
    const data: any = pickServiceDataForReview(
      this.serviceData as Record<string, unknown>,
      RENOVACION_LLC_REVIEW_KEYS,
    );
    if (!data || Object.keys(data).length === 0) return fields;

    // Sección 1: Información de la LLC
    if (data.llcName) fields.push({ label: 'Nombre de la LLC', value: data.llcName });
    if (data.state) fields.push({ label: 'Estado de Registro de la LLC', value: data.state });
    if (data.llcType) fields.push({ label: 'Estructura Societaria', value: data.llcType === 'single' ? 'Single Member' : 'Multi Member' });
    if (data.mainActivity) fields.push({ label: 'Actividad Principal de la LLC', value: data.mainActivity });
    if (this.renovacionScalarMeaningful(data.hasPropertyInUSA)) {
      fields.push({
        label: '¿Tu empresa posee o renta alguna propiedad inmobiliaria en Estados Unidos?',
        value: this.formatBoolean(data.hasPropertyInUSA),
      });
    }
    if (this.renovacionScalarMeaningful(data.almacenaProductosDepositoUSA)) {
      fields.push({
        label: '¿Tu empresa almacena productos físicos en un depósito en Estados Unidos?',
        value: this.formatBoolean(data.almacenaProductosDepositoUSA),
      });
    }
    if (this.renovacionScalarMeaningful(data.contrataServiciosUSA)) {
      fields.push({
        label: '¿Tu empresa contrata servicios de personas o empresas de Estados Unidos regularmente?',
        value: this.formatBoolean(data.contrataServiciosUSA),
      });
    }
    if (this.renovacionScalarMeaningful(data.tieneCuentasBancarias)) {
      fields.push({
        label: '¿Tu LLC tiene cuentas bancarias a su nombre?',
        value: this.formatBoolean(data.tieneCuentasBancarias),
      });
    }
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
    if (this.renovacionMoneyMeaningful(data.llcOpeningCost)) {
      fields.push({ label: '¿Cuánto costó abrir la LLC en Estados Unidos?', value: this.formatMoney(data.llcOpeningCost) });
    }
    if (this.renovacionMoneyMeaningful(data.paidToFamilyMembers)) {
      fields.push({
        label: '¿Cuánto pagó la LLC a familiares del dueño por trabajos o servicios?',
        value: this.formatMoney(data.paidToFamilyMembers),
      });
    }
    if (this.renovacionMoneyMeaningful(data.paidToLocalCompanies)) {
      fields.push({
        label: '¿Cuánto pagó la LLC a empresas locales del dueño por bienes o servicios?',
        value: this.formatMoney(data.paidToLocalCompanies),
      });
    }
    if (this.renovacionMoneyMeaningful(data.paidForLLCFormation)) {
      fields.push({
        label: '¿Cuánto se pagó por la formación de la LLC (Incorporation/State fees)?',
        value: this.formatMoney(data.paidForLLCFormation),
      });
    }
    if (this.renovacionMoneyMeaningful(data.paidForLLCDissolution)) {
      fields.push({
        label: '¿Cuánto se pagó por la disolución de la LLC (si aplica)?',
        value: this.formatMoney(data.paidForLLCDissolution),
      });
    }
    if (this.renovacionMoneyMeaningful(data.bankAccountBalanceEndOfYear)) {
      fields.push({
        label: 'Saldo Al fin de año de las cuentas bancarias de la LLC',
        value: this.formatMoney(data.bankAccountBalanceEndOfYear),
      });
    }

    // Sección 4: Movimientos Financieros (año en curso alineado con el formulario)
    const fy = new Date().getFullYear();
    if (this.renovacionMoneyMeaningful(data.totalRevenue2025)) {
      fields.push({
        label: `Facturación total de la LLC en ${fy}`,
        value: this.formatMoney(data.totalRevenue2025),
      });
    }

    // Sección 5: Información Adicional
    if (this.renovacionScalarMeaningful(data.hasFinancialInvestmentsInUSA)) {
      fields.push({
        label: '¿Posee la LLC inversiones financieras o activos dentro de Estados Unidos?',
        value: this.formatBoolean(data.hasFinancialInvestmentsInUSA),
      });
    }
    if (this.renovacionScalarMeaningful(data.hasFiledTaxesBefore)) {
      fields.push({
        label: '¿La LLC declaró impuestos anteriormente?',
        value: this.formatBoolean(data.hasFiledTaxesBefore),
      });
    }
    if (this.renovacionScalarMeaningful(data.wasConstitutedWithStartCompanies)) {
      fields.push({
        label: '¿La LLC se constituyó con Start Companies?',
        value: this.formatBoolean(data.wasConstitutedWithStartCompanies),
      });
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
    const data: any = pickServiceDataForReview(
      this.serviceData as Record<string, unknown>,
      CUENTA_BANCARIA_REVIEW_KEYS,
    );
    if (!data || Object.keys(data).length === 0) return fields;

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
    if (data.validatorPassportUrl) fields.push({ label: 'Foto del pasaporte del Verificador', value: 'Archivo subido ✓' });
    if (data.validatorWorkEmail) fields.push({ label: 'Email laboral del Verificador', value: data.validatorWorkEmail });
    if (data.validatorPhone) fields.push({ label: 'Teléfono del Verificador', value: data.validatorPhone });
    if (data.canReceiveSMS === true) {
      fields.push({ label: '¿Puede recibir SMS?', value: this.formatBoolean(data.canReceiveSMS) });
    }
    if (data.isUSResident === 'yes' || data.isUSResident === 'no') {
      fields.push({ label: '¿Es residente en EE.UU.?', value: data.isUSResident === 'yes' ? 'Sí' : 'No' });
    }
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
    if (data.isMultiMember === 'yes' || data.isMultiMember === 'no') {
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
