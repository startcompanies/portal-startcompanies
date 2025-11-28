import { Component, Inject, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SharedModule } from '../../shared/shared/shared.module';
import { BlogService } from '../../services/blog.service';
import { Post } from '../../shared/models/post.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LangRouterLinkDirective } from '../../shared/directives/lang-router-link.directive';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-blog-section-v2',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, LangRouterLinkDirective],
  templateUrl: './blog-section-v2.component.html',
  styleUrl: './blog-section-v2.component.css'
})
export class BlogSectionV2Component implements OnInit {
  blogService = inject(BlogService);
  allPosts: Post[] = [];
  desktopCarouselSlides: Post[][] = [];
  mobileCarouselSlides: Post[][] = [];

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.setAllPosts();
  }

  setAllPosts() {
    this.blogService.getAllPosts().then((posts) => {
      this.allPosts = posts;
      this.chunkPostsForCarousels();
    }).catch((error) => {
      console.log('Error al obtener los posts:', error);
    });
  }

  chunkPostsForCarousels() {
    if (this.allPosts && this.allPosts.length > 0) {
      this.desktopCarouselSlides = this.chunkArray(this.allPosts, 3);
      this.mobileCarouselSlides = this.chunkArray(this.allPosts, 1);
    } else {
      this.desktopCarouselSlides = [];
      this.mobileCarouselSlides = [];
    }
  }

  chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Obtiene los índices de los indicadores a mostrar, limitando la cantidad
   * @param totalSlides - Total de slides en el carrusel
   * @param maxIndicators - Máximo de indicadores a mostrar (por defecto 7)
   * @returns Array de índices a mostrar
   */
  getVisibleIndicatorIndices(totalSlides: number, maxIndicators: number = 7): number[] {
    if (totalSlides <= maxIndicators) {
      // Si hay menos slides que el máximo, mostrar todos
      return Array.from({ length: totalSlides }, (_, i) => i);
    }

    // Si hay más slides, mostrar primeros y últimos
    // Dividir el máximo entre primeros y últimos
    const firstCount = Math.floor(maxIndicators / 2);
    const lastCount = maxIndicators - firstCount;

    const indices: number[] = [];
    
    // Agregar primeros índices (0, 1, 2...)
    for (let i = 0; i < firstCount; i++) {
      indices.push(i);
    }
    
    // Agregar últimos índices
    for (let i = totalSlides - lastCount; i < totalSlides; i++) {
      if (!indices.includes(i)) {
        indices.push(i);
      }
    }

    return indices.sort((a, b) => a - b);
  }

  /**
   * Verifica si un índice debe mostrarse como indicador
   * @param index - Índice del slide
   * @param totalSlides - Total de slides
   * @returns true si debe mostrarse
   */
  shouldShowIndicator(index: number, totalSlides: number): boolean {
    const visibleIndices = this.getVisibleIndicatorIndices(totalSlides);
    return visibleIndices.includes(index);
  }

  /**
   * Obtiene el máximo de indicadores según el tamaño de pantalla
   * @returns Número máximo de indicadores a mostrar
   */
  getMaxIndicators(): number {
    if (!isPlatformBrowser(this.platformId)) {
      return 5; // Default para SSR
    }
    
    const width = window.innerWidth;
    
    // Pantallas muy pequeñas (móviles pequeños)
    if (width < 480) {
      return 5;
    }
    // Pantallas móviles medianas
    if (width < 768) {
      return 7;
    }
    // Pantallas tablets y desktop
    return 7;
  }

  /**
   * Obtiene los slides visibles para los indicadores (limitados)
   * @param slides - Array de slides
   * @returns Array con objetos que contienen el índice y el slide
   */
  getVisibleIndicatorSlides(slides: Post[][]): Array<{ index: number; slide: Post[] }> {
    const maxIndicators = this.getMaxIndicators();
    const visibleIndices = this.getVisibleIndicatorIndices(slides.length, maxIndicators);
    
    return visibleIndices.map(index => ({
      index,
      slide: slides[index]
    }));
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
