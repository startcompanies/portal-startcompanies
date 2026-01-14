import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
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
  resetToken: string | null = null;
  isResetMode = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
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

      this.authService.forgotPassword(this.resetForm.value.email).subscribe({
        next: () => {
          this.isLoading = false;
          this.emailSent = true;
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al enviar el correo. Verifica tu email e intenta nuevamente.';
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
          this.successMessage = 'Contraseña restablecida exitosamente. Redirigiendo al login...';
          setTimeout(() => {
            this.router.navigate(['/panel/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al restablecer la contraseña. El token puede haber expirado.';
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
