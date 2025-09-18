import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-seo-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="seo-preview" *ngIf="post">
      <div class="seo-preview-header">
        <h4>Vista previa SEO</h4>
        <small class="text-muted">Como aparecerá en Google</small>
      </div>
      
      <div class="seo-preview-content">
        <!-- Título SEO -->
        <div class="seo-title">
          {{ seoTitle }}
        </div>
        
        <!-- URL -->
        <div class="seo-url">
          {{ seoUrl }}
        </div>
        
        <!-- Descripción -->
        <div class="seo-description">
          {{ seoDescription }}
        </div>
        
        <!-- Imagen Open Graph -->
        <div class="seo-image" *ngIf="post.image_url">
          <img [src]="post.image_url" [alt]="post.title" class="img-fluid">
        </div>
        
        <!-- Información adicional -->
        <div class="seo-meta">
          <div class="row">
            <div class="col-md-6">
              <strong>Keywords:</strong>
              <p class="small">{{ seoKeywords }}</p>
            </div>
            <div class="col-md-6">
              <strong>Categorías:</strong>
              <p class="small">{{ getCategoriesText() }}</p>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <strong>Fecha de publicación:</strong>
              <p class="small">{{ post.published_at | date:'medium' }}</p>
            </div>
            <div class="col-md-6">
              <strong>Tags:</strong>
              <p class="small">{{ getTagsText() }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seo-preview {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1rem 0;
    }
    
    .seo-preview-header {
      border-bottom: 1px solid #dee2e6;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .seo-preview-header h4 {
      margin: 0;
      color: #495057;
    }
    
    .seo-title {
      color: #1a0dab;
      font-size: 1.1rem;
      font-weight: 400;
      line-height: 1.3;
      margin-bottom: 0.25rem;
      cursor: pointer;
    }
    
    .seo-title:hover {
      text-decoration: underline;
    }
    
    .seo-url {
      color: #006621;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    
    .seo-description {
      color: #545454;
      font-size: 0.875rem;
      line-height: 1.4;
      margin-bottom: 1rem;
    }
    
    .seo-image {
      margin-bottom: 1rem;
    }
    
    .seo-image img {
      max-width: 200px;
      border-radius: 4px;
    }
    
    .seo-meta {
      background: white;
      padding: 1rem;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }
    
    .seo-meta .small {
      margin-bottom: 0.5rem;
      color: #6c757d;
    }
    
    .seo-meta strong {
      color: #495057;
      font-size: 0.875rem;
    }
  `]
})
export class SeoPreviewComponent implements OnInit {
  @Input() post!: Post;

  seoTitle = '';
  seoUrl = '';
  seoDescription = '';
  seoKeywords = '';

  ngOnInit(): void {
    if (this.post) {
      this.generateSeoData();
    }
  }

  private generateSeoData(): void {
    // Generar título SEO
    this.seoTitle = `${this.post.title} - Blog de Start Companies`;
    
    // Generar URL
    this.seoUrl = `https://startcompanies.us/blog/${this.post.slug}`;
    
    // Generar descripción
    this.seoDescription = this.generateDescription();
    
    // Generar keywords
    this.seoKeywords = this.generateKeywords();
  }

  private generateDescription(): string {
    let description = this.post.excerpt || this.post.content.substring(0, 150);
    
    // Limpiar HTML si existe
    description = description.replace(/<[^>]*>/g, '');
    
    // Asegurar que termine con punto
    if (!description.endsWith('.')) {
      description += '.';
    }
    
    // Limitar a 160 caracteres
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }
    
    return description;
  }

  private generateKeywords(): string {
    const baseKeywords = [
      'LLC Estados Unidos',
      'emprender en USA',
      'start companies',
      'freelancer USA',
      'negocio digital'
    ];

    const categoryKeywords = this.post.categories.map(cat => cat.name.toLowerCase());
    const tagKeywords = this.post.tags.map(tag => tag.name.toLowerCase());
    
    const allKeywords = [...baseKeywords, ...categoryKeywords, ...tagKeywords];
    
    // Eliminar duplicados y limitar a 10 keywords
    return [...new Set(allKeywords)].slice(0, 10).join(', ');
  }

  getCategoriesText(): string {
    if (!this.post.categories || this.post.categories.length === 0) {
      return 'Sin categorías';
    }
    return this.post.categories.map(c => c.name).join(', ');
  }

  getTagsText(): string {
    if (!this.post.tags || this.post.tags.length === 0) {
      return 'Sin tags';
    }
    return this.post.tags.map(t => t.name).join(', ');
  }
}
