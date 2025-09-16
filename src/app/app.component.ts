import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImagePreloaderComponent } from './shared/components/image-preloader/image-preloader.component';
import { WhatsappFloatComponent } from './shared/components/whatsapp-float/whatsapp-float.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ImagePreloaderComponent, WhatsappFloatComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'portal-startcompanies';
}
