import { Component, inject, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BlogService } from '../../services/blog.service';
import { SharedModule } from '../../shared/shared/shared.module';
import { Post } from '../../shared/models/post.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { LangRouterLinkDirective } from '../../shared/directives/lang-router-link.directive';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [TranslocoPipe, SharedModule, LangRouterLinkDirective],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css',
})
export class BlogComponent implements OnInit {
  blogService = inject(BlogService);
  allPosts: Post[] = [];
  desktopCarouselSlides: Post[][] = [];
  mobileCarouselSlides: Post[][] = [];

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.setAllPosts();
  }

  setAllPosts() {
    this.blogService.getAllPosts().then((posts) => {
      this.allPosts = posts;
      this.chunkPostsForCarousels();
    }).catch((error) => {
      console.log('Error al obtener los posts:',error);
    });
  }

  // Función privada para dividir el array de posts en chunks
  private chunkPostsForCarousels(){
    if (this.allPosts && this.allPosts.length > 0) {
      this.desktopCarouselSlides = this.chunkArray(this.allPosts, 3);
      this.mobileCarouselSlides = this.chunkArray(this.allPosts, 1);
    } else {
      this.desktopCarouselSlides = [];
      this.mobileCarouselSlides = [];
    }
  }
  
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Convierte HTML a texto plano para mostrar en excerpt
   * @param htmlString - String HTML a convertir
   * @returns String de texto plano
   */
  stripHtmlTags(htmlString: string): string {
    if (!htmlString) return '';
    
    // Durante SSR, usar regex simple para extraer texto
    if (!isPlatformBrowser(this.platformId)) {
      return htmlString.replace(/<[^>]*>/g, '').substring(0, 120).trim() + '...';
    }
    
    // Crear un elemento temporal para parsear el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    
    // Extraer solo el texto
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Limitar a 120 caracteres y agregar puntos suspensivos si es necesario
    return textContent.length > 120 
      ? textContent.substring(0, 120).trim() + '...' 
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
