# Comparación: Wizard vs New-Request

## Análisis de Estructuras

### **new-request** (Estructura Simple) ✅ RECOMENDADA

**Ventajas:**
- ✅ **Simplicidad**: Todo en un solo componente, fácil de entender
- ✅ **Funcionalidad probada**: Ya está funcionando correctamente
- ✅ **Navegación clara**: Botones "Anterior"/"Siguiente" en cada paso
- ✅ **Indicador visual**: Números de paso claros y visibles
- ✅ **Mantenibilidad**: Fácil de modificar y extender
- ✅ **Menos dependencias**: No requiere Angular Material Stepper
- ✅ **Mejor UX**: Botones dentro del contenido del paso

**Estructura:**
```typescript
currentStep = 1;
totalSteps = 4;

// Navegación simple
nextStep() { this.currentStep++; }
previousStep() { this.currentStep--; }

// Template simple
<div *ngIf="currentStep === 1">...</div>
<div *ngIf="currentStep === 2">...</div>
```

**Indicador de progreso:**
- Números con círculos
- Línea conectando los pasos
- Estados: active, completed, inactive

### **wizard** (Estructura Compleja) ⚠️

**Ventajas:**
- ✅ Modularidad: Componentes separados por paso
- ✅ Reutilización: Componentes pueden usarse en otros flujos
- ✅ Sistema de estado centralizado: `WizardStateService`

**Desventajas:**
- ❌ **Complejidad**: Múltiples componentes y servicios
- ❌ **Dependencias**: Requiere Angular Material Stepper
- ❌ **Navegación**: Botones fuera del contenido (en wizard-base)
- ❌ **Mantenimiento**: Más difícil de modificar
- ❌ **Overhead**: Más código para la misma funcionalidad

**Estructura:**
```typescript
// Múltiples componentes
- wizard-base.component (wrapper)
- basic-register-step.component
- state-plan-selection-step.component
- payment-step.component
- wizard-state.service
- wizard-config.service
```

## Recomendación

**Usar la estructura de `new-request`** porque:
1. Es más simple y funcional
2. Ya está probada y funcionando
3. Mejor experiencia de usuario (botones dentro del paso)
4. Más fácil de mantener y modificar
5. Menos código y dependencias

## Plan de Migración

Adaptar el wizard de apertura LLC para usar la estructura simple de `new-request`:
- Eliminar `mat-stepper` y `wizard-base`
- Usar `*ngIf` para mostrar/ocultar pasos
- Implementar indicador de progreso similar a `new-request`
- Mover botones dentro de cada paso
- Mantener los componentes de paso pero simplificarlos
