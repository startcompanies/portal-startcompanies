#!/bin/sh

# Script de inicio para ejecutar Nginx y Node.js SSR

echo "🚀 Iniciando servicios..."

# Crear directorios necesarios si no existen
mkdir -p /var/log/nginx
mkdir -p /var/cache/nginx
mkdir -p /var/run

# Verificar que los archivos de build existan
if [ ! -f "/app/dist/portal-startcompanies/server/main.js" ]; then
    echo "❌ Error: No se encontró el build de la aplicación SSR"
    exit 1
fi

if [ ! -f "/app/dist/portal-startcompanies/browser/index.html" ]; then
    echo "❌ Error: No se encontró el build del browser"
    exit 1
fi

# Verificar configuración de Nginx
if ! nginx -t; then
    echo "❌ Error: Configuración de Nginx inválida"
    exit 1
fi

# Iniciar Nginx en segundo plano
echo "📡 Iniciando Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Esperar un momento para que Nginx se inicie
sleep 2

# Verificar que Nginx esté funcionando
if ! kill -0 $NGINX_PID 2>/dev/null; then
    echo "❌ Error: Nginx no se pudo iniciar"
    exit 1
fi

echo "✅ Nginx iniciado con PID: $NGINX_PID"

# Iniciar la aplicación Node.js SSR
echo "🟢 Iniciando aplicación SSR..."
cd /app
exec node dist/portal-startcompanies/server/main.js
