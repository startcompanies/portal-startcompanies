import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, TranslocoPipe],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  resetPasswordForm: FormGroup;
  isLoading = false;
  emailSent = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  forgotPasswordMessage: string | null = null;
  resetToken: string | null = null;
  isResetMode = false;
  
  // Control de visibilidad de contraseñas
  showPassword = false;
  showConfirmPassword = false;
  
  // Indicador de seguridad de contraseña (igual que basic register del wizard)
  passwordStrength: 'weak' | 'medium' | 'strong' | null = null;
  passwordStrengthText = '';
  passwordStrengthClass = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private transloco: TranslocoService
  ) {
    // Formulario para solicitar reset (forgot-password)
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Formulario para resetear contraseña con token
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Verificar si hay un token en la URL (modo reset)
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.resetToken = params['token'];
        this.isResetMode = true;
      }
    });
  }
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  /**
   * Calcula la fortaleza de la contraseña (igual que en el wizard)
   */
  calculatePasswordStrength(password: string): void {
    if (!password || password.length === 0) {
      this.passwordStrength = null;
      this.passwordStrengthText = '';
      this.passwordStrengthClass = '';
      return;
    }
    
    let score = 0;
    
    // Longitud mínima
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Contiene minúsculas
    if (/[a-z]/.test(password)) score++;
    
    // Contiene mayúsculas
    if (/[A-Z]/.test(password)) score++;
    
    // Contiene números
    if (/[0-9]/.test(password)) score++;
    
    // Contiene caracteres especiales
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    // Determinar nivel
    if (password.length < 8) {
      this.passwordStrength = 'weak';
      this.passwordStrengthText = this.transloco.translate('PANEL.auth.pwd_strength_very_weak');
      this.passwordStrengthClass = 'text-danger';
    } else if (score <= 3) {
      this.passwordStrength = 'weak';
      this.passwordStrengthText = this.transloco.translate('PANEL.auth.pwd_strength_weak');
      this.passwordStrengthClass = 'text-danger';
    } else if (score <= 5) {
      this.passwordStrength = 'medium';
      this.passwordStrengthText = this.transloco.translate('PANEL.auth.pwd_strength_medium');
      this.passwordStrengthClass = 'text-warning';
    } else {
      this.passwordStrength = 'strong';
      this.passwordStrengthText = this.transloco.translate('PANEL.auth.pwd_strength_strong');
      this.passwordStrengthClass = 'text-success';
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.resetForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;
      this.emailSent = false;
      this.forgotPasswordMessage = null;

      this.authService.forgotPassword(this.resetForm.value.email).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.emailSent = true;
          // El backend devuelve un message genérico (por seguridad).
          this.forgotPasswordMessage =
            res?.message ||
            this.transloco.translate('PANEL.auth.forgot_pwd_generic_success');
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error?.error?.message ??
            error?.message ??
            this.transloco.translate('PANEL.auth.forgot_pwd_send_error');
          console.error('Forgot password error:', error);
        }
      });
    } else {
      this.resetForm.markAllAsTouched();
    }
  }

  onResetPassword() {
    if (this.resetPasswordForm.valid && this.resetToken) {
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;

      this.authService.resetPassword(
        this.resetToken,
        this.resetPasswordForm.value.password
      ).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = this.transloco.translate('PANEL.auth.reset_success_redirect');
          setTimeout(() => {
            this.router.navigate(['/panel/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || this.transloco.translate('PANEL.auth.reset_error_expired');
          console.error('Reset password error:', error);
        }
      });
    } else {
      this.resetPasswordForm.markAllAsTouched();
    }
  }

  get email() {
    return this.resetForm.get('email');
  }

  get password() {
    return this.resetPasswordForm.get('password');
  }

  get confirmPassword() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  get passwordMismatch() {
    return this.resetPasswordForm.errors?.['passwordMismatch'] && 
           this.confirmPassword?.touched;
  }
}
