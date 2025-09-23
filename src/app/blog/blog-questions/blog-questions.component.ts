import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-blog-questions',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  templateUrl: './blog-questions.component.html',
  styleUrl: './blog-questions.component.css'
})
export class BlogQuestionsComponent {

}
