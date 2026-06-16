import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface AiPayloadDialogData {
  /** Pretty-printed JSON payload to display and (optionally) edit. */
  readonly payloadJson: string;
  /** When false, the payload is shown read-only with no editing controls. */
  readonly editable?: boolean;
}

@Component({
  selector: 'app-ai-payload-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './ai-payload-dialog.html',
  styleUrl: './ai-payload-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPayloadDialog {
  readonly data = inject<AiPayloadDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AiPayloadDialog, string | undefined>);

  readonly editable = this.data.editable !== false;
  readonly payloadControl = new FormControl<string>(this.data.payloadJson ?? '', {
    nonNullable: true,
  });
  readonly parseError = signal<string | null>(null);

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  save(): void {
    const raw = this.payloadControl.value.trim();

    if (raw) {
      try {
        JSON.parse(raw);
      } catch {
        this.parseError.set('Invalid JSON — fix the syntax before saving.');
        return;
      }
    }

    this.parseError.set(null);
    this.dialogRef.close(this.payloadControl.value);
  }
}
