import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Post } from '../models/post.model';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  apiUrl: string = environment.apiUrl;
  postsEndpoint: string = environment.postsEndpoint ?? '/blog/posts/get-from-portal';
  categoriesEndpoint: string =
    environment.categoriesEndpoint ?? '/blog/categories/with-posts-count';
  sandboxPostsEndpoint: string =
    environment.sandboxPostsEndpoint ?? '/blog/posts/get-sandbox-posts/category';

  private readonly isSandboxMode: boolean =
    // Staging explícito
    Boolean((environment as any).staging) ||
    // O inferido por el endpoint configurado
    (this.postsEndpoint?.includes('get-sandbox-posts') ?? false) ||
    (this.categoriesEndpoint?.includes('sandbox') ?? false);

  constructor(private http: HttpClient) {}

  /** Evita doble GET cuando varios componentes (p. ej. blog + blog-articles) piden la lista al mismo tiempo. */
  private getAllPostsInFlight: Promise<any[]> | null = null;

  private joinUrl(base: string, path: string): string {
    const normalizedBase = (base || '').replace(/\/+$/, '');
    const normalizedPath = (path || '').startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }

  getCategories(): Promise<any[]> {
    return firstValueFrom(
      this.http
        .get<any[]>(this.joinUrl(this.apiUrl, this.categoriesEndpoint))
        .pipe(
          map((res) => res ?? []),
          catchError(() => of([]))
        )
    );
  }

  getAllPosts(): Promise<any[]> {
    if (this.getAllPostsInFlight) {
      return this.getAllPostsInFlight;
    }
    this.getAllPostsInFlight = firstValueFrom(
      this.http
        .get<any[]>(this.joinUrl(this.apiUrl, this.postsEndpoint))
        .pipe(
          map((res) => res ?? []),
          catchError(() => of([])),
        ),
    ).finally(() => {
      this.getAllPostsInFlight = null;
    });
    return this.getAllPostsInFlight;
  }

  getPostsBySlug(slug: string): Promise<any> {
    // Nota: en el backend existe get-from-portal/:slug. No hay get-sandbox-posts/:slug.
    // En staging, si el post no está publicado, este endpoint devolverá vacío/404.
    return firstValueFrom(
      this.http
        .get<any[]>(
          this.joinUrl(this.apiUrl, `/blog/posts/get-from-portal/${slug}`)
        )
        .pipe(
          map((res) => res ?? []),
          catchError(() => of([]))
        )
    );
  }

  // Nuevo método para obtener posts por slug de categoría
  getPostsByCategorySlug(categorySlug: string): Observable<Post[]> {
    const sandboxUrl = this.joinUrl(
      this.apiUrl,
      `${this.sandboxPostsEndpoint}/${categorySlug}`
    );
    const publishedUrl = this.joinUrl(
      this.apiUrl,
      `/blog/posts/get-from-portal/category/${categorySlug}`
    );

    return this.http.get<Post[]>(this.isSandboxMode ? sandboxUrl : publishedUrl);
  }
}
