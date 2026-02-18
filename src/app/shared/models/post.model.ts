import { Category } from './category.model';
import { Tag } from './tag.model';
import { User } from './user.model';

export interface Post {
  id: number;
  title: string;
  /** Título para SEO / meta title y vista previa al compartir (og:title, twitter:title) */
  seo_title?: string | null;
  slug: string;
  content: string;
  excerpt: string;
  /** Meta description y vista previa al compartir (og:description, twitter:description) */
  description?: string | null;
  image_url: string;
  published_at: string; // O Date, si planeas parsearlo
  is_published: boolean;
  user?: User; // Opcional ya que el API puede devolver posts sin información de usuario
  categories: Category[];
  tags: Tag[];
}
