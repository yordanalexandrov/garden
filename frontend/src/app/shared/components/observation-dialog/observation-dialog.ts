import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProblemObservation } from '../../../features/problems/problems.models';

export interface ObservationDialogData {
  readonly existing?: ProblemObservation;
}

export interface ObservationDialogResult {
  readonly summary: string;
  readonly recommendation: string | null;
}

@Component({
  selector: 'app-observation-dialog',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './observation-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObservationDialog {
  readonly data = inject<ObservationDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ObservationDialog, ObservationDialogResult>);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    summary: [this.data.existing?.summary ?? '', [Validators.required, Validators.minLength(1)]],
    recommendation: [this.data.existing?.recommendation ?? ''],
  });

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) return;
    const { summary, recommendation } = this.form.getRawValue();
    this.dialogRef.close({
      summary: summary!.trim(),
      recommendation: recommendation?.trim() || null,
    });
  }
}
