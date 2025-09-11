import { Component, inject, OnInit } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BlogService } from '../../services/blog.service';
import { SharedModule } from '../../shared/shared/shared.module';
import { Post } from '../../shared/models/post.model';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [TranslocoPipe, SharedModule],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css',
})
export class BlogComponent implements OnInit {
  blogService = inject(BlogService);
  allPosts: Post[] = [];
  desktopCarouselSlides: Post[][] = [];
  mobileCarouselSlides: Post[][] = [];

  constructor() {}

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
}
