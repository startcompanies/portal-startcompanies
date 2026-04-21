#syntax=docker/dockerfile:1.6

###############################################
# STAGE 1 — BUILDER (Angular build)
###############################################
FROM node:18-alpine AS builder

ARG BUILD_CONFIGURATION=production
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN echo "Build configuration: $BUILD_CONFIGURATION" && \
    if [ "$BUILD_CONFIGURATION" = "staging" ]; then \
        npx ng build --configuration staging; \
    else \
        npx ng build --configuration production; \
    fi

###############################################
# STAGE 2 — PRODUCCIÓN (nginx estático)
###############################################
FROM nginx:alpine

# Eliminar contenido por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist/portal-startcompanies/browser /usr/share/nginx/html/
COPY nginx.production.conf /etc/nginx/nginx.conf

# Verificar que los archivos se copiaron correctamente
RUN ls -la /usr/share/nginx/html/ && test -f /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
