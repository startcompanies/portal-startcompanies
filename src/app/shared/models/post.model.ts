import { Category } from './category.model';
import { Tag } from './tag.model';

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image_url: string;
  published_at: string; // O Date, si planeas parsearlo
  is_published: boolean;
  user_id: number;
  categories: Category[];
  tags: Tag[];
}
