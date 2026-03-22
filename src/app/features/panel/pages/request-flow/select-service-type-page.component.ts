import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ServiceType } from '../../../../shared/models/request-flow-context';

/**
 * Página para seleccionar el tipo de servicio antes de iniciar el flujo
 * Redirige al flujo unificado correspondiente según el rol del usuario
 */
@Component({
  selector: 'app-select-service-type-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="select-service-type-page">
      <!-- Header -->
      <div class="request-header">
        <h2>Nueva Solicitud</h2>
        <p class="text-muted">Crea una nueva solicitud para un cliente</p>
      </div>

      <!-- Progress Steps (sin paso cliente si ya viene en la URL desde Mis clientes) -->
      <div class="steps-indicator" *ngIf="!hasClientPrefilled">
        <div class="step-item active">
          <div class="step-number">1</div>
          <div class="step-label">Tipo de Servicio</div>
        </div>
        <div class="step-item">
          <div class="step-number">2</div>
          <div class="step-label">Información del Cliente</div>
        </div>
        <div class="step-item">
          <div class="step-number">3</div>
          <div class="step-label">Datos del Servicio</div>
        </div>
        <div class="step-item">
          <div class="step-number">4</div>
          <div class="step-label">Pago</div>
        </div>
      </div>
      <div class="steps-indicator" *ngIf="hasClientPrefilled">
        <div class="step-item active">
          <div class="step-number">1</div>
          <div class="step-label">Tipo de Servicio</div>
        </div>
        <div class="step-item">
          <div class="step-number">2</div>
          <div class="step-label">Datos del Servicio</div>
        </div>
        <div class="step-item">
          <div class="step-number">3</div>
          <div class="step-label">Pago</div>
        </div>
      </div>

      <!-- Form Step -->
      <div class="form-step">
        <h3>Selecciona el Tipo de Servicio</h3>
        <div class="service-types-grid">
          <div 
            *ngFor="let service of serviceTypes" 
            class="service-type-card"
            [class.selected]="selectedService === service.value"
            (click)="selectService(service.value)"
          >
            <input
              type="radio"
              [id]="'service-' + service.value"
              [value]="service.value"
              class="service-radio"
              [checked]="selectedService === service.value"
            />
            <label [for]="'service-' + service.value" class="service-label">
              <h4>{{ service.label }}</h4>
              <p>{{ service.description }}</p>
            </label>
          </div>
        </div>
        <div class="step-actions">
          <a routerLink="/panel/my-requests" class="btn btn-outline-secondary">Cancelar</a>
          <button 
            type="button" 
            class="btn btn-primary" 
            (click)="continueToFlow()" 
            [disabled]="!selectedService">
            Siguiente
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .select-service-type-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .request-header {
      margin-bottom: 2rem;
    }

    .request-header h2 {
      color: var(--color-texto-oscuro, #212529);
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .request-header .text-muted {
      color: #6c757d;
      font-size: 1rem;
      margin: 0;
    }

    /* Steps Indicator */
    .steps-indicator {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      padding: 1rem 0;
      margin-bottom: 2rem;
    }

    .steps-indicator::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 2px;
      background-color: #e0e0e0;
      z-index: 0;
    }

    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 1;
      flex: 1;
    }

    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #e0e0e0;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      margin-bottom: 0.5rem;
      transition: all 0.3s;
    }

    .step-item.active .step-number {
      background-color: #007bff;
      color: white;
      box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.2);
    }

    .step-label {
      font-size: 0.875rem;
      color: #666;
      text-align: center;
      max-width: 120px;
      transition: color 0.3s;
    }

    .step-item.active .step-label {
      color: #007bff;
      font-weight: 600;
    }

    /* Form Step */
    .form-step {
      background: var(--color-fondo-claro, #ffffff);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .form-step h3 {
      color: var(--color-texto-oscuro, #212529);
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    /* Service Types Grid */
    .service-types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .service-type-card {
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .service-type-card:hover {
      border-color: var(--color-secundario-tecnico, #01c9e2);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .service-type-card.selected {
      border-color: var(--color-secundario-tecnico, #01c9e2);
      background: rgba(1, 201, 226, 0.05);
    }

    .service-radio {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .service-label {
      cursor: pointer;
      margin: 0;
    }

    .service-label h4 {
      color: var(--color-texto-oscuro, #212529);
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .service-label p {
      color: #6c757d;
      font-size: 0.9rem;
      margin: 0;
    }

    /* Step Actions */
    .step-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e9ecef;
    }

    .step-actions .btn {
      min-width: 120px;
    }

    .step-actions a.btn-outline-secondary {
      text-decoration: none;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .select-service-type-page {
        padding: 1rem 0.5rem;
      }

      .step-label {
        font-size: 0.75rem;
        max-width: 80px;
      }
      
      .step-number {
        width: 32px;
        height: 32px;
        font-size: 0.875rem;
      }

      .form-step {
        padding: 1.5rem;
      }

      .service-types-grid {
        grid-template-columns: 1fr;
      }

      .step-actions {
        flex-direction: column-reverse;
        gap: 0.5rem;
      }

      .step-actions .btn {
        width: 100%;
        min-width: unset;
      }
    }
  `]
})
export class SelectServiceTypePageComponent implements OnInit {
  selectedService: ServiceType | null = null;
  /** true si la URL trae client o clientId (solicitud desde Mis clientes) */
  hasClientPrefilled = false;

  serviceTypes = [
    { 
      value: 'apertura-llc' as ServiceType, 
      label: 'Apertura LLC', 
      description: 'Formación de nueva LLC en Estados Unidos'
    },
    { 
      value: 'renovacion-llc' as ServiceType, 
      label: 'Renovación LLC', 
      description: 'Renovación de LLC existente'
    },
    { 
      value: 'cuenta-bancaria' as ServiceType, 
      label: 'Cuenta Bancaria', 
      description: 'Apertura de cuenta bancaria para LLC'
    }
  ];
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    // Verificar autenticación
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/panel/login']);
      return;
    }
    const q = this.route.snapshot.queryParams;
    this.hasClientPrefilled = !!(q['client'] || q['clientId']);
  }
  
  selectService(serviceType: ServiceType): void {
    this.selectedService = serviceType;
  }

  continueToFlow(): void {
    if (!this.selectedService) {
      return;
    }
    const q = this.route.snapshot.queryParams;
    const queryParams: Record<string, string> = { serviceType: this.selectedService };
    if (q['client']) {
      queryParams['client'] = q['client'];
    }
    if (q['clientId']) {
      queryParams['clientId'] = q['clientId'];
    }
    this.router.navigate(['/panel/new-request'], { queryParams });
  }
}
