import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-wistia-vertical-player',
  standalone: true,
  imports: [],
  templateUrl: './wistia-vertical-player.component.html',
  styleUrl: './wistia-vertical-player.component.css'
})
export class WistiaVerticalPlayerComponent implements OnInit{
  @Input() mediaId!: string;
  wistiaHtml!: SafeHtml;

  constructor(private sanitizer: DomSanitizer){}

  ngOnInit(): void {
      if (!this.mediaId) {
      console.error('El ID de Wistia no fue proporcionado.');
      return;
    }

    const wistiaCode = `
      <script src="https://fast.wistia.com/player.js" async></script>
      <script src="https://fast.wistia.com/embed/${this.mediaId}.js" async type="module"></script>
      <style>
        wistia-player[media-id='${this.mediaId}']:not(:defined) { 
          background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/${this.mediaId}/swatch'); 
          display: block; 
          filter: blur(5px); 
          padding-top:177.78%; /* relación vertical 9:16 */
        }
      </style>
      <wistia-player media-id="${this.mediaId}" aspect="0.5625"></wistia-player>
    `;

    this.wistiaHtml = this.sanitizer.bypassSecurityTrustHtml(wistiaCode);
  }
}
