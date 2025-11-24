import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const browserDistFolder = join(process.cwd(), 'dist/portal-startcompanies/browser');
  const indexHtml = join(browserDistFolder, 'index.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });

  // Endpoint para sitemap dinámico
  server.get('/sitemap.xml', async (req, res) => {
    try {
      // Generar sitemap básico sin dependencias de Angular
      const baseUrl = 'https://startcompanies.us';
      const staticUrls = [
        // Página principal (redirección)
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
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Endpoint para sitemap específico del blog
  server.get('/sitemap-blog.xml', async (req, res) => {
    try {
      // Sitemap básico del blog - se puede mejorar después
      const baseUrl = 'https://startcompanies.us';
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
    <loc>${baseUrl}/category/llc-formation</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/category/llc-formation</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/category/bank-accounts</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/category/bank-accounts</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/category/business-strategy</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/category/business-strategy</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/category/tax-optimization</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/category/tax-optimization</loc>
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
      const baseUrl = 'https://startcompanies.us';
      const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-blog.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/

# Allow blog and categories
Allow: /blog/
Allow: /category/
Allow: /post/
Allow: /en/blog/
Allow: /en/category/
Allow: /en/post/

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
