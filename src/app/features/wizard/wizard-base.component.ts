import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { LanguageService } from '../../shared/services/language.service';
import { WizardStateService } from '../../shared/services/wizard-state.service';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';

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

  constructor(
    private languageService: LanguageService,
    public translocoService: TranslocoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentLang = this.languageService.currentLang;
    this.internalStepIndex = this.currentStepIndex;
    this.translocoService.langChanges$.subscribe((l) => {
      this.currentLang = l;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentStepIndex']) {
      this.internalStepIndex = this.currentStepIndex;
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
