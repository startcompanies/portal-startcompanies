import { ChangeDetectorRef, Component, inject, input, OnInit } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { BlogService } from '../../../../shared/services/blog.service';
import { BlogSeoService } from '../../../../shared/services/blog-seo.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangRouterLinkDirective } from '../../../../shared/directives/lang-router-link.directive';
import { EMPTY, combineLatest, from, of } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  finalize,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { BrowserService } from '../../../../shared/services/browser.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-blog-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe, LangRouterLinkDirective],
  templateUrl: './blog-articles.component.html',
  styleUrl: './blog-articles.component.css',
})
export class BlogArticlesComponent implements OnInit {
  /**
   * Lo debe inyectar el padre enrutado (`BlogHomeComponent`). Si se lee solo `ActivatedRoute`
   * desde un hijo embebido en plantilla, el `slug` de `category/:slug` a veces no llega.
   */
  readonly categorySlug = input<string | null>(null);

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
  /**
   * Slug para el que `allPosts` ya refleja la respuesta del API (incl. lista vacía).
   * Si coincide con la ruta actual, solo se aplica paginación/búsqueda sin nuevo GET.
   */
  private postsSourceKey: string | null | undefined = undefined;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private browser: BrowserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    // Pre-poblar sincrónicamente si la caché ya está caliente:
    // evita el ciclo vacío → async → posts que causa el parpadeo al navegar entre categorías.
    const initSlug = this.route.snapshot.paramMap.get('slug');
    const syncPosts = initSlug
      ? this.blogService.getPostsByCategorySlugSync(initSlug)
      : this.blogService.getAllPostsSync();
    if (syncPosts !== null) {
      this.postsSourceKey = initSlug;
      this.currentSlug = initSlug;
      this.setPosts(syncPosts);
      // markForCheck notifica a BlogHomeComponent (OnPush) que revise la vista
      this.cdr.markForCheck();
    }

    combineLatest([
      toObservable(this.categorySlug).pipe(distinctUntilChanged()),
      this.route.queryParamMap.pipe(
        map((q) => Number(q.get('page')) || 1),
        distinctUntilChanged(),
      ),
    ])
      .pipe(
        switchMap(([slug, page]) => {
          this.currentPage = page > 0 ? page : 1;
          this.currentSlug = slug;

          if (this.postsSourceKey === slug) {
            this.applyFiltersAndPagination();
            this.cdr.markForCheck();
            return EMPTY;
          }

          this.isLoading = true;
          // No vaciar el DOM aún: los posts anteriores se mantienen visibles
          // mientras llega la respuesta, evitando el flash de "Cargando artículos…"

          const req$ = slug
            ? this.blogService.getPostsByCategorySlug(slug)
            : from(this.blogService.getAllPosts());

          return req$.pipe(
            tap((posts) => {
              const arr = Array.isArray(posts) ? posts : [];
              this.clearArticleLists();
              this.setPosts(arr);
              this.postsSourceKey = slug;
              this.currentCategoryName = slug
                ? this.getCategoryNameFromPosts(arr, slug)
                : undefined;
              if (
                slug &&
                arr.length > 0 &&
                arr[0].categories?.length > 0
              ) {
                const c = arr[0].categories[0];
                this.blogSeoService.setCategorySeo(
                  c.name,
                  c.slug,
                  arr.length,
                );
              }
              // Notifica a BlogHomeComponent (OnPush) que los datos cambiaron
              this.cdr.markForCheck();
              if (this.browser.isBrowser) {
                setTimeout(() => this.scrollToArticles(), 0);
              }
            }),
            catchError((err) => {
              console.error('[BlogArticles] Error al cargar posts:', err);
              this.setPosts([]);
              this.postsSourceKey = slug;
              this.cdr.markForCheck();
              return of([]);
            }),
            finalize(() => {
              this.isLoading = false;
              this.cdr.markForCheck();
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.setCategories();
  }

  private clearArticleLists(): void {
    this.allPosts = [];
    this.filteredPosts = [];
    this.topArticles = [];
    this.mainArticles = [];
    this.totalPages = 1;
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
        this.categories = this.normalizeCategories(categories);
        if (this.categories.length === 0 && this.derivedCategories.length > 0) {
          this.categories = this.derivedCategories;
        }
        this.cdr.markForCheck();
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
