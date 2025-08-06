# StepsSectionComponent

Un componente estático para mostrar un proceso de 3 pasos para crear una LLC, con imagen de fondo, círculos conectados y texto blanco.

## Características

- ✅ Imagen de fondo fija (hero-bg.jpg)
- ✅ Título estático: "Tu LLC en menos de 7 días en 3 Pasos sencillos"
- ✅ 3 pasos predefinidos con círculos conectados
- ✅ Declaración final destacada
- ✅ Diseño responsive
- ✅ Overlay oscuro sobre la imagen para mejor legibilidad

## Uso

El componente es completamente estático y no requiere configuración:

```html
<app-steps-section></app-steps-section>
```

## Contenido estático

El componente muestra automáticamente:

### Título principal
"Tu LLC en menos de 7 días en 3 Pasos sencillos"

### 3 Pasos del proceso
1. **Elige tu Plan** - Selecciona el paquete de servicios que necesitas.
2. **Completa el Formulario** - Bríndanos la información de tu empresa en 5 minutos.
3. **Recibe tus Documentos** - Nosotros nos encargamos y te enviamos todo digitalmente.

### Declaración final
"¡Pagas solo cuando tienes tu cuenta de banco y empresa funcionando!"

## Estilos

El componente incluye:

- Imagen de fondo `assets/hero-bg.jpg` con overlay oscuro
- Título principal en texto blanco grande y bold
- Círculos blancos con números en color azul (#00bcd4)
- Línea conectora blanca entre los círculos
- Títulos de pasos en texto blanco bold
- Descripciones en texto blanco regular
- Declaración final destacada en texto blanco bold
- Diseño responsive para móviles y tablets

## Comportamiento

- **Imagen de fondo**: Se ajusta automáticamente para cubrir todo el contenedor
- **Overlay**: Se aplica automáticamente un overlay oscuro para mejorar la legibilidad
- **Círculos conectados**: Los círculos se conectan con una línea blanca
- **Responsive**: En móviles, los pasos se apilan verticalmente

## Notas importantes

1. **Componente estático**: No requiere configuración ni propiedades de entrada
2. **Imagen de fondo**: Usa `assets/hero-bg.jpg` por defecto
3. **Overlay**: Se aplica automáticamente un overlay oscuro (rgba(0, 0, 0, 0.3))
4. **Responsive**: Se adapta automáticamente a diferentes tamaños de pantalla
5. **Accesibilidad**: Los números de los pasos son claros y legibles

## Dependencias

- Angular CommonModule 