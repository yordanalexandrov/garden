import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, concatMap, from, Observable, of, reduce, tap } from 'rxjs';

import { mapApiError } from '../../../core/errors/api-error.mapper';
import { ProblemsApiService } from '../../../features/problems/problems-api.service';
import { ProblemPhotoMutationResult } from '../../../features/problems/problems.models';
import { compressImage } from '../../utils/image-compression';

export interface FileUploadItem {
  id: number;
  file: File;
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errorMsg?: string;
}

export interface UploadSummary {
  succeeded: number;
  failed: number;
}

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

let nextItemId = 0;

@Component({
  selector: 'app-problem-photo-uploader',
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './problem-photo-uploader.html',
  styleUrl: './problem-photo-uploader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProblemPhotoUploader {
  readonly enabled = input<boolean>(false);
  readonly allowedMimeTypes = input<readonly string[]>(DEFAULT_ALLOWED_MIME_TYPES);
  readonly maxBytes = input<number>(DEFAULT_MAX_BYTES);

  readonly uploadComplete = output<ProblemPhotoMutationResult>();
  readonly allUploadsComplete = output<UploadSummary>();

  readonly items = signal<FileUploadItem[]>([]);
  readonly validationErrors = signal<string[]>([]);
  readonly uploading = signal(false);

  private readonly problemsApi = inject(ProblemsApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      if (!this.enabled()) {
        this.reset();
      }
    });
  }

  hasFiles(): boolean {
    return this.items().some((i) => i.status === 'pending');
  }

  async onFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const errors: string[] = [];
    const valid: FileUploadItem[] = [];

    for (const file of files) {
      const err = this.validateFile(file);
      if (err) {
        errors.push(`${file.name}: ${err}`);
      } else {
        valid.push({ id: nextItemId++, file, name: file.name, status: 'pending' });
      }
    }

    this.validationErrors.set(errors);
    this.items.set([...this.items(), ...valid]);

    for (const item of valid) {
      const compressed = await compressImage(item.file);
      this.items.update((list) =>
        list.map((i) => (i.id === item.id ? { ...i, file: compressed } : i)),
      );
    }
  }

  upload(problemId: string): Observable<UploadSummary> {
    const pending = this.items().filter((i) => i.status === 'pending');

    if (!this.enabled() || pending.length === 0) {
      return of({ succeeded: 0, failed: 0 });
    }

    this.uploading.set(true);

    return from(pending).pipe(
      concatMap((item) => this.uploadOne(problemId, item)),
      reduce(
        (acc, ok) => ({
          succeeded: acc.succeeded + (ok ? 1 : 0),
          failed: acc.failed + (ok ? 0 : 1),
        }),
        { succeeded: 0, failed: 0 },
      ),
      tap((summary) => {
        this.uploading.set(false);
        this.allUploadsComplete.emit(summary);
      }),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  reset(): void {
    this.items.set([]);
    this.validationErrors.set([]);
    this.uploading.set(false);
  }

  removeItem(item: FileUploadItem): void {
    this.items.update((list) => list.filter((i) => i.id !== item.id));
  }

  private uploadOne(
    problemId: string,
    item: FileUploadItem,
  ): Observable<ProblemPhotoMutationResult | null> {
    this.items.update((list) =>
      list.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i)),
    );

    const currentFile = this.items().find((i) => i.id === item.id)?.file ?? item.file;

    return this.problemsApi.uploadPhoto(problemId, currentFile).pipe(
      tap((result) => {
        this.items.update((list) =>
          list.map((i) => (i.id === item.id ? { ...i, status: 'done' } : i)),
        );
        this.uploadComplete.emit(result);
      }),
      catchError((error: unknown) => {
        const msg = mapApiError(error).message;
        this.items.update((list) =>
          list.map((i) => (i.id === item.id ? { ...i, status: 'error', errorMsg: msg } : i)),
        );
        return of(null);
      }),
    );
  }

  private validateFile(file: File): string | null {
    if (!this.allowedMimeTypes().includes(file.type)) {
      return `Unsupported type. Allowed: ${this.allowedMimeTypes().join(', ')}.`;
    }
    if (file.size > this.maxBytes()) {
      const maxMb = Math.round(this.maxBytes() / (1024 * 1024));
      return `Too large. Max ${maxMb} MB.`;
    }
    return null;
  }
}
