import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export interface SnackbarOptions {
  readonly action?: string;
  readonly durationMs?: number;
  readonly panelClass?: string | string[];
}

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);

  showMessage(message: string, options: SnackbarOptions = {}): void {
    this.snackBar.open(message, options.action ?? 'Dismiss', this.buildConfig(options, 'polite'));
  }

  showError(message: string, options: SnackbarOptions = {}): void {
    this.snackBar.open(message, options.action ?? 'Dismiss', this.buildConfig(options, 'assertive'));
  }

  private buildConfig(
    options: SnackbarOptions,
    politeness: NonNullable<MatSnackBarConfig['politeness']>,
  ): MatSnackBarConfig {
    return {
      duration: options.durationMs ?? 5000,
      panelClass: options.panelClass,
      politeness,
    };
  }
}
