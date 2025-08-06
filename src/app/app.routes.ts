import { Routes } from '@angular/router';

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
    }
];
