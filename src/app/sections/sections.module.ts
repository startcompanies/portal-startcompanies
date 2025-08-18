import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpeningLlcComponent } from './opening-llc/opening-llc.component';
import { BenefitsComponent } from './benefits/benefits.component';
import { PricingComponent } from './pricing/pricing.component';
import { TestimonialsComponent } from './testimonials/testimonials.component';
import { BlogComponent } from './blog/blog.component';
import { TabsComponent } from './tabs/tabs.component';
import { FaqComponent } from './faq/faq.component';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    OpeningLlcComponent,
    BenefitsComponent,
    PricingComponent,
    TestimonialsComponent,
    BlogComponent,
    TabsComponent,
    FaqComponent
  ],
  exports: [
    OpeningLlcComponent,
    BenefitsComponent,
    PricingComponent,
    TestimonialsComponent,
    BlogComponent,
    TabsComponent,
    FaqComponent
  ]
})
export class SectionsModule { }
