import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../services/auth.service';
import { LiliEmbedService } from '../../../lili/services/lili-embed.service';

/** id del contenedor: `data-target-div` para connect.min.js (div distinto al id fijo del `<script>` de Lili). */
const LILI_PANEL_TARGET_DIV_ID = 'lili-panel-embed';

@Component({
  selector: 'app-lili-request',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './lili-request.component.html',
  styleUrl: './lili-request.component.css',
})
export class LiliRequestComponent implements OnInit, OnDestroy {
  /** Overlay de carga; el div del embed sigue visible debajo (Lili requiere el nodo en el layout). */
  loading = false;
  error = false;
  missingEmail = false;

  constructor(
    private readonly auth: AuthService,
    private readonly liliEmbed: LiliEmbedService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.loading = false;
      this.missingEmail = true;
      return;
    }
    const email = user.email?.trim();
    if (!email) {
      this.loading = false;
      this.missingEmail = true;
      return;
    }

    const firstName = user.first_name?.trim() || undefined;
    const lastName = user.last_name?.trim() || undefined;
    const businessName = user.company?.trim() || undefined;

    this.loading = true;
    this.cdr.detectChanges();

    try {
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 50));
      await this.liliEmbed.mountEmbed(
        {
          email,
          firstName,
          lastName,
          businessName,
        },
        { targetDivId: LILI_PANEL_TARGET_DIV_ID },
      );
    } catch (e) {
      console.error('[Lili] Error en solicitud desde panel:', e);
      this.error = true;
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.liliEmbed.removeConnectScript();
  }
}
