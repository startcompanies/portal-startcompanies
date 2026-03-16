# Lili Account Creation Flow

## Resumen

El flujo actual de Lili quedó dividido en 2 partes:

1. `generate-lili-link-form`
   Genera el link de acceso para el cliente en frontend.

2. `/banking?t=...`
   Usa backend para crear la aplicación real en Lili y renderizar el embed.

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

Importante:

- Esta pantalla ya no necesita backend para generar el link porque Ignacio me pidió que sea público pero oculto en buscadores.

---

### 2. Cliente abre el link

Ruta:

`/banking?t=TOKEN`

Qué pasa:

- El guard valida que `t` exista, se pueda decodificar y no esté expirado.
- El componente lee el token y extrae los datos del cliente.
- Con esos datos llama al backend:

```text
POST /api/lili/create-application
```

- El backend usa las credenciales privadas de Lili para crear la aplicación.
- Lili responde con el token real del embed.
- El frontend inyecta `https://cdn.lili.co/connect.min.js` con ese token.
- El usuario completa el formulario embebido.

---

## Qué sigue necesitando backend

El backend sigue siendo obligatorio para:

- `POST /api/lili/create-application`
- `POST /api/lili/webhook`
- `GET /api/lili/webhook/inspect`
- `POST /api/lili/webhook/test`

Motivo:

- `create-application` usa `LILI_ACCESS_KEY` y `LILI_SECRET_KEY`.
- Esas credenciales no pueden exponerse en frontend.

Variables necesarias en backend:

```env
LILI_ACCESS_KEY=...
LILI_SECRET_KEY=...
LILI_ENV=Sandbox
```

---

## Dónde llega la notificación de resultado

El resultado final de Lili entra por webhook en:

```text
POST /api/lili/webhook
```

Qué envía Lili:

- Un `event`
- Un `data` con la información del caso

Ejemplo esperado:

```json
{
  "event": "onboardingComplete",
  "data": {
    "email": "user@example.com",
    "customerId": "cust-123",
    "personId": "person-456",
    "status": "approved"
  }
}
```

Qué hace hoy el proyecto:

- Guarda el evento en memoria para inspección.
- Normaliza el payload para extraer `event`, `status`, `personId`, `customerId`, `email` y `businessExternalId`.
- Lo imprime en consola.
- Responde `200`.

En `server.ts` ya existe el punto donde backend puede enganchar su lógica:

- Si `event === onboardingComplete`
  - actualizar CRM
  - guardar en DB
  - disparar email
  - marcar estado interno como cuenta creada
- Si `event === applicationRejected`
  - guardar rechazo
  - notificar al equipo
  - actualizar estado interno

Importante:

- El handler ahora tolera tanto payloads del estilo `{ event, data }` como payloads con `action` y campos top-level.
- En producción, el lugar correcto para integrar la lógica real es `POST /api/lili/webhook`.
- `GET /api/lili/webhook/inspect` es sólo para debugging.
- `POST /api/lili/webhook/test` es sólo para simular eventos en local/staging.

En otras palabras:

- El momento de "notificar resultado" no pasa en el frontend.
- Pasa cuando Lili llama al backend vía webhook.

---

## Flujo corto para backend

1. El admin genera el link en frontend.
2. El cliente abre `/banking?t=...`.
3. Frontend decodifica `t`.
4. Frontend llama a `POST /api/lili/create-application`.
5. Backend crea la aplicación en Lili.
6. Backend devuelve el token del embed.
7. Frontend monta el embed.
8. Lili puede notificar resultado por webhook.
