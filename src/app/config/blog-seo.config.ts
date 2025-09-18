export const blogSeoConfig = {
  // Configuración base del blog
  baseUrl: 'https://startcompanies.us',
  siteName: 'Start Companies',
  defaultImage: '/assets/logo-dark.webp',
  
  // Configuración de títulos
  titleTemplate: '{title} - Blog de Start Companies',
  homeTitle: 'Blog de Start Companies - Guías para Emprender en EE.UU.',
  categoryTitleTemplate: '{category} - Blog de Start Companies',
  
  // Configuración de descripciones
  homeDescription: 'Descubre consejos, guías y estrategias para abrir y gestionar tu LLC en Estados Unidos. Ideal para freelancers, startups y negocios digitales.',
  categoryDescriptionTemplate: 'Artículos sobre {category} para emprendedores en Estados Unidos. Guías especializadas para tu LLC.',
  
  // Keywords base
  baseKeywords: [
    'LLC Estados Unidos',
    'emprender en USA',
    'start companies',
    'freelancer USA',
    'negocio digital',
    'apertura cuenta bancaria',
    'startup USA',
    'empresa en Estados Unidos'
  ],
  
  // Configuración de Open Graph
  ogType: 'article',
  ogLocale: 'es_ES',
  ogSiteName: 'Start Companies',
  
  // Configuración de Twitter
  twitterCard: 'summary_large_image',
  twitterSite: '@startcompanies',
  
  // Configuración de Schema.org
  schemaOrg: {
    organization: {
      name: 'Start Companies',
      url: 'https://startcompanies.us',
      logo: 'https://startcompanies.us/assets/logo-dark.webp'
    },
    blog: {
      name: 'Blog de Start Companies',
      description: 'Guías completas para abrir tu LLC, obtener cuenta bancaria y emprender en Estados Unidos',
      url: 'https://startcompanies.us/blog'
    }
  },
  
  // Configuración de sitemap
  sitemap: {
    changefreq: 'monthly',
    priority: 0.8,
    staticPages: [
      { url: '/blog', priority: 0.9, changefreq: 'weekly' },
      { url: '/planes', priority: 0.9, changefreq: 'monthly' },
      { url: '/contacto', priority: 0.8, changefreq: 'monthly' },
      { url: '/nosotros', priority: 0.7, changefreq: 'monthly' },
      { url: '/abre-tu-llc', priority: 0.9, changefreq: 'monthly' },
      { url: '/apertura-banco-relay', priority: 0.9, changefreq: 'monthly' },
      { url: '/agendar', priority: 0.8, changefreq: 'monthly' },
      { url: '/apertura-llc', priority: 0.8, changefreq: 'monthly' },
      { url: '/renovar-llc', priority: 0.8, changefreq: 'monthly' }
    ]
  },
  
  // Configuración de robots.txt
  robots: {
    userAgent: '*',
    allow: ['/'],
    disallow: ['/admin/', '/api/'],
    crawlDelay: 1,
    sitemaps: [
      'https://startcompanies.us/sitemap.xml',
      'https://startcompanies.us/sitemap-blog.xml'
    ]
  }
};

// Funciones helper para generar SEO dinámico
export class BlogSeoHelper {
  /**
   * Genera título SEO para un post
   */
  static generatePostTitle(postTitle: string): string {
    return `${postTitle} - Blog de Start Companies`;
  }
  
  /**
   * Genera título SEO para una categoría
   */
  static generateCategoryTitle(categoryName: string): string {
    return `${categoryName} - Blog de Start Companies`;
  }
  
  /**
   * Genera descripción SEO optimizada
   */
  static generateDescription(content: string, maxLength: number = 160): string {
    // Limpiar HTML
    let description = content.replace(/<[^>]*>/g, '');
    
    // Asegurar que termine con punto
    if (!description.endsWith('.')) {
      description += '.';
    }
    
    // Limitar longitud
    if (description.length > maxLength) {
      description = description.substring(0, maxLength - 3) + '...';
    }
    
    return description;
  }
  
  /**
   * Genera keywords combinando base + categorías + tags
   */
  static generateKeywords(categories: string[], tags: string[]): string {
    const allKeywords = [...blogSeoConfig.baseKeywords, ...categories, ...tags];
    return [...new Set(allKeywords)].slice(0, 10).join(', ');
  }
  
  /**
   * Genera URL canónica
   */
  static generateCanonicalUrl(path: string): string {
    return `${blogSeoConfig.baseUrl}${path}`;
  }
  
  /**
   * Genera URL de imagen optimizada para Open Graph
   */
  static generateOgImageUrl(imageUrl: string): string {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${blogSeoConfig.baseUrl}${imageUrl}`;
  }
}
