import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SitemapService } from '../services/sitemap.service';

@Component({
  selector: 'app-sitemap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-5">
      <div class="row">
        <div class="col-12">
          <h1>Sitemap XML</h1>
          <p>Generando sitemap dinámico...</p>
          <pre><code>{{ sitemapContent }}</code></pre>
        </div>
      </div>
    </div>
  `,
  styles: [`
    pre {
      background-color: #f8f9fa;
      padding: 1rem;
      border-radius: 0.375rem;
      overflow-x: auto;
      max-height: 500px;
    }
  `]
})
export class SitemapComponent implements OnInit {
  sitemapContent = '';

  constructor(private sitemapService: SitemapService) { }

  ngOnInit(): void {
    this.generateSitemap();
  }

  private generateSitemap(): void {
    this.sitemapService.generateFullSitemap()
      .then(sitemap => {
        this.sitemapContent = sitemap;
      })
      .catch(error => {
        console.error('Error generating sitemap:', error);
        this.sitemapContent = 'Error generando sitemap';
      });
  }
}
