import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResponsiveImageComponent } from '../../components/responsive-image/responsive-image.component';
import { LangRouterLinkDirective } from '../../directives/lang-router-link.directive';
import { TESTIMONIAL_AVATAR_URLS } from '../../constants/testimonial-avatars';

@Component({
  selector: 'app-blog-post-hero',
  standalone: true,
  imports: [CommonModule, ResponsiveImageComponent, LangRouterLinkDirective],
  templateUrl: './blog-post-hero.component.html',
  styleUrl: './blog-post-hero.component.css',
})
export class BlogPostHeroComponent {
  @Input() postArticle: any;
  @Input() hasSections = false;
  @Input() heroImages: any;
  @Input() firstSectionImage = '';
  @Input() firstSectionContent?: any;
  @Input() formattedDate = '';
  @Input() authorName = '';

  @Output() shareWhatsApp = new EventEmitter<void>();
  @Output() shareLinkedIn = new EventEmitter<void>();
  @Output() shareFacebook = new EventEmitter<void>();
  @Output() shareNative = new EventEmitter<void>();

  avatarUrls = TESTIMONIAL_AVATAR_URLS;
}
