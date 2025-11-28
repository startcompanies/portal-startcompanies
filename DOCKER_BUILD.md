# Docker Build Dinámico - Guía de Uso

Este proyecto usa **build arguments** de Docker para construir diferentes entornos (production, staging, development) desde el mismo Dockerfile.

## Build Arguments Disponibles

| Argumento | Valores | Default | Descripción |
|-----------|---------|---------|-------------|
| `BUILD_CONFIGURATION` | `production`, `staging`, `development` | `production` | Configuración de build de Angular |
| `NODE_ENV` | `production`, `development` | `production` | Entorno de Node.js |

## Scripts NPM Disponibles

| Script | Descripción | NODE_ENV |
|--------|-------------|----------|
| `npm run build` | Build básico (development) | development |
| `npm run build:production` | Build producción sin optimización de imágenes | production |
| `npm run build:production:pwa` | Build producción completo con optimización | production |
| `npm run build:staging` | Build staging sin optimización de imágenes | production |
| `npm run build:staging:pwa` | Build staging completo con optimización | production |
| `npm run docker:build` | Build Docker para producción | production |
| `npm run docker:build:staging` | Build Docker para staging | production |

**Nota importante:** Staging usa `NODE_ENV=production` (igual que producción) pero con `environment.staging.ts` que apunta a `startcompanies.io`.

## Uso con Docker CLI

### Build para Producción (startcompanies.us)
```bash
docker build \
  --build-arg BUILD_CONFIGURATION=production \
  --build-arg NODE_ENV=production \
  -t portal-startcompanies:production \
  .
```

O usando el script npm:
```bash
npm run docker:build
```

### Build para Staging (startcompanies.io)
```bash
docker build \
  --build-arg BUILD_CONFIGURATION=staging \
  --build-arg NODE_ENV=production \
  -t portal-startcompanies:staging \
  .
```

O usando el script npm:
```bash
npm run docker:build:staging
```

### Build para Desarrollo
```bash
docker build \
  --build-arg BUILD_CONFIGURATION=development \
  --build-arg NODE_ENV=development \
  -t portal-startcompanies:dev \
  .
```

## Uso con Dockploy

En Dockploy, puedes configurar los build arguments en la sección **"Build-time Variables"**:

### Para Producción:
```
BUILD_CONFIGURATION=production
NODE_ENV=production
```

### Para Staging:
```
BUILD_CONFIGURATION=staging
NODE_ENV=production
```

### Para Desarrollo:
```
BUILD_CONFIGURATION=development
NODE_ENV=development
```

## Configuraciones de Angular

Cada configuración usa un archivo `environment` diferente:

- **production**: Usa `environment.prod.ts` → `startcompanies.us` (NODE_ENV=production)
- **staging**: Usa `environment.staging.ts` → `startcompanies.io` (NODE_ENV=production)
- **development**: Usa `environment.ts` → `localhost` o `startcompanies.us` (NODE_ENV=development)

**Importante:** Tanto `production` como `staging` usan `NODE_ENV=production` porque ambos son entornos de producción. La diferencia está en el archivo de environment que se carga:
- Production carga `environment.prod.ts` con dominio `startcompanies.us`
- Staging carga `environment.staging.ts` con dominio `startcompanies.io`

## Variables de Entorno en Runtime

El servidor Node.js detecta automáticamente el dominio desde el header `Host` del request, por lo que los sitemaps y robots.txt se generan dinámicamente con el dominio correcto.

### Variables de Entorno Opcionales (Runtime)

Si necesitas forzar un dominio específico en runtime, puedes pasar estas variables al contenedor:

```bash
docker run -e DOMAIN=startcompanies.io portal-startcompanies:staging
```

O en Dockploy, en la sección **"Environment Variables"**:
```
DOMAIN=startcompanies.io
```

## Ejemplo Completo con Dockploy

### Configuración para Producción (startcompanies.us)

**Build-time Variables:**
```
BUILD_CONFIGURATION=production
NODE_ENV=production
```

**Environment Variables (Runtime):**
```
NODE_ENV=production
PORT=4000
```

### Configuración para Staging (startcompanies.io)

**Build-time Variables:**
```
BUILD_CONFIGURATION=staging
NODE_ENV=production
```

**Environment Variables (Runtime):**
```
NODE_ENV=production
PORT=4000
DOMAIN=startcompanies.io
```

## Verificación

Después del build, puedes verificar qué configuración se usó:

```bash
docker run --rm portal-startcompanies:staging env | grep BUILD_CONFIGURATION
```

O revisar los logs durante el build para ver:
```
Build Configuration: staging
Building for STAGING...
```

## Referencias

- [Docker Build Arguments](https://docs.docker.com/build/building/variables/)
- [Angular Environment Configuration](https://angular.io/guide/build#configuring-application-environments)

