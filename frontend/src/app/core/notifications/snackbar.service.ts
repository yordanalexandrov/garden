import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export interface SnackbarOptions {
  readonly action?: string | null;
  readonly durationMs?: number;
  readonly panelClass?: string | string[];
}

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);

  showMessage(message: string, options: SnackbarOptions = {}): void {
    const action = this.resolveAction(options);
    this.snackBar.open(message, action, this.buildConfig(options, action, 'polite'));
  }

  showError(message: string, options: SnackbarOptions = {}): void {
    const action = this.resolveAction(options);
    this.snackBar.open(message, action, this.buildConfig(options, action, 'assertive'));
  }

  private resolveAction(options: SnackbarOptions): string | undefined {
    return options.action === null ? undefined : (options.action ?? 'Dismiss');
  }

  private buildConfig(
    options: SnackbarOptions,
    action: string | undefined,
    politeness: NonNullable<MatSnackBarConfig['politeness']>,
  ): MatSnackBarConfig {
    return {
      duration: action ? undefined : (options.durationMs ?? 5000),
      panelClass: options.panelClass,
      politeness,
    };
  }
}
