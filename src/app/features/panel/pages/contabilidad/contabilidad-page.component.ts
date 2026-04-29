import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AccountingService } from '../../services/accounting.service';

@Component({
  selector: 'app-contabilidad-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <button class="btn btn-primary mb-3" (click)="runSampleImport()">Importar CSV demo</button>
      <button class="btn btn-outline-secondary mb-3 ms-2" (click)="loadPl()">Generar P&L</button>
      <pre class="bg-light p-3 border rounded">{{ pl | json }}</pre>
    </section>
  `,
})
export class ContabilidadPageComponent {
  pl: any = null;

  constructor(private readonly accountingService: AccountingService) {}

  async runSampleImport(): Promise<void> {
    await this.accountingService.importCsv({
      bankAccountId: 1,
      importedByUserId: 1,
      fileName: 'sample.csv',
      csv: 'date,description,amount\n2026-04-01,Ingreso demo,1200\n2026-04-03,Gasto demo,-300',
    });
  }

  async loadPl(): Promise<void> {
    this.pl = await this.accountingService.getProfitAndLoss('2026-04-01', '2026-04-30');
  }
}

