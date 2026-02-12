import { Component } from '@angular/core';

@Component({
  selector: 'app-blog-author-card',
  standalone: true,
  templateUrl: './blog-author-card.component.html',
  styleUrl: './blog-author-card.component.css',
})
export class BlogAuthorCardComponent {
  authorName = 'Ignacio Navarro';
  authorDescription =
    'Ignacio Navarro es Contador Público, graduado en 2020 de la Universidad Nacional de Tucumán. Fundador de Start Companies desde 2023, asesora a clientes de todo el mundo en la apertura de LLC en Estados Unidos y en la correcta declaración de impuestos. Su experiencia combina conocimiento legal, fiscal y práctico, ofreciendo un servicio integral que abarca desde la constitución de la sociedad hasta la apertura bancaria e integración de plataformas de ventas.';
  authorImage = '/assets/ignacio-navarro.webp';
  linkedinUrl = 'https://www.linkedin.com/company/startcompanies/';
  facebookUrl = 'https://www.facebook.com/startcompanies/';
  instagramUrl = 'https://www.instagram.com/startcompanies';
  whatsappUrl = 'https://api.whatsapp.com/send/?phone=%2B17869354213&text=Hola%2C+vengo+de+Start+Companies.+Tengo+algunas+consultas+para+hacerles.&type=phone_number&app_absent=0';
  youtubeUrl = 'https://www.youtube.com/@AdministracionStartCompanies';
}
