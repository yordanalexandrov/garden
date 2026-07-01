import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface SnackbarDetailDialogData {
  readonly message: string;
}

@Component({
  selector: 'app-snackbar-detail-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './snackbar-detail-dialog.html',
  styleUrl: './snackbar-detail-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnackbarDetailDialog {
  readonly data = inject<SnackbarDetailDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SnackbarDetailDialog>);

  close(): void {
    this.dialogRef.close();
  }
}
