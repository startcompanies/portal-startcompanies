import { Routes } from '@angular/router';
import { title } from 'process';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./sc-content/sc-content.component').then(m => m.ScContentComponent),
        title: 'Inicio'
    },
    {
        path: 'nosotros',
        loadComponent: () => import('./us/us-page/us-page.component').then(m => m.UsPageComponent),
        title: 'Nosotros'
    },
    {
        path: 'contacto',
        loadComponent: () => import('./contact/contact-page/contact-page.component').then(m => m.ContactPageComponent),
        title: 'Contacto'
    },
    {
        path: 'abre-tu-llc',
        loadComponent: () => import('./landings/landing-open-relay/landing-open-relay.component').then(m => m.LandingOpenRelayComponent),
        title: 'Abre tu LLC'
    },
    {
        path: 'apertura-banco-relay',
        loadComponent: () => import('./landings/landing-presentation/landing-presentation.component').then(m => m.LandingPresentationComponent),
        title: 'Apertura de Banco Relay'
    },
    {
        path: 'apertura-llc',
        loadComponent: () => import('./manejo-llc/apertura-llc/apertura-llc.component').then(m => m.AperturaLlcComponent),
        title: 'Apertura de LLC'
    },
    {
        path: 'renovar-llc',
        loadComponent: () => import('./manejo-llc/renovar-llc/renovar-llc.component').then(m => m.RenovarLlcComponent),
        title: 'Renovar LLC'
    },
    {
        path: 'form-apertura-relay',
        loadComponent: () => import('./manejo-llc/form-apertura-relay/form-apertura-relay.component').then(m => m.FormAperturaRelayComponent),
        title: 'Apertura de cuenta'
    },
    {
        path: 'planes',
        loadComponent: () => import('./sc-content/sc-content.component').then(m => m.ScContentComponent),
        title: 'Planes y precios'
    }
];
