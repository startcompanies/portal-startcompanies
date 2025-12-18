import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-new-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './new-request.component.html',
  styleUrl: './new-request.component.css'
})
export class NewRequestComponent implements OnInit {
  requestForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  currentStep = 1;
  totalSteps = 3;

  serviceTypes = [
    { value: 'apertura-llc', label: 'Apertura LLC', description: 'Formación de nueva LLC en Estados Unidos' },
    { value: 'renovacion-llc', label: 'Renovación LLC', description: 'Renovación de LLC existente' },
    { value: 'cuenta-bancaria', label: 'Cuenta Bancaria', description: 'Apertura de cuenta bancaria para LLC' }
  ];

  llcTypes = [
    { value: 'single', label: 'Single Member LLC', description: 'LLC con un solo miembro' },
    { value: 'multi', label: 'Multi Member LLC', description: 'LLC con múltiples miembros' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.requestForm = this.fb.group({
      // Paso 1: Tipo de servicio
      serviceType: ['', Validators.required],
      
      // Paso 2: Información del cliente
      clientFirstName: ['', Validators.required],
      clientLastName: ['', Validators.required],
      clientEmail: ['', [Validators.required, Validators.email]],
      clientPhone: [''],
      
      // Paso 3: Detalles específicos del servicio
      llcType: [''], // Solo para apertura/renovación LLC
      llcName: [''], // Solo para apertura LLC
      existingLLCNumber: [''], // Solo para renovación
      bankAccountType: [''], // Solo para cuenta bancaria
      
      // Información adicional
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Validar que el usuario sea partner
    if (!this.authService.isPartner()) {
      this.router.navigate(['/panel/my-requests']);
    }
  }

  get serviceType() {
    return this.requestForm.get('serviceType');
  }

  get clientFirstName() {
    return this.requestForm.get('clientFirstName');
  }

  get clientLastName() {
    return this.requestForm.get('clientLastName');
  }

  get clientEmail() {
    return this.requestForm.get('clientEmail');
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.serviceType?.valid) {
      this.currentStep = 2;
    } else if (this.currentStep === 2 && this.validateStep2()) {
      this.currentStep = 3;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  validateStep2(): boolean {
    return !!(this.clientFirstName?.valid && 
              this.clientLastName?.valid && 
              this.clientEmail?.valid);
  }

  onSubmit(): void {
    if (this.requestForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;

      // TODO: Enviar solicitud al backend
      setTimeout(() => {
        this.isLoading = false;
        // Redirigir a la lista de solicitudes
        this.router.navigate(['/panel/my-requests']);
      }, 1000);
    } else {
      this.requestForm.markAllAsTouched();
    }
  }

  getServiceTypeLabel(value: string): string {
    const type = this.serviceTypes.find(t => t.value === value);
    return type ? type.label : value;
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return this.serviceType?.valid || false;
    }
    if (step === 2) {
      return this.validateStep2();
    }
    return this.requestForm.valid;
  }

  getSelectedServiceType(): string {
    return this.serviceType?.value || '';
  }
}


