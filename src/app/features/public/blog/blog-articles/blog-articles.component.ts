import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { BlogService } from '../../../../shared/services/blog.service';
import { BlogSeoService } from '../../../../shared/services/blog-seo.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangRouterLinkDirective } from '../../../../shared/directives/lang-router-link.directive';
import { Subscription, combineLatest } from 'rxjs';
import { BrowserService } from '../../../../shared/services/browser.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-blog-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe, LangRouterLinkDirective],
  templateUrl: './blog-articles.component.html',
  styleUrl: './blog-articles.component.css',
})
export class BlogArticlesComponent implements OnInit, OnDestroy {
  blogService = inject(BlogService);
  blogSeoService = inject(BlogSeoService);
  categories: any[] = [];
  derivedCategories: any[] = [];
  topArticles: any[] = [];
  mainArticles: any[] = [];
  allPosts: any[] = [];
  filteredPosts: any[] = [];
  searchQuery = '';
  currentPage = 1;
  pageSize = 6;
  totalPages = 1;
  currentCategoryName?: string;
  currentSlug: string | null = null;
  private lastSlug: string | null = null;
  private hasLoaded = false;
  isLoading = false;
  private routeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private browser: BrowserService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.setCategories();

    // Suscribirse a cambios de ruta y query params (page)
    this.routeSubscription = combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
    ]).subscribe(([params, queryParams]) => {
      const slug = params.get('slug');
      const pageParam = Number(queryParams.get('page')) || 1;
      this.currentPage = pageParam > 0 ? pageParam : 1;
      this.currentSlug = slug;

      if (!this.hasLoaded || this.lastSlug !== slug) {
        this.lastSlug = slug;
        this.hasLoaded = true;
        this.loadPosts(slug);
      } else {
        this.applyFiltersAndPagination();
      }

      if (this.browser.isBrowser) {
        setTimeout(() => this.scrollToArticles(), 0);
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar la suscripción para evitar memory leaks
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  private loadPosts(slug: string | null): void {
    this.isLoading = true;
    if (slug) {
      this.blogService.getPostsByCategorySlug(slug).subscribe(
        (posts) => {
          console.log('[BlogArticles] posts by category slug:', posts);
          this.setPosts(posts);
          this.currentCategoryName = this.getCategoryNameFromPosts(posts, slug);
          this.isLoading = false;

          // Configurar SEO para la categoría
          if (
            posts.length > 0 &&
            posts[0].categories &&
            posts[0].categories.length > 0
          ) {
            const category = posts[0].categories[0];
            this.blogSeoService.setCategorySeo(
              category.name,
              category.slug,
              posts.length,
            );
          }
        },
        (error) => {
          console.error('Error fetching posts by slug:', error);
          this.isLoading = false;
        },
      );
    } else {
      this.blogService
        .getAllPosts()
        .then((posts) => {
          console.log('[BlogArticles] all posts:', posts);
          this.setPosts(posts);
          this.currentCategoryName = undefined;
          this.isLoading = false;
        })
        .catch((error) => {
          console.error('Error fetching all posts:', error);
          this.isLoading = false;
        });
    }
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.currentPage = 1;
    this.syncPageToUrl(1);
    this.applyFiltersAndPagination();
  }

  clearSearch(): void {
    if (!this.searchQuery) return;
    this.searchQuery = '';
    this.currentPage = 1;
    this.syncPageToUrl(1);
    this.applyFiltersAndPagination();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.syncPageToUrl(page);
    this.applyFiltersAndPagination();
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getPaginationCommands(): any[] {
    return this.currentSlug
      ? ['/blog', 'category', this.currentSlug]
      : ['/blog'];
  }

  getPageQueryParams(page: number): { [k: string]: any } {
    return page > 1 ? { page } : {};
  }

  private setPosts(posts: any[]): void {
    this.allPosts = posts ?? [];
    this.derivedCategories = this.buildCategoriesFromPosts(this.allPosts);
    if (this.categories.length === 0 && this.derivedCategories.length > 0) {
      this.categories = this.derivedCategories;
    }
    this.applyFiltersAndPagination();
  }

  private syncPageToUrl(page: number): void {
    const queryParams = this.getPageQueryParams(page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });
  }

  private scrollToArticles(): void {
    const doc = this.browser.document;
    if (!doc) return;
    const target = doc.getElementById('blogArticles');
    if (target) {
      const offset = 110;
      const rect = target.getBoundingClientRect();
      const win = this.browser.window;
      if (!win) return;
      const top = rect.top + win.scrollY - offset;
      win.scrollTo({ top, behavior: 'smooth' });
    }
  }

  private applyFiltersAndPagination(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredPosts = query
      ? this.allPosts.filter((post) => this.matchesSearch(post, query))
      : [...this.allPosts];

    this.topArticles = this.filteredPosts.slice(0, 2);
    const remainingPosts = this.filteredPosts.slice(2);

    this.totalPages = Math.max(1, Math.ceil(remainingPosts.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    this.mainArticles = remainingPosts.slice(start, start + this.pageSize);
  }

  private getCategoryNameFromPosts(posts: any[], slug: string): string {
    const first = Array.isArray(posts) && posts.length > 0 ? posts[0] : null;
    const firstCategory = first?.categories && first.categories.length > 0 ? first.categories[0] : null;
    return firstCategory?.name || slug;
  }

  private matchesSearch(post: any, query: string): boolean {
    const title = (post?.title || '').toLowerCase();
    const excerpt = (post?.excerpt || '').toLowerCase();
    const categories = Array.isArray(post?.categories)
      ? post.categories.map((cat: any) => (cat?.name || '').toLowerCase()).join(' ')
      : '';
    const tags = Array.isArray(post?.tags)
      ? post.tags.map((tag: any) => (tag?.name || '').toLowerCase()).join(' ')
      : '';

    return (
      title.includes(query) ||
      excerpt.includes(query) ||
      categories.includes(query) ||
      tags.includes(query)
    );
  }

  setCategories() {
    this.blogService
      .getCategories()
      .then((categories) => {
        console.log('[BlogArticles] categories:', categories);
        this.categories = this.normalizeCategories(categories);
        if (this.categories.length === 0 && this.derivedCategories.length > 0) {
          this.categories = this.derivedCategories;
        }
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
      });
  }

  private normalizeCategories(raw: any[]): any[] {
    const list = Array.isArray(raw) ? raw : [];
    if (list.length === 0) return [];

    // Si vienen posts en lugar de categorías, derivar categorías con conteo
    const looksLikePost = list.some((item) => item?.title && Array.isArray(item?.categories));
    if (looksLikePost) {
      const map = new Map<string, { name: string; slug: string; count: number }>();
      list.forEach((post) => {
        const postCategories = Array.isArray(post?.categories) ? post.categories : [];
        postCategories.forEach((cat: any) => {
          if (!cat?.slug) return;
          const existing = map.get(cat.slug);
          if (existing) {
            existing.count += 1;
          } else {
            map.set(cat.slug, {
              name: cat.name || cat.slug,
              slug: cat.slug,
              count: 1,
            });
          }
        });
      });
      return Array.from(map.values()).sort((a, b) => b.count - a.count);
    }

    return list;
  }

  private buildCategoriesFromPosts(posts: any[]): any[] {
    const map = new Map<string, { name: string; slug: string; count: number }>();
    (Array.isArray(posts) ? posts : []).forEach((post) => {
      const postCategories = Array.isArray(post?.categories) ? post.categories : [];
      postCategories.forEach((cat: any) => {
        if (!cat?.slug) return;
        const existing = map.get(cat.slug);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(cat.slug, {
            name: cat.name || cat.slug,
            slug: cat.slug,
            count: 1,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }

  /**
   * Convierte HTML a texto plano para mostrar en excerpt
   * @param htmlString - String HTML a convertir
   * @returns String de texto plano
   */
  stripHtmlTags(htmlString: string): string {
    if (!htmlString) return '';

    // Durante SSR, usar regex simple para extraer texto
    const doc = this.browser.document;
    if (!doc) {
      return (
        htmlString
          .replace(/<[^>]*>/g, '')
          .substring(0, 150)
          .trim() + '...'
      );
    }

    // Crear un elemento temporal para parsear el HTML
    const tempDiv = doc.createElement('div');
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
