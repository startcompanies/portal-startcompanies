import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, TranslocoPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  otpForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;
  showPassword = false;
  loginStep: 'credentials' | 'otp' = 'credentials';
  challengeId: string | null = null;
  showTrustBrowserModal = false;
  trustBrowserSaving = false;
  trustBrowserError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
    this.otpForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  ngOnInit(): void {
    this.authService.authReady$.pipe(take(1)).subscribe(() => {
      const u = this.authService.getCurrentUser();
      if (u) {
        this.navigateAfterLogin(u);
      }
    });
  }


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private navigateAfterLogin(user: { type?: string } | null): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      void this.router.navigateByUrl(returnUrl);
      return;
    }
    if (user?.type === 'admin' || user?.type === 'user') {
      void this.router.navigate(['/panel/dashboard']);
    } else {
      void this.router.navigate(['/panel/client-dashboard']);
    }
  }

  onSubmitCredentials(): void {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    this.infoMessage = null;

    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login({ email, password, rememberMe: !!rememberMe }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if ('step' in res && res.step === 'second_factor') {
          this.challengeId = res.challengeId;
          this.loginStep = 'otp';
          this.infoMessage =
            res.message ??
            'Te enviamos un código de 6 dígitos. Revísalo en tu correo.';
          this.otpForm.reset();
          return;
        }
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          void this.router.navigateByUrl(returnUrl);
          return;
        }
        this.navigateAfterLogin(this.authService.getCurrentUser());
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message ?? error?.message ?? 'Error al iniciar sesión.';
      },
    });
  }

  onSubmitOtp(): void {
    if (!this.otpForm.valid || !this.challengeId) {
      this.otpForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;

    const code = this.otpForm.value.code as string;

    this.authService.verifyLoginOtp(this.challengeId, code).subscribe({
      next: () => {
        this.isLoading = false;
        this.showTrustBrowserModal = true;
        this.trustBrowserError = null;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message ?? error?.message ?? 'Código incorrecto o caducado.';
      },
    });
  }

  resendOtp(): void {
    if (!this.challengeId || this.isLoading) {
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    this.authService.resendLoginOtp(this.challengeId).subscribe({
      next: (r) => {
        this.isLoading = false;
        this.infoMessage = r?.message ?? 'Código reenviado.';
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message ?? error?.message ?? 'No se pudo reenviar el código.';
      },
    });
  }

  dismissTrustBrowserRemember(): void {
    this.showTrustBrowserModal = false;
    this.navigateAfterLogin(this.authService.getCurrentUser());
  }

  confirmTrustBrowser(): void {
    this.trustBrowserSaving = true;
    this.trustBrowserError = null;
    this.authService.registerTrustedDevice().subscribe({
      next: () => {
        this.trustBrowserSaving = false;
        this.showTrustBrowserModal = false;
        this.navigateAfterLogin(this.authService.getCurrentUser());
      },
      error: () => {
        this.trustBrowserSaving = false;
        this.trustBrowserError = 'PANEL.auth.trust_browser_error';
      },
    });
  }

  backToCredentials(): void {
    this.loginStep = 'credentials';
    this.challengeId = null;
    this.errorMessage = null;
    this.infoMessage = null;
    this.otpForm.reset();
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get otpCode() {
    return this.otpForm.get('code');
  }
}
