# 📋 Guía de Implementación: Sistema de Estilos para Blog

## 🎯 Objetivo

Implementar un sistema centralizado de estilos CSS para componentes reutilizables del blog que garantice:
- ✅ Preservación de clases CSS durante la sanitización
- ✅ Estilos consistentes entre editor (panel) y visualización (portal)
- ✅ Mantenimiento centralizado de estilos
- ✅ Seguridad contra XSS manteniendo funcionalidad

---

## 📦 Cambios a Realizar

### 1. Crear CSS Compartido para Componentes del Blog

#### 1.1 Crear archivo CSS compartido

**Archivo:** `portal-startcompanies/src/assets/styles/blog-components.css`

Este archivo contendrá TODOS los estilos de los componentes reutilizables del blog.

**Contenido:** Consolidar todos los estilos de:
- `panel-startcompanies/src/assets/tinymce/editor-content.css`
- `portal-startcompanies/src/app/shared/components/post-content/post-content.component.css`

**Estructura sugerida:**
```css
/* ============================================
   BLOG COMPONENTS - ESTILOS COMPARTIDOS
   ============================================
   Este archivo contiene todos los estilos para
   componentes reutilizables del blog.
   Se usa tanto en TinyMCE (panel) como en el portal.
   ============================================ */

/* Componente: abre-corp-card */
.abre-corp-card { ... }
.abre-corp-title { ... }
/* ... todos los estilos ... */

/* Componente: promo-card */
.promo-card { ... }
/* ... todos los estilos ... */

/* ... resto de componentes ... */
```

---

### 2. Actualizar Configuración de TinyMCE (Panel)

#### 2.1 Modificar `panel-startcompanies/src/app/components/editor/editor.component.ts`

**Cambios:**
- Cambiar `content_css` para apuntar al CSS compartido
- Simplificar `content_style` (solo estilos básicos del editor, no de componentes)
- Remover estilos inline de componentes del `content_style`

**Línea ~239:**
```typescript
// ANTES:
content_css: '/assets/tinymce/editor-content.css',
content_style: 'body { ... } .abre-corp-card { ... } .promo-card { ... } ...',

// DESPUÉS:
content_css: '/assets/styles/blog-components.css', // CSS compartido
content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }', // Solo estilos básicos
```

**Nota:** Si el CSS compartido está en el portal, necesitarás:
- Copiar el archivo al panel también, O
- Servir el CSS desde un lugar accesible para ambos proyectos

---

### 3. Actualizar PostContentComponent (Portal)

#### 3.1 Modificar `portal-startcompanies/src/app/shared/components/post-content/post-content.component.ts`

**Cambios:**
1. Importar y usar `HtmlSanitizerService` con DOMPurify configurado
2. Reemplazar `bypassSecurityTrustHtml()` con sanitización segura que preserve clases
3. Mantener el post-procesamiento actual (iconos, enlaces, etc.)

**Importaciones a agregar:**
```typescript
import { HtmlSanitizerService } from '../../services/html-sanitizer.service';
```

**Modificar método `sanitizeHtml()`:**
```typescript
private sanitizeHtml() {
  let content = this.html || '';
  
  if (!content) {
    this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml('');
    return;
  }
  
  // Post-procesamiento actual (iconos, enlaces, etc.)
  // ... mantener todo el código actual de post-procesamiento ...
  
  // Al final, usar DOMPurify en lugar de bypassSecurityTrustHtml
  const sanitized = this.htmlSanitizerService.sanitize(content);
  this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(sanitized);
}
```

**Inyectar servicio en constructor:**
```typescript
constructor(
  @Inject(PLATFORM_ID) private platformId: Object,
  private sanitizer: DomSanitizer,
  private htmlSanitizerService: HtmlSanitizerService // Agregar
) { ... }
```

#### 3.2 Importar CSS compartido en `post-content.component.css`

**Agregar al inicio del archivo:**
```css
/* Importar estilos compartidos de componentes del blog */
@import '../../../assets/styles/blog-components.css';

/* Estilos específicos del componente PostContentComponent */
/* ... estilos existentes ... */
```

---

### 4. Actualizar HtmlSanitizerService

#### 4.1 Modificar `portal-startcompanies/src/app/shared/services/html-sanitizer.service.ts`

**Cambios:**
- Actualizar configuración de DOMPurify para permitir `class` y `style`
- Agregar todos los tags y atributos necesarios para componentes del blog

**Nueva configuración:**
```typescript
sanitize(html: string): string {
  if (!this.purify) {
    // fallback simple: eliminar scripts
    return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }

  return this.purify.sanitize(html, {
    // Tags permitidos (agregar todos los necesarios)
    ALLOWED_TAGS: [
      'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u',
      'br', 'hr', 'blockquote', 'pre', 'code', 'table', 'thead',
      'tbody', 'tr', 'td', 'th', 'section', 'article', 'header',
      'footer', 'nav', 'aside', 'details', 'summary',
      'button', 'input', 'label', 'form', 'select', 'option'
    ],
    
    // Atributos permitidos (CRÍTICO: incluir 'class' y 'style')
    ALLOWED_ATTR: [
      'class',        // ✅ CRÍTICO: Preservar clases CSS
      'style',        // ✅ CRÍTICO: Preservar estilos inline
      'id',           // Para acordeones, tabs, etc.
      'href', 'target', 'rel', 'title', 'aria-label', // Para enlaces
      'src', 'alt', 'width', 'height', 'loading', 'srcset', // Para imágenes
      'data-*',       // Para atributos data (Calendly, etc.)
      'aria-*',       // Para accesibilidad
      'role',         // Para roles ARIA
      'open',         // Para details/summary
      'type', 'value', 'name', 'for', 'checked', 'disabled' // Para formularios
    ],
    
    // Permitir todos los atributos data-*
    ALLOW_DATA_ATTR: true,
    
    // Mantener contenido incluso si el tag padre no está permitido
    KEEP_CONTENT: true,
    
    // Bloquear tags peligrosos
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
    
    // Bloquear atributos con eventos JavaScript
    FORBID_ATTR: [
      'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
      'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset'
    ],
    
    // Permitir estilos CSS en atributos style
    ALLOW_STYLE: true,
    
    // Permitir clases CSS
    ALLOW_CLASS: true
  });
}
```

---

### 5. Importar CSS Compartido Globalmente (Portal)

#### 5.1 Modificar `portal-startcompanies/src/styles.css` o `angular.json`

**Opción A: En `styles.css` (recomendado)**
```css
/* Importar estilos compartidos de componentes del blog */
@import './assets/styles/blog-components.css';
```

**Opción B: En `angular.json`**
```json
"styles": [
  "src/styles.css",
  "src/assets/styles/blog-components.css",  // Agregar esta línea
  // ... otros estilos
]
```

---

### 6. Verificar y Actualizar Estilos en Panel

#### 6.1 Actualizar `panel-startcompanies/src/styles.css`

**Agregar:**
```css
/* Importar estilos compartidos de componentes del blog */
@import './assets/styles/blog-components.css';
```

**O en `angular.json` del panel:**
```json
"styles": [
  "src/styles.css",
  "src/assets/styles/blog-components.css",  // Agregar
  // ... otros estilos
]
```

---

## 📝 Checklist de Implementación

### Fase 1: Preparación
- [ ] Crear archivo `blog-components.css` consolidando todos los estilos
- [ ] Revisar y eliminar duplicados de estilos
- [ ] Documentar qué componentes tienen estilos (abre-corp-card, promo-card, etc.)

### Fase 2: Panel (Editor)
- [ ] Copiar `blog-components.css` a `panel-startcompanies/src/assets/styles/`
- [ ] Actualizar `editor.component.ts` para usar CSS compartido
- [ ] Simplificar `content_style` en TinyMCE
- [ ] Verificar que los estilos se ven correctamente en el editor

### Fase 3: Portal (Visualización)
- [ ] Copiar `blog-components.css` a `portal-startcompanies/src/assets/styles/`
- [ ] Importar CSS en `post-content.component.css` o globalmente
- [ ] Actualizar `HtmlSanitizerService` con nueva configuración
- [ ] Modificar `PostContentComponent` para usar `HtmlSanitizerService`
- [ ] Verificar que las clases se preservan después de sanitización

### Fase 4: Testing
- [ ] Crear un post de prueba con todos los componentes reutilizables
- [ ] Verificar estilos en el editor (panel)
- [ ] Verificar estilos en el portal
- [ ] Verificar que las clases CSS están presentes en el HTML renderizado
- [ ] Verificar que no hay scripts maliciosos ejecutándose
- [ ] Probar con posts existentes (compatibilidad hacia atrás)

### Fase 5: Limpieza
- [ ] Eliminar estilos duplicados de `editor-content.css` (panel)
- [ ] Eliminar estilos duplicados de `post-content.component.css` (portal)
- [ ] Actualizar documentación si es necesario

---

## 🔍 Verificación Post-Implementación

### Verificar que las clases se preservan:

1. **En el navegador (DevTools):**
   - Abrir un post en el portal
   - Inspeccionar elementos con clases como `.abre-corp-card`
   - Verificar que las clases están presentes en el HTML
   - Verificar que los estilos se aplican correctamente

2. **En el código:**
   ```typescript
   // Agregar log temporal para verificar
   console.log('HTML después de sanitización:', this.sanitizedHtml);
   // Verificar que contiene class="abre-corp-card" etc.
   ```

3. **Verificar seguridad:**
   - Intentar insertar `<script>alert('XSS')</script>` en un post
   - Verificar que el script NO se ejecuta
   - Verificar que el script es eliminado del HTML

---

## ⚠️ Consideraciones Importantes

### 1. Ubicación del CSS Compartido

**Opción A: Copiar a ambos proyectos** (Recomendado para independencia)
- `panel-startcompanies/src/assets/styles/blog-components.css`
- `portal-startcompanies/src/assets/styles/blog-components.css`
- Mantener sincronizados manualmente o con script

**Opción B: Servir desde un CDN o ubicación compartida**
- Más complejo de configurar
- Requiere servidor compartido

### 2. Compatibilidad con Contenido Existente

- Los posts existentes deberían funcionar sin cambios
- Si hay posts con HTML mal formado, puede requerir limpieza manual
- Hacer backup de la base de datos antes de cambios grandes

### 3. Performance

- El CSS compartido se carga una vez al inicio
- DOMPurify agrega un pequeño overhead, pero es mínimo
- Considerar lazy loading del CSS si es muy grande

### 4. Mantenimiento Futuro

- Todos los nuevos componentes deben agregar estilos a `blog-components.css`
- Documentar la estructura de clases CSS
- Usar nombres de clases consistentes (BEM, OOCSS, etc.)

---

## 🐛 Troubleshooting

### Problema: Las clases no se preservan
**Solución:**
- Verificar que `ALLOWED_ATTR` incluye `'class'` en DOMPurify
- Verificar que `ALLOW_CLASS: true` está configurado
- Revisar logs de consola para errores

### Problema: Los estilos no se aplican
**Solución:**
- Verificar que el CSS está importado correctamente
- Verificar que `ViewEncapsulation.None` está en `PostContentComponent`
- Verificar que no hay conflictos con otros estilos globales

### Problema: Scripts maliciosos se ejecutan
**Solución:**
- Verificar que DOMPurify está configurado correctamente
- Verificar que `FORBID_TAGS` incluye `'script'`
- Revisar CSP (Content Security Policy) del navegador

---

## 📚 Referencias

- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Angular DomSanitizer](https://angular.io/api/platform-browser/DomSanitizer)
- [TinyMCE Content CSS](https://www.tiny.cloud/docs/tinymce/6/content-css/)

---

## 📅 Orden de Implementación Recomendado

1. **Crear CSS compartido** (Fase 1)
2. **Actualizar HtmlSanitizerService** (Fase 3 - parte 1)
3. **Actualizar PostContentComponent** (Fase 3 - parte 2)
4. **Actualizar editor del panel** (Fase 2)
5. **Testing completo** (Fase 4)
6. **Limpieza** (Fase 5)

---

## ✅ Resultado Esperado

Después de implementar estos cambios:

- ✅ Todos los estilos de componentes están en un solo archivo CSS
- ✅ Las clases CSS se preservan durante la sanitización
- ✅ Los estilos se ven igual en el editor y en el portal
- ✅ El HTML está sanitizado de forma segura (sin XSS)
- ✅ Mantenimiento centralizado y fácil
- ✅ Compatibilidad con posts existentes

---

**Última actualización:** 2025
**Versión:** 1.0




