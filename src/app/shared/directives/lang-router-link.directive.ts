// src/app/shared/directives/lang-router-link.directive.ts
import {
  Directive,
  Input,
  HostListener,
  ElementRef,
  Renderer2,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[langRouterLink]',
  standalone: true,
})
export class LangRouterLinkDirective implements OnChanges, OnDestroy {
  /** Valor: ['post', slug] o 'post/slug' */
  @Input('langRouterLink') commands!: any[] | string;
  @Input() queryParams?: { [k: string]: any };
  @Input() fragment?: string;

  private urlTree?: UrlTree;
  private href?: string;
  private langSub?: Subscription;

  constructor(
    private router: Router,
    private transloco: TranslocoService,
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {
    // Actualizar href cuando cambie el idioma activo
    this.langSub = this.transloco.langChanges$.subscribe(() => {
      this.updateHref();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['commands'] || changes['queryParams'] || changes['fragment']) {
      this.updateHref();
    }
  }

  private normalizeCommands(cmds: any[] | string): any[] {
    const arr = Array.isArray(cmds) ? cmds.slice() : [cmds];
    if (arr.length > 0 && typeof arr[0] === 'string') {
      arr[0] = (arr[0] as string).replace(/^\/+/, ''); // quitar slashes iniciales
    }
    return arr;
  }

  private updateHref() {
    const lang = this.transloco.getActiveLang() || 'es';
    const normalized = this.normalizeCommands(this.commands || []);
    this.urlTree = this.router.createUrlTree(['/', lang, ...normalized], {
      queryParams: this.queryParams,
      fragment: this.fragment,
    });
    this.href = this.router.serializeUrl(this.urlTree);

    // Fija href en el <a> para que funcione copiar/abrir en nueva pestaña
    try {
      this.renderer.setAttribute(this.el.nativeElement, 'href', this.href);
    } catch {
      // no hacer nada si el host no acepta atributos
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    // Permitir middle/ctrl/meta/shift/alt clicks y enlaces con target distinto
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return; // dejar comportamiento por defecto
    }

    const target = (this.el.nativeElement as HTMLAnchorElement).getAttribute('target');
    if (target && target !== '_self') return; // permitir abrir en nueva pestaña si piden

    // otherwise, manejar con Router (SPA)
    event.preventDefault();
    if (!this.urlTree) this.updateHref();
    if (this.urlTree) {
      this.router.navigateByUrl(this.urlTree);
    }
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
  }
}
