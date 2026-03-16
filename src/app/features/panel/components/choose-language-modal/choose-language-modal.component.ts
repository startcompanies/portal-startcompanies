import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { PanelLanguageService, PanelLang } from '../../services/panel-language.service';

/**
 * Modal de elección de idioma para el panel.
 * Se muestra en la primera entrada al panel cuando el usuario no tiene preferencia guardada.
 */
@Component({
  selector: 'app-choose-language-modal',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './choose-language-modal.component.html',
  styleUrl: './choose-language-modal.component.css'
})
export class ChooseLanguageModalComponent {
  private readonly panelLanguage = inject(PanelLanguageService);

  /** Se emite al elegir un idioma (para que el layout cierre el modal). */
  readonly closed = output<void>();

  choose(lang: PanelLang): void {
    this.panelLanguage.chooseLanguage(lang);
    this.closed.emit();
  }
}
