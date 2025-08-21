# 🚀 Instrucciones de Despliegue para Dokploy

## 📋 Resumen del Dockerfile

El Dockerfile está optimizado para producción con las siguientes características:

- ✅ **Multi-stage build** para reducir el tamaño final
- ✅ **Angular SSR** configurado para producción
- ✅ **Nginx** como servidor web con configuración optimizada
- ✅ **Optimización de imágenes** automática
- ✅ **Minificación CSS/JS** con Terser
- ✅ **Seguridad** con usuario no-root
- ✅ **Health checks** integrados
- ✅ **Logs** persistentes y configurables

---

## 🔧 Configuración del Dockerfile

### **Stage 1: Builder**
- Instala dependencias de compilación
- Optimiza imágenes con Sharp
- Compila la aplicación Angular SSR con optimizaciones máximas
- Aplica minificación CSS/JS con Terser

### **Stage 2: Production**
- Solo incluye dependencias de producción
- Nginx configurado para máximo rendimiento
- Script de inicio que ejecuta ambos servicios
- Health checks integrados

---

## 📱 Puertos Expuestos

- **Puerto 80**: Nginx (HTTP) - **ÚNICO PUERTO EXPUESTO**
- **Puerto 4000**: Angular SSR - **SOLO COMUNICACIÓN INTERNA**

### **¿Por qué solo el puerto 80?**

- **Puerto 80**: Acceso público para usuarios finales
- **Puerto 4000**: Comunicación interna entre nginx y Angular SSR
- **Más seguro**: Los usuarios no pueden acceder directamente al servidor Angular
- **Mejor práctica**: Solo exponer lo que es necesario

---

## 🌐 Configuración de Nginx

El archivo `nginx.production.conf` incluye:

- ✅ **Compresión Gzip y Brotli**
- ✅ **Cache optimizado** para diferentes tipos de archivos
- ✅ **Headers de seguridad** (CSP, HSTS, etc.)
- ✅ **Rate limiting** para protección contra ataques
- ✅ **Soporte WebP** con fallback automático
- ✅ **Health checks** para monitoreo
- ✅ **Logs detallados** con métricas de rendimiento

---

## 🚀 Comandos de Despliegue

### **1. Build de la Imagen**
```bash
docker build -t portal-startcompanies .
```

### **2. Ejecutar Contenedor**
```bash
docker run -d \
  --name portal-startcompanies-prod \
  -p 80:80 \
  -e NODE_ENV=production \
  -e PORT=4000 \
  portal-startcompanies:latest
```

### **3. Ver Logs**
```bash
docker logs -f portal-startcompanies-prod
```

### **4. Acceder a la Aplicación**
- **Web**: http://localhost:80 (o solo http://localhost)
- **Health Check**: http://localhost:80/health
- **SSR API**: Solo accesible internamente por nginx

---

## 🔍 Verificación del Despliegue

### **1. Verificar Contenedor**
```bash
docker ps
docker exec -it portal-startcompanies-prod sh
```

### **2. Verificar Servicios**
```bash
# Dentro del contenedor
ps aux | grep nginx
ps aux | grep node
```

### **3. Verificar Logs**
```bash
# Logs de nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs de la aplicación
docker logs portal-startcompanies-prod
```

### **4. Verificar Health Check**
```bash
# Verificar estado del contenedor
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Health}}"

# Verificar endpoint de health
curl http://localhost:80/health
```

---

## ⚠️ Consideraciones Importantes

### **Variables de Entorno**
- `NODE_ENV=production`: Habilita optimizaciones de producción
- `PORT=4000`: Puerto para la aplicación Angular SSR (interno)

### **Recursos del Sistema**
- **Memoria mínima**: 512MB
- **Memoria recomendada**: 1GB
- **CPU**: 1 core mínimo

### **Persistencia de Datos**
- Los logs se almacenan en `/var/log/nginx`
- Considera usar volúmenes para logs persistentes

---

## 🛠️ Troubleshooting

### **Problema: Contenedor no inicia**
```bash
# Ver logs del contenedor
docker logs portal-startcompanies-prod

# Verificar configuración de nginx
docker exec -it portal-startcompanies-prod nginx -t
```

### **Problema: Error de permisos**
```bash
# Verificar permisos dentro del contenedor
docker exec -it portal-startcompanies-prod ls -la /app
docker exec -it portal-startcompanies-prod ls -la /var/log/nginx
```

### **Problema: Puerto ya en uso**
```bash
# Cambiar puerto en el comando run
docker run -d \
  --name portal-startcompanies-prod \
  -p 8080:80 \
  -e NODE_ENV=production \
  portal-startcompanies:latest
```

### **Problema: Health check falla**
```bash
# Verificar logs del health check
docker inspect portal-startcompanies-prod | grep -A 10 "Health"

# Verificar que nginx esté funcionando
docker exec -it portal-startcompanies-prod curl -f http://localhost:80/health
```

---

## 📊 Monitoreo

### **Health Check**
```bash
curl http://localhost:80/health
```

### **Status de Nginx**
```bash
curl http://localhost:80/nginx_status
```

### **Métricas de Rendimiento**
- Los logs incluyen tiempos de respuesta
- Monitorea el uso de memoria y CPU
- Verifica la tasa de errores en logs
- Health checks automáticos cada 30 segundos

---

## 🔒 Seguridad

- ✅ Usuario no-root (nodejs)
- ✅ Headers de seguridad configurados
- ✅ Rate limiting activado
- ✅ CSP (Content Security Policy) configurado
- ✅ HSTS habilitado
- ✅ **Puerto 4000 no expuesto** (solo comunicación interna)
- ✅ Health checks para detectar problemas

---

## 📈 Optimizaciones Implementadas

### **Imágenes**
- Conversión automática a WebP
- Cache de 1 año para imágenes
- Compresión automática

### **CSS/JS**
- Cache de 1 hora
- Compresión Gzip y Brotli
- Headers de cache optimizados
- **Minificación con Terser**
- **Build optimizer habilitado**

### **Fuentes**
- Cache de 1 año
- CORS habilitado para CDNs

---

## 🎯 Próximos Pasos

1. **Build de la imagen** con `docker build`
2. **Despliegue** en tu servidor
3. **Configuración de dominio** (si aplica)
4. **Monitoreo** de logs y rendimiento
5. **SSL/HTTPS** (recomendado para producción)

---

## 📞 Soporte

Para problemas durante el despliegue:
1. Revisar logs del contenedor
2. Verificar configuración de nginx
3. Confirmar que el puerto 80 esté disponible
4. Verificar permisos de archivos
5. Revisar health checks del contenedor
