import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngFor="let block of blocks">
      <ng-container [ngSwitch]="block.type">
        <p *ngSwitchCase="'p'">{{ block.content }}</p>
        <img *ngSwitchCase="'img'" [src]="block.src" [alt]="block.alt" class="img-fluid rounded-3" />
        <a *ngSwitchCase="'a'" [href]="block.href" target="_blank" rel="noopener noreferrer">{{ block.text }}</a>
      </ng-container>
    </div>
  `
})
export class PostContentComponent {
  @Input() blocks: any[] = [];
}
