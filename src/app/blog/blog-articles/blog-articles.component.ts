import { Component, inject, OnInit } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-blog-articles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blog-articles.component.html',
  styleUrl: './blog-articles.component.css',
})
export class BlogArticlesComponent implements OnInit {
  blogService = inject(BlogService);
  categories: any[] = [];
  topArticles: any[] = [];
  mainArticles: any[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.setCategories();
    const slug = this.route.snapshot.paramMap.get('slug');

    if (slug) {
      this.blogService
        .getPostsBySlug(slug)
        .then((posts) => {
          // Manejar los posts filtrados por slug aquí
          this.topArticles = posts.slice(0, 2); // Ejemplo: tomar los primeros 2 artículos
          this.mainArticles = posts.slice(0, 4); // Ejemplo: tomar los primeros 4 artículos
        })
        .catch((error) => {
          console.error('Error fetching posts by slug:', error);
        });
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
}
