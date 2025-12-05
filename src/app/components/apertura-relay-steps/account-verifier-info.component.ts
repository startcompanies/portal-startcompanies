import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  FormWizardService,
  FormWizardStepBaseComponent,
} from 'ngx-form-wizard';
import { SharedModule } from '../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { MemberDetailsModalComponent } from './member-details-modal.component';

@Component({
  selector: 'app-account-verifier-info',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, MemberDetailsModalComponent],
  template: `
    <div class="p-4">
      <h4 class="mb-4">
        {{ 'RELAY_WIZARD.step3.title' | transloco }}
      </h4>

      <form [formGroup]="form">
        <!-- Miembro que validará la cuenta bancaria -->
        <div class="form-group mb-3">
          <label for="memberName">
            {{
              'RELAY_WIZARD.step3.member_name' | transloco
            }}
            *
          </label>
          <div class="input-group">
            <input
              id="memberName"
              type="text"
              class="form-control"
              formControlName="memberName"
              [placeholder]="'RELAY_WIZARD.step3.member_name_placeholder' | transloco"
              readonly
            />
            <button
              class="btn btn-outline-primary"
              type="button"
              (click)="openMemberModal()"
            >
              <i class="bi bi-plus-circle"></i>
              {{ 'RELAY_WIZARD.step3.add_member' | transloco }}
            </button>
          </div>
          <div
            *ngIf="
              form.get('memberName')?.touched &&
              form.get('memberName')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step3.member_name_required' | transloco }}
          </div>
        </div>

        <!-- Cargo / Título / Ocupación -->
        <div class="form-group mb-3">
          <label for="position">
            {{ 'RELAY_WIZARD.step3.position' | transloco }} *
          </label>
          <select id="position" class="form-control" formControlName="position">
            <option value="">
              {{ 'RELAY_WIZARD.step3.select_position' | transloco }}
            </option>
            <option value="CEO">CEO</option>
            <option value="President">Presidente</option>
            <option value="Manager">Gerente</option>
            <option value="Owner">Propietario</option>
            <option value="Director">Director</option>
            <option value="Other">Otro</option>
          </select>
          <div
            *ngIf="
              form.get('position')?.touched && form.get('position')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step3.position_required' | transloco }}
          </div>
        </div>

        <!-- Fuente de ingreso personal -->
        <div class="form-group mb-3">
          <label for="incomeSource">
            {{ 'RELAY_WIZARD.step3.income_source' | transloco }} *
          </label>
          <select
            id="incomeSource"
            class="form-control"
            formControlName="incomeSource"
          >
            <option value="">
              {{ 'RELAY_WIZARD.step3.select_income_source' | transloco }}
            </option>
            <option value="salary">Salario</option>
            <option value="business">Negocio propio</option>
            <option value="freelance">Freelance</option>
            <option value="investments">Inversiones</option>
            <option value="rental">Renta de propiedades</option>
            <option value="other">Otro</option>
          </select>
          <div
            *ngIf="
              form.get('incomeSource')?.touched &&
              form.get('incomeSource')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step3.income_source_required' | transloco }}
          </div>
        </div>

        <!-- ¿Cuánto ganas en el año? -->
        <div class="form-group mb-3">
          <label for="annualIncome">
            {{ 'RELAY_WIZARD.step3.annual_income' | transloco }} *
          </label>
          <div class="input-group">
            <input
              id="annualIncome"
              type="number"
              class="form-control"
              formControlName="annualIncome"
              [placeholder]="'RELAY_WIZARD.step3.annual_income_placeholder' | transloco"
              min="0"
              step="1000"
            />
            <span class="input-group-text">USD</span>
          </div>
          <small class="form-text text-muted">
            {{ 'RELAY_WIZARD.step3.annual_income_hint' | transloco }}
          </small>
          <div
            *ngIf="
              form.get('annualIncome')?.touched &&
              form.get('annualIncome')?.invalid
            "
            class="text-danger mt-1"
          >
            {{ 'RELAY_WIZARD.step3.annual_income_required' | transloco }}
          </div>
        </div>
      </form>
    </div>

    <!-- Modal de detalles del miembro -->
    <app-member-details-modal
      [isOpen]="isModalOpen"
      (close)="closeMemberModal()"
      (save)="onMemberSave($event)"
    ></app-member-details-modal>
  `,
})
export class AccountVerifierInfoComponent extends FormWizardStepBaseComponent {
  isModalOpen = false;

  constructor(private wizardService: FormWizardService) {
    const formControls = {
      memberName: new FormControl('', Validators.required),
      position: new FormControl('', Validators.required),
      incomeSource: new FormControl('', Validators.required),
      annualIncome: new FormControl('', [
        Validators.required,
        Validators.min(0),
      ]),
    };

    super(3, wizardService.getSteps(), true, formControls);
  }

  openMemberModal(): void {
    this.isModalOpen = true;
  }

  closeMemberModal(): void {
    this.isModalOpen = false;
  }

  onMemberSave(memberData: any): void {
    const fullName = `${memberData.firstName} ${memberData.lastName}`;
    this.form.get('memberName')?.setValue(fullName);
    // Aquí puedes guardar los datos completos del miembro si es necesario
    this.closeMemberModal();
  }
}

