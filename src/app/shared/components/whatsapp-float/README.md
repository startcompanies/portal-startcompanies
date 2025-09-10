# Componente WhatsApp Flotante

Este componente muestra un botón flotante de WhatsApp en la esquina inferior derecha de las páginas principales del sitio.

## Configuración

Para configurar el componente, edita el archivo `src/app/config/whatsapp.config.ts`:

```typescript
export const whatsappConfig = {
  phoneNumber: '+17869354213', // Número real de WhatsApp de Start Companies
  defaultMessage: 'Hola, vengo de Start Companies. Tengo algunas consultas para hacerles.',
  tooltipText: '¡Chatea con nosotros!',
  excludedRoutes: [
    '/blog',
    '/abre-tu-llc',
    '/presentacion', 
    '/apertura-banco-relay',
    '/agendar',
    '/apertura-llc',
    '/renovar-llc',
    '/form-apertura-relay',
    '/fixcal',
    '/abotax'
  ]
};
```

## Funcionalidad

- **Aparece en**: Páginas principales (inicio, nosotros, contacto, planes)
- **No aparece en**: Blog, landing pages, formularios
- **Comportamiento**: Al hacer clic abre WhatsApp con un mensaje predeterminado
- **Responsive**: Se adapta a dispositivos móviles
- **Animación**: Efecto de pulso y hover

## Estilos

El componente incluye:
- Posicionamiento fijo en esquina inferior derecha
- Color verde oficial de WhatsApp (#25D366)
- Animación de pulso
- Tooltip al hacer hover
- Diseño responsive
