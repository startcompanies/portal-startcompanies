import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LiliApplicationPayload, LiliService } from './lili.service';
import { environment } from '../../../../environments/environment';

/**
 * connect.min.js de Lili hace `getElementById('lili-onboarding-iframe')` de forma fija;
 * el `<script>` que carga ese bundle debe usar exactamente este id.
 */
export const LILI_CONNECT_SCRIPT_ELEMENT_ID = 'lili-onboarding-iframe';

export interface LiliEmbedMountOptions {
  /** id del div destino (atributo `data-target-div`). Debe existir en el DOM y ser visible. */
  targetDivId?: string;
}

@Injectable({ providedIn: 'root' })
export class LiliEmbedService {
  constructor(
    private readonly liliService: LiliService,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  /**
   * Solo inyecta `connect.min.js` (el contenedor `#targetDivId` debe existir y no estar con `display:none`).
   */
  injectConnectScript(token: string, options?: LiliEmbedMountOptions): void {
    const targetDivId = options?.targetDivId ?? 'lili';
    this.removeConnectScript();

    const script = this.document.createElement('script');
    script.src = 'https://cdn.lili.co/connect.min.js';
    script.id = LILI_CONNECT_SCRIPT_ELEMENT_ID;
    script.setAttribute('data-target-div', targetDivId);
    script.setAttribute('data-token', token);
    script.setAttribute('data-env', environment.liliEnv);
    this.document.body.appendChild(script);
  }

  /**
   * Crea la aplicación en Lili e inyecta `connect.min.js` apuntando al div indicado (por defecto `lili`).
   */
  async mountEmbed(
    applicationData: LiliApplicationPayload,
    options?: LiliEmbedMountOptions,
  ): Promise<void> {
    const { token } = await this.liliService.createApplication(applicationData);
    this.injectConnectScript(token, options);
  }

  /** Quita el script de Lili del DOM (id fijado por su SDK). */
  removeConnectScript(): void {
    this.document.getElementById(LILI_CONNECT_SCRIPT_ELEMENT_ID)?.remove();
  }
}
