import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { whatsappConfig } from '../../../config/whatsapp.config';

@Component({
  selector: 'app-whatsapp-float',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-float.component.html',
  styleUrl: './whatsapp-float.component.css'
})
export class WhatsappFloatComponent implements OnInit {
  showWhatsApp = false;
  phoneNumber = whatsappConfig.phoneNumber;
  defaultMessage = whatsappConfig.defaultMessage;
  tooltipText = whatsappConfig.tooltipText;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkCurrentRoute();
    
    // Suscribirse a cambios de ruta
    this.router.events.subscribe(() => {
      this.checkCurrentRoute();
    });
  }

  private checkCurrentRoute(): void {
    const currentRoute = this.router.url;
    
    // Verificar si la ruta actual debe mostrar WhatsApp
    this.showWhatsApp = !whatsappConfig.excludedRoutes.some(route => 
      currentRoute.startsWith(route)
    );
  }

  openWhatsApp(): void {
    const encodedMessage = encodeURIComponent(this.defaultMessage);
    const whatsappUrl = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }
}
