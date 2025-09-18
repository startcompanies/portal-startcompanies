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
        { url: '/', priority: '1.0', changefreq: 'weekly' },
        { url: '/blog', priority: '0.9', changefreq: 'weekly' },
        { url: '/planes', priority: '0.9', changefreq: 'monthly' },
        { url: '/contacto', priority: '0.8', changefreq: 'monthly' },
        { url: '/nosotros', priority: '0.7', changefreq: 'monthly' },
        { url: '/abre-tu-llc', priority: '0.9', changefreq: 'monthly' },
        { url: '/apertura-banco-relay', priority: '0.9', changefreq: 'monthly' },
        { url: '/agendar', priority: '0.8', changefreq: 'monthly' },
        { url: '/apertura-llc', priority: '0.8', changefreq: 'monthly' },
        { url: '/renovar-llc', priority: '0.8', changefreq: 'monthly' }
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
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
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

# Allow blog
Allow: /blog/

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

  // Redirecciones 301 para mantener SEO (solo URLs que no existen)
  server.get('/servicios', (req, res) => {
    res.redirect(301, '/');
  });

  /*server.get('/blog', (req, res) => {
    res.redirect(301, '/');
  });*/

  server.get('/agenda-tu-consulta-gratis', (req, res) => {
    res.redirect(301, '/contacto');
  });

  server.get('/abrir-llc', (req, res) => {
    res.redirect(301, '/abre-tu-llc');
  });

  // Redirecciones de blog y categorías
  /*server.get('/category/*', (req, res) => {
    res.redirect(301, '/');
  });

  server.get('/como-*', (req, res) => {
    res.redirect(301, '/');
  });*/

  server.get('/*/page/*', (req, res) => {
   res.redirect(301, '/');
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
