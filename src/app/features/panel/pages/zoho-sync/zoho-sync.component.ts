import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ZohoSyncService, ImportAccountsResponse, ImportDealsResponse, FullSyncResponse, SyncRequestResponse } from '../../services/zoho-sync.service';
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
  
  // Errores
  error: string | null = null;
  successMessage: string | null = null;

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
    
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    this.accountsResult = null;

    try {
      this.accountsResult = await firstValueFrom(
        this.zohoSyncService.importAccounts(this.org, this.accountsLimit, this.accountsOffset)
      );

      if (this.accountsResult?.success) {
        this.successMessage = `Importación completada: ${this.accountsResult.imported} nuevos, ${this.accountsResult.updated} actualizados, ${this.accountsResult.errors.length} errores`;
      }
    } catch (err: any) {
      this.error = err.error?.message || err.message || 'Error al importar Accounts';
      console.error('Error al importar Accounts:', err);
    } finally {
      this.isLoading = false;
    }
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
   * Sincronización completa
   */
  async fullSync(): Promise<void> {
    if (!this.isAdmin) return;
    
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    this.fullSyncResult = null;

    try {
      this.fullSyncResult = await firstValueFrom(
        this.zohoSyncService.fullSync(this.org, this.accountsLimit, this.dealsLimit)
      );

      if (this.fullSyncResult?.success) {
        const accounts = this.fullSyncResult.accounts;
        this.successMessage = `Sincronización completa: ${accounts.imported} Accounts nuevos, ${accounts.updated} actualizados. Los contactos y deals se procesaron automáticamente.`;
      }
    } catch (err: any) {
      this.error = err.error?.message || err.message || 'Error en sincronización completa';
      console.error('Error en sincronización completa:', err);
    } finally {
      this.isLoading = false;
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





