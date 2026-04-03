import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';
import { LoginComponent } from '../../auth/login/login.component';
import { RegisterComponent } from '../../auth/register/register.component';
import { ResetPasswordComponent } from '../../auth/reset-password/reset-password.component';
import { SetPasswordComponent } from '../../auth/set-password/set-password.component';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { PanelLanguageService } from '../../services/panel-language.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, LoginComponent, RegisterComponent, ResetPasswordComponent, SetPasswordComponent, RouterLink, ResponsiveImageComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css'
})
export class AuthLayoutComponent implements OnInit {
  currentRoute: string = '';

  /* Login con fondo oscuro en vista: usar logo (blanco/negativo) */
  logoImages = {
    mobile: '/assets/logo-mobile.webp',
    tablet: '/assets/logo-tablet.webp',
    desktop: '/assets/logo.webp',
    fallback: '/assets/logo.png',
    alt: 'Start Companies Logo',
    priority: true
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private panelLanguage: PanelLanguageService,
    private transloco: TranslocoService,
  ) {
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
    this.currentRoute = this.router.url;
  }

  ngOnInit(): void {
    const lang = this.panelLanguage.getPreferredLang();
    this.panelLanguage.applyStoredLanguage();
    void firstValueFrom(this.transloco.load(lang).pipe(take(1))).catch(() => {});
  }

  get isLogin() {
    return this.currentRoute.includes('/login');
  }

  get isRegister() {
    return this.currentRoute.includes('/register');
  }

  get isResetPassword() {
    return this.currentRoute.includes('/reset-password') && !this.currentRoute.includes('/set-password');
  }

  get isSetPassword() {
    return this.currentRoute.includes('/set-password');
  }
}
