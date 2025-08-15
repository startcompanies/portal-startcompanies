# Etapa 1: Build de Angular Universal
FROM node:18-alpine AS builder
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache python3 make g++

# Copiar los archivos de dependencias
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# Copiar el resto del código
COPY . .

# Configurar variables de entorno para build
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Construir la aplicación SSR
RUN npm run build:ssr

# Etapa 2: Imagen final para producción SSR
FROM node:18-alpine
WORKDIR /app

# Instalar solo las dependencias de producción
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Copiar el build SSR
COPY --from=builder /app/dist/portal-startcompanies /app/dist/portal-startcompanies

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Cambiar ownership de los archivos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Variables de entorno para producción
ENV NODE_ENV=production
ENV PORT=4000
ENV HOSTNAME=0.0.0.0

# Exponer el puerto
EXPOSE 4000

# Health check para verificar que el servidor esté funcionando
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Comando para iniciar el servidor SSR
CMD ["node", "dist/portal-startcompanies/server/main.js"]
