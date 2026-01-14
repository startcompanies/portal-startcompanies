import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared/shared.module';

@Component({
  selector: 'app-testimonials-carousel',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './testimonials-carousel.component.html',
  styleUrl: './testimonials-carousel.component.css',
})
export class TestimonialsCarouselComponent implements OnInit {
  reviews: any[] = [
    {
      author_name: 'Franco Caputo',
      author_pic:
        'https://user-images.trustpilot.com/66be140346190e388ae1e82a/73x73.png',
      author_country_code: 'AR',
      author_country_name: 'Argentina',
      review_date: '2025-08-27T21:01:44.000Z',
      rating: 5,
      review_title: 'Excelente servicio',
      review_text:
        'Nacho es simplemente una de las personas más trabajadoras, honestas y llanamente BUENAS que conocí en el rubro. Está atento en todo momento y genuinamente se preocupa de sus clientes y subsecuentemente quiere que a tu empresa le vaya bien. Lo encontré de pura casualidad después de haber tenido una experiencia HORRIBLE con otro provedor y fue una de las coincidencias más afortunadas.',
      is_spontaneous: true,
    },
    {
      author_name: 'Bauti Roig',
      author_pic:
        'https://user-images.trustpilot.com/6882b28364d5cf6431772e9c/73x73.png',
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
      author_name: 'Nacho Campo',
      author_pic:
        'https://user-images.trustpilot.com/688141f464d5cfe8f0756ccc/73x73.png',
      author_country_code: 'AR',
      author_country_name: 'Argentina',
      review_date: '2024-08-09T00:40:48.000Z',
      rating: 5,
      review_title: 'Necesitaba una cuenta bancaria',
      review_text:
        'Necesitaba una cuenta bancaria, los contacte y como prometieron, en menos de 72 hs tenia mi cuenta aprobada. Eficientes desde el principio hasta el final de la gestión.',
      is_spontaneous: false,
    },
    {
      author_name: 'Ezequiel Correa',
      author_pic:
        'https://user-images.trustpilot.com/665df08f3a31091f4f637ee1/73x73.png',
      author_country_code: 'AR',
      author_country_name: 'Argentina',
      review_date: '2025-08-20T18:03:18.000Z',
      rating: 5,
      review_title: 'Soy consultor en tecnología y brindo…',
      review_text:
        'Soy consultor en tecnología y brindo servicios en el exterior por medio de una LLC. Excelente servicio. Hiper profesional. Me asombró la rapidez con la que trabajan, contacto constante y soluciones concretas. Respuestas inmediatas ante consultas. Sinceramente agradezco mucho el apoyo y sin dudar, continuo con StartCompanies como mi aliado estratégico para llevar en orden mi facturación y contabilidad.',
      is_spontaneous: true,
    },
    {
      author_name: 'JulIAn BernAI',
      author_pic:
        'https://user-images.trustpilot.com/68829c8c65125e0f7b2903b1/73x73.png',
      author_country_code: 'CO',
      author_country_name: 'Colombia',
      review_date: '2025-07-24T22:50:25.000Z',
      rating: 5,
      review_title: 'Rápidos y lo mejor que pagas al final',
      review_text:
        'Muy rápidos y lo mejor que pagas al final. Siempre existe miedo al tomar una decisión como está. Sin embargo siempre me sentí acompañado y respondieron muy rápido a mis solicitudes.',
      is_spontaneous: true,
    },
  ];

  chunkedReviews: any[][] = [];

  constructor() {}

  ngOnInit(): void {
    // Al iniciar el componente, agrupamos las reseñas.
    this.chunkedReviews = this.chunkArray(this.reviews, 2);
  }

  // Función para agrupar el array en chunks de un tamaño específico
  chunkArray(array: any[], chunkSize: number): any[][] {
    const chunkedArray = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunkedArray.push(array.slice(i, i + chunkSize));
    }
    return chunkedArray;
  }
}
