import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

interface PartnerClient {
  id: number;
  name: string;
  email: string;
  totalRequests: number;
  activeRequests: number;
  createdAt: Date;
  lastRequestDate?: Date;
}

interface PartnerRequest {
  id: number;
  type: string;
  clientName: string;
  status: string;
  createdAt: Date;
  currentStep: string;
}

interface Partner {
  id: number;
  name: string;
  email: string;
  company?: string;
  status: 'active' | 'inactive';
  totalClients: number;
  totalRequests: number;
  createdAt: Date;
  lastActivity?: Date;
  clients: PartnerClient[];
  recentRequests: PartnerRequest[];
}

@Component({
  selector: 'app-partner-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './partner-detail.component.html',
  styleUrl: './partner-detail.component.css'
})
export class PartnerDetailComponent implements OnInit {
  partnerId: string | null = null;
  partner: Partner | null = null;
  isLoading = true;
  activeTab: 'clients' | 'requests' | 'stats' = 'clients';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.partnerId = this.route.snapshot.paramMap.get('id');
    if (this.partnerId) {
      this.loadPartner();
    } else {
      this.router.navigate(['/panel/partners']);
    }
  }

  loadPartner(): void {
    this.isLoading = true;
    // TODO: Cargar partner desde el backend
    setTimeout(() => {
      this.partner = {
        id: parseInt(this.partnerId || '1'),
        name: 'Partner ABC',
        email: 'partner@abc.com',
        company: 'ABC Consulting',
        status: 'active',
        totalClients: 15,
        totalRequests: 32,
        createdAt: new Date('2023-12-01'),
        lastActivity: new Date('2024-01-20'),
        clients: [
          {
            id: 1,
            name: 'Juan Pérez',
            email: 'juan@example.com',
            totalRequests: 3,
            activeRequests: 1,
            createdAt: new Date('2024-01-05'),
            lastRequestDate: new Date('2024-01-18')
          },
          {
            id: 2,
            name: 'María García',
            email: 'maria@example.com',
            totalRequests: 5,
            activeRequests: 2,
            createdAt: new Date('2024-01-10'),
            lastRequestDate: new Date('2024-01-19')
          }
        ],
        recentRequests: [
          {
            id: 1,
            type: 'Apertura LLC',
            clientName: 'Juan Pérez',
            status: 'en-proceso',
            createdAt: new Date('2024-01-18'),
            currentStep: 'Procesamiento'
          },
          {
            id: 2,
            type: 'Renovación LLC',
            clientName: 'María García',
            status: 'pendiente',
            createdAt: new Date('2024-01-19'),
            currentStep: 'Revisión de Documentos'
          }
        ]
      };
      this.isLoading = false;
    }, 1000);
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'badge bg-success' : 'badge bg-secondary';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Activo' : 'Inactivo';
  }

  getRequestStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pendiente': 'badge bg-warning',
      'en-proceso': 'badge bg-info',
      'completada': 'badge bg-success',
      'rechazada': 'badge bg-danger'
    };
    return classes[status] || 'badge bg-secondary';
  }

  getRequestStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en-proceso': 'En Proceso',
      'completada': 'Completada',
      'rechazada': 'Rechazada'
    };
    return labels[status] || status;
  }

  setActiveTab(tab: 'clients' | 'requests' | 'stats'): void {
    this.activeTab = tab;
  }
}










