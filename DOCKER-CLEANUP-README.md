# 🐳 Sistema de Limpieza Automática de Contenedores Docker

## 📋 **Descripción**

Este sistema implementa una solución **automática** para limpiar contenedores Docker anteriores antes de iniciar nuevos servicios, evitando conflictos de puertos y recursos.

## 🚀 **Características Principales**

✅ **Limpieza automática** en cada inicio del contenedor
✅ **Health checks mejorados** para detectar fallos más rápido
✅ **Script de limpieza manual** como respaldo
✅ **Manejo robusto de señales** para cierre limpio
✅ **Integración completa** con Dokploy

## 🔧 **Componentes Implementados**

### 1. **start.sh mejorado**
- Función `cleanup_previous_containers()` que se ejecuta automáticamente
- Limpia contenedores de la misma imagen
- Libera puertos 8080 y 4000
- Manejo mejorado de señales de terminación

### 2. **Dockerfile optimizado**
- Health check más agresivo: `15s` en lugar de `30s`
- Timeout reducido: `8s` en lugar de `10s`
- Menos reintentos: `2` en lugar de `3`

### 3. **nginx.production.conf**
- Endpoint `/health` para health checks de Docker
- Respuesta simple y rápida

### 4. **cleanup-containers.sh**
- Script de limpieza manual para uso en el host
- Múltiples opciones de limpieza
- Información detallada del estado

## 🎯 **Cómo Funciona**

### **Limpieza Automática:**
1. **Al iniciar** el contenedor, `start.sh` ejecuta `cleanup_previous_containers()`
2. **Busca** contenedores de la misma imagen (`bot-start-companies-frontend-gktazp`)
3. **Detiene y elimina** contenedores anteriores
4. **Libera puertos** 8080 y 4000
5. **Inicia** los nuevos servicios

### **Health Checks:**
1. **Cada 15 segundos** Docker verifica el endpoint `/health`
2. **Timeout de 8 segundos** para detectar fallos rápidamente
3. **2 reintentos** antes de marcar como no saludable

## 📖 **Uso del Script de Limpieza Manual**

### **Limpieza completa (por defecto):**
```bash
./cleanup-containers.sh
```

### **Limpiar contenedores de una imagen específica:**
```bash
./cleanup-containers.sh image bot-start-companies-frontend-gktazp
```

### **Limpiar contenedores en un puerto específico:**
```bash
./cleanup-containers.sh port 8080
```

### **Ver estado actual:**
```bash
./cleanup-containers.sh status
```

### **Opciones disponibles:**
- `all` - Limpieza completa
- `image <nombre>` - Limpiar por imagen
- `port <puerto>` - Limpiar por puerto
- `orphaned` - Limpiar contenedores huérfanos
- `images` - Limpiar imágenes no utilizadas
- `status` - Mostrar estado actual

## 🔍 **Monitoreo y Debugging**

### **Ver logs del contenedor:**
```bash
docker logs <container-id>
```

### **Ver health status:**
```bash
docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Health}}"
```

### **Verificar endpoint de health:**
```bash
curl http://localhost:8080/health
```

## 🚨 **Solución de Problemas**

### **Contenedor no inicia:**
1. Verificar logs: `docker logs <container-id>`
2. Ejecutar limpieza manual: `./cleanup-containers.sh`
3. Verificar puertos: `netstat -tulpn | grep :8080`

### **Health check falla:**
1. Verificar que nginx esté corriendo
2. Verificar endpoint `/health`
3. Revisar configuración de nginx

### **Conflictos de puertos:**
1. Ejecutar: `./cleanup-containers.sh port 8080`
2. Verificar: `docker ps --filter "publish=8080"`

## 📊 **Ventajas de la Solución**

✅ **Automática**: No requiere intervención manual
✅ **Eficiente**: Limpia solo lo necesario
✅ **Segura**: No afecta otros contenedores
✅ **Rápida**: Health checks más frecuentes
✅ **Robusta**: Manejo de errores y señales
✅ **Integrada**: Funciona con Dokploy automáticamente

## 🔄 **Flujo de Despliegue**

1. **Dokploy** construye nueva imagen
2. **Docker** inicia nuevo contenedor
3. **start.sh** ejecuta limpieza automática
4. **Servicios** inician sin conflictos
5. **Health checks** verifican funcionamiento
6. **Aplicación** disponible en puerto 8080

## 📝 **Notas Importantes**

- La limpieza automática solo afecta contenedores de la **misma aplicación**
- Los puertos 8080 y 4000 se liberan automáticamente
- El script de limpieza manual es solo para uso en el host
- Los health checks son más agresivos para detectar fallos antes
- La solución es compatible con Dokploy y despliegues automáticos

---

**🎉 ¡La limpieza automática está implementada y funcionando!**
