import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';

interface UserPreferences {
  language: 'es' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    requestUpdates: boolean;
    documentUploads: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  currentUser: User | null = null;
  isAdmin = false;
  activeTab: 'profile' | 'preferences' | 'security' | 'processes' = 'profile';
  
  // Formularios
  profileForm: FormGroup;
  preferencesForm: FormGroup;
  passwordForm: FormGroup;
  processConfigForm: FormGroup;
  
  isLoading = false;
  saveSuccess = false;
  saveError: string | null = null;

  timezones = [
    { value: 'America/Mexico_City', label: 'México (GMT-6)' },
    { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'Los Ángeles (GMT-8)' },
    { value: 'America/Chicago', label: 'Chicago (GMT-6)' },
    { value: 'UTC', label: 'UTC (GMT+0)' }
  ];

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      company: ['']
    });

    this.preferencesForm = this.fb.group({
      language: ['es'],
      theme: ['light'],
      timezone: ['America/Mexico_City'],
      notifications: this.fb.group({
        email: [true],
        push: [true],
        requestUpdates: [true],
        documentUploads: [true]
      })
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.processConfigForm = this.fb.group({
      autoAdvanceSteps: [false],
      requireApproval: [true],
      defaultAssignee: [''],
      notificationDelay: [24]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();
    this.loadUserData();
    this.loadPreferences();
    if (this.isAdmin) {
      this.loadProcessConfig();
    }
  }

  loadUserData(): void {
    if (this.currentUser) {
      this.profileForm.patchValue({
        first_name: this.currentUser.first_name || '',
        last_name: this.currentUser.last_name || '',
        email: this.currentUser.email || '',
        phone: '',
        company: ''
      });
    }
  }

  loadPreferences(): void {
    // TODO: Cargar preferencias desde el backend
    const savedPreferences = localStorage.getItem('user_preferences');
    if (savedPreferences) {
      try {
        const prefs: UserPreferences = JSON.parse(savedPreferences);
        this.preferencesForm.patchValue(prefs);
      } catch (e) {
        console.error('Error loading preferences:', e);
      }
    }
  }

  loadProcessConfig(): void {
    // TODO: Cargar configuración de procesos desde el backend
    const savedConfig = localStorage.getItem('process_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        this.processConfigForm.patchValue(config);
      } catch (e) {
        console.error('Error loading process config:', e);
      }
    }
  }

  setActiveTab(tab: 'profile' | 'preferences' | 'security' | 'processes'): void {
    this.activeTab = tab;
    this.saveSuccess = false;
    this.saveError = null;
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isLoading = true;
    this.saveError = null;

    // TODO: Guardar perfil en el backend
    setTimeout(() => {
      console.log('Guardar perfil:', this.profileForm.value);
      this.isLoading = false;
      this.saveSuccess = true;
      setTimeout(() => this.saveSuccess = false, 3000);
    }, 1000);
  }

  savePreferences(): void {
    if (this.preferencesForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.saveError = null;

    // Guardar en localStorage temporalmente
    localStorage.setItem('user_preferences', JSON.stringify(this.preferencesForm.value));
    
    // TODO: Guardar preferencias en el backend
    setTimeout(() => {
      console.log('Guardar preferencias:', this.preferencesForm.value);
      this.isLoading = false;
      this.saveSuccess = true;
      setTimeout(() => this.saveSuccess = false, 3000);
    }, 1000);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    if (this.passwordForm.value.newPassword !== this.passwordForm.value.confirmPassword) {
      this.saveError = 'Las contraseñas no coinciden';
      return;
    }

    this.isLoading = true;
    this.saveError = null;

    // TODO: Cambiar contraseña en el backend
    setTimeout(() => {
      console.log('Cambiar contraseña');
      this.isLoading = false;
      this.saveSuccess = true;
      this.passwordForm.reset();
      setTimeout(() => this.saveSuccess = false, 3000);
    }, 1000);
  }

  saveProcessConfig(): void {
    if (this.processConfigForm.invalid) {
      this.markFormGroupTouched(this.processConfigForm);
      return;
    }

    this.isLoading = true;
    this.saveError = null;

    // Guardar en localStorage temporalmente
    localStorage.setItem('process_config', JSON.stringify(this.processConfigForm.value));
    
    // TODO: Guardar configuración de procesos en el backend
    setTimeout(() => {
      console.log('Guardar configuración de procesos:', this.processConfigForm.value);
      this.isLoading = false;
      this.saveSuccess = true;
      setTimeout(() => this.saveSuccess = false, 3000);
    }, 1000);
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    return '';
  }
}

