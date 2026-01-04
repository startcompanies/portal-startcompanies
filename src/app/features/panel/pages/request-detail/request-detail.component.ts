import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { DocumentsService } from '../../services/documents.service';
import { NotificationsService } from '../../services/notifications.service';
import { RequestsService, Request as ApiRequest } from '../../services/requests.service';

interface ProcessStep {
  id: number;
  name: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  date?: Date;
  completedBy?: string;
}

interface Document {
  id: number;
  name: string;
  type: 'certificate' | 'document' | 'form' | 'other';
  url: string;
  uploadedAt: Date;
  size?: number;
  description?: string;
}

interface RequestDisplay {
  id: number;
  type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  status: 'solicitud-recibida' | 'pendiente' | 'en-proceso' | 'completada' | 'rechazada';
  stage?: string; // Etapa actual del blueprint
  workDriveUrlExternal?: string; // URL externa de Zoho WorkDrive
  clientName?: string;
  createdAt: Date;
  updatedAt: Date;
  steps: ProcessStep[];
  documents: Document[];
}

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './request-detail.component.html',
  styleUrl: './request-detail.component.css'
})
export class RequestDetailComponent implements OnInit {
  requestId: string | null = null;
  request: RequestDisplay | null = null;
  fullRequestData: ApiRequest | null = null; // Datos completos de la API
  isLoading = true;
  currentUser: any = null;
  isPartner = false;
  isAdmin = false;
  loadError: string | null = null;
  
  // Modal para mostrar todos los datos
  showAllDataModal = false;
  
  // Gestión de procesos (solo admin)
  showEditStepModal = false;
  selectedStep: ProcessStep | null = null;
  availableAssignees: string[] = ['Equipo Legal', 'Equipo Contable', 'Equipo Administrativo', 'Sistema'];

  // Upload document
  showUploadModal = false;
  selectedFile: File | null = null;
  uploadDocumentType: string = 'document';
  uploadDescription: string = '';
  uploadProgress = 0;
  isUploading = false;
  uploadError: string | null = null;

  documentTypes = [
    { value: 'certificate', label: 'Certificado' },
    { value: 'document', label: 'Documento' },
    { value: 'form', label: 'Formulario' },
    { value: 'other', label: 'Otro' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private documentsService: DocumentsService,
    private notificationsService: NotificationsService,
    private requestsService: RequestsService,
    private sanitizer: DomSanitizer
  ) {
    // Inicializar en constructor después de la inyección
    this.currentUser = this.authService.getCurrentUser();
    this.isPartner = this.authService.isPartner();
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.requestId = this.route.snapshot.paramMap.get('id');
    if (this.requestId) {
      this.loadRequest();
    } else {
      this.router.navigate(['/panel/my-requests']);
    }
  }

  async loadRequest(): Promise<void> {
    this.isLoading = true;
    this.loadError = null;
    
    if (!this.requestId) {
      this.router.navigate(['/panel/my-requests']);
      return;
    }

    try {
      const requestId = parseInt(this.requestId);
      const apiRequest = await this.requestsService.getRequestById(requestId);
      
      this.fullRequestData = apiRequest;
      
      // Debug: Ver qué datos están llegando
      console.log('Datos completos de la solicitud:', apiRequest);
      console.log('Members:', apiRequest.members);
      console.log('Apertura LLC Request:', apiRequest.aperturaLlcRequest);
      
      // Transformar datos de la API al formato de display
      const clientName = apiRequest.client
        ? `${apiRequest.client.first_name || ''} ${apiRequest.client.last_name || ''}`.trim() || apiRequest.client.username || apiRequest.client.email
        : undefined;

      // Generar steps basados en el estado y tipo de solicitud
      const steps: ProcessStep[] = [];
      
      // SIEMPRE agregar "Solicitud Recibida" como primera etapa
      if (apiRequest.status === 'solicitud-recibida') {
        // Si está en "solicitud-recibida", esta es la etapa actual
        steps.push({
          id: 1,
          name: 'Solicitud Recibida',
          description: 'Tu solicitud ha sido recibida y está pendiente de aprobación',
          status: 'current',
          date: new Date(apiRequest.createdAt),
          completedBy: undefined
        });
      } else {
        // Si ya pasó de "solicitud-recibida", esta etapa está completada
        steps.push({
          id: 1,
          name: 'Solicitud Recibida',
          description: 'Tu solicitud ha sido recibida y aprobada',
          status: 'completed',
          date: new Date(apiRequest.createdAt),
          completedBy: 'Sistema'
        });
        
        // Si está en proceso y es apertura-llc, agregar las etapas del blueprint
        if (apiRequest.status === 'en-proceso' && apiRequest.type === 'apertura-llc') {
          const blueprintStages = this.getBlueprintStages();
          const specialStages = this.getSpecialBlueprintStages();
          // Si no tiene stage configurado, usar la primera etapa como default
          const currentStage = apiRequest.stage || blueprintStages[0];
          const currentStageIndex = blueprintStages.findIndex(s => s === currentStage);
          const isSpecialStage = specialStages.includes(currentStage);
          
          console.log('Blueprint stages:', blueprintStages);
          console.log('Current stage from API:', apiRequest.stage);
          console.log('Current stage index:', currentStageIndex);
          console.log('Is special stage:', isSpecialStage);
          
          // Agregar las etapas regulares del blueprint
          blueprintStages.forEach((stageName: string, index: number) => {
            let status: 'completed' | 'current' | 'pending' = 'pending';
            
            if (currentStageIndex >= 0) {
              // Todas las etapas anteriores a la actual están completadas
              if (index < currentStageIndex) {
                status = 'completed';
              } else if (index === currentStageIndex) {
                status = 'current';
              }
            } else if (!isSpecialStage) {
              // Si no se encuentra el stage y no es especial, marcar la primera como current
              if (index === 0) {
                status = 'current';
              }
            }
            
            steps.push({
              id: index + 2, // +2 porque la primera es "Solicitud Recibida"
              name: stageName,
              description: `Etapa del proceso: ${stageName}`,
              status,
              date: status === 'completed' || status === 'current' ? new Date() : undefined,
              completedBy: status === 'completed' || status === 'current' ? 'Sistema' : undefined
            });
          });
          
          // Lógica para etapas especiales:
          // 1. Si el stage actual es "Apertura Activa", mostrar "Apertura Cuenta Bancaria"
          // 2. Si el stage actual es "Apertura Perdida", mostrar solo "Apertura Perdida" (y ahí se queda)
          // 3. Si el stage actual es "Apertura Cuenta Bancaria", mostrarla como current
          
          if (currentStage === 'Apertura Activa') {
            // Mostrar "Apertura Activa" como completada y "Apertura Cuenta Bancaria" como current
            steps.push({
              id: steps.length + 1,
              name: 'Apertura Activa',
              description: 'Etapa del proceso: Apertura Activa',
              status: 'completed',
              date: new Date(),
              completedBy: 'Sistema'
            });
            steps.push({
              id: steps.length + 1,
              name: 'Apertura Cuenta Bancaria',
              description: 'Etapa del proceso: Apertura Cuenta Bancaria',
              status: 'current',
              date: new Date(),
              completedBy: 'Sistema'
            });
          } else if (currentStage === 'Apertura Perdida') {
            // Mostrar "Apertura Perdida" como current y ahí se queda (no mostrar más etapas)
            steps.push({
              id: steps.length + 1,
              name: 'Apertura Perdida',
              description: 'Etapa del proceso: Apertura Perdida',
              status: 'current',
              date: new Date(),
              completedBy: 'Sistema'
            });
          } else if (currentStage === 'Apertura Cuenta Bancaria') {
            // Si ya está en "Apertura Cuenta Bancaria", mostrar "Apertura Activa" como completada
            steps.push({
              id: steps.length + 1,
              name: 'Apertura Activa',
              description: 'Etapa del proceso: Apertura Activa',
              status: 'completed',
              date: new Date(),
              completedBy: 'Sistema'
            });
            steps.push({
              id: steps.length + 1,
              name: 'Apertura Cuenta Bancaria',
              description: 'Etapa del proceso: Apertura Cuenta Bancaria',
              status: 'current',
              date: new Date(),
              completedBy: 'Sistema'
            });
          }
        } else if (apiRequest.status === 'en-proceso' && apiRequest.type === 'cuenta-bancaria') {
          // Si está en proceso y es cuenta-bancaria, agregar las etapas del blueprint
          const blueprintStages = this.getCuentaBancariaBlueprintStages();
          const specialStages = this.getCuentaBancariaSpecialStages();
          // Si no tiene stage configurado, usar la primera etapa como default
          const currentStage = apiRequest.stage || blueprintStages[0];
          const currentStageIndex = blueprintStages.findIndex(s => s === currentStage);
          const isSpecialStage = specialStages.includes(currentStage);
          
          console.log('Cuenta Bancaria Blueprint stages:', blueprintStages);
          console.log('Current stage from API:', apiRequest.stage);
          console.log('Current stage index:', currentStageIndex);
          console.log('Is special stage:', isSpecialStage);
          
          // Agregar las etapas regulares del blueprint (hasta Onboarding)
          blueprintStages.forEach((stageName: string, index: number) => {
            let status: 'completed' | 'current' | 'pending' = 'pending';
            
            // Si el stage actual es una etapa especial (Finalizada o Perdida), todas las etapas regulares están completadas
            if (isSpecialStage) {
              status = 'completed';
            } else if (currentStageIndex >= 0) {
              // Todas las etapas anteriores a la actual están completadas
              if (index < currentStageIndex) {
                status = 'completed';
              } else if (index === currentStageIndex) {
                status = 'current';
              }
            } else if (!isSpecialStage) {
              // Si no se encuentra el stage y no es especial, marcar la primera como current
              if (index === 0) {
                status = 'current';
              }
            }
            
            steps.push({
              id: index + 2, // +2 porque la primera es "Solicitud Recibida"
              name: stageName,
              description: `Etapa del proceso: ${stageName}`,
              status,
              date: status === 'completed' || status === 'current' ? new Date() : undefined,
              completedBy: status === 'completed' || status === 'current' ? 'Sistema' : undefined
            });
          });
          
          // Lógica para etapas especiales:
          // 1. Si el stage actual es "Cuenta Bancaria Finalizada", mostrarla como completada
          // 2. Si el stage actual es "Cuenta Bancaria Perdida", mostrarla como current (y ahí se queda)
          
          if (currentStage === 'Cuenta Bancaria Finalizada') {
            // Todas las etapas anteriores ya están marcadas como completadas arriba
            // Mostrar "Cuenta Bancaria Finalizada" como completada (no current)
            steps.push({
              id: steps.length + 1,
              name: 'Cuenta Bancaria Finalizada',
              description: 'Etapa del proceso: Cuenta Bancaria Finalizada',
              status: 'completed',
              date: new Date(),
              completedBy: 'Sistema'
            });
          } else if (currentStage === 'Cuenta Bancaria Perdida') {
            // Todas las etapas anteriores ya están marcadas como completadas arriba
            // Mostrar "Cuenta Bancaria Perdida" como current (y ahí se queda)
            steps.push({
              id: steps.length + 1,
              name: 'Cuenta Bancaria Perdida',
              description: 'Etapa del proceso: Cuenta Bancaria Perdida',
              status: 'current',
              date: new Date(),
              completedBy: 'Sistema'
            });
          }
        } else {
          // Para otros tipos o estados, usar las definiciones genéricas
          // IMPORTANTE: Para cuenta-bancaria, usar las etapas del blueprint (ya pasó de solicitud-recibida)
          // Solo usar genéricas si es otro tipo
          if (apiRequest.type === 'cuenta-bancaria') {
            // Para cuenta-bancaria que no está en solicitud-recibida, usar las etapas del blueprint
            const blueprintStages = this.getCuentaBancariaBlueprintStages();
            const specialStages = this.getCuentaBancariaSpecialStages();
            const currentStage = apiRequest.stage || blueprintStages[0];
            const currentStageIndex = blueprintStages.findIndex(s => s === currentStage);
            const isSpecialStage = specialStages.includes(currentStage);
            
            // Agregar las etapas regulares del blueprint
            blueprintStages.forEach((stageName: string, index: number) => {
              let status: 'completed' | 'current' | 'pending' = 'pending';
              
              // Si el stage actual es una etapa especial (Finalizada o Perdida), todas las etapas regulares están completadas
              if (isSpecialStage) {
                status = 'completed';
              } else if (currentStageIndex >= 0) {
                if (index < currentStageIndex) {
                  status = 'completed';
                } else if (index === currentStageIndex) {
                  status = 'current';
                }
              } else if (!isSpecialStage && index === 0) {
                status = 'current';
              }
              
              steps.push({
                id: index + 2,
                name: stageName,
                description: `Etapa del proceso: ${stageName}`,
                status,
                date: status === 'completed' || status === 'current' ? new Date() : undefined,
                completedBy: status === 'completed' || status === 'current' ? 'Sistema' : undefined
              });
            });
            
            // Agregar etapa final si corresponde
            if (currentStage === 'Cuenta Bancaria Finalizada') {
              // Todas las etapas anteriores ya están marcadas como completadas arriba
              // Mostrar "Cuenta Bancaria Finalizada" como completada
              steps.push({
                id: steps.length + 1,
                name: 'Cuenta Bancaria Finalizada',
                description: 'Etapa del proceso: Cuenta Bancaria Finalizada',
                status: 'completed',
                date: new Date(),
                completedBy: 'Sistema'
              });
            } else if (currentStage === 'Cuenta Bancaria Perdida') {
              // Todas las etapas anteriores ya están marcadas como completadas arriba
              // Mostrar "Cuenta Bancaria Perdida" como current (y ahí se queda)
              steps.push({
                id: steps.length + 1,
                name: 'Cuenta Bancaria Perdida',
                description: 'Etapa del proceso: Cuenta Bancaria Perdida',
                status: 'current',
                date: new Date(),
                completedBy: 'Sistema'
              });
            }
          } else {
            // Para otros tipos o cuenta-bancaria en solicitud-recibida, usar las definiciones genéricas
            const stepDefinitions = this.getStepDefinitions(apiRequest.type);
            
            // Obtener el paso actual según el tipo de solicitud
            let currentStepNumber = 1;
            if (apiRequest.aperturaLlcRequest) {
              currentStepNumber = apiRequest.aperturaLlcRequest.currentStepNumber || 1;
            } else if (apiRequest.renovacionLlcRequest) {
              currentStepNumber = apiRequest.renovacionLlcRequest.currentStepNumber || 1;
            } else if (apiRequest.cuentaBancariaRequest) {
              currentStepNumber = apiRequest.cuentaBancariaRequest.currentStepNumber || 1;
            }
            
            // Agregar las etapas genéricas (saltando "Solicitud Recibida" que ya está agregada)
            stepDefinitions.forEach((stepDef: { name: string; description: string }, index: number) => {
              // Saltar "Solicitud Recibida" si está en las definiciones
              if (stepDef.name === 'Solicitud Recibida') {
                return;
              }
              
              const stepNumber = index + 1;
              let status: 'completed' | 'current' | 'pending' = 'pending';
              
              if (stepNumber < currentStepNumber) {
                status = 'completed';
              } else if (stepNumber === currentStepNumber) {
                status = 'current';
              }
              
              steps.push({
                id: steps.length + 1,
                name: stepDef.name,
                description: stepDef.description,
                status,
                date: status === 'completed' || status === 'current' ? new Date() : undefined,
                completedBy: status === 'completed' || status === 'current' ? 'Sistema' : undefined
              });
            });
          }
        }
      }

      this.request = {
        id: apiRequest.id,
        type: apiRequest.type,
        status: apiRequest.status,
        stage: apiRequest.stage,
        workDriveUrlExternal: apiRequest.workDriveUrlExternal,
        clientName,
        createdAt: new Date(apiRequest.createdAt),
        updatedAt: new Date(apiRequest.updatedAt),
        documents: [], // TODO: Cargar documentos desde el backend
        steps: steps
      };
      
      console.log('Datos completos de la solicitud:', apiRequest);
      console.log('Stage recibido:', apiRequest.stage);
      console.log('Steps generados:', steps);
    } catch (error: any) {
      console.error('Error al cargar solicitud:', error);
      this.loadError = error?.error?.message || 'Error al cargar la solicitud. Intenta nuevamente.';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Abre el modal para mostrar todos los datos de la solicitud
   */
  openAllDataModal(): void {
    this.showAllDataModal = true;
  }

  /**
   * Cierra el modal de todos los datos
   */
  closeAllDataModal(): void {
    this.showAllDataModal = false;
  }

  /**
   * Obtiene los datos completos en formato JSON para mostrar
   */
  getFullDataAsJson(): string {
    if (!this.fullRequestData) {
      return '{}';
    }
    return JSON.stringify(this.fullRequestData, null, 2);
  }

  /**
   * Copia el JSON completo al portapapeles
   */
  async copyToClipboard(): Promise<void> {
    if (!this.fullRequestData) {
      return;
    }

    try {
      const jsonString = this.getFullDataAsJson();
      await navigator.clipboard.writeText(jsonString);
      alert('JSON copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      // Fallback: crear un elemento temporal
      const textarea = document.createElement('textarea');
      textarea.value = this.getFullDataAsJson();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('JSON copiado al portapapeles');
    }
  }

  getRequestTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'apertura-llc': 'Apertura LLC',
      'renovacion-llc': 'Renovación LLC',
      'cuenta-bancaria': 'Cuenta Bancaria'
    };
    return types[type] || type;
  }

  getFullName(firstName?: string, lastName?: string, maternalLastName?: string): string {
    const parts = [firstName, lastName, maternalLastName].filter(part => part && part.trim());
    return parts.join(' ').trim();
  }

  getStatusLabel(status: string): string {
    const statuses: { [key: string]: string } = {
      'solicitud-recibida': 'Solicitud Recibida',
      'pendiente': 'Pendiente',
      'en-proceso': 'En Proceso',
      'completada': 'Completada',
      'rechazada': 'Rechazada'
    };
    return statuses[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'solicitud-recibida': 'badge bg-warning',
      'pendiente': 'badge bg-warning',
      'en-proceso': 'badge bg-info',
      'completada': 'badge bg-success',
      'rechazada': 'badge bg-danger'
    };
    return classes[status] || 'badge bg-secondary';
  }

  getStepIconClass(step: ProcessStep): string {
    if (step.status === 'completed') {
      return 'bi-check-circle-fill text-success';
    } else if (step.status === 'current') {
      return 'bi-clock-history text-primary';
    } else {
      return 'bi-circle text-muted';
    }
  }

  getDocumentTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'certificate': 'bi-award',
      'document': 'bi-file-earmark-text',
      'form': 'bi-file-earmark-fill',
      'other': 'bi-file'
    };
    return icons[type] || 'bi-file';
  }

  getDocumentTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'certificate': 'Certificado',
      'document': 'Documento',
      'form': 'Formulario',
      'other': 'Otro'
    };
    return labels[type] || 'Documento';
  }

  /**
   * Helper para JSON.stringify en el template
   */
  stringify(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  /**
   * Obtiene el contacto principal del Account
   */
  getContactoPrincipal(contactoPrincipal: any): any[] {
    if (!contactoPrincipal) return [];
    if (Array.isArray(contactoPrincipal)) return contactoPrincipal;
    return [contactoPrincipal];
  }

  /**
   * Obtiene los socios del Account
   */
  getSocios(socios: any): any[] {
    if (!socios) return [];
    if (Array.isArray(socios)) return socios;
    return [socios];
  }

  /**
   * Obtiene todos los campos del Account para mostrar
   */
  getAccountFields(account: any): Array<{ label: string; value: any; key: string }> {
    if (!account) return [];
    
    const fieldLabels: { [key: string]: string } = {
      'Account_Name': 'Nombre del Account',
      'Tipo': 'Tipo',
      'Estado_de_Registro': 'Estado de Registro',
      'Estructura_Societaria': 'Estructura Societaria',
      'Fecha_de_Constituci_n': 'Fecha de Constitución',
      'N_mero_de_EIN': 'Número de EIN',
      'Actividad_Principal_de_la_LLC': 'Actividad Principal',
      'P_gina_web_de_la_LLC': 'Página Web',
      'Correo_electr_nico': 'Correo Electrónico',
      'Phone': 'Teléfono',
      'Mobile': 'Móvil',
      'Empresa': 'Empresa',
      'Partner_Email': 'Email del Partner',
      'Partner_Phone': 'Teléfono del Partner',
      'Created_Time': 'Fecha de Creación',
      'Modified_Time': 'Última Modificación',
    };

    const fields: Array<{ label: string; value: any; key: string }> = [];
    const excludeKeys = ['Contacto_Principal_LLC', 'Socios_LLC', 'id']; // Estos se muestran por separado

    for (const key in account) {
      if (excludeKeys.includes(key)) continue;
      
      const value = account[key];
      // Solo mostrar campos que tengan valor y no sean objetos complejos (excepto arrays que manejamos por separado)
      if (value !== null && value !== undefined && value !== '') {
        fields.push({
          key,
          label: fieldLabels[key] || key.replace(/_/g, ' '),
          value
        });
      }
    }

    return fields;
  }

  /**
   * Verifica si es un objeto
   */
  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Verifica si es un array
   */
  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  /**
   * Verifica si hay contacto principal
   */
  hasContactoPrincipal(account: any): boolean {
    return account && account.Contacto_Principal_LLC && 
           (Array.isArray(account.Contacto_Principal_LLC) ? account.Contacto_Principal_LLC.length > 0 : true);
  }

  /**
   * Verifica si hay socios
   */
  hasSocios(account: any): boolean {
    return account && account.Socios_LLC && 
           (Array.isArray(account.Socios_LLC) ? account.Socios_LLC.length > 0 : true);
  }

  /**
   * Verifica si hay campos booleanos adicionales para mostrar
   */
  hasAdditionalBooleanFields(apertura: any): boolean {
    if (!apertura) return false;
    return apertura.almacenaProductosDepositoUSA !== null && apertura.almacenaProductosDepositoUSA !== undefined ||
           apertura.declaroImpuestosAntes !== null && apertura.declaroImpuestosAntes !== undefined ||
           apertura.llcConStartCompanies !== null && apertura.llcConStartCompanies !== undefined ||
           apertura.ingresosMayor250k !== null && apertura.ingresosMayor250k !== undefined ||
           apertura.activosEnUSA !== null && apertura.activosEnUSA !== undefined ||
           apertura.ingresosPeriodicos10k !== null && apertura.ingresosPeriodicos10k !== undefined ||
           apertura.contrataServiciosUSA !== null && apertura.contrataServiciosUSA !== undefined ||
           apertura.propiedadEnUSA !== null && apertura.propiedadEnUSA !== undefined ||
           apertura.tieneCuentasBancarias !== null && apertura.tieneCuentasBancarias !== undefined;
  }

  /**
   * Obtiene las etapas del blueprint para Apertura LLC
   * Nota: "Apertura Activa", "Apertura Perdida" y "Apertura Cuenta Bancaria" 
   * son etapas especiales que se muestran condicionalmente
   */
  getBlueprintStages(): string[] {
    return [
      'Apertura Confirmada',
      'Filing Iniciado',
      'EIN Solicitado',
      'Operating Agreement',
      'BOI Enviado',
      'Cuenta Bancaria Confirmada',
      'Confirmación pago',
      // Las siguientes 3 etapas son especiales y se muestran condicionalmente:
      // 'Apertura Activa',      - Solo se muestra si es el stage actual
      // 'Apertura Perdida',     - Solo se muestra si es el stage actual (y ahí se queda)
      // 'Apertura Cuenta Bancaria' - Solo se muestra si el stage actual es "Apertura Activa"
    ];
  }

  /**
   * Obtiene las etapas especiales del blueprint (Apertura Activa, Apertura Perdida, Apertura Cuenta Bancaria)
   */
  getSpecialBlueprintStages(): string[] {
    return [
      'Apertura Activa',
      'Apertura Perdida',
      'Apertura Cuenta Bancaria',
    ];
  }

  /**
   * Obtiene las etapas del blueprint para Cuenta Bancaria
   * Solo incluye hasta "Onboarding"
   */
  getCuentaBancariaBlueprintStages(): string[] {
    return [
      'Cuenta Bancaria Confirmada',
      'Onboarding',
      // Las siguientes 2 etapas son especiales y se muestran condicionalmente:
      // 'Cuenta Bancaria Finalizada' - Solo se muestra si es el stage actual
      // 'Cuenta Bancaria Perdida' - Solo se muestra si es el stage actual (y ahí se queda)
    ];
  }

  /**
   * Obtiene las etapas especiales del blueprint de Cuenta Bancaria
   */
  getCuentaBancariaSpecialStages(): string[] {
    return [
      'Cuenta Bancaria Finalizada',
      'Cuenta Bancaria Perdida',
    ];
  }

  getStepDefinitions(type: string, status?: string, stage?: string): Array<{ name: string; description: string }> {
    // Si está en proceso y tiene stage, usar las etapas del blueprint
    if (status === 'en-proceso' && type === 'apertura-llc' && stage) {
      const blueprintStages = this.getBlueprintStages();
      return blueprintStages.map(stageName => ({
        name: stageName,
        description: `Etapa: ${stageName}`
      }));
    }

    // Definiciones por defecto (para estados anteriores a la aprobación)
    const definitions: { [key: string]: Array<{ name: string; description: string }> } = {
      'apertura-llc': [
        { name: 'Solicitud Recibida', description: 'Tu solicitud de apertura de LLC ha sido recibida y está en revisión inicial' },
        { name: 'Revisión de Documentos', description: 'Revisión de la documentación proporcionada y validación de información' },
        { name: 'Procesamiento en Estado', description: 'Envío de documentación al estado para registro de la LLC' },
        { name: 'Obtención de EIN', description: 'Solicitud y obtención del EIN (Employer Identification Number) del IRS' },
        { name: 'Preparación de Documentos', description: 'Preparación de documentos finales: Operating Agreement y certificados' },
        { name: 'Completado', description: 'Proceso completado. Todos los documentos están listos para descarga' }
      ],
      'renovacion-llc': [
        { name: 'Solicitud Recibida', description: 'Tu solicitud de renovación de LLC ha sido recibida' },
        { name: 'Revisión de Documentos', description: 'Revisión de la documentación de renovación' },
        { name: 'Procesamiento en Estado', description: 'Envío de documentación al estado para renovación' },
        { name: 'Actualización de EIN', description: 'Verificación y actualización del EIN si es necesario' },
        { name: 'Preparación de Documentos', description: 'Preparación de documentos de renovación' },
        { name: 'Completado', description: 'Renovación completada exitosamente' }
      ],
      'cuenta-bancaria': [
        { name: 'Solicitud Recibida', description: 'Tu solicitud de cuenta bancaria ha sido recibida' },
        { name: 'Revisión de Documentos', description: 'Revisión de la documentación requerida para la cuenta bancaria' },
        { name: 'Verificación de Identidad', description: 'Proceso de verificación de identidad y documentos' },
        { name: 'Apertura de Cuenta', description: 'Proceso de apertura de la cuenta bancaria con la institución financiera' },
        { name: 'Verificación de Cuenta', description: 'Verificación y activación de la cuenta bancaria' },
        { name: 'Configuración Final', description: 'Configuración de servicios bancarios y acceso' },
        { name: 'Completado', description: 'Cuenta bancaria activa y lista para usar' }
      ]
    };
    
    return definitions[type] || [];
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  downloadDocument(document: Document): void {
    // TODO: Implementar descarga de documentos
    console.log('Descargar documento:', document);
    // En producción, esto haría una petición al backend para obtener el archivo
    if (document.url && document.url !== '#') {
      window.open(document.url, '_blank');
    }
  }

  // Upload document methods
  openUploadModal(): void {
    this.showUploadModal = true;
    this.selectedFile = null;
    this.uploadDocumentType = 'document';
    this.uploadDescription = '';
    this.uploadError = null;
    this.uploadProgress = 0;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.selectedFile = null;
    this.uploadDocumentType = 'document';
    this.uploadDescription = '';
    this.uploadError = null;
    this.uploadProgress = 0;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadError = null;
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile || !this.requestId) {
      this.uploadError = 'Por favor selecciona un archivo';
      return;
    }

    this.isUploading = true;
    this.uploadError = null;
    this.uploadProgress = 0;

    const requestIdNum = parseInt(this.requestId);

    this.documentsService.uploadDocument(
      this.selectedFile,
      requestIdNum,
      this.uploadDocumentType,
      this.uploadDescription
    ).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          // Documento subido exitosamente
          this.isUploading = false;
          this.uploadProgress = 100;
          
          // Agregar el documento a la lista
          if (this.request) {
            this.request.documents.push({
              id: Date.now(), // Temporal, el backend debería devolver el ID real
              name: this.selectedFile!.name,
              type: this.uploadDocumentType as any,
              url: event.body.url,
              uploadedAt: new Date(),
              size: this.selectedFile!.size,
              description: this.uploadDescription || undefined
            });
          }
          
          // Cerrar modal después de un breve delay
          setTimeout(() => {
            this.closeUploadModal();
          }, 1000);
        }
      },
      error: (error) => {
        this.isUploading = false;
        this.uploadError = error.error?.message || 'Error al subir el documento. Intenta nuevamente.';
        console.error('Upload error:', error);
      }
    });
  }

  deleteDocument(document: Document): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${document.name}"?`)) {
      return;
    }

    // TODO: Implementar eliminación de documentos
    this.documentsService.deleteDocument(document.id).subscribe({
      next: () => {
        if (this.request) {
          this.request.documents = this.request.documents.filter(d => d.id !== document.id);
        }
      },
      error: (error) => {
        console.error('Error al eliminar documento:', error);
        alert('Error al eliminar el documento');
      }
    });
  }

  // Gestión de procesos (solo admin)
  openEditStepModal(step: ProcessStep): void {
    this.selectedStep = { ...step };
    this.showEditStepModal = true;
  }

  closeEditStepModal(): void {
    this.showEditStepModal = false;
    this.selectedStep = null;
  }

  updateStepStatus(step: ProcessStep, newStatus: 'completed' | 'current' | 'pending'): void {
    if (!this.request) return;

    // Actualizar el estado del paso
    const stepIndex = this.request.steps.findIndex(s => s.id === step.id);
    if (stepIndex !== -1) {
      this.request.steps[stepIndex].status = newStatus;
      if (newStatus === 'completed') {
        this.request.steps[stepIndex].date = new Date();
        this.request.steps[stepIndex].completedBy = this.currentUser?.username || 'Administrador';
        
        // Crear notificación para el cliente/partner
        this.notificationsService.createNotification({
          type: 'success',
          title: 'Proceso Actualizado',
          message: `Tu solicitud #${this.request.id} ha avanzado: ${step.name} completado`,
          link: `/panel/my-requests/${this.request.id}`,
          requestId: this.request.id
        });
      }
      
      // Si se completa un paso, el siguiente pasa a ser "current"
      if (newStatus === 'completed' && stepIndex < this.request.steps.length - 1) {
        const nextStep = this.request.steps[stepIndex + 1];
        if (nextStep.status === 'pending') {
          nextStep.status = 'current';
          nextStep.date = new Date();
        }
      }
    }

    // TODO: Enviar actualización al backend
    console.log('Actualizar paso:', step, 'a estado:', newStatus);
  }

  assignStepResponsible(step: ProcessStep, responsible: string): void {
    if (!this.request) return;

    const stepIndex = this.request.steps.findIndex(s => s.id === step.id);
    if (stepIndex !== -1) {
      this.request.steps[stepIndex].completedBy = responsible;
    }

    // TODO: Enviar asignación al backend
    console.log('Asignar responsable:', responsible, 'al paso:', step.name);
  }

  /**
   * Aprobar solicitud (solo admin)
   */
  async approveRequest(): Promise<void> {
    if (!this.requestId || !this.request) return;

    try {
      // Determinar la etapa inicial según el tipo de solicitud
      let initialStage = 'Apertura Confirmada'; // Default para apertura-llc
      if (this.request.type === 'cuenta-bancaria') {
        initialStage = 'Cuenta Bancaria Confirmada';
      } else if (this.request.type === 'renovacion-llc') {
        initialStage = 'Renovación Confirmada';
      }
      
      await this.requestsService.approveRequest(parseInt(this.requestId), initialStage);
      
      // Recargar la solicitud
      await this.loadRequest();
      
      // Mostrar notificación de éxito
      alert('Solicitud aprobada correctamente');
    } catch (error: any) {
      console.error('Error al aprobar solicitud:', error);
      alert(error?.error?.message || 'Error al aprobar la solicitud');
    }
  }

  /**
   * Rechazar solicitud (solo admin)
   */
  async rejectRequest(): Promise<void> {
    if (!this.requestId || !this.request) return;

    const reason = prompt('Ingresa la razón del rechazo (opcional):');
    if (reason === null) return; // Usuario canceló

    try {
      await this.requestsService.rejectRequest(parseInt(this.requestId), reason || undefined);
      
      // Recargar la solicitud
      await this.loadRequest();
      
      // Mostrar notificación de éxito
      alert('Solicitud rechazada correctamente');
    } catch (error: any) {
      console.error('Error al rechazar solicitud:', error);
      alert(error?.error?.message || 'Error al rechazar la solicitud');
    }
  }

  /**
   * Verifica si la solicitud está en estado "Solicitud Recibida"
   */
  isSolicitudRecibida(): boolean {
    return this.request?.status === 'solicitud-recibida';
  }

  /**
   * Verifica si una etapa es parte del blueprint (para Apertura LLC o Cuenta Bancaria)
   */
  isBlueprintStage(stageName: string): boolean {
    if (this.request?.type === 'apertura-llc') {
      const blueprintStages = this.getBlueprintStages();
      const specialStages = this.getSpecialBlueprintStages();
      return blueprintStages.includes(stageName) || specialStages.includes(stageName);
    } else if (this.request?.type === 'cuenta-bancaria') {
      const blueprintStages = this.getCuentaBancariaBlueprintStages();
      const specialStages = this.getCuentaBancariaSpecialStages();
      return blueprintStages.includes(stageName) || specialStages.includes(stageName);
    }
    return false;
  }

  /**
   * Convierte el permalink de WorkDrive a URL de embed para iframe
   * El permalink puede venir como /file/ o /folder/, se convierte a /embed/
   */
  getSafeWorkDriveUrl(): SafeResourceUrl | null {
    if (!this.request?.workDriveUrlExternal) {
      return null;
    }
    
    const url = this.request.workDriveUrlExternal.trim();
    
    // Si ya es una URL de embed, usarla directamente
    if (url.includes('workdrive.zohoexternal.com/embed/')) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    
    // Si es un permalink (file/ o folder/), convertirlo a embed
    // El permalink guardado es: https://workdrive.zohoexternal.com/folder/{id} o /file/{id}
    const fileMatch = url.match(/workdrive\.zohoexternal\.com\/file\/([^/?\s]+)/i);
    const folderMatch = url.match(/workdrive\.zohoexternal\.com\/folder\/([^/?\s]+)/i);
    
    let resourceId: string | null = null;
    
    if (fileMatch && fileMatch[1]) {
      resourceId = fileMatch[1];
    } else if (folderMatch && folderMatch[1]) {
      resourceId = folderMatch[1];
    }
    
    if (resourceId && resourceId.length > 10) {
      // Convertir permalink a URL de embed
      const embedUrl = `https://workdrive.zohoexternal.com/embed/${resourceId}?toolbar=false&layout=grid&appearance=light&themecolor=green`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    
    // Si es una URL externa (external/), intentar extraer el ID
    const externalMatch = url.match(/workdrive\.zohoexternal\.com\/external\/([^/?\s]+)/i);
    if (externalMatch && externalMatch[1] && externalMatch[1].length > 10) {
      const embedId = externalMatch[1];
      const embedUrl = `https://workdrive.zohoexternal.com/embed/${embedId}?toolbar=false&layout=grid&appearance=light&themecolor=green`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    
    console.warn('Formato de URL de WorkDrive no reconocido:', url);
    return null;
  }

  // Helper para usar Math en el template
  Math = Math;
}








