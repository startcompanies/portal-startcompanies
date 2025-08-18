import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [TranslocoPipe, CommonModule],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.css'
})
export class TabsComponent {
  
  // Variable para controlar qué tab está activa en móvil/tablet
  activeMobileTab: string = 'llc';

  // Método para cambiar la tab activa en móvil/tablet
  setActiveMobileTab(tabName: string): void {
    this.activeMobileTab = tabName;
  }

  // Método para verificar si una tab está activa en móvil/tablet
  isMobileTabActive(tabName: string): boolean {
    return this.activeMobileTab === tabName;
  }
}
