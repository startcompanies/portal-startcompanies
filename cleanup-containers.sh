#!/bin/bash

# Script de limpieza manual de contenedores Docker
# Útil para limpiar manualmente cuando sea necesario

echo "🧹 Script de limpieza manual de contenedores Docker"
echo "=================================================="

# Función para limpiar contenedores por nombre de imagen
cleanup_by_image() {
    local image_name=$1
    echo "🔍 Buscando contenedores de la imagen: $image_name"
    
    local containers=$(docker ps -q --filter "ancestor=$image_name" 2>/dev/null)
    if [ -n "$containers" ]; then
        echo "🔄 Deteniendo contenedores: $containers"
        docker stop $containers
        echo "🗑️ Eliminando contenedores: $containers"
        docker rm $containers
        echo "✅ Contenedores de $image_name limpiados"
    else
        echo "ℹ️ No se encontraron contenedores de $image_name"
    fi
}

# Función para limpiar contenedores por puerto
cleanup_by_port() {
    local port=$1
    echo "🔍 Buscando contenedores usando puerto: $port"
    
    local containers=$(docker ps -q --filter "publish=$port" 2>/dev/null)
    if [ -n "$containers" ]; then
        echo "🔄 Deteniendo contenedores en puerto $port: $containers"
        docker stop $containers
        echo "🗑️ Eliminando contenedores en puerto $port: $containers"
        docker rm $containers
        echo "✅ Contenedores en puerto $port limpiados"
    else
        echo "ℹ️ No se encontraron contenedores usando puerto $port"
    fi
}

# Función para limpiar contenedores huérfanos
cleanup_orphaned() {
    echo "🧹 Limpiando contenedores huérfanos..."
    docker container prune -f
    echo "✅ Contenedores huérfanos limpiados"
}

# Función para limpiar imágenes no utilizadas
cleanup_images() {
    echo "🖼️ Limpiando imágenes no utilizadas..."
    docker image prune -f
    echo "✅ Imágenes no utilizadas limpiadas"
}

# Función para mostrar estado actual
show_status() {
    echo "📊 Estado actual de Docker:"
    echo "=========================="
    echo "Contenedores activos:"
    docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "Contenedores detenidos:"
    docker ps -a --filter "status=exited" --format "table {{.ID}}\t{{.Image}}\t{{.Status}}"
}

# Función principal
main() {
    case "${1:-all}" in
        "image")
            if [ -z "$2" ]; then
                echo "❌ Error: Debes especificar el nombre de la imagen"
                echo "Uso: $0 image <nombre-imagen>"
                exit 1
            fi
            cleanup_by_image "$2"
            ;;
        "port")
            if [ -z "$2" ]; then
                echo "❌ Error: Debes especificar el puerto"
                echo "Uso: $0 port <puerto>"
                exit 1
            fi
            cleanup_by_port "$2"
            ;;
        "orphaned")
            cleanup_orphaned
            ;;
        "images")
            cleanup_images
            ;;
        "status")
            show_status
            ;;
        "all")
            echo "🧹 Ejecutando limpieza completa..."
            cleanup_by_image "bot-start-companies-frontend-gktazp"
            cleanup_by_port "8080"
            cleanup_by_port "4000"
            cleanup_orphaned
            cleanup_images
            echo "✅ Limpieza completa finalizada"
            ;;
        *)
            echo "Uso: $0 [comando] [opciones]"
            echo ""
            echo "Comandos disponibles:"
            echo "  all                    - Limpieza completa (por defecto)"
            echo "  image <nombre-imagen>  - Limpiar contenedores de una imagen específica"
            echo "  port <puerto>          - Limpiar contenedores usando un puerto específico"
            echo "  orphaned               - Limpiar contenedores huérfanos"
            echo "  images                 - Limpiar imágenes no utilizadas"
            echo "  status                 - Mostrar estado actual de Docker"
            echo ""
            echo "Ejemplos:"
            echo "  $0                     - Limpieza completa"
            echo "  $0 image my-app        - Limpiar contenedores de 'my-app'"
            echo "  $0 port 8080           - Limpiar contenedores en puerto 8080"
            echo "  $0 status              - Ver estado actual"
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"
