import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared/shared.module';

@Component({
  selector: 'app-sc-header',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './sc-header.component.html',
  styleUrl: './sc-header.component.css',
})
export class ScHeaderComponent implements OnInit {
  isOpen: boolean = false;
  isNavbarShrunk: boolean = false;

  ngOnInit(): void {}

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }
}
