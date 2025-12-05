import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-member-details-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslocoPipe],
  template: `
    <div
      class="modal fade"
      [class.show]="isOpen"
      [style.display]="isOpen ? 'block' : 'none'"
      tabindex="-1"
      role="dialog"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ 'RELAY_WIZARD.member_modal.title' | transloco }}
            </h5>
            <button
              type="button"
              class="btn-close"
              (click)="onClose()"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="memberForm">
              <!-- Nombre(s) -->
              <div class="form-group mb-3">
                <label for="firstName">
                  {{ 'RELAY_WIZARD.member_modal.first_name' | transloco }} *
                </label>
                <input
                  id="firstName"
                  type="text"
                  class="form-control"
                  formControlName="firstName"
                />
                <div
                  *ngIf="
                    memberForm.get('firstName')?.touched &&
                    memberForm.get('firstName')?.invalid
                  "
                  class="text-danger mt-1"
                >
                  {{ 'RELAY_WIZARD.member_modal.first_name_required' | transloco }}
                </div>
              </div>

              <!-- Apellidos -->
              <div class="form-group mb-3">
                <label for="lastName">
                  {{ 'RELAY_WIZARD.member_modal.last_name' | transloco }} *
                </label>
                <input
                  id="lastName"
                  type="text"
                  class="form-control"
                  formControlName="lastName"
                />
                <div
                  *ngIf="
                    memberForm.get('lastName')?.touched &&
                    memberForm.get('lastName')?.invalid
                  "
                  class="text-danger mt-1"
                >
                  {{ 'RELAY_WIZARD.member_modal.last_name_required' | transloco }}
                </div>
              </div>

              <!-- Fecha de Nacimiento -->
              <div class="form-group mb-3">
                <label for="birthDate">
                  {{ 'RELAY_WIZARD.member_modal.birth_date' | transloco }} *
                </label>
                <input
                  id="birthDate"
                  type="date"
                  class="form-control"
                  formControlName="birthDate"
                />
                <div
                  *ngIf="
                    memberForm.get('birthDate')?.touched &&
                    memberForm.get('birthDate')?.invalid
                  "
                  class="text-danger mt-1"
                >
                  {{ 'RELAY_WIZARD.member_modal.birth_date_required' | transloco }}
                </div>
              </div>

              <!-- Nacionalidad -->
              <div class="form-group mb-3">
                <label for="nationality">
                  {{ 'RELAY_WIZARD.member_modal.nationality' | transloco }} *
                </label>
                <select
                  id="nationality"
                  class="form-control"
                  formControlName="nationality"
                >
                  <option value="">
                    {{ 'RELAY_WIZARD.member_modal.select_nationality' | transloco }}
                  </option>
                  <option value="MX">México</option>
                  <option value="US">Estados Unidos</option>
                  <option value="CO">Colombia</option>
                  <option value="AR">Argentina</option>
                  <option value="CL">Chile</option>
                  <option value="ES">España</option>
                  <option value="Other">Otro</option>
                </select>
                <div
                  *ngIf="
                    memberForm.get('nationality')?.touched &&
                    memberForm.get('nationality')?.invalid
                  "
                  class="text-danger mt-1"
                >
                  {{ 'RELAY_WIZARD.member_modal.nationality_required' | transloco }}
                </div>
              </div>

              <!-- Ciudadanía -->
              <div class="form-group mb-3">
                <label for="citizenship">
                  {{ 'RELAY_WIZARD.member_modal.citizenship' | transloco }} *
                </label>
                <select
                  id="citizenship"
                  class="form-control"
                  formControlName="citizenship"
                >
                  <option value="">
                    {{ 'RELAY_WIZARD.member_modal.select_citizenship' | transloco }}
                  </option>
                  <option value="MX">México</option>
                  <option value="US">Estados Unidos</option>
                  <option value="CO">Colombia</option>
                  <option value="AR">Argentina</option>
                  <option value="CL">Chile</option>
                  <option value="ES">España</option>
                  <option value="Other">Otro</option>
                </select>
                <div
                  *ngIf="
                    memberForm.get('citizenship')?.touched &&
                    memberForm.get('citizenship')?.invalid
                  "
                  class="text-danger mt-1"
                >
                  {{ 'RELAY_WIZARD.member_modal.citizenship_required' | transloco }}
                </div>
              </div>

              <!-- Número de pasaporte -->
              <div class="form-group mb-3">
                <label for="passportNumber">
                  {{ 'RELAY_WIZARD.member_modal.passport_number' | transloco }} *
                </label>
                <input
                  id="passportNumber"
                  type="text"
                  class="form-control"
                  formControlName="passportNumber"
                  [placeholder]="'RELAY_WIZARD.member_modal.passport_number_placeholder' | transloco"
                />
                <div
                  *ngIf="
                    memberForm.get('passportNumber')?.touched &&
                    memberForm.get('passportNumber')?.invalid
                  "
                  class="text-danger mt-1"
                >
                  {{ 'RELAY_WIZARD.member_modal.passport_number_required' | transloco }}
                </div>
              </div>

              <!-- Adjuntar pasaporte -->
              <div class="form-group mb-3">
                <label for="passportFile">
                  {{ 'RELAY_WIZARD.member_modal.passport_file' | transloco }} *
                </label>
                <input
                  id="passportFile"
                  type="file"
                  class="form-control"
                  formControlName="passportFile"
                  accept=".pdf,.jpg,.jpeg,.png"
                  (change)="onPassportFileChange($event)"
                />
                <small class="form-text text-muted">
                  {{ 'RELAY_WIZARD.member_modal.passport_file_hint' | transloco }}
                </small>
                <div
                  *ngIf="
                    memberForm.get('passportFile')?.touched &&
                    memberForm.get('passportFile')?.invalid
                  "
                  class="text-danger mt-1"
                >
                  {{ 'RELAY_WIZARD.member_modal.passport_file_required' | transloco }}
                </div>
              </div>

              <!-- Email laboral -->
              <div class="form-group mb-3">
                <label for="workEmail">
                  {{ 'RELAY_WIZARD.member_modal.work_email' | transloco }}
                </label>
                <input
                  id="workEmail"
                  type="email"
                  class="form-control"
                  formControlName="workEmail"
                  [placeholder]="'RELAY_WIZARD.member_modal.work_email_placeholder' | transloco"
                />
              </div>

              <!-- Teléfono -->
              <div class="form-group mb-3">
                <label for="phone">
                  {{ 'RELAY_WIZARD.member_modal.phone' | transloco }}
                </label>
                <input
                  id="phone"
                  type="tel"
                  class="form-control"
                  formControlName="phone"
                  [placeholder]="'RELAY_WIZARD.member_modal.phone_placeholder' | transloco"
                />
              </div>

              <!-- ¿Es residente en EE.UU.? -->
              <div class="form-group mb-3">
                <label class="d-block mb-2">
                  {{ 'RELAY_WIZARD.member_modal.us_resident' | transloco }}
                </label>
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    id="usResidentYes"
                    formControlName="usResident"
                    value="yes"
                  />
                  <label class="form-check-label" for="usResidentYes">
                    {{ 'RELAY_WIZARD.member_modal.yes' | transloco }}
                  </label>
                </div>
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    id="usResidentNo"
                    formControlName="usResident"
                    value="no"
                  />
                  <label class="form-check-label" for="usResidentNo">
                    {{ 'RELAY_WIZARD.member_modal.no' | transloco }}
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="onClose()"
            >
              {{ 'RELAY_WIZARD.member_modal.cancel' | transloco }}
            </button>
            <button
              type="button"
              class="btn btn-primary"
              (click)="onSave()"
              [disabled]="memberForm.invalid"
            >
              {{ 'RELAY_WIZARD.member_modal.save' | transloco }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      class="modal-backdrop fade"
      [class.show]="isOpen"
      *ngIf="isOpen"
    ></div>
  `,
})
export class MemberDetailsModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  memberForm = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    birthDate: new FormControl('', Validators.required),
    nationality: new FormControl('', Validators.required),
    citizenship: new FormControl('', Validators.required),
    passportNumber: new FormControl('', Validators.required),
    passportFile: new FormControl(null, Validators.required),
    workEmail: new FormControl(''),
    phone: new FormControl(''),
    usResident: new FormControl('no'),
  });

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    if (this.memberForm.valid) {
      this.save.emit(this.memberForm.value);
      this.memberForm.reset();
      this.memberForm.patchValue({ usResident: 'no' });
    }
  }

  onPassportFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.memberForm.get('passportFile')?.setValue(file);
    }
  }
}

