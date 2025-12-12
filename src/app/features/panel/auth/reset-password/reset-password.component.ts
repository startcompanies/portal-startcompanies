import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  resetForm: FormGroup;
  isLoading = false;
  emailSent = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.resetForm.valid) {
      this.isLoading = true;
      // TODO: Implementar lógica de reset password
      console.log('Reset password data:', this.resetForm.value);
      
      // Simulación de envío de email
      setTimeout(() => {
        this.isLoading = false;
        this.emailSent = true;
      }, 1000);
    } else {
      this.resetForm.markAllAsTouched();
    }
  }

  get email() {
    return this.resetForm.get('email');
  }
}
