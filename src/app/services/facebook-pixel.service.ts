import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class FacebookPixelService {

  private pixel1Id = '703523572287021';
  private pixel2Id = '1055049486479771';
  private isInitialized = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  /**
   * Inicializa el pixel de Facebook según la página
   * @param pageType - Tipo de página ('llc' o 'relay')
   */
  initializePixel(pageType: 'llc' | 'relay'): void {
    // Solo inicializa el píxel si estamos en el navegador
    if (!isPlatformBrowser(this.platformId) || this.isInitialized) {
      return;
    }

    const pixelId = pageType === 'llc' ? this.pixel1Id : this.pixel2Id;
    
    // Crear script de Facebook Pixel
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    
    document.head.appendChild(script);
    
    // Crear noscript fallback
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    
    noscript.appendChild(img);
    document.body.insertBefore(noscript, document.body.firstChild);
    
    this.isInitialized = true;
  }

  // Las otras funciones (trackEvent, trackLead, etc.) ya tienen la verificación
  // `typeof window !== 'undefined'`, por lo que no necesitan cambios.
  trackEvent(eventName: string, parameters?: any): void {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, parameters);
    }
  }

  trackLead(contentName: string, contentCategory: string, value: number = 0): void {
    this.trackEvent('Lead', {
      content_name: contentName,
      content_category: contentCategory,
      value: value,
      currency: 'USD'
    });
  }

  trackViewContent(contentName: string, contentCategory: string): void {
    this.trackEvent('ViewContent', {
      content_name: contentName,
      content_category: contentCategory
    });
  }

  trackInitiateCheckout(contentName: string, contentCategory: string, value: number): void {
    this.trackEvent('InitiateCheckout', {
      content_name: contentName,
      content_category: contentCategory,
      value: value,
      currency: 'USD'
    });
  }

  trackCTAClick(buttonName: string, pageLocation: string, serviceType: string): void {
    this.trackEvent('Lead', {
      content_name: `${buttonName} - ${pageLocation}`,
      content_category: serviceType,
      value: 0.00,
      currency: 'USD'
    });
  }

  trackDeepScroll(pageName: string, scrollDepth: number): void {
    this.trackEvent('ViewContent', {
      content_name: `${pageName} - Deep Engagement`,
      content_category: 'User Engagement',
      custom_parameter: `scroll_${scrollDepth}%`
    });
  }

  trackVideoPlay(videoTitle: string, videoType: string, pageLocation: string): void {
    this.trackEvent('ViewContent', {
      content_name: `${videoTitle} - ${videoType}`,
      content_category: 'Video Content',
      custom_parameter: pageLocation
    });
  }
}