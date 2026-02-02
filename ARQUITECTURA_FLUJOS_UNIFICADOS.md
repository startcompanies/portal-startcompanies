# Arquitectura de Flujos Unificados

Esta arquitectura unifica los flujos de solicitud (wizard, panel-cliente, panel-partner) en un sistema modular y reutilizable.

## Estructura

### Modelos y Tipos
- `shared/models/request-flow-context.ts`: Define los enums y tipos para contextos y pasos

### Servicios
- `shared/services/request-flow-config.service.ts`: Configura qué pasos mostrar según el contexto
- `shared/services/request-flow-state.service.ts`: Maneja el estado compartido del flujo

### Componentes Base
- `shared/components/base-request-flow/`: Componente base abstracto que maneja la navegación
- `shared/components/flow-steps-indicator/`: Indicador visual de pasos reutilizable

### Componentes Específicos
- `features/wizard/components/wizard-request-flow/`: Implementación para wizard
- `features/panel/components/panel-client-request-flow/`: Implementación para panel-cliente
- `features/panel/components/panel-partner-request-flow/`: Implementación para panel-partner

### Componentes de Paso
- `features/panel/components/client-association-step/`: Asociación de cliente (panel-cliente)
- `features/panel/components/partner-client-selection-step/`: Selección de cliente (panel-partner)

## Flujos Configurados

### Wizard (Cliente Final)
1. Registro
2. Verificación de Email
3. Selección Plan/Estado
4. Pago
5. Form de Servicio
6. Confirmación

### Panel - Cliente
1. Asociación de Cliente
2. Selección Plan/Estado
3. Pago
4. Form de Servicio
5. Confirmación

### Panel - Partner
1. Selección de Cliente
2. Form de Servicio
3. Confirmación

## Uso

### Ejemplo: Usar el flujo del wizard

```typescript
import { WizardRequestFlowComponent } from './features/wizard/components/wizard-request-flow/wizard-request-flow.component';

@Component({
  selector: 'app-my-wizard',
  template: `
    <app-wizard-request-flow
      [serviceType]="'apertura-llc'"
      (flowCompleted)="onFlowCompleted($event)">
    </app-wizard-request-flow>
  `
})
export class MyWizardComponent {
  onFlowCompleted(data: any) {
    console.log('Flujo completado:', data);
  }
}
```

### Ejemplo: Usar el flujo del panel-cliente

```typescript
import { PanelClientRequestFlowComponent } from './features/panel/components/panel-client-request-flow/panel-client-request-flow.component';

@Component({
  selector: 'app-panel-client',
  template: `
    <app-panel-client-request-flow
      [serviceType]="'renovacion-llc'"
      (flowCompleted)="onFlowCompleted($event)">
    </app-panel-client-request-flow>
  `
})
export class PanelClientComponent {
  onFlowCompleted(data: any) {
    console.log('Flujo completado:', data);
  }
}
```

### Ejemplo: Usar el flujo del panel-partner

```typescript
import { PanelPartnerRequestFlowComponent } from './features/panel/components/panel-partner-request-flow/panel-partner-request-flow.component';

@Component({
  selector: 'app-panel-partner',
  template: `
    <app-panel-partner-request-flow
      [serviceType]="'cuenta-bancaria'"
      (flowCompleted)="onFlowCompleted($event)">
    </app-panel-partner-request-flow>
  `
})
export class PanelPartnerComponent {
  onFlowCompleted(data: any) {
    console.log('Flujo completado:', data);
  }
}
```

## Extensión

Para agregar un nuevo paso o modificar un flujo existente:

1. Crear el componente del paso si no existe
2. Agregar el paso en `RequestFlowConfigService.getFlowConfig()`
3. Implementar la validación en el componente específico del flujo
4. Implementar el guardado de estado en el componente específico del flujo

## Ventajas

- ✅ Reutilización de código entre flujos
- ✅ Mantenibilidad mejorada
- ✅ Escalabilidad para nuevos contextos
- ✅ Separación clara de responsabilidades
- ✅ Testing más fácil
