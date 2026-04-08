import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LiliEmbedService } from '../../services/lili-embed.service';
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

  constructor(
    private route: ActivatedRoute,
    private liliEmbed: LiliEmbedService,
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

      this.loading = false;
      setTimeout(async () => {
        try {
          await this.liliEmbed.mountEmbed(applicationData);
        } catch (e) {
          console.error('[Lili] Error al montar embed:', e);
          this.error = true;
        }
      }, 100);
    } catch (err) {
      console.error('[Lili] Error al iniciar onboarding:', err);
      this.loading = false;
      this.error = true;
    }
  }

  ngOnDestroy(): void {
    this.liliEmbed.removeConnectScript();
  }
}
