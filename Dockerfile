##############################################
# Stage 1 — BUILDER (compila Angular SSR)
##############################################
FROM node:18-alpine AS builder

# Evitar que npm ignore devDependencies
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false

# Dependencias necesarias para compilación (sharp, Angular, SSR)
RUN apk add --no-cache python3 make g++ imagemagick

WORKDIR /app

# Copiar todo el proyecto
COPY . .

# Mostrar archivos relevantes para debug
RUN echo "Verificando estructura del proyecto..." && \
    ls -la angular.json package.json tsconfig.json

# Instalar dependencias (incluye devDependencies)
RUN npm install --legacy-peer-deps

# Instalar Angular CLI localmente vía npx (evita conflictos globales)
RUN npx ng version && npx ng config --global cli.warnings.versionMismatch false

# Pipeline de imágenes responsive + build SSR
RUN npm run validate:images && \
    npm run optimize:images || echo "⚠ Sharp no disponible, imágenes no optimizadas" && \
    npm run build:production:pwa

##############################################
# Stage 2 — PRODUCCIÓN (Node SSR + Nginx)
##############################################
FROM node:18-alpine AS production

# Ambiente seguro de producción
ENV NODE_ENV=production

# Instalar Nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copiar package.json y lock
COPY package*.json ./

# Instalar solo dependencias necesarias para SSR
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copiar el build final de SSR desde el builder
COPY --from=builder /app/dist/portal-startcompanies /app/dist/portal-startcompanies

# Copiar imágenes responsive generadas
COPY --from=builder /app/src/assets /app/src/assets

# Copiar configuración optimizada de Nginx
COPY nginx.production.conf /etc/nginx/nginx.conf

# Crear directorios usados por nginx
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Ajustar permisos
RUN chown -R nodejs:nodejs /app /var/log/nginx /var/cache/nginx /var/run

# Exponer puerto del SSR
EXPOSE 4000

# Cambiar usuario por seguridad
USER nodejs

# Comando final de ejecución
CMD ["npm", "run", "serve:ssr"]