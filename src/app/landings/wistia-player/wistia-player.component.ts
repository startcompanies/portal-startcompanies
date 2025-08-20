import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-wistia-player',
  standalone: true,
  imports: [],
  templateUrl: './wistia-player.component.html',
  styleUrl: './wistia-player.component.css',
})
export class WistiaPlayerComponent {

  @Input() mediaId!: string;
  wistiaHtml!: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    /*
    const wistiaCode = `
      <script src="https://fast.wistia.com/player.js" async></script>
      <script src="https://fast.wistia.com/embed/8yxsnzvoqk.js" async type="module"></script>
      <style>wistia-player[media-id='8yxsnzvoqk']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/7jmb863qsx/swatch'); display: block; filter: blur(5px); padding-top:56.25%; }</style>
      <wistia-player media-id="8yxsnzvoqk" aspect="1.7777777777777777"></wistia-player>
    `;*/
    if (!this.mediaId) {
      console.error('El ID de Wistia no fue proporcionado.');
      return;
    }

    const wistiaCode = `
      <script src="https://fast.wistia.com/player.js" async></script>
      <script src="https://fast.wistia.com/embed/${this.mediaId}.js" async type="module"></script>
      <style>wistia-player[media-id='${this.mediaId}']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/${this.mediaId}/swatch'); display: block; filter: blur(5px); padding-top:56.25%; }</style>
      <wistia-player media-id="${this.mediaId}" aspect="1.7777777777777777"></wistia-player>
    `;

    this.wistiaHtml = this.sanitizer.bypassSecurityTrustHtml(wistiaCode);
  }
}
