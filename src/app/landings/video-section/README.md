# VideoSectionComponent

Un componente reutilizable para mostrar secciones de video con título, subtítulo, descripción y un iframe de video.

## Características

- ✅ Diseño limpio y moderno
- ✅ Título con parte destacada en color azul
- ✅ Subtítulo opcional
- ✅ Descripción opcional
- ✅ Iframe de video sin bordes
- ✅ Placeholder cuando no hay video
- ✅ Diseño responsive
- ✅ Componente completamente reutilizable

## Uso

### Propiedades de entrada (Inputs)

| Propiedad | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `subtitle` | string | No | Subtítulo que aparece arriba del título principal |
| `title` | string | No | Primera parte del título principal |
| `titleHighlight` | string | No | Parte destacada del título (aparece en azul) |
| `description` | string | No | Descripción que aparece debajo del título |
| `videoUrl` | string | No | URL del video (debe ser una URL de embed) |
| `videoTitle` | string | No | Título del video para accesibilidad (default: 'Video') |

### Ejemplo básico

```html
<app-video-section
  subtitle="Creación LLC"
  title="¡Basta de"
  titleHighlight="Impuestos y Comisiones!"
  description="Mira nuestro video para entender cómo simplificamos tu negocio"
  videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
  videoTitle="Video explicativo">
</app-video-section>
```

### Ejemplo con solo título y video

```html
<app-video-section
  title="Nuestro proceso"
  titleHighlight="simplificado"
  videoUrl="https://www.youtube.com/embed/example">
</app-video-section>
```

### Ejemplo sin video (solo placeholder)

```html
<app-video-section
  subtitle="Próximamente"
  title="Nuevo"
  titleHighlight="contenido"
  description="Estamos preparando contenido especial para ti">
</app-video-section>
```

## Estilos

El componente incluye:

- Diseño centrado y limpio
- Tipografía moderna (sistema de fuentes del sistema)
- Colores: gris oscuro (#333) para texto principal, azul (#00bcd4) para destacados
- Contenedor de video con aspecto ratio 16:9
- Sombras suaves y bordes redondeados
- Diseño responsive para móviles y tablets

## Notas importantes

1. **URLs de video**: Debe usar URLs de embed (ej: `https://www.youtube.com/embed/VIDEO_ID`)
2. **Seguridad**: El componente usa `DomSanitizer` para manejar URLs de manera segura
3. **Responsive**: Se adapta automáticamente a diferentes tamaños de pantalla
4. **Accesibilidad**: Incluye atributos `title` para el iframe

## Dependencias

- Angular CommonModule
- Angular PlatformBrowser (DomSanitizer) 