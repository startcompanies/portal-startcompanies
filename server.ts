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
  
  // Redirecciones 301 para mantener SEO (solo URLs que no existen)
  server.get('/servicios', (req, res) => {
    res.redirect(301, '/');
  });

  server.get('/blog', (req, res) => {
    res.redirect(301, '/');
  });

  server.get('/agenda-tu-consulta-gratis', (req, res) => {
    res.redirect(301, '/contacto');
  });

  server.get('/abrir-llc', (req, res) => {
    res.redirect(301, '/abre-tu-llc');
  });

  // Redirecciones de blog y categorías
  server.get('/category/*', (req, res) => {
    res.redirect(301, '/');
  });

  server.get('/como-*', (req, res) => {
    res.redirect(301, '/');
  });

  server.get('/*/page/*', (req, res) => {
    res.redirect(301, '/');
  });

  // Serve static files from /browser with advanced cache busting
  server.get('**', express.static(browserDistFolder, {
    maxAge: 0, // No cache
    etag: false, // Disable ETag
    lastModified: false, // Disable Last-Modified
    index: 'index.html',
    setHeaders: (res, path) => {
      // Headers específicos para archivos estáticos
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }));

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;
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
