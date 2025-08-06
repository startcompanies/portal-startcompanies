# VideoGridSectionComponent

Un componente reutilizable para mostrar una cuadrícula de videos de testimonios con título, descripción y iframes de video organizados en filas.

## Características

- ✅ Diseño limpio y moderno con fondo gris claro
- ✅ Título con parte destacada en color azul
- ✅ Descripción opcional
- ✅ Cuadrícula de videos organizados en filas
- ✅ Iframes de video sin bordes con autoplay y mute
- ✅ Diseño responsive
- ✅ Componente completamente reutilizable
- ✅ Soporte para múltiples videos (se agrupan automáticamente)

## Uso

### Propiedades de entrada (Inputs)

| Propiedad | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `title` | string | No | Primera parte del título principal |
| `titleHighlight` | string | No | Parte destacada del título (aparece en azul) |
| `description` | string | No | Descripción que aparece debajo del título |
| `videos` | VideoTestimonial[] | No | Array de videos de testimonios |
| `maxVideosPerRow` | number | No | Máximo número de videos por fila (default: 3) |

### Interface VideoTestimonial

```typescript
interface VideoTestimonial {
  id: string;           // ID único del video
  url: string;          // URL del video (debe ser una URL de embed)
  title: string;        // Título del video para accesibilidad
  thumbnail?: string;   // URL de la miniatura (opcional)
}
```

### Ejemplo básico

```html
<app-video-grid-section
  title="Escucha a la comunidad"
  titleHighlight="¡Creación LLC!"
  description="Mira lo que nuestros clientes tienen que decir sobre nosotros."
  [videos]="[
    {
      id: '1',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Testimonio de Juan Pérez'
    },
    {
      id: '2',
      url: 'https://www.youtube.com/embed/example2',
      title: 'Testimonio de María García'
    },
    {
      id: '3',
      url: 'https://www.youtube.com/embed/example3',
      title: 'Testimonio de Carlos López'
    }
  ]">
</app-video-grid-section>
```

### Ejemplo con configuración personalizada

```html
<app-video-grid-section
  title="Nuestros"
  titleHighlight="testimonios"
  [maxVideosPerRow]="2"
  [videos]="testimoniosArray">
</app-video-grid-section>
```

## Estilos

El componente incluye:

- Fondo gris claro (#f8f9fa)
- Diseño centrado y limpio
- Tipografía moderna (sistema de fuentes del sistema)
- Colores: gris oscuro (#333) para texto principal, azul (#00bcd4) para destacados
- Cuadrícula de videos con aspecto ratio 16:9
- Bordes blancos entre videos
- Sombras suaves y bordes redondeados
- Diseño responsive para móviles y tablets

## Comportamiento

- **Agrupación automática**: Los videos se agrupan automáticamente en filas según `maxVideosPerRow`
- **Autoplay**: Los videos se reproducen automáticamente (silenciados por defecto)
- **Responsive**: En móviles, los videos se apilan verticalmente
- **Flexible**: Soporta cualquier número de videos

## Notas importantes

1. **URLs de video**: Debe usar URLs de embed (ej: `https://www.youtube.com/embed/VIDEO_ID`)
2. **Seguridad**: El componente usa `DomSanitizer` para manejar URLs de manera segura
3. **Responsive**: Se adapta automáticamente a diferentes tamaños de pantalla
4. **Accesibilidad**: Incluye atributos `title` para los iframes
5. **Autoplay**: Los videos están silenciados por defecto (requerido por los navegadores)

## Dependencias

- Angular CommonModule
- Angular PlatformBrowser (DomSanitizer) 