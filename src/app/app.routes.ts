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
    }
];
