import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';

import { FRONTEND_ENVIRONMENT } from '../../../../core/config/frontend-environment';
import {
  readLocalAuthConfig,
  resolveSupabaseAuthConfig,
  saveLocalAuthConfig,
} from '../../../../core/auth/local-auth-config';
import {
  FrontendAuthConfigurationError,
  createSupabaseAuthPort,
} from '../../../../core/auth/supabase-auth.adapter';

type LoginForm = FormGroup<{
  email: FormControl<string>;
  password: FormControl<string>;
  supabaseAuthUrl: FormControl<string>;
  supabaseAnonKey: FormControl<string>;
}>;

@Component({
  selector: 'app-login-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly environment = inject(FRONTEND_ENVIRONMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly authConfig = resolveSupabaseAuthConfig(this.environment);

  readonly showLocalAuthConfig = !this.environment.production;
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly form: LoginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    supabaseAuthUrl: new FormControl(this.authConfig.supabaseAuthUrl, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    supabaseAnonKey: new FormControl(this.authConfig.supabaseAnonKey, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  async submit(): Promise<void> {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      const value = this.form.getRawValue();
      const config = {
        supabaseAuthUrl: value.supabaseAuthUrl.trim(),
        supabaseAnonKey: value.supabaseAnonKey.trim(),
      };

      if (!this.environment.production) {
        saveLocalAuthConfig(config);
      }

      await createSupabaseAuthPort(config).signInWithPassword({
        email: value.email.trim(),
        password: value.password,
      });

      globalThis.location.assign(this.safeReturnUrl());
    } catch (error) {
      this.error.set(toLoginErrorMessage(error));
      this.submitting.set(false);
    }
  }

  resetLocalAuthConfigFromStorage(): void {
    const localConfig = readLocalAuthConfig();

    this.form.patchValue({
      supabaseAuthUrl: localConfig.supabaseAuthUrl ?? this.authConfig.supabaseAuthUrl,
      supabaseAnonKey: localConfig.supabaseAnonKey ?? this.authConfig.supabaseAnonKey,
    });
  }

  private safeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/places';

    return returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/places';
  }
}

const toLoginErrorMessage = (error: unknown): string => {
  if (error instanceof FrontendAuthConfigurationError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Sign in failed.';
};
