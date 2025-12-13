import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
}

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './partners.component.html',
  styleUrl: './partners.component.css'
})
export class PartnersComponent implements OnInit {
  isLoading = true;
  partners: Partner[] = [];
  filteredPartners: Partner[] = [];
  
  // Filtros
  searchTerm: string = '';
  selectedStatus: string = 'all';
  
  // Modal de nuevo partner
  showNewPartnerModal = false;
  newPartner = {
    name: '',
    email: '',
    company: '',
    password: ''
  };
  isCreating = false;
  createError: string | null = null;

  statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' }
  ];

  ngOnInit(): void {
    this.loadPartners();
  }

  loadPartners(): void {
    this.isLoading = true;
    // TODO: Cargar partners desde el backend
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
          createdAt: new Date('2023-11-15'),
          lastActivity: new Date('2023-12-20')
        }
      ];
      this.applyFilters();
      this.isLoading = false;
    }, 1000);
  }

  applyFilters(): void {
    this.filteredPartners = this.partners.filter(partner => {
      const matchesSearch = !this.searchTerm || 
        partner.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        partner.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (partner.company && partner.company.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesStatus = this.selectedStatus === 'all' || partner.status === this.selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  openNewPartnerModal(): void {
    this.showNewPartnerModal = true;
    this.newPartner = { name: '', email: '', company: '', password: '' };
    this.createError = null;
  }

  closeNewPartnerModal(): void {
    this.showNewPartnerModal = false;
    this.newPartner = { name: '', email: '', company: '', password: '' };
    this.createError = null;
  }

  createPartner(): void {
    if (!this.newPartner.name || !this.newPartner.email || !this.newPartner.password) {
      this.createError = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.isCreating = true;
    this.createError = null;

    // TODO: Llamar al backend para crear el partner
    setTimeout(() => {
      const newPartner: Partner = {
        id: this.partners.length + 1,
        name: this.newPartner.name,
        email: this.newPartner.email,
        company: this.newPartner.company || undefined,
        status: 'active',
        totalClients: 0,
        totalRequests: 0,
        createdAt: new Date()
      };

      this.partners.push(newPartner);
      this.applyFilters();
      this.isCreating = false;
      this.closeNewPartnerModal();
    }, 1000);
  }

  togglePartnerStatus(partner: Partner): void {
    // TODO: Implementar cambio de estado en el backend
    partner.status = partner.status === 'active' ? 'inactive' : 'active';
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'badge bg-success' : 'badge bg-secondary';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Activo' : 'Inactivo';
  }
}

