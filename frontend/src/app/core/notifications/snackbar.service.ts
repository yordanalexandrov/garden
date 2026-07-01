import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import { SnackbarDetailDialog, SnackbarDetailDialogData } from './snackbar-detail-dialog';

export interface SnackbarOptions {
  readonly action?: string | null;
  readonly durationMs?: number;
  readonly panelClass?: string | string[];
}

const MESSAGE_DURATION_MS = 5000;
const ERROR_DURATION_MS = 3 * 60 * 1000;
const ERROR_DETAIL_ACTION = 'Details';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  showMessage(message: string, options: SnackbarOptions = {}): void {
    const action = this.resolveAction(options, 'Dismiss');
    this.snackBar.open(
      message,
      action,
      this.buildConfig(options, 'polite', MESSAGE_DURATION_MS, 'snackbar-success'),
    );
  }

  showError(message: string, options: SnackbarOptions = {}): void {
    const action = this.resolveAction(options, ERROR_DETAIL_ACTION);
    const ref = this.snackBar.open(
      message,
      action,
      this.buildConfig(options, 'assertive', ERROR_DURATION_MS, 'snackbar-error'),
    );

    if (action !== undefined) {
      ref.onAction().subscribe(() => this.openDetailDialog(message));
    }
  }

  private openDetailDialog(message: string): void {
    this.dialog.open<SnackbarDetailDialog, SnackbarDetailDialogData>(SnackbarDetailDialog, {
      data: { message },
    });
  }

  private resolveAction(options: SnackbarOptions, defaultAction: string): string | undefined {
    return options.action === null ? undefined : (options.action ?? defaultAction);
  }

  private buildConfig(
    options: SnackbarOptions,
    politeness: NonNullable<MatSnackBarConfig['politeness']>,
    defaultDurationMs: number,
    defaultPanelClass: string,
  ): MatSnackBarConfig {
    return {
      duration: options.durationMs ?? defaultDurationMs,
      panelClass: this.mergePanelClass(defaultPanelClass, options.panelClass),
      politeness,
    };
  }

  private mergePanelClass(defaultClass: string, extra: string | string[] | undefined): string[] {
    if (extra === undefined) {
      return [defaultClass];
    }

    return [defaultClass, ...(Array.isArray(extra) ? extra : [extra])];
  }
}
