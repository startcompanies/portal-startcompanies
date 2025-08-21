#!/bin/sh

# Script de inicio para ejecutar nginx y la aplicación Angular SSR

# Función para manejar señales de terminación
cleanup() {
    echo "🛑 Recibida señal de terminación, cerrando servicios..."
    
    # Detener nginx
    if [ -n "$NGINX_PID" ]; then
        echo "🔄 Deteniendo nginx (PID: $NGINX_PID)..."
        kill -TERM "$NGINX_PID" 2>/dev/null
        wait "$NGINX_PID" 2>/dev/null
    fi
    
    # Detener la aplicación Node.js
    if [ -n "$NODE_PID" ]; then
        echo "🔄 Deteniendo aplicación Node.js (PID: $NODE_PID)..."
        kill -TERM "$NODE_PID" 2>/dev/null
        wait "$NODE_PID" 2>/dev/null
    fi
    
    echo "✅ Servicios detenidos correctamente"
    exit 0
}

# Configurar manejo de señales
trap cleanup TERM INT

# Verificar que los directorios existan
if [ ! -d "/app/dist/portal-startcompanies" ]; then
    echo "❌ Error: Directorio de la aplicación no encontrado"
    exit 1
fi

# Verificar que nginx.conf exista
if [ ! -f "/etc/nginx/nginx.conf" ]; then
    echo "❌ Error: Configuración de nginx no encontrada"
    exit 1
fi

# Crear directorios temporales si no existen
mkdir -p /tmp/nginx /var/cache/nginx

# Iniciar nginx en segundo plano
echo "🚀 Iniciando nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Esperar un momento para que nginx se inicie
sleep 2

# Verificar que nginx esté ejecutándose
if ! kill -0 "$NGINX_PID" 2>/dev/null; then
    echo "❌ Error: nginx no se pudo iniciar"
    exit 1
fi

echo "✅ nginx iniciado correctamente (PID: $NGINX_PID)"

# Iniciar la aplicación Angular SSR
echo "🚀 Iniciando aplicación Angular SSR..."
cd /app
npm run serve:ssr:portal-startcompanies &
NODE_PID=$!

# Esperar un momento para que la aplicación se inicie
sleep 3

# Verificar que la aplicación esté ejecutándose
if ! kill -0 "$NODE_PID" 2>/dev/null; then
    echo "❌ Error: Aplicación Angular SSR no se pudo iniciar"
    cleanup
    exit 1
fi

echo "✅ Aplicación Angular SSR iniciada correctamente (PID: $NODE_PID)"
echo "🌐 Servidor disponible en:"
echo "   - HTTP: http://localhost:8080 (nginx)"
echo "   - SSR: http://localhost:4000 (Angular SSR)"
echo "📊 Estado de servicios:"
echo "   - nginx: ✅ Ejecutándose (PID: $NGINX_PID)"
echo "   - Angular SSR: ✅ Ejecutándose (PID: $NODE_PID)"

# Mantener el script ejecutándose y esperar señales
while true; do
    # Verificar que ambos servicios estén ejecutándose
    if ! kill -0 "$NGINX_PID" 2>/dev/null; then
        echo "❌ nginx se detuvo inesperadamente"
        break
    fi
    
    if ! kill -0 "$NODE_PID" 2>/dev/null; then
        echo "❌ Aplicación Angular SSR se detuvo inesperadamente"
        break
    fi
    
    # Esperar un poco antes de verificar nuevamente
    sleep 10
done

# Si llegamos aquí, algo salió mal
echo "❌ Uno de los servicios se detuvo inesperadamente"
cleanup
exit 1
