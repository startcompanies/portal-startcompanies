import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SitemapXmlService {
  private readonly baseUrl = environment.baseUrl;

  /**
   * Genera el sitemap-index.xml dinámicamente
   */
  generateSitemapIndex(): string {
    const lastmod = new Date().toISOString().split('T')[0];
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- ===== SITEMAP PRINCIPAL ===== -->
  <sitemap>
    <loc>${this.baseUrl}/sitemap.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>

  <!-- ===== SITEMAP DE IMÁGENES ===== -->
  <sitemap>
    <loc>${this.baseUrl}/sitemap-images.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>

  <!-- ===== SITEMAPS FUTUROS ===== -->
  <!-- 
  <sitemap>
    <loc>${this.baseUrl}/sitemap-blog.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  
  <sitemap>
    <loc>${this.baseUrl}/sitemap-services.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  
  <sitemap>
    <loc>${this.baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  -->

</sitemapindex>`;
  }

  /**
   * Genera el sitemap-images.xml dinámicamente
   */
  generateSitemapImages(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
         xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- ===== IMÁGENES PRINCIPALES DEL SITIO ===== -->
  
  <!-- Logo Principal -->
  <url>
    <loc>${this.baseUrl}/</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/logo-dark-desktop.webp</image:loc>
      <image:title>Start Companies LLC - Logo Principal</image:title>
      <image:caption>Logo oficial de Start Companies LLC, empresa especializada en servicios financieros para LLC en Estados Unidos</image:caption>
      <image:license>${this.baseUrl}/</image:license>
    </image:image>
  </url>

  <!-- Logo Mobile -->
  <url>
    <loc>${this.baseUrl}/</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/logo-dark-mobile.webp</image:loc>
      <image:title>Start Companies LLC - Logo Mobile</image:title>
      <image:caption>Logo optimizado para dispositivos móviles</image:caption>
    </image:image>
  </url>

  <!-- Logo Tablet -->
  <url>
    <loc>${this.baseUrl}/</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/logo-dark-tablet.webp</image:loc>
      <image:title>Start Companies LLC - Logo Tablet</image:title>
      <image:caption>Logo optimizado para tablets</image:caption>
    </image:image>
  </url>

  <!-- Hero Background -->
  <url>
    <loc>${this.baseUrl}/</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/hero-bg-desktop.webp</image:loc>
      <image:title>Hero Background - Start Companies LLC</image:title>
      <image:caption>Imagen de fondo principal del sitio web</image:caption>
    </image:image>
  </url>

  <!-- Imágenes de Beneficios -->
  <url>
    <loc>${this.baseUrl}/</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/benefits/clock.svg</image:loc>
      <image:title>Beneficio - Rapidez</image:title>
      <image:caption>Icono representando rapidez en nuestros servicios</image:caption>
    </image:image>
  </url>

  <url>
    <loc>${this.baseUrl}/</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/benefits/globe.svg</image:loc>
      <image:title>Beneficio - Alcance Global</image:title>
      <image:caption>Icono representando nuestro alcance global</image:caption>
    </image:image>
  </url>

  <url>
    <loc>${this.baseUrl}/</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/benefits/idea.svg</image:loc>
      <image:title>Beneficio - Innovación</image:title>
      <image:caption>Icono representando innovación en servicios financieros</image:caption>
    </image:image>
  </url>

  <!-- Imágenes de Testimonios -->
  <url>
    <loc>${this.baseUrl}/</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/testimonials/img_outdoor_shot_yo.webp</image:loc>
      <image:title>Testimonio Cliente</image:title>
      <image:caption>Cliente satisfecho con nuestros servicios</image:caption>
    </image:image>
  </url>

  <url>
    <loc>${this.baseUrl}/</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/testimonials/img_young_bearded_m_64x64.webp</image:loc>
      <image:title>Testimonio Cliente</image:title>
      <image:caption>Cliente joven con experiencia positiva</image:caption>
    </image:image>
  </url>

  <!-- Imágenes de Servicios -->
  <url>
    <loc>${this.baseUrl}/apertura-banco-relay</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/relay/work-llc.webp</image:loc>
      <image:title>Servicio de Apertura de Banco Relay</image:title>
      <image:caption>Imagen representativa del servicio de apertura de cuentas bancarias Relay</image:caption>
    </image:image>
  </url>

  <!-- Imágenes del Blog -->
  <url>
    <loc>${this.baseUrl}/blog</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/blog/article.webp</image:loc>
      <image:title>Blog - Start Companies LLC</image:title>
      <image:caption>Imagen representativa de nuestro blog con consejos y noticias</image:caption>
    </image:image>
  </url>

  <url>
    <loc>${this.baseUrl}/blog</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/blog/article-small.webp</image:loc>
      <image:title>Blog - Artículos Pequeños</image:title>
      <image:caption>Vista previa de artículos del blog</image:caption>
    </image:image>
  </url>

  <!-- Imágenes de Nosotros -->
  <url>
    <loc>${this.baseUrl}/nosotros</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/us/mission-person.jpg</image:loc>
      <image:title>Equipo Start Companies LLC</image:title>
      <image:caption>Miembro de nuestro equipo comprometido con la excelencia</image:caption>
    </image:image>
  </url>

  <url>
    <loc>${this.baseUrl}/nosotros</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/us/vision.webp</image:loc>
      <image:title>Visión de Start Companies LLC</image:title>
      <image:caption>Representación visual de nuestra visión empresarial</image:caption>
    </image:image>
  </url>

  <!-- Imágenes de Tabs/Servicios -->
  <url>
    <loc>${this.baseUrl}/</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/tabs/account_bank.webp</image:loc>
      <image:title>Servicio de Cuenta Bancaria</image:title>
      <image:caption>Imagen representativa de servicios bancarios</image:caption>
    </image:image>
  </url>

  <url>
    <loc>${this.baseUrl}/</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/tabs/declaration_taxes.webp</image:loc>
      <image:title>Servicio de Declaración de Impuestos</image:title>
      <image:caption>Imagen representativa de servicios fiscales</image:caption>
    </image:image>
  </url>

  <!-- Favicon -->
  <url>
    <loc>${this.baseUrl}/</loc>
    <image:image>
      <image:loc>${this.baseUrl}/assets/fav-icon/favicon.ico</image:loc>
      <image:title>Favicon Start Companies LLC</image:title>
      <image:caption>Icono oficial del sitio web</image:caption>
    </image:image>
  </url>

</urlset>`;
  }
}

