import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../services/auth.service';
import { UsersService, User } from '../../services/users.service';
import {
  ZohoConfigService,
  ZohoConfig,
  ZohoConfigDto,
  UpdateZohoConfigDto,
} from '../../services/zoho-config.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { BrowserService } from '../../../../shared/services/browser.service';
import { PanelLanguageService } from '../../services/panel-language.service';
import {
  PanelPreferencesService,
  PanelUserPreferences,
} from '../../services/panel-preferences.service';
import { SafeDatePipe } from '../../../../shared/pipes/safe-date.pipe';
import { normalizeAuthEmailInput } from '../../../../shared/utils/normalize-auth-email';
import { BillingAccessService } from '../../services/billing-access.service';
import { BillingViewState } from '../../../../shared/models/billing-access.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslocoPipe, SafeDatePipe],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  currentUser: User | null = null;
  isAdmin = false;
  activeTab: 'profile' | 'preferences' | 'security' | 'subscription' | 'zoho' = 'profile';
  showPreferences = true;
  billingState: BillingViewState | null = null;
  isStartingCheckout = false;
  isOpeningPortal = false;

  profileForm: FormGroup;
  preferencesForm: FormGroup;
  passwordForm: FormGroup;
  zohoConfigForm: FormGroup;

  zohoConfigs: ZohoConfig[] = [];
  selectedConfig: ZohoConfig | null = null;
  isOAuthInProgress = false;
  environment = environment;

  isLoading = false;
  saveSuccess = false;
  saveError: string | null = null;

  emailChangeRequested = false;
  emailChangePending = false;
  emailChangeError: string | null = null;

  private readonly authChangePasswordUrl = `${environment.apiUrl || 'http://localhost:3000'}/auth/change-password`;

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private zohoConfigService: ZohoConfigService,
    private fb: FormBuilder,
    private browser: BrowserService,
    private panelLanguage: PanelLanguageService,
    private panelPreferences: PanelPreferencesService,
    private transloco: TranslocoService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private billingAccess: BillingAccessService,
  ) {
    this.profileForm = this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      company: [''],
    });

    this.preferencesForm = this.fb.group({
      language: ['es'],
      theme: ['light'],
      timezone: ['America/Mexico_City'],
      notifications: this.fb.group({
        email: [true],
        push: [true],
        requestUpdates: [true],
        documentUploads: [true],
      }),
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );

    this.zohoConfigForm = this.fb.group({
      org: ['startcompanies', Validators.required],
      service: ['crm', Validators.required],
      region: ['com', Validators.required],
      scopes: ['ZohoCRM.modules.ALL,ZohoCRM.settings.ALL', Validators.required],
      client_id: ['', Validators.required],
      client_secret: ['', Validators.required],
    });

    this.zohoConfigForm.get('service')?.valueChanges.subscribe((service) => {
      if (service === 'workdrive') {
        this.zohoConfigForm.patchValue({
          scopes: 'WorkDrive.files.sharing.CREATE,WorkDrive.files.ALL',
        });
      } else if (service === 'crm') {
        this.zohoConfigForm.patchValue({
          scopes: 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL',
        });
      }
    });

    this.applyZohoCredentialValidators();
  }

  private applyZohoCredentialValidators(): void {
    const cid = this.zohoConfigForm.get('client_id');
    const csec = this.zohoConfigForm.get('client_secret');
    cid?.setValidators([Validators.required]);
    if (!this.selectedConfig || !this.selectedConfig.zohoOAuthClientSecretConfigured) {
      csec?.setValidators([Validators.required]);
    } else {
      csec?.setValidators([]);
    }
    cid?.updateValueAndValidity({ emitEvent: false });
    csec?.updateValueAndValidity({ emitEvent: false });
  }

  private buildZohoUpdatePayload(): UpdateZohoConfigDto {
    const v = this.zohoConfigForm.getRawValue();
    const payload: UpdateZohoConfigDto = {
      org: v.org,
      service: v.service,
      region: v.region,
      scopes: v.scopes,
      client_id: v.client_id,
    };
    if (v.client_secret?.trim()) {
      payload.client_secret = v.client_secret.trim();
    }
    return payload;
  }

  private buildZohoCreatePayload(): ZohoConfigDto {
    const v = this.zohoConfigForm.getRawValue();
    return {
      org: v.org,
      service: v.service,
      region: v.region,
      scopes: v.scopes,
      client_id: v.client_id,
      client_secret: (v.client_secret || '').trim(),
    };
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();
    this.loadUserData();
    void this.loadPreferences();
    if (this.isAdmin) {
      this.loadZohoConfigs();
      this.setupOAuthListener();
    }

    const token = this.route.snapshot.queryParamMap.get('confirmEmailToken');
    if (token) {
      this.handleConfirmEmailToken(token);
    }
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'subscription') {
      this.activeTab = 'subscription';
    }
    this.billingState = this.billingAccess.getSnapshot();
    void this.refreshBillingState();
  }

  loadUserData(): void {
    this.usersService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          type: user.type as 'client' | 'partner' | 'admin',
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          company: user.company,
        };
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        this.profileForm.patchValue({
          full_name: fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          company: user.company || '',
        });
      },
      error: () => {
        const authUser = this.authService.getCurrentUser();
        if (authUser) {
          this.currentUser = authUser;
          const fullName = `${authUser.first_name || ''} ${authUser.last_name || ''}`.trim();
          this.profileForm.patchValue({
            full_name: fullName || '',
            email: authUser.email || '',
            phone: authUser.phone || '',
            company: authUser.company || '',
          });
        }
      },
    });
  }

  async loadPreferences(): Promise<void> {
    const fromApi = await this.panelPreferences.loadFromApi();
    if (fromApi) {
      this.patchPreferencesForm(fromApi);
      return;
    }
    const local = this.panelPreferences.readLocalFallback();
    if (local) {
      this.patchPreferencesForm(local);
    }
    this.preferencesForm.patchValue({
      language: this.panelLanguage.getPreferredLang(),
    });
  }

  private patchPreferencesForm(prefs: PanelUserPreferences): void {
    this.preferencesForm.patchValue({
      language: prefs.language,
      theme: prefs.theme,
      timezone: prefs.timezone,
      notifications: prefs.notifications,
    });
  }

  setActiveTab(tab: 'profile' | 'preferences' | 'security' | 'subscription' | 'zoho'): void {
    this.activeTab = tab;
    this.saveSuccess = false;
    this.saveError = null;
    if (tab === 'zoho' && this.isAdmin) {
      this.loadZohoConfigs();
    }
  }

  async refreshBillingState(): Promise<void> {
    await this.authService.loadUser();
    this.billingState = await this.billingAccess.loadForUser(this.authService.getCurrentUser());
  }

  async startSubscriptionCheckout(): Promise<void> {
    this.saveError = null;
    this.isStartingCheckout = true;
    try {
      const checkoutUrl = await this.billingAccess.createSubscriptionCheckoutSession();
      window.location.assign(checkoutUrl);
    } catch {
      this.saveError = 'No se pudo iniciar el checkout. Intenta de nuevo.';
      this.isStartingCheckout = false;
    }
  }

  async openCustomerPortal(): Promise<void> {
    this.saveError = null;
    this.isOpeningPortal = true;
    try {
      const portalUrl = await this.billingAccess.createCustomerPortalSession();
      window.location.assign(portalUrl);
    } catch {
      this.saveError = 'No se pudo abrir el portal de suscripción. Intenta de nuevo.';
      this.isOpeningPortal = false;
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }
    this.isLoading = true;
    this.saveError = null;
    this.emailChangeError = null;
    const fullName = this.profileForm.value.full_name.trim();
    const nameParts = fullName.split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';
    const updateData = {
      first_name,
      last_name,
      phone: this.profileForm.value.phone || undefined,
      company: this.profileForm.value.company || undefined,
    };

    const newEmail = (this.profileForm.value.email || '').trim();
    const currentEmail = this.currentUser?.email || '';
    const emailChanged = newEmail && newEmail !== currentEmail;

    this.usersService.updateCurrentUser(updateData).subscribe({
      next: (updatedUser) => {
        this.currentUser = {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          status: updatedUser.status,
          type: updatedUser.type as 'client' | 'partner' | 'admin',
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          phone: updatedUser.phone,
          company: updatedUser.company,
        };
        this.isLoading = false;
        this.saveSuccess = true;
        setTimeout(() => (this.saveSuccess = false), 3000);

        if (emailChanged) {
          this.requestEmailChange(newEmail);
        }
      },
      error: (error) => {
        this.saveError =
          error.error?.message || this.transloco.translate('PANEL.settings_page.errors.generic_save');
        this.isLoading = false;
      },
    });
  }

  requestEmailChange(newEmail: string): void {
    this.emailChangePending = true;
    this.emailChangeRequested = false;
    this.emailChangeError = null;
    this.usersService.requestEmailChange(newEmail).subscribe({
      next: () => {
        this.emailChangePending = false;
        this.emailChangeRequested = true;
      },
      error: (error) => {
        this.emailChangePending = false;
        this.emailChangeError =
          error.error?.message || 'No se pudo enviar el email de verificación.';
      },
    });
  }

  handleConfirmEmailToken(token: string): void {
    this.isLoading = true;
    this.usersService.confirmEmailChange(token).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.saveSuccess = true;
        if (this.currentUser) {
          this.currentUser = { ...this.currentUser, email: res.email };
          this.profileForm.patchValue({ email: res.email });
        }
        this.emailChangeRequested = false;
        setTimeout(() => (this.saveSuccess = false), 5000);
      },
      error: (error) => {
        this.isLoading = false;
        this.saveError =
          error.error?.message || 'El enlace de verificación es inválido o ha expirado.';
      },
    });
  }

  async savePreferences(): Promise<void> {
    if (this.preferencesForm.invalid) {
      return;
    }
    this.isLoading = true;
    this.saveError = null;
    const v = this.preferencesForm.getRawValue();
    const updated = await this.panelPreferences.saveToApi({
      language: v.language,
      theme: v.theme,
      timezone: v.timezone,
      notifications: v.notifications,
    });
    this.isLoading = false;
    if (updated) {
      this.saveSuccess = true;
      setTimeout(() => (this.saveSuccess = false), 3000);
    } else {
      this.saveError = this.transloco.translate('PANEL.settings_page.errors.generic_save');
    }
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }
    if (this.passwordForm.value.newPassword !== this.passwordForm.value.confirmPassword) {
      this.saveError = this.transloco.translate('PANEL.settings_page.security_section.mismatch');
      return;
    }
    const email = normalizeAuthEmailInput(
      this.currentUser?.email || this.profileForm.get('email')?.value,
    );
    if (!email) {
      this.saveError = this.transloco.translate('PANEL.settings_page.errors.password_change');
      return;
    }
    this.isLoading = true;
    this.saveError = null;
    this.http
      .post(
        this.authChangePasswordUrl,
        {
          email,
          oldPassword: this.passwordForm.value.currentPassword,
          newPassword: this.passwordForm.value.newPassword,
        },
        { withCredentials: true },
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.saveSuccess = true;
          this.passwordForm.reset();
          setTimeout(() => (this.saveSuccess = false), 3000);
        },
        error: (error) => {
          this.saveError =
            error.error?.message ||
            this.transloco.translate('PANEL.settings_page.errors.password_change');
          this.isLoading = false;
        },
      });
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
    Object.keys(formGroup.controls).forEach((key) => {
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
        return this.transloco.translate('PANEL.settings_page.validation.required');
      }
      if (field.errors['email']) {
        return this.transloco.translate('PANEL.settings_page.validation.invalid_email');
      }
      if (field.errors['minlength']) {
        return this.transloco.translate('PANEL.settings_page.validation.min_length', {
          length: field.errors['minlength'].requiredLength,
        });
      }
      if (field.errors['passwordMismatch']) {
        return this.transloco.translate('PANEL.settings_page.validation.password_mismatch');
      }
    }
    return '';
  }

  loadZohoConfigs(): void {
    this.zohoConfigService.getAllConfigs().subscribe({
      next: (configs) => {
        this.zohoConfigs = configs;
        if (configs.length > 0) {
          const defaultConfig =
            configs.find((c) => c.org === 'startcompanies' && c.service === 'crm') ||
            configs.find((c) => c.org === 'startcompanies' && c.service === 'workdrive') ||
            configs[0];
          this.selectConfig(defaultConfig);
        }
      },
      error: () => {
        this.saveError = this.transloco.translate('PANEL.settings_page.errors.load_zoho');
      },
    });
  }

  selectConfig(config: ZohoConfig): void {
    this.selectedConfig = config;
    this.zohoConfigForm.patchValue({
      org: config.org,
      service: config.service,
      region: config.region,
      scopes: config.scopes,
      client_id: config.zohoOAuthClientId,
      client_secret: '',
    });
    this.applyZohoCredentialValidators();
  }

  async authorizeZoho(): Promise<void> {
    if (this.zohoConfigForm.invalid) {
      this.markFormGroupTouched(this.zohoConfigForm);
      return;
    }
    const formValue = this.zohoConfigForm.value;
    const secretTrim = (formValue.client_secret || '').trim();
    const needsSave =
      !this.selectedConfig ||
      this.selectedConfig.org !== formValue.org ||
      this.selectedConfig.service !== formValue.service ||
      this.selectedConfig.region !== formValue.region ||
      this.selectedConfig.zohoOAuthClientId !== formValue.client_id ||
      this.selectedConfig.scopes !== formValue.scopes ||
      secretTrim !== '';

    if (needsSave) {
      this.isLoading = true;
      try {
        if (this.selectedConfig) {
          const updated = await firstValueFrom(
            this.zohoConfigService.updateConfig(this.selectedConfig.id, this.buildZohoUpdatePayload()),
          );
          this.selectedConfig = updated;
          this.zohoConfigs = this.zohoConfigs.map((c) => (c.id === updated.id ? updated : c));
        } else {
          const created = await firstValueFrom(
            this.zohoConfigService.createConfig(this.buildZohoCreatePayload()),
          );
          this.selectedConfig = created;
          this.zohoConfigs.push(created);
        }
        this.zohoConfigForm.patchValue({ client_secret: '' });
        this.applyZohoCredentialValidators();
        this.isLoading = false;
      } catch (error: any) {
        this.isLoading = false;
        this.saveError =
          error.error?.message ||
          this.transloco.translate('PANEL.settings_page.errors.save_before_oauth');
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
          secretTrim || undefined,
          formValue.scopes,
        ),
      );

      const win = this.browser.window;
      if (!win) {
        return;
      }
      const width = 600;
      const height = 700;
      const left = (win.screen.width - width) / 2;
      const top = (win.screen.height - height) / 2;

      const popup = win.open(
        response.url,
        'Zoho OAuth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
      );

      if (!popup) {
        this.saveError = this.transloco.translate('PANEL.settings_page.errors.oauth_popup');
        this.isOAuthInProgress = false;
        return;
      }
    } catch (error: any) {
      this.saveError =
        error.error?.message || this.transloco.translate('PANEL.settings_page.errors.oauth_url');
      this.isOAuthInProgress = false;
    }
  }

  setupOAuthListener(): void {
    const win = this.browser.window;
    if (!win) {
      return;
    }
    win.addEventListener('message', (event) => {
      if (event.data.status === 'success') {
        this.isOAuthInProgress = false;
        this.saveSuccess = true;
        this.saveError = null;
        this.loadZohoConfigs();
        setTimeout(() => (this.saveSuccess = false), 5000);
      } else if (event.data.status === 'error') {
        this.isOAuthInProgress = false;
        this.saveError = event.data.message || this.transloco.translate('PANEL.settings_page.errors.oauth_url');
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

    if (this.selectedConfig) {
      this.zohoConfigService.updateConfig(this.selectedConfig.id, this.buildZohoUpdatePayload()).subscribe({
        next: (updated) => {
          this.selectedConfig = updated;
          this.zohoConfigs = this.zohoConfigs.map((c) => (c.id === updated.id ? updated : c));
          this.zohoConfigForm.patchValue({ client_secret: '' });
          this.applyZohoCredentialValidators();
          this.isLoading = false;
          this.saveSuccess = true;
          setTimeout(() => (this.saveSuccess = false), 3000);
        },
        error: (error) => {
          this.saveError =
            error.error?.message || this.transloco.translate('PANEL.settings_page.errors.zoho_update');
          this.isLoading = false;
        },
      });
    } else {
      this.zohoConfigService.createConfig(this.buildZohoCreatePayload()).subscribe({
        next: (created) => {
          this.selectedConfig = created;
          this.zohoConfigs.push(created);
          this.zohoConfigForm.patchValue({ client_secret: '' });
          this.applyZohoCredentialValidators();
          this.isLoading = false;
          this.saveSuccess = true;
          setTimeout(() => (this.saveSuccess = false), 3000);
        },
        error: (error) => {
          this.saveError =
            error.error?.message || this.transloco.translate('PANEL.settings_page.errors.zoho_create');
          this.isLoading = false;
        },
      });
    }
  }

  deleteZohoConfig(config: ZohoConfig): void {
    const msg = this.transloco.translate('PANEL.settings_page.zoho_section.confirm_delete', {
      org: config.org,
      service: config.service,
    });
    if (!confirm(msg)) {
      return;
    }

    this.isLoading = true;
    this.zohoConfigService.deleteConfig(config.id).subscribe({
      next: () => {
        this.zohoConfigs = this.zohoConfigs.filter((c) => c.id !== config.id);
        if (this.selectedConfig?.id === config.id) {
          this.selectedConfig = null;
          this.zohoConfigForm.reset({
            org: 'startcompanies',
            service: 'crm',
            region: 'com',
            scopes: 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL',
            client_id: '',
            client_secret: '',
          });
          this.applyZohoCredentialValidators();
        }
        this.isLoading = false;
        this.saveSuccess = true;
        setTimeout(() => (this.saveSuccess = false), 3000);
      },
      error: (error) => {
        this.saveError =
          error.error?.message || this.transloco.translate('PANEL.settings_page.errors.zoho_delete');
        this.isLoading = false;
      },
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
      client_secret: '',
    });
    this.applyZohoCredentialValidators();
  }
}
