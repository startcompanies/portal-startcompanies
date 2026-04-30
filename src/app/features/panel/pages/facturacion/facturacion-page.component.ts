import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { InvoicingService, InvoiceLinePayload } from '../../services/invoicing.service';
import { CompanyProfileService, ClientCompanyProfile } from '../../services/company-profile.service';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-facturacion-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoPipe],
  templateUrl: './facturacion-page.component.html',
  styleUrl: './facturacion-page.component.scss',
})
export class FacturacionPageComponent implements OnInit {
  invoices: any[] = [];
  filterStatus: string | null = null;
  company: ClientCompanyProfile | null = null;
  showModal = false;
  showPicker = false;
  showPartial = false;
  editingId: number | null = null;
  billTo = { companyName: '', ein: '', address: '', email: '', phone: '' };
  invDetail = {
    currency: 'USD',
    issueDate: '',
    dueDate: '',
    taxRate: 0,
    taxLabel: '0% — No ECI',
    notes: '',
  };
  lines: {
    productName: string;
    description: string;
    unitMeasure: string;
    qty: number;
    unitPrice: number;
    discountPercent: number;
  }[] = [];
  catalogRows: any[] = [];
  partialInvoiceId: number | null = null;
  partialAmount = 0;

  constructor(
    private readonly invoicing: InvoicingService,
    private readonly companyProfile: CompanyProfileService,
    private readonly catalog: CatalogService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.reload();
    try {
      this.company = await this.companyProfile.getCompany();
    } catch {
      this.company = null;
    }
  }

  get filteredInvoices(): any[] {
    return this.invoices.filter((inv) => {
      if (!this.filterStatus) return true;
      return this.resolveStatus(inv) === this.filterStatus;
    });
  }

  resolveStatus(inv: any): string {
    if (inv.status === 'paid' || inv.status === 'partial' || inv.status === 'draft' || inv.status === 'void') {
      return inv.status;
    }
    if (inv.status === 'sent' && inv.dueDate) {
      const d = new Date(inv.dueDate + 'T12:00:00');
      if (!Number.isNaN(d.getTime()) && d < new Date()) return 'overdue';
    }
    return inv.status;
  }

  kpiTotal(): number {
    return this.invoices.length;
  }
  kpiDraft(): number {
    return this.invoices.filter((i) => i.status === 'draft').length;
  }
  kpiPending(): number {
    return this.invoices.filter((i) => this.resolveStatus(i) === 'sent' || this.resolveStatus(i) === 'overdue')
      .length;
  }
  kpiPaid(): number {
    return this.invoices.filter((i) => i.status === 'paid').length;
  }
  kpiSumUsd(): number {
    return this.invoices
      .filter((i) => (i.currency || 'USD') === 'USD')
      .reduce((a, i) => a + Number(i.totalAmount || 0), 0);
  }

  setFilter(s: string | null): void {
    this.filterStatus = s;
  }

  async reload(): Promise<void> {
    this.invoices = await this.invoicing.listInvoices();
  }

  today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  openNew(): void {
    this.editingId = null;
    this.billTo = { companyName: '', ein: '', address: '', email: '', phone: '' };
    this.invDetail = {
      currency: 'USD',
      issueDate: this.today(),
      dueDate: '',
      taxRate: 0,
      taxLabel: '0% — No ECI',
      notes: '',
    };
    this.lines = [
      { productName: '', description: '', unitMeasure: 'u', qty: 1, unitPrice: 0, discountPercent: 0 },
    ];
    void this.refreshCompanyInModal();
    this.showModal = true;
  }

  async refreshCompanyInModal(): Promise<void> {
    try {
      this.company = await this.companyProfile.getCompany();
    } catch {
      /* ignore */
    }
  }

  /** True si ya hay datos de emisor guardados (no mostrar aviso de ir a Configuración). */
  hasCompanyEmitterConfigured(): boolean {
    const c = this.company;
    if (!c) return false;
    const s = (v: string | null | undefined) => (v ?? '').trim().length > 0;
    return (
      s(c.legalName) ||
      s(c.ein) ||
      s(c.address) ||
      s(c.billingEmail) ||
      s(c.phone) ||
      s(c.bankName) ||
      s(c.accountNumber) ||
      s(c.logoUrl)
    );
  }

  /** Valor estable para `<input type="date">` (evita ISO con hora que deja el campo vacío). */
  private toInputDate(v: unknown): string {
    if (v == null || v === '') return '';
    const s = typeof v === 'string' ? v : v instanceof Date ? v.toISOString() : String(v);
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
    if (m) return m[1];
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  async openEdit(id: number): Promise<void> {
    const inv = (await this.invoicing.getInvoice(id)) as Record<string, unknown>;
    this.editingId = id;
    const bt = (inv['billTo'] || {}) as Record<string, string>;
    this.billTo = {
      companyName: String(bt['companyName'] || bt['name'] || ''),
      ein: String(bt['ein'] || bt['taxId'] || ''),
      address: String(bt['address'] || ''),
      email: String(bt['email'] || ''),
      phone: String(bt['phone'] || ''),
    };
    this.invDetail = {
      currency: (inv['currency'] as string) || 'USD',
      issueDate: this.toInputDate(inv['issueDate']) || this.today(),
      dueDate: this.toInputDate(inv['dueDate']),
      taxRate: Number(inv['taxRate'] ?? 0),
      taxLabel: (inv['taxLabel'] as string) || '0% — No ECI',
      notes: inv['notes'] != null ? String(inv['notes']) : '',
    };
    const rawItems = Array.isArray(inv['items']) ? (inv['items'] as unknown[]) : [];
    this.lines = rawItems.map((r: any) => ({
      productName: String(r.productName ?? r.product_name ?? ''),
      description: String(r.description ?? ''),
      unitMeasure: String(r.unitMeasure ?? r.unit_measure ?? 'u'),
      qty: Number(r.qty ?? 1),
      unitPrice: Number(r.unitPrice ?? r.unit_price ?? 0),
      discountPercent: Number(r.discountPercent ?? r.discount_percent ?? 0),
    }));
    if (this.lines.length === 0) {
      this.lines.push({ productName: '', description: '', unitMeasure: 'u', qty: 1, unitPrice: 0, discountPercent: 0 });
    }
    await this.refreshCompanyInModal();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  addLine(): void {
    this.lines.push({ productName: '', description: '', unitMeasure: 'u', qty: 1, unitPrice: 0, discountPercent: 0 });
  }

  removeLine(i: number): void {
    this.lines.splice(i, 1);
    if (this.lines.length === 0) this.addLine();
  }

  subtotal(): number {
    return this.lines.reduce((a, l) => {
      const base = Number(l.qty) * Number(l.unitPrice);
      const d = Number(l.discountPercent || 0);
      return a + Math.round(base * (1 - d / 100) * 100) / 100;
    }, 0);
  }

  taxAmount(): number {
    return Math.round(this.subtotal() * Number(this.invDetail.taxRate || 0) * 100) / 100;
  }

  grandTotal(): number {
    return Math.round((this.subtotal() + this.taxAmount()) * 100) / 100;
  }

  buildPayload(status: string): Record<string, unknown> {
    /* Incluir línea si hay producto o descripción (antes solo description → el PDF quedaba sin líneas). */
    const items: InvoiceLinePayload[] = this.lines
      .filter((l) => l.description.trim() || l.productName.trim())
      .map((l) => {
        const description = (l.description.trim() || l.productName.trim()).trim();
        const pn = l.productName.trim();
        return {
          /* Guardar siempre lo escrito en Producto/servicio (catálogo o manual), aunque coincida con la descripción. */
          productName: pn ? pn : undefined,
          description,
          unitMeasure: l.unitMeasure || 'u',
          qty: Number(l.qty),
          unitPrice: Number(l.unitPrice),
          discountPercent: Number(l.discountPercent || 0),
        };
      });
    return {
      status,
      currency: this.invDetail.currency,
      issueDate: this.invDetail.issueDate,
      dueDate: this.invDetail.dueDate || null,
      taxRate: Number(this.invDetail.taxRate || 0),
      taxLabel: this.invDetail.taxLabel,
      notes: this.invDetail.notes || null,
      billTo: {
        companyName: this.billTo.companyName,
        ein: this.billTo.ein,
        address: this.billTo.address,
        email: this.billTo.email,
        phone: this.billTo.phone,
      },
      items,
    };
  }

  async saveDraft(): Promise<void> {
    const payload = this.buildPayload('draft');
    if (this.editingId) await this.invoicing.updateInvoice(this.editingId, payload);
    else await this.invoicing.createInvoice(payload);
    this.closeModal();
    await this.reload();
  }

  async confirmSendInvoice(): Promise<void> {
    if (this.editingId) {
      await this.invoicing.updateInvoice(this.editingId, this.buildPayload('sent'));
      await this.invoicing.sendInvoice(this.editingId);
    } else {
      const created = await this.invoicing.createInvoice(this.buildPayload('draft'));
      if (created?.id) await this.invoicing.sendInvoice(created.id);
    }
    this.closeModal();
    await this.reload();
  }

  async openPicker(): Promise<void> {
    this.catalogRows = await this.catalog.lookupForInvoice();
    this.showPicker = true;
  }

  closePicker(): void {
    this.showPicker = false;
  }

  pickRow(row: any): void {
    this.lines.push({
      productName: row.name,
      description: row.description || row.name,
      unitMeasure: row.unitMeasure || 'u',
      qty: 1,
      unitPrice: Number(row.amount || 0),
      discountPercent: 0,
    });
    this.closePicker();
  }

  async downloadPdf(id: number): Promise<void> {
    const blob = await this.invoicing.downloadPdfBlob(id);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  openPartial(id: number): void {
    this.partialInvoiceId = id;
    this.partialAmount = 0;
    this.showPartial = true;
  }

  remainingAmount(inv: any): number {
    return Math.max(0, Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0));
  }

  canRecordPartial(inv: any): boolean {
    const status = this.resolveStatus(inv);
    return status !== 'paid' && status !== 'void' && this.remainingAmount(inv) > 0;
  }

  canMarkAsPaid(inv: any): boolean {
    return this.canRecordPartial(inv);
  }

  async markAsPaid(inv: any): Promise<void> {
    const pending = this.remainingAmount(inv);
    if (pending <= 0) return;
    await this.invoicing.addPayment(Number(inv.id), pending, 'full');
    await this.reload();
  }

  closePartial(): void {
    this.showPartial = false;
  }

  async applyPartial(): Promise<void> {
    if (!this.partialInvoiceId) return;
    if (!(this.partialAmount > 0)) return;
    await this.invoicing.addPayment(this.partialInvoiceId, this.partialAmount);
    this.closePartial();
    await this.reload();
  }
}
