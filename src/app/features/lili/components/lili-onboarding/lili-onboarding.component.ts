import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LiliService } from '../../services/lili.service';
import { environment } from '../../../../../environments/environment';
import { parseLiliLinkToken } from '../../utils/lili-link-token.util';

@Component({
  selector: 'app-lili-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lili-onboarding.component.html',
  styleUrl: './lili-onboarding.component.css',
})
export class LiliOnboardingComponent implements OnInit, OnDestroy {
  readonly onboardingLogo = 'assets/logos/startcompaniestwocolors.png';

  loading = true;
  error = false;

  private scriptEl: HTMLScriptElement | null = null;

  constructor(
    private route: ActivatedRoute,
    private liliService: LiliService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  async ngOnInit() {
    try {
      const rawToken = this.route.snapshot.queryParams['t'];
      const payload = parseLiliLinkToken(rawToken);

      if (!payload) {
        throw new Error('Invalid Lili link token');
      }

      const applicationData = {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        businessName: payload.businessName,
      };

      const { token } = await this.liliService.createApplication(applicationData);

      this.loading = false;
      setTimeout(() => this.injectLiliScript(token), 100);
    } catch (err) {
      console.error('[Lili] Error al iniciar onboarding:', err);
      this.loading = false;
      this.error = true;
    }
  }

  private injectLiliScript(token: string): void {
    const existing = this.document.getElementById('lili-onboarding-iframe');
    if (existing) existing.remove();

    const script = this.document.createElement('script');
    script.src = 'https://cdn.lili.co/connect.min.js';
    script.id = 'lili-onboarding-iframe';
    script.setAttribute('data-target-div', 'lili');
    script.setAttribute('data-token', token);
    script.setAttribute('data-env', environment.liliEnv);
    this.document.body.appendChild(script);
    this.scriptEl = script;
  }

  ngOnDestroy(): void {
    if (this.scriptEl) {
      this.scriptEl.remove();
      this.scriptEl = null;
    }
  }
}
