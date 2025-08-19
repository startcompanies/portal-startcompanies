import { Component } from '@angular/core';
import { ScHeaderComponent } from "../../sc-header/sc-header.component";
import { ScFooterComponent } from "../../sc-footer/sc-footer.component";
import { OurPricingComponent } from "../our-pricing/our-pricing.component";
import { ComparisonTableComponent } from "../comparison-table/comparison-table.component";

@Component({
  selector: 'app-pricing-planes',
  standalone: true,
  imports: [ScHeaderComponent, ScFooterComponent, OurPricingComponent, ComparisonTableComponent],
  templateUrl: './pricing-planes.component.html',
  styleUrl: './pricing-planes.component.css'
})
export class PricingPlanesComponent {

}
