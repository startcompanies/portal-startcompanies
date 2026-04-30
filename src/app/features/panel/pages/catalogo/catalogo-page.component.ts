import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-catalogo-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './catalogo-page.component.html',
})
export class CatalogoPageComponent implements OnInit {
  items: any[] = [];
  form = { name: '', description: '', unitMeasure: 'u', unitPriceUsd: 0 };
  showCatalogModal = false;

  constructor(
    private readonly catalog: CatalogService,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.items = await this.catalog.listMyItems();
  }

  async add(): Promise<void> {
    if (!this.form.name.trim()) return;
    await this.catalog.createItem({
      name: this.form.name.trim(),
      description: this.form.description.trim() || undefined,
      unitMeasure: this.form.unitMeasure || 'u',
      unitPriceUsd: Number(this.form.unitPriceUsd) || 0,
    });
    this.form = { name: '', description: '', unitMeasure: 'u', unitPriceUsd: 0 };
    this.showCatalogModal = false;
    await this.reload();
  }

  openAddModal(): void {
    this.form = { name: '', description: '', unitMeasure: 'u', unitPriceUsd: 0 };
    this.showCatalogModal = true;
  }

  closeAddModal(): void {
    this.showCatalogModal = false;
  }

  goToInvoices(): void {
    void this.router.navigate(['/panel/facturacion']);
  }

  itemPriceUsd(item: any): number {
    return Number(
      item?.unitPriceUsd ??
        item?.unit_price_usd ??
        item?.activePrice?.amount ??
        item?.active_price?.amount ??
        0,
    );
  }

  async remove(id: number): Promise<void> {
    if (!confirm('¿Eliminar ítem?')) return;
    await this.catalog.deleteItem(id);
    await this.reload();
  }
}
