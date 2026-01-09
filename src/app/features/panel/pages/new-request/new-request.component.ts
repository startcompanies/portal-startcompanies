import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { RequestsService } from '../../services/requests.service';
import { StripeService } from '../../services/stripe.service';
import { PartnerClientsService } from '../../services/partner-clients.service';
import { environment } from '../../../../../environments/environment';
import { AperturaLlcFormComponent } from './apertura-llc-form/apertura-llc-form.component';
import { RenovacionLlcFormComponent } from './renovacion-llc-form/renovacion-llc-form.component';
import { CuentaBancariaFormComponent } from './cuenta-bancaria-form/cuenta-bancaria-form.component';
import { StripePaymentFormComponent, StripePaymentResult } from '../../components/stripe-payment-form/stripe-payment-form.component';
import { IntlTelInputComponent } from '../../../../shared/components/intl-tel-input/intl-tel-input.component';
import { GeolocationService } from '../../../../shared/services/geolocation.service';

@Component({
  selector: 'app-new-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AperturaLlcFormComponent, RenovacionLlcFormComponent, CuentaBancariaFormComponent, StripePaymentFormComponent, IntlTelInputComponent],
  templateUrl: './new-request.component.html',
  styleUrl: './new-request.component.css'
})
export class NewRequestComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(StripePaymentFormComponent, { static: false }) stripePaymentForm!: StripePaymentFormComponent;
  @ViewChild(AperturaLlcFormComponent, { static: false }) aperturaLlcFormComponent!: AperturaLlcFormComponent;
  @ViewChild(RenovacionLlcFormComponent, { static: false }) renovacionLlcFormComponent!: RenovacionLlcFormComponent;
  @ViewChild(CuentaBancariaFormComponent, { static: false }) cuentaBancariaFormComponent!: CuentaBancariaFormComponent;
  
  requestForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  currentStep = 1;
  totalSteps = 4;
  serviceSection = 1; // Sección actual dentro del paso "Datos del Servicio"
  stripeProcessing = false;
  stripePaymentProcessed = false; // Indica si el pago de Stripe fue procesado exitosamente
  stripePaymentToken: string | null = null; // Token del pago procesado
  selectedPaymentProofFile: File | null = null;
  isUploadingPaymentProof = false;
  paymentProofUploadProgress = 0;
  
  // Estado de carga de archivos genérico
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};

  // Para renovación: selección de apertura existente
  clientAperturas: any[] = [];
  selectedAperturaId: number | null = null;
  isLoadingAperturas = false;
  useExistingApertura = false;

  // Para cliente existente
  selectedClientId: number | null = null;
  selectedClient: any = null;
  isLoadingClient = false;

  // Para request en borrador
  draftRequestId: number | null = null;
  draftRequestUuid: string | null = null; // UUID de la request en borrador para estructura de carpetas

  // País detectado por IP
  detectedCountryCode: string = 'us';

  // Sub-pasos para apertura LLC (movidos al componente hijo)
  // aperturaLlcSubStep y aperturaLlcTotalSubSteps ahora están en AperturaLlcFormComponent

  serviceTypes = [
    { value: 'apertura-llc', label: 'Apertura LLC', description: 'Formación de nueva LLC en Estados Unidos' },
    { value: 'renovacion-llc', label: 'Renovación LLC', description: 'Renovación de LLC existente' },
    { value: 'cuenta-bancaria', label: 'Cuenta Bancaria', description: 'Apertura de cuenta bancaria para LLC' }
  ];

  llcTypes = [
    { value: 'single', label: 'Single Member LLC', description: 'LLC con un solo miembro' },
    { value: 'multi', label: 'Multi Member LLC', description: 'LLC con múltiples miembros' }
  ];

  // Lista de estados de USA
  usStates = [
    { value: 'Alabama', label: 'Alabama', abbreviation: 'AL' },
    { value: 'Alaska', label: 'Alaska', abbreviation: 'AK' },
    { value: 'Arizona', label: 'Arizona', abbreviation: 'AZ' },
    { value: 'Arkansas', label: 'Arkansas', abbreviation: 'AR' },
    { value: 'California', label: 'California', abbreviation: 'CA' },
    { value: 'Colorado', label: 'Colorado', abbreviation: 'CO' },
    { value: 'Connecticut', label: 'Connecticut', abbreviation: 'CT' },
    { value: 'Delaware', label: 'Delaware', abbreviation: 'DE' },
    { value: 'Florida', label: 'Florida', abbreviation: 'FL' },
    { value: 'Georgia', label: 'Georgia', abbreviation: 'GA' },
    { value: 'Hawaii', label: 'Hawaii', abbreviation: 'HI' },
    { value: 'Idaho', label: 'Idaho', abbreviation: 'ID' },
    { value: 'Illinois', label: 'Illinois', abbreviation: 'IL' },
    { value: 'Indiana', label: 'Indiana', abbreviation: 'IN' },
    { value: 'Iowa', label: 'Iowa', abbreviation: 'IA' },
    { value: 'Kansas', label: 'Kansas', abbreviation: 'KS' },
    { value: 'Kentucky', label: 'Kentucky', abbreviation: 'KY' },
    { value: 'Louisiana', label: 'Louisiana', abbreviation: 'LA' },
    { value: 'Maine', label: 'Maine', abbreviation: 'ME' },
    { value: 'Maryland', label: 'Maryland', abbreviation: 'MD' },
    { value: 'Massachusetts', label: 'Massachusetts', abbreviation: 'MA' },
    { value: 'Michigan', label: 'Michigan', abbreviation: 'MI' },
    { value: 'Minnesota', label: 'Minnesota', abbreviation: 'MN' },
    { value: 'Mississippi', label: 'Mississippi', abbreviation: 'MS' },
    { value: 'Missouri', label: 'Missouri', abbreviation: 'MO' },
    { value: 'Montana', label: 'Montana', abbreviation: 'MT' },
    { value: 'Nebraska', label: 'Nebraska', abbreviation: 'NE' },
    { value: 'Nevada', label: 'Nevada', abbreviation: 'NV' },
    { value: 'New Hampshire', label: 'New Hampshire', abbreviation: 'NH' },
    { value: 'New Jersey', label: 'New Jersey', abbreviation: 'NJ' },
    { value: 'New Mexico', label: 'New Mexico', abbreviation: 'NM' },
    { value: 'New York', label: 'New York', abbreviation: 'NY' },
    { value: 'North Carolina', label: 'North Carolina', abbreviation: 'NC' },
    { value: 'North Dakota', label: 'North Dakota', abbreviation: 'ND' },
    { value: 'Ohio', label: 'Ohio', abbreviation: 'OH' },
    { value: 'Oklahoma', label: 'Oklahoma', abbreviation: 'OK' },
    { value: 'Oregon', label: 'Oregon', abbreviation: 'OR' },
    { value: 'Pennsylvania', label: 'Pennsylvania', abbreviation: 'PA' },
    { value: 'Rhode Island', label: 'Rhode Island', abbreviation: 'RI' },
    { value: 'South Carolina', label: 'South Carolina', abbreviation: 'SC' },
    { value: 'South Dakota', label: 'South Dakota', abbreviation: 'SD' },
    { value: 'Tennessee', label: 'Tennessee', abbreviation: 'TN' },
    { value: 'Texas', label: 'Texas', abbreviation: 'TX' },
    { value: 'Utah', label: 'Utah', abbreviation: 'UT' },
    { value: 'Vermont', label: 'Vermont', abbreviation: 'VT' },
    { value: 'Virginia', label: 'Virginia', abbreviation: 'VA' },
    { value: 'Washington', label: 'Washington', abbreviation: 'WA' },
    { value: 'West Virginia', label: 'West Virginia', abbreviation: 'WV' },
    { value: 'Wisconsin', label: 'Wisconsin', abbreviation: 'WI' },
    { value: 'Wyoming', label: 'Wyoming', abbreviation: 'WY' },
    { value: 'District of Columbia', label: 'District of Columbia', abbreviation: 'DC' },
  ];

  // Estados para manejar sub-secciones del paso 3
  currentSubStep: { [key: string]: number } = {
    'apertura-llc': 1,
    'renovacion-llc': 1,
    'cuenta-bancaria': 1
  };

  paymentMethods = [
    { value: 'transferencia', label: 'Transferencia Bancaria', icon: 'bi-bank' },
    { value: 'stripe', label: 'Tarjeta de Crédito/Débito (Stripe)', icon: 'bi-credit-card' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private requestsService: RequestsService,
    private stripeService: StripeService,
    private http: HttpClient,
    private partnerClientsService: PartnerClientsService,
    private geolocationService: GeolocationService
  ) {
    this.requestForm = this.fb.group({
      // Paso 1: Tipo de servicio
      serviceType: [''], // Validators.required - COMENTADO PARA TESTING
      
      // Paso 2: Información del cliente
      clientFirstName: [''], // Validators.required - COMENTADO PARA TESTING
      clientLastName: [''], // Validators.required - COMENTADO PARA TESTING
      clientEmail: [''], // [Validators.required, Validators.email] - COMENTADO PARA TESTING
      clientPhone: [''],
      
      // Paso 3: Datos específicos del servicio (se inicializan dinámicamente)
      serviceData: this.fb.group({}),
      
      // Paso 4: Pago
      paymentMethod: [''], // Validators.required - COMENTADO PARA TESTING
      paymentAmount: [0], // Se calculará automáticamente según el servicio y estado
      paymentProofUrl: [''], // Para transferencia
      stripeToken: [''], // Para Stripe
      
      // Información adicional
      notes: ['']
    });

    // Inicializar formularios específicos cuando cambie el tipo de servicio
    this.requestForm.get('serviceType')?.valueChanges.subscribe(type => {
      this.initializeServiceForm(type);
      // Recalcular monto cuando cambie el tipo de servicio
      setTimeout(() => this.calculatePaymentAmount(), 100);
      
      // Si se selecciona renovación y hay cliente seleccionado, cargar aperturas
      if (type === 'renovacion-llc' && this.selectedClientId) {
        setTimeout(() => {
          this.loadClientAperturas();
        }, 300);
      }
    });

    // Cargar aperturas cuando cambie el email del cliente (solo para renovación)
    this.requestForm.get('clientEmail')?.valueChanges.subscribe(email => {
      if (email && this.getSelectedServiceType() === 'renovacion-llc' && this.currentStep >= 2) {
        // Debounce para evitar múltiples llamadas
        setTimeout(() => {
          if (this.requestForm.get('clientEmail')?.value === email) {
            this.loadClientAperturas();
          }
        }, 500);
      }
    });

    // Resetear el estado del pago cuando cambia el método de pago
    this.requestForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      if (method !== 'stripe') {
        this.stripePaymentProcessed = false;
        this.stripePaymentToken = null;
        this.successMessage = null;
      }
    });

    // Escuchar cambios en el estado para recalcular el monto
    // Esto se configurará después de inicializar el formulario del servicio
  }

  ngAfterViewInit(): void {
    // El componente de Stripe se inicializa automáticamente
  }

  ngOnDestroy(): void {
    // El componente de Stripe se limpia automáticamente
  }

  /**
   * Verifica si estamos en el paso de pago
   */
  isPaymentStep(): boolean {
    if (this.selectedClientId) {
      return this.currentStep === 3;
    } else {
      return this.currentStep === 4;
    }
  }

  /**
   * Maneja cuando el pago de Stripe está listo
   */
  onStripePaymentReady(isReady: boolean): void {
    // El formulario de pago está listo o no
    // Puedes usar esto para habilitar/deshabilitar el botón de envío
  }

  /**
   * Maneja errores del pago de Stripe
   */
  onStripePaymentError(error: string): void {
    this.errorMessage = error;
    this.stripeProcessing = false;
    this.stripePaymentProcessed = false;
  }

  /**
   * Maneja el éxito del pago de Stripe
   */
  onStripePaymentSuccess(result: StripePaymentResult): void {
    if (result.token) {
      this.stripePaymentToken = result.token;
      this.stripePaymentProcessed = true;
      this.stripeProcessing = false;
      this.errorMessage = null;
      this.successMessage = 'Pago procesado exitosamente. Ahora puedes crear la solicitud.';
    }
  }

  /**
   * Procesa el pago con Stripe
   */
  async processStripePayment(): Promise<boolean> {
    if (!this.stripePaymentForm) {
      this.errorMessage = 'Error: El formulario de pago no está disponible. Por favor, recarga la página.';
      return false;
    }

    this.stripeProcessing = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      // 1. Obtener el token de Stripe del formulario
      const paymentResult = await this.stripePaymentForm.createPaymentToken();

      if (paymentResult.error || !paymentResult.token) {
        this.stripeProcessing = false;
        this.errorMessage = paymentResult.error?.message || 'Error al procesar el pago con Stripe. Por favor, intenta nuevamente.';
        return false;
      }

      // Guardar el token del pago localmente
      this.stripePaymentToken = paymentResult.token;
      
      // 2. Obtener el monto del pago del formulario
      const paymentAmount = this.requestForm.get('paymentAmount')?.value;
      if (!paymentAmount || paymentAmount <= 0) {
        this.stripeProcessing = false;
        this.errorMessage = 'El monto del pago no es válido.';
        return false;
      }

      // 3. Asegurar que existe una request en borrador antes de procesar el pago
      if (!this.draftRequestId) {
        // Si no hay request en borrador, crear una primero
        console.log('[processStripePayment] No hay request en borrador, creando una primero...');
        try {
          const formValue = this.requestForm.value;
          const serviceType = formValue.serviceType;
          const serviceData = formValue.serviceData;

          const requestData: any = {
            type: serviceType,
            clientId: this.selectedClientId || 0,
            currentStepNumber: this.currentStep,
            status: 'pendiente', // Mantener como pendiente hasta que se procese el pago
            notes: formValue.notes || '',
            clientData: this.selectedClientId ? undefined : {
              firstName: formValue.clientFirstName,
              lastName: formValue.clientLastName,
              email: formValue.clientEmail,
              phone: formValue.clientPhone || ''
            }
          };

          // Agregar datos específicos del servicio
          if (serviceType === 'apertura-llc') {
            requestData.aperturaLlcData = {
              ...serviceData,
              members: this.membersFormArray?.value || []
            };
          } else if (serviceType === 'renovacion-llc') {
            // Homologar: usar 'members' en lugar de 'owners' para ser consistente con apertura-llc
            // El FormArray se llama 'owners' en el frontend pero se envía como 'members' al backend
            requestData.renovacionLlcData = {
              ...serviceData,
              members: this.ownersFormArray?.value || [] // Mapear ownersFormArray a members en el payload
            };
          } else if (serviceType === 'cuenta-bancaria') {
            requestData.cuentaBancariaData = {
              ...serviceData,
              owners: this.ownersFormArray.value || [],
              validators: serviceData.validators || []
            };
          }

          const createdRequest = await this.requestsService.createRequest(requestData);
          this.draftRequestId = createdRequest.id;
          this.draftRequestUuid = createdRequest.uuid || null;
          console.log('[processStripePayment] Request en borrador creada:', this.draftRequestId, 'UUID:', this.draftRequestUuid);
        } catch (error: any) {
          console.error('[processStripePayment] Error al crear request en borrador:', error);
          this.stripeProcessing = false;
          this.errorMessage = 'Error al preparar la solicitud. Por favor, intenta nuevamente.';
          return false;
        }
      }

      // 4. Procesar el pago en el backend (esto creará el charge en Stripe y guardará los datos)
      console.log('[processStripePayment] Procesando pago en el backend...');
      console.log('[processStripePayment] Request ID:', this.draftRequestId);
      console.log('[processStripePayment] Token:', this.stripePaymentToken ? 'presente' : 'ausente');
      console.log('[processStripePayment] Monto:', paymentAmount);

      const paymentData = {
        stripeToken: this.stripePaymentToken,
        paymentMethod: 'stripe',
        paymentAmount: paymentAmount,
        // NO cambiar el status aquí, solo procesar el pago
        // El status se cambiará cuando se haga clic en "Crear Solicitud"
      };

        try {
          const updatedRequest = await this.requestsService.updateRequest(this.draftRequestId, paymentData);
          console.log('[processStripePayment] Pago procesado exitosamente en el backend');
          console.log('[processStripePayment] Request actualizada:', updatedRequest);
          // Actualizar UUID si viene en la respuesta
          if (updatedRequest.uuid) {
            this.draftRequestUuid = updatedRequest.uuid;
          }

        // Verificar que el pago se procesó correctamente
        if (updatedRequest.stripeChargeId) {
          this.stripePaymentProcessed = true;
          this.stripeProcessing = false;
          this.successMessage = 'Pago procesado exitosamente. Ahora puedes crear la solicitud.';
          
          // Bloquear los campos de la tarjeta para que no se puedan modificar
          if (this.stripePaymentForm) {
            this.stripePaymentForm.disableCardElement();
            console.log('[processStripePayment] Campos de tarjeta bloqueados');
          }
          
          return true;
        } else {
          this.stripeProcessing = false;
          this.errorMessage = 'El pago se procesó pero no se recibió confirmación. Por favor, verifica el estado.';
          return false;
        }
      } catch (error: any) {
        console.error('[processStripePayment] Error al procesar pago en el backend:', error);
        this.stripeProcessing = false;
        this.errorMessage = error?.error?.message || 'Error al procesar el pago. Por favor, intenta nuevamente.';
        return false;
      }
    } catch (error: any) {
      this.stripeProcessing = false;
      this.errorMessage = error?.message || 'Error al procesar el pago. Por favor, intenta nuevamente.';
      return false;
    }
  }

  async ngOnInit(): Promise<void> {
    // Validar que el usuario sea partner
    if (!this.authService.isPartner()) {
      this.router.navigate(['/panel/my-requests']);
      return;
    }

    // Obtener país por IP y establecerlo como predeterminado
    this.geolocationService.getCountryCodeByIP().subscribe(countryCode => {
      this.detectedCountryCode = countryCode;
    });

    // Verificar si hay un UUID de request en la ruta (para continuar borrador)
    this.route.params.subscribe(async params => {
      const requestUuid = params['uuid'];
      if (requestUuid) {
        await this.loadDraftRequest(requestUuid);
      }
    });

    // Verificar si hay un client (UUID) en los query params
    this.route.queryParams.subscribe(async params => {
      const clientUuid = params['client'];
      if (clientUuid) {
        // Intentar cargar por UUID primero (método principal)
        await this.loadClientDataByUuid(clientUuid);
        // Si hay cliente seleccionado, saltar al paso 2 (o 3 si ya hay servicio seleccionado)
        // Pero primero esperamos a que se cargue el cliente
      }
      // Mantener compatibilidad con clientId (deprecated)
      const clientId = params['clientId'];
      if (clientId && !clientUuid) {
        this.selectedClientId = parseInt(clientId, 10);
        await this.loadClientData(this.selectedClientId);
      }
    });
    
    // Inicializar el formulario del servicio cuando se seleccione un tipo
    const serviceType = this.requestForm.get('serviceType')?.value;
    if (serviceType) {
      this.initializeServiceForm(serviceType);
    }
  }

  /**
   * Carga una request en borrador por UUID para continuar editándola
   */
  async loadDraftRequest(uuid: string): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    
    try {
      const request = await this.requestsService.getRequestByUuid(uuid);
      
      // Verificar que la request esté en estado pendiente
      if (request.status !== 'pendiente') {
        this.errorMessage = 'Esta solicitud ya fue enviada. No se puede editar.';
        this.router.navigate(['/panel/my-requests']);
        return;
      }

      // Guardar el ID y UUID de la request en borrador
      this.draftRequestId = request.id;
      this.draftRequestUuid = request.uuid || null;

      // Cargar datos del cliente si existe (PRIMERO, antes de establecer el paso)
      if (request.clientId) {
        this.selectedClientId = request.clientId;
        await this.loadClientData(request.clientId);
      }

      // Cargar tipo de servicio
      if (request.type) {
        this.requestForm.patchValue({ serviceType: request.type });
        this.initializeServiceForm(request.type);
        
        // Esperar a que el formulario se inicialice completamente
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Restaurar el paso principal del wizard si está guardado
      if (request.currentStep !== undefined && request.currentStep !== null) {
        this.currentStep = request.currentStep;
      } else {
        // Fallback: determinar el paso basándose en currentStepNumber (compatibilidad con requests antiguas)
        let savedCurrentStepNumber = 1;
        if (request.type === 'apertura-llc' && request.aperturaLlcRequest?.currentStepNumber) {
          savedCurrentStepNumber = request.aperturaLlcRequest.currentStepNumber;
        } else if (request.type === 'renovacion-llc' && request.renovacionLlcRequest?.currentStepNumber) {
          savedCurrentStepNumber = request.renovacionLlcRequest.currentStepNumber;
        } else if (request.type === 'cuenta-bancaria' && request.cuentaBancariaRequest?.currentStepNumber) {
          savedCurrentStepNumber = request.cuentaBancariaRequest.currentStepNumber;
        }

        // Si currentStepNumber >= 1, significa que ya pasó el paso 1 (selección de servicio)
        if (savedCurrentStepNumber >= 1) {
          if (this.selectedClientId) {
            // Si hay cliente, el paso 2 es "Datos del Servicio"
            this.currentStep = 2;
          } else {
            // Si no hay cliente, el paso 3 es "Datos del Servicio"
            this.currentStep = 3;
          }
        }
      }

      // Restaurar la sección dentro de "Datos del Servicio"
      let savedCurrentStepNumber = 1;
      if (request.type === 'apertura-llc' && request.aperturaLlcRequest?.currentStepNumber) {
        savedCurrentStepNumber = request.aperturaLlcRequest.currentStepNumber;
      } else if (request.type === 'renovacion-llc' && request.renovacionLlcRequest?.currentStepNumber) {
        savedCurrentStepNumber = request.renovacionLlcRequest.currentStepNumber;
      } else if (request.type === 'cuenta-bancaria' && request.cuentaBancariaRequest?.currentStepNumber) {
        savedCurrentStepNumber = request.cuentaBancariaRequest.currentStepNumber;
      }
      
      // Solo establecer serviceSection si estamos en el paso de "Datos del Servicio"
      if (this.isServiceDataStep() && savedCurrentStepNumber >= 1) {
        this.serviceSection = savedCurrentStepNumber;
      }

      // Cargar datos específicos del servicio según el tipo
      if (request.type === 'apertura-llc' && request.aperturaLlcRequest) {
        const aperturaData = request.aperturaLlcRequest;
        const serviceDataForm = this.requestForm.get('serviceData') as FormGroup;
        
        if (serviceDataForm) {
          // Cargar llcType primero para que se inicialice el FormArray de members correctamente
          if (aperturaData.llcType) {
            serviceDataForm.patchValue({ llcType: aperturaData.llcType });
            // Llamar a handleLlcTypeChange para inicializar miembros si es necesario
            this.handleLlcTypeChange(aperturaData.llcType);
            // Esperar un momento para que se inicialice el FormArray
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Cargar todos los demás datos disponibles
          Object.keys(aperturaData).forEach(key => {
            if (key !== 'currentStepNumber' && key !== 'requestId' && key !== 'llcType' && serviceDataForm.get(key)) {
              const value = (aperturaData as any)[key];
              if (value !== null && value !== undefined && value !== '') {
                serviceDataForm.patchValue({ [key]: value });
              }
            }
          });
        }

        // Cargar miembros si existen
        if (request.members && request.members.length > 0) {
          // Esperar un poco más para asegurar que el FormArray esté inicializado
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verificar que el FormArray existe antes de usarlo
          const membersArray = this.membersFormArray;
          if (membersArray) {
            // Limpiar el array actual
            while (membersArray.length !== 0) {
              membersArray.removeAt(0);
            }
            // Agregar los miembros existentes
            request.members.forEach((member: any) => {
              this.addMember();
              const lastIndex = membersArray.length - 1;
              const memberForm = membersArray.at(lastIndex) as FormGroup;
              if (memberForm) {
                memberForm.patchValue({
                  firstName: member.firstName || member.first_name || '',
                  lastName: member.lastName || member.last_name || '',
                  email: member.email || '',
                  phoneNumber: member.phoneNumber || member.phone_number || '',
                  passportNumber: member.passportNumber || member.passport_number || '',
                  nationality: member.nationality || '',
                  dateOfBirth: member.dateOfBirth || member.date_of_birth || '',
                  percentageOfParticipation: member.percentageOfParticipation || member.percentage_of_participation || 0,
                  validatesBankAccount: member.validatesBankAccount || member.validates_bank_account || false,
                  scannedPassportUrl: member.scannedPassportUrl || member.scanned_passport_url || '',
                  // Cargar dirección del miembro si existe
                  ...(member.memberAddress ? {
                    memberAddress: {
                      street: member.memberAddress.street || '',
                      unit: member.memberAddress.unit || '',
                      city: member.memberAddress.city || '',
                      stateRegion: member.memberAddress.stateRegion || member.memberAddress.state_region || '',
                      postalCode: member.memberAddress.postalCode || member.memberAddress.postal_code || '',
                      country: member.memberAddress.country || ''
                    }
                  } : {})
                });
              }
            });
          }
        } else {
          // Si no hay miembros cargados, verificar si necesitamos agregar uno
          await new Promise(resolve => setTimeout(resolve, 150));
          const membersArray = this.membersFormArray;
          if (membersArray) {
            if (aperturaData.llcType === 'single' && membersArray.length === 0) {
              // Si es single member y no hay miembros, agregar uno automáticamente
              this.addMember();
            } else if (aperturaData.llcType === 'multi' && membersArray.length === 0) {
              // Si es multi member y no hay miembros, agregar al menos uno para que el usuario pueda empezar
              this.addMember();
            }
          }
        }
      } else if (request.type === 'renovacion-llc' && request.renovacionLlcRequest) {
        const renovacionData = request.renovacionLlcRequest;
        const serviceDataForm = this.requestForm.get('serviceData') as FormGroup;
        
        if (serviceDataForm) {
          // Cargar todos los datos disponibles (excepto members/owners que se maneja por separado)
          Object.keys(renovacionData).forEach(key => {
            if (key !== 'currentStepNumber' && key !== 'requestId' && key !== 'owners' && key !== 'members' && serviceDataForm.get(key)) {
              const value = (renovacionData as any)[key];
              if (value !== null && value !== undefined && value !== '') {
                serviceDataForm.patchValue({ [key]: value });
              }
            }
          });
          
          // Cargar members si existen (homologado: usar 'members' igual que apertura-llc)
          // El backend devuelve 'members' pero también puede devolver 'owners' para compatibilidad
          const membersData = (request as any).members || renovacionData.members || renovacionData.owners || [];
          if (membersData && Array.isArray(membersData) && membersData.length > 0) {
            const ownersArray = this.ownersFormArray;
            // Limpiar owners existentes
            while (ownersArray.length > 0) {
              ownersArray.removeAt(0);
            }
            // Agregar cada member del borrador (mapear a formato de ownersFormArray)
            membersData.forEach((memberData: any) => {
              // Mapear desde Member (backend) a formato de ownersFormArray (frontend)
              const phoneValue = memberData.phoneNumber !== null && memberData.phoneNumber !== undefined ? memberData.phoneNumber : '';
              const taxCountryValue = memberData.taxFilingCountry 
                ? (typeof memberData.taxFilingCountry === 'string' && memberData.taxFilingCountry.includes(',')
                    ? memberData.taxFilingCountry.split(',').map((c: string) => c.trim())
                    : [memberData.taxFilingCountry])
                : [];
              
              const ownerGroup = this.fb.group({
                name: [memberData.firstName || memberData.name || ''],
                lastName: [memberData.lastName || ''],
                dateOfBirth: [memberData.dateOfBirth || ''],
                email: [memberData.email || '', Validators.email],
                phone: [phoneValue],
                fullAddress: [memberData.memberAddress?.street || memberData.fullAddress || ''],
                unit: [memberData.memberAddress?.unit || memberData.unit || ''],
                city: [memberData.memberAddress?.city || memberData.city || ''],
                stateRegion: [memberData.memberAddress?.stateRegion || memberData.stateRegion || ''],
                postalCode: [memberData.memberAddress?.postalCode || memberData.postalCode || ''],
                country: [memberData.memberAddress?.country || memberData.country || ''],
                nationality: [memberData.nationality || ''],
                passportNumber: [memberData.passportNumber || ''],
                ssnItin: [memberData.ssnOrItin || ''],
                cuit: [memberData.nationalTaxId || ''],
                capitalContributions: [memberData.ownerContributions || memberData.capitalContributions || 0],
                loansToLLC: [memberData.ownerLoansToLLC || memberData.loansToLLC || 0],
                loansRepaid: [memberData.loansReimbursedByLLC || memberData.loansRepaid || 0],
                capitalWithdrawals: [memberData.profitDistributions || memberData.capitalWithdrawals || 0],
                hasInvestmentsInUSA: [memberData.hasUSFinancialInvestments || memberData.hasInvestmentsInUSA || ''],
                isUSCitizen: [memberData.isUSCitizen || ''],
                taxCountry: [taxCountryValue],
                wasInUSA31Days: [memberData.spentMoreThan31DaysInUS || memberData.wasInUSA31Days || ''],
                participationPercentage: [memberData.percentageOfParticipation || 0, [Validators.min(0), Validators.max(100)]]
              });
              ownersArray.push(ownerGroup);
            });
            console.log('[loadDraftRequest] Members cargados (renovación):', ownersArray.length);
            
            // Forzar actualización del componente intl-tel-input después de un breve delay
            setTimeout(() => {
              ownersArray.controls.forEach((control, index) => {
                const phoneControl = control.get('phone');
                if (phoneControl && membersData[index]?.phoneNumber) {
                  phoneControl.setValue(membersData[index].phoneNumber, { emitEvent: true });
                }
                
                // Forzar actualización del select múltiple taxCountry
                const taxCountryControl = control.get('taxCountry');
                if (taxCountryControl) {
                  const taxCountryValue = membersData[index]?.taxFilingCountry;
                  if (taxCountryValue) {
                    const taxCountryArray = Array.isArray(taxCountryValue) 
                      ? taxCountryValue 
                      : (typeof taxCountryValue === 'string' && taxCountryValue.includes(',')
                          ? taxCountryValue.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
                          : [taxCountryValue]);
                    setTimeout(() => {
                      taxCountryControl.setValue(taxCountryArray, { emitEvent: false });
                    }, 50);
                  }
                }
              });
            }, 300);
          }
        }
      } else if (request.type === 'cuenta-bancaria' && request.cuentaBancariaRequest) {
        const cuentaData = request.cuentaBancariaRequest;
        const serviceDataForm = this.requestForm.get('serviceData') as FormGroup;
        
        if (serviceDataForm) {
          // Cargar todos los datos disponibles
          Object.keys(cuentaData).forEach(key => {
            if (key !== 'currentStepNumber' && key !== 'requestId' && serviceDataForm.get(key)) {
              let value = (cuentaData as any)[key];
              
              // Mapear llcType a isMultiMember
              if (key === 'llcType') {
                if (value === 'multi') {
                  serviceDataForm.patchValue({ isMultiMember: 'yes' });
                } else if (value === 'single') {
                  serviceDataForm.patchValue({ isMultiMember: 'no' });
                }
                // No hacer patchValue para llcType directamente, ya que mapeamos a isMultiMember
                return;
              }
              
              // Mapear certificateOfConstitutionOrArticlesUrl a articlesOrCertificateUrl
              if (key === 'certificateOfConstitutionOrArticlesUrl') {
                serviceDataForm.patchValue({ articlesOrCertificateUrl: value });
                return;
              }
              
              // Mapear proofOfAddressUrl a serviceBillUrl
              if (key === 'proofOfAddressUrl') {
                serviceDataForm.patchValue({ serviceBillUrl: value });
                return;
              }
              
              // Formatear fechas para inputs type="date" (formato YYYY-MM-DD)
              if (key === 'validatorDateOfBirth' && value) {
                const dateValue = value instanceof Date 
                  ? value.toISOString().split('T')[0] 
                  : (typeof value === 'string' && value.includes('T') 
                      ? new Date(value).toISOString().split('T')[0] 
                      : value);
                serviceDataForm.patchValue({ [key]: dateValue });
                return;
              }
              
              if (value !== null && value !== undefined && value !== '') {
                serviceDataForm.patchValue({ [key]: value });
              }
            }
          });
          
          // Cargar members y validators si existen
          // Usar casting para acceder a propiedades dinámicas agregadas por el backend
          const requestWithOwners = request as any;
          // Cargar members (ahora se usan Member en lugar de BankAccountOwner para cuenta-bancaria)
          if (requestWithOwners.members && requestWithOwners.members.length > 0) {
            const ownersArray = this.ownersFormArray;
            if (ownersArray) {
              while (ownersArray.length > 0) {
                ownersArray.removeAt(0);
              }
              requestWithOwners.members.forEach((member: any) => {
                const ownerGroup = this.fb.group({
                  firstName: [member.firstName || ''],
                  lastName: [member.lastName || member.paternalLastName || ''],
                  dateOfBirth: [member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : ''],
                  nationality: [member.nationality || ''],
                  passportNumber: [member.passportNumber || member.passportOrNationalId || ''],
                  ssnItin: [member.ssnOrItin || ''],
                  cuit: [member.nationalTaxId || ''],
                  participationPercentage: [member.percentageOfParticipation || ''],
                  passportFileUrl: [member.identityDocumentUrl || member.scannedPassportUrl || ''],
                  email: [member.email || ''],
                  phoneNumber: [member.phoneNumber || ''],
                  memberAddress: [member.memberAddress || {}],
                });
                ownersArray.push(ownerGroup);
              });
            }
          }
          
          // Cargar validador desde CuentaBancariaRequest (ya no hay BankAccountValidator separado)
          if (requestWithOwners.bankAccountValidator || (requestWithOwners.cuentaBancariaRequest && (requestWithOwners.cuentaBancariaRequest as any).validatorFirstName)) {
            const validator = requestWithOwners.bankAccountValidator || {
              firstName: (requestWithOwners.cuentaBancariaRequest as any)?.validatorFirstName || '',
              lastName: (requestWithOwners.cuentaBancariaRequest as any)?.validatorLastName || '',
              dateOfBirth: (requestWithOwners.cuentaBancariaRequest as any)?.validatorDateOfBirth || null,
              nationality: (requestWithOwners.cuentaBancariaRequest as any)?.validatorNationality || '',
              citizenship: (requestWithOwners.cuentaBancariaRequest as any)?.validatorCitizenship || '',
              passportNumber: (requestWithOwners.cuentaBancariaRequest as any)?.validatorPassportNumber || '',
              scannedPassportUrl: (requestWithOwners.cuentaBancariaRequest as any)?.validatorScannedPassportUrl || '',
              workEmail: (requestWithOwners.cuentaBancariaRequest as any)?.validatorWorkEmail || '',
              useEmailForRelayLogin: (requestWithOwners.cuentaBancariaRequest as any)?.validatorUseEmailForRelayLogin || false,
              phone: (requestWithOwners.cuentaBancariaRequest as any)?.validatorPhone || '',
              canReceiveSMS: (requestWithOwners.cuentaBancariaRequest as any)?.validatorCanReceiveSMS || false,
              isUSResident: (requestWithOwners.cuentaBancariaRequest as any)?.validatorIsUSResident || false,
            };
            
            // IMPORTANTE: Cargar también directamente en los controles del formulario principal
            // porque cuenta-bancaria-form lee directamente de serviceDataForm.get('validatorPassportUrl') y serviceDataForm.get('isUSResident')
            serviceDataForm.get('validatorPassportUrl')?.setValue(validator.scannedPassportUrl || '');
            serviceDataForm.get('isUSResident')?.setValue(validator.isUSResident ? 'yes' : 'no');
            serviceDataForm.get('validatorFirstName')?.setValue(validator.firstName || '');
            serviceDataForm.get('validatorLastName')?.setValue(validator.lastName || '');
            serviceDataForm.get('validatorDateOfBirth')?.setValue(validator.dateOfBirth ? new Date(validator.dateOfBirth).toISOString().split('T')[0] : '');
            serviceDataForm.get('validatorNationality')?.setValue(validator.nationality || '');
            serviceDataForm.get('validatorCitizenship')?.setValue(validator.citizenship || '');
            serviceDataForm.get('validatorPassportNumber')?.setValue(validator.passportNumber || '');
            serviceDataForm.get('validatorWorkEmail')?.setValue(validator.workEmail || '');
            serviceDataForm.get('validatorPhone')?.setValue(validator.phone || '');
            serviceDataForm.get('canReceiveSMS')?.setValue(validator.canReceiveSMS || false);
            serviceDataForm.get('validatorTitle')?.setValue((requestWithOwners.cuentaBancariaRequest as any)?.validatorTitle || '');
            serviceDataForm.get('validatorIncomeSource')?.setValue((requestWithOwners.cuentaBancariaRequest as any)?.validatorIncomeSource || '');
            serviceDataForm.get('validatorAnnualIncome')?.setValue((requestWithOwners.cuentaBancariaRequest as any)?.validatorAnnualIncome || '');
            
            const validatorsArray = serviceDataForm.get('validators') as FormArray;
            if (validatorsArray) {
              while (validatorsArray.length > 0) {
                validatorsArray.removeAt(0);
              }
              
              const validatorGroup = this.fb.group({
                firstName: [validator.firstName || ''],
                lastName: [validator.lastName || ''],
                dateOfBirth: [validator.dateOfBirth ? new Date(validator.dateOfBirth).toISOString().split('T')[0] : ''],
                nationality: [validator.nationality || ''],
                citizenship: [validator.citizenship || ''],
                passportNumber: [validator.passportNumber || ''],
                validatorPassportUrl: [validator.scannedPassportUrl || ''],
                workEmail: [validator.workEmail || ''],
                phone: [validator.phone || ''],
                canReceiveSMS: [validator.canReceiveSMS || false],
                isUSResident: [validator.isUSResident ? 'yes' : 'no'],
                useEmailForRelayLogin: [validator.useEmailForRelayLogin || false],
                title: [(requestWithOwners.cuentaBancariaRequest as any)?.validatorTitle || ''],
                incomeSource: [(requestWithOwners.cuentaBancariaRequest as any)?.validatorIncomeSource || ''],
                annualIncome: [(requestWithOwners.cuentaBancariaRequest as any)?.validatorAnnualIncome || ''],
              });
              validatorsArray.push(validatorGroup);
            }
          }
        }
      }

      // Cargar notas si existen
      if (request.notes) {
        this.requestForm.patchValue({ notes: request.notes });
      }

      this.isLoading = false;
    } catch (error: any) {
      console.error('Error al cargar request en borrador:', error);
      this.errorMessage = 'Error al cargar la solicitud. Por favor, intente nuevamente.';
      this.isLoading = false;
      // Redirigir a my-requests si hay error
      setTimeout(() => {
        this.router.navigate(['/panel/my-requests']);
      }, 2000);
    }
  }

  /**
   * Carga los datos del cliente seleccionado por UUID
   */
  async loadClientDataByUuid(uuid: string): Promise<void> {
    this.isLoadingClient = true;
    try {
      // Obtener el cliente por UUID
      const client = await firstValueFrom(
        this.partnerClientsService.getClientByUuid(uuid)
      );
      
      if (client) {
        this.selectedClient = client;
        this.selectedClientId = client.id;
        this.precargarDatosCliente(client);
      } else {
        console.error('Cliente no encontrado');
        this.errorMessage = 'Cliente no encontrado';
      }
    } catch (error: any) {
      console.error('Error al cargar datos del cliente:', error);
      if (error.status === 404) {
        this.errorMessage = 'Cliente no encontrado o UUID inválido';
      } else {
        this.errorMessage = 'Error al cargar los datos del cliente';
      }
    } finally {
      this.isLoadingClient = false;
    }
  }


  /**
   * Carga los datos del cliente seleccionado por ID (método legacy, mantener por compatibilidad)
   */
  async loadClientData(clientId: number): Promise<void> {
    this.isLoadingClient = true;
    try {
      // Obtener el cliente por ID
      const client = await firstValueFrom(
        this.partnerClientsService.getClientById(clientId)
      );
      
      if (client) {
        this.selectedClient = client;
        this.selectedClientId = client.id;
        this.precargarDatosCliente(client);
      } else {
        console.error('Cliente no encontrado');
        this.errorMessage = 'Cliente no encontrado';
      }
    } catch (error: any) {
      console.error('Error al cargar datos del cliente:', error);
      if (error.status === 404) {
        this.errorMessage = 'Cliente no encontrado';
      } else {
        this.errorMessage = 'Error al cargar los datos del cliente';
      }
    } finally {
      this.isLoadingClient = false;
    }
  }

  /**
   * Guarda la request en borrador (crea o actualiza)
   * Se llama cuando se completa la primera sección y cada vez que se avanza de sección
   */
  async saveDraftRequest(): Promise<void> {
    // Solo guardar si hay cliente seleccionado o creado
    if (!this.selectedClientId) {
      console.log('[saveDraftRequest] No hay cliente seleccionado, omitiendo guardado');
      return;
    }

    const formValue = this.requestForm.value;
    const serviceType = formValue.serviceType;
    const serviceData = formValue.serviceData;

    if (!serviceType) {
      console.log('[saveDraftRequest] No hay servicio seleccionado, omitiendo guardado');
      return; // No hay servicio seleccionado aún
    }

    // Verificar autenticación antes de intentar guardar
    if (!this.authService.isAuthenticated()) {
      console.warn('[saveDraftRequest] ⚠️ Usuario no autenticado, no se puede guardar el borrador');
      return;
    }

    console.log('[saveDraftRequest] Iniciando guardado de borrador...', {
      selectedClientId: this.selectedClientId,
      serviceType,
      draftRequestId: this.draftRequestId,
      currentStep: this.currentStep,
      serviceSection: this.serviceSection
    });

    try {
      // Preparar datos para el backend (sin pago)
      const requestData: any = {
        type: serviceType,
        clientId: this.selectedClientId,
        status: 'pendiente', // Estado de borrador
        currentStep: this.currentStep, // Paso principal del wizard
        currentStepNumber: this.serviceSection, // Sección dentro de "Datos del Servicio"
        notes: formValue.notes || '',
      };

      // Agregar datos específicos del servicio
      if (serviceType === 'apertura-llc') {
        requestData.aperturaLlcData = {
          ...serviceData,
          members: this.membersFormArray?.value || []
        };
      } else if (serviceType === 'renovacion-llc') {
        // Log para debuggear el problema del phone
        const ownersValue = this.ownersFormArray.value || [];
        const ownersControls = this.ownersFormArray.controls || [];
        
        // Verificar valores directamente de los FormControls
        ownersControls.forEach((control: any, index: number) => {
          const phoneControl = control.get('phone');
          const phoneValueFromControl = phoneControl?.value;
          const phoneValueFromArray = ownersValue[index]?.phone;
          console.log(`[saveDraftRequest] Owner ${index + 1}:`, {
            phoneFromControl: phoneValueFromControl,
            phoneFromArray: phoneValueFromArray,
            controlValid: phoneControl?.valid,
            controlDirty: phoneControl?.dirty,
            controlTouched: phoneControl?.touched
          });
        });
        
        console.log('[saveDraftRequest] Owners completos antes de enviar:', JSON.stringify(ownersValue, null, 2));
        
        // Homologar: usar 'members' en lugar de 'owners' para ser consistente con apertura-llc
        requestData.renovacionLlcData = {
          ...serviceData,
          members: ownersValue // El backend procesa 'members' para renovación también
        };
      } else if (serviceType === 'cuenta-bancaria') {
        requestData.cuentaBancariaData = {
          ...serviceData,
          owners: this.ownersFormArray.value || [], // El backend ahora los procesa como Members
          validators: serviceData.validators || []
        };
      }

      // Si ya existe una request en borrador, actualizarla
      if (this.draftRequestId) {
        const updatedRequest = await this.requestsService.updateRequest(this.draftRequestId, requestData);
        console.log('Request en borrador actualizada:', this.draftRequestId);
        // Actualizar UUID si viene en la respuesta
        if (updatedRequest.uuid) {
          this.draftRequestUuid = updatedRequest.uuid;
        }
      } else {
        // Si no existe, crearla
        const createdRequest = await this.requestsService.createRequest(requestData);
        this.draftRequestId = createdRequest.id;
        this.draftRequestUuid = createdRequest.uuid || null;
        console.log('Request en borrador creada:', this.draftRequestId, 'UUID:', this.draftRequestUuid);
      }
    } catch (error: any) {
      console.error('Error al guardar request en borrador:', error);
      // No mostrar error al usuario para no interrumpir el flujo
    }
  }

  /**
   * Crea un cliente desde los datos del formulario (Paso 2)
   * Solo para partners - el cliente se asocia automáticamente al partner autenticado
   */
  async createClientFromForm(): Promise<void> {
    const firstName = this.requestForm.get('clientFirstName')?.value;
    const lastName = this.requestForm.get('clientLastName')?.value;
    const email = this.requestForm.get('clientEmail')?.value;
    const phone = this.requestForm.get('clientPhone')?.value;

    if (!firstName || !lastName || !email) {
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      
      const clientData = {
        full_name: fullName,
        email: email,
        phone: phone || undefined,
      };

      // Crear el cliente - el backend automáticamente lo asocia al partner autenticado
      const newClient = await firstValueFrom(
        this.partnerClientsService.createClient(clientData)
      );

      if (newClient) {
        // Guardar el cliente creado
        this.selectedClient = newClient;
        this.selectedClientId = newClient.id;
        
        // NO llamar a precargarDatosCliente porque cambia el paso automáticamente
        // Solo actualizar los campos del formulario sin cambiar el paso
        // Los datos ya están en el formulario, solo necesitamos el ID
        
        console.log('Cliente creado exitosamente:', newClient);
      }
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      if (error.error?.message) {
        this.errorMessage = error.error.message;
      } else if (error.status === 400) {
        this.errorMessage = 'Ya existe un cliente con este email';
      } else {
        this.errorMessage = 'Error al crear el cliente. Intenta nuevamente.';
      }
      throw error; // Re-lanzar para que nextStep() no continúe
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Precarga los datos del cliente en el formulario
   */
  precargarDatosCliente(client: any): void {
    // Separar nombre y apellido si es posible
    const nameParts = client.full_name ? client.full_name.split(' ') : [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Precargar datos del cliente
    this.requestForm.get('clientFirstName')?.setValue(firstName);
    this.requestForm.get('clientLastName')?.setValue(lastName);
    this.requestForm.get('clientEmail')?.setValue(client.email || '');
    this.requestForm.get('clientPhone')?.setValue(client.phone || '');

    // Si hay cliente seleccionado, ajustar el número total de pasos (saltar paso 2)
    this.totalSteps = 3; // Paso 1: Servicio, Paso 2: Datos del Servicio (antes paso 3), Paso 3: Pago (antes paso 4)

    // Si ya hay servicio seleccionado, ir directamente al paso 2 (datos del servicio)
    const serviceType = this.requestForm.get('serviceType')?.value;
    if (serviceType) {
      this.currentStep = 2; // Ahora el paso 2 es "Datos del Servicio"
      this.serviceSection = 1; // Resetear a la primera sección
      // Cargar aperturas si es renovación
      if (serviceType === 'renovacion-llc') {
        this.loadClientAperturas();
      }
    } else {
      // Si no hay servicio, ir al paso 1
      this.currentStep = 1;
    }
  }

  get serviceType() {
    return this.requestForm.get('serviceType');
  }

  get clientFirstName() {
    return this.requestForm.get('clientFirstName');
  }

  get clientLastName() {
    return this.requestForm.get('clientLastName');
  }

  get clientEmail() {
    return this.requestForm.get('clientEmail');
  }

  /**
   * Inicializa el formulario específico según el tipo de servicio
   */
  initializeServiceForm(serviceType: string): void {
    const serviceDataGroup = this.requestForm.get('serviceData') as FormGroup;
    
    // Limpiar controles existentes
    Object.keys(serviceDataGroup.controls).forEach(key => {
      serviceDataGroup.removeControl(key);
    });

    if (serviceType === 'apertura-llc') {
      this.initializeAperturaLlcForm(serviceDataGroup);
      // La lógica de sub-pasos y suscripción a llcType ahora está en AperturaLlcFormComponent
    } else if (serviceType === 'renovacion-llc') {
      // Si es renovación, inicializar el formulario
      // Las aperturas se cargarán cuando se avance al paso 3
      this.initializeRenovacionLlcForm(serviceDataGroup);
      // Inicializar un propietario automáticamente después de un breve delay
      setTimeout(() => {
        if (this.ownersFormArray && this.ownersFormArray.length === 0) {
          this.addOwner();
        }
      }, 200);
    } else if (serviceType === 'cuenta-bancaria') {
      this.initializeCuentaBancariaForm(serviceDataGroup);
      // Inicializar un propietario automáticamente después de un breve delay si se llega al paso 6
      setTimeout(() => {
        if (this.ownersFormArray && this.ownersFormArray.length === 0 && this.serviceSection === 6) {
          this.addOwner();
        }
      }, 200);
    }

    // Configurar listeners para recalcular el monto cuando cambie el estado
    setTimeout(() => {
      this.setupPaymentAmountListeners();
    }, 100);
  }


  /**
   * Configura los listeners para recalcular el monto automáticamente
   */
  setupPaymentAmountListeners(): void {
    const serviceData = this.requestForm.get('serviceData') as FormGroup;
    if (!serviceData) return;

    const serviceType = this.getSelectedServiceType();

    if (serviceType === 'apertura-llc') {
      // Escuchar cambios en el estado de constitución
      const stateControl = serviceData.get('incorporationState');
      if (stateControl) {
        stateControl.valueChanges.subscribe(() => {
          this.calculatePaymentAmount();
        });
      }
    } else if (serviceType === 'renovacion-llc') {
      // Escuchar cambios en el estado
      const stateControl = serviceData.get('state');
      if (stateControl) {
        stateControl.valueChanges.subscribe(() => {
          this.calculatePaymentAmount();
        });
      }
    } else if (serviceType === 'cuenta-bancaria') {
      // Para cuenta bancaria, escuchar cambios en el tipo de cuenta
      const accountTypeControl = serviceData.get('accountType');
      if (accountTypeControl) {
        accountTypeControl.valueChanges.subscribe(() => {
          this.calculatePaymentAmount();
        });
      }
    }
  }

  /**
   * Calcula el monto de pago según el tipo de servicio y estado
   */
  calculatePaymentAmount(): void {
    const serviceType = this.getSelectedServiceType();
    const serviceData = this.requestForm.get('serviceData') as FormGroup;
    
    if (!serviceData) {
      return;
    }

    let amount = 0;

    if (serviceType === 'apertura-llc') {
      const state = serviceData.get('incorporationState')?.value;
      if (state) {
        if (state === 'New Mexico') {
          amount = 649;
        } else if (state === 'Texas') {
          amount = 850;
        } else {
          amount = 750;
        }
      }
    } else if (serviceType === 'renovacion-llc') {
      const state = serviceData.get('state')?.value;
      if (state) {
        if (state === 'New Mexico') {
          amount = 649 + 100; // 749
        } else if (state === 'Texas') {
          amount = 850 + 100; // 950
        } else {
          amount = 750 + 100; // 850
        }
      }
    } else if (serviceType === 'cuenta-bancaria') {
      // Para cuenta bancaria, hay dos opciones: gratuita (0) o premium (99)
      // El campo accountType puede tener valores como 'gratuita', 'free', 'premium', '99', etc.
      const accountType = serviceData.get('accountType')?.value;
      if (accountType && (accountType === 'gratuita' || accountType === 'free' || accountType === '0')) {
        amount = 0;
      } else if (accountType && (accountType === 'premium' || accountType === '99' || accountType === 'paid')) {
        amount = 99;
      } else {
        // Por defecto, si no se especifica, mostrar 99 USD
        amount = 99;
      }
    }

    // Actualizar el campo de monto
    this.requestForm.get('paymentAmount')?.setValue(amount, { emitEvent: false });
  }

  /**
   * Determina si el monto debe calcularse automáticamente
   */
  shouldCalculateAmount(): boolean {
    const serviceType = this.getSelectedServiceType();
    const serviceData = this.requestForm.get('serviceData') as FormGroup;
    
    if (!serviceData) {
      return false;
    }

    if (serviceType === 'apertura-llc' || serviceType === 'renovacion-llc') {
      // Para apertura y renovación, calcular si hay un estado seleccionado
      const state = serviceData.get('incorporationState')?.value || serviceData.get('state')?.value;
      return !!state;
    } else if (serviceType === 'cuenta-bancaria') {
      // Para cuenta bancaria, siempre calcular (puede ser 0 o 99)
      return true;
    }

    return false;
  }

  /**
   * Inicializa formulario para Apertura LLC
   */
  initializeAperturaLlcForm(group: FormGroup): void {
    group.addControl('llcType', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('llcName', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('llcNameOption2', this.fb.control(''));
    group.addControl('llcNameOption3', this.fb.control(''));
    group.addControl('businessDescription', this.fb.control(''));
    group.addControl('llcPhoneNumber', this.fb.control(''));
    group.addControl('website', this.fb.control(''));
    group.addControl('llcEmail', this.fb.control('', Validators.email));
    group.addControl('linkedin', this.fb.control(''));
    group.addControl('incorporationState', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('incorporationDate', this.fb.control(''));
    group.addControl('hasEin', this.fb.control(false));
    group.addControl('einNumber', this.fb.control(''));
    group.addControl('einDocumentUrl', this.fb.control(''));
    group.addControl('noEinReason', this.fb.control(''));
    group.addControl('certificateOfFormationUrl', this.fb.control(''));
    group.addControl('accountType', this.fb.control(''));
    group.addControl('estadoConstitucion', this.fb.control(''));
    group.addControl('annualRevenue', this.fb.control(null));
    group.addControl('actividadFinancieraEsperada', this.fb.control(''));
    
    // Registered Agent
    group.addControl('registeredAgentAddress', this.fb.group({
      street: [''],
      building: [''],
      city: [''],
      state: [''],
      postalCode: [''],
      country: ['']
    }));
    group.addControl('registeredAgentName', this.fb.control(''));
    group.addControl('registeredAgentEmail', this.fb.control('', Validators.email));
    group.addControl('registeredAgentPhone', this.fb.control(''));
    group.addControl('registeredAgentType', this.fb.control(''));
    
    // Cuenta bancaria
    group.addControl('needsBankVerificationHelp', this.fb.control(false));
    group.addControl('bankAccountType', this.fb.control(''));
    group.addControl('bankName', this.fb.control(''));
    group.addControl('bankAccountNumber', this.fb.control(''));
    group.addControl('bankRoutingNumber', this.fb.control(''));
    group.addControl('bankStatementUrl', this.fb.control(''));
    
    // Campos adicionales para apertura bancaria (Paso 3 del formulario real)
    group.addControl('serviceBillUrl', this.fb.control('')); // Factura de Servicio (Prueba de Dirección)
    group.addControl('periodicIncome10k', this.fb.control('')); // ¿Tendrá ingresos periódicos que suman USD 10,000 o más?
    group.addControl('bankAccountLinkedEmail', this.fb.control('', Validators.email)); // Correo vinculado a cuenta bancaria
    group.addControl('bankAccountLinkedPhone', this.fb.control('')); // Teléfono vinculado a cuenta bancaria
    group.addControl('projectOrCompanyUrl', this.fb.control('')); // URL del Proyecto o Empresa
    
    // Declaraciones y Firmas (Paso 4 del formulario real)
    group.addControl('veracityConfirmation', this.fb.control('')); // Confirmación de Veracidad y Firma Electrónica
    
    // Dirección personal del propietario
    group.addControl('ownerNationality', this.fb.control(''));
    group.addControl('ownerCountryOfResidence', this.fb.control(''));
    group.addControl('ownerPersonalAddress', this.fb.group({
      street: [''],
      building: [''],
      city: [''],
      state: [''],
      postalCode: [''],
      country: ['']
    }));
    group.addControl('ownerPhoneNumber', this.fb.control(''));
    group.addControl('ownerEmail', this.fb.control('', Validators.email));
    
    // Preguntas booleanas
    group.addControl('almacenaProductosDepositoUSA', this.fb.control(false));
    group.addControl('declaroImpuestosAntes', this.fb.control(false));
    group.addControl('llcConStartCompanies', this.fb.control(false));
    group.addControl('ingresosMayor250k', this.fb.control(false));
    group.addControl('activosEnUSA', this.fb.control(false));
    group.addControl('ingresosPeriodicos10k', this.fb.control(false));
    group.addControl('contrataServiciosUSA', this.fb.control(false));
    group.addControl('propiedadEnUSA', this.fb.control(false));
    group.addControl('tieneCuentasBancarias', this.fb.control(false));
    
    // Miembros (FormArray)
    group.addControl('members', this.fb.array([]));
  }

  /**
   * Inicializa formulario para Renovación LLC
   */
  initializeRenovacionLlcForm(group: FormGroup): void {
    // Información básica de la LLC
    group.addControl('llcName', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('state', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('llcType', this.fb.control('')); // Estructura Societaria - Validators.required - COMENTADO PARA TESTING
    group.addControl('mainActivity', this.fb.control('')); // Actividad Principal de la LLC
    
    // Preguntas sobre la empresa
    group.addControl('hasPropertyInUSA', this.fb.control('')); // ¿Tu empresa posee o renta alguna propiedad inmobiliaria en Estados Unidos?
    group.addControl('almacenaProductosDepositoUSA', this.fb.control('')); // ¿Tu empresa almacena productos físicos en un depósito en Estados Unidos?
    group.addControl('contrataServiciosUSA', this.fb.control('')); // ¿Tu empresa contrata servicios de personas o empresas de Estados Unidos regularmente?
    group.addControl('tieneCuentasBancarias', this.fb.control('')); // ¿Tu LLC tiene cuentas bancarias a su nombre?
    
    // EIN y otros datos
    group.addControl('einNumber', this.fb.control('')); // Número de EIN en formato XX-XXXXXXX
    group.addControl('countriesWhereLLCDoesBusiness', this.fb.control([])); // Países donde la LLC realiza negocios (array de strings)
    group.addControl('llcCreationDate', this.fb.control('')); // Fecha de creación de la LLC
    
    // Tipo de declaración (checkboxes)
    group.addControl('declaracionInicial', this.fb.control(false));
    group.addControl('declaracionAnoCorriente', this.fb.control(false));
    group.addControl('cambioDireccionRA', this.fb.control(false));
    group.addControl('cambioNombre', this.fb.control(false));
    group.addControl('declaracionAnosAnteriores', this.fb.control(false));
    group.addControl('agregarCambiarSocio', this.fb.control(false));
    group.addControl('declaracionCierre', this.fb.control(false));
    
    // Campos adicionales del nuevo formulario (mantener para compatibilidad)
    group.addControl('societyType', this.fb.control(''));
    group.addControl('registrationNumber', this.fb.control(''));
    group.addControl('hasDataOrDirectorsChanges', this.fb.control(false));
    group.addControl('physicalAddress', this.fb.control(''));
    group.addControl('correspondenceAddress', this.fb.control(''));
    group.addControl('country', this.fb.control(''));
    group.addControl('city', this.fb.control(''));
    group.addControl('postalCode', this.fb.control(''));
    group.addControl('mainActivityDescription', this.fb.control(''));
    group.addControl('contactPhone', this.fb.control(''));
    group.addControl('contactEmail', this.fb.control('', Validators.email));
    group.addControl('hasEin', this.fb.control(false));
    
    // Persona responsable
    group.addControl('responsiblePerson', this.fb.group({
      name: [''],
      lastName: [''],
      country: [''],
      address: [''],
      email: ['', Validators.email],
      phone: ['']
    }));
    
    // Registered Agent
    group.addControl('wantsRegisteredAgent', this.fb.control(false));
    group.addControl('registeredAgentInfo', this.fb.group({
      name: [''],
      address: [''],
      country: [''],
      city: [''],
      postalCode: [''],
      phone: [''],
      email: ['', Validators.email]
    }));
    
    // Documentos
    group.addControl('identityDocumentUrl', this.fb.control(''));
    group.addControl('proofOfAddressUrl', this.fb.control(''));
    group.addControl('llcContractOrOperatingAgreementUrl', this.fb.control(''));
    group.addControl('articlesOfIncorporationUrl', this.fb.control(''));
    
    // Domicilio registrado
    group.addControl('registeredAddress', this.fb.control(''));
    group.addControl('registeredCountry', this.fb.control(''));
    group.addControl('registeredState', this.fb.control(''));
    group.addControl('registeredCity', this.fb.control(''));
    group.addControl('registeredPostalCode', this.fb.control(''));
    
    // Documentación anexa
    group.addControl('capitalContributionsUrl', this.fb.control(''));
    group.addControl('stateRegistrationUrl', this.fb.control(''));
    group.addControl('certificateOfGoodStandingUrl', this.fb.control(''));
    
    // Tipo de LLC
    group.addControl('llcType', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    
    // Paso 2: Información de Propietarios (single o multimember)
    const ownersArray = this.fb.array([]);
    group.addControl('owners', ownersArray); // Array de propietarios
    // Inicializar con un propietario si es single member (se manejará en el componente)
    
    // Paso 3: Información Contable de la LLC
    group.addControl('llcOpeningCost', this.fb.control('')); // ¿Cuánto costó abrir la LLC en Estados Unidos?
    group.addControl('paidToFamilyMembers', this.fb.control('')); // ¿Cuánto pagó la LLC a familiares del dueño por trabajos o servicios?
    group.addControl('paidToLocalCompanies', this.fb.control('')); // ¿Cuánto pagó la LLC a empresas locales del dueño por bienes o servicios?
    group.addControl('paidForLLCFormation', this.fb.control('')); // ¿Cuánto se pagó por la formación de la LLC (Incorporation/State fees)?
    group.addControl('paidForLLCDissolution', this.fb.control('')); // ¿Cuánto se pagó por la disolución de la LLC (si aplica)?
    group.addControl('bankAccountBalanceEndOfYear', this.fb.control('')); // Saldo al fin de año de las cuentas bancarias de la LLC
    
    // Paso 4: Movimientos Financieros de la LLC
    group.addControl('totalRevenue', this.fb.control('')); // Facturación total de la LLC
    
    // Paso 5: Información Adicional de la LLC
    group.addControl('hasFinancialInvestmentsInUSA', this.fb.control('')); // ¿Posee la LLC inversiones financieras o activos dentro de Estados Unidos?
    group.addControl('hasFiledTaxesBefore', this.fb.control('')); // ¿La LLC declaró impuestos anteriormente?
    group.addControl('wasConstitutedWithStartCompanies', this.fb.control('')); // ¿La LLC se constituyó con Start Companies?
    
    // Documentos adicionales (solo si se responde "No" a Start Companies)
    group.addControl('partnersPassportsFileUrl', this.fb.control('')); // Pasaportes de los socios
    group.addControl('operatingAgreementAdditionalFileUrl', this.fb.control('')); // Operating Agreement (adicional)
    group.addControl('form147Or575FileUrl', this.fb.control('')); // Formulario 147 o 575 (requerido)
    group.addControl('articlesOfOrganizationAdditionalFileUrl', this.fb.control('')); // Artículos de Organización / Certificados de Organización (requerido)
    group.addControl('boiReportFileUrl', this.fb.control('')); // Reporte BOI
    
    // Información bancaria (siempre visible)
    group.addControl('bankStatementsFileUrl', this.fb.control('')); // Archivo PDF con estados de cuenta de diciembre de 2025
    
    // Miembros (mantener para compatibilidad)
    group.addControl('members', this.fb.array([]));
    
    // Confirmación
    group.addControl('dataIsCorrect', this.fb.control(false));
    group.addControl('observations', this.fb.control(''));
  }

  /**
   * Inicializa formulario para Cuenta Bancaria
   */
  initializeCuentaBancariaForm(group: FormGroup): void {
    // Paso 1: Información de la LLC
    group.addControl('businessType', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('legalBusinessName', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('industry', this.fb.control('')); // Industria / Rubro
    group.addControl('numberOfEmployees', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('briefDescription', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('websiteOrSocialMedia', this.fb.control(''));
    group.addControl('einLetterUrl', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('einNumber', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('articlesOrCertificateUrl', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    
    // Paso 2: Dirección del Registered Agent
    group.addControl('registeredAgentStreet', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('registeredAgentUnit', this.fb.control(''));
    group.addControl('registeredAgentCity', this.fb.control(''));
    group.addControl('registeredAgentState', this.fb.control(''));
    group.addControl('registeredAgentZipCode', this.fb.control(''));
    group.addControl('registeredAgentCountry', this.fb.control('United States'));
    group.addControl('incorporationState', this.fb.control(''));
    group.addControl('incorporationMonthYear', this.fb.control(''));
    group.addControl('countriesWhereBusiness', this.fb.control([])); // Array para multiselect
    
    // Paso 3: Información de la persona que verificará la cuenta bancaria
    group.addControl('validatorMemberId', this.fb.control('')); // ID del miembro seleccionado
    group.addControl('validatorTitle', this.fb.control(''));
    group.addControl('validatorIncomeSource', this.fb.control(''));
    group.addControl('validatorAnnualIncome', this.fb.control(''));
    group.addControl('validatorFirstName', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('validatorLastName', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('validatorDateOfBirth', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('validatorNationality', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('validatorCitizenship', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('validatorPassportNumber', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('validatorPassportUrl', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('validatorWorkEmail', this.fb.control(''));
    group.addControl('validatorPhone', this.fb.control(''));
    group.addControl('canReceiveSMS', this.fb.control(false));
    group.addControl('isUSResident', this.fb.control(''));
    
    // Campos legacy (mantener para compatibilidad)
    group.addControl('validatorFullName', this.fb.control(''));
    group.addControl('validatorEmail', this.fb.control(''));
    
    // Paso 4: Dirección personal del propietario
    group.addControl('ownerPersonalStreet', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('ownerPersonalUnit', this.fb.control(''));
    group.addControl('ownerPersonalCity', this.fb.control(''));
    group.addControl('ownerPersonalState', this.fb.control(''));
    group.addControl('ownerPersonalCountry', this.fb.control(''));
    group.addControl('ownerPersonalPostalCode', this.fb.control(''));
    group.addControl('serviceBillUrl', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    
    // Paso 5: Tipo de LLC
    group.addControl('isMultiMember', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    group.addControl('llcType', this.fb.control('')); // Validators.required - COMENTADO PARA TESTING
    
    // Paso 6: Propietarios (FormArray)
    group.addControl('owners', this.fb.array([]));
    
    // Campos legacy (mantener para compatibilidad si es necesario)
    group.addControl('accountType', this.fb.control(''));
    group.addControl('applicantEmail', this.fb.control(''));
    group.addControl('applicantFirstName', this.fb.control(''));
    group.addControl('applicantPaternalLastName', this.fb.control(''));
    group.addControl('applicantMaternalLastName', this.fb.control(''));
    group.addControl('applicantPhone', this.fb.control(''));
    group.addControl('legalBusinessIdentifier', this.fb.control(''));
    group.addControl('industry', this.fb.control(''));
    group.addControl('economicActivity', this.fb.control(''));
    group.addControl('ein', this.fb.control(''));
    group.addControl('certificateOfConstitutionOrArticlesUrl', this.fb.control(''));
    group.addControl('operatingAgreementUrl', this.fb.control(''));
    group.addControl('companyAddress', this.fb.group({
      street: [''],
      unit: [''],
      city: [''],
      state: [''],
      postalCode: [''],
      country: ['']
    }));
    group.addControl('isRegisteredAgentInUSA', this.fb.control(false));
    group.addControl('registeredAgentName', this.fb.control(''));
    group.addControl('registeredAgentAddress', this.fb.control(''));
    group.addControl('bankName', this.fb.control(''));
    group.addControl('swiftBicAba', this.fb.control(''));
    group.addControl('accountNumber', this.fb.control(''));
    group.addControl('bankAccountType', this.fb.control(''));
    group.addControl('firstRegistrationDate', this.fb.control(''));
    group.addControl('hasLitigatedCurrentFiscalYear', this.fb.control(false));
    group.addControl('litigationDetails', this.fb.control(''));
    group.addControl('isSameAddressAsBusiness', this.fb.control(false));
    group.addControl('ownerPersonalAddress', this.fb.group({
      street: [''],
      unit: [''],
      city: [''],
      state: [''],
      postalCode: [''],
      country: ['']
    }));
    group.addControl('proofOfAddressUrl', this.fb.control(''));
    group.addControl('validators', this.fb.array([]));
    group.addControl('documentCertification', this.fb.control(''));
    group.addControl('acceptsTermsAndConditions', this.fb.control(false));
  }

  /**
   * Obtiene el FormArray de miembros
   */
  get membersFormArray(): FormArray | null {
    const membersArray = this.requestForm.get('serviceData.members') as FormArray;
    return membersArray || null;
  }

  /**
   * Obtiene el FormArray de propietarios (para Renovación LLC)
   */
  get ownersFormArray(): FormArray {
    const ownersArray = this.requestForm.get('serviceData.owners') as FormArray;
    // Si no existe, retornar un FormArray vacío para evitar errores
    return ownersArray || this.fb.array([]);
  }

  /**
   * Agrega un nuevo miembro al formulario
   */
  addMember(): void {
    // Asegurar que el FormArray existe
    const serviceData = this.requestForm.get('serviceData') as FormGroup;
    if (!serviceData) {
      console.error('serviceData FormGroup no existe');
      return;
    }
    
    let membersArray = this.membersFormArray;
    if (!membersArray) {
      // Si no existe, crearlo
      membersArray = this.fb.array([]);
      serviceData.addControl('members', membersArray);
    }
    
    const memberGroup = this.fb.group({
      firstName: [''], // Validators.required - COMENTADO PARA TESTING
      lastName: [''], // Validators.required - COMENTADO PARA TESTING
      passportNumber: [''], // Validators.required - COMENTADO PARA TESTING
      nationality: [''], // Validators.required - COMENTADO PARA TESTING
      dateOfBirth: [''], // Validators.required - COMENTADO PARA TESTING
      email: ['', Validators.email], // Validators.required - COMENTADO PARA TESTING
      phoneNumber: [''], // Validators.required - COMENTADO PARA TESTING
      memberAddress: this.fb.group({
        street: [''], // Validators.required - COMENTADO PARA TESTING
        unit: [''],
        city: [''], // Validators.required - COMENTADO PARA TESTING
        stateRegion: [''], // Validators.required - COMENTADO PARA TESTING
        postalCode: [''], // Validators.required - COMENTADO PARA TESTING
        country: [''], // Validators.required - COMENTADO PARA TESTING
      }),
      percentageOfParticipation: [0, [Validators.min(0), Validators.max(100)]], // Validators.required - COMENTADO PARA TESTING
      validatesBankAccount: [false],
      scannedPassportUrl: [''],
      additionalBankDocsUrl: ['']
    });
    
    membersArray.push(memberGroup);
  }

  /**
   * Elimina un miembro del formulario
   */
  removeMember(index: number): void {
    const membersArray = this.membersFormArray;
    if (membersArray && membersArray.length > index) {
      membersArray.removeAt(index);
    }
  }

  /**
   * Agrega un nuevo propietario al formulario (para Renovación LLC)
   */
  addOwner(): void {
    // Verificar que el FormArray existe
    if (!this.ownersFormArray) {
      console.error('ownersFormArray no está inicializado');
      return;
    }
    
    const serviceType = this.getSelectedServiceType();
    let ownerGroup: FormGroup;
    
    if (serviceType === 'cuenta-bancaria') {
      // Estructura para cuenta bancaria
      ownerGroup = this.fb.group({
        firstName: [''], // Validators.required - COMENTADO PARA TESTING
        lastName: [''], // Validators.required - COMENTADO PARA TESTING
        dateOfBirth: [''],
        nationality: [''], // Validators.required - COMENTADO PARA TESTING
        passportNumber: [''], // Validators.required - COMENTADO PARA TESTING
        ssnItin: [''],
        cuit: [''],
        participationPercentage: [''], // Validators.required - COMENTADO PARA TESTING
        passportFileUrl: [''], // Validators.required - COMENTADO PARA TESTING
      });
    } else {
      // Estructura para renovación LLC
      ownerGroup = this.fb.group({
        name: [''], // Validators.required - COMENTADO PARA TESTING
        lastName: [''], // Validators.required - COMENTADO PARA TESTING
        dateOfBirth: [''],
        email: ['', Validators.email], // Validators.required - COMENTADO PARA TESTING
        phone: [''], // Validators.required - COMENTADO PARA TESTING
        fullAddress: [''], // Validators.required - COMENTADO PARA TESTING
        unit: [''], // Validators.required - COMENTADO PARA TESTING
        city: [''], // Validators.required - COMENTADO PARA TESTING
        stateRegion: [''], // Validators.required - COMENTADO PARA TESTING
        postalCode: [''], // Validators.required - COMENTADO PARA TESTING
        country: [''],
        nationality: [''], // Validators.required - COMENTADO PARA TESTING
        passportNumber: [''], // Validators.required - COMENTADO PARA TESTING
        ssnItin: [''],
        cuit: [''],
        capitalContributions: [0],
        loansToLLC: [0],
        loansRepaid: [0],
        capitalWithdrawals: [0],
        hasInvestmentsInUSA: [''],
        isUSCitizen: [''],
        taxCountry: [[]],
        wasInUSA31Days: [''],
        participationPercentage: [0, [Validators.min(0), Validators.max(100)]] // Validators.required - COMENTADO PARA TESTING
      });
    }
    this.ownersFormArray.push(ownerGroup);
  }

  /**
   * Elimina un propietario del formulario (para Renovación LLC)
   */
  removeOwner(index: number): void {
    this.ownersFormArray.removeAt(index);
  }

  /**
   * Maneja el cambio de tipo de LLC
   * Si es 'single', inicializa automáticamente 1 miembro
   */
  handleLlcTypeChange(llcType: string): void {
    const membersArray = this.membersFormArray;
    
    if (!membersArray) {
      // Si no existe el FormArray, no hacer nada (se creará cuando se necesite)
      return;
    }
    
    if (llcType === 'single') {
      // Si es single y no hay miembros, crear uno automáticamente
      if (membersArray.length === 0) {
        this.addMember();
      } else if (membersArray.length > 1) {
        // Si hay más de 1 miembro, eliminar los extras y dejar solo el primero
        while (membersArray.length > 1) {
          membersArray.removeAt(membersArray.length - 1);
        }
      }
    }
    // Si es 'multi', no hacer nada especial, el usuario puede agregar miembros manualmente
  }

  // Métodos de navegación de sub-pasos movidos a AperturaLlcFormComponent
  // nextAperturaLlcSubStep, previousAperturaLlcSubStep, canAdvanceAperturaLlcSubStep
  // isSingleMember, isMultiMember ahora están en AperturaLlcFormComponent

  async nextStep(): Promise<void> {
    // Si estamos en el paso "Datos del Servicio"
    if (this.isServiceDataStep()) {
      // Validar la sección actual antes de avanzar
      if (!this.validateCurrentServiceSection()) {
        return;
      }

      // Si no es la última sección, avanzar a la siguiente sección
      if (!this.isLastServiceSection()) {
        // Para cuenta bancaria, verificar si debemos saltar el paso 6
        if (this.getSelectedServiceType() === 'cuenta-bancaria' && this.serviceSection === 5) {
          const serviceData = this.requestForm.get('serviceData') as FormGroup;
          const isMultiMember = serviceData?.get('isMultiMember')?.value;
          
          // Si es "No" (no es Multi-Member), saltar el paso 6 y pasar al siguiente paso del wizard
          if (isMultiMember === 'no') {
            if (this.validateStep3()) {
              // IMPORTANTE: Guardar ANTES de resetear serviceSection para que los datos
              // se guarden con el currentStepNumber correcto (5 en este caso)
              await this.saveDraftRequest();
              
              // Avanzar al paso de pago (actualizar currentStep)
              if (this.selectedClientId) {
                this.currentStep = 3;
              } else {
                this.currentStep = 4;
              }
              // Resetear la sección DESPUÉS de guardar
              this.serviceSection = 1;
              
              // Calcular el monto antes de mostrar el paso de pago
              this.calculatePaymentAmount();
            }
            return;
          }
        }
        
        // Limpiar estado temporal de archivos al cambiar de sección
        this.clearFileUploadStates();
        
        // Avanzar a la siguiente sección
        this.serviceSection++;
        
        // Guardar request en borrador DESPUÉS de actualizar serviceSection
        // Esto asegura que currentStepNumber refleje la sección actual
        // Si es la primera sección que se completa (pasando de 1 a 2), crear la request
        // Si es cualquier otra sección, actualizar la request existente
        await this.saveDraftRequest();
        
        // Si avanzamos al paso 2 de renovación y no hay propietarios, inicializar uno
        if (this.getSelectedServiceType() === 'renovacion-llc' && this.serviceSection === 2) {
          setTimeout(() => {
            if (this.ownersFormArray && this.ownersFormArray.length === 0) {
              this.addOwner();
            }
          }, 100);
        }
        // Si avanzamos al paso 6 de cuenta bancaria y no hay propietarios, inicializar uno
        if (this.getSelectedServiceType() === 'cuenta-bancaria' && this.serviceSection === 6) {
          setTimeout(() => {
            if (this.ownersFormArray && this.ownersFormArray.length === 0) {
              this.addOwner();
            }
          }, 100);
        }
        return;
      }

      // Si es la última sección, validar todo el paso y avanzar al siguiente paso del wizard
      if (this.validateStep3()) {
        // IMPORTANTE: Guardar ANTES de resetear serviceSection para que los owners/members
        // se guarden con el currentStepNumber correcto (6 para cuenta-bancaria, etc.)
        // Guardar con el currentStepNumber actual (la última sección completada)
        await this.saveDraftRequest();
        
        // Limpiar estado temporal de archivos al cambiar de paso
        this.clearFileUploadStates();
        // Limpiar mensajes de éxito al cambiar de paso principal
        this.successMessage = null;
        
        // Avanzar al paso de pago (actualizar currentStep)
        if (this.selectedClientId) {
          this.currentStep = 3;
        } else {
          this.currentStep = 4;
        }
        // Resetear la sección DESPUÉS de guardar
        this.serviceSection = 1;
        
        // Calcular el monto antes de mostrar el paso de pago
        this.calculatePaymentAmount();
        // El componente de Stripe se inicializa automáticamente
      }
      return;
    }

    // Si hay cliente seleccionado, el flujo es diferente (saltamos el paso 2 de información del cliente)
    if (this.selectedClientId) {
      if (this.currentStep === 1 && this.serviceType?.valid) {
        // Paso 1 -> Paso 2 (Datos del Servicio)
        this.currentStep = 2;
        this.serviceSection = 1; // Iniciar en la primera sección
        // Si es renovación, cargar aperturas del cliente e inicializar propietario
        if (this.getSelectedServiceType() === 'renovacion-llc') {
          // Inicializar un propietario si el array está vacío
          setTimeout(() => {
            if (this.ownersFormArray.length === 0) {
              this.addOwner();
            }
          }, 100);
          await this.loadClientAperturas();
        }
      }
    } else {
      // Flujo normal sin cliente seleccionado
      if (this.currentStep === 1 && this.serviceType?.valid) {
        this.currentStep = 2;
      } else if (this.currentStep === 2 && this.validateStep2()) {
        // Si no hay cliente seleccionado, crear el cliente
        if (!this.selectedClientId) {
          try {
            // Crear el cliente cuando se completa el paso 2
            await this.createClientFromForm();
            
            // Después de crear el cliente, cargar aperturas si es renovación
            if (this.getSelectedServiceType() === 'renovacion-llc') {
              await this.loadClientAperturas();
            }
            // NO avanzar automáticamente - el usuario debe hacer clic en "Siguiente" nuevamente
            // para ver la sección de "Seleccionar Apertura Existente" si es renovación
            return; // Salir aquí para que el usuario pueda ver el paso 2 con el cliente creado
          } catch (error) {
            // Si hay error al crear el cliente, no avanzar al siguiente paso
            console.error('No se pudo crear el cliente, no se avanza al siguiente paso');
            return;
          }
        }
        
        // Si ya hay cliente seleccionado (fue creado en el clic anterior), avanzar al paso 3
        if (this.selectedClientId) {
          // Si es renovación, cargar aperturas del cliente antes de avanzar (por si no se cargaron antes)
          if (this.getSelectedServiceType() === 'renovacion-llc') {
            await this.loadClientAperturas();
          }
          this.currentStep = 3;
          this.serviceSection = 1; // Iniciar en la primera sección
        }
      }
    }
  }

  /**
   * Valida la sección actual del servicio
   */
  validateCurrentServiceSection(): boolean {
    const serviceType = this.getSelectedServiceType();
    
    if (serviceType === 'apertura-llc') {
      switch (this.serviceSection) {
        case 1: // Información de la LLC
          // Validaciones comentadas temporalmente - COMENTADO PARA TESTING
          // return this.serviceDataForm?.get('llcName')?.valid && 
          //        this.serviceDataForm?.get('incorporationState')?.valid &&
          //        this.serviceDataForm?.get('llcType')?.valid || false;
          return true; // Por ahora siempre válido
        case 2: // Propietario/Socios
          // Validar que si es multimember, haya al menos 2 miembros
          const llcType = this.serviceDataForm?.get('llcType')?.value;
          if (llcType === 'multi') {
            const membersCount = this.membersFormArray?.length || 0;
            return membersCount >= 2;
          }
          // Para single member, debe haber al menos 1 miembro
          if (llcType === 'single') {
            const membersCount = this.membersFormArray?.length || 0;
            return membersCount >= 1;
          }
          // Si no hay llcType seleccionado, permitir avanzar (se validará en otra sección)
          return true;
        case 3: // Apertura Bancaria
          return true; // Por ahora siempre válido
        default:
          return false;
      }
    }
    
    if (serviceType === 'renovacion-llc') {
      switch (this.serviceSection) {
        case 1: // Información General de la LLC
          // Validaciones comentadas temporalmente - COMENTADO PARA TESTING
          return true;
        case 2: // Persona Responsable y Registered Agent
          return true;
        case 3: // Documentos
          return true;
        case 4: // Domicilio Registrado
          return true;
        case 5: // Socios/Miembros y Confirmación
          return true;
        default:
          return false;
      }
    }
    
    if (serviceType === 'cuenta-bancaria') {
      switch (this.serviceSection) {
        case 1: // Información de la LLC
          return true; // Por ahora siempre válido
        case 2: // Dirección del Registered Agent
          return true; // Por ahora siempre válido
        case 3: // Información de la persona que verificará la cuenta bancaria
          return true; // Por ahora siempre válido
        case 4: // Dirección personal del propietario
          return true; // Por ahora siempre válido
        case 5: // Tipo de LLC
          // Validar que isMultiMember esté seleccionado
          const isMultiMember = this.serviceDataForm?.get('isMultiMember')?.value;
          return isMultiMember === 'yes' || isMultiMember === 'no';
        case 6: // Información de los propietarios (solo si es Multi-Member)
          // Validar que si es multimember, haya al menos 2 propietarios
          const llcType = this.serviceDataForm?.get('isMultiMember')?.value;
          if (llcType === 'yes') {
            const ownersCount = this.ownersFormArray?.length || 0;
            return ownersCount >= 2;
          }
          // Si no es multimember, no debería estar en esta sección, pero permitir avanzar
          return true;
        default:
          return false;
      }
    }
    
    // Para otros servicios, usar la validación general
    return this.validateStep3();
  }

  /**
   * Obtiene el número total de secciones para el servicio actual
   */
  getTotalServiceSections(): number {
    const serviceType = this.getSelectedServiceType();
    switch (serviceType) {
      case 'apertura-llc':
        return 3; // 1. Información LLC, 2. Propietario/Socios, 3. Apertura Bancaria // 1. Información LLC, 2. Propietario/Socios, 3. Apertura Bancaria, 4. Declaraciones
      case 'renovacion-llc':
        return 5; // 1. Información General, 2. Persona Responsable y Registered Agent, 3. Documentos, 4. Domicilio Registrado, 5. Socios/Miembros y Confirmación
      case 'cuenta-bancaria':
        // Si es Multi-Member, mostrar paso 6 (propietarios), si no, solo 5 pasos
        const serviceData = this.requestForm.get('serviceData') as FormGroup;
        if (serviceData) {
          const isMultiMember = serviceData.get('isMultiMember')?.value;
          return isMultiMember === 'yes' ? 6 : 5;
        }
        return 6; // Por defecto 6 pasos
      default:
        return 1;
    }
  }

  /**
   * Verifica si estamos en el paso "Datos del Servicio"
   */
  isServiceDataStep(): boolean {
    if (this.selectedClientId) {
      return this.currentStep === 2;
    } else {
      return this.currentStep === 3;
    }
  }

  /**
   * Verifica si estamos en la última sección del servicio actual
   */
  isLastServiceSection(): boolean {
    return this.serviceSection === this.getTotalServiceSections();
  }

  async previousStep(): Promise<void> {
    // Si estamos en el paso "Datos del Servicio" y no es la primera sección, retroceder a la sección anterior
    if (this.isServiceDataStep() && this.serviceSection > 1) {
      // Limpiar estado temporal de archivos al cambiar de sección
      this.clearFileUploadStates();
      
      // Retroceder a la sección anterior
      this.serviceSection--;
      
      // Para cuenta bancaria, si retrocedemos y no es Multi-Member, asegurar que no estemos en el paso 6
      if (this.getSelectedServiceType() === 'cuenta-bancaria' && this.serviceSection === 6) {
        const serviceData = this.requestForm.get('serviceData') as FormGroup;
        const isMultiMember = serviceData?.get('isMultiMember')?.value;
        if (isMultiMember === 'no') {
          this.serviceSection = 5;
        }
      }
      
      // Guardar request en borrador DESPUÉS de actualizar serviceSection
      // Esto asegura que currentStepNumber refleje la sección actual
      await this.saveDraftRequest();
      
      return;
    }

    // Si estamos en el paso "Datos del Servicio" y es la primera sección, retroceder al paso anterior
    if (this.isServiceDataStep() && this.serviceSection === 1) {
      // Limpiar mensajes de éxito al cambiar de paso principal
      this.successMessage = null;
      this.currentStep--;
      // Resetear la sección cuando salimos del paso de datos del servicio
      this.serviceSection = 1;
      return;
    }

    // Retroceder al paso anterior del wizard principal
    if (this.currentStep > 1) {
      // Limpiar mensajes de éxito al cambiar de paso principal
      this.successMessage = null;
      this.currentStep--;
      // Si entramos al paso "Datos del Servicio", resetear a la primera sección
      if (this.isServiceDataStep()) {
        this.serviceSection = 1;
      }
    }
  }

  validateStep2(): boolean {
    // Validaciones comentadas para testing rápido
    return true; // !!(this.clientFirstName?.valid && 
              // this.clientLastName?.valid && 
              // this.clientEmail?.valid);
  }

  validateStep3(): boolean {
    // Validaciones comentadas para testing rápido
    return true;
    
    // const serviceType = this.getSelectedServiceType();
    // const serviceData = this.requestForm.get('serviceData') as FormGroup;
    // 
    // if (!serviceData) return false;
    // 
    // // Validaciones básicas según el tipo de servicio
    // if (serviceType === 'apertura-llc') {
    //   return !!(serviceData.get('llcType')?.valid && 
    //          serviceData.get('llcName')?.valid &&
    //          serviceData.get('incorporationState')?.valid);
    // } else if (serviceType === 'renovacion-llc') {
    //   return !!(serviceData.get('llcName')?.valid &&
    //          serviceData.get('registrationNumber')?.valid &&
    //          serviceData.get('state')?.valid &&
    //          serviceData.get('llcType')?.valid);
    // } else if (serviceType === 'cuenta-bancaria') {
    //   return !!(serviceData.get('applicantEmail')?.valid &&
    //          serviceData.get('applicantFirstName')?.valid &&
    //          serviceData.get('applicantPaternalLastName')?.valid &&
    //          serviceData.get('legalBusinessIdentifier')?.valid &&
    //          serviceData.get('llcType')?.valid &&
    //          serviceData.get('acceptsTermsAndConditions')?.valid);
    // }
    // 
    // return false;
  }

  validateStep4(): boolean {
    // Para cuenta bancaria gratuita, el monto puede ser 0
    const paymentMethod = this.requestForm.get('paymentMethod')?.value;
    const paymentAmount = this.requestForm.get('paymentAmount')?.value;
    const paymentProofUrl = this.requestForm.get('paymentProofUrl')?.value;
    const serviceType = this.getSelectedServiceType();
    
    console.log('[validateStep4] Validando paso 4:', {
      paymentMethod,
      paymentAmount,
      serviceType,
      stripePaymentProcessed: this.stripePaymentProcessed,
      stripePaymentToken: this.stripePaymentToken ? 'presente' : 'ausente',
      paymentProofUrl: paymentProofUrl ? 'presente' : 'ausente',
    });
    
    // Si es cuenta bancaria gratuita (monto 0), no requiere método de pago
    if (serviceType === 'cuenta-bancaria' && paymentAmount === 0) {
      console.log('[validateStep4] Cuenta bancaria gratuita, retornando true');
      return true;
    }
    
    // Si no hay monto o el monto es 0, no requiere pago
    if (!paymentAmount || paymentAmount === 0) {
      console.log('[validateStep4] Sin monto a pagar, retornando true');
      return true;
    }
    
    // Si hay monto a pagar, debe haber método de pago
    if (!paymentMethod) {
      console.log('[validateStep4] Hay monto pero no hay método de pago, retornando false');
      return false;
    }
    
    // Si el método de pago es Stripe y hay un monto, verificar que el pago haya sido procesado
    if (paymentMethod === 'stripe' && paymentAmount > 0) {
      const isValid = this.stripePaymentProcessed && !!this.stripePaymentToken;
      console.log('[validateStep4] Stripe con monto > 0, validación:', isValid);
      return isValid;
    }
    
    // Si el método de pago es transferencia y hay un monto, verificar que haya comprobante
    if (paymentMethod === 'transferencia' && paymentAmount > 0) {
      const isValid = !!paymentProofUrl && paymentProofUrl.trim().length > 0;
      console.log('[validateStep4] Transferencia con monto > 0, validación:', isValid);
      return isValid;
    }
    
    console.log('[validateStep4] Retornando false por defecto (caso no cubierto)');
    return false;
  }

  /**
   * Método auxiliar para logging cuando se hace clic en "Crear Solicitud"
   * También previene el submit por defecto y llama a onSubmit manualmente
   */
  onCreateRequestClick(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('[onCreateRequestClick] Botón clickeado');
    console.log('[onCreateRequestClick] Estado:', {
      isLoading: this.isLoading,
      stripeProcessing: this.stripeProcessing,
      validateStep4: this.validateStep4(),
      formValid: this.requestForm.valid,
      stripePaymentProcessed: this.stripePaymentProcessed,
      stripePaymentToken: this.stripePaymentToken ? 'presente' : 'ausente',
      paymentMethod: this.requestForm.get('paymentMethod')?.value,
      paymentAmount: this.requestForm.get('paymentAmount')?.value,
      currentStep: this.currentStep,
      selectedClientId: this.selectedClientId,
    });
    
    // Llamar a onSubmit manualmente
    this.onSubmit();
  }

  async onSubmit(): Promise<void> {
    console.log('[onSubmit] Iniciando envío de solicitud');
    console.log('[onSubmit] Estado del formulario:', {
      valid: this.requestForm.valid,
      currentStep: this.currentStep,
      selectedClientId: this.selectedClientId,
      paymentMethod: this.requestForm.get('paymentMethod')?.value,
      paymentAmount: this.requestForm.get('paymentAmount')?.value,
      stripePaymentProcessed: this.stripePaymentProcessed,
      stripePaymentToken: this.stripePaymentToken ? 'presente' : 'ausente',
      validateStep4: this.validateStep4(),
    });
    
    // Determinar qué paso validar según si hay cliente seleccionado
    const isLastStep = this.selectedClientId 
      ? (this.currentStep === 3 && this.validateStep4()) 
      : (this.currentStep === 4 && this.validateStep4());
    
    console.log('[onSubmit] isLastStep:', isLastStep);
    console.log('[onSubmit] requestForm.valid:', this.requestForm.valid);
    
    if (this.requestForm.valid && isLastStep) {
      console.log('[onSubmit] Condiciones cumplidas, procediendo a enviar...');
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;

      try {
        const formValue = this.requestForm.value;
        const serviceType = formValue.serviceType;
        const serviceData = formValue.serviceData;

        // Preparar datos para el backend
        const requestData: any = {
          type: serviceType,
          clientId: this.selectedClientId || 0, // Usar el cliente seleccionado si existe
          currentStepNumber: 1,
          notes: formValue.notes || '',
          // Datos del cliente (solo si no hay cliente seleccionado, se usarán para crear/obtener el cliente)
          clientData: this.selectedClientId ? undefined : {
            firstName: formValue.clientFirstName,
            lastName: formValue.clientLastName,
            email: formValue.clientEmail,
            phone: formValue.clientPhone || ''
          }
        };

        // Agregar datos específicos del servicio
        if (serviceType === 'apertura-llc') {
          requestData.aperturaLlcData = {
            ...serviceData,
            members: this.membersFormArray?.value || []
          };
        } else if (serviceType === 'renovacion-llc') {
          requestData.renovacionLlcData = {
            ...serviceData,
            members: this.membersFormArray?.value || []
          };
        } else if (serviceType === 'cuenta-bancaria') {
          requestData.cuentaBancariaData = {
            ...serviceData,
            owners: this.ownersFormArray.value || [],
            validators: serviceData.validators || []
          };
        }

        // Manejar datos de pago según el método
        // IMPORTANTE: Si es Stripe, el pago YA DEBE HABER SIDO PROCESADO con el botón "Procesar Pago"
        // Aquí solo verificamos y finalizamos el proceso
        if (formValue.paymentMethod === 'stripe') {
          const paymentAmount = formValue.paymentAmount;
          
          // Verificar que el pago ya fue procesado
          if (!this.stripePaymentProcessed) {
            this.isLoading = false;
            this.errorMessage = 'Por favor, primero procesa el pago con Stripe antes de crear la solicitud.';
            return;
          }
          
          // Si el pago ya fue procesado, solo indicar que se debe cambiar el status
          // NO volver a procesar el pago (ya se hizo en processStripePayment)
          console.log('[onSubmit] Pago Stripe ya procesado, solo finalizando solicitud');
          // No incluir stripeToken aquí porque ya se procesó y guardó en el backend
          // Solo indicar el método y monto para referencia
          requestData.paymentMethod = 'stripe';
          requestData.paymentAmount = paymentAmount;
        } else if (formValue.paymentMethod === 'transferencia') {
          // Para transferencia, guardar la URL del comprobante si existe
          requestData.paymentProofUrl = formValue.paymentProofUrl || '';
          requestData.paymentAmount = formValue.paymentAmount || 0;
          requestData.paymentMethod = 'transferencia';
        } else if (formValue.paymentMethod) {
          // Cualquier otro método de pago (incluyendo cuenta gratuita con monto 0)
          requestData.paymentMethod = formValue.paymentMethod;
          requestData.paymentAmount = formValue.paymentAmount || 0;
          if (formValue.paymentProofUrl) {
            requestData.paymentProofUrl = formValue.paymentProofUrl;
          }
        }

        // Cambiar el estado a 'solicitud-recibida' cuando se finaliza
        requestData.status = 'solicitud-recibida';

        // Log para debugging
        console.log('[onSubmit] Datos de pago a enviar:', {
          paymentMethod: requestData.paymentMethod,
          paymentAmount: requestData.paymentAmount,
          stripeToken: requestData.stripeToken ? 'presente' : 'ausente',
          paymentProofUrl: requestData.paymentProofUrl,
          status: requestData.status,
          draftRequestId: this.draftRequestId,
          requestDataKeys: Object.keys(requestData),
        });

        // Si ya existe una request en borrador, actualizarla; si no, crear una nueva
        let createdRequest;
        if (this.draftRequestId) {
          console.log(`[onSubmit] Actualizando request ${this.draftRequestId} con datos de pago`);
          console.log(`[onSubmit] URL: PATCH ${this.requestsService['apiUrl']}/${this.draftRequestId}`);
          try {
            createdRequest = await this.requestsService.updateRequest(this.draftRequestId, requestData);
            console.log('[onSubmit] Request actualizada exitosamente:', createdRequest);
            // Actualizar UUID si viene en la respuesta
            if (createdRequest.uuid) {
              this.draftRequestUuid = createdRequest.uuid;
            }
          } catch (error) {
            console.error('[onSubmit] Error al actualizar request:', error);
            throw error;
          }
        } else {
          console.log('[onSubmit] Creando nueva request con datos de pago');
          console.log(`[onSubmit] URL: POST ${this.requestsService['apiUrl']}`);
          try {
            createdRequest = await this.requestsService.createRequest(requestData);
            console.log('[onSubmit] Request creada exitosamente:', createdRequest);
            // Guardar ID y UUID de la request creada
            this.draftRequestId = createdRequest.id;
            this.draftRequestUuid = createdRequest.uuid || null;
          } catch (error) {
            console.error('[onSubmit] Error al crear request:', error);
            throw error;
          }
        }

        this.successMessage = 'Solicitud creada exitosamente';
        this.isLoading = false;

        // Redirigir a la lista de solicitudes después de un breve delay
        setTimeout(() => {
          this.router.navigate(['/panel/my-requests']);
        }, 1500);

      } catch (error: any) {
        console.error('Error al crear solicitud:', error);
        this.errorMessage = error?.error?.message || 'Error al crear la solicitud. Por favor, intenta nuevamente.';
        this.isLoading = false;
      }
    } else {
      this.requestForm.markAllAsTouched();
      const isPaymentStep = this.selectedClientId 
        ? (this.currentStep === 3)
        : (this.currentStep === 4);
      
      if (isPaymentStep) {
        this.errorMessage = 'Por favor, completa todos los campos requeridos del pago.';
      } else {
        this.errorMessage = 'Por favor, completa todos los campos requeridos.';
      }
      console.log('[onSubmit] Validación fallida:', {
        formValid: this.requestForm.valid,
        isLastStep: isLastStep,
        isPaymentStep: isPaymentStep,
        currentStep: this.currentStep,
        validateStep4: this.validateStep4(),
        errorMessage: this.errorMessage,
      });
    }
  }

  getServiceTypeLabel(value: string): string {
    const type = this.serviceTypes.find(t => t.value === value);
    return type ? type.label : value;
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return this.serviceType?.valid || false;
    }
    
    // Si hay cliente seleccionado, el paso 2 es "Datos del Servicio" (antes paso 3)
    // Si no hay cliente, el paso 2 es "Información del Cliente"
    if (this.selectedClientId) {
      if (step === 2) {
        return this.validateStep3(); // Paso 2 es datos del servicio
      }
      if (step === 3) {
        return this.validateStep4(); // Paso 3 es pago
      }
    } else {
      if (step === 2) {
        return this.validateStep2(); // Paso 2 es información del cliente
      }
      if (step === 3) {
        return this.validateStep3(); // Paso 3 es datos del servicio
      }
      if (step === 4) {
        return this.validateStep4(); // Paso 4 es pago
      }
    }
    return false;
  }

  getSelectedServiceType(): string {
    return this.serviceType?.value || '';
  }

  /**
   * Obtiene el FormGroup de serviceData
   */
  get serviceDataForm(): FormGroup {
    return this.requestForm.get('serviceData') as FormGroup;
  }

  /**
   * Maneja el cambio de sub-paso dentro del paso 3
   */
  nextSubStep(): void {
    const serviceType = this.getSelectedServiceType();
    if (serviceType) {
      this.currentSubStep[serviceType]++;
    }
  }

  previousSubStep(): void {
    const serviceType = this.getSelectedServiceType();
    if (serviceType && this.currentSubStep[serviceType] > 1) {
      this.currentSubStep[serviceType]--;
    }
  }

  getCurrentSubStep(): number {
    const serviceType = this.getSelectedServiceType();
    return serviceType ? this.currentSubStep[serviceType] : 1;
  }

  /**
   * Getters para FormGroups anidados (para usar en el template)
   */
  getRegisteredAgentAddressForm(index?: number): FormGroup | null {
    const form = this.serviceDataForm.get('registeredAgentAddress');
    return form instanceof FormGroup ? form : null;
  }

  getOwnerPersonalAddressForm(): FormGroup | null {
    const form = this.serviceDataForm.get('ownerPersonalAddress');
    return form instanceof FormGroup ? form : null;
  }

  getMemberAddressForm(member: any): FormGroup | null {
    const form = member?.get('memberAddress');
    return form instanceof FormGroup ? form : null;
  }

  getResponsiblePersonForm(): FormGroup | null {
    const form = this.serviceDataForm.get('responsiblePerson');
    return form instanceof FormGroup ? form : null;
  }

  getRegisteredAgentInfoForm(): FormGroup | null {
    const form = this.serviceDataForm.get('registeredAgentInfo');
    return form instanceof FormGroup ? form : null;
  }

  getCompanyAddressForm(): FormGroup | null {
    const form = this.serviceDataForm.get('companyAddress');
    return form instanceof FormGroup ? form : null;
  }

  /**
   * Maneja la selección de archivo para el comprobante de pago
   */
  onPaymentProofFileSelected(event: Event): void {
    this.onFileSelected(event, 'paymentProofUrl', 'paymentProof');
  }

  /**
   * Maneja la selección de archivo genérico
   */
  onFileSelected(event: Event, formControlPath: string, fileKey: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.initializeFileUploadState(fileKey);
      this.fileUploadStates[fileKey].file = file;
      this.uploadFile(file, formControlPath, fileKey);
    }
  }

  /**
   * Inicializa el estado de carga de un archivo
   */
  initializeFileUploadState(fileKey: string): void {
    if (!this.fileUploadStates[fileKey]) {
      this.fileUploadStates[fileKey] = {
        file: null,
        uploading: false,
        progress: 0
      };
    }
  }

  /**
   * Sube un archivo genérico
   * Si hay draftRequestUuid y servicio, usa la estructura request/{servicio}/{uuid}/
   * Si no hay request pero hay cliente y servicio, crea el request primero
   */
  async uploadFile(file: File, formControlPath: string, fileKey: string): Promise<void> {
    if (!file) {
      return;
    }

    this.initializeFileUploadState(fileKey);
    this.fileUploadStates[fileKey].uploading = true;
    this.fileUploadStates[fileKey].progress = 0;
    this.errorMessage = null;

    try {
      const serviceType = this.getSelectedServiceType();

      const formData = new FormData();
      formData.append('file', file);

      // Estrategia mejorada: subir a request/{servicio}/ temporalmente
      // Los archivos se moverán a request/{servicio}/{uuid}/ cuando se cree el request
      if (serviceType) {
        formData.append('servicio', serviceType);
        
        // Si ya hay UUID, subir directamente a la carpeta final
        if (this.draftRequestUuid) {
          formData.append('requestUuid', this.draftRequestUuid);
          console.log(`[uploadFile] Subiendo archivo con estructura final: request/${serviceType}/${this.draftRequestUuid}/`);
        } else {
          // Si no hay UUID, subir a request/{servicio}/ temporalmente
          // Los archivos se moverán cuando se cree el request
          console.log(`[uploadFile] Subiendo archivo con estructura temporal: request/${serviceType}/`);
        }
      } else {
        console.log(`[uploadFile] Subiendo archivo a la raíz del bucket (sin servicio)`);
      }

      // Usar firstValueFrom para convertir Observable a Promise
      const response = await firstValueFrom(
        this.http.post<{ url: string; key: string; message: string }>(
          `${environment.apiUrl}/upload-file`,
          formData
        )
      );

      // Si la respuesta es un objeto con url
      if (response && 'url' in response) {
        // Buscar el control en el formulario (puede estar en serviceData o en el root)
        const control = this.findFormControl(formControlPath);
        if (control) {
          // Establecer el valor y emitir evento para que Angular detecte el cambio
          control.setValue(response.url, { emitEvent: true });
          // Marcar el control como touched y dirty para que la validación se actualice
          control.markAsTouched();
          control.markAsDirty();
        }
        this.successMessage = 'Archivo subido exitosamente';
        this.fileUploadStates[fileKey].file = null;
        console.log(`[uploadFile] Archivo subido exitosamente: ${response.url}`);
        console.log(`[uploadFile] validateStep4 después de subir:`, this.validateStep4());
      }
    } catch (error: any) {
      console.error(`Error al subir archivo ${fileKey}:`, error);
      this.errorMessage = `Error al subir el archivo. Por favor, intenta nuevamente.`;
      this.fileUploadStates[fileKey].file = null;
    } finally {
      this.fileUploadStates[fileKey].uploading = false;
      this.fileUploadStates[fileKey].progress = 0;
    }
  }

  /**
   * Busca un control en el formulario por su ruta
   */
  findFormControl(path: string): FormControl | null {
    // Si el path contiene puntos, intentar acceder directamente
    if (path.includes('.')) {
      // Si el path es para owners (ej: 'owners.0.passportFileUrl'), buscar en serviceData
      if (path.startsWith('owners.')) {
        const fullPath = `serviceData.${path}`;
        const control = this.requestForm.get(fullPath) as FormControl;
        return control || null;
      }
      
      // Para otros paths con puntos, intentar primero directamente
      const control = this.requestForm.get(path) as FormControl;
      if (control) {
        return control;
      }
      
      // Si no se encuentra, intentar buscar en serviceData
      const serviceDataPath = `serviceData.${path}`;
      const serviceDataControl = this.requestForm.get(serviceDataPath) as FormControl;
      return serviceDataControl || null;
    }
    
    // Intentar buscar en el root del formulario
    let control = this.requestForm.get(path) as FormControl;
    
    // Si no se encuentra, intentar buscar en serviceData
    if (!control) {
      control = this.requestForm.get(`serviceData.${path}`) as FormControl;
    }
    
    return control || null;
  }

  /**
   * Obtiene el estado de carga de un archivo
   */
  getFileUploadState(fileKey: string): { file: File | null; uploading: boolean; progress: number } {
    this.initializeFileUploadState(fileKey);
    return this.fileUploadStates[fileKey];
  }

  /**
   * Limpia el archivo seleccionado
   */
  clearFile(fileKey: string, formControlPath: string, inputId: string): void {
    this.initializeFileUploadState(fileKey);
    this.fileUploadStates[fileKey].file = null;
    
    const control = this.findFormControl(formControlPath);
    if (control) {
      control.setValue('');
    }
    
    // Resetear el input file
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Limpia el estado temporal de todos los archivos (archivo seleccionado, progreso, etc.)
   * pero mantiene las URLs guardadas en el formulario
   */
  clearFileUploadStates(): void {
    // Limpiar solo el estado temporal (file, uploading, progress)
    // pero NO las URLs que están guardadas en el formulario
    Object.keys(this.fileUploadStates).forEach(key => {
      if (this.fileUploadStates[key]) {
        this.fileUploadStates[key].file = null;
        this.fileUploadStates[key].uploading = false;
        this.fileUploadStates[key].progress = 0;
      }
    });
    // Limpiar mensajes de éxito al cambiar de sección/paso
    this.successMessage = null;
  }

  /**
   * Sube el archivo del comprobante de pago (método legacy para compatibilidad)
   */
  async uploadPaymentProof(): Promise<void> {
    if (!this.selectedPaymentProofFile) {
      return;
    }
    await this.uploadFile(this.selectedPaymentProofFile, 'paymentProofUrl', 'paymentProof');
    this.selectedPaymentProofFile = null;
  }

  /**
   * Elimina el archivo seleccionado (método legacy para compatibilidad)
   */
  clearPaymentProofFile(): void {
    this.clearFile('paymentProof', 'paymentProofUrl', 'paymentProofFile');
  }

  /**
   * Helper para generar un ID único de archivo basado en el índice del miembro
   */
  getMemberFileId(memberIndex: number, fieldName: string): string {
    return `${fieldName}Member${memberIndex}`;
  }

  /**
   * Helper para manejar la selección de archivo de un miembro
   */
  onMemberFileSelected(event: Event, memberIndex: number, formControlPath: string, fileKey: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const uniqueKey = `${fileKey}_member_${memberIndex}`;
      this.initializeFileUploadState(uniqueKey);
      this.fileUploadStates[uniqueKey].file = file;
      // Para miembros, el path completo es serviceData.members[i].fieldName
      const fullPath = `serviceData.members.${memberIndex}.${formControlPath}`;
      this.uploadFile(file, fullPath, uniqueKey);
    }
  }

  /**
   * Helper para limpiar archivo de un miembro
   */
  clearMemberFile(memberIndex: number, formControlPath: string, fileKey: string, inputId: string): void {
    const uniqueKey = `${fileKey}_member_${memberIndex}`;
    const fullPath = `serviceData.members.${memberIndex}.${formControlPath}`;
    this.clearFile(uniqueKey, fullPath, inputId);
  }

  /**
   * Carga las aperturas del cliente para renovación
   * Busca el cliente por ID (si está seleccionado) o por email
   */
  async loadClientAperturas(): Promise<void> {
    // Priorizar selectedClientId si está disponible
    if (this.selectedClientId) {
      this.isLoadingAperturas = true;
      try {
        // Buscar aperturas usando el ID del cliente
        this.clientAperturas = await this.requestsService.getClientAperturas(this.selectedClientId, undefined);
        console.log('Aperturas cargadas para cliente ID:', this.selectedClientId, this.clientAperturas);
      } catch (error) {
        console.error('Error al cargar aperturas del cliente:', error);
        this.clientAperturas = [];
      } finally {
        this.isLoadingAperturas = false;
      }
      return;
    }

    // Fallback: buscar por email si no hay cliente seleccionado
    const clientEmail = this.requestForm.get('clientEmail')?.value;
    if (!clientEmail) {
      this.clientAperturas = [];
      return;
    }

    this.isLoadingAperturas = true;
    try {
      // Buscar aperturas usando el email del cliente
      this.clientAperturas = await this.requestsService.getClientAperturas(undefined, clientEmail);
      console.log('Aperturas cargadas para cliente email:', clientEmail, this.clientAperturas);
    } catch (error) {
      console.error('Error al cargar aperturas del cliente:', error);
      this.clientAperturas = [];
    } finally {
      this.isLoadingAperturas = false;
    }
  }

  /**
   * Maneja la selección de una apertura existente
   */
  onAperturaSelected(aperturaId: number | null): void {
    this.selectedAperturaId = aperturaId;
    this.useExistingApertura = aperturaId !== null;

    if (aperturaId) {
      const apertura = this.clientAperturas.find(a => a.id === aperturaId);
      if (apertura) {
        console.log('Apertura seleccionada:', apertura);
        // Los datos pueden venir en aperturaData o directamente en aperturaLlcRequest
        const aperturaData = apertura.aperturaData || apertura.aperturaLlcRequest || apertura;
        if (aperturaData) {
          this.precargarDatosRenovacion(aperturaData);
        }
      }
    } else {
      // Limpiar el formulario si no se selecciona apertura
      const serviceDataGroup = this.requestForm.get('serviceData') as FormGroup;
      if (serviceDataGroup) {
        this.initializeRenovacionLlcForm(serviceDataGroup);
      }
    }
  }

  /**
   * Precarga los datos de la apertura seleccionada en el formulario de renovación
   */
  precargarDatosRenovacion(aperturaData: any): void {
    const serviceData = this.requestForm.get('serviceData') as FormGroup;
    if (!serviceData) return;

    console.log('Precargando datos de apertura:', aperturaData);

    // Precargar datos básicos de la LLC
    if (aperturaData.llcName) {
      serviceData.get('llcName')?.setValue(aperturaData.llcName);
    }
    if (aperturaData.incorporationState) {
      serviceData.get('state')?.setValue(aperturaData.incorporationState);
    }
    if (aperturaData.llcType) {
      serviceData.get('llcType')?.setValue(aperturaData.llcType);
    }
    if (aperturaData.einNumber) {
      serviceData.get('einNumber')?.setValue(aperturaData.einNumber);
    }
    if (aperturaData.businessDescription) {
      serviceData.get('mainActivity')?.setValue(aperturaData.businessDescription);
    }
    if (aperturaData.website) {
      serviceData.get('website')?.setValue(aperturaData.website);
    }
    if (aperturaData.linkedin) {
      serviceData.get('linkedin')?.setValue(aperturaData.linkedin);
    }

    // Precargar miembros/propietarios si existen
    if (aperturaData.members && Array.isArray(aperturaData.members) && aperturaData.members.length > 0) {
      // Limpiar propietarios existentes
      const ownersArray = serviceData.get('owners') as FormArray;
      if (ownersArray) {
        while (ownersArray.length > 0) {
          ownersArray.removeAt(0);
        }

        // Agregar propietarios desde la apertura
        aperturaData.members.forEach((member: any, index: number) => {
          const ownerGroup = this.fb.group({
            name: [member.firstName || ''],
            lastName: [member.lastName || ''],
            dateOfBirth: [member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : ''],
            email: [member.email || ''],
            phone: [member.phoneNumber || ''],
            fullAddress: [member.memberAddress?.street || ''],
            unit: [member.memberAddress?.unit || ''],
            city: [member.memberAddress?.city || ''],
            stateRegion: [member.memberAddress?.stateRegion || ''],
            postalCode: [member.memberAddress?.postalCode || ''],
            country: [member.memberAddress?.country || ''],
            nationality: [member.nationality || ''],
            passportNumber: [member.passportNumber || ''],
            ssnItin: [member.ssnItin || ''],
            cuit: [member.cuit || ''],
            participationPercentage: [member.percentageOfParticipation || 0],
            capitalContributions: [0],
            loansToLLC: [0],
            loansRepaid: [0],
            capitalWithdrawals: [0],
            hasInvestmentsInUSA: [''],
            isUSCitizen: [''],
            taxCountry: [Array.isArray(member.taxFilingCountry) 
              ? member.taxFilingCountry 
              : (member.taxFilingCountry 
                  ? (typeof member.taxFilingCountry === 'string' && member.taxFilingCountry.includes(',')
                      ? member.taxFilingCountry.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
                      : [member.taxFilingCountry])
                  : [])],
            wasInUSA31Days2025: ['']
          });
          ownersArray.push(ownerGroup);
        });
      }
    }

    // Recalcular el monto de pago con el estado precargado
    setTimeout(() => {
      this.calculatePaymentAmount();
    }, 100);
  }

  /**
   * Helper para convertir string a número (para usar en templates)
   */
  parseIntHelper(value: string): number {
    return parseInt(value, 10);
  }

  /**
   * Obtiene el nombre de la LLC para mostrar en el select de aperturas
   */
  getAperturaDisplayName(apertura: any): string {
    return apertura.llcName || 
           apertura.aperturaLlcRequest?.llcName || 
           apertura.aperturaData?.llcName || 
           'Sin nombre';
  }

  /**
   * Obtiene el estado de incorporación para mostrar en el select de aperturas
   */
  getAperturaState(apertura: any): string {
    return apertura.incorporationState || 
           apertura.aperturaLlcRequest?.incorporationState || 
           apertura.aperturaData?.incorporationState || 
           'Sin estado';
  }

  /**
   * Obtiene el tipo de LLC para mostrar en el select de aperturas
   */
  getAperturaType(apertura: any): string {
    const llcType = apertura.llcType || 
                    apertura.aperturaLlcRequest?.llcType || 
                    apertura.aperturaData?.llcType;
    return llcType === 'single' ? 'Single Member' : 'Multi Member';
  }

  /**
   * Obtiene el mensaje de validación de miembros para apertura-llc
   */
  getAperturaLlcMembersValidationMessage(): string {
    if (this.getSelectedServiceType() !== 'apertura-llc' || this.serviceSection !== 2) {
      return '';
    }
    if (this.aperturaLlcFormComponent) {
      return this.aperturaLlcFormComponent.getMembersValidationMessage();
    }
    return '';
  }

  /**
   * Obtiene el mensaje de validación de propietarios para renovacion-llc
   */
  getRenovacionLlcOwnersValidationMessage(): string {
    if (this.getSelectedServiceType() !== 'renovacion-llc' || this.serviceSection !== 5) {
      return '';
    }
    if (this.renovacionLlcFormComponent) {
      return this.renovacionLlcFormComponent.getOwnersValidationMessage();
    }
    return '';
  }

  /**
   * Obtiene el mensaje de validación de propietarios para cuenta-bancaria
   */
  getCuentaBancariaOwnersValidationMessage(): string {
    if (this.getSelectedServiceType() !== 'cuenta-bancaria' || this.serviceSection !== 6) {
      return '';
    }
    if (this.cuentaBancariaFormComponent) {
      return this.cuentaBancariaFormComponent.getOwnersValidationMessage();
    }
    return '';
  }
}








