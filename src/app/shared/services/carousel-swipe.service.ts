import { Injectable } from '@angular/core';
import { BrowserService } from './browser.service';

interface SwipeState {
  carousel: HTMLElement;
  startX: number;
  startY: number;
}

@Injectable({ providedIn: 'root' })
export class CarouselSwipeService {
  private readonly activePointers = new Map<number, SwipeState>();
  private isInitialized = false;
  private readonly minSwipeDistance = 45;
  private readonly maxVerticalDistance = 90;

  constructor(private readonly browser: BrowserService) {}

  init(): void {
    if (this.isInitialized || !this.browser.isBrowser) return;
    const doc = this.browser.document;
    if (!doc) return;

    doc.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    doc.addEventListener('pointerup', this.onPointerUp, { passive: true });
    doc.addEventListener('pointercancel', this.onPointerCancel, { passive: true });
    this.isInitialized = true;
  }

  private onPointerDown = (event: PointerEvent): void => {
    // Bootstrap ya maneja touch/pen en mobile; este handler complementa swipe con mouse en desktop.
    if (event.pointerType !== 'mouse') return;
    if (!event.isPrimary || event.button !== 0 || event.buttons !== 1) return;

    const target = event.target as Element | null;
    const carousel = target?.closest('.carousel');
    if (!(carousel instanceof HTMLElement)) return;

    this.activePointers.set(event.pointerId, {
      carousel,
      startX: event.clientX,
      startY: event.clientY,
    });
  };

  private onPointerUp = (event: PointerEvent): void => {
    const state = this.activePointers.get(event.pointerId);
    if (!state) return;
    this.activePointers.delete(event.pointerId);

    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;

    if (Math.abs(deltaX) < this.minSwipeDistance) return;
    if (Math.abs(deltaY) > this.maxVerticalDistance) return;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;

    this.slide(state.carousel, deltaX < 0 ? 'next' : 'prev');
  };

  private onPointerCancel = (event: PointerEvent): void => {
    this.activePointers.delete(event.pointerId);
  };

  private slide(carouselElement: HTMLElement, direction: 'next' | 'prev'): void {
    const win = this.browser.window as any;
    const Carousel = win?.bootstrap?.Carousel;
    if (!Carousel) return;

    const instance = Carousel.getOrCreateInstance(carouselElement);
    if (direction === 'next') {
      instance.next();
      return;
    }

    instance.prev();
  }
}
