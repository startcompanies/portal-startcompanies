import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { InvoicingService } from '../../services/invoicing.service';

@Component({
  selector: 'app-facturacion-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <button class="btn btn-primary mb-3" (click)="createDraft()">Nueva factura</button>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead><tr><th>ID</th><th>Estado</th><th>Total</th><th>Pagado</th></tr></thead>
          <tbody>
            <tr *ngFor="let invoice of invoices">
              <td>{{ invoice.id }}</td>
              <td>{{ invoice.status }}</td>
              <td>{{ invoice.totalAmount }}</td>
              <td>{{ invoice.paidAmount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class FacturacionPageComponent implements OnInit {
  invoices: any[] = [];

  constructor(private readonly invoicingService: InvoicingService) {}

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async createDraft(): Promise<void> {
    await this.invoicingService.createInvoice({ clientId: 1, totalAmount: 25, status: 'draft' });
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.invoices = await this.invoicingService.listInvoices();
  }
}

