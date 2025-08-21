import { Component } from '@angular/core';
import { ScFooterComponent } from "../../sc-footer/sc-footer.component";
import { HeaderManejoComponent } from "../header-manejo/header-manejo.component";
import { SeoBaseComponent } from "../../shared/components/seo-base/seo-base.component";

@Component({
  selector: 'app-apertura-llc',
  standalone: true,
  imports: [ScFooterComponent, HeaderManejoComponent, SeoBaseComponent],
  templateUrl: './apertura-llc.component.html',
  styleUrl: './apertura-llc.component.css'
})
export class AperturaLlcComponent {

  openUrl(url: string){
    window.open(url, '_blank');
  }
}
