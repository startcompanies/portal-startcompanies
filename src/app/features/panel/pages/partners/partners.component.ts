import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersService, User, CreateUserDto } from '../../services/users.service';
import { IntlTelInputComponent } from '../../../../shared/components/intl-tel-input/intl-tel-input.component';

/** Mismo criterio E.164 relajado que IntlTelInputComponent */
const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

interface Partner extends User {
  totalClients?: number;
  totalRequests?: number;
  lastActivity?: string;
}

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, IntlTelInputComponent],
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
  showEditPartnerModal = false;
  editingPartner: Partner | null = null;
  newPartner = {
    name: '',
    email: '',
    phone: '',
    company: ''
  };
  editPartner = {
    name: '',
    email: '',
    company: '',
    phone: ''
  };
  isCreating = false;
  isUpdating = false;
  createError: string | null = null;
  updateError: string | null = null;

  statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' }
  ];

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadPartners();
  }

  /**
   * Username del API: 4–20 caracteres alfanuméricos/_. La parte local del email puede ser corta.
   */
  private buildUsernameFromEmail(email: string): string {
    const local = email.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || 'user';
    let u = local.length >= 4 ? local : `${local}part`;
    u = u.slice(0, 20);
    if (u.length < 4) {
      u = 'partner';
    }
    return u;
  }

  loadPartners(): void {
    this.isLoading = true;
    this.usersService.getPartners().subscribe({
      next: (users) => {
        // Inicializar partners con valores por defecto
        const partnersWithStats = users.map(user => ({
          ...user,
          totalClients: 0,
          totalRequests: 0,
          createdAt: user.createdAt || new Date().toISOString(),
          lastActivity: user.updatedAt || undefined
        } as Partner));

        // Cargar estadísticas para cada partner en paralelo
        const statsPromises = partnersWithStats.map(partner => 
          this.usersService.getPartnerStats(partner.id).toPromise()
        );

        Promise.all(statsPromises).then(statsArray => {
          statsArray.forEach((stats, index) => {
            if (stats) {
              partnersWithStats[index].totalClients = stats.totalClients;
              partnersWithStats[index].totalRequests = stats.totalRequests;
            }
          });

          this.partners = partnersWithStats;
          this.applyFilters();
          this.isLoading = false;
        }).catch(() => {
          // Si falla cargar stats, usar datos sin stats
          this.partners = partnersWithStats;
          this.applyFilters();
          this.isLoading = false;
        });
      },
      error: (error) => {
        console.error('Error al cargar partners:', error);
        this.createError = 'Error al cargar los partners. Intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredPartners = this.partners.filter(partner => {
      const fullName = `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || partner.username;
      const matchesSearch = !this.searchTerm || 
        fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        partner.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (partner.company && partner.company.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const partnerStatus = partner.status ? 'active' : 'inactive';
      const matchesStatus = this.selectedStatus === 'all' || partnerStatus === this.selectedStatus;
      
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
    this.newPartner = { name: '', email: '', phone: '', company: '' };
    this.createError = null;
  }

  closeNewPartnerModal(): void {
    this.showNewPartnerModal = false;
    this.newPartner = { name: '', email: '', phone: '', company: '' };
    this.createError = null;
  }

  /** Habilita el botón crear cuando hay datos mínimos y teléfono en formato E.164 */
  get canSubmitNewPartner(): boolean {
    const phone = (this.newPartner.phone || '').trim();
    return (
      !!this.newPartner.name?.trim() &&
      !!this.newPartner.email?.trim() &&
      E164_PHONE_REGEX.test(phone)
    );
  }

  createPartner(): void {
    if (!this.newPartner.name?.trim() || !this.newPartner.email?.trim()) {
      this.createError = 'Por favor completa todos los campos requeridos';
      return;
    }

    const phone = (this.newPartner.phone || '').trim();
    if (!E164_PHONE_REGEX.test(phone)) {
      this.createError =
        'Introduce un teléfono válido con código de país (formato internacional).';
      return;
    }

    this.isCreating = true;
    this.createError = null;

    const nameParts = this.newPartner.name.split(' ');
    // No enviar password - se generará automáticamente y se enviará por email
    const createUserDto: CreateUserDto = {
      username: this.buildUsernameFromEmail(this.newPartner.email.trim()),
      email: this.newPartner.email.trim(),
      password: '', // Se generará automáticamente en el backend
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      type: 'partner',
      phone,
      company: this.newPartner.company || undefined
    };

    this.usersService.createUser(createUserDto).subscribe({
      next: (user) => {
        const newPartner: Partner = {
          ...user,
          totalClients: 0,
          totalRequests: 0,
          createdAt: user.createdAt || new Date().toISOString()
        };
        this.partners.push(newPartner);
        this.applyFilters();
        this.isCreating = false;
        this.closeNewPartnerModal();
      },
      error: (error) => {
        console.error('Error al crear partner:', error);
        this.createError = error.error?.message || 'Error al crear el partner. Intenta nuevamente.';
        this.isCreating = false;
      }
    });
  }

  togglePartnerStatus(partner: Partner): void {
    this.usersService.toggleUserStatus(partner.id).subscribe({
      next: (updatedUser) => {
        const index = this.partners.findIndex(p => p.id === partner.id);
        if (index !== -1) {
          this.partners[index] = { ...this.partners[index], status: updatedUser.status };
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error al cambiar estado del partner:', error);
        this.createError = error.error?.message || 'Error al cambiar el estado. Intenta nuevamente.';
      }
    });
  }

  getStatusClass(status: boolean | string): string {
    const isActive = typeof status === 'boolean' ? status : status === 'active';
    return isActive ? 'badge bg-success' : 'badge bg-secondary';
  }

  getStatusLabel(status: boolean | string): string {
    const isActive = typeof status === 'boolean' ? status : status === 'active';
    return isActive ? 'Activo' : 'Inactivo';
  }

  getPartnerName(partner: Partner): string {
    if (partner.first_name || partner.last_name) {
      return `${partner.first_name || ''} ${partner.last_name || ''}`.trim();
    }
    return partner.username;
  }

  openEditPartnerModal(partner: Partner): void {
    this.editingPartner = partner;
    this.editPartner = {
      name: `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || partner.username,
      email: partner.email,
      company: partner.company || '',
      phone: partner.phone || ''
    };
    this.showEditPartnerModal = true;
    this.updateError = null;
  }

  closeEditPartnerModal(): void {
    this.showEditPartnerModal = false;
    this.editingPartner = null;
    this.editPartner = { name: '', email: '', company: '', phone: '' };
    this.updateError = null;
  }

  updatePartner(): void {
    if (!this.editingPartner || !this.editPartner.name || !this.editPartner.email) {
      this.updateError = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.isUpdating = true;
    this.updateError = null;

    const nameParts = this.editPartner.name.split(' ');
    const updateData = {
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      phone: this.editPartner.phone || undefined,
      company: this.editPartner.company || undefined
    };

    this.usersService.updateUser(this.editingPartner.id, updateData).subscribe({
      next: (updatedUser) => {
        const index = this.partners.findIndex(p => p.id === this.editingPartner!.id);
        if (index !== -1) {
          this.partners[index] = { ...this.partners[index], ...updatedUser };
          this.applyFilters();
        }
        this.isUpdating = false;
        this.closeEditPartnerModal();
      },
      error: (error) => {
        console.error('Error al actualizar partner:', error);
        this.updateError = error.error?.message || 'Error al actualizar el partner. Intenta nuevamente.';
        this.isUpdating = false;
      }
    });
  }
}

