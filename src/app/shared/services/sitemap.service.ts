import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Post } from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class SitemapService {
  private readonly baseUrl = environment.baseUrl;
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Genera sitemap XML para todos los posts del blog
   */
  generateBlogSitemap(): Promise<string> {
    return this.http.get<Post[]>(`${this.apiUrl.replace(/\/+$/, '')}/blog/posts/get-from-portal`)
      .toPromise()
      .then(posts => {
        if (!posts) return this.generateEmptySitemap();

        const urls = posts
          .filter(post => post.is_published)
          .map(post => this.generateUrlEntry(post));

        return this.generateSitemapXml(urls);
      })
      .catch(error => {
        console.error('Error generating blog sitemap:', error);
        return this.generateEmptySitemap();
      });
  }

  /**
   * Genera entrada de URL para un post
   */
  private generateUrlEntry(post: Post): string {
    const url = `${this.baseUrl}/blog/${post.slug}`;
    const lastmod = new Date(post.published_at).toISOString().split('T')[0];
    
    return `
    <url>
      <loc>${url}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>`;
  }

  /**
   * Genera XML completo del sitemap
   */
  private generateSitemapXml(urls: string[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join('')}
</urlset>`;
  }

  /**
   * Genera sitemap vacío en caso de error
   */
  private generateEmptySitemap(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
  }

  /**
   * Genera sitemap completo del sitio (incluyendo blog)
   */
  generateFullSitemap(): Promise<string> {
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

    return this.generateBlogSitemap().then(blogSitemap => {
      const staticEntries = staticUrls.map(page => `
    <url>
      <loc>${this.baseUrl}${page.url}</loc>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>`).join('');

      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticEntries}
  ${blogSitemap.replace('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', '').replace('</urlset>', '')}
</urlset>`;
    });
  }

  /**
   * Genera robots.txt dinámico
   */
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap-index.xml
Sitemap: ${this.baseUrl}/pages.xml
Sitemap: ${this.baseUrl}/posts.xml
Sitemap: ${this.baseUrl}/sitemap-images.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/

# Allow blog
Allow: /blog/

# Crawl-delay for respectful crawling
Crawl-delay: 1`;
  }
}
