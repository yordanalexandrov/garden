import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ApiError } from '../../../core/errors/api-error';
import { apiErrorMessages } from './api-error-form';

@Component({
  selector: 'app-api-error-summary',
  imports: [MatIconModule],
  templateUrl: './api-error-summary.html',
  styleUrl: './api-error-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiErrorSummary {
  readonly error = input<ApiError | null>(null);

  messages(): readonly string[] {
    return apiErrorMessages(this.error());
  }
}
