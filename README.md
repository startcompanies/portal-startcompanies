# Portal StartCompanies

Portal web para Start Companies - Servicios de apertura de LLC y cuentas bancarias en Estados Unidos.

Este proyecto fue generado con [Angular CLI](https://github.com/angular/angular-cli) version 18.2.14.

## Estructura del Proyecto

El proyecto está organizado siguiendo una arquitectura modular basada en features:

```
src/app/
  core/                    # Núcleo de la aplicación
    app.component.ts       # Componente raíz
    app.config.ts          # Configuración de la aplicación
    app.config.server.ts   # Configuración del servidor SSR
    app.routes.ts          # Definición de rutas
    config/                # Configuraciones globales
      blog-seo.config.ts   # Configuración SEO del blog
      breakpoints.config.ts # Breakpoints responsive
      image-config.ts      # Configuración de imágenes
      seo.config.ts        # Configuración SEO general
      whatsapp.config.ts   # Configuración WhatsApp

  features/                # Módulos funcionales
    public/                # Portal público
      home/                # Página principal
        home.component.ts
        sections/          # Secciones de la homepage
      blog/                # Blog unificado
      pages/               # Páginas estáticas
        about-us/          # Nosotros
        contact/           # Contacto
        plans/             # Planes y precios
        legal/             # Páginas legales
      landings/            # Landing Pages
      forms/               # Formularios públicos

    wizard/                # Flujos de wizard
      components/          # Componentes compartidos del wizard
      flow-llc/            # Flujo de apertura LLC
      flow-renovacion/     # Flujo de renovación LLC
      flow-cuenta-bancaria/ # Flujo de cuenta bancaria
      services/            # Servicios del wizard

    panel/                 # Panel administrativo
      layout/              # Layout del panel
      pages/               # Páginas del panel
      guards/              # Guards del panel
      services/            # Servicios del panel

  shared/                  # Recursos compartidos
    components/            # Componentes reutilizables
      header/              # Header global (sc-header)
      footer/              # Footer global (sc-footer)
      post-content/        # Componente de contenido de posts
      responsive-image/    # Componente de imágenes responsive
      intl-tel-input/      # Componente de teléfono internacional
      whatsapp-float/      # Botón flotante de WhatsApp
      multilingual-seo/    # Componente SEO multilingüe
      image-preloader/     # Precargador de imágenes
      seo-base/            # Componente base SEO
    directives/            # Directivas personalizadas
      lang-router-link.directive.ts
      lazy-image.directive.ts
      lazy-wistia.directive.ts
    guards/                # Guards de rutas
      language.guard.ts
      campaign-redirect.guard.ts
    models/                # Modelos/interfaces
      category.model.ts
      post.model.ts
      tag.model.ts
      user.model.ts
    services/              # Servicios compartidos
      analytics.service.ts
      blog.service.ts
      blog-seo.service.ts
      browser.service.ts
      facebook-pixel.service.ts
      geolocation.service.ts
      html-sanitizer.service.ts
      language.service.ts
      lazy-loading.service.ts
      multilingual-seo.service.ts
      responsive-image.service.ts
      safe-storage.service.ts
      scroll.service.ts
      seo.service.ts
      sitemap.service.ts
      sitemap-xml.service.ts
      wizard-state.service.ts
    styles/                # Estilos compartidos
      optimized-images.css
      responsive-images.css
    error-404/             # Componente de error 404

  sitemap/                 # Componente de sitemap
```

## Desarrollo

### Servidor de desarrollo

Ejecuta `ng serve` o `npm start` para iniciar el servidor de desarrollo. Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias algún archivo fuente.

### Build

- Desarrollo: `npm run build`
- Producción: `npm run build:production`
- Staging: `npm run build:staging`
- SSR: `npm run build:ssr`

Los artefactos de build se almacenan en el directorio `dist/`.

### SSR (Server-Side Rendering)

El proyecto incluye soporte para SSR:

```bash
# Build SSR
npm run build:ssr

# Servir SSR
npm run serve:ssr
```

## Testing

### Unit Tests

Ejecuta `ng test` para ejecutar los tests unitarios via [Karma](https://karma-runner.github.io).

### E2E Tests

Ejecuta `ng e2e` para ejecutar los tests end-to-end. Necesitas agregar un paquete que implemente capacidades de testing E2E.

## Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Build de desarrollo
- `npm run build:production` - Build de producción con SSR
- `npm run build:staging` - Build de staging con SSR
- `npm run build:ssr` - Build con SSR
- `npm run serve:ssr` - Servir aplicación con SSR
- `npm run dev:ssr` - Build y servir SSR en un solo comando
- `npm run clean` - Limpiar directorio dist y caché de npm
- `npm run docker:build` - Build de producción con Docker
- `npm run docker:build:staging` - Build de staging con Docker

## Internacionalización

El proyecto utiliza [Transloco](https://ngneat.github.io/transloco/) para la internacionalización. Los idiomas soportados son:

- Español (es) - Idioma por defecto
- Inglés (en)

Los archivos de traducción se encuentran en `src/assets/i18n/`.

El proyecto utiliza:
- `@jsverse/transloco` - Librería principal de traducción
- `@jsverse/transloco-persist-lang` - Persistencia del idioma seleccionado
- `@ngneat/transloco` - Utilidades adicionales

## Estilos y Dependencias

### Frameworks CSS
- **Bootstrap 5.3.7** - Framework CSS principal
- **Bootstrap Icons 1.13.1** - Iconografía
- **Angular Material 18.2.14** - Componentes UI
- **Angular CDK 18.2.14** - Componentes base

### Librerías Principales
- **@stripe/stripe-js 8.6.0** - Integración con Stripe para pagos
- **intl-tel-input 25.14.1** - Input de teléfono internacional
- **ngx-youtube-player 18.0.0** - Reproductor de YouTube
- **rxjs 7.8.0** - Programación reactiva
- **express 4.18.2** - Servidor para SSR

### Herramientas de Desarrollo
- **sharp 0.34.3** - Optimización de imágenes
- **terser 5.43.1** - Minificación de código

## Convenciones de Código

### Imports

Al trabajar con la estructura del proyecto, ten en cuenta los paths relativos:

- Desde `features/public/*` hacia `shared/`: `../../../../shared/`
- Desde `features/wizard/*` hacia `shared/`: `../../../shared/`
- Desde `features/public/home/sections/*` hacia `shared/`: `../../../../../shared/`
- Desde `shared/components/*` hacia `shared/services/`: `../../services/`
- Desde `core/config/*` hacia `shared/`: `../../../shared/`

### Nomenclatura

- **Componentes**: PascalCase con sufijo `Component` (ej: `HomeComponent`, `ScHeaderComponent`)
- **Servicios**: PascalCase con sufijo `Service` (ej: `BlogService`, `LanguageService`)
- **Guards**: camelCase con sufijo `Guard` (ej: `languageGuard`, `campaignRedirectGuard`)
- **Models**: PascalCase con sufijo `Model` (ej: `PostModel`, `CategoryModel`)
- **Directivas**: camelCase con sufijo `Directive` (ej: `LazyImageDirective`)
- **Interfaces**: PascalCase, sin sufijo (ej: `Post`, `User`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `API_BASE_URL`)

### Estructura de Componentes

Cada componente debe incluir:
- Archivo TypeScript (`.ts`)
- Template HTML (`.html`)
- Estilos CSS (`.css`) - opcional si usa estilos globales
- Archivo de pruebas (`.spec.ts`) - recomendado

### Estructura de Servicios

Los servicios deben:
- Usar `providedIn: 'root'` para ser singleton
- Incluir manejo de errores apropiado
- Documentar métodos públicos con JSDoc

## Configuración

### Environments

- `src/environments/environment.ts` - Desarrollo
- `src/environments/environment.staging.ts` - Staging
- `src/environments/environment.prod.ts` - Producción

### Angular Configuration

La configuración de Angular se encuentra en `angular.json`. Incluye configuraciones para:
- Build de desarrollo y producción
- SSR
- Service Worker (PWA)
- Optimizaciones

## Características Principales

### SEO y Rendimiento
- **Server-Side Rendering (SSR)** - Renderizado del lado del servidor para mejor SEO
- **Service Worker (PWA)** - Soporte para Progressive Web App
- **Optimización de imágenes** - Validación y optimización automática de imágenes responsive
- **Multilingual SEO** - SEO optimizado para múltiples idiomas
- **Sitemap dinámico** - Generación automática de sitemap XML

### Funcionalidades
- **Blog unificado** - Sistema de blog con categorías y tags
- **Wizard multi-paso** - Flujos guiados para apertura de LLC, renovación y cuentas bancarias
- **Integración Stripe** - Procesamiento de pagos
- **WhatsApp Integration** - Botón flotante de contacto
- **Analytics** - Integración con Facebook Pixel y Google Analytics
- **Geolocalización** - Detección de ubicación del usuario

### Responsive Design
- Diseño completamente responsive
- Imágenes optimizadas para diferentes dispositivos
- Breakpoints configurables
- Lazy loading de imágenes y contenido

## Docker

El proyecto incluye configuración Docker para despliegue:

```bash
# Build de producción con Docker
npm run docker:build

# Build de staging con Docker
npm run docker:build:staging
```

El Dockerfile está configurado para:
- Build optimizado con PWA
- Validación y optimización de imágenes
- Configuración de Nginx para producción
- Soporte para SSR

Ver `DOCKER_BUILD.md` para más detalles (si existe).

## Contribución

1. Crea una rama desde `main` o `develop`
2. Realiza tus cambios siguiendo las convenciones del proyecto
3. Asegúrate de que el build pase correctamente
4. Crea un Pull Request

### Checklist antes de commitear
- [ ] El código sigue las convenciones de nomenclatura
- [ ] Los builds de desarrollo y producción funcionan
- [ ] Las traducciones están actualizadas (si aplica)
- [ ] El SEO está configurado correctamente (si es una nueva página)

## Licencia

Este proyecto es privado y propiedad de Start Companies.

## Ayuda Adicional

Para más ayuda sobre Angular CLI, usa `ng help` o visita la [documentación oficial de Angular CLI](https://angular.dev/tools/cli).

## Requisitos del Sistema

- **Node.js**: Versión 18.x o superior
- **npm**: Versión 9.x o superior
- **Angular CLI**: 18.2.14

## Notas de Desarrollo

### SSR (Server-Side Rendering)
El proyecto utiliza Angular SSR para mejorar el SEO y el rendimiento inicial. El servidor Express está configurado en `server.ts`.

### Service Worker
El proyecto incluye configuración de Service Worker para PWA. La configuración se encuentra en `ngsw-config.json`.

---

**Última actualización:** Enero 2025  
**Versión Angular:** 18.2.14  
**Versión del Proyecto:** 1.0.0
