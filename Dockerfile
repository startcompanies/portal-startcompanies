# Multi-stage build para Angular SSR optimizado para producción
FROM node:18-alpine AS builder

# Instalar dependencias del sistema para compilación
RUN apk add --no-cache python3 make g++ imagemagick

WORKDIR /app

# Copiar TODOS los archivos del proyecto primero
COPY . .

# Verificar que estamos en el directorio correcto y que es un proyecto Angular
RUN pwd && ls -la && \
    echo "Verificando archivos de Angular:" && \
    ls -la angular.json package.json tsconfig.json

# Instalar TODAS las dependencias (incluyendo devDependencies para el build)
RUN npm install --legacy-peer-deps

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli@18

# Verificar que Angular CLI reconoce el proyecto
RUN ng version && ng config --global cli.warnings.versionMismatch false

# Optimizar imágenes
RUN npm run optimize:images

# Build de la aplicación Angular para producción con optimizaciones máximas
RUN npm run build:production:minified

# Stage final de producción
FROM node:18-alpine AS production

# Establecer la variable de entorno NODE_ENV
ENV NODE_ENV=production
ENV PORT=4000

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

# Copiar configuración de nginx optimizada para producción
COPY nginx.production.conf /etc/nginx/nginx.conf

# Crear directorios para nginx con permisos correctos
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run /tmp/nginx /var/lib/nginx/logs /var/lib/nginx/tmp && \
    chown -R root:root /var/log/nginx /var/cache/nginx /var/run /tmp/nginx /var/lib/nginx && \
    chmod -R 755 /var/log/nginx /var/cache/nginx /var/run /tmp/nginx /var/lib/nginx

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambiar permisos de la aplicación
RUN chown -R nodejs:nodejs /app

# Exponer solo el puerto 8080 (nginx)
# El puerto 4000 es solo para comunicación interna nginx -> Angular SSR
EXPOSE 8080

# NO cambiar al usuario no-root aquí - nginx necesita ejecutarse como root
# USER nodejs

# Script de inicio que ejecuta tanto nginx como la aplicación
COPY --chown=root:root start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Health check más agresivo y rápido para detectar fallos antes
HEALTHCHECK --interval=15s --timeout=8s --start-period=45s --retries=2 \
  CMD curl -f http://localhost:8080/health || exit 1

# Comando para iniciar la aplicación
CMD ["/app/start.sh"]
