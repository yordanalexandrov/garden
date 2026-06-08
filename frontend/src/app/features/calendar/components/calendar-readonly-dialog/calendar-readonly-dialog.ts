import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface CalendarReadonlyDialogData {
  readonly title: string;
  readonly lines: readonly string[];
}

@Component({
  selector: 'app-calendar-readonly-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './calendar-readonly-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarReadonlyDialog {
  readonly data = inject<CalendarReadonlyDialogData>(MAT_DIALOG_DATA);
}
