import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UsersService, User } from '../../services/users.service';
import { ZohoConfigService, ZohoConfig } from '../../services/zoho-config.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';

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
  activeTab: 'profile' | 'preferences' | 'security' | 'processes' | 'zoho' = 'profile';
  showPreferences = false; // Ocultar preferencias por el momento
  
  // Formularios
  profileForm: FormGroup;
  preferencesForm: FormGroup;
  passwordForm: FormGroup;
  processConfigForm: FormGroup;
  zohoConfigForm: FormGroup;
  
  // Zoho Config
  zohoConfigs: ZohoConfig[] = [];
  selectedConfig: ZohoConfig | null = null;
  isOAuthInProgress = false;
  environment = environment;
  
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
    private zohoConfigService: ZohoConfigService,
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

    this.zohoConfigForm = this.fb.group({
      org: ['startcompanies', Validators.required],
      service: ['crm', Validators.required],
      region: ['com', Validators.required],
      scopes: ['ZohoCRM.modules.ALL,ZohoCRM.settings.ALL', Validators.required],
      client_id: ['', Validators.required],
      client_secret: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();
    this.loadUserData();
    this.loadPreferences();
    if (this.isAdmin) {
      this.loadProcessConfig();
      this.loadZohoConfigs();
      this.setupOAuthListener();
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

  setActiveTab(tab: 'profile' | 'preferences' | 'security' | 'processes' | 'zoho'): void {
    this.activeTab = tab;
    this.saveSuccess = false;
    this.saveError = null;
    if (tab === 'zoho' && this.isAdmin) {
      this.loadZohoConfigs();
    }
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

  // ===== Zoho Config Methods =====
  
  loadZohoConfigs(): void {
    this.zohoConfigService.getAllConfigs().subscribe({
      next: (configs) => {
        this.zohoConfigs = configs;
        // Si hay configs, cargar la primera o buscar por org/service
        if (configs.length > 0) {
          const defaultConfig = configs.find(c => c.org === 'startcompanies' && c.service === 'crm') || configs[0];
          this.selectConfig(defaultConfig);
        }
      },
      error: (error) => {
        console.error('Error al cargar configuraciones de Zoho:', error);
        this.saveError = 'Error al cargar configuraciones de Zoho';
      }
    });
  }

  selectConfig(config: ZohoConfig): void {
    this.selectedConfig = config;
    this.zohoConfigForm.patchValue({
      org: config.org,
      service: config.service,
      region: config.region,
      scopes: config.scopes,
      client_id: config.client_id,
      client_secret: config.client_secret
    });
  }

  async authorizeZoho(): Promise<void> {
    if (this.zohoConfigForm.invalid) {
      this.markFormGroupTouched(this.zohoConfigForm);
      return;
    }

    // Si no hay configuración seleccionada o los datos han cambiado, guardar primero
    const formValue = this.zohoConfigForm.value;
    const needsSave = !this.selectedConfig || 
      this.selectedConfig.org !== formValue.org ||
      this.selectedConfig.service !== formValue.service ||
      this.selectedConfig.region !== formValue.region ||
      this.selectedConfig.client_id !== formValue.client_id ||
      this.selectedConfig.client_secret !== formValue.client_secret ||
      this.selectedConfig.scopes !== formValue.scopes;

    if (needsSave) {
      // Guardar primero
      this.isLoading = true;
      try {
        if (this.selectedConfig) {
          await firstValueFrom(
            this.zohoConfigService.updateConfig(this.selectedConfig.id, formValue)
          );
        } else {
          const created = await firstValueFrom(
            this.zohoConfigService.createConfig(formValue)
          );
          this.selectedConfig = created;
          this.zohoConfigs.push(created);
        }
        this.isLoading = false;
      } catch (error: any) {
        this.isLoading = false;
        this.saveError = error.error?.message || 'Error al guardar configuración antes de autorizar';
        return;
      }
    }

    this.isOAuthInProgress = true;
    this.saveError = null;

    try {
      const response = await firstValueFrom(
        this.zohoConfigService.getAuthorizationUrl(
          formValue.org,
          formValue.service,
          formValue.region,
          formValue.client_id,
          formValue.client_secret,
          formValue.scopes
        )
      );

      // Abrir popup para autorización
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        response.url,
        'Zoho OAuth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        this.saveError = 'No se pudo abrir la ventana de autorización. Por favor, permite ventanas emergentes.';
        this.isOAuthInProgress = false;
        return;
      }

      // El callback se manejará mediante postMessage
    } catch (error: any) {
      console.error('Error al obtener URL de autorización:', error);
      this.saveError = error.error?.message || 'Error al obtener URL de autorización';
      this.isOAuthInProgress = false;
    }
  }

  setupOAuthListener(): void {
    // Escuchar mensajes del popup de OAuth
    window.addEventListener('message', (event) => {
      if (event.data.status === 'success') {
        this.isOAuthInProgress = false;
        this.saveSuccess = true;
        this.saveError = null;
        // Recargar configuraciones
        this.loadZohoConfigs();
        setTimeout(() => this.saveSuccess = false, 5000);
      } else if (event.data.status === 'error') {
        this.isOAuthInProgress = false;
        this.saveError = event.data.message || 'Error al procesar la autenticación';
      }
    });
  }

  saveZohoConfig(): void {
    if (this.zohoConfigForm.invalid) {
      this.markFormGroupTouched(this.zohoConfigForm);
      return;
    }

    this.isLoading = true;
    this.saveError = null;

    const formValue = this.zohoConfigForm.value;

    if (this.selectedConfig) {
      // Actualizar configuración existente
      this.zohoConfigService.updateConfig(this.selectedConfig.id, formValue).subscribe({
        next: (updated) => {
          this.selectedConfig = updated;
          this.isLoading = false;
          this.saveSuccess = true;
          setTimeout(() => this.saveSuccess = false, 3000);
        },
        error: (error) => {
          console.error('Error al actualizar configuración:', error);
          this.saveError = error.error?.message || 'Error al actualizar configuración';
          this.isLoading = false;
        }
      });
    } else {
      // Crear nueva configuración
      this.zohoConfigService.createConfig(formValue).subscribe({
        next: (created) => {
          this.selectedConfig = created;
          this.zohoConfigs.push(created);
          this.isLoading = false;
          this.saveSuccess = true;
          setTimeout(() => this.saveSuccess = false, 3000);
        },
        error: (error) => {
          console.error('Error al crear configuración:', error);
          this.saveError = error.error?.message || 'Error al crear configuración';
          this.isLoading = false;
        }
      });
    }
  }

  deleteZohoConfig(config: ZohoConfig): void {
    if (!confirm(`¿Estás seguro de eliminar la configuración de ${config.org} - ${config.service}?`)) {
      return;
    }

    this.isLoading = true;
    this.zohoConfigService.deleteConfig(config.id).subscribe({
      next: () => {
        this.zohoConfigs = this.zohoConfigs.filter(c => c.id !== config.id);
        if (this.selectedConfig?.id === config.id) {
          this.selectedConfig = null;
          this.zohoConfigForm.reset({
            org: 'startcompanies',
            service: 'crm',
            region: 'com',
            scopes: 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL',
            client_id: '',
            client_secret: ''
          });
        }
        this.isLoading = false;
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: (error) => {
        console.error('Error al eliminar configuración:', error);
        this.saveError = error.error?.message || 'Error al eliminar configuración';
        this.isLoading = false;
      }
    });
  }

  createNewConfig(): void {
    this.selectedConfig = null;
    this.zohoConfigForm.reset({
      org: 'startcompanies',
      service: 'crm',
      region: 'com',
      scopes: 'ZohoCRM.modules.ALL',
      client_id: '',
      client_secret: ''
    });
  }
}







