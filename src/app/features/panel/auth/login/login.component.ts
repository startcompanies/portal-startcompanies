import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    // Validaciones comentadas temporalmente para maquetación
    // Contraseña precargada para usuarios mockup
    this.loginForm = this.fb.group({
      email: ['admin@test.com'],
      password: ['test123']
    });
  }

  onSubmit() {
    // Validaciones comentadas temporalmente para maquetación
    // if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;

      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: () => {
          this.isLoading = false;
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          
          if (returnUrl) {
            this.router.navigate([returnUrl]);
            return;
          }
          
          // Redirigir según el tipo de usuario
          const user = this.authService.getCurrentUser();
          if (user?.type === 'admin') {
            this.router.navigate(['/panel/dashboard']);
          } else {
            this.router.navigate(['/panel/client-dashboard']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
          console.error('Login error:', error);
        }
      });
    // } else {
    //   this.loginForm.markAllAsTouched();
    // }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
