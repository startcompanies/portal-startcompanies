import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PanelPartnerRequestFlowComponent } from '../../components/panel-partner-request-flow/panel-partner-request-flow.component';
import { ServiceType } from '../../../../shared/models/request-flow-context';

@Component({
  selector: 'app-panel-partner-request-flow-page',
  standalone: true,
  imports: [CommonModule, PanelPartnerRequestFlowComponent],
  template: `
    <app-panel-partner-request-flow
      *ngIf="serviceType"
      [serviceType]="serviceType"
      [draftRequestUuid]="draftRequestUuid"
      [initialClientId]="initialClientId"
    ></app-panel-partner-request-flow>
  `,
})
export class PanelPartnerRequestFlowPageComponent implements OnInit {
  serviceType: ServiceType | null = null;
  draftRequestUuid: string | null = null;
  initialClientId: number | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // Obtener serviceType de la ruta
    const raw = this.route.snapshot.paramMap.get('serviceType');
    if (raw === 'apertura-llc' || raw === 'renovacion-llc' || raw === 'cuenta-bancaria') {
      this.serviceType = raw;
    } else {
      this.router.navigate(['/panel/my-requests']);
      return;
    }
    
    // Obtener UUID de borrador si existe (query param o ruta)
    const uuid = this.route.snapshot.params['uuid'] || this.route.snapshot.queryParams['uuid'];
    if (uuid) {
      this.draftRequestUuid = uuid;
    }
    
    // Obtener clientId inicial si existe (query param)
    const clientId = this.route.snapshot.queryParams['clientId'];
    if (clientId) {
      this.initialClientId = parseInt(clientId, 10);
    }
  }
}

