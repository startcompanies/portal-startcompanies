import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { TranslocoService } from '@jsverse/transloco';

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
  private readonly transloco = inject(TranslocoService);

  success(message: string): void {
    this.snackBar.open(message, this.transloco.translate('PANEL.common.dismiss'), {
      ...DEFAULT_CONFIG,
      panelClass: ['panel-snackbar', 'panel-snackbar-success'],
    });
  }

  error(message: string): void {
    this.snackBar.open(message, this.transloco.translate('PANEL.common.dismiss'), {
      ...DEFAULT_CONFIG,
      panelClass: ['panel-snackbar', 'panel-snackbar-error'],
    });
  }

  info(message: string): void {
    this.snackBar.open(message, this.transloco.translate('PANEL.common.dismiss'), {
      ...DEFAULT_CONFIG,
      panelClass: ['panel-snackbar', 'panel-snackbar-info'],
    });
  }
}
