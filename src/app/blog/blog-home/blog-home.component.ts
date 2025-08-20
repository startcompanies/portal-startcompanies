import { Component } from '@angular/core';
import { ScHeaderComponent } from "../../sc-header/sc-header.component";
import { ScFooterComponent } from "../../sc-footer/sc-footer.component";
import { BlogComponent } from "../../sections/blog/blog.component";
import { BlogArticlesComponent } from "../blog-articles/blog-articles.component";
import { BlogQuestionsComponent } from "../blog-questions/blog-questions.component";

@Component({
  selector: 'app-blog-home',
  standalone: true,
  imports: [ScHeaderComponent, ScFooterComponent, BlogComponent, BlogArticlesComponent, BlogQuestionsComponent],
  templateUrl: './blog-home.component.html',
  styleUrl: './blog-home.component.css'
})
export class BlogHomeComponent {

}
