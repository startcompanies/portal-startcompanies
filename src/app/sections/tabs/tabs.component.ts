import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [TranslocoPipe, CommonModule, ResponsiveImageComponent],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.css'
})
export class TabsComponent {
  
  // Variable para controlar qué tab está activa en móvil/tablet
  activeMobileTab: string = 'llc';

  // Configuración de imágenes para NgOptimizedImage
  tabImages = {
    llc: {
      mobile: "/assets/tabs/img_usa_flag_waving.png",
      tablet: "/assets/tabs/img_usa_flag_waving.png",
      desktop: "/assets/tabs/img_usa_flag_waving.png",
      fallback: "/assets/tabs/img_usa_flag_waving.png",
      alt: "Bandera de EE.UU. para LLC",
      priority: false
    },
    bank: {
      mobile: "/assets/tabs/account_bank.jpg",
      tablet: "/assets/tabs/account_bank.jpg",
      desktop: "/assets/tabs/account_bank.jpg",
      fallback: "/assets/tabs/account_bank.jpg",
      alt: "Cuenta bancaria en EE.UU.",
      priority: false
    },
    renew: {
      mobile: "/assets/tabs/renew_llc.jpg",
      tablet: "/assets/tabs/renew_llc.jpg",
      desktop: "/assets/tabs/renew_llc.jpg",
      fallback: "/assets/tabs/renew_llc.jpg",
      alt: "Renueva tu LLC",
      priority: false
    },
    taxes: {
      mobile: "/assets/tabs/declaration_taxes.jpg",
      tablet: "/assets/tabs/declaration_taxes.jpg",
      desktop: "/assets/tabs/declaration_taxes.jpg",
      fallback: "/assets/tabs/declaration_taxes.jpg",
      alt: "Declaración de impuestos",
      priority: false
    }
  };

  // Método para cambiar la tab activa en móvil/tablet
  setActiveMobileTab(tabName: string): void {
    this.activeMobileTab = tabName;
  }

  // Método para verificar si una tab está activa en móvil/tablet
  isMobileTabActive(tabName: string): boolean {
    return this.activeMobileTab === tabName;
  }
}
