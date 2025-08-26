import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCategories(): Promise<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/categories/get-from-portal`)
      .toPromise()
      .then((res) => res ?? []);
  }

  getAllPosts(): Promise<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/posts/get-from-portal`)
      .toPromise()
      .then((res) => res ?? []);
  }

  getPostsBySlug(slug: string): Promise<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/posts/get-from-portal/${slug}`)
      .toPromise()
      .then((res) => res ?? []);
  }
}
