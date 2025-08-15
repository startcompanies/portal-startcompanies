# Etapa 1: Build de Angular Universal con Optimización de Imágenes
FROM node:18-alpine AS builder
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache python3 make g++ imagemagick

# Copiar los archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para el build)
RUN npm install --legacy-peer-deps

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli@18

# Copiar el resto del código
COPY . .

# Configurar variables de entorno para build
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Optimizar imágenes antes del build
RUN npm run optimize:images

# Construir la aplicación SSR
RUN npm run build:ssr

# Etapa 2: Nginx para servir archivos estáticos
FROM nginx:alpine AS nginx
WORKDIR /etc/nginx

# Configuración de Nginx optimizada para imágenes
COPY nginx.conf /etc/nginx/nginx.conf

# Crear directorio para logs
RUN mkdir -p /var/log/nginx && \
    mkdir -p /var/cache/nginx

# Etapa 3: Imagen final para producción SSR
FROM node:18-alpine
WORKDIR /app

# Instalar Nginx y herramientas de compresión
RUN apk add --no-cache nginx brotli

# Instalar solo las dependencias de producción
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps && npm cache clean --force

# Copiar el build SSR
COPY --from=builder /app/dist/portal-startcompanies /app/dist/portal-startcompanies

# Copiar configuración de Nginx
COPY --from=nginx /etc/nginx/nginx.conf /etc/nginx/nginx.conf

# Crear directorios necesarios
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run && \
    mkdir -p /app/public

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    adduser -S nginx -u 1002

# Cambiar ownership de los archivos
RUN chown -R nextjs:nodejs /app && \
    chown -R nginx:nginx /var/log/nginx /var/cache/nginx /var/run

# Variables de entorno para producción
ENV NODE_ENV=production
ENV PORT=4000
ENV HOSTNAME=0.0.0.0
ENV NGINX_PORT=80

# Exponer puertos
EXPOSE 4000 80

# Health check mejorado
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Script de inicio que ejecuta tanto Nginx como Node.js
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Comando para iniciar servicios
CMD ["/start.sh"]
