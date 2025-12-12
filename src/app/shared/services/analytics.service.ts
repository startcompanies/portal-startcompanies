import { Injectable } from '@angular/core';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor() { }

  /**
   * Envía un evento personalizado a Google Analytics
   * @param action - Acción del evento (ej: 'click', 'form_submit', 'scroll')
   * @param category - Categoría del evento (ej: 'button', 'form', 'navigation')
   * @param label - Etiqueta específica del evento (ej: 'contact_button', 'hero_section')
   * @param value - Valor numérico opcional
   */
  trackEvent(action: string, category: string, label?: string, value?: number): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
    }
  }

  /**
   * Trackea clicks en botones CTA
   * @param buttonName - Nombre del botón
   * @param pageLocation - Ubicación de la página
   * @param buttonType - Tipo de botón (ej: 'primary', 'secondary')
   */
  trackButtonClick(buttonName: string, pageLocation: string, buttonType: string = 'primary'): void {
    this.trackEvent('click', 'button', `${buttonName}_${pageLocation}_${buttonType}`);
  }

  /**
   * Trackea envíos de formularios
   * @param formName - Nombre del formulario
   * @param pageLocation - Ubicación de la página
   * @param formType - Tipo de formulario (ej: 'contact', 'quote', 'newsletter')
   */
  trackFormSubmit(formName: string, pageLocation: string, formType: string = 'contact'): void {
    this.trackEvent('form_submit', 'form', `${formName}_${pageLocation}_${formType}`);
  }

  /**
   * Trackea vistas de páginas específicas
   * @param pageName - Nombre de la página
   * @param pageType - Tipo de página (ej: 'service', 'landing', 'blog')
   */
  trackPageView(pageName: string, pageType: string = 'page'): void {
    this.trackEvent('page_view', 'navigation', `${pageName}_${pageType}`);
  }

  /**
   * Trackea interés en servicios
   * @param serviceName - Nombre del servicio
   * @param pageLocation - Ubicación de la página
   * @param serviceType - Tipo de servicio (ej: 'LLC', 'banking', 'consulting')
   */
  trackServiceInterest(serviceName: string, pageLocation: string, serviceType: string = 'LLC'): void {
    this.trackEvent('view_item', 'service', `${serviceName}_${pageLocation}_${serviceType}`);
  }

  /**
   * Trackea scroll profundo en páginas
   * @param pageName - Nombre de la página
   * @param scrollDepth - Porcentaje de scroll (ej: 25, 50, 75, 100)
   */
  trackScrollDepth(pageName: string, scrollDepth: number): void {
    this.trackEvent('scroll', 'engagement', `${pageName}_${scrollDepth}%`, scrollDepth);
  }

  /**
   * Trackea tiempo de engagement en página
   * @param pageName - Nombre de la página
   * @param timeInSeconds - Tiempo en segundos
   */
  trackEngagementTime(pageName: string, timeInSeconds: number): void {
    this.trackEvent('engagement', 'timing', `${pageName}_${timeInSeconds}s`, timeInSeconds);
  }

  /**
   * Trackea clicks en enlaces externos
   * @param linkUrl - URL del enlace
   * @param linkText - Texto del enlace
   * @param pageLocation - Ubicación de la página
   */
  trackExternalLink(linkUrl: string, linkText: string, pageLocation: string): void {
    this.trackEvent('click', 'external_link', `${linkText}_${pageLocation}`, 1);
  }

  /**
   * Trackea interacciones con calendario
   * @param action - Acción del calendario (ej: 'open', 'book', 'cancel')
   * @param calendarType - Tipo de calendario (ej: 'consultation', 'appointment')
   */
  trackCalendarInteraction(action: string, calendarType: string = 'consultation'): void {
    this.trackEvent(action, 'calendar', `${action}_${calendarType}`);
  }

  /**
   * Trackea descargas de archivos
   * @param fileName - Nombre del archivo
   * @param fileType - Tipo de archivo (ej: 'pdf', 'guide', 'checklist')
   * @param pageLocation - Ubicación de la página
   */
  trackFileDownload(fileName: string, fileType: string, pageLocation: string): void {
    this.trackEvent('download', 'file', `${fileName}_${fileType}_${pageLocation}`);
  }

  /**
   * Trackea reproducción de videos
   * @param videoTitle - Título del video
   * @param videoType - Tipo de video (ej: 'testimonial', 'explainer', 'demo')
   * @param pageLocation - Ubicación de la página
   */
  trackVideoPlay(videoTitle: string, videoType: string, pageLocation: string): void {
    this.trackEvent('play', 'video', `${videoTitle}_${videoType}_${pageLocation}`);
  }

  /**
   * Trackea búsquedas en el sitio
   * @param searchTerm - Término de búsqueda
   * @param searchResults - Número de resultados
   * @param pageLocation - Ubicación de la página
   */
  trackSearch(searchTerm: string, searchResults: number, pageLocation: string): void {
    this.trackEvent('search', 'site_search', `${searchTerm}_${pageLocation}`, searchResults);
  }

  /**
   * Trackea errores del sitio
   * @param errorMessage - Mensaje de error
   * @param errorType - Tipo de error (ej: '404', '500', 'form_validation')
   * @param pageLocation - Ubicación de la página
   */
  trackError(errorMessage: string, errorType: string, pageLocation: string): void {
    this.trackEvent('exception', 'error', `${errorType}_${pageLocation}`, 1);
  }

  /**
   * Trackea conversiones de objetivos
   * @param goalName - Nombre del objetivo
   * @param goalValue - Valor del objetivo
   * @param pageLocation - Ubicación de la página
   */
  trackGoal(goalName: string, goalValue: number, pageLocation: string): void {
    this.trackEvent('conversion', 'goal', `${goalName}_${pageLocation}`, goalValue);
  }
}
