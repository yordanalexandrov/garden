import { AbstractControl, FormGroup } from '@angular/forms';

import { ApiError } from '../../../core/errors/api-error';

export const apiFieldErrorKey = 'api';

export const apiErrorMessages = (error: ApiError | null): readonly string[] => {
  if (error === null) {
    return [];
  }

  return Object.entries(error.details)
    .flatMap(([field, value]) => formatDetail(field, value))
    .filter((message): message is string => message !== null);
};

export const applyApiErrorToForm = (form: FormGroup, error: ApiError | null): void => {
  clearApiErrorFromControl(form);

  if (error === null) {
    return;
  }

  for (const [field, value] of Object.entries(error.details)) {
    const control = form.get(field);

    if (control === null) {
      continue;
    }

    mergeControlApiError(control, formatDetailValue(value) ?? error.message);
  }
};

const mergeControlApiError = (control: AbstractControl, message: string): void => {
  control.setErrors({ ...(control.errors ?? {}), [apiFieldErrorKey]: message });
  control.markAsTouched();
};

const clearApiErrorFromControl = (control: AbstractControl): void => {
  const childControls = (control as { controls?: unknown }).controls;

  if (Array.isArray(childControls)) {
    for (const childControl of childControls) {
      clearApiErrorFromControl(childControl as AbstractControl);
    }
  } else if (typeof childControls === 'object' && childControls !== null) {
    for (const childControl of Object.values(childControls)) {
      clearApiErrorFromControl(childControl as AbstractControl);
    }
  }

  const errors = control.errors;

  if (errors === null || !(apiFieldErrorKey in errors)) {
    return;
  }

  const nextErrors = { ...errors };
  delete nextErrors[apiFieldErrorKey];
  control.setErrors(Object.keys(nextErrors).length > 0 ? nextErrors : null);
};

const formatDetail = (field: string, value: unknown): string | null => {
  const detail = formatDetailValue(value);

  return detail === null ? null : `${field}: ${detail}`;
};

const formatDetailValue = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    const values = value.map(formatScalar).filter((message): message is string => message !== null);

    return values.length > 0 ? values.join(', ') : null;
  }

  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }

  return formatScalar(value);
};

const formatScalar = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return null;
};
