import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ProblemPhotoUploader } from '../../../../shared/components/problem-photo-uploader/problem-photo-uploader';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { applyApiErrorToForm } from '../../../../shared/forms/api-error-summary/api-error-form';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import {
  ProblemTargetIntent,
  ProblemTargetSelector,
} from '../../../../shared/selectors/problem-target-selector/problem-target-selector';
import { ActivitiesApiService } from '../../../activities/activities-api.service';
import { ActivityListItem } from '../../../activities/activities.models';
import { PlacesApiService } from '../../../places/places-api.service';
import { PlaceListItem } from '../../../places/places.models';
import { ProblemsApiService } from '../../problems-api.service';
import {
  CreateProblemRequest,
  PROBLEM_CATEGORIES,
  PROBLEM_STATUSES,
  PROBLEM_TYPES,
  ProblemCategory,
  ProblemMutationResult,
  ProblemStatus,
  ProblemType,
} from '../../problems.models';

function localDateTimeString(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

@Component({
  selector: 'app-problem-create-page',
  imports: [
    ApiErrorSummary,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    PageHeader,
    ProblemPhotoUploader,
    ProblemTargetSelector,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './problem-create-page.html',
  styleUrl: './problem-create-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProblemCreatePage {
  readonly problemTypes = PROBLEM_TYPES;
  readonly problemStatuses = PROBLEM_STATUSES;
  readonly problemCategories = PROBLEM_CATEGORIES;
  readonly places = signal<readonly PlaceListItem[]>([]);
  readonly activities = signal<readonly ActivityListItem[]>([]);
  readonly targetIntent = signal<ProblemTargetIntent | null>(null);
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly created = signal<ProblemMutationResult | null>(null);

  readonly uploader = viewChild(ProblemPhotoUploader);

  readonly form = new FormGroup({
    type: new FormControl<ProblemType>('problem', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    placeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl<ProblemCategory | null>(null),
    severity: new FormControl('', { nonNullable: true }),
    status: new FormControl<ProblemStatus>('open', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    observedAt: new FormControl(localDateTimeString(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    linkedActivityId: new FormControl<string | null>(null),
  });

  private readonly problemsApi = inject(ProblemsApiService);
  private readonly placesApi = inject(PlacesApiService);
  private readonly activitiesApi = inject(ActivitiesApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.placesApi
      .list({ page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed())
      .subscribe((result) => this.places.set(result.items));

    this.form.controls.placeId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((placeId) => this.loadActivities(placeId));
  }

  isProblemType(): boolean {
    return this.form.controls.type.value === 'problem';
  }

  selectedPlaceName(): string | null {
    return (
      this.places().find((place) => place.id === this.form.controls.placeId.value)?.name ?? null
    );
  }

  updateTargetIntent(intent: ProblemTargetIntent): void {
    this.targetIntent.set(intent);
  }

  targetIsValid(): boolean {
    return this.targetIntent()?.targetId != null;
  }

  submit(): void {
    if (this.saving()) {
      return;
    }

    this.form.markAllAsTouched();
    this.error.set(null);

    if (!this.form.valid || !this.targetIsValid()) {
      return;
    }

    this.saving.set(true);

    // Snapshot the type at submit time so an in-flight type change cannot make
    // the upload step disagree with the record that was actually created.
    const isProblem = this.form.controls.type.value === 'problem';

    this.problemsApi
      .create(this.buildRequest())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.created.set(result);
          this.uploadPhotoIfNeeded(result.id, isProblem);
        },
        error: (error: unknown) => {
          const apiError = mapApiError(error);
          applyApiErrorToForm(this.form, apiError);
          this.error.set(apiError);
          this.saving.set(false);
        },
      });
  }

  buildRequest(): CreateProblemRequest {
    const value = this.form.getRawValue();
    const intent = this.targetIntent();

    return {
      type: value.type,
      placeId: value.placeId,
      targetType: intent?.targetType ?? 'place',
      targetId: intent?.targetId ?? value.placeId,
      title: value.title.trim(),
      description: value.description.trim(),
      category: value.category,
      severity: value.severity.trim() || null,
      status: value.status,
      observedAt: new Date(value.observedAt).toISOString(),
      linkedActivityId: value.linkedActivityId,
    };
  }

  private uploadPhotoIfNeeded(problemId: string, isProblem: boolean): void {
    const uploader = this.uploader();

    if (!isProblem || uploader === undefined || !uploader.hasFile()) {
      this.saving.set(false);
      return;
    }

    uploader
      .upload(problemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.saving.set(false));
  }

  private loadActivities(placeId: string): void {
    if (!placeId) {
      this.activities.set([]);
      return;
    }

    this.activitiesApi
      .list({ placeId, page: 1, pageSize: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.activities.set(result.items),
        error: () => this.activities.set([]),
      });
  }
}
