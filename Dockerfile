# Multi-stage build para Angular SSR optimizado para producción
FROM node:18-alpine AS builder

# Instalar dependencias del sistema para compilación
RUN apk add --no-cache python3 make g++ imagemagick

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para el build)
RUN npm install --legacy-peer-deps

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli@18

# Copiar código fuente
COPY . .

# Verificar que estamos en el directorio correcto
RUN pwd && ls -la

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

# Crear directorios para nginx
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run /tmp/nginx

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambiar permisos
RUN chown -R nodejs:nodejs /app /var/log/nginx /var/cache/nginx /var/run /tmp/nginx

# Exponer solo el puerto 80 (nginx)
# El puerto 4000 es solo para comunicación interna nginx -> Angular SSR
EXPOSE 80

# Cambiar al usuario no-root
USER nodejs

# Script de inicio que ejecuta tanto nginx como la aplicación
COPY --chown=nodejs:nodejs start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Health check para verificar que el servicio esté funcionando
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Comando para iniciar la aplicación
CMD ["/app/start.sh"]
