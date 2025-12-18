import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { DocumentsService } from '../../services/documents.service';
import { NotificationsService } from '../../services/notifications.service';

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

interface Request {
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
  request: Request | null = null;
  isLoading = true;
  currentUser: any = null;
  isPartner = false;
  isAdmin = false;
  
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
    private notificationsService: NotificationsService
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

  loadRequest(): void {
    this.isLoading = true;
    // TODO: Cargar solicitud desde el backend
    setTimeout(() => {
      const requestId = parseInt(this.requestId || '1');
      
      // Ejemplo realista de solicitud de Apertura LLC
      this.request = {
        id: requestId,
        type: 'apertura-llc',
        status: 'en-proceso',
        clientName: this.isPartner ? 'Juan Pérez' : undefined,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        documents: [
          {
            id: 1,
            name: 'Articles of Organization',
            type: 'certificate',
            url: '#',
            uploadedAt: new Date('2024-01-18'),
            size: 245678,
            description: 'Artículos de Organización de la LLC - Estado de Delaware'
          },
          {
            id: 2,
            name: 'EIN Confirmation Letter (CP 575)',
            type: 'document',
            url: '#',
            uploadedAt: new Date('2024-01-19'),
            size: 189234,
            description: 'Carta de confirmación del EIN emitida por el IRS'
          },
          {
            id: 3,
            name: 'Operating Agreement',
            type: 'document',
            url: '#',
            uploadedAt: new Date('2024-01-20'),
            size: 312456,
            description: 'Acuerdo Operativo de la LLC'
          }
        ],
        steps: [
          {
            id: 1,
            name: 'Solicitud Recibida',
            description: 'Tu solicitud de apertura de LLC ha sido recibida y está en revisión inicial',
            status: 'completed',
            date: new Date('2024-01-15T10:30:00'),
            completedBy: 'Sistema'
          },
          {
            id: 2,
            name: 'Revisión de Documentos',
            description: 'Revisión de la documentación proporcionada y validación de información',
            status: 'completed',
            date: new Date('2024-01-16T14:20:00'),
            completedBy: 'Equipo Legal'
          },
          {
            id: 3,
            name: 'Procesamiento en Estado',
            description: 'Envío de documentación al estado de Delaware para registro de la LLC',
            status: 'current',
            date: new Date('2024-01-18T09:15:00'),
            completedBy: 'Equipo Administrativo'
          },
          {
            id: 4,
            name: 'Obtención de EIN',
            description: 'Solicitud y obtención del EIN (Employer Identification Number) del IRS',
            status: 'pending'
          },
          {
            id: 5,
            name: 'Preparación de Documentos',
            description: 'Preparación de documentos finales: Operating Agreement y certificados',
            status: 'pending'
          },
          {
            id: 6,
            name: 'Completado',
            description: 'Proceso completado. Todos los documentos están listos para descarga',
            status: 'pending'
          }
        ]
      };
      this.isLoading = false;
    }, 1000);
  }

  getRequestTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'apertura-llc': 'Apertura LLC',
      'renovacion-llc': 'Renovación LLC',
      'cuenta-bancaria': 'Cuenta Bancaria'
    };
    return types[type] || type;
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


