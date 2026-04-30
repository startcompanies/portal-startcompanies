import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { AccountingService } from '../../services/accounting.service';

@Component({
  selector: 'app-contabilidad-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './contabilidad-page.component.html',
  styleUrl: './contabilidad-page.component.scss',
})
export class ContabilidadPageComponent implements OnInit {
  tab: 'import' | 'movements' | 'pl' = 'import';
  csvText = '';
  preview: { detectedBank?: string; rows?: any[]; totalRows?: number } | null = null;
  uncategorized: any[] = [];
  categorized: any[] = [];
  pl: any = null;
  fromDate = '';
  toDate = '';
  categories: { income: any[]; expense: any[] } = { income: [], expense: [] };
  editTx: any = null;
  editForm = { categoryId: null as number | null, accountCode: '', accountingDate: '', invoiceMatchNote: '' };

  constructor(private readonly accounting: AccountingService) {}

  async ngOnInit(): Promise<void> {
    const t = this.todayParts();
    this.fromDate = `${t.y}-${String(t.m).padStart(2, '0')}-01`;
    this.toDate = `${t.y}-${String(t.m).padStart(2, '0')}-${String(t.last).padStart(2, '0')}`;
    await this.reloadMovements();
    try {
      this.categories = await this.accounting.listCategories();
    } catch {
      this.categories = { income: [], expense: [] };
    }
  }

  private todayParts() {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const last = new Date(y, m, 0).getDate();
    return { y, m, last };
  }

  setTab(t: 'import' | 'movements' | 'pl'): void {
    this.tab = t;
  }

  async runPreview(): Promise<void> {
    this.preview = await this.accounting.previewCsv(this.csvText);
  }

  async confirmImport(): Promise<void> {
    await this.accounting.importCsv({
      fileName: 'upload.csv',
      csv: this.csvText,
    });
    this.preview = null;
    await this.reloadMovements();
    this.tab = 'movements';
  }

  async reloadMovements(): Promise<void> {
    this.uncategorized = await this.accounting.listTransactions(true);
    this.categorized = await this.accounting.listTransactions(false);
  }

  async suggestFor(tx: any): Promise<void> {
    const r = await this.accounting.suggestCategory(tx.description || '');
    this.openEdit(tx);
    if (r?.accountCode) this.editForm.accountCode = r.accountCode;
  }

  openEdit(tx: any): void {
    this.editTx = tx;
    this.editForm = {
      categoryId: tx.categoryId ?? null,
      accountCode: tx.accountCode || '',
      accountingDate: tx.accountingDate || tx.txDate || '',
      invoiceMatchNote: tx.invoiceMatchNote || '',
    };
  }

  closeEdit(): void {
    this.editTx = null;
  }

  async saveEdit(): Promise<void> {
    if (!this.editTx) return;
    await this.accounting.patchTransaction(this.editTx.id, {
      categoryId: this.editForm.categoryId,
      accountCode: this.editForm.accountCode || null,
      accountingDate: this.editForm.accountingDate || null,
      invoiceMatchNote: this.editForm.invoiceMatchNote || null,
    });
    this.closeEdit();
    await this.reloadMovements();
  }

  async loadPl(): Promise<void> {
    this.pl = await this.accounting.getProfitAndLoss(this.fromDate, this.toDate);
  }

  async exportCsv(): Promise<void> {
    const blob = await this.accounting.downloadPlCsv(this.fromDate, this.toDate);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pl-${this.fromDate}-${this.toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  printPl(): void {
    window.print();
  }

  setPeriod(p: 'month' | 'quarter' | 'year'): void {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    if (p === 'month') {
      const last = new Date(y, m, 0).getDate();
      this.fromDate = `${y}-${String(m).padStart(2, '0')}-01`;
      this.toDate = `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
    } else if (p === 'year') {
      this.fromDate = `${y}-01-01`;
      this.toDate = `${y}-12-31`;
    } else {
      const q = Math.floor((m - 1) / 3);
      const startM = q * 3 + 1;
      const endM = startM + 2;
      const last = new Date(y, endM, 0).getDate();
      this.fromDate = `${y}-${String(startM).padStart(2, '0')}-01`;
      this.toDate = `${y}-${String(endM).padStart(2, '0')}-${last}`;
    }
  }
}
