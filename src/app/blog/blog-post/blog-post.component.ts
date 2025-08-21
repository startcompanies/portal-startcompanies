import { Component } from '@angular/core';
import { ScHeaderComponent } from "../../sc-header/sc-header.component";
import { ScFooterComponent } from "../../sc-footer/sc-footer.component";
import { SeoBaseComponent } from "../../shared/components/seo-base/seo-base.component";

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [ScHeaderComponent, ScFooterComponent, SeoBaseComponent],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.css'
})
export class BlogPostComponent {

}
