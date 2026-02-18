import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../services/wizard-state.service';

/**
 * Componente reutilizable para el paso de envío a Zoho
 * Usado en todos los flujos como paso final
 */
@Component({
  selector: 'app-wizard-zoho-submit-step',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './zoho-submit-step.component.html',
  styleUrls: ['./zoho-submit-step.component.css']
})
export class WizardZohoSubmitStepComponent implements OnInit {
  loading = false;
  success = false;
  error = false;

  constructor(private wizardStateService: WizardStateService) {}

  ngOnInit(): void {
    // Este es el último paso, aquí se pueden enviar todos los datos a Zoho
    const allData = this.wizardStateService.getAllData();
    console.log('📤 Enviando datos a Zoho:', allData);
    
    // Aquí iría la lógica para enviar a Zoho
    // Por ahora solo mostramos el mensaje
  }
}
