import { Injectable } from '@angular/core';
import { BrowserService } from '../../../../shared/services/browser.service';

/**
 * Servicio especializado para parseo y limpieza de HTML de posts del blog.
 * Extraído del God Component blog-post-v2.component.ts para mejorar mantenibilidad.
 */
@Injectable({ providedIn: 'root' })
export class HtmlParserService {
  constructor(private browser: BrowserService) {}

  processBootstrapColumns(html: string): string {
    const doc = this.browser.document;
    if (!html || !doc) return html;

    try {
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = html;

      const rows = tempDiv.querySelectorAll('div.row');

      rows.forEach((row) => {
        const columns = row.querySelectorAll('div[class*="col-"]');

        columns.forEach((col: Element) => {
          const colElement = col as HTMLElement;
          const classList = colElement.className;
          const content = colElement.textContent?.trim() || '';
          const innerHTML = colElement.innerHTML.trim();

          if (
            (content === '' ||
              content === '&nbsp;' ||
              content === '\u00A0' ||
              innerHTML === '&nbsp;' ||
              innerHTML === '') &&
            (classList.includes('d-none') || classList.includes('col-lg-2'))
          ) {
            colElement.remove();
          } else {
            let newClasses = classList
              .split(/\s+/)
              .filter((cls) => !cls.startsWith('col-'))
              .join(' ')
              .trim();

            newClasses = newClasses ? `col-lg-12 ${newClasses}` : 'col-lg-12';
            colElement.className = newClasses;
          }
        });
      });

      return tempDiv.innerHTML;
    } catch (error) {
      console.warn('Error procesando columnas Bootstrap:', error);
      return this.removeDivByDataId(html, 'c76af68');
    }
  }

  cleanMissionDescriptionHtml(html: string): string {
    const doc = this.browser.document;
    if (!html || !doc) return html;

    try {
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = html;

      tempDiv
        .querySelectorAll(
          '[data-widget_type="template.default"], [data-widget_type="share-buttons.default"], .elementor-share-buttons'
        )
        .forEach((el) => el.remove());

      this.removeEmptyNodes(tempDiv);

      return tempDiv.innerHTML.trim();
    } catch (error) {
      console.warn('Error limpiando HTML de mission-description:', error);
      return html;
    }
  }

  removeEmptyNodes(root: HTMLElement): void {
    const candidates = Array.from(
      root.querySelectorAll(
        'section, div, article, header, footer, p, span, h1, h2, h3, h4, h5, h6, ul, ol, li'
      )
    );

    for (let i = candidates.length - 1; i >= 0; i--) {
      const element = candidates[i] as HTMLElement;
      if (!this.hasMeaningfulContent(element)) {
        element.remove();
      }
    }
  }

  hasMeaningfulContent(element: Element): boolean {
    const text = (element.textContent || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, '')
      .trim();
    if (text.length > 0) return true;

    return Boolean(
      element.querySelector(
        'img, svg, picture, video, iframe, ul, ol, li, table, blockquote, pre, code, hr, button, input, select, textarea, a[href]'
      )
    );
  }

  removeVideos(html: string): string {
    const doc = this.browser.document;
    if (!html || !doc) return html;

    try {
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = html;

      const allDivs = Array.from(tempDiv.querySelectorAll('div'));

      for (let i = allDivs.length - 1; i >= 0; i--) {
        const divElement = allDivs[i] as HTMLElement;

        const hasVideo = divElement.querySelector(
          'video, iframe, [class*="video"], [class*="embed"], [class*="youtube"], [class*="vimeo"]'
        );
        const hasRatio =
          divElement.classList.contains('ratio') ||
          divElement.classList.contains('ratio-16x9') ||
          divElement.classList.contains('ratio-21x9') ||
          divElement.classList.contains('ratio-4x3') ||
          divElement.querySelector('[class*="ratio-"]');

        if (hasVideo || hasRatio) {
          const clone = divElement.cloneNode(true) as HTMLElement;
          clone
            .querySelectorAll(
              'video, iframe, [class*="video"], [class*="embed"], [class*="youtube"], [class*="vimeo"], [class*="ratio"]'
            )
            .forEach((el) => el.remove());

          const textContent = clone.textContent?.trim() || '';
          const innerHTML = clone.innerHTML.trim();

          if (
            textContent.length < 20 &&
            (innerHTML.length < 100 ||
              innerHTML.replace(/<[^>]+>/g, '').trim().length < 10)
          ) {
            divElement.remove();
          }
        }
      }

      tempDiv
        .querySelectorAll(
          'video, iframe, [class*="ratio-16x9"], [class*="ratio-21x9"], [class*="ratio-4x3"], .ratio'
        )
        .forEach((el) => {
          const element = el as HTMLElement;
          const parent = element.parentElement;
          if (parent && parent.tagName === 'DIV') {
            const parentText = parent.textContent?.trim() || '';
            const parentClone = parent.cloneNode(true) as HTMLElement;
            parentClone
              .querySelectorAll('video, iframe, [class*="ratio"]')
              .forEach((v) => v.remove());
            const parentContent = parentClone.innerHTML
              .trim()
              .replace(/<[^>]+>/g, '')
              .trim();

            if (parentText.length < 20 && parentContent.length < 10) {
              parent.remove();
            } else {
              element.remove();
            }
          } else {
            element.remove();
          }
        });

      let result = tempDiv.innerHTML;
      result = result.replace(
        /<div[^>]*class\s*=\s*["'][^"']*\bcol-[^"']*["'][^>]*>[\s\S]*?<div[^>]*class\s*=\s*["'][^"']*\bratio[^"']*["'][^>]*>[\s\S]*?<\/div>[\s\S]*?<\/div>/gi,
        ''
      );
      result = result.replace(
        /<div[^>]*>[\s\S]*?<(video|iframe)[^>]*>[\s\S]*?<\/(video|iframe)>[\s\S]*?<\/div>/gi,
        ''
      );
      result = result.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
      result = result.replace(/<video[^>]*>[\s\S]*?<\/video>/gi, '');
      result = result.replace(/<source[^>]*>/gi, '');

      return result.trim();
    } catch (error) {
      console.warn('Error eliminando videos:', error);
      let result = html;
      result = result.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
      result = result.replace(/<video[^>]*>[\s\S]*?<\/video>/gi, '');
      result = result.replace(/<source[^>]*>/gi, '');
      return result.trim();
    }
  }

  removeDivByDataId(html: string, dataId: string): string {
    const doc = this.browser.document;
    if (!html || !doc) return html;

    try {
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = html;

      const divToRemove = tempDiv.querySelector(`div[data-id="${dataId}"]`);

      if (divToRemove) {
        divToRemove.remove();
        return tempDiv.innerHTML.trim();
      }
    } catch (error) {
      console.warn('Error al eliminar div por data-id:', error);
      return html
        .replace(
          new RegExp(
            `<div[^>]*data-id="${dataId}"[^>]*>[\\s\\S]*?</div>`,
            'gi'
          ),
          ''
        )
        .trim();
    }

    return html;
  }
}
