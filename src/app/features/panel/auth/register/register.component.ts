import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, TranslocoPipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
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
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;

      const nameParts = this.registerForm.value.name.split(' ');
      const registerData = {
        username: this.registerForm.value.email.split('@')[0],
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || ''
      };

      this.authService.register(registerData).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Registro exitoso. Redirigiendo al login...';
          setTimeout(() => {
            this.router.navigate(['/panel/login']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al registrar. Intenta nuevamente.';
          console.error('Register error:', error);
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  get name() {
    return this.registerForm.get('name');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get passwordMismatch() {
    return this.registerForm.errors?.['passwordMismatch'] && 
           this.confirmPassword?.touched;
  }
}
