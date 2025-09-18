import { Component, inject, OnInit } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { BlogSeoService } from '../../services/blog-seo.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-blog-articles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blog-articles.component.html',
  styleUrl: './blog-articles.component.css',
})
export class BlogArticlesComponent implements OnInit {
  blogService = inject(BlogService);
  blogSeoService = inject(BlogSeoService);
  categories: any[] = [];
  topArticles: any[] = [];
  mainArticles: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.setCategories();
    const slug = this.route.snapshot.paramMap.get('slug');

    if (slug) {
      this.blogService.getPostsByCategorySlug(slug).subscribe(
        (posts) => {
          // Manejar los posts filtrados por slug aquí
          this.topArticles = posts.slice(0, 2); // Ejemplo: tomar los primeros 2 artículos
          this.mainArticles = posts.slice(0, 4); // Ejemplo: tomar los primeros 4 artículos
          
          // Configurar SEO para la categoría
          if (posts.length > 0 && posts[0].categories && posts[0].categories.length > 0) {
            const category = posts[0].categories[0];
            this.blogSeoService.setCategorySeo(category.name, category.slug, posts.length);
          }
        },
        (error) => {
          console.error('Error fetching posts by slug:', error);
        }
      );
    } else {
      this.blogService
        .getAllPosts()
        .then((posts) => {
          // Manejar todos los posts aquí
          this.topArticles = posts.slice(0, 2); // Ejemplo: tomar los primeros 3 artículos
          this.mainArticles = posts.slice(0, 4); // Ejemplo: tomar los primeros 4 artículos
        })
        .catch((error) => {
          console.error('Error fetching all posts:', error);
        });
    }
  }

  setCategories() {
    this.blogService
      .getCategories()
      .then((categories) => {
        this.categories = categories;
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
      });
  }

  /**
   * Convierte HTML a texto plano para mostrar en excerpt
   * @param htmlString - String HTML a convertir
   * @returns String de texto plano
   */
  stripHtmlTags(htmlString: string): string {
    if (!htmlString) return '';
    
    // Crear un elemento temporal para parsear el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    
    // Extraer solo el texto
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Limitar a 150 caracteres y agregar puntos suspensivos si es necesario
    return textContent.length > 150 
      ? textContent.substring(0, 150).trim() + '...' 
      : textContent.trim();
  }

  /**
   * Sanitiza HTML para renderizado seguro
   * @param htmlString - String HTML a sanitizar
   * @returns SafeHtml para usar con innerHTML
   */
  sanitizeHtml(htmlString: string): SafeHtml {
    if (!htmlString) return this.sanitizer.bypassSecurityTrustHtml('');
    return this.sanitizer.bypassSecurityTrustHtml(htmlString);
  }
}
