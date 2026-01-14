import { Category } from './category.model';
import { Tag } from './tag.model';
import { User } from './user.model';

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image_url: string;
  published_at: string; // O Date, si planeas parsearlo
  is_published: boolean;
  user?: User; // Opcional ya que el API puede devolver posts sin información de usuario
  categories: Category[];
  tags: Tag[];
}
