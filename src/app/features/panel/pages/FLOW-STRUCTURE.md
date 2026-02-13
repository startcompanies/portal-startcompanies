# Estructura del flujo de solicitudes (panel y wizard)

Este documento describe cómo está organizado el flujo de solicitudes en el portal: **una base compartida** entre wizard (público) y panel (usuarios autenticados), para que los pasos y la lógica sean los mismos y no haya conflictos ni duplicación.

---

## 1. Por qué una sola entrada en el panel

El flujo de solicitudes del panel (nueva solicitud o continuar borrador) tiene **una sola entrada canónica:** el componente **new-request**. Las rutas bajo `request-flow` (select-service, client/partner) existen para elegir tipo de servicio o por compatibilidad con enlaces antiguos, pero **todo el flujo real** (pasos, borrador, pago, formulario de servicio, confirmación) se ejecuta dentro de **new-request**, que usa el mismo **BaseRequestFlowComponent** que el wizard. Así:

- Los pasos son los mismos (p. ej. pago, información del servicio, confirmación).
- El `currentStep` / `currentStepNumber` se guarda y restaura igual.
- No hay dos “versiones” del flujo (una en new-request y otra en request-flow).

---

## 2. Entrada canónica: new-request

- **Rutas:**  
  - `/panel/new-request`  
  - `/panel/new-request/:uuid` (continuar borrador)
- **Componente:** `pages/new-request/new-request.component.ts` (**NewRequestComponent**).

NewRequestComponent actúa como **orquestador**: lee la URL, valida acceso y delega en el flujo base.

### Qué lee de la URL

- **Params:** `uuid` (solo en `/panel/new-request/:uuid`).
- **QueryParams:** `serviceType`, `client`, `clientId`.

### Casos que maneja (en orden)

1. **Continuar borrador**  
   Si hay `uuid` en la ruta → carga la solicitud por UUID, valida que el usuario tenga acceso (cliente: `request.client.userId === currentUser.id`; partner: permitido), y arranca el flujo con `draftRequestUuid` y `serviceType` (o el tipo de la request). El base restaura el paso con `request.currentStep`.

2. **Nueva solicitud con cliente pre-seleccionado**  
   Si hay `client` o `clientId` en query (ej. desde “Mis clientes”) → solo para partners. Resuelve el cliente y arranca el flujo con `initialClientId` y `serviceType` (o redirige a select-service si falta tipo).

3. **Nueva solicitud sin tipo**  
   Si no hay `serviceType` → redirige a **`/panel/request-flow/select-service`** para que el usuario elija el tipo de servicio.

4. **Nueva solicitud con tipo**  
   Si hay `serviceType` en query (ej. después de select-service) → arranca el flujo sin borrador, solo con `serviceType`.

### Qué muestra según el rol

- **Partner:** `PanelPartnerRequestFlowComponent` (con `draftRequestUuid` y/o `initialClientId` si aplica).
- **Cliente:** `PanelClientRequestFlowComponent` (con `draftRequestUuid` si aplica).

Ambos componentes son un wrapper fino que inyecta **contexto** (panel-partner / panel-client) y delega en el **mismo base:** `BaseRequestFlowComponent`.

---

## 3. request-flow: solo selección de tipo (y redirecciones)

- **Ruta:** `/panel/request-flow/select-service`  
- **Componente:** `pages/request-flow/select-service-type-page.component.ts`  
- **Función:** pantalla para elegir tipo de servicio (apertura-llc, renovación-llc, cuenta-bancaria). Al continuar, navega a **`/panel/new-request?serviceType=...`** (entrada canónica).

Rutas de compatibilidad (enlaces antiguos):

- `/panel/request-flow/client/:serviceType`  
- `/panel/request-flow/partner/:serviceType`  

Ambas cargan **RequestFlowRedirectComponent**, que redirige a **`/panel/new-request?serviceType=...`** (y preserva query params). Así no hay dos entradas al flujo.

---

## 4. Base compartida (wizard + panel)

Todo el flujo de pasos (indicador, navegación, validación, guardado) vive en:

- **Componente base:** `shared/components/base-request-flow/base-request-flow.component.ts` (**BaseRequestFlowComponent**).
- **Configuración de pasos:** `shared/services/request-flow-config.service.ts` (**RequestFlowConfigService**).
- **Estado del flujo:** `shared/services/request-flow-state.service.ts` (**RequestFlowStateService**).
- **Borradores:** `shared/services/draft-request.service.ts` (**DraftRequestService**).

### Contextos (`RequestFlowContext`)

- **`wizard`** – Usuario no autenticado: registro → verificación email → estado/plan → pago → información del servicio → confirmación.
- **`panel-client`** – Cliente autenticado: asociación de cliente → estado/plan (si aplica) → pago → información del servicio → confirmación.
- **`panel-partner`** – Partner: selección de cliente → estado/plan (si aplica) → pago → información del servicio → confirmación.

Los **pasos centrales** (estado/plan, pago, formulario de servicio, confirmación) son los mismos; solo cambian los primeros pasos según el contexto.

### Jerarquía de componentes (panel)

```
NewRequestComponent (orquestador)
  └── PanelPartnerRequestFlowComponent | PanelClientRequestFlowComponent
        └── BaseRequestFlowComponent
              └── RequestFlowConfigService.getFlowConfig(context, serviceType)
              └── Por cada paso: componente del paso (PanelPaymentStep, PanelLlcInformationStep, etc.)
```

El wizard usa la misma base:

```
WizardRequestFlowPageComponent
  └── WizardRequestFlowComponent
        └── BaseRequestFlowComponent (context = wizard)
```

### Restauración del paso al cargar borrador

Al cargar un borrador por UUID, **BaseRequestFlowComponent** usa `request.currentStep` (1-based) de la API para fijar `currentStepIndex` y no volver al paso 1. Si la API no envía `currentStep`, se infiere el paso a partir de los datos hidratados (pago procesado, datos del servicio, etc.).

---

## 5. Resumen de rutas del panel

| Ruta | Uso |
|------|-----|
| `/panel/new-request` | Nueva solicitud (opcional: `?serviceType=...`, `?client=...`, `?clientId=...`). |
| `/panel/new-request/:uuid` | Continuar borrador; acceso validado por rol y asignación. |
| `/panel/request-flow/select-service` | Elegir tipo de servicio → navega a `new-request?serviceType=...`. |
| `/panel/request-flow/client/:serviceType` | Redirige a `new-request?serviceType=...`. |
| `/panel/request-flow/partner/:serviceType` | Redirige a `new-request?serviceType=...`. |

Enlaces desde otras partes del panel (p. ej. “Mis clientes”) deben apuntar a **`/panel/new-request`** (con query params si hace falta), no a `request-flow/client` o `request-flow/partner`.
