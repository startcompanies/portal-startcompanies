# Guía de Migración - Reorganización del Proyecto

Esta guía te ayudará a migrar la estructura actual a la nueva organización propuesta.

## ⚠️ Antes de Empezar

1. **Crear una rama nueva**: `git checkout -b refactor/reorganize-structure`
2. **Hacer commit del estado actual**: `git commit -am "Estado antes de reorganización"`
3. **Backup**: Asegúrate de tener un backup del proyecto

## 📋 Checklist de Migración

### Fase 1: Crear Nueva Estructura

- [ ] Crear carpeta `core/`
- [ ] Crear carpeta `features/`
- [ ] Crear carpeta `features/public/`
- [ ] Crear carpeta `features/wizard/`
- [ ] Crear carpeta `features/panel/`
- [ ] Crear subcarpetas dentro de `features/public/`
- [ ] Crear subcarpetas dentro de `features/wizard/`

### Fase 2: Migrar Core

- [ ] Mover `app.component.ts` → `core/app.component.ts`
- [ ] Mover `app.config.ts` → `core/app.config.ts`
- [ ] Mover `app.routes.ts` → `core/app.routes.ts`
- [ ] Mover `config/` → `core/config/`
- [ ] Actualizar imports en `main.ts` y `main.server.ts`

### Fase 3: Migrar Shared

- [ ] Mover `sc-header/` → `shared/components/header/`
- [ ] Mover `sc-footer/` → `shared/components/footer/`
- [ ] Consolidar servicios de `/services` y `/shared/services` → `shared/services/`
- [ ] Actualizar todos los imports de header y footer
- [ ] Actualizar imports de servicios consolidados

### Fase 4: Migrar Features Públicas

#### 4.1 Homepage
- [ ] Mover `sc-content/` → `features/public/home/home.component.ts`
- [ ] Mover `sections/` → `features/public/home/sections/`
- [ ] Actualizar rutas en `app.routes.ts`
- [ ] Actualizar imports

#### 4.2 Blog
- [ ] Decidir si usar `blog/` o `blogV2/` (recomendado: blogV2)
- [ ] Mover blog elegido → `features/public/blog/`
- [ ] Eliminar la versión no usada
- [ ] Actualizar rutas
- [ ] Actualizar imports

#### 4.3 Páginas Estáticas
- [ ] Mover `us/` → `features/public/pages/about-us/`
- [ ] Mover `contact/` → `features/public/pages/contact/`
- [ ] Mover `plans/` → `features/public/pages/plans/`
- [ ] Mover `legal/` → `features/public/pages/legal/`
- [ ] Actualizar rutas
- [ ] Actualizar imports

#### 4.4 Landing Pages
- [ ] Mover `landings/` → `features/public/landings/`
- [ ] Organizar componentes compartidos en `landings/shared/`
- [ ] Actualizar rutas
- [ ] Actualizar imports

#### 4.5 Formularios
- [ ] Mover `manejo-llc/` → `features/public/forms/`
- [ ] Renombrar componentes si es necesario
- [ ] Actualizar rutas
- [ ] Actualizar imports

### Fase 5: Migrar Wizard

- [ ] Mover `wizard/` → `features/wizard/`
- [ ] Reorganizar en `components/`, `flows/`, `services/`
- [ ] Actualizar rutas
- [ ] Actualizar imports

### Fase 6: Preparar Panel

- [ ] Crear estructura base de `features/panel/`
- [ ] Crear layout básico
- [ ] Crear guards de autenticación
- [ ] Preparar rutas protegidas (comentadas por ahora)

### Fase 7: Limpieza

- [ ] Eliminar carpetas vacías antiguas
- [ ] Buscar y actualizar todos los imports rotos
- [ ] Verificar que no haya referencias a rutas antiguas
- [ ] Ejecutar `ng build` y verificar errores
- [ ] Ejecutar tests si existen

## 🔧 Comandos Útiles

### Buscar imports que necesitan actualizarse

```bash
# Buscar imports de sc-header
grep -r "from './sc-header" src/
grep -r "from '../sc-header" src/
grep -r "from '../../sc-header" src/

# Buscar imports de sc-footer
grep -r "from './sc-footer" src/
grep -r "from '../sc-footer" src/
grep -r "from '../../sc-footer" src/

# Buscar imports de sc-content
grep -r "from './sc-content" src/
grep -r "from '../sc-content" src/
grep -r "from '../../sc-content" src/

# Buscar imports de manejo-llc
grep -r "from './manejo-llc" src/
grep -r "from '../manejo-llc" src/
```

### Verificar que no haya referencias rotas

```bash
# Buscar referencias a rutas antiguas
grep -r "sc-content" src/
grep -r "sc-header" src/
grep -r "sc-footer" src/
grep -r "manejo-llc" src/
```

## 📝 Ejemplo de Actualización de Imports

### Antes:
```typescript
import { ScHeaderComponent } from '../sc-header/sc-header.component';
import { ScFooterComponent } from '../sc-footer/sc-footer.component';
import { ScContentComponent } from '../sc-content/sc-content.component';
```

### Después:
```typescript
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { HomeComponent } from '../../features/public/home/home.component';
```

## 🧪 Verificación Post-Migración

1. **Build de desarrollo**
   ```bash
   npm run start
   ```
   - Verificar que la aplicación inicia sin errores
   - Navegar por todas las rutas principales

2. **Build de producción**
   ```bash
   npm run build:production
   ```
   - Verificar que compila sin errores
   - Verificar tamaño del bundle

3. **SSR**
   ```bash
   npm run build:ssr
   npm run serve:ssr
   ```
   - Verificar que SSR funciona correctamente

4. **Rutas**
   - Verificar que todas las rutas públicas funcionan
   - Verificar que las rutas de wizard funcionan
   - Verificar redirecciones de idioma

5. **SEO**
   - Verificar que los meta tags se generan correctamente
   - Verificar sitemap

## 🐛 Problemas Comunes y Soluciones

### Error: "Cannot find module"
- **Causa**: Import path incorrecto después de la migración
- **Solución**: Actualizar el import path relativo

### Error: "Component is not a standalone component"
- **Causa**: Falta importar el componente en el módulo/componente padre
- **Solución**: Agregar el componente a los imports

### Error: "Route not found"
- **Causa**: Ruta no actualizada en `app.routes.ts`
- **Solución**: Verificar y actualizar las rutas

### Error: "Service not provided"
- **Causa**: Servicio no está en los providers correctos
- **Solución**: Verificar que el servicio esté en `app.config.ts` o en el componente

## 📊 Progreso de Migración

Marca tu progreso aquí:

- [ ] Fase 1: Estructura creada
- [ ] Fase 2: Core migrado
- [ ] Fase 3: Shared migrado
- [ ] Fase 4: Features públicas migradas
- [ ] Fase 5: Wizard migrado
- [ ] Fase 6: Panel preparado
- [ ] Fase 7: Limpieza completada
- [ ] Testing completado
- [ ] Code review
- [ ] Merge a main

## 💡 Tips

1. **Migrar módulo por módulo**: No intentes migrar todo de una vez
2. **Hacer commits frecuentes**: Commit después de cada módulo migrado
3. **Probar después de cada cambio**: No esperes hasta el final para probar
4. **Usar find & replace**: Para actualizar imports masivamente (con cuidado)
5. **Mantener las URLs iguales**: No cambies las rutas públicas para mantener SEO

## 🆘 Si Algo Sale Mal

1. **Revertir cambios**: `git reset --hard HEAD` (cuidado, perderás cambios)
2. **Revisar logs**: Ver errores en consola del navegador y terminal
3. **Comparar con backup**: Comparar estructura con el backup original
4. **Pedir ayuda**: Si estás bloqueado, documenta el error y pide ayuda
