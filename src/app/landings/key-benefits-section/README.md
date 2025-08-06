# KeyBenefitsSectionComponent

Un componente estático para mostrar los beneficios de elegir Start Companies, con tarjetas en grid 2x2, iconos SVG y diseño moderno.

## Características

- ✅ Título con highlight azul ("Start Companies")
- ✅ Descripción y subtítulo con highlights
- ✅ 4 tarjetas de beneficios en grid 2x2
- ✅ Iconos SVG personalizados (idea, clock, globe, remote)
- ✅ Bordes azules en las tarjetas
- ✅ Diseño responsive
- ✅ Efectos hover en las tarjetas
- ✅ Componente completamente estático

## Uso

El componente es completamente estático y no requiere configuración:

```html
<app-key-benefits-section></app-key-benefits-section>
```

## Contenido estático

El componente muestra automáticamente:

### Título principal
"Beneficios de elegir **Start Companies**" (con "Start Companies" en azul)

### Descripción
"Nos encargamos de la burocracia para que tú te enfoques en crecer."

### Subtítulo
"Descubre por qué más de **200 clientes** nos califican como **excelente**." (con "200 clientes" y "excelente" en azul)

### 4 Tarjetas de beneficios

1. **Asesoría fiscal GRATUITA**
   - Icono: `assets/benefits/idea.svg`
   - Descripción: "Te acompañamos desde el inicio y solo pagas cuando entregamos la documentación."
   - Highlight: "GRATUITA" en azul

2. **Pagas al final**
   - Icono: `assets/benefits/clock.svg`
   - Descripción: "Solo pagas una vez que te entregamos toda la documentación de tu empresa."

3. **Opera Globalmente**
   - Icono: `assets/benefits/globe.svg`
   - Descripción: "Vende en Amazon, cobra con Stripe y accede a mercados internacionales sin restricciones."

4. **100% Remoto**
   - Icono: `assets/benefits/remote.svg`
   - Descripción: "No necesitas viajar ni ser residente. Gestiona todo el proceso desde la comodidad de tu hogar."

## Estilos

El componente incluye:

- Fondo blanco limpio
- Título principal en gris oscuro (#333) con "Start Companies" en azul (#00bcd4)
- Descripción y subtítulo en gris oscuro con highlights azules
- Grid 2x2 para las tarjetas de beneficios
- Tarjetas blancas con bordes azules (#00bcd4) y esquinas redondeadas
- Iconos SVG de 60x60px en color azul
- Efectos hover con elevación y sombra
- Diseño responsive para móviles y tablets

## Comportamiento

- **Grid responsive**: En móviles, las tarjetas se apilan en una columna
- **Efectos hover**: Las tarjetas se elevan ligeramente al pasar el mouse
- **Iconos SVG**: Se cargan desde `assets/benefits/`
- **Highlights**: Texto destacado en color azul (#00bcd4)

## Estructura de archivos

```
src/app/landings/key-benefits-section/
├── key-benefits-section.component.ts
├── key-benefits-section.component.html
├── key-benefits-section.component.css
├── key-benefits-section-example.html
└── README.md
```

## Dependencias

- Angular CommonModule
- Iconos SVG en `src/assets/benefits/`:
  - `idea.svg`
  - `clock.svg`
  - `globe.svg`
  - `remote.svg`

## Notas importantes

1. **Componente estático**: No requiere configuración ni propiedades de entrada
2. **Iconos SVG**: Deben estar disponibles en `src/assets/benefits/`
3. **Responsive**: Se adapta automáticamente a diferentes tamaños de pantalla
4. **Accesibilidad**: Los iconos incluyen atributos `alt` para accesibilidad
5. **Tipografía**: Usa el sistema de fuentes del sistema para mejor rendimiento 