import { Routes } from '@angular/router';
import { title } from 'process';

export const routes: Routes = [
    // Redirecciones 301 para mantener SEO (solo URLs que no existen)
    {
        path: 'servicios',
        redirectTo: '/',
        pathMatch: 'full'
    },
    /*{
        path: 'blog',
        redirectTo: '/',
        pathMatch: 'full'
    },*/
    {
        path: 'agenda-tu-consulta-gratis',
        redirectTo: '/contacto',
        pathMatch: 'full'
    },
    {
        path: 'abrir-llc',
        redirectTo: '/abre-tu-llc',
        pathMatch: 'full'
    },
        
    // Rutas existentes
    {
        path: '',
        loadComponent: () => import('./sc-content/sc-content.component').then(m => m.ScContentComponent),
        title: 'Asesoría para tu LLC en USA | Start Companies LLC'
    },
    {
        path: 'nosotros',
        loadComponent: () => import('./us/us-page/us-page.component').then(m => m.UsPageComponent),
        title: 'Quiénes somos | Tu LLC en Estados Unidos | Start Companies LLC'
    },
    {
        path: 'contacto',
        loadComponent: () => import('./contact/contact-page/contact-page.component').then(m => m.ContactPageComponent),
        title: 'Contacto y Asesoría para tu Negocio | Start Companies LLC'
    },
    {
        path: 'abre-tu-llc',
        loadComponent: () => import('./landings/landing-open-relay/landing-open-relay.component').then(m => m.LandingOpenRelayComponent),
        title: 'Abre tu LLC en USA | Guía Paso a Paso | Start Companies LLC'
    },
    {
        path: 'apertura-banco-relay',
        loadComponent: () => import('./landings/landing-presentation/landing-presentation.component').then(m => m.LandingPresentationComponent),
        title: 'Apertura de Cuenta Bancaria en Relay para tu LLC | Start Companies LLC'
    },
    {
        path: 'apertura-llc',
        loadComponent: () => import('./manejo-llc/apertura-llc/apertura-llc.component').then(m => m.AperturaLlcComponent),
        title: 'Servicio de Apertura de LLC | Registra tu Empresa en USA | Start Companies LLC'
    },
    {
        path: 'renovar-llc',
        loadComponent: () => import('./manejo-llc/renovar-llc/renovar-llc.component').then(m => m.RenovarLlcComponent),
        title: 'Renovación de LLC en USA | Trámites Legales | Start Companies LLC'
    },
    {
        path: 'form-apertura-relay',
        loadComponent: () => import('./manejo-llc/form-apertura-relay/form-apertura-relay.component').then(m => m.FormAperturaRelayComponent),
        title: 'Formulario de Apertura de Cuenta Bancaria | Start Companies LLC'
    },
    {
        path: 'planes',
        //loadComponent: () => import('./sc-content/sc-content.component').then(m => m.ScContentComponent),
        loadComponent: () =>  import('./plans/pricing-planes/pricing-planes.component').then(m => m.PricingPlanesComponent),
        title: 'Planes y Precios | Servicios de LLC | Start Companies LLC'
    },
    {
        path: 'blog',
        loadComponent: () => import('./blog/blog-home/blog-home.component').then(m => m.BlogHomeComponent),
        title: 'Blog | Novedades y Guías sobre LLC | Start Companies LLC'
    },
    {
        path: 'blog/:category',
        loadComponent: () => import('./blog/blog-home/blog-home.component').then(m => m.BlogHomeComponent),
        title: (route) => {
            const category = route.params['category'];
            return `Blog - ${category} | Start Companies LLC`;
        }
    },
    {
        path: 'blog/:category/:postTitle',
        loadComponent: () => import('./blog/blog-post/blog-post.component').then(m => m.BlogPostComponent),
        title: (route) => {
            const postTitle = route.params['postTitle'];
            return `Blog Post: ${postTitle} | Start Companies LLC`;
        }
    },
    
    // Catch-all para URLs de blog y contenido no implementado
    {
        path: '**',
        redirectTo: '/',
        pathMatch: 'full'
    }
];
