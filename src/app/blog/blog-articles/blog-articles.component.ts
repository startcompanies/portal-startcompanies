import { Component, inject, OnInit } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { CommonModule } from '@angular/common';

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

  constructor() {}

  ngOnInit(): void {
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
