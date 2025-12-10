import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

/**
 * SharedModule - Módulo compartido para componentes comunes
 * 
 * NOTA: Transloco está configurado en app.config.ts (standalone)
 * No duplicar la configuración aquí para evitar conflictos
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule
  ],
  providers: []
})
export class SharedModule { }
