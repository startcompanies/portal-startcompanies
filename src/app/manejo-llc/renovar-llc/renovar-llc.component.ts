import { Component } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { HeaderManejoComponent } from "../header-manejo/header-manejo.component";

@Component({
  selector: 'app-renovar-llc',
  standalone: true,
  imports: [ScFooterComponent, HeaderManejoComponent],
  templateUrl: './renovar-llc.component.html',
  styleUrl: './renovar-llc.component.css'
})
export class RenovarLlcComponent {
  openUrl(url: string){
    window.open(url, '_blank');
  }
}
