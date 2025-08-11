import { Component } from '@angular/core';
import { ScHeaderComponent } from "../../sc-header/sc-header.component";
import { ScFooterComponent } from "../../sc-footer/sc-footer.component";

@Component({
  selector: 'app-apertura-llc',
  standalone: true,
  imports: [ScHeaderComponent, ScFooterComponent],
  templateUrl: './apertura-llc.component.html',
  styleUrl: './apertura-llc.component.css'
})
export class AperturaLlcComponent {

  openUrl(url: string){
    window.open(url, '_blank');
  }
}
