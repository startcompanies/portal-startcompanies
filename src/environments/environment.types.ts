/**
 * Audiencia del blog en `GET /blog/posts/public` y `GET /blog/categories/public` (query `audience`).
 * Cada `environment*.ts` usa un literal (`'published'` o `'preview'`) con `satisfies BlogPublicAudience`.
 */
export type BlogPublicAudience = 'published' | 'preview';

/**
 * Convierte el valor de `environment.blogPublicAudience` al union tipado.
 * (Sin esto, en algunos builds el objeto `environment` infiere `string` y falla TS2322 en el servicio.)
 */
export function resolveBlogPublicAudience(value: unknown): BlogPublicAudience {
  return value === 'preview' ? 'preview' : 'published';
}
