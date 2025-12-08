import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Post } from '../shared/models/post.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  apiUrl: string = environment.apiUrl;
  postsEndpoint: string = environment.postsEndpoint ?? '/posts/get-from-portal';
  categoriesEndpoint: string = environment.categoriesEndpoint ?? '/categories/with-posts-count';

  constructor(private http: HttpClient) {}

  getCategories(): Promise<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}${this.categoriesEndpoint}`)
      .toPromise()
      .then((res) => res ?? []);
  }

  getAllPosts(): Promise<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}${this.postsEndpoint}`)
      .toPromise()
      .then((res) => res ?? []);
  }

  getPostsBySlug(slug: string): Promise<any> {
    return this.http
      .get<any[]>(`${this.apiUrl}/posts/get-from-portal/${slug}`)
      .toPromise()
      .then((res) => res ?? []);
  }

  // Nuevo método para obtener posts por slug de categoría
  getPostsByCategorySlug(categorySlug: string): Observable<Post[]> {
    return this.http.get<Post[]>(
      `${this.apiUrl}/posts/get-from-portal/category/${categorySlug}`
    );
  }
}
