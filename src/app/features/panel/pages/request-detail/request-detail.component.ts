import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
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
  status: 'pendiente' | 'en-proceso' | 'completada' | 'rechazada';
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
    private requestsService: RequestsService
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

      // Generar steps basados en el currentStepNumber de la solicitud
      // Ya no usamos stages de Zoho, usamos los pasos definidos localmente
      const steps: ProcessStep[] = [];
      
      // Obtener el paso actual según el tipo de solicitud
      let currentStepNumber = 1;
      if (apiRequest.aperturaLlcRequest) {
        currentStepNumber = apiRequest.aperturaLlcRequest.currentStepNumber || 1;
      } else if (apiRequest.renovacionLlcRequest) {
        currentStepNumber = apiRequest.renovacionLlcRequest.currentStepNumber || 1;
      } else if (apiRequest.cuentaBancariaRequest) {
        currentStepNumber = apiRequest.cuentaBancariaRequest.currentStepNumber || 1;
      }
      
      // Definir los pasos según el tipo de solicitud
      const stepDefinitions = this.getStepDefinitions(apiRequest.type);
      
      stepDefinitions.forEach((stepDef: { name: string; description: string }, index: number) => {
        const stepNumber = index + 1;
        let status: 'completed' | 'current' | 'pending' = 'pending';
        
        if (stepNumber < currentStepNumber) {
          status = 'completed';
        } else if (stepNumber === currentStepNumber) {
          status = 'current';
        }
        
        steps.push({
          id: stepNumber,
          name: stepDef.name,
          description: stepDef.description,
          status,
          date: status === 'completed' || status === 'current' ? new Date() : undefined,
          completedBy: status === 'completed' || status === 'current' ? 'Sistema' : undefined
        });
      });

      this.request = {
        id: apiRequest.id,
        type: apiRequest.type,
        status: apiRequest.status,
        clientName,
        createdAt: new Date(apiRequest.createdAt),
        updatedAt: new Date(apiRequest.updatedAt),
        documents: [], // TODO: Cargar documentos desde el backend
        steps: steps
      };
      
      console.log('Datos completos de la solicitud:', apiRequest);
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
      'pendiente': 'Pendiente',
      'en-proceso': 'En Proceso',
      'completada': 'Completada',
      'rechazada': 'Rechazada'
    };
    return statuses[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
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
   * Obtiene las definiciones de pasos según el tipo de solicitud
   */
  getStepDefinitions(type: string): Array<{ name: string; description: string }> {
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
}







