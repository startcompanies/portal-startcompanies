import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  ZohoSyncService,
  ImportAccountsResponse,
  ImportDealsResponse,
  FullSyncResponse,
  SyncRequestResponse,
  ImportDealTimelineResponse,
  ZohoImportAccountsProgressEvent,
} from '../../services/zoho-sync.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-zoho-sync',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zoho-sync.component.html',
  styleUrl: './zoho-sync.component.css'
})
export class ZohoSyncComponent implements OnInit {
  isAdmin = false;
  isLoading = false;
  /** Importar Accounts / sync completa usan stream (no bloquean solo con isLoading) */
  importAccountsBusy = false;
  fullSyncBusy = false;
  
  // Configuración
  org: string = 'startcompanies';
  accountsLimit: number = 200;
  accountsOffset: number = 0;
  dealsLimit: number = 200;
  requestId: number | null = null;
  accountId: string = '';
  
  // Resultados
  accountsResult: ImportAccountsResponse | null = null;
  dealsResult: ImportDealsResponse | null = null;
  fullSyncResult: FullSyncResponse | null = null;
  syncRequestResult: SyncRequestResponse | null = null;
  timelineResult: ImportDealTimelineResponse | null = null;
  timelineLimit = 200;
  timelineMaxPages: number | null = null;
  
  importAccountsProgress: { percent: number | null; message: string } | null = null;
  fullSyncProgress: { percent: number | null; message: string } | null = null;

  // Errores
  error: string | null = null;
  successMessage: string | null = null;

  /** Deshabilita acciones del panel mientras cualquier operación larga está en curso */
  get panelBusy(): boolean {
    return this.isLoading || this.importAccountsBusy || this.fullSyncBusy;
  }

  constructor(
    private zohoSyncService: ZohoSyncService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Verificar si es admin
    this.authService.currentUser$.subscribe(user => {
      this.isAdmin = user?.type === 'admin';
      if (!this.isAdmin) {
        this.error = 'No tienes permisos para acceder a esta sección';
      }
    });
  }

  /**
   * Importar Accounts desde Zoho
   */
  async importAccounts(): Promise<void> {
    if (!this.isAdmin) return;

    this.importAccountsBusy = true;
    this.error = null;
    this.successMessage = null;
    this.accountsResult = null;
    this.importAccountsProgress = { percent: 0, message: 'Conectando…' };

    try {
      this.accountsResult = await this.zohoSyncService.importAccountsStream(
        this.org,
        this.accountsLimit,
        this.accountsOffset,
        (ev) => {
          this.importAccountsProgress = this.progressFromZohoEvent(ev);
        },
      );

      if (this.accountsResult?.success) {
        this.successMessage = `Importación completada: ${this.accountsResult.imported} nuevos, ${this.accountsResult.updated} actualizados, ${this.accountsResult.errors.length} errores`;
      }
    } catch (err: any) {
      this.error = err.error?.message || err.message || 'Error al importar Accounts';
      console.error('Error al importar Accounts:', err);
    } finally {
      this.importAccountsBusy = false;
      this.importAccountsProgress = null;
    }
  }

  private progressFromZohoEvent(
    ev: ZohoImportAccountsProgressEvent,
  ): { percent: number | null; message: string } {
    if (ev.phase === 'count') {
      return {
        percent: 0,
        message: `Total estimado en Zoho: ${ev.totalAccounts} accounts`,
      };
    }
    if (ev.phase === 'prefetch_list') {
      return {
        percent: null,
        message: `Descargando listado desde Zoho: ${ev.accumulated} accounts acumulados…`,
      };
    }
    if (ev.phase === 'list_ready') {
      return {
        percent: 0,
        message: `Se van a procesar ${ev.totalAccounts} accounts`,
      };
    }
    if (ev.phase === 'coql') {
      const msg = `Listado COQL: ${ev.pageTotal} accounts (offset ${ev.offset})`;
      const pct: number | null = ev.fullSync?.estimatedTotal != null && ev.fullSync.estimatedTotal > 0
        ? Math.min(100, Math.round((ev.offset / ev.fullSync.estimatedTotal) * 100))
        : 5;
      return { percent: pct, message: msg };
    }
    const fs = ev.fullSync;
    const name = ev.accountName || ev.accountId;
    const phaseLabel =
      ev.phase === 'fetch_detail' ? 'Obteniendo detalle' : 'Importando al panel';

    let msg: string;
    if (fs?.estimatedTotal != null && fs.estimatedTotal > 0) {
      const globalCurrent = Math.min(
        fs.batchOffset + ev.current,
        fs.estimatedTotal,
      );
      const globalTotal = fs.estimatedTotal;
      msg = `${phaseLabel} ${globalCurrent}/${globalTotal}: ${name}`;
    } else if (fs) {
      msg = `${phaseLabel} ${ev.current}/${ev.total}: ${name}`;
    } else {
      msg = `${phaseLabel} ${ev.current}/${ev.total}: ${name}`;
    }

    let pct: number | null = null;
    if (ev.total > 0) {
      if (fs?.estimatedTotal != null && fs.estimatedTotal > 0) {
        const accountIndex = fs.batchOffset + ev.current - 1;
        const step =
          accountIndex * 2 + (ev.phase === 'import' ? 1 : 0);
        const totalSteps = fs.estimatedTotal * 2;
        pct = Math.min(99, Math.round((step / totalSteps) * 100));
      } else if (!fs) {
        const step =
          (ev.current - 1) * 2 + (ev.phase === 'import' ? 1 : 0);
        const totalSteps = ev.total * 2;
        pct = Math.min(99, Math.round((step / totalSteps) * 100));
      }
    }
    return { percent: pct, message: msg };
  }

  /**
   * Importar un Account específico
   */
  async importAccountById(): Promise<void> {
    if (!this.isAdmin || !this.accountId) return;

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    try {
      const result = await firstValueFrom(
        this.zohoSyncService.importAccountById(this.accountId, this.org)
      );
      if (result) {
        this.successMessage = `Account ${result.accountName} ${result.created ? 'creado' : 'actualizado'} correctamente (Request ID: ${result.requestId})`;
        this.accountId = ''; // Limpiar campo
      }
    } catch (err: any) {
      this.error = err.error?.message || err.message || 'Error al importar Account';
      console.error('Error al importar Account:', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Importar Deals desde Zoho
   */
  async importDeals(): Promise<void> {
    if (!this.isAdmin) return;
    
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    this.dealsResult = null;

    try {
      this.dealsResult = await firstValueFrom(
        this.zohoSyncService.importDeals(this.org, this.dealsLimit)
      );

      if (this.dealsResult?.success) {
        this.successMessage = `Importación de Deals completada: ${this.dealsResult.updated} Requests actualizados, ${this.dealsResult.errors.length} errores`;
      }
    } catch (err: any) {
      this.error = err.error?.message || err.message || 'Error al importar Deals';
      console.error('Error al importar Deals:', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Importar Deals al historial del portal (tabla local)
   */
  async importDealTimeline(): Promise<void> {
    if (!this.isAdmin) return;

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    this.timelineResult = null;

    const maxPages =
      this.timelineMaxPages != null &&
      !Number.isNaN(this.timelineMaxPages) &&
      this.timelineMaxPages > 0
        ? this.timelineMaxPages
        : undefined;

    try {
      this.timelineResult = await firstValueFrom(
        this.zohoSyncService.importDealTimeline(
          this.org,
          this.timelineLimit,
          maxPages,
        ),
      );
      if (this.timelineResult?.success) {
        this.successMessage = `Historial portal: ${this.timelineResult.upserted} registros guardados/actualizados (${this.timelineResult.errors.length} errores por deal)`;
      }
    } catch (err: any) {
      this.error =
        err.error?.message || err.message || 'Error al importar historial de Deals';
      console.error('importDealTimeline', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Sincronización completa
   */
  async fullSync(): Promise<void> {
    if (!this.isAdmin) return;

    this.fullSyncBusy = true;
    this.error = null;
    this.successMessage = null;
    this.fullSyncResult = null;
    this.fullSyncProgress = { percent: 0, message: 'Conectando…' };

    try {
      this.fullSyncResult = await this.zohoSyncService.fullSyncStream(this.org, (ev) => {
        this.fullSyncProgress = this.progressFromZohoEvent(ev);
      });

      if (this.fullSyncResult?.success) {
        const accounts = this.fullSyncResult.accounts;
        this.successMessage = `Sincronización completa: ${accounts.imported} Accounts nuevos, ${accounts.updated} actualizados. Los contactos y deals se procesaron automáticamente.`;
      }
    } catch (err: any) {
      this.error = err.error?.message || err.message || 'Error en sincronización completa';
      console.error('Error en sincronización completa:', err);
    } finally {
      this.fullSyncBusy = false;
      this.fullSyncProgress = null;
    }
  }

  /**
   * Sincronizar una solicitud específica a Zoho
   */
  async syncRequest(): Promise<void> {
    if (!this.isAdmin || !this.requestId) return;
    
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    this.syncRequestResult = null;

    try {
      this.syncRequestResult = await firstValueFrom(
        this.zohoSyncService.syncRequestById(this.requestId, this.org)
      );

      if (this.syncRequestResult?.success) {
        this.successMessage = `Solicitud ${this.requestId} sincronizada correctamente. Account ID: ${this.syncRequestResult.accountId}`;
        this.requestId = null; // Limpiar campo
      }
    } catch (err: any) {
      this.error = err.error?.message || err.message || 'Error al sincronizar solicitud';
      console.error('Error al sincronizar solicitud:', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Limpiar mensajes
   */
  clearMessages(): void {
    this.error = null;
    this.successMessage = null;
  }
}








