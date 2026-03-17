# Lili Account Creation Flow

## Resumen

El flujo actual de Lili quedó separado entre dos repositorios:

1. `portal-startcompanies`
   Genera el link y renderiza el embed.

2. `api-panel-startcompanies`
   Crea la aplicación en Lili y recibe webhooks.

Importante:

- El frontend ya no depende del `server.ts` del portal para Lili.
- La lógica backend real quedó movida al repo `api-panel-startcompanies`.

---

## Repositorios involucrados

### Frontend

Repo:

`/Users/martinpoblet/Documents/GitHub/portal-startcompanies`

Responsabilidades:

- mostrar `/generate-lili-link-form`
- generar el token `?t=...` en frontend
- validar el token en `/banking`
- llamar al backend real
- montar el embed de Lili

Archivo importante:

- [`src/app/features/lili/services/lili.service.ts`](/Users/martinpoblet/Documents/GitHub/portal-startcompanies/src/app/features/lili/services/lili.service.ts)

Hoy llama a:

```text
${environment.apiUrl}/lili/create-application
```

En local:

```text
http://localhost:3000/lili/create-application
```

### Backend

Repo:

`/Users/martinpoblet/Documents/GitHub/api-panel-startcompanies`

Rama de trabajo:

`feature/lili-integration`

Módulo nuevo:

- [`src/lili/lili.module.ts`](/Users/martinpoblet/Documents/GitHub/api-panel-startcompanies/src/lili/lili.module.ts)
- [`src/lili/lili.controller.ts`](/Users/martinpoblet/Documents/GitHub/api-panel-startcompanies/src/lili/lili.controller.ts)
- [`src/lili/lili.service.ts`](/Users/martinpoblet/Documents/GitHub/api-panel-startcompanies/src/lili/lili.service.ts)

Registrado en:

- [`src/app.module.ts`](/Users/martinpoblet/Documents/GitHub/api-panel-startcompanies/src/app.module.ts)

---

## Flujo actual

### 1. Admin genera el link

Ruta:

`/generate-lili-link-form`

Qué pasa:

- El admin completa `email`, `firstName`, `lastName` y `businessName`.
- El frontend genera un token `t` codificado en `base64url`.
- Ese token contiene:
  - `email`
  - `firstName`
  - `lastName`
  - `businessName`
  - `exp` (expiración a 48 horas)
- El link final queda así:

```text
/banking?t=TOKEN
```

---

### 2. Cliente abre el link

Ruta:

`/banking?t=TOKEN`

Qué pasa:

- El guard valida que `t` exista, se pueda decodificar y no esté expirado.
- El componente lee el token y extrae los datos del cliente.
- Con esos datos llama al backend:

```text
POST /lili/create-application
```

- El backend usa `LILI_ACCESS_KEY` y `LILI_SECRET_KEY`.
- Lili responde con el token real del embed.
- El frontend inyecta `https://cdn.lili.co/connect.min.js` con ese token.
- El usuario completa el formulario embebido.

---

## Endpoints reales del backend

Hoy los endpoints correctos están en `api-panel-startcompanies`:

- `POST /lili/create-application`
- `POST /lili/webhook`
- `GET /lili/webhook/inspect`
- `POST /lili/webhook/test`

Estos endpoints ya no dependen del `server.ts` del portal.

---

## Qué sigue necesitando backend

El backend sigue siendo obligatorio para:

- crear la aplicación real en Lili
- manejar webhooks de resultado
- exponer endpoints de inspección y test para debugging

Motivo:

- `create-application` usa credenciales privadas de Lili
- esas credenciales no pueden exponerse en frontend

Variables mínimas requeridas en backend:

```env
PORT=3000
MODE=DEV
SYNCHRONIZE=false

DB_HOST=localhost
DB_PORT=5432
DB_NAME=startcompanies
DB_USER=postgres
DB_PASSWORD=postgres

LILI_ACCESS_KEY=...
LILI_SECRET_KEY=...
LILI_ENV=Sandbox
```


---

## Dónde llega la notificación de resultado

El resultado final de Lili entra por webhook en:

```text
POST /lili/webhook
```

Qué hace hoy el backend:

- guarda el body crudo
- normaliza el payload
- extrae:
  - `event`
  - `status`
  - `personId`
  - `customerId`
  - `email`
  - `businessExternalId`
  - `token`
- lo deja disponible para inspección
- responde `200`

El handler soporta:

- payloads tipo `{ event, data }`
- payloads tipo `{ action, ... }`
- payloads con `status` o `onboardingStatus`

En otras palabras:

- el resultado final no lo maneja el frontend
- lo maneja el backend vía webhook

---

## Qué se validó localmente

Se confirmó en local:

- el backend Nest compila
- el backend Nest arranca en `http://localhost:3000`
- el módulo `LiliModule` carga correctamente
- `GET /lili/webhook/inspect` responde `200`
- `POST /lili/create-application` devuelve `token` y `location` válidos de Lili sandbox

Estado actual:

- la integración técnica frontend -> backend -> Lili quedó funcionando
- la aprobación final del onboarding sigue dependiendo de las validaciones/KYC internas de Lili

---

## Cómo probar local

### 1. Backend

Repo:

`api-panel-startcompanies`

Comando:

```bash
npm run start:dev
```

Validación esperada:

```text
Application is running on: http://0.0.0.0:3000
```

### 2. Frontend

Repo:

`portal-startcompanies`

Comando:

```bash
ng serve
```

### 3. Flujo

1. Abrir `http://localhost:4200/generate-lili-link-form`
2. Generar link
3. Abrir el link
4. Completar el onboarding en `/banking`

---

## Pruebas rápidas útiles

Inspección de webhooks:

```bash
curl http://localhost:3000/lili/webhook/inspect
```

Simular webhook:

```bash
curl -X POST http://localhost:3000/lili/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"event":"onboardingComplete"}'
```

Crear aplicación manualmente:

```bash
curl -X POST http://localhost:3000/lili/create-application \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lili-test@example.com",
    "firstName": "Lili",
    "lastName": "Test",
    "businessName": "Testing LLC"
  }'
```

---

## Flujo corto para backend

1. El admin genera el link en frontend.
2. El cliente abre `/banking?t=...`.
3. Frontend decodifica `t`.
4. Frontend llama a `POST /lili/create-application`.
5. Backend crea la aplicación en Lili.
6. Backend devuelve el token del embed.
7. Frontend monta el embed.
8. Lili puede notificar resultado por webhook en `POST /lili/webhook`.
