#!/bin/bash

# Script de limpieza PREVIA al despliegue
# Se ejecuta ANTES de crear nuevos contenedores para evitar conflictos

set -e  # Salir si hay algún error

echo "🧹 =========================================="
echo "🧹 LIMPIEZA PREVIA AL DESPLIEGUE"
echo "🧹 =========================================="
echo ""

# Configuración
APP_BASE_NAME="bot-start-companies-frontend-gktazp"
PORTS_TO_CLEAN=("8080" "4000")

# Función para mostrar información del sistema
show_system_info() {
    echo "📊 Estado actual del sistema:"
    echo "=============================="
    echo "Contenedores activos:"
    docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No hay contenedores activos"
    echo ""
}

# Función para limpiar contenedores por nombre
cleanup_containers_by_name() {
    echo "🔍 Buscando contenedores de la aplicación: $APP_BASE_NAME"
    
    # Buscar contenedores por nombre base (incluye sufijos de Dokploy)
    local container_names=$(docker ps --format "{{.Names}}" --filter "name=$APP_BASE_NAME" 2>/dev/null)
    
    if [ -n "$container_names" ]; then
        echo "🔄 Contenedores encontrados: $container_names"
        
        # Detener cada contenedor encontrado
        for container_name in $container_names; do
            echo "🔄 Deteniendo contenedor: $container_name"
            if docker stop "$container_name" 2>/dev/null; then
                echo "✅ Contenedor $container_name detenido"
            else
                echo "⚠️ No se pudo detener $container_name (puede estar ya detenido)"
            fi
        done
        
        # Eliminar cada contenedor encontrado
        for container_name in $container_names; do
            echo "🗑️ Eliminando contenedor: $container_name"
            if docker rm "$container_name" 2>/dev/null; then
                echo "✅ Contenedor $container_name eliminado"
            else
                echo "⚠️ No se pudo eliminar $container_name (puede estar ya eliminado)"
            fi
        done
        
        echo "✅ Limpieza de contenedores completada"
    else
        echo "ℹ️ No se encontraron contenedores de $APP_BASE_NAME"
    fi
}

# Función para limpiar contenedores por puerto
cleanup_containers_by_port() {
    local port=$1
    echo "🔍 Limpiando contenedores en puerto: $port"
    
    # Buscar contenedores por puerto publicado
    local containers=$(docker ps -q --filter "publish=$port" 2>/dev/null)
    
    if [ -n "$containers" ]; then
        echo "🔄 Contenedores encontrados en puerto $port: $containers"
        
        # Detener contenedores
        echo "🔄 Deteniendo contenedores en puerto $port..."
        docker stop $containers 2>/dev/null || true
        
        # Eliminar contenedores
        echo "🗑️ Eliminando contenedores en puerto $port..."
        docker rm $containers 2>/dev/null || true
        
        echo "✅ Contenedores en puerto $port limpiados"
    else
        echo "ℹ️ No se encontraron contenedores usando puerto $port"
    fi
}

# Función para limpiar contenedores huérfanos
cleanup_orphaned_containers() {
    echo "🧹 Limpiando contenedores huérfanos..."
    
    local orphaned_count=$(docker ps -a --filter "status=exited" --filter "status=created" -q 2>/dev/null | wc -l)
    
    if [ "$orphaned_count" -gt 0 ]; then
        echo "🔄 Encontrados $orphaned_count contenedores huérfanos"
        docker container prune -f 2>/dev/null || true
        echo "✅ Contenedores huérfanos limpiados"
    else
        echo "ℹ️ No hay contenedores huérfanos para limpiar"
    fi
}

# Función para limpiar imágenes no utilizadas
cleanup_unused_images() {
    echo "🖼️ Limpiando imágenes no utilizadas..."
    
    local unused_count=$(docker images --filter "dangling=true" -q 2>/dev/null | wc -l)
    
    if [ "$unused_count" -gt 0 ]; then
        echo "🔄 Encontradas $unused_count imágenes no utilizadas"
        docker image prune -f 2>/dev/null || true
        echo "✅ Imágenes no utilizadas limpiadas"
    else
        echo "ℹ️ No hay imágenes no utilizadas para limpiar"
    fi
}

# Función para verificar puertos libres
check_ports_availability() {
    echo "🔍 Verificando disponibilidad de puertos..."
    
    for port in "${PORTS_TO_CLEAN[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo "⚠️ Puerto $port aún está en uso"
        else
            echo "✅ Puerto $port está libre"
        fi
    done
}

# Función principal
main() {
    echo "🚀 Iniciando proceso de limpieza previa al despliegue..."
    echo ""
    
    # Mostrar estado inicial
    show_system_info
    
    # Limpiar contenedores por nombre
    cleanup_containers_by_name
    echo ""
    
    # Limpiar contenedores por puertos específicos
    for port in "${PORTS_TO_CLEAN[@]}"; do
        cleanup_containers_by_port "$port"
        echo ""
    done
    
    # Limpiar contenedores huérfanos
    cleanup_orphaned_containers
    echo ""
    
    # Limpiar imágenes no utilizadas
    cleanup_unused_images
    echo ""
    
    # Verificar disponibilidad de puertos
    check_ports_availability
    echo ""
    
    # Mostrar estado final
    echo "📊 Estado final del sistema:"
    echo "============================"
    docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No hay contenedores activos"
    echo ""
    
    echo "🎉 ¡Limpieza previa al despliegue completada!"
    echo "✅ El sistema está listo para crear nuevos contenedores"
    echo ""
    echo "💡 Próximos pasos:"
    echo "   1. Ejecutar el build de Docker"
    echo "   2. Desplegar la nueva imagen"
    echo "   3. Verificar que el nuevo contenedor funcione correctamente"
}

# Ejecutar función principal
main "$@"
