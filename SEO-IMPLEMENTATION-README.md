# Sistema SEO para Start Companies LLC

## 📋 Descripción

Este sistema permite manejar dinámicamente los meta tags SEO (title, description, keywords, Open Graph, Twitter Cards) para cada página del sitio web.

## 🚀 Características

- ✅ **Meta tags dinámicos** para cada página
- ✅ **Open Graph** para redes sociales
- ✅ **Twitter Cards** para Twitter
- ✅ **Keywords** optimizados
- ✅ **Canonical URLs**
- ✅ **Actualización automática** al cambiar de página
- ✅ **Configuración centralizada**

## 📁 Archivos del Sistema

### 1. **SeoService** (`src/app/services/seo.service.ts`)
Servicio principal que maneja la actualización de meta tags.

### 2. **Configuración SEO** (`src/app/config/seo.config.ts`)
Archivo centralizado con todos los meta tags para cada página.

### 3. **Componente Base** (`src/app/shared/components/seo-base/seo-base.component.ts`)
Componente reutilizable que se puede usar en cualquier página.

## 🛠️ Cómo Implementar

### **Opción 1: Uso Automático por Ruta**

```html
<!-- En cualquier componente HTML -->
<app-seo-base routeKey="planes"></app-seo-base>
```

### **Opción 2: Uso Manual con Datos Personalizados**

```html
<!-- En cualquier componente HTML -->
<app-seo-base [seoData]="customSeoData"></app-seo-base>
```

```typescript
// En el componente TypeScript
customSeoData = {
  title: 'Título Personalizado',
  description: 'Descripción personalizada',
  keywords: 'palabra1, palabra2, palabra3'
};
```

### **Opción 3: Uso Directo del Servicio**

```typescript
// En cualquier componente
constructor(private seoService: SeoService) {}

ngOnInit() {
  this.seoService.updateBasicSeo(
    'Título de la Página',
    'Descripción de la página',
    'keywords, separados, por, comas'
  );
}
```

## 📱 Páginas Configuradas

| Ruta | Clave | Título | Descripción |
|------|-------|---------|-------------|
| `/` | `home` | Start Companies LLC - Apertura de Cuentas Bancarias en EE.UU. | Página principal |
| `/planes` | `planes` | Planes y Precios - Start Companies LLC | Página de planes |
| `/nosotros` | `nosotros` | Nosotros - Start Companies LLC | Página sobre nosotros |
| `/blog` | `blog` | Blog - Start Companies LLC | Página del blog |
| `/contacto` | `contacto` | Contacto - Start Companies LLC | Página de contacto |
| `/apertura-llc` | `apertura-llc` | Apertura de LLC en Estados Unidos | Página de apertura LLC |
| `/renovar-llc` | `renovar-llc` | Renovación de LLC en Estados Unidos | Página de renovación |
| `/form-apertura-relay` | `form-apertura-relay` | Apertura de Cuenta Bancaria Relay | Formulario Relay |

## 🔧 Configuración de Meta Tags

### **Meta Tags Básicos**
- `title`: Título de la página (aparece en la pestaña del navegador)
- `description`: Descripción de la página (aparece en resultados de búsqueda)
- `keywords`: Palabras clave separadas por comas

### **Open Graph (Facebook, LinkedIn)**
- `ogTitle`: Título para redes sociales
- `ogDescription`: Descripción para redes sociales
- `ogImage`: Imagen para redes sociales
- `ogUrl`: URL de la página
- `ogType`: Tipo de contenido (website, article, etc.)

### **Twitter Cards**
- `twitterCard`: Tipo de tarjeta (summary, summary_large_image)
- `twitterTitle`: Título para Twitter
- `twitterDescription`: Descripción para Twitter
- `twitterImage`: Imagen para Twitter

## 📝 Ejemplo de Uso Completo

### **1. Agregar a un Componente Existente**

```typescript
// En el componente TypeScript
import { SeoBaseComponent } from '../shared/components/seo-base/seo-base.component';

@Component({
  // ... otras configuraciones
  imports: [
    // ... otros imports
    SeoBaseComponent,
  ],
})
export class MiComponente {
  // ... resto del código
}
```

### **2. Agregar al HTML**

```html
<!-- Al inicio del componente -->
<app-seo-base routeKey="mi-pagina"></app-seo-base>

<!-- O con datos personalizados -->
<app-seo-base [seoData]="miSeoData"></app-seoData>
```

### **3. Configurar en seo.config.ts**

```typescript
// Agregar nueva configuración
'mi-pagina': {
  title: 'Título de Mi Página - Start Companies LLC',
  description: 'Descripción de mi página específica',
  keywords: 'palabra1, palabra2, palabra3',
  ogTitle: 'Título para Redes Sociales',
  ogDescription: 'Descripción para redes sociales',
  ogImage: '/assets/mi-imagen.jpg',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Título para Twitter',
  twitterDescription: 'Descripción para Twitter',
  twitterImage: '/assets/mi-imagen.jpg'
}
```

## 🔍 Verificación

### **Herramientas de Verificación**
1. **Google Search Console**: Para verificar indexación
2. **Facebook Sharing Debugger**: Para verificar Open Graph
3. **Twitter Card Validator**: Para verificar Twitter Cards
4. **SEO Meta Checker**: Para verificar meta tags

### **Verificación Manual**
1. Ver código fuente de la página
2. Buscar `<title>`, `<meta name="description">`, etc.
3. Verificar que los valores coincidan con la configuración

## 🚨 Notas Importantes

- ✅ El sistema funciona tanto en **cliente** como en **servidor** (SSR)
- ✅ Los meta tags se actualizan **automáticamente** al cambiar de página
- ✅ Se puede **personalizar** cada página individualmente
- ✅ **Fallback** automático a configuración por defecto
- ✅ **Limpieza** automática de meta tags al destruir componentes

## 📞 Soporte

Para dudas o problemas con la implementación SEO, revisar:
1. Configuración en `seo.config.ts`
2. Implementación del componente `SeoBaseComponent`
3. Uso correcto en cada página
4. Consola del navegador para errores
