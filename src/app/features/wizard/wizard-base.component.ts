import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ContentChild, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { LanguageService } from '../../shared/services/language.service';
import { WizardStateService } from '../wizard/services/wizard-state.service';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { Subscription } from 'rxjs';
/**
 * Componente base del wizard con diseño y estilos generales
 * Reutilizable para todos los flujos
 */
@Component({
  selector: 'app-wizard-base',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    TranslocoPipe,
    ResponsiveImageComponent
  ],
  templateUrl: './wizard-base.component.html',
  styleUrls: ['./wizard-base.component.css']
})
export class WizardBaseComponent implements OnInit, OnChanges {
  @Input() totalSteps: number = 6;
  @Input() currentStepIndex: number = 0;
  @Input() stepTitles: { [key: number]: string } = {};
  @Input() stepIcons: { [key: number]: string } = {};
  @Input() steps: any[] = [];
  @Input() flowType: string = 'llc';

  @Output() stepChanged = new EventEmitter<number>();
  @Output() previousStep = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<void>();
  @Output() finish = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  heroImages = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Blog Hero Background',
    priority: true,
  };

  currentLang = 'es';
  internalStepIndex: number = 0;
  @ContentChild(MatStepper) stepper!: MatStepper;

  showNextButton = true;
  private sub!: Subscription;

  constructor(
    private languageService: LanguageService,
    public translocoService: TranslocoService,
    private router: Router,
    private wizardStateService: WizardStateService
  ) { }

  ngOnInit(): void {
    this.currentLang = this.languageService.currentLang;
    this.internalStepIndex = this.currentStepIndex;
    this.translocoService.langChanges$.subscribe((l) => {
      this.currentLang = l;
    });

    if (this.flowType === 'llc' && this.internalStepIndex == 3) {
      this.sub = this.wizardStateService.showNextButton$
        .subscribe(value => this.showNextButton = value);
    } else {
      this.showNextButton = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentStepIndex']) {
      this.internalStepIndex = this.currentStepIndex;
    }

    if (this.flowType === 'llc' && this.internalStepIndex == 3) {
      this.sub = this.wizardStateService.showNextButton$
        .subscribe(value => this.showNextButton = value);
    } else {
      this.showNextButton = true;
    }
  }

  onStepChanged(index: number): void {
    this.internalStepIndex = index;
    this.stepChanged.emit(index);

    if (index === this.totalSteps - 1) {
      setTimeout(() => {
        this.onFinish();
      }, 100);
    }
  }

  getStepClass(stepIndex: number): string {
    if (stepIndex < this.internalStepIndex) {
      return 'completed';
    } else if (stepIndex === this.internalStepIndex) {
      return 'active';
    }
    return '';
  }

  goToPreviousStep(): void {
    if (this.internalStepIndex > 0 && this.stepper) {
      this.stepper.previous();
      this.previousStep.emit();
    }
  }

  goToNextStep(): void {
    const stepNumber = this.internalStepIndex + 1;
    const form = this.wizardStateService.getForm(stepNumber);

    if (form && form.invalid) {
      form.markAllAsTouched();
      return; // ⛔ no avanza
    }

    if (this.internalStepIndex < this.totalSteps - 1 && this.stepper) {
      this.stepper.next();
      this.nextStep.emit();
    }
  }

  onFinish(): void {
    this.finish.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
