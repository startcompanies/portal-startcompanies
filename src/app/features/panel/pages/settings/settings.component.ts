import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UsersService, User } from '../../services/users.service';

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
  showPreferences = false; // Ocultar preferencias por el momento
  
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
    private usersService: UsersService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      full_name: ['', Validators.required], // Nombre completo en un solo campo
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
    // Cargar datos actualizados desde el backend
    this.usersService.getCurrentUser().subscribe({
      next: (user) => {
        // Convertir User de UsersService a formato compatible
        this.currentUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          type: user.type as 'client' | 'partner' | 'admin',
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          company: user.company
        };
        
        // Combinar first_name y last_name en un solo campo
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        
        this.profileForm.patchValue({
          full_name: fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          company: user.company || ''
        });
      },
      error: (error) => {
        console.error('Error al cargar datos del usuario:', error);
        // Fallback a datos del token si falla la petición
        const authUser = this.authService.getCurrentUser();
        if (authUser) {
          this.currentUser = authUser;
          const fullName = `${authUser.first_name || ''} ${authUser.last_name || ''}`.trim();
          this.profileForm.patchValue({
            full_name: fullName || '',
            email: authUser.email || '',
            phone: authUser.phone || '',
            company: authUser.company || ''
          });
        }
      }
    });
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

    // Separar nombre completo en first_name y last_name
    const fullName = this.profileForm.value.full_name.trim();
    const nameParts = fullName.split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    const updateData = {
      first_name,
      last_name,
      phone: this.profileForm.value.phone || undefined,
      company: this.profileForm.value.company || undefined
    };

    // Llamar al backend para actualizar el perfil
    this.usersService.updateCurrentUser(updateData).subscribe({
      next: (updatedUser) => {
        // Actualizar el usuario en el servicio de auth
        this.currentUser = {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          status: updatedUser.status,
          type: updatedUser.type as 'client' | 'partner' | 'admin',
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          phone: updatedUser.phone,
          company: updatedUser.company
        };
        this.isLoading = false;
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: (error) => {
        console.error('Error al actualizar perfil:', error);
        this.saveError = error.error?.message || 'Error al guardar los cambios. Intenta nuevamente.';
        this.isLoading = false;
      }
    });
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


