import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Partner {
  id: number;
  name: string;
  email: string;
  company?: string;
  status: 'active' | 'inactive';
  totalClients: number;
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  revenue: number;
  createdAt: Date;
  lastActivity?: Date;
}

interface PartnerPerformance {
  partner: Partner;
  requestsThisMonth: number;
  requestsLastMonth: number;
  growthRate: number;
  averageCompletionTime: number;
  clientRetentionRate: number;
}

@Component({
  selector: 'app-partner-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './partner-reports.component.html',
  styleUrl: './partner-reports.component.css'
})
export class PartnerReportsComponent implements OnInit {
  isLoading = true;
  partners: Partner[] = [];
  partnerPerformance: PartnerPerformance[] = [];
  
  // Filtros
  dateRange: 'all' | 'month' | 'quarter' | 'year' = 'all';
  selectedPartnerId: number | null = null;
  startDate: string = '';
  endDate: string = '';
  
  // Métricas generales
  totalPartners = 0;
  activePartners = 0;
  inactivePartners = 0;
  totalRequests = 0;
  totalRevenue = 0;
  averageRequestsPerPartner = 0;
  
  // Datos para gráficos
  requestsByPartner: { name: string; value: number }[] = [];
  revenueByPartner: { name: string; value: number }[] = [];
  statusDistribution: { label: string; value: number; color: string }[] = [];

  ngOnInit(): void {
    this.initializeDates();
    this.loadReportData();
  }

  initializeDates(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = firstDayOfMonth.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  loadReportData(): void {
    this.isLoading = true;
    // TODO: Cargar datos desde el backend
    setTimeout(() => {
      this.partners = [
        {
          id: 1,
          name: 'Partner ABC',
          email: 'partner@abc.com',
          company: 'ABC Consulting',
          status: 'active',
          totalClients: 15,
          totalRequests: 32,
          completedRequests: 20,
          pendingRequests: 5,
          inProgressRequests: 7,
          revenue: 45000,
          createdAt: new Date('2023-12-01'),
          lastActivity: new Date('2024-01-20')
        },
        {
          id: 2,
          name: 'Partner XYZ',
          email: 'partner@xyz.com',
          company: 'XYZ Services',
          status: 'active',
          totalClients: 8,
          totalRequests: 18,
          completedRequests: 12,
          pendingRequests: 3,
          inProgressRequests: 3,
          revenue: 28000,
          createdAt: new Date('2024-01-05'),
          lastActivity: new Date('2024-01-19')
        },
        {
          id: 3,
          name: 'Partner DEF',
          email: 'partner@def.com',
          status: 'inactive',
          totalClients: 3,
          totalRequests: 5,
          completedRequests: 4,
          pendingRequests: 0,
          inProgressRequests: 1,
          revenue: 8000,
          createdAt: new Date('2023-11-15'),
          lastActivity: new Date('2023-12-20')
        },
        {
          id: 4,
          name: 'Partner GHI',
          email: 'partner@ghi.com',
          company: 'GHI Solutions',
          status: 'active',
          totalClients: 12,
          totalRequests: 25,
          completedRequests: 18,
          pendingRequests: 2,
          inProgressRequests: 5,
          revenue: 38000,
          createdAt: new Date('2023-10-20'),
          lastActivity: new Date('2024-01-18')
        }
      ];
      
      this.calculateMetrics();
      this.calculatePerformance();
      this.prepareChartData();
      this.isLoading = false;
    }, 1000);
  }

  calculateMetrics(): void {
    this.totalPartners = this.partners.length;
    this.activePartners = this.partners.filter(p => p.status === 'active').length;
    this.inactivePartners = this.totalPartners - this.activePartners;
    this.totalRequests = this.partners.reduce((sum, p) => sum + p.totalRequests, 0);
    this.totalRevenue = this.partners.reduce((sum, p) => sum + p.revenue, 0);
    this.averageRequestsPerPartner = this.totalPartners > 0 
      ? Math.round(this.totalRequests / this.totalPartners) 
      : 0;
  }

  calculatePerformance(): void {
    this.partnerPerformance = this.partners.map(partner => {
      const requestsThisMonth = Math.floor(partner.totalRequests * 0.3);
      const requestsLastMonth = Math.floor(partner.totalRequests * 0.25);
      const growthRate = requestsLastMonth > 0 
        ? ((requestsThisMonth - requestsLastMonth) / requestsLastMonth) * 100 
        : 0;
      
      return {
        partner,
        requestsThisMonth,
        requestsLastMonth,
        growthRate: Math.round(growthRate * 10) / 10,
        averageCompletionTime: Math.floor(Math.random() * 15) + 5, // días
        clientRetentionRate: Math.round((partner.totalClients / (partner.totalClients + 2)) * 100)
      };
    });
    
    // Ordenar por rendimiento (total de solicitudes)
    this.partnerPerformance.sort((a, b) => b.partner.totalRequests - a.partner.totalRequests);
  }

  prepareChartData(): void {
    // Top 5 partners por solicitudes
    const sortedByRequests = [...this.partners]
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 5);
    
    this.requestsByPartner = sortedByRequests.map(p => ({
      name: p.company || p.name,
      value: p.totalRequests
    }));

    // Top 5 partners por revenue
    const sortedByRevenue = [...this.partners]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    this.revenueByPartner = sortedByRevenue.map(p => ({
      name: p.company || p.name,
      value: p.revenue
    }));

    // Distribución por estado
    this.statusDistribution = [
      {
        label: 'Activos',
        value: this.activePartners,
        color: '#198754'
      },
      {
        label: 'Inactivos',
        value: this.inactivePartners,
        color: '#6c757d'
      }
    ];
  }

  onDateRangeChange(): void {
    this.applyFilters();
  }

  onPartnerChange(): void {
    this.applyFilters();
  }

  onDateChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    // TODO: Aplicar filtros y recargar datos
    this.loadReportData();
  }

  getFilteredPartners(): Partner[] {
    let filtered = [...this.partners];
    
    if (this.selectedPartnerId) {
      filtered = filtered.filter(p => p.id === this.selectedPartnerId);
    }
    
    return filtered;
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'badge bg-success' : 'badge bg-secondary';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Activo' : 'Inactivo';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  get maxRequestsValue(): number {
    return this.requestsByPartner.length > 0 ? this.requestsByPartner[0].value : 1;
  }

  get maxRevenueValue(): number {
    return this.revenueByPartner.length > 0 ? this.revenueByPartner[0].value : 1;
  }

  exportReport(): void {
    // TODO: Implementar exportación a PDF/Excel
    console.log('Exportar reporte');
  }
}








