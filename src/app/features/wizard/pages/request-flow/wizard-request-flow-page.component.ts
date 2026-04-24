import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardRequestFlowComponent } from '../../components/wizard-request-flow/wizard-request-flow.component';
import { RequestFlowContext, ServiceType, FlowStepConfig } from '../../../../shared/models/request-flow-context';
import { RequestFlowConfigService } from '../../../../shared/services/request-flow-config.service';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { WizardStateService } from '../../services/wizard-state.service';
import { RequestFlowStateService } from '../../../../shared/services/request-flow-state.service';
import { buildFlowScopeKey } from '../../../../shared/utils/flow-scope-key.util';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-wizard-request-flow-page',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, WizardRequestFlowComponent, ResponsiveImageComponent, RouterLink],
  templateUrl: './wizard-request-flow-page.component.html',
  styleUrls: ['./wizard-request-flow-page.component.css'],
})
export class WizardRequestFlowPageComponent implements OnInit {
  serviceType: ServiceType | null = null;
  flowSource: 'wizard' | 'crm-lead' | 'panel' = 'wizard';
  flowSteps: FlowStepConfig[] = [];
  currentStepIndex = 0;

  /* Fondo oscuro del wizard: usar logo (blanco/negativo) */
  logoImages = {
    mobile: '/assets/logo-mobile.webp',
    tablet: '/assets/logo-tablet.webp',
    desktop: '/assets/logo.webp',
    fallback: '/assets/logo.png',
    alt: 'Start Companies Logo',
    priority: false,
  };

  constructor(
    private route: ActivatedRoute,
    private flowConfig: RequestFlowConfigService,
    private wizardStateService: WizardStateService,
    private requestFlowStateService: RequestFlowStateService,
  ) {}

  /** Clave de traducción para el título del servicio (sidebar). */
  get serviceTitleKey(): string {
    const keys: Record<string, string> = {
      'apertura-llc': 'WIZARD.flow.llc_title',
      'renovacion-llc': 'WIZARD.flow.renovation_title',
      'cuenta-bancaria': 'WIZARD.flow.bank_account_title',
    };
    return this.serviceType ? keys[this.serviceType] || 'WIZARD.flow.llc_title' : 'WIZARD.flow.llc_title';
  }

  /** Clave de traducción para el tagline del servicio (sidebar). */
  get serviceTaglineKey(): string {
    const keys: Record<string, string> = {
      'apertura-llc': 'WIZARD.flow.llc_tagline',
      'renovacion-llc': 'WIZARD.flow.renovation_tagline',
      'cuenta-bancaria': 'WIZARD.flow.bank_account_tagline',
    };
    return this.serviceType ? keys[this.serviceType] || 'WIZARD.flow.llc_tagline' : 'WIZARD.flow.llc_tagline';
  }

  getStepLabel(index: number): string {
    return this.flowSteps[index]?.label || 'WIZARD.steps.step_register';
  }

  ngOnInit(): void {
    const sourceFromData = this.route.snapshot.data['source'] as 'wizard' | 'crm-lead' | 'panel' | undefined;
    this.flowSource = sourceFromData || 'wizard';
    this.wizardStateService.setFlowSource(this.flowSource);

    const fromData = this.route.snapshot.data['serviceType'] as string | undefined;
    const fromParam = this.route.snapshot.paramMap.get('serviceType');
    const raw = fromData ?? fromParam;

    if (raw === 'apertura-llc' || raw === 'renovacion-llc' || raw === 'cuenta-bancaria') {
      this.serviceType = raw;
      this.requestFlowStateService.setActiveScope(
        buildFlowScopeKey({
          context: RequestFlowContext.WIZARD,
          serviceType: raw,
          flowSource: this.flowSource,
        }),
      );
      this.flowSteps = this.flowConfig.getFlowConfig(RequestFlowContext.WIZARD, raw, false, false, this.flowSource);
      return;
    }
    if (raw === 'renovar-llc') {
      this.serviceType = 'renovacion-llc';
      this.requestFlowStateService.setActiveScope(
        buildFlowScopeKey({
          context: RequestFlowContext.WIZARD,
          serviceType: 'renovacion-llc',
          flowSource: this.flowSource,
        }),
      );
      this.flowSteps = this.flowConfig.getFlowConfig(RequestFlowContext.WIZARD, 'renovacion-llc', false, false, this.flowSource);
      return;
    }

    window.location.assign(`${environment.baseUrl}/`);
  }
}
