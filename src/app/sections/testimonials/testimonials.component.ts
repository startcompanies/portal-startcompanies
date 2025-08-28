import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SharedModule } from '../../shared/shared/shared.module';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [TranslocoPipe, SharedModule],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.css',
})
export class TestimonialsComponent {
  reviews: any[] = [
    {
      author_name: 'Rodrigo',
      author_pic: "",
      author_country_code: 'CO',
      author_country_name: 'Colombia',
      review_date: '2025-08-27T21:01:44.000Z',
      rating: 5,
      review_title: 'Excelente servicio',
      review_text:
        'Excelente servicio, claro y transparente. Desde el principio sentí la confianza de ser asesorado por Start Companies. Realmente el proceso fue muy corto y no tuve que hacer mayor cosa que enviar unos documentos y ya. Al final, tengo mi LLC. Gracias por su asesoría.',
      is_spontaneous: true,
    },
    {
      author_name: 'Bauti Roig',
      author_pic: "https://user-images.trustpilot.com/6882b28364d5cf6431772e9c/73x73.png",
      author_country_code: 'AR',
      author_country_name: 'Argentina',
      review_date: '2025-07-25T00:27:45.000Z',
      rating: 5,
      review_title: 'Excelente, 10 puntos.',
      review_text:
        'Excelente. 10/10. Ignacio me llamo, y me asesoró al %100 sin esperar nada a cambio, sabiendo que yo ya contaba con una compañía. Habla de calidad de persona y valores, estoy más que sorprendido y agradecido. Voy a continuar renovando siempre con ellos',
      is_spontaneous: true,
    },
    {
      author_name: 'Patricia Bordes',
      author_pic: "",
      author_country_code: 'US',
      author_country_name: 'USA',
      review_date: '2024-08-09T00:40:48.000Z',
      rating: 5,
      review_title: 'Gracias a Start Companies por su apoyo…',
      review_text:
        'Gracias a Start Companies por su apoyo muy profesional. A pesar de ser ciudadana americana, tratar de hacer estos trámites online genera un poco de temor (de ambas partes) pero la verdad cuando las cartas están claras sobre la mesa, todo fluye. Gracias Ignacio.',
      is_spontaneous: false,
    },
    {
      author_name: 'Victor',
      author_pic: "",
      author_country_code: 'ES',
      author_country_name: 'España',
      review_date: '2025-08-20T18:03:18.000Z',
      rating: 5,
      review_title: 'el mejor tiempo y dinero invertido',
      review_text:
        'el mejor tiempo y dinero invertido, todo ha fluido, en una semana la cuenta estaba abierta. Cualquier consulta o duda responden inmediatamente.',
      is_spontaneous: true,
    },
    {
      author_name: 'JulIAn BernAI',
      author_pic: "https://user-images.trustpilot.com/68829c8c65125e0f7b2903b1/73x73.png",
      author_country_code: 'CO',
      author_country_name: 'Colombia',
      review_date: '2025-07-24T22:50:25.000Z',
      rating: 5,
      review_title: '...',
      review_text: '...',
      is_spontaneous: true,
    },
  ];
}
