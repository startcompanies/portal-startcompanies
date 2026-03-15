import { Injectable } from '@angular/core';
import { BrowserService } from '../../../../shared/services/browser.service';

/**
 * Servicio especializado para la gestión del índice de contenidos (TOC) del blog.
 * Extraído del God Component blog-post-v2.component.ts para mejorar mantenibilidad.
 */
@Injectable({ providedIn: 'root' })
export class BlogTocService {
  constructor(private browser: BrowserService) {}

  generateHeadingId(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  extractTOCLinks(
    content: string
  ): Array<{ href: string; text: string; isHeading?: boolean }> {
    const doc = this.browser.document;
    if (!content || !doc) return [];

    const links: Array<{ href: string; text: string; isHeading?: boolean }> = [];
    const container = doc.createElement('div');
    container.innerHTML = content;

    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headings.forEach((heading) => {
      const headingElement = heading as HTMLElement;
      const text = headingElement.textContent?.trim() || '';

      if (text) {
        let headingId = headingElement.id;

        if (!headingId) {
          headingId = this.generateHeadingId(text);
          let uniqueId = headingId;
          let counter = 1;
          while (links.some((link) => link.href === `#${uniqueId}`)) {
            uniqueId = `${headingId}-${counter}`;
            counter++;
          }
          headingId = uniqueId;
        }

        links.push({ href: `#${headingId}`, text, isHeading: true });
      }
    });

    const anchorElements = container.querySelectorAll('a[href]');
    anchorElements.forEach((anchor) => {
      const href = anchor.getAttribute('href');
      const anchorElement = anchor as HTMLElement;
      const text = anchor.textContent?.trim() || anchorElement.innerText?.trim() || '';

      if (href && text) {
        if (href.startsWith('#')) {
          if (!links.some((link) => link.href === href)) {
            links.push({ href, text, isHeading: false });
          }
        } else if (href.startsWith('/')) {
          const hashIndex = href.indexOf('#');
          if (hashIndex !== -1) {
            const anchorPart = href.substring(hashIndex);
            if (!links.some((link) => link.href === anchorPart)) {
              links.push({ href: anchorPart, text, isHeading: false });
            }
          }
        } else {
          const win = this.browser.window;
          if (
            win &&
            href.includes('#') &&
            (href.includes(win.location.hostname) || !href.startsWith('http'))
          ) {
            const hashIndex = href.indexOf('#');
            if (hashIndex !== -1) {
              const anchorPart = href.substring(hashIndex);
              if (!links.some((link) => link.href === anchorPart)) {
                links.push({ href: anchorPart, text, isHeading: false });
              }
            }
          }
        }
      }
    });

    return links;
  }

  assignHeadingIds(): void {
    const doc = this.browser.document;
    if (!doc) return;

    const contentContainer = doc.querySelector('.app-post-content');
    if (!contentContainer) return;

    const headings = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headings.forEach((heading) => {
      const headingElement = heading as HTMLElement;

      if (!headingElement.id) {
        const text = headingElement.textContent?.trim() || '';
        if (text) {
          const generatedId = this.generateHeadingId(text);

          let uniqueId = generatedId;
          let counter = 1;
          while (doc.getElementById(uniqueId)) {
            uniqueId = `${generatedId}-${counter}`;
            counter++;
          }

          headingElement.id = uniqueId;
        }
      }
    });
  }

  scrollToSection(href: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    const doc = this.browser.document;
    const win = this.browser.window;
    if (!doc || !win || !href) return;

    const normalizedHref = href.startsWith('#') ? href : `#${href}`;
    const anchorId = normalizedHref.substring(1);

    if (!anchorId || anchorId.trim() === '') {
      return;
    }

    const performScroll = () => {
      let targetElement: HTMLElement | null = null;

      targetElement = doc.getElementById(anchorId);

      if (!targetElement) {
        targetElement = doc.querySelector(`[id="${anchorId}"]`) as HTMLElement;
      }

      if (targetElement) {
        const headerHeight = 80;
        const targetPosition =
          targetElement.getBoundingClientRect().top +
          win.scrollY -
          headerHeight;

        win.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    };

    performScroll();
  }
}
