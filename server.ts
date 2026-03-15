import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { APP_CONFIG } from './src/app/core/config/app.config.constants';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const browserDistFolder = join(process.cwd(), 'dist/portal-startcompanies/browser');
  const indexHtml = join(browserDistFolder, 'index.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Helper function para obtener baseUrl dinámicamente
  const getBaseUrl = (req: express.Request): string => {
    // Intentar obtener desde el header Host
    const host = req.get('host') || req.headers.host || '';
    const protocol = req.protocol || (req.get('x-forwarded-proto') || 'https').split(',')[0].trim();
    
    // Portal prod y staging usan .io; .us ya no existe (solo la API está en .us)
    if (host.includes('startcompanies.io')) {
      return `${protocol}://${host}`;
    }

    // Fallback: usar variable de entorno o valor por defecto
    return process.env['BASE_URL'] || process.env['DOMAIN'] 
      ? `https://${process.env['DOMAIN'] || process.env['BASE_URL']?.replace('https://', '')}`
      : APP_CONFIG.domain.production;
  };

  // Helper para obtener la URL de la API según el host (staging vs producción)
  // Así posts.xml usa la API correcta aunque no se defina API_URL en el despliegue
  const getApiUrl = (req: express.Request): string => {
    const fromEnv = process.env['API_URL'] || process.env['NX_API_URL'];
    if (fromEnv && fromEnv.trim()) {
      return fromEnv.replace(/\/+$/, '');
    }
    const host = (req.get('host') || req.headers.host || '').toLowerCase();
    // Staging: staging.startcompanies.io -> api-web.startcompanies.io
    if (host.includes('staging.startcompanies.io')) {
      return APP_CONFIG.domain.api.staging;
    }
    if (host.includes('startcompanies.io')) {
      return APP_CONFIG.domain.api.staging;
    }
    return APP_CONFIG.domain.api.production;
  };

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });

  // Endpoint para sitemap.xml - Redirige al sitemap-index
  server.get('/sitemap.xml', async (req, res) => {
    // Redirigir al sitemap-index para mejor organización
    res.redirect(301, '/sitemap-index.xml');
  });

  // Endpoint para sitemap-index.xml dinámico
  server.get('/sitemap-index.xml', async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const lastmod = new Date().toISOString().split('T')[0];
      
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- ===== SITEMAP DE PÁGINAS ESTÁTICAS ===== -->
  <sitemap>
    <loc>${baseUrl}/pages.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>

  <!-- ===== SITEMAP DE POSTS DEL BLOG ===== -->
  <sitemap>
    <loc>${baseUrl}/posts.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>

  <!-- ===== SITEMAP DE IMÁGENES ===== -->
  <sitemap>
    <loc>${baseUrl}/sitemap-images.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>

</sitemapindex>`;
      
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
      res.send(sitemapIndex);
    } catch (error) {
      console.error('Error generating sitemap-index:', error);
      res.status(500).send('Error generating sitemap-index');
    }
  });

  // Endpoint para pages.xml - Páginas estáticas
  server.get('/pages.xml', async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const staticUrls = [
        // Página principal
        { url: '/', priority: '1.0', changefreq: 'weekly' },
        
        // Rutas principales en español (ahora en raíz)
        { url: '/inicio', priority: '1.0', changefreq: 'weekly' },
        { url: '/nosotros', priority: '0.8', changefreq: 'monthly' },
        { url: '/contacto', priority: '0.8', changefreq: 'monthly' },
        { url: '/planes', priority: '0.9', changefreq: 'monthly' },
        { url: '/blog', priority: '0.9', changefreq: 'daily' },
        
        // Rutas principales en inglés
        { url: '/en/home', priority: '1.0', changefreq: 'weekly' },
        { url: '/en/about-us', priority: '0.8', changefreq: 'monthly' },
        { url: '/en/contact', priority: '0.8', changefreq: 'monthly' },
        { url: '/en/plans', priority: '0.9', changefreq: 'monthly' },
        { url: '/en/blog', priority: '0.9', changefreq: 'daily' },
        
        // Landing pages en español (ahora en raíz)
        { url: '/abre-tu-llc', priority: '0.9', changefreq: 'monthly' },
        { url: '/presentacion', priority: '0.8', changefreq: 'monthly' },
        { url: '/apertura-banco-relay', priority: '0.9', changefreq: 'monthly' },
        { url: '/agendar', priority: '0.8', changefreq: 'monthly' },
        { url: '/rescate-relay', priority: '0.7', changefreq: 'monthly' },
        
        // Landing pages en inglés
        { url: '/en/llc-formation', priority: '0.9', changefreq: 'monthly' },
        { url: '/en/presentation', priority: '0.8', changefreq: 'monthly' },
        { url: '/en/relay-account-opening', priority: '0.9', changefreq: 'monthly' },
        { url: '/en/schedule', priority: '0.8', changefreq: 'monthly' },
        
        // Formularios en español (ahora en raíz)
        { url: '/apertura-llc', priority: '0.8', changefreq: 'monthly' },
        { url: '/renovar-llc', priority: '0.8', changefreq: 'monthly' },
        { url: '/form-apertura-relay', priority: '0.8', changefreq: 'monthly' },
        { url: '/fixcal', priority: '0.8', changefreq: 'monthly' },
        { url: '/abotax', priority: '0.8', changefreq: 'monthly' },
        
        // Formularios en inglés
        { url: '/en/llc-opening', priority: '0.8', changefreq: 'monthly' },
        { url: '/en/llc-renewal', priority: '0.8', changefreq: 'monthly' },
        { url: '/en/relay-opening-form', priority: '0.8', changefreq: 'monthly' },
        { url: '/en/fixcal', priority: '0.8', changefreq: 'monthly' },
        { url: '/en/abotax', priority: '0.8', changefreq: 'monthly' },
        
        // Páginas legales en español
        { url: '/aviso-de-privacidad', priority: '0.6', changefreq: 'yearly' },
        { url: '/terminos-y-condiciones', priority: '0.6', changefreq: 'yearly' },
        
        // Páginas legales en inglés
        { url: '/en/privacy-policy', priority: '0.6', changefreq: 'yearly' },
        { url: '/en/terms-and-conditions', priority: '0.6', changefreq: 'yearly' },
        
        // Páginas de error
        { url: '/error-404', priority: '0.1', changefreq: 'yearly' },
        { url: '/en/error-404', priority: '0.1', changefreq: 'yearly' }
      ];

      const staticEntries = staticUrls.map(page => `
    <url>
      <loc>${baseUrl}${page.url}</loc>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>`).join('');

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticEntries}
</urlset>`;
      
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating pages sitemap:', error);
      res.status(500).send('Error generating pages sitemap');
    }
  });

  // Endpoint para posts.xml - Posts del blog
  server.get('/posts.xml', async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const apiEndpoint = getApiUrl(req);

      // Obtener posts desde la API (get-from-portal devuelve solo publicados)
      let posts: any[] = [];
      try {
        const response = await fetch(`${apiEndpoint}/blog/posts/get-from-portal`);
        if (response.ok) {
          posts = await response.json();
        } else {
          console.warn(`[posts.xml] API no disponible (${response.status} ${response.statusText}), generando sitemap vacío. URL: ${apiEndpoint}/blog/posts/get-from-portal`);
        }
      } catch (fetchError: any) {
        console.warn('[posts.xml] Error fetching posts from API:', fetchError?.message || fetchError, 'URL:', `${apiEndpoint}/blog/posts/get-from-portal`);
        // Continuar con array vacío si falla la API
      }
      
      // La API get-from-portal ya devuelve solo posts publicados (is_published: true)
      const postsList = Array.isArray(posts) ? posts : [];
      const publishedPosts = postsList.filter(post => post && post.slug);

      if (publishedPosts.length === 0 && (process.env['NODE_ENV'] !== 'production' || (req.get('host') || '').includes('staging'))) {
        console.warn('[posts.xml] No se obtuvieron posts. Comprueba que la API esté levantada y que existan posts publicados. API usada:', apiEndpoint);
      }

      // Generar entradas de URL para cada post
      const postEntries = publishedPosts.map(post => {
        const url = `${baseUrl}/blog/post/${post.slug}`;
        const lastmod = post.published_at 
          ? new Date(post.published_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        
        return `
    <url>
      <loc>${url}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>`;
      }).join('');

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${postEntries}
</urlset>`;
      
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating posts sitemap:', error);
      res.status(500).send('Error generating posts sitemap');
    }
  });

  // Endpoint para sitemap-images.xml dinámico
  server.get('/sitemap-images.xml', async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      
      const sitemapImages = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
         xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- ===== IMÁGENES PRINCIPALES DEL SITIO ===== -->
  
  <!-- Logo Principal -->
  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/logo-dark-desktop.webp</image:loc>
      <image:title>Start Companies - Logo Principal</image:title>
      <image:caption>Logo oficial de Start Companies, empresa especializada en servicios financieros para LLC en Estados Unidos</image:caption>
      <image:license>${baseUrl}/</image:license>
    </image:image>
  </url>

  <!-- Logo Mobile -->
  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/logo-dark-mobile.webp</image:loc>
      <image:title>Start Companies - Logo Mobile</image:title>
      <image:caption>Logo optimizado para dispositivos móviles</image:caption>
    </image:image>
  </url>

  <!-- Logo Tablet -->
  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/logo-dark-tablet.webp</image:loc>
      <image:title>Start Companies - Logo Tablet</image:title>
      <image:caption>Logo optimizado para tablets</image:caption>
    </image:image>
  </url>

  <!-- Hero Background -->
  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/hero-bg-desktop.webp</image:loc>
      <image:title>Hero Background - Start Companies</image:title>
      <image:caption>Imagen de fondo principal del sitio web</image:caption>
    </image:image>
  </url>

  <!-- Imágenes de Beneficios -->
  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/benefits/clock.svg</image:loc>
      <image:title>Beneficio - Rapidez</image:title>
      <image:caption>Icono representando rapidez en nuestros servicios</image:caption>
    </image:image>
  </url>

  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/benefits/globe.svg</image:loc>
      <image:title>Beneficio - Alcance Global</image:title>
      <image:caption>Icono representando nuestro alcance global</image:caption>
    </image:image>
  </url>

  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/benefits/idea.svg</image:loc>
      <image:title>Beneficio - Innovación</image:title>
      <image:caption>Icono representando innovación en servicios financieros</image:caption>
    </image:image>
  </url>

  <!-- Imágenes de Testimonios -->
  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/testimonials/img_outdoor_shot_yo.webp</image:loc>
      <image:title>Testimonio Cliente</image:title>
      <image:caption>Cliente satisfecho con nuestros servicios</image:caption>
    </image:image>
  </url>

  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/testimonials/img_young_bearded_m_64x64.webp</image:loc>
      <image:title>Testimonio Cliente</image:title>
      <image:caption>Cliente joven con experiencia positiva</image:caption>
    </image:image>
  </url>

  <!-- Imágenes de Servicios -->
  <url>
    <loc>${baseUrl}/apertura-banco-relay</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/relay/work-llc.webp</image:loc>
      <image:title>Servicio de Apertura de Banco Relay</image:title>
      <image:caption>Imagen representativa del servicio de apertura de cuentas bancarias Relay</image:caption>
    </image:image>
  </url>

  <!-- Imágenes del Blog -->
  <url>
    <loc>${baseUrl}/blog</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/blog/article.webp</image:loc>
      <image:title>Blog - Start Companies</image:title>
      <image:caption>Imagen representativa de nuestro blog con consejos y noticias</image:caption>
    </image:image>
  </url>

  <url>
    <loc>${baseUrl}/blog</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/blog/article-small.webp</image:loc>
      <image:title>Blog - Artículos Pequeños</image:title>
      <image:caption>Vista previa de artículos del blog</image:caption>
    </image:image>
  </url>

  <!-- Imágenes de Nosotros -->
  <url>
    <loc>${baseUrl}/nosotros</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/us/mission-person.jpg</image:loc>
      <image:title>Equipo Start Companies</image:title>
      <image:caption>Miembro de nuestro equipo comprometido con la excelencia</image:caption>
    </image:image>
  </url>

  <url>
    <loc>${baseUrl}/nosotros</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/us/vision.webp</image:loc>
      <image:title>Visión de Start Companies</image:title>
      <image:caption>Representación visual de nuestra visión empresarial</image:caption>
    </image:image>
  </url>

  <!-- Imágenes de Tabs/Servicios -->
  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/tabs/account_bank.webp</image:loc>
      <image:title>Servicio de Cuenta Bancaria</image:title>
      <image:caption>Imagen representativa de servicios bancarios</image:caption>
    </image:image>
  </url>

  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/tabs/declaration_taxes.webp</image:loc>
      <image:title>Servicio de Declaración de Impuestos</image:title>
      <image:caption>Imagen representativa de servicios fiscales</image:caption>
    </image:image>
  </url>

  <!-- Favicon -->
  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${baseUrl}/assets/fav-icon/favicon.ico</image:loc>
      <image:title>Favicon Start Companies</image:title>
      <image:caption>Icono oficial del sitio web</image:caption>
    </image:image>
  </url>

</urlset>`;
      
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
      res.send(sitemapImages);
    } catch (error) {
      console.error('Error generating sitemap-images:', error);
      res.status(500).send('Error generating sitemap-images');
    }
  });

  // Endpoint para sitemap específico del blog
  server.get('/sitemap-blog.xml', async (req, res) => {
    try {
      // Sitemap básico del blog - se puede mejorar después
      const baseUrl = getBaseUrl(req);
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog/category/llc-formation</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/blog/category/llc-formation</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog/category/bank-accounts</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/blog/category/bank-accounts</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog/category/business-strategy</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/blog/category/business-strategy</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog/category/tax-optimization</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/blog/category/tax-optimization</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
      
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating blog sitemap:', error);
      res.status(500).send('Error generating blog sitemap');
    }
  });

  // Endpoint para robots.txt dinámico
  server.get('/robots.txt', async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap-index.xml
Sitemap: ${baseUrl}/pages.xml
Sitemap: ${baseUrl}/posts.xml
Sitemap: ${baseUrl}/sitemap-images.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/

# Allow blog and categories
Allow: /blog/
Allow: /en/blog/

# Allow all landing pages and forms
Allow: /abre-tu-llc
Allow: /presentacion
Allow: /apertura-banco-relay
Allow: /agendar
Allow: /apertura-llc
Allow: /renovar-llc
Allow: /form-apertura-relay
Allow: /fixcal
Allow: /abotax
Allow: /rescate-relay

# Allow English routes
Allow: /en/

# Crawl-delay for respectful crawling
Crawl-delay: 1`;
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
      res.send(robotsTxt);
    } catch (error) {
      console.error('Error generating robots.txt:', error);
      res.status(500).send('Error generating robots.txt');
    }
  });

  // ===== REDIRECCIONES 301 PARA SEO =====
  // Redirecciones de rutas antiguas a las nuevas sin prefijo /es
  server.get('/servicios', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/inicio' + query);
  });
  server.get('/agenda-tu-consulta-gratis', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/contacto' + query);
  });
  server.get('/abrir-llc', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/abre-tu-llc' + query);
  });
  server.get('/apertura-relay', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/apertura-banco-relay' + query);
  });
  server.get('/contrato-oferta', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/apertura-llc' + query);
  });
  server.get('/masterclass-thank-you', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/inicio' + query);
  });
  server.get('/thank-you', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/inicio' + query);
  });
  server.get('/formulario-de-apertura-de-llc-y-cuenta-bancaria', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/apertura-llc' + query);
  });
  server.get('/formulario-renovacion-llc', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/renovar-llc' + query);
  });
  server.get('/masterclass-gratuita', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/inicio' + query);
  });
  server.get('/form-apertura-fixcal', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/fixcal' + query);
  });
  server.get('/form-apertura-abotax', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/abotax' + query);
  });
  server.get('/relay-fixcal', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/fixcal' + query);
  });
  server.get('/relay-abotax', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/abotax' + query);
  });
  server.get('/*/page/*', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/' + query);
  }); // Catch-all for old paginated blog routes

  // ===== REDIRECCIONES 301: Mover español sin prefijo. Todo /es/* -> /* equivalente =====
  server.get('/es', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/' + query);
  });
  server.get('/es/*', (req, res) => {
    const target = req.originalUrl.replace(/^\/es\//, '/');
    res.redirect(301, target);
  });

  // Serve static files from /browser with optimized caching
  server.get('**', express.static(browserDistFolder, {
    maxAge: process.env['NODE_ENV'] === 'production' ? '1d' : 0, // Cache en producción
    etag: true, // Enable ETag
    lastModified: true, // Enable Last-Modified
    index: 'index.html',
    setHeaders: (res, path) => {
      if (process.env['NODE_ENV'] === 'production') {
        // Headers optimizados para producción
        if (path.endsWith('.js') || path.endsWith('.css')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
      } else {
        // Headers para desarrollo
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    console.log(`🌐 Request recibida: ${req.method} ${originalUrl}`);
    console.log(`📋 Headers:`, headers);

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => {
        console.log(`✅ Renderizado exitoso para: ${originalUrl}`);
        res.send(html);
      })
      .catch((err) => {
        console.error(`❌ Error renderizando ${originalUrl}:`, err);

        // Si es un error 404, redirigir a /error-404
        if (err.message && err.message.includes('404')) {
          console.log(`🔄 Redirigiendo 404 a /error-404`);
          res.redirect(302, '/error-404');
        } else {
          next(err);
        }
      });
  });

  // Manejo específico de rutas no encontradas (404)
  server.use('*', (req, res) => {
    console.log(`🚫 Ruta no encontrada: ${req.originalUrl}`);
    res.redirect(302, '/error-404');
  });

  return server;
}

function run(): void {
  const port = parseInt(process.env['PORT'] || '4000', 10);
  const isDev = process.env['NODE_ENV'] !== 'production';

  // Start up the Node server
  const server = app();
  server.listen(port, '0.0.0.0', () => {
    console.log(`Node Express server listening on http://0.0.0.0:${port}`);
    console.log(`🚀 Servidor configurado para evitar caché`);
    if (isDev) {
      console.log(`🔧 Modo desarrollo activado - Cache busting habilitado`);
      console.log(`💡 Para cambios inmediatos, usa Ctrl+Shift+R en el navegador`);
    }
  });
}

run();
