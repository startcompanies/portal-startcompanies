import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceType } from '../../../../shared/models/request-flow-context';

/**
 * Redirige request-flow/client/:serviceType y request-flow/partner/:serviceType
 * a la entrada canónica del flujo: /panel/new-request (con queryParams).
 * Así todo el flujo del panel pasa por NewRequestComponent y BaseRequestFlowComponent.
 */
@Component({
  selector: 'app-request-flow-redirect',
  standalone: true,
  template: `<div class="p-3 text-muted">Redirigiendo...</div>`,
})
export class RequestFlowRedirectComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const serviceType = this.route.snapshot.paramMap.get('serviceType') as ServiceType | null;
    const queryParams = { ...this.route.snapshot.queryParams };
    if (serviceType && ['apertura-llc', 'renovacion-llc', 'cuenta-bancaria'].includes(serviceType)) {
      this.router.navigate(['/panel/new-request'], {
        queryParams: { ...queryParams, serviceType },
        replaceUrl: true,
      });
    } else {
      this.router.navigate(['/panel/my-requests'], { replaceUrl: true });
    }
  }
}
