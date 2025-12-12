# Análisis de Funcionalidades - Panel Start Companies

## 📋 Resumen Ejecutivo

**Start Companies LLC** es una empresa que ofrece servicios de constitución y gestión de LLC (Limited Liability Company) en Estados Unidos, así como apertura de cuentas bancarias para estas entidades. El negocio opera 100% online, con más de 200 emprendedores que confían en sus servicios.

## 🎯 Servicios Principales Identificados

### 1. **Constitución de LLC (Apertura)**
- Proceso completo de creación de LLC en Estados Unidos
- Selección de estado
- Gestión de documentos legales
- Entrega de certificados en máximo 10 días hábiles
- Flujo wizard con pasos: registro → selección estado → pago → información cliente → revisión

### 2. **Renovación de LLC**
- Renovación de LLC existentes antes de que expiren
- Evitar penalizaciones
- Mantener el negocio activo

### 3. **Apertura de Cuentas Bancarias**
- **Relay**: Cuenta bancaria principal
- **Fixcal**: Servicio adicional
- **Abotax**: Servicio adicional
- Requiere LLC activa
- Proceso de verificación bancaria

## 🔄 Flujo del Proceso Identificado

### **Flujo del Cliente Final:**
1. **Usuario llega al sitio** → Interés en iniciar proceso
2. **Inicia en el Wizard (público)** → Selecciona servicio deseado
3. **Selección de Servicio** → Apertura LLC / Renovación LLC / Cuenta Bancaria
4. **Visualización de Precio** → Usuario acepta condiciones
5. **Pago** → Procesamiento del pago
6. **Llenado de Requisitos**:
   - Tipo: Single Member o Multi-Member
   - Datos de involucrado(s)
   - Carga de documentos específicos por proceso
7. **Seguimiento en Panel** → Cliente puede ver:
   - En qué etapa está su proceso
   - Documentación entregada según el servicio
   - Estado actual de la solicitud

### **Flujo de Partners:**
- Partners comerciales con convenios
- **Inician procesos DESDE EL PANEL** (no desde el wizard público)
- Inician procesos a nombre de otras personas (sus clientes)
- Acceso al panel para gestionar múltiples solicitudes
- Pueden ver el estado de todos sus procesos iniciados
- **Diferencia clave**: Partners crean solicitudes directamente en el panel, mientras que clientes finales lo hacen a través del wizard público

### **Integración con Zoho CRM:**
- **Sincronización bidireccional**:
  - CRM actualiza estados de solicitudes
  - Panel refleja cambios del CRM
  - Otras acciones administrativas sincronizadas
- **Nota**: La configuración de integraciones se realiza desde el backend

## 🏗️ Estructura del Backend (API)

### Módulos Identificados:
1. **Auth** - Autenticación (login, registro, cambio de contraseña)
2. **User** - Gestión de usuarios
3. **Upload File** - Gestión de archivos

> **Nota**: Los módulos de blog (Posts, Categories, Tags, Reusable Elements) existen en el backend pero NO se utilizarán en el panel administrativo, ya que el blog se gestiona desde otra plataforma.

## 💡 Funcionalidades Propuestas para el Panel

> **Nota**: El panel tendrá dos tipos de usuarios:
> - **Clientes/Partners**: Panel de seguimiento de sus procesos
> - **Administradores**: Panel administrativo completo

---

### 👤 **PANEL DE CLIENTES/PARTNERS**

#### **MÓDULO C1: Dashboard del Cliente**
**Objetivo**: Vista general de los procesos del cliente/partner

**Funcionalidades**:
- **Mis Procesos Activos**:
  - Lista de servicios contratados
  - Estado actual de cada proceso
  - Progreso visual (etapas del proceso)
  - Fechas importantes (vencimiento, entrega estimada)

- **Etapas del Proceso** (según servicio):
  - **Apertura LLC**: Registro → Pago → Documentación → Procesamiento → Certificados → Completado
  - **Renovación LLC**: Solicitud → Pago → Procesamiento → Certificados → Completado
  - **Cuenta Bancaria**: Solicitud → Verificación → Aprobación → Accesos → Completado

- **Documentación Entregada**:
  - Certificados de LLC
  - Documentos legales
  - Accesos a cuentas bancarias
  - Historial de documentos por servicio

- **Acciones Rápidas**:
  - Iniciar nuevo proceso
  - Descargar documentos
  - Contactar soporte
  - Ver facturas

#### **MÓDULO C2: Mis Solicitudes**
**Objetivo**: Gestión y seguimiento de solicitudes

**Funcionalidades**:
- **Listado de Solicitudes**:
  - Filtros por tipo de servicio
  - Filtros por estado
  - Búsqueda por número de solicitud
  - Ordenamiento por fecha

- **Detalle de Solicitud**:
  - Información completa del proceso
  - Timeline de etapas completadas
  - Documentos requeridos y entregados
  - Estado actual sincronizado con Zoho CRM

- **Gestión de Documentos**:
  - Ver documentos entregados
  - Descargar certificados
  - Subir documentos adicionales si se requiere

#### **MÓDULO C3: Crear Nueva Solicitud (Solo Partners)**
**Objetivo**: Permitir a partners iniciar procesos desde el panel

**Funcionalidades**:
- **Formulario de Nueva Solicitud**:
  - Selección de tipo de servicio (Apertura LLC, Renovación LLC, Cuenta Bancaria)
  - Información del cliente final (a nombre de quién se hace)
  - Tipo: Single Member o Multi-Member
  - Datos de involucrado(s)
  - Selección de estado (si aplica)
  - Carga de documentos requeridos
  - Información de pago
  - Notas adicionales

- **Gestión de Clientes de Partners**:
  - Lista de clientes para los que ha iniciado procesos
  - Crear nuevo cliente
  - Editar información de cliente
  - Historial de procesos por cliente

#### **MÓDULO C4: Perfil y Configuración**
**Objetivo**: Gestión de información personal

**Funcionalidades**:
- **Información Personal**:
  - Datos de contacto
  - Cambio de contraseña
  - Preferencias de notificación

- **Para Partners**:
  - Información del convenio
  - Ver procesos iniciados para terceros
  - Reportes de comisiones (si aplica)
  - Estadísticas de conversión

---

### 🔧 **PANEL ADMINISTRATIVO**

### 🎯 **MÓDULO 1: Dashboard Principal**
**Objetivo**: Vista general del estado del negocio

#### Funcionalidades:
- **Métricas Clave**:
  - Total de clientes activos
  - LLCs creadas este mes/año
  - LLCs pendientes de renovación
  - Cuentas bancarias abiertas
  - Solicitudes pendientes de revisión
  - Solicitudes completadas este mes

- **Gráficas**:
  - Evolución de servicios por mes
  - Distribución por tipo de servicio (LLC, Renovación, Bancos)
  - Estados más solicitados

- **Actividad Reciente**:
  - Últimas LLCs creadas
  - Renovaciones pendientes
  - Nuevas solicitudes de cuentas bancarias
  - Nuevas solicitudes de partners

- **Alertas y Notificaciones**:
  - LLCs próximas a vencer (30, 15, 7 días)
  - Documentos pendientes de revisión

---

### 🏢 **MÓDULO 2: Gestión de Clientes**
**Objetivo**: Administración completa de la base de clientes

#### Funcionalidades:
- **Listado de Clientes**:
  - Búsqueda y filtros (nombre, email, estado, tipo de servicio)
  - Vista de tabla con paginación
  - Exportación a Excel/CSV
  - Filtros por:
    - Estado del servicio
    - Fecha de creación
    - Tipo de servicio contratado
    - Estado de pago

- **Perfil de Cliente**:
  - Información personal y de contacto
  - Historial de servicios contratados
  - Documentos asociados
  - Información básica de facturación (solo visualización)
  - Notas y comentarios internos
  - Estado de cada servicio (LLC, cuenta bancaria)
  - Fechas importantes (vencimiento LLC, etc.)

- **Acciones**:
  - Crear nuevo cliente
  - Editar información
  - Asignar servicios
  - Agregar notas internas
  - Cambiar estado de servicios

---

### 📄 **MÓDULO 3: Gestión de Solicitudes y Procesos**
**Objetivo**: Revisión y gestión de todas las solicitudes de servicios

#### Funcionalidades:
- **Listado de Solicitudes**:
  - Tipo de servicio: Apertura LLC, Renovación LLC, Cuenta Bancaria
  - Estado: Pendiente, En Revisión, En Proceso, Completada, Rechazada
  - Filtros avanzados:
    - Por tipo de servicio
    - Por estado
    - Por cliente/partner
    - Por fecha de creación
    - Por etapa del proceso
  - Búsqueda por número de solicitud, cliente, LLC

- **Detalle de Solicitud**:
  - **Información General**:
    - Tipo de servicio
    - Cliente/Partner asociado
    - Fecha de creación
    - Estado actual (sincronizado con Zoho CRM)
  
  - **Información del Proceso**:
    - **Apertura LLC**:
      - Single Member o Multi-Member
      - Datos de involucrado(s)
      - Estado seleccionado
      - Documentos cargados
    - **Renovación LLC**:
      - LLC a renovar
      - Fecha de vencimiento actual
      - Documentos requeridos
    - **Cuenta Bancaria**:
      - Tipo de banco (Relay/Fixcal/Abotax)
      - LLC asociada
      - Documentos de verificación
  
  - **Timeline del Proceso**:
    - Etapas completadas
    - Etapa actual
    - Próximas etapas
    - Fechas de cada cambio de etapa
  
  - **Documentos**:
    - Documentos cargados por el cliente
    - Documentos generados/entregados
    - Certificados
    - Accesos bancarios (si aplica)
  
  - **Integración Zoho CRM**:
    - Estado sincronizado (solo visualización)
    - Notas del CRM (solo visualización)
    - Historial de actualizaciones (solo visualización)

- **Gestión de Estados**:
  - Cambiar estado manualmente
  - Actualizar etapa del proceso
  - Asignar responsable del proceso
  - Nota: La sincronización con Zoho CRM se realiza automáticamente desde el backend

- **Acciones Administrativas**:
  - Aprobar/Rechazar solicitudes
  - Solicitar documentos adicionales
  - Agregar notas internas
  - Asignar a miembro del equipo
  - Marcar como completado
  - Generar y entregar documentos finales

---

### 🏦 **MÓDULO 4: Gestión de Cuentas Bancarias**
**Objetivo**: Administración de solicitudes y aperturas de cuentas

#### Funcionalidades:
- **Listado de Solicitudes**:
  - Tipo de banco (Relay, Fixcal, Abotax)
  - Estado: Pendiente, En Verificación, Aprobada, Rechazada
  - Filtros por tipo, estado, fecha

- **Detalle de Solicitud**:
  - Información del cliente
  - LLC asociada
  - Tipo de cuenta bancaria
  - Documentos enviados
  - Estado de verificación
  - Notas del proceso
  - Historial de cambios

- **Gestión de Estados**:
  - Actualizar estado de verificación
  - Aprobar/Rechazar solicitudes
  - Enviar notificaciones al cliente
  - Asignar responsable del proceso

---

### 📝 **MÓDULO 5: Gestión de Documentos**
**Objetivo**: Centralizar todos los documentos de clientes y servicios

#### Funcionalidades:
- **Almacenamiento**:
  - Subida de documentos
  - Organización por cliente/servicio
  - Categorización (certificados, identificaciones, comprobantes, etc.)
  - Versiones de documentos

- **Gestión**:
  - Vista previa de documentos
  - Descarga individual o masiva
  - Eliminación segura
  - Búsqueda por nombre, tipo, cliente

- **Seguridad**:
  - Control de acceso
  - Log de descargas
  - Encriptación de archivos sensibles

---

### 💰 **MÓDULO 6: Información Básica de Facturación**
**Objetivo**: Visualización básica de información de facturación

> **Nota**: La contabilidad completa se gestiona en Zoho. Este módulo solo muestra información básica para referencia.

#### Funcionalidades:
- **Información de Facturación**:
  - Visualización de facturas asociadas a solicitudes
  - Estado de pago (Pendiente, Completado, Rechazado)
  - Fecha de pago
  - Monto
  - Número de factura
  - Cliente asociado

- **Vista por Solicitud**:
  - Ver facturación relacionada a cada solicitud
  - Historial básico de pagos por servicio

> **Nota**: No se incluyen funcionalidades de generación de facturas, envío de emails, reportes financieros completos, ni gestión de pagos, ya que esto se maneja en Zoho.

---

### 👥 **MÓDULO 7: Gestión de Usuarios y Partners**
**Objetivo**: Administración de usuarios administrativos y partners comerciales

#### Funcionalidades:
- **Usuarios Administrativos**:
  - Crear, editar, eliminar usuarios
  - Roles y permisos:
    - Administrador (acceso completo)
    - Soporte (gestión de solicitudes y clientes)
    - Visualizador (solo lectura)
  - Estados: Activo, Inactivo
  - Historial de actividad
  - Asignación de solicitudes

- **Partners Comerciales**:
  - **Dar de alta Partners**:
    - Información de contacto
    - Datos comerciales
    - Convenio/contrato
    - Comisiones (si aplica)
    - Estado: Activo, Inactivo, Suspendido
    - Credenciales de acceso al panel
  
  - **Gestión de Partners**:
    - Listado de partners activos
    - Solicitudes iniciadas por cada partner
    - Estadísticas de conversión
    - Reportes de comisiones
    - Historial de actividad
    - Ver procesos creados desde el panel por cada partner
  
  - **Clientes de Partners**:
    - Ver clientes asociados a cada partner
    - Procesos iniciados por partners (desde el panel)
    - Gestión de relaciones partner-cliente
    - Diferenciación entre procesos del wizard (clientes finales) vs procesos del panel (partners)

- **Permisos**:
  - Control granular de acceso
  - Permisos por módulo
  - Permisos específicos para partners
  - Auditoría de acciones

---

### 📈 **MÓDULO 8: Reportes y Analytics**
**Objetivo**: Análisis de datos y reportes

> **Nota**: Los reportes relacionados a leads, CRM y conversión se gestionan en Zoho.

#### Funcionalidades:
- **Reportes Predefinidos**:
  - Reporte de servicios por período
  - Reporte de clientes nuevos
  - Reporte de renovaciones
  - Reporte de solicitudes por estado

- **Analytics**:
  - Análisis de servicios más solicitados
  - Análisis de estados preferidos
  - Tendencias temporales de solicitudes
  - Distribución de servicios por partner

- **Exportación**:
  - Exportar reportes a PDF
  - Exportar datos a Excel/CSV
  - Programación de reportes automáticos

---

### ⚙️ **MÓDULO 9: Configuración**
**Objetivo**: Configuración básica del sistema

> **Nota**: Las configuraciones de integraciones (Zoho CRM, sistemas de pago, etc.) se realizan desde el backend.

#### Funcionalidades:
- **Configuración de Procesos**:
  - Etapas por tipo de servicio
  - Documentos requeridos por proceso
  - Plazos estimados por etapa
  - Precios y planes

- **Configuración de Usuario**:
  - Cambio de contraseña
  - Preferencias de notificación
  - Información de perfil

- **Seguridad**:
  - Políticas de contraseñas (visualización)
  - Logs del sistema (visualización)
  - Auditoría de accesos (visualización)

---

## 🎨 Consideraciones de Diseño

### Colores de la Marca:
- **Primario**: `#0068BD` (Azul)
- **Secundario Técnico**: `#01C9E2` (Cyan)
- **Fondo Claro**: `#FDFFFE` (Blanco)
- **Texto Oscuro**: `#283A48`
- **Degradado**: `linear-gradient(135deg, #01C9E2 0%, #0068BD 100%)`

### Principios de UX:
- Interfaz limpia y profesional
- Navegación intuitiva
- Responsive design
- Accesibilidad
- Carga rápida
- Feedback visual en todas las acciones

---

## 🚀 Priorización de Desarrollo

### **Fase 1 - MVP (Funcionalidad Básica)**
1. **Autenticación y Roles**:
   - Login, registro, recuperación de contraseña
   - Diferencia entre Cliente, Partner y Administrador
   - Permisos básicos

2. **Panel de Cliente/Partner**:
   - Dashboard con procesos activos
   - Vista de solicitudes con estados
   - Timeline de procesos
   - Visualización de documentos entregados

3. **Panel Administrativo - Básico**:
   - Dashboard con métricas básicas
   - Listado de solicitudes
   - Detalle de solicitud con información del proceso
   - Cambio de estados manual

4. **Gestión de Documentos Básica**:
   - Visualización de documentos
   - Descarga de certificados
   - Carga de documentos por administrador

### **Fase 2 - Funcionalidad Core**
5. **Visualización de Datos de Zoho CRM**:
   - Estados sincronizados (solo lectura)
   - Notas del CRM (solo lectura)
   - Nota: La configuración de integración se realiza desde el backend

6. **Gestión Completa de Procesos**:
   - Gestión de etapas por tipo de servicio
   - Asignación de responsables
   - Notificaciones automáticas
   - Historial completo de cambios

7. **Gestión de Partners**:
   - Alta de partners
   - Gestión de clientes de partners
   - Reportes de partners

8. **Sistema de Notificaciones**:
   - Notificaciones por etapa
   - Emails automáticos
   - Notificaciones en panel

### **Fase 3 - Funcionalidad Avanzada**
9. **Información Básica de Facturación**:
   - Visualización de facturas asociadas
   - Estado de pagos (solo lectura)
   - Nota: La contabilidad completa se gestiona en Zoho

10. **Reportes y Analytics Avanzados**:
    - Reportes personalizados
    - Analytics de conversión
    - Tendencias y proyecciones

11. **Configuraciones Básicas**:
    - Configuración de procesos
    - Preferencias de usuario
    - Nota: Configuraciones de integraciones se realizan desde el backend

---

## 📝 Notas Adicionales

### **Flujo Técnico Identificado:**

1. **Wizard → Panel**:
   - Los datos del wizard se almacenan al completar el proceso
   - Se crea una solicitud en el sistema
   - Se sincroniza automáticamente con Zoho CRM (desde backend)
   - El cliente/partner puede acceder al panel para seguimiento

2. **Tipos de Usuario**:
   - **Cliente Final**: Ve solo sus procesos
   - **Partner**: Ve procesos iniciados por él (propios y de sus clientes)
   - **Administrador**: Acceso completo al sistema

3. **Estados y Etapas**:
   - Cada tipo de servicio tiene etapas específicas
   - Los estados se sincronizan automáticamente con Zoho CRM (desde backend)
   - Los cambios de estado pueden ser automáticos o manuales
   - El panel muestra los estados sincronizados (solo lectura de datos del CRM)

4. **Documentación por Servicio**:
   - **Apertura LLC**: Certificados, actas, documentos legales
   - **Renovación LLC**: Nuevos certificados, confirmación
   - **Cuenta Bancaria**: Accesos, credenciales, documentos de verificación

### **Consideraciones Técnicas:**

- **Integración con Zoho CRM**:
  - Sincronización automática desde el backend
  - El panel solo visualiza datos sincronizados
  - La configuración de integración se realiza en el backend
  
- **Comunicaciones**:
  - Las comunicaciones se gestionan desde Zoho
  - El panel no incluye funcionalidades de envío de emails
  
- **Contabilidad**:
  - La contabilidad completa se gestiona en Zoho
  - El panel solo muestra información básica de facturación para referencia
  
- **Leads y CRM**:
  - La gestión de leads y CRM se realiza completamente en Zoho
  - El panel no incluye funcionalidades relacionadas a leads

- Sistema de logs para auditoría completa
- Multi-idioma (ES/EN) para panel de clientes y administrativo
- Responsive design para acceso móvil
- Sistema de archivos seguro para documentos
- Backup automático de datos críticos

### **Diferencias Clave entre Usuarios:**

1. **Cliente Final**:
   - Inicia proceso desde wizard público
   - Accede al panel solo para seguimiento
   - Ve únicamente sus propios procesos

2. **Partner**:
   - Inicia procesos **DESDE EL PANEL** (no desde wizard)
   - Puede crear solicitudes a nombre de sus clientes
   - Ve todos los procesos que ha iniciado
   - Gestiona múltiples clientes

3. **Administrador**:
   - Acceso completo al sistema
   - Revisa y gestiona todas las solicitudes
   - Da de alta partners
   - Configuración del sistema

### **Modelo de Datos Sugerido:**

**Entidades Principales:**
- Users (Clientes, Partners, Administradores)
- Requests (Solicitudes de servicios)
- Request_Steps (Etapas de cada solicitud)
- Documents (Documentos asociados)
- Invoices (Facturas - solo información básica, sincronizada desde Zoho)
- Partners (Información de partners)
- Zoho_Sync_Log (Logs de sincronización - gestionado desde backend)

---

**Última actualización**: Diciembre 2024
**Versión**: 2.0 (Actualizado con flujo real del negocio)
