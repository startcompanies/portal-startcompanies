import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ContentChild, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { LanguageService } from '../../shared/services/language.service';
import { WizardStateService } from '../../shared/services/wizard-state.service';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

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
export class WizardBaseComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
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

  @ViewChild('stepsContainer', { static: false }) stepsContainer!: ElementRef<HTMLDivElement>;

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
  
  canScrollPrev: boolean = false;
  canScrollNext: boolean = false;
  private destroy$ = new Subject<void>();
  private readonly VISIBLE_STEPS = 4;

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

  ngAfterViewInit(): void {
    // Verificar scroll después de que la vista se inicialice
    setTimeout(() => {
      this.checkScrollButtons();
      this.scrollToActiveStep();
    }, 100);

    // Escuchar cambios de tamaño de ventana
    if (typeof window !== 'undefined') {
      fromEvent(window, 'resize')
        .pipe(
          debounceTime(150),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.checkScrollButtons();
          this.scrollToActiveStep();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentStepIndex']) {
      this.internalStepIndex = this.currentStepIndex;
      setTimeout(() => {
        this.scrollToActiveStep();
        this.checkScrollButtons();
      }, 100);
    }
    if (changes['steps']) {
      setTimeout(() => {
        this.checkScrollButtons();
      }, 100);
    }
  }

  onStepChanged(index: number): void {
    this.internalStepIndex = index;
    this.stepChanged.emit(index);
    
    setTimeout(() => {
      this.scrollToActiveStep();
      this.checkScrollButtons();
    }, 100);
    
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

  scrollSteps(direction: 'prev' | 'next'): void {
    if (!this.stepsContainer) return;

    const container = this.stepsContainer.nativeElement;
    const stepWidth = container.scrollWidth / this.steps.length;
    const scrollAmount = stepWidth * this.VISIBLE_STEPS;
    const currentScroll = container.scrollLeft;

    if (direction === 'prev') {
      container.scrollTo({
        left: Math.max(0, currentScroll - scrollAmount),
        behavior: 'smooth'
      });
    } else {
      container.scrollTo({
        left: Math.min(container.scrollWidth - container.clientWidth, currentScroll + scrollAmount),
        behavior: 'smooth'
      });
    }
  }

  scrollToActiveStep(): void {
    if (!this.stepsContainer || this.steps.length === 0 || this.steps.length <= this.VISIBLE_STEPS) return;

    const container = this.stepsContainer.nativeElement;
    const activeStepElement = container.querySelector(`[data-step-index="${this.internalStepIndex}"]`) as HTMLElement;
    
    if (activeStepElement) {
      const containerRect = container.getBoundingClientRect();
      const stepRect = activeStepElement.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const stepLeft = stepRect.left - containerRect.left + scrollLeft;
      const stepWidth = stepRect.width;
      const containerWidth = container.clientWidth;
      const stepIndex = this.internalStepIndex;
      const totalSteps = this.steps.length;

      // Calcular posición para mostrar 4 pasos centrando el activo cuando sea posible
      let targetScroll: number;
      
      if (stepIndex < this.VISIBLE_STEPS / 2) {
        // Si está en los primeros pasos, mostrar desde el inicio
        targetScroll = 0;
      } else if (stepIndex >= totalSteps - this.VISIBLE_STEPS / 2) {
        // Si está en los últimos pasos, mostrar hasta el final
        targetScroll = container.scrollWidth - containerWidth;
      } else {
        // Centrar el paso activo
        targetScroll = stepLeft - (containerWidth / 2) + (stepWidth / 2);
      }

      container.scrollTo({
        left: Math.max(0, Math.min(targetScroll, container.scrollWidth - containerWidth)),
        behavior: 'smooth'
      });
    }
  }

  onStepsScroll(): void {
    this.checkScrollButtons();
  }

  checkScrollButtons(): void {
    if (!this.stepsContainer || this.steps.length <= this.VISIBLE_STEPS) {
      this.canScrollPrev = false;
      this.canScrollNext = false;
      return;
    }

    const container = this.stepsContainer.nativeElement;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;

    // Permitir scroll si hay contenido que no cabe
    this.canScrollPrev = scrollLeft > 10;
    this.canScrollNext = scrollLeft < (scrollWidth - clientWidth - 10);
  }
}
