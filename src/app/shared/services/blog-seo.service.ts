import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { Post } from '../models/post.model';
import { SeoData } from './seo.service';

@Injectable({
  providedIn: 'root'
})
export class BlogSeoService {

  private readonly baseUrl = 'https://startcompanies.us';
  private readonly siteName = 'Start Companies';
  private readonly defaultImage = '/assets/logo-dark.webp';

  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  /**
   * Configura SEO completo para un post individual del blog
   */
  setPostSeo(post: Post): void {
    const seoData = this.generatePostSeoData(post);
    this.updateSeoData(seoData);
    this.addStructuredData(post);
  }

  /**
   * Configura SEO para la página principal del blog
   */
  setBlogHomeSeo(): void {
    const seoData: SeoData = {
      title: 'Blog de Start Companies - Guías para Emprender en EE.UU.',
      description: 'Descubre consejos, guías y estrategias para abrir y gestionar tu LLC en Estados Unidos. Ideal para freelancers, startups y negocios digitales.',
      keywords: 'blog start companies, LLC Estados Unidos, emprender en USA, apertura cuenta bancaria, freelancer USA, startup USA, negocio digital',
      ogTitle: 'Blog de Start Companies - Tu Ruta para Emprender en EE.UU.',
      ogDescription: 'Guías completas para abrir tu LLC, obtener cuenta bancaria y emprender en Estados Unidos. Consejos de expertos para freelancers y startups.',
      ogImage: `${this.baseUrl}/assets/blog/blog-hero.webp`,
      ogUrl: `${this.baseUrl}/blog`,
      canonical: `${this.baseUrl}/blog`,
      twitterCard: 'summary_large_image',
      twitterTitle: 'Blog de Start Companies - Guías para Emprender en EE.UU.',
      twitterDescription: 'Descubre consejos, guías y estrategias para abrir y gestionar tu LLC en Estados Unidos.',
      twitterImage: `${this.baseUrl}/assets/blog/blog-hero.webp`,
      twitterSite: '@startcompanies'
    };

    this.updateSeoData(seoData);
    this.addBlogStructuredData();
  }

  /**
   * Configura SEO para una categoría del blog
   */
  setCategorySeo(categoryName: string, categorySlug: string, postsCount: number): void {
    const seoData: SeoData = {
      title: `${categoryName} - Blog de Start Companies`,
      description: `Artículos sobre ${categoryName.toLowerCase()} para emprendedores en Estados Unidos. ${postsCount} guías especializadas para tu LLC.`,
      keywords: `${categoryName.toLowerCase()}, LLC Estados Unidos, emprender USA, ${categoryName.toLowerCase()} freelancer`,
      ogTitle: `${categoryName} - Blog de Start Companies`,
      ogDescription: `Descubre ${postsCount} artículos especializados sobre ${categoryName.toLowerCase()} para emprendedores en Estados Unidos.`,
      ogImage: `${this.baseUrl}/assets/blog/categories/${categorySlug}.webp`,
      ogUrl: `${this.baseUrl}/blog/${categorySlug}`,
      canonical: `${this.baseUrl}/blog/${categorySlug}`,
      twitterCard: 'summary_large_image',
      twitterTitle: `${categoryName} - Blog de Start Companies`,
      twitterDescription: `Artículos sobre ${categoryName.toLowerCase()} para emprendedores en Estados Unidos.`,
      twitterImage: `${this.baseUrl}/assets/blog/categories/${categorySlug}.webp`,
      twitterSite: '@startcompanies'
    };

    this.updateSeoData(seoData);
  }

  /**
   * Genera los datos SEO para un post específico
   */
  private generatePostSeoData(post: Post): SeoData {
    const postUrl = `${this.baseUrl}/post/${post.slug}`;
    const postImage = post.image_url || `${this.baseUrl}/assets/blog/default-post.webp`;
    
    // Generar keywords basadas en categorías y tags
    const keywords = this.generateKeywords(post);
    
    // Generar descripción optimizada
    const description = this.generateDescription(post);

    return {
      title: `${post.title} - Blog de Start Companies`,
      description: description,
      keywords: keywords,
      ogTitle: post.title,
      ogDescription: description,
      ogImage: postImage,
      ogUrl: postUrl,
      canonical: postUrl,
      twitterCard: 'summary_large_image',
      twitterTitle: post.title,
      twitterDescription: description,
      twitterImage: postImage,
      twitterSite: '@startcompanies'
    };
  }

  /**
   * Genera keywords optimizadas para SEO
   */
  private generateKeywords(post: Post): string {
    const baseKeywords = [
      'LLC Estados Unidos',
      'emprender en USA',
      'start companies',
      'freelancer USA',
      'negocio digital'
    ];

    const categoryKeywords = post.categories.map(cat => cat.name.toLowerCase());
    const tagKeywords = post.tags.map(tag => tag.name.toLowerCase());
    
    const allKeywords = [...baseKeywords, ...categoryKeywords, ...tagKeywords];
    
    // Eliminar duplicados y limitar a 10 keywords
    return [...new Set(allKeywords)].slice(0, 10).join(', ');
  }

  /**
   * Genera descripción optimizada para SEO (150-160 caracteres)
   */
  private generateDescription(post: Post): string {
    let description = post.excerpt || post.content.substring(0, 150);
    
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

  /**
   * Aplica los meta tags de SEO
   */
  private updateSeoData(data: SeoData): void {
    // Title principal
    this.title.setTitle(data.title);

    // Meta tags básicos
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({ name: 'keywords', content: data.keywords });

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: data.ogTitle || data.title });
    this.meta.updateTag({ property: 'og:description', content: data.ogDescription || data.description });
    this.meta.updateTag({ property: 'og:image', content: data.ogImage || this.defaultImage });
    this.meta.updateTag({ property: 'og:url', content: data.ogUrl || this.baseUrl });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:locale', content: 'es_ES' });
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });

    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: data.twitterCard || 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.twitterTitle || data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.twitterDescription || data.description });
    this.meta.updateTag({ name: 'twitter:image', content: data.twitterImage || this.defaultImage });
    this.meta.updateTag({ name: 'twitter:site', content: data.twitterSite || '@startcompanies' });

    // Canonical URL
    if (data.canonical) {
      this.meta.updateTag({ rel: 'canonical', href: data.canonical });
    }

    // Meta tags adicionales para artículos
    if (data.ogType === 'article') {
      this.meta.updateTag({ property: 'article:author', content: 'Start Companies' });
      this.meta.updateTag({ property: 'article:publisher', content: this.baseUrl });
    }
  }

  /**
   * Añade datos estructurados Schema.org para artículos
   */
  private addStructuredData(post: Post): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": this.generateDescription(post),
      "image": post.image_url || `${this.baseUrl}/assets/blog/default-post.webp`,
      "author": {
        "@type": "Organization",
        "name": "Start Companies",
        "url": this.baseUrl
      },
      "publisher": {
        "@type": "Organization",
        "name": "Start Companies",
        "logo": {
          "@type": "ImageObject",
          "url": `${this.baseUrl}/assets/logo-dark.webp`
        }
      },
      "datePublished": post.published_at,
      "dateModified": post.published_at,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${this.baseUrl}/post/${post.slug}`
      },
      "articleSection": post.categories.map(cat => cat.name).join(', '),
      "keywords": this.generateKeywords(post),
      "url": `${this.baseUrl}/post/${post.slug}`
    };

    this.addJsonLdScript(structuredData);
  }

  /**
   * Añade datos estructurados para la página principal del blog
   */
  private addBlogStructuredData(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Blog de Start Companies",
      "description": "Guías completas para abrir tu LLC, obtener cuenta bancaria y emprender en Estados Unidos",
      "url": `${this.baseUrl}/blog`,
      "publisher": {
        "@type": "Organization",
        "name": "Start Companies",
        "url": this.baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${this.baseUrl}/assets/logo-dark.webp`
        }
      },
      "inLanguage": "es-ES",
      "about": {
        "@type": "Thing",
        "name": "Emprender en Estados Unidos",
        "description": "Guías para freelancers y startups que quieren establecer su negocio en EE.UU."
      }
    };

    this.addJsonLdScript(structuredData);
  }

  /**
   * Añade script JSON-LD al head del documento
   */
  private addJsonLdScript(data: any): void {
    // Remover script anterior si existe
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Crear nuevo script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Genera URL canónica para un post
   */
  generateCanonicalUrl(slug: string): string {
    return `${this.baseUrl}/post/${slug}`;
  }

  /**
   * Genera URL de imagen optimizada para Open Graph
   */
  generateOgImageUrl(imageUrl: string): string {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${this.baseUrl}${imageUrl}`;
  }
}
