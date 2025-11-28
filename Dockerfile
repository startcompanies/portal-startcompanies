# Multi-stage build para Angular SSR optimizado para producción
FROM node:18-alpine AS builder

# Build arguments - configuración dinámica
# BUILD_CONFIGURATION: production, staging, development (default: production)
# Permite construir diferentes entornos desde el mismo Dockerfile
ARG BUILD_CONFIGURATION=production
ARG NODE_ENV=production

# Exponer como ENV para uso en runtime
ENV BUILD_CONFIGURATION=${BUILD_CONFIGURATION}
ENV NODE_ENV=${NODE_ENV}

# Instalar dependencias del sistema para compilación
# Sharp se instala vía npm, no es un paquete de Alpine
RUN apk add --no-cache python3 make g++ imagemagick

WORKDIR /app

# Copiar TODOS los archivos del proyecto primero
COPY . .

# Verificar que estamos en el directorio correcto y que es un proyecto Angular
RUN pwd && ls -la && \
    echo "Verificando archivos de Angular:" && \
    ls -la angular.json package.json tsconfig.json && \
    echo "Build Configuration: ${BUILD_CONFIGURATION}"

# Instalar TODAS las dependencias (incluyendo devDependencies para el build)
RUN npm install --legacy-peer-deps

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli@18

# Verificar que Angular CLI reconoce el proyecto
RUN ng version && ng config --global cli.warnings.versionMismatch false

# Pipeline optimizado de imágenes y build dinámico
# 1. Validar y generar solo las imágenes responsive faltantes
# 2. Build con la configuración especificada usando scripts npm
# Nota: staging usa NODE_ENV=production (como producción) pero con environment.staging.ts
RUN npm run validate:images && \
    if [ "$BUILD_CONFIGURATION" = "production" ]; then \
        echo "Building for PRODUCTION..." && \
        npm run build:production:pwa; \
    elif [ "$BUILD_CONFIGURATION" = "staging" ]; then \
        echo "Building for STAGING (NODE_ENV=production)..." && \
        npm run build:staging:pwa; \
    else \
        echo "Building for DEVELOPMENT..." && \
        ng build --configuration development --output-hashing=all && \
        ng run portal-startcompanies:server:development; \
    fi

# Stage final de producción
FROM node:18-alpine AS production

# Build arguments (necesarios también en esta etapa para mantener consistencia)
ARG BUILD_CONFIGURATION=production
ARG NODE_ENV=production

# Establecer variables de entorno
ENV NODE_ENV=${NODE_ENV}
ENV BUILD_CONFIGURATION=${BUILD_CONFIGURATION}

# Instalar nginx
RUN apk add --no-cache nginx

# Crear directorios necesarios
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo las dependencias de producción
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copiar archivos compilados desde el builder
COPY --from=builder /app/dist/portal-startcompanies /app/dist/portal-startcompanies

# Copiar imágenes responsive generadas
COPY --from=builder /app/src/assets /app/src/assets

# Copiar configuración de nginx
COPY nginx.production.conf /etc/nginx/nginx.conf

# Crear directorios para nginx
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambiar permisos
RUN chown -R nodejs:nodejs /app /var/log/nginx /var/cache/nginx /var/run

# Exponer solo el puerto 4000 (como en tu configuración original)
EXPOSE 4000

# Cambiar al usuario no-root
USER nodejs

# Comando para iniciar la aplicación (como en tu configuración original)
CMD ["npm", "run", "serve:ssr"]

# Dockerfile optimizado para imágenes responsive
# Incluye: Sharp, optimización de imágenes, generación responsive, build optimizado
