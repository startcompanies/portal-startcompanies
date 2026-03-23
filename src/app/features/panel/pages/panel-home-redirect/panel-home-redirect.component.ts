import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Entrada canónica /panel/home: redirige al dashboard según rol.
 * No debe cargarse otro PanelLayout aquí (duplicaría header y sidebar).
 */
@Component({
  selector: 'app-panel-home-redirect',
  standalone: true,
  template: '',
})
export class PanelHomeRedirectComponent implements OnInit {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.router.navigate(['/panel/login'], { replaceUrl: true });
      return;
    }
    if (user.type === 'admin' || user.type === 'user') {
      this.router.navigate(['/panel/dashboard'], { replaceUrl: true });
    } else {
      this.router.navigate(['/panel/client-dashboard'], { replaceUrl: true });
    }
  }
}
