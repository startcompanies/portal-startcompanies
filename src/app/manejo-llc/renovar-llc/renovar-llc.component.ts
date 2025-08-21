import { Component } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { HeaderManejoComponent } from "../header-manejo/header-manejo.component";
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';

@Component({
  selector: 'app-renovar-llc',
  standalone: true,
  imports: [ScFooterComponent, HeaderManejoComponent, SeoBaseComponent],
  templateUrl: './renovar-llc.component.html',
  styleUrl: './renovar-llc.component.css'
})
export class RenovarLlcComponent {
  openUrl(url: string){
    window.open(url, '_blank');
  }
}
