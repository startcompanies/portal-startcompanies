import { Component } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginComponent } from '../../auth/login/login.component';
import { RegisterComponent } from '../../auth/register/register.component';
import { ResetPasswordComponent } from '../../auth/reset-password/reset-password.component';
import { SetPasswordComponent } from '../../auth/set-password/set-password.component';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, LoginComponent, RegisterComponent, ResetPasswordComponent, SetPasswordComponent, RouterLink, ResponsiveImageComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css'
})
export class AuthLayoutComponent {
  currentRoute: string = '';

  logoImages = {
    mobile: '/assets/logo-mobile.webp',
    tablet: '/assets/logo-tablet.webp',
    desktop: '/assets/logo.webp',
    fallback: '/assets/logo.webp',
    alt: 'Start Companies Logo',
    priority: true
  };

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
    this.currentRoute = this.router.url;
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
