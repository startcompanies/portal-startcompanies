# 📊 Facebook Pixels Implementados en Start Companies LLC

## 📋 Resumen Ejecutivo

Se han implementado **dos Facebook Pixels específicos** para diferentes landing pages de Start Companies LLC. Cada pixel está configurado para rastrear el comportamiento de los usuarios en páginas específicas y enviar eventos de conversión a Facebook Ads.

## 🎯 Pixels Implementados

### **1. Pixel 1 (703523572287021) - Landing "Abre tu LLC"**
- **Página objetivo**: `/abre-tu-llc`
- **Servicio**: Apertura de LLC en Estados Unidos
- **Eventos trackeados**: PageView, Lead, ViewContent, Deep Scroll

### **2. Pixel 2 (1055049486479771) - Landing "Apertura Relay"**
- **Página objetivo**: `/apertura-banco-relay`
- **Servicio**: Apertura de cuenta bancaria Relay
- **Eventos trackeados**: PageView, InitiateCheckout, ViewContent, Deep Scroll

## 🚀 Características de la Implementación

### **✅ Implementación Inteligente**
- **Carga dinámica** según la página visitada
- **Sin duplicación** de pixels
- **Rendimiento optimizado** (solo carga el pixel necesario)
- **Fallback noscript** para usuarios sin JavaScript

### **✅ Tracking Automático**
- **PageView** al cargar la página
- **Scroll profundo** en 25%, 50%, 75%
- **Tiempo de engagement** automático
- **Eventos de conversión** en clicks específicos

### **✅ Eventos Personalizados**
- **Leads** en formularios y CTA
- **Vista de contenido** en secciones clave
- **Inicio de checkout** para servicios pagos
- **Reproducción de videos** y testimonios

## 📊 Eventos Implementados por Landing

### **🏠 Landing "Abre tu LLC" (Pixel 1)**
| Evento | Descripción | Parámetros |
|--------|-------------|------------|
| **PageView** | Vista de página | `content_name: 'Abre tu LLC Landing'` |
| **Lead** | Click en calendario | `content_name: 'Calendly CTA - Abre tu LLC'` |
| **Lead** | Botón flotante | `content_name: 'Floating CTA - Abre tu LLC'` |
| **ViewContent** | Scroll 25% | `content_name: 'Abre tu LLC - Deep Engagement'` |
| **ViewContent** | Scroll 50% | `content_name: 'Abre tu LLC - Deep Engagement'` |
| **ViewContent** | Scroll 75% | `content_name: 'Abre tu LLC - Deep Engagement'` |
| **ViewContent** | Video testimonios | `content_name: 'Video Title', content_category: 'Video Content'` |

### **💼 Landing "Apertura Relay" (Pixel 2)**
| Evento | Descripción | Parámetros |
|--------|-------------|------------|
| **PageView** | Vista de página | `content_name: 'Apertura Relay Landing'` |
| **InitiateCheckout** | Botón $99 USD | `content_name: 'Relay Service - $99 USD', value: 99.00` |
| **ViewContent** | Sección de planes | `content_name: 'Relay Plans Section'` |
| **ViewContent** | Scroll 25% | `content_name: 'Apertura Relay - Deep Engagement'` |
| **ViewContent** | Scroll 50% | `content_name: 'Apertura Relay - Deep Engagement'` |
| **ViewContent** | Scroll 75% | `content_name: 'Apertura Relay - Deep Engagement'` |
| **ViewContent** | Video Wistia | `content_name: 'Relay Banking Service', content_category: 'Video Content'` |
| **ViewContent** | Video YouTube | `content_name: 'Relay Banking Service', content_category: 'Video Content'` |
| **ViewContent** | Testimonios | `content_name: 'Customer Testimonials'` |

## 🔧 Arquitectura Técnica

### **📁 Servicio Centralizado**
- **Archivo**: `src/app/services/facebook-pixel.service.ts`
- **Métodos principales**:
  - `initializePixel(pageType)` - Inicializa pixel según página
  - `trackEvent(eventName, parameters)` - Evento genérico
  - `trackLead(contentName, contentCategory, value)` - Tracking de leads
  - `trackViewContent(contentName, contentCategory)` - Vista de contenido
  - `trackInitiateCheckout(contentName, contentCategory, value)` - Inicio de checkout
  - `trackDeepScroll(pageName, scrollDepth)` - Scroll profundo
  - `trackVideoPlay(videoTitle, videoType, pageLocation)` - Reproducción de video

### **🎯 Componentes Implementados**
- **Landing Abre tu LLC**: `src/app/landings/landing-abre-tu-llc/`
- **Landing Apertura Relay**: `src/app/landings/landing-apertura-relay/`

### **📱 Eventos de Scroll**
- **HostListener**: `@HostListener('window:scroll')`
- **Tracking automático**: 25%, 50%, 75% de scroll
- **Sin duplicación**: Solo se trackea una vez por nivel

## 🎯 Configuración en Facebook Ads

### **1. Eventos de Conversión**
```javascript
// Pixel 1 - Abre tu LLC
Lead: Calendly CTA, Floating CTA
ViewContent: Deep Engagement, Video Content

// Pixel 2 - Apertura Relay
InitiateCheckout: Relay Service $99
ViewContent: Plans, Deep Engagement, Video Content
```

### **2. Audiencias Personalizadas**
- **Usuarios interesados en LLC**: Visitaron landing LLC
- **Usuarios interesados en Relay**: Visitaron landing Relay
- **Usuarios de alto engagement**: Scroll > 75%
- **Usuarios que vieron videos**: Interacción con contenido multimedia

### **3. Campañas de Remarketing**
- **Lookalike audiences** basadas en conversiones
- **Custom audiences** por comportamiento específico
- **Dynamic ads** con productos relevantes

## 📈 Métricas de Éxito Esperadas

### **Corto Plazo (1-2 semanas)**
- ✅ Pixels funcionando correctamente
- ✅ Eventos siendo enviados a Facebook
- ✅ Primeros datos de conversión disponibles
- ✅ Audiencias personalizadas activas

### **Mediano Plazo (1-2 meses)**
- 📈 Datos históricos acumulándose
- 📈 Patrones de comportamiento identificados
- 📈 Audiencias personalizadas optimizadas
- 📈 Campañas de remarketing activas

### **Largo Plazo (3-6 meses)**
- 🚀 ROI optimizado basado en datos
- 🚀 Campañas de conversión automatizadas
- 🚀 Audiencias lookalike de alta calidad
- 🚀 Sistema de attribution completo

## 🔍 Verificación de Implementación

### **1. Facebook Pixel Helper**
- Instalar extensión en Chrome
- Verificar que solo se active el pixel correcto en cada página
- Confirmar que los eventos se envíen correctamente

### **2. Facebook Events Manager**
- Acceder a [business.facebook.com/events_manager](https://business.facebook.com/events_manager)
- Verificar que ambos pixels estén recibiendo datos
- Confirmar que los eventos se registren en tiempo real

### **3. Testing en Desarrollo**
- Navegar entre las diferentes landing pages
- Verificar que no haya conflictos entre pixels
- Confirmar que los eventos se disparen correctamente

## 🚨 Consideraciones Importantes

### **🔒 Privacidad y Cumplimiento**
- **Consentimiento de cookies** requerido para GDPR
- **Banner de consentimiento** antes de cargar pixels
- **Anonimización de IP** si es necesario
- **Política de privacidad** actualizada

### **⚡ Rendimiento**
- **Carga asíncrona** de scripts
- **Lazy loading** de eventos no críticos
- **Optimización** para dispositivos móviles
- **Fallback** para usuarios sin JavaScript

### **📱 Testing y Validación**
- **Facebook Pixel Helper** para verificación
- **GTM Preview Mode** para testing
- **Console debugging** para troubleshooting
- **A/B testing** de eventos

## 🔧 Próximos Pasos Recomendados

### **1. Verificación Inmediata**
- [ ] Verificar que los pixels funcionen en cada landing
- [ ] Confirmar que los eventos se envíen a Facebook
- [ ] Testing con Facebook Pixel Helper
- [ ] Validación en Facebook Events Manager

### **2. Configuración en Facebook Ads**
- [ ] Crear audiencias personalizadas
- [ ] Configurar eventos de conversión
- [ ] Implementar campañas de remarketing
- [ ] Optimizar campañas existentes

### **3. Optimización Continua**
- [ ] Monitorear métricas de conversión
- [ ] Ajustar eventos según comportamiento
- [ ] Implementar nuevos eventos de tracking
- [ ] A/B testing de landing pages

### **4. Escalabilidad**
- [ ] Implementar pixels en otras páginas
- [ ] Agregar eventos de e-commerce
- [ ] Integrar con Google Analytics
- [ ] Implementar tracking de funnel completo

---

**Fecha de Implementación**: 27 de Enero, 2025  
**Responsable**: Equipo de Desarrollo  
**Estado**: ✅ Implementado y Activo  
**Pixel 1**: 703523572287021 (Abre tu LLC)  
**Pixel 2**: 1055049486479771 (Apertura Relay)  
**Próxima Revisión**: 27 de Febrero, 2025
