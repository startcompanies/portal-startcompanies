# Calendly Section Component

## Descripción
Componente que recrea la interfaz de Calendly para programación de citas y eventos. Incluye un calendario interactivo, selección de fechas, zonas horarias y diseño idéntico al original.

## Características
- ✅ **Interfaz idéntica a Calendly**: Diseño pixel-perfect del original
- ✅ **Calendario interactivo**: Navegación entre meses, selección de fechas
- ✅ **Logo personalizado**: Logo de Start Companies (logo-gary.png)
- ✅ **Zonas horarias**: Selector con múltiples opciones
- ✅ **Días disponibles**: Resaltados en azul como en la imagen
- ✅ **Responsive design**: Se adapta a todos los dispositivos
- ✅ **Animaciones suaves**: Transiciones y hover effects

## Instalación

### 1. Importar el componente
```typescript
import { CalendlySectionComponent } from './landings/calendly-section/calendly-section.component';

// En tu módulo o componente standalone
@Component({
  // ...
  imports: [CalendlySectionComponent]
})
```

### 2. Incluir Bootstrap Icons (si no está incluido)
```html
<!-- En el head de tu index.html -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
```

### 3. Asegurar que logo-gary.png esté disponible
```bash
# El archivo debe estar en: src/assets/logo-gary.png
```

## Uso Básico

### Implementación simple
```html
<app-calendly-section></app-calendly-section>
```

## Estructura del Componente

### Columna Izquierda - Detalles del Evento
- **Logo principal**: Logo de Start Companies (logo-gary.png)
- **Logo secundario**: Versión más pequeña del mismo logo
- **Organizador**: "Administracion Start Companies"
- **Título del evento**: "Test"
- **Duración**: "15 min" con icono de reloj

### Columna Derecha - Calendario
- **Título**: "Selecciona una fecha y hora"
- **Navegación de meses**: Botones para cambiar mes
- **Días de la semana**: DOM., LUN., MAR., etc.
- **Grid del calendario**: Días disponibles resaltados
- **Selector de zona horaria**: Dropdown con opciones

## Funcionalidades

### Navegación del Calendario
- **Anterior mes**: Botón con chevron izquierdo
- **Siguiente mes**: Botón con chevron derecho
- **Mes actual**: Muestra "junio 2025" por defecto

### Selección de Fechas
- **Días disponibles**: Resaltados en azul (#006afe)
- **Días pasados**: Gris y no seleccionables
- **Días con punto**: Indicador visual (día 18)
- **Selección**: Click para seleccionar fecha

### Zonas Horarias
- **Zona por defecto**: Ciudad de México (11:38am)
- **Opciones disponibles**:
  - Ciudad de México (11:38am)
  - Nueva York (1:38pm)
  - Los Ángeles (10:38am)
  - Londres (6:38pm)
  - Madrid (7:38pm)

## Datos por Defecto

### Junio 2025
- **Días disponibles**: 19, 20, 23, 24, 25, 26, 27, 30
- **Día con punto**: 18
- **Días pasados**: 1-17 (gris)

### Información del Evento
- **Organizador**: Administracion Start Companies
- **Título**: Test
- **Duración**: 15 min

## Estilos CSS

### Colores Principales
```css
--primary-blue: #006afe;
--background-gray: #f5f5f5;
--card-white: #ffffff;
--text-dark: #333;
--text-light: #666;
--border-color: #e5e5e5;
```

### Logo
```css
.logo-image {
  width: 60px;
  height: 60px;
  object-fit: contain;
  filter: brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%);
}
```

## Responsive Design

### Desktop (>768px)
- Layout horizontal con dos columnas
- Calendario completo visible
- Navegación de meses centrada

### Tablet (≤768px)
- Layout vertical
- Event details arriba
- Calendario abajo
- Navegación adaptada

### Mobile (≤480px)
- Padding reducido
- Fuentes más pequeñas
- Botones más compactos

## Interfaz de Usuario

### Elementos Interactivos
1. **Botones de navegación**: Cambiar mes
2. **Días del calendario**: Seleccionar fecha
3. **Selector de zona horaria**: Cambiar zona horaria
4. **Dropdown de zonas**: Lista de opciones

### Estados Visuales
- **Hover**: Efectos de hover en elementos interactivos
- **Selected**: Fecha seleccionada resaltada
- **Available**: Días disponibles en azul
- **Past**: Días pasados en gris
- **Disabled**: Elementos no disponibles

## Personalización

### Modificar Días Disponibles
```typescript
// En el componente
generateCalendarDays(year: number, month: number): void {
  // Cambiar estos arrays para modificar días disponibles
  const availableDays = [19, 20, 23, 24, 25, 26, 27, 30];
  const daysWithDot = [18];
}
```

### Agregar Zonas Horarias
```typescript
// En el componente
timezones: Timezone[] = [
  { name: 'Nueva Zona', time: '12:00pm', offset: '+0' },
  // ... más zonas
];
```

### Cambiar Información del Evento
```html
<!-- En el template -->
<div class="event-organizer">Tu Organización</div>
<div class="event-title">Tu Evento</div>
<div class="event-duration">
  <i class="bi bi-clock"></i>
  <span>30 min</span>
</div>
```

### Cambiar el Logo
```html
<!-- En el template -->
<img src="assets/tu-logo.png" alt="Tu Logo" class="logo-image">
```

## Accesibilidad

### Características Implementadas
- **Navegación por teclado**: Tab navigation
- **ARIA labels**: Para elementos interactivos
- **Contraste**: Colores con suficiente contraste
- **Focus indicators**: Estados de focus visibles

### Mejoras Sugeridas
- Agregar `aria-label` a botones de navegación
- Implementar `role` attributes para calendario
- Agregar `aria-live` para cambios dinámicos

## Dependencias

### Requeridas
- Angular CommonModule
- Bootstrap Icons (para iconos)
- Logo: `assets/logo-gary.png`

### Opcionales
- Angular Forms (para validación)
- Angular Router (para navegación)

## Ejemplo Completo

```html
<!-- En tu componente -->
<app-calendly-section></app-calendly-section>
```

```typescript
// En tu componente TypeScript
import { CalendlySectionComponent } from './landings/calendly-section/calendly-section.component';

@Component({
  selector: 'app-my-page',
  standalone: true,
  imports: [CalendlySectionComponent],
  template: `
    <div class="page-container">
      <h1>Programa tu cita</h1>
      <app-calendly-section></app-calendly-section>
    </div>
  `
})
export class MyPageComponent {}
```

## Notas Importantes

1. **Bootstrap Icons**: Asegúrate de tener Bootstrap Icons incluido
2. **Logo**: Verifica que `logo-gary.png` esté en `src/assets/`
3. **Responsive**: El componente se adapta automáticamente
4. **Interactividad**: Todos los elementos son funcionales
5. **Accesibilidad**: Implementa las mejoras sugeridas según necesidades
6. **Personalización**: Modifica los datos según tus requerimientos 