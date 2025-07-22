import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./sc-content/sc-content.component').then(m => m.ScContentComponent),
        title: 'Inicio'
    }
];
