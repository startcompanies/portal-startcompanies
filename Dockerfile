# Multi-stage build para Angular SSR
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

# Optimizar imágenes
RUN npm run optimize:images

# Build de la aplicación Angular
RUN npm run build:ssr:production

# Stage final de producción
FROM node:18-alpine AS production

# Establecer la variable de entorno NODE_ENV
ENV NODE_ENV=production

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

# Crear directorios para nginx
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambiar permisos
RUN chown -R nodejs:nodejs /app /var/log/nginx /var/cache/nginx /var/run

# Exponer puertos
EXPOSE 4000

# Cambiar al usuario no-root
USER nodejs

# Comando para iniciar la aplicación
CMD ["npm", "run", "serve:ssr:portal-startcompanies"]
