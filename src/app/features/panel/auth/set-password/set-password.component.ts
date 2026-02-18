import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './set-password.component.html',
  styleUrl: './set-password.component.css'
})
export class SetPasswordComponent implements OnInit {
  setPasswordForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  resetToken: string | null = null;
  
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
    private authService: AuthService
  ) {
    this.setPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Verificar si hay un token en la URL
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.resetToken = params['token'];
      } else {
        this.errorMessage = 'Token de invitación no válido o faltante.';
      }
    });
  }
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  calculatePasswordStrength(password: string): void {
    if (!password || password.length === 0) {
      this.passwordStrength = null;
      this.passwordStrengthText = '';
      this.passwordStrengthClass = '';
      return;
    }
    
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    if (password.length < 8) {
      this.passwordStrength = 'weak';
      this.passwordStrengthText = 'Muy débil - mínimo 8 caracteres';
      this.passwordStrengthClass = 'text-danger';
    } else if (score <= 3) {
      this.passwordStrength = 'weak';
      this.passwordStrengthText = 'Débil';
      this.passwordStrengthClass = 'text-danger';
    } else if (score <= 5) {
      this.passwordStrength = 'medium';
      this.passwordStrengthText = 'Media';
      this.passwordStrengthClass = 'text-warning';
    } else {
      this.passwordStrength = 'strong';
      this.passwordStrengthText = 'Fuerte';
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
    if (this.setPasswordForm.valid && this.resetToken) {
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;

      this.authService.resetPassword(
        this.resetToken,
        this.setPasswordForm.value.password
      ).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Contraseña establecida exitosamente. Redirigiendo al login...';
          setTimeout(() => {
            this.router.navigate(['/panel/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al establecer la contraseña. El token puede haber expirado.';
          console.error('Set password error:', error);
        }
      });
    } else {
      this.setPasswordForm.markAllAsTouched();
    }
  }

  get password() {
    return this.setPasswordForm.get('password');
  }

  get confirmPassword() {
    return this.setPasswordForm.get('confirmPassword');
  }

  get passwordMismatch() {
    return this.setPasswordForm.errors?.['passwordMismatch'] && 
           this.confirmPassword?.touched;
  }
}









