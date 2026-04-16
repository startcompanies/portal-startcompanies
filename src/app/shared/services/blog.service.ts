import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  type BlogPublicAudience,
  resolveBlogPublicAudience,
} from '../../../environments/environment.types';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Post } from '../models/post.model';
import { Observable, from, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

/**
 * Solo **portal**: listados y detalle vía `GET /blog/posts/public` y `GET /blog/categories/public`
 * con query `audience=published|preview` (configurado por entorno).
 * El panel usa `GET /blog/posts` con JWT.
 */
@Injectable({
  providedIn: 'root',
})
export class BlogService {
  apiUrl: string = environment.apiUrl;

  private readonly blogPublicAudience: BlogPublicAudience =
    resolveBlogPublicAudience(environment.blogPublicAudience);

  /** Contrato fijo del API; no depende del environment. */
  private readonly postsPublicPath = '/blog/posts/public';
  private readonly categoriesPublicPath = '/blog/categories/public';

  constructor(private http: HttpClient) {}

  /** true cuando el portal pide datos de revisión (sandbox), alineado con el API `audience=preview`. */
  get isPreviewAudience(): boolean {
    return this.blogPublicAudience === 'preview';
  }

  /** Cache permanente del listado completo para la sesión. Una vez cargado, no vuelve a pedir al API. */
  private allPostsSessionCache: any[] | null = null;
  /** Evita peticiones concurrentes mientras la primera está en vuelo. */
  private getAllPostsInFlight: Promise<any[]> | null = null;

  /** Cache permanente de categorías para la sesión. */
  private categoriesSessionCache: any[] | null = null;
  /** Evita múltiples GET de categorías en la misma carga (p. ej. navegación + hijos). */
  private getCategoriesInFlight: Promise<any[]> | null = null;

  /** Lista por categoría (misma sesión); clave incluye audience para no mezclar preview/publicado. */
  private readonly postsByCategoryCache = new Map<string, Post[]>();

  private joinUrl(base: string, path: string): string {
    const normalizedBase = (base || '').replace(/\/+$/, '');
    const normalizedPath = (path || '').startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }

  private audienceParams(extra?: Record<string, string | undefined>): HttpParams {
    let p = new HttpParams().set('audience', this.blogPublicAudience);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (v != null && v !== '') {
          p = p.set(k, v);
        }
      }
    }
    return p;
  }

  getCategories(): Promise<any[]> {
    if (this.categoriesSessionCache !== null) {
      return Promise.resolve(this.categoriesSessionCache.slice());
    }
    if (this.getCategoriesInFlight) {
      return this.getCategoriesInFlight;
    }
    const url = this.joinUrl(this.apiUrl, this.categoriesPublicPath);
    this.getCategoriesInFlight = firstValueFrom(
      this.http
        .get<any[]>(url, { params: this.audienceParams() })
        .pipe(
          map((res) => res ?? []),
          tap((cats) => { this.categoriesSessionCache = cats; }),
          catchError((err) => {
            console.warn(
              '[BlogService] getCategories falló; se usa lista vacía hasta tener datos.',
              err,
            );
            return of([]);
          }),
        ),
    ).finally(() => {
      this.getCategoriesInFlight = null;
    });
    return this.getCategoriesInFlight;
  }

  getAllPosts(): Promise<any[]> {
    if (this.allPostsSessionCache !== null) {
      return Promise.resolve(this.allPostsSessionCache.slice());
    }
    if (this.getAllPostsInFlight) {
      return this.getAllPostsInFlight;
    }
    const url = this.joinUrl(this.apiUrl, this.postsPublicPath);
    this.getAllPostsInFlight = firstValueFrom(
      this.http
        .get<any[]>(url, { params: this.audienceParams() })
        .pipe(
          map((res) => res ?? []),
          tap((posts) => { this.allPostsSessionCache = posts; }),
          catchError(() => of([])),
        ),
    ).finally(() => {
      this.getAllPostsInFlight = null;
    });
    return this.getAllPostsInFlight;
  }

  getPostsBySlug(slug: string): Promise<any> {
    const base = this.joinUrl(this.apiUrl, this.postsPublicPath);
    const url = `${base}/${encodeURIComponent(slug)}`;
    return firstValueFrom(
      this.http
        .get<any>(url, { params: this.audienceParams() })
        .pipe(
          map((res) => res ?? null),
          catchError(() => of(null)),
        ),
    );
  }

  /** Acceso síncrono al listado completo si ya está en caché; null si no. */
  getAllPostsSync(): any[] | null {
    return this.allPostsSessionCache !== null
      ? this.allPostsSessionCache.slice()
      : null;
  }

  /**
   * Acceso síncrono a posts por categoría si el listado completo ya está en caché; null si no.
   * No espera microtask → sin parpadeo al navegar.
   */
  getPostsByCategorySlugSync(categorySlug: string): Post[] | null {
    const slug = (categorySlug || '').trim().toLowerCase();
    if (!slug) return null;
    const cacheKey = `${this.blogPublicAudience}::${slug}`;
    if (this.postsByCategoryCache.has(cacheKey)) {
      return this.postsByCategoryCache.get(cacheKey)!.slice();
    }
    if (this.allPostsSessionCache !== null) {
      const filtered = this.filterPostsByCategorySlug(this.allPostsSessionCache, slug);
      this.postsByCategoryCache.set(cacheKey, filtered);
      return filtered.slice();
    }
    return null;
  }

  clearCategoryPostsCache(): void {
    this.postsByCategoryCache.clear();
  }

  /**
   * Misma información que el listado completo del portal: filtra en cliente tras `getAllPosts()`
   * (un solo HTTP compartido con carruseles y `/blog`), en lugar de un segundo GET con `category=`.
   */
  getPostsByCategorySlug(categorySlug: string): Observable<Post[]> {
    const slug = (categorySlug || '').trim();
    const cacheKey = `${this.blogPublicAudience}::${slug}`;
    const cached = this.postsByCategoryCache.get(cacheKey);
    if (cached) {
      return of(cached.slice());
    }
    const slugLower = slug.toLowerCase();
    return from(this.getAllPosts()).pipe(
      map((all) => this.filterPostsByCategorySlug(all, slugLower)),
      tap((posts) => this.postsByCategoryCache.set(cacheKey, posts)),
      catchError(() => of([])),
    );
  }

  private filterPostsByCategorySlug(posts: any[], categorySlugLower: string): Post[] {
    if (!categorySlugLower) {
      return [];
    }
    const list = Array.isArray(posts) ? posts : [];
    return list.filter(
      (post) =>
        Array.isArray(post?.categories) &&
        post.categories.some(
          (c: { slug?: string }) =>
            (c?.slug || '').toLowerCase() === categorySlugLower,
        ),
    ) as Post[];
  }
}
