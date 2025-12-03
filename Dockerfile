#syntax=docker/dockerfile:1.6

###############################################
# STAGE 1 — BUILDER (Angular SSR Compile)
###############################################
FROM node:18-alpine AS builder

# Build-time vars (Dokploy las inyecta)
ARG BUILD_CONFIGURATION=production
ARG NODE_ENV=production

# El builder siempre necesita devDependencies
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false

# Dependencias necesarias para compilar Angular SSR
RUN apk add --no-cache python3 make g++ imagemagick

WORKDIR /app
COPY . .

# Instalar dependencias (incluye devDependencies)
RUN npm install --legacy-peer-deps

# Angular CLI (local, vía npx)
RUN npx ng version && \
    npx ng config --global cli.warnings.versionMismatch false

# ---------- Build dinámico según BUILD_CONFIGURATION ----------
RUN npm run validate:images && \
    echo "🔧 Build Configuration: $BUILD_CONFIGURATION" && \
    if [ "$BUILD_CONFIGURATION" = "production" ]; then \
        echo "🚀 Ejecutando build:production:pwa"; \
        npm run build:production:pwa; \
    elif [ "$BUILD_CONFIGURATION" = "staging" ]; then \
        echo "🚧 Ejecutando build:staging:pwa"; \
        npm run build:staging:pwa; \
    else \
        echo "🛠 Ejecutando build de DEVELOPMENT"; \
        npx ng build --configuration development --output-hashing=all && \
        npx ng run portal-startcompanies:server:development; \
    fi
# ---------------------------------------------------------------

###############################################
# STAGE 2 — PRODUCCIÓN (Node SSR + Nginx)
###############################################
FROM node:18-alpine AS production
ENV NODE_ENV=production

RUN apk add --no-cache nginx

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copiar build final
COPY --from=builder /app/dist/portal-startcompanies /app/dist/portal-startcompanies
COPY --from=builder /app/src/assets /app/src/assets

# Configuración de nginx
COPY nginx.production.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run

# Usuario sin privilegios
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app /var/log/nginx /var/cache/nginx /var/run

EXPOSE 4000

USER nodejs
CMD ["npm", "run", "serve:ssr"]