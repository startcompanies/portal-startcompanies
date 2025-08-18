import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  /**
   * Subject to emit the section name when scrolling to a section
   */
  private scrollTargetSource = new Subject<string>();

  /**
   * Observable to subscribe to the scrollSubject
   */
  scrollTarrget$ = this.scrollTargetSource.asObservable();

  constructor() {}

  scrollTo(sectionId: string) {
    this.scrollTargetSource.next(sectionId);
  }

  clearTarget() {
    this.scrollTargetSource.next('');
  }
}
