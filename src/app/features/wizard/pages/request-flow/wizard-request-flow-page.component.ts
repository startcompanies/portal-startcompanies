import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WizardRequestFlowComponent } from '../../components/wizard-request-flow/wizard-request-flow.component';
import { ServiceType } from '../../../../shared/models/request-flow-context';

@Component({
  selector: 'app-wizard-request-flow-page',
  standalone: true,
  imports: [CommonModule, WizardRequestFlowComponent],
  template: `
    <app-wizard-request-flow
      *ngIf="serviceType"
      [serviceType]="serviceType"
    ></app-wizard-request-flow>
  `,
})
export class WizardRequestFlowPageComponent implements OnInit {
  serviceType: ServiceType | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // Prioridad: data de ruta (ej. apertura-llc, renovar-llc con sus URLs) y luego param (wizard/flow/:serviceType)
    const fromData = this.route.snapshot.data['serviceType'] as string | undefined;
    const fromParam = this.route.snapshot.paramMap.get('serviceType');
    const raw = fromData ?? fromParam;

    if (raw === 'apertura-llc' || raw === 'renovacion-llc' || raw === 'cuenta-bancaria') {
      this.serviceType = raw;
      return;
    }
    // URL renovar-llc se mapea al serviceType renovacion-llc
    if (raw === 'renovar-llc') {
      this.serviceType = 'renovacion-llc';
      return;
    }

    this.router.navigate(['/']);
  }
}

