import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PanelClientRequestFlowComponent } from '../../components/panel-client-request-flow/panel-client-request-flow.component';
import { ServiceType } from '../../../../shared/models/request-flow-context';

@Component({
  selector: 'app-panel-client-request-flow-page',
  standalone: true,
  imports: [CommonModule, PanelClientRequestFlowComponent],
  template: `
    <app-panel-client-request-flow
      *ngIf="serviceType"
      [serviceType]="serviceType"
    ></app-panel-client-request-flow>
  `,
})
export class PanelClientRequestFlowPageComponent implements OnInit {
  serviceType: ServiceType | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('serviceType');
    if (raw === 'apertura-llc' || raw === 'renovacion-llc' || raw === 'cuenta-bancaria') {
      this.serviceType = raw;
      return;
    }
    this.router.navigate(['/panel/my-requests']);
  }
}

