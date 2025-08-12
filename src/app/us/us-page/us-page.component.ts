import { Component } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { UsStrategiesComponent } from '../us-strategies/us-strategies.component';
import { UsPotentialComponent } from '../us-potential/us-potential.component';
import { UsProposalComponent } from "../us-proposal/us-proposal.component";
import { VideoSectionComponent } from "../../landings/video-section/video-section.component";

@Component({
  selector: 'app-us-page',
  standalone: true,
  imports: [ScHeaderComponent, ScFooterComponent, TranslocoPipe, UsPotentialComponent, UsProposalComponent, UsProposalComponent, VideoSectionComponent],
  templateUrl: './us-page.component.html',
  styleUrl: './us-page.component.css'
})
export class UsPageComponent {

}
