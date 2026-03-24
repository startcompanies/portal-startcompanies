import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../services/auth.service';
import {
  RequestsService,
  ServiceHistoryItem,
} from '../../services/requests.service';
import { PartnerClientsService, PartnerClient } from '../../services/partner-clients.service';

@Component({
  selector: 'app-service-history',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './service-history.component.html',
  styleUrl: './service-history.component.css',
})
export class ServiceHistoryComponent implements OnInit {
  items: ServiceHistoryItem[] = [];
  isLoading = true;
  error: string | null = null;
  isPartner = false;
  partnerClients: PartnerClient[] = [];
  /** null = todos los clientes (solo partner) */
  selectedClientId: number | null = null;

  constructor(
    private authService: AuthService,
    private requestsService: RequestsService,
    private partnerClientsService: PartnerClientsService,
    private transloco: TranslocoService,
  ) {
    this.isPartner = this.authService.isPartner();
  }

  ngOnInit(): void {
    if (this.isPartner) {
      this.partnerClientsService.getMyClients().subscribe({
        next: (list) => {
          this.partnerClients = list;
          this.loadHistory();
        },
        error: () => {
          this.partnerClients = [];
          this.loadHistory();
        },
      });
    } else {
      this.loadHistory();
    }
  }

  onClientFilterChange(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading = true;
    this.error = null;
    const clientId =
      this.isPartner && this.selectedClientId != null
        ? this.selectedClientId
        : undefined;
    this.requestsService
      .getServiceHistory(clientId)
      .then((rows) => {
        this.items = rows;
        this.isLoading = false;
      })
      .catch(() => {
        this.error = this.transloco.translate(
          'PANEL.service_history_page.error_load',
        );
        this.items = [];
        this.isLoading = false;
      });
  }

  displayDate(iso?: string): string {
    if (!iso) {
      return '—';
    }
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }
}
