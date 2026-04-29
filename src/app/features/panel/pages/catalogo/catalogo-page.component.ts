import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-catalogo-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <button class="btn btn-primary mb-3" (click)="createSample()">Nuevo item</button>
      <ul class="list-group">
        <li class="list-group-item" *ngFor="let item of items">{{ item.name }} - {{ item.description }}</li>
      </ul>
    </section>
  `,
})
export class CatalogoPageComponent implements OnInit {
  items: any[] = [];

  constructor(private readonly catalogService: CatalogService) {}

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async createSample(): Promise<void> {
    await this.catalogService.createItem({
      name: `Servicio ${Date.now()}`,
      description: 'Item creado desde panel',
      active: true,
    });
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.items = await this.catalogService.listItems();
  }
}

