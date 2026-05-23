import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ApiError } from '../../../../core/errors/api-error';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { applyApiErrorToForm } from '../../../../shared/forms/api-error-summary/api-error-form';
import { CreatePlaceRequest, PlaceDetail, PlaceListItem } from '../../places.models';

type PlaceFormGroup = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  notes: FormControl<string>;
  weatherEnabled: FormControl<boolean>;
  weatherLocationLabel: FormControl<string>;
  latitude: FormControl<number | string | null>;
  longitude: FormControl<number | string | null>;
  timezone: FormControl<string>;
}>;

@Component({
  selector: 'app-place-form',
  imports: [
    ApiErrorSummary,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './place-form.html',
  styleUrl: './place-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceForm {
  readonly place = input<PlaceDetail | PlaceListItem | null>(null);
  readonly apiError = input<ApiError | null>(null);
  readonly saving = input(false);
  readonly submitted = output<CreatePlaceRequest>();
  readonly cancelled = output<void>();

  readonly form: PlaceFormGroup = new FormGroup(
    {
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      description: new FormControl('', { nonNullable: true }),
      notes: new FormControl('', { nonNullable: true }),
      weatherEnabled: new FormControl(false, { nonNullable: true }),
      weatherLocationLabel: new FormControl('', { nonNullable: true }),
      latitude: new FormControl<number | string | null>(null),
      longitude: new FormControl<number | string | null>(null),
      timezone: new FormControl('', { nonNullable: true }),
    },
    { validators: [weatherLocationValidator] },
  );

  constructor() {
    effect(() => {
      this.patchFromPlace(this.place());
    });

    effect(() => {
      const error = this.apiError();

      if (error !== null) {
        applyApiErrorToForm(this.form, error);
      }
    });
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      name: value.name.trim(),
      description: nullableText(value.description),
      notes: nullableText(value.notes),
      weatherEnabled: value.weatherEnabled,
      weatherLocationLabel: nullableText(value.weatherLocationLabel),
      latitude: nullableNumber(value.latitude),
      longitude: nullableNumber(value.longitude),
      timezone: nullableText(value.timezone),
    });
  }

  private patchFromPlace(place: PlaceDetail | PlaceListItem | null): void {
    this.form.reset(
      {
        name: place?.name ?? '',
        description: place?.description ?? '',
        notes: 'notes' in (place ?? {}) ? ((place as PlaceDetail).notes ?? '') : '',
        weatherEnabled: place?.weatherEnabled ?? false,
        weatherLocationLabel: place?.weatherLocationLabel ?? '',
        latitude: 'latitude' in (place ?? {}) ? (place as PlaceDetail).latitude : null,
        longitude: 'longitude' in (place ?? {}) ? (place as PlaceDetail).longitude : null,
        timezone: place?.timezone ?? '',
      },
      { emitEvent: false },
    );
  }
}

export const weatherLocationValidator = (control: AbstractControl): ValidationErrors | null => {
  const weatherEnabled = control.get('weatherEnabled')?.value === true;

  if (!weatherEnabled) {
    return null;
  }

  const label = String(control.get('weatherLocationLabel')?.value ?? '').trim();
  const latitude = nullableNumber(control.get('latitude')?.value);
  const longitude = nullableNumber(control.get('longitude')?.value);

  return label.length > 0 || (latitude !== null && longitude !== null)
    ? null
    : { weatherLocation: true };
};

const nullableText = (value: string): string | null => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

const nullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};
