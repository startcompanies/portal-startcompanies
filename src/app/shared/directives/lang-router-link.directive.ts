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
    
    // Mapear rutas según el idioma
    const mappedCommands = this.mapCommandsForLanguage(normalized, lang);
    
    // Para español (raíz), no agregar prefijo de idioma
    if (lang === 'es') {
      this.urlTree = this.router.createUrlTree(['/', ...mappedCommands], {
        queryParams: this.queryParams,
        fragment: this.fragment,
      });
    } else {
      // Para inglés, agregar prefijo /en/
      this.urlTree = this.router.createUrlTree(['/', lang, ...mappedCommands], {
        queryParams: this.queryParams,
        fragment: this.fragment,
      });
    }
    
    this.href = this.router.serializeUrl(this.urlTree);

    // Fija href en el <a> para que funcione copiar/abrir en nueva pestaña
    try {
      this.renderer.setAttribute(this.el.nativeElement, 'href', this.href);
    } catch {
      // no hacer nada si el host no acepta atributos
    }
  }

  /**
   * Mapea comandos de navegación según el idioma
   */
  private mapCommandsForLanguage(commands: any[], lang: string): any[] {
    if (lang === 'en') {
      return commands.map(cmd => {
        if (typeof cmd === 'string') {
          const routeMapping: { [key: string]: string } = {
            'inicio': 'home',
            'nosotros': 'about-us',
            'contacto': 'contact',
            'planes': 'plans',
            'blog': 'blog',
            'aviso-de-privacidad': 'privacy-policy',
            'terminos-y-condiciones': 'terms-and-conditions',
            'apertura-llc': 'llc-opening',
            'renovar-llc': 'llc-renewal',
            'form-apertura-relay': 'relay-opening-form',
            'abre-tu-llc': 'llc-formation',
            'presentacion': 'presentation',
            'apertura-banco-relay': 'relay-account-opening',
            'agendar': 'schedule',
            'fixcal': 'fixcal',
            'abotax': 'abotax',
            'category': 'category',
            'post': 'post'
          };
          return routeMapping[cmd] || cmd;
        }
        return cmd;
      });
    } else if (lang === 'es') {
      return commands.map(cmd => {
        if (typeof cmd === 'string') {
          const routeMapping: { [key: string]: string } = {
            'home': 'inicio',
            'about-us': 'nosotros',
            'contact': 'contacto',
            'plans': 'planes',
            'blog': 'blog',
            'privacy-policy': 'aviso-de-privacidad',
            'terms-and-conditions': 'terminos-y-condiciones',
            'llc-opening': 'apertura-llc',
            'llc-renewal': 'renovar-llc',
            'relay-opening-form': 'form-apertura-relay',
            'llc-formation': 'abre-tu-llc',
            'presentation': 'presentacion',
            'relay-account-opening': 'apertura-banco-relay',
            'schedule': 'agendar',
            'fixcal': 'fixcal',
            'abotax': 'abotax',
            'category': 'category',
            'post': 'post'
          };
          return routeMapping[cmd] || cmd;
        }
        return cmd;
      });
    }
    return commands;
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
