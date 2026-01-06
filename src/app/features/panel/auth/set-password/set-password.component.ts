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








