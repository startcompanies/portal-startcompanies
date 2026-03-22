import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

const DEFAULT_CONFIG: MatSnackBarConfig = {
  duration: 4500,
  verticalPosition: 'top',
  horizontalPosition: 'center',
};

@Injectable({
  providedIn: 'root',
})
export class PanelSnackBarService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      ...DEFAULT_CONFIG,
      panelClass: ['panel-snackbar', 'panel-snackbar-success'],
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      ...DEFAULT_CONFIG,
      panelClass: ['panel-snackbar', 'panel-snackbar-error'],
    });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      ...DEFAULT_CONFIG,
      panelClass: ['panel-snackbar', 'panel-snackbar-info'],
    });
  }
}
