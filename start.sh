#!/bin/sh

# Script de inicio para ejecutar nginx y la aplicación Angular SSR

# FUNCIÓN: Limpiar contenedores anteriores de la misma aplicación
cleanup_previous_containers() {
    echo "🧹 Limpiando contenedores anteriores..."
    
    # Buscar y detener contenedores anteriores de la misma aplicación
    # Usamos el nombre de la imagen para identificar contenedores relacionados
    CONTAINER_IDS=$(docker ps -q --filter "ancestor=bot-start-companies-frontend-gktazp" 2>/dev/null)
    if [ -n "$CONTAINER_IDS" ]; then
        echo "🔄 Deteniendo contenedores anteriores: $CONTAINER_IDS"
        docker stop $CONTAINER_IDS 2>/dev/null || true
        docker rm $CONTAINER_IDS 2>/dev/null || true
        echo "✅ Contenedores anteriores limpiados"
    else
        echo "ℹ️ No se encontraron contenedores anteriores"
    fi
    
    # También limpiar contenedores huérfanos que puedan estar usando los puertos
    echo "🧹 Limpiando contenedores huérfanos en puertos 8080 y 4000..."
    docker ps -q --filter "publish=8080" 2>/dev/null | xargs -r docker stop 2>/dev/null || true
    docker ps -q --filter "publish=4000" 2>/dev/null | xargs -r docker stop 2>/dev/null || true
    echo "✅ Limpieza de puertos completada"
}

# FUNCIÓN: Limpiar procesos al salir
cleanup() {
    echo "🛑 Recibida señal de terminación, limpiando procesos..."
    
    if [ -n "$NGINX_PID" ]; then
        echo "🔄 Deteniendo nginx (PID: $NGINX_PID)..."
        kill -TERM "$NGINX_PID" 2>/dev/null || true
        wait "$NGINX_PID" 2>/dev/null || true
        echo "✅ nginx detenido"
    fi
    
    if [ -n "$NODE_PID" ]; then
        echo "🔄 Deteniendo aplicación Angular SSR (PID: $NODE_PID)..."
        kill -TERM "$NODE_PID" 2>/dev/null || true
        wait "$NODE_PID" 2>/dev/null || true
        echo "✅ Aplicación Angular SSR detenida"
    fi
    
    echo "✅ Limpieza completada"
    exit 0
}

# Configurar manejo de señales
trap cleanup TERM INT QUIT

# Ejecutar limpieza automática al inicio
cleanup_previous_containers

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
