import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WizardRequestFlowComponent } from '../../components/wizard-request-flow/wizard-request-flow.component';
import { RequestFlowContext, ServiceType, FlowStepConfig } from '../../../../shared/models/request-flow-context';
import { RequestFlowConfigService } from '../../../../shared/services/request-flow-config.service';

@Component({
  selector: 'app-wizard-request-flow-page',
  standalone: true,
  imports: [CommonModule, WizardRequestFlowComponent],
  templateUrl: './wizard-request-flow-page.component.html',
  styleUrls: ['./wizard-request-flow-page.component.css'],
})
export class WizardRequestFlowPageComponent implements OnInit {
  serviceType: ServiceType | null = null;
  flowSteps: FlowStepConfig[] = [];
  currentStepIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private flowConfig: RequestFlowConfigService,
  ) {}

  get serviceTitle(): string {
    const titles: Record<string, string> = {
      'apertura-llc': 'Apertura de LLC',
      'renovacion-llc': 'Renovación de LLC',
      'cuenta-bancaria': 'Cuenta Bancaria',
    };
    return this.serviceType ? titles[this.serviceType] || 'Formulario' : '';
  }

  get serviceTagline(): string {
    const taglines: Record<string, string> = {
      'apertura-llc': 'Te guiamos paso a paso con seguridad y cumplimiento normativo.',
      'renovacion-llc': 'Renueva tu LLC antes de que venza. Proceso simple y seguro.',
      'cuenta-bancaria': 'Abre tu cuenta bancaria para tu LLC con soporte paso a paso.',
    };
    return this.serviceType ? taglines[this.serviceType] || 'Te guiamos paso a paso.' : '';
  }

  getStepLabel(index: number): string {
    return this.flowSteps[index]?.label || 'Paso';
  }

  ngOnInit(): void {
    const fromData = this.route.snapshot.data['serviceType'] as string | undefined;
    const fromParam = this.route.snapshot.paramMap.get('serviceType');
    const raw = fromData ?? fromParam;

    if (raw === 'apertura-llc' || raw === 'renovacion-llc' || raw === 'cuenta-bancaria') {
      this.serviceType = raw;
      this.flowSteps = this.flowConfig.getFlowConfig(RequestFlowContext.WIZARD, raw, false);
      return;
    }
    if (raw === 'renovar-llc') {
      this.serviceType = 'renovacion-llc';
      this.flowSteps = this.flowConfig.getFlowConfig(RequestFlowContext.WIZARD, 'renovacion-llc', false);
      return;
    }

    this.router.navigate(['/']);
  }
}
