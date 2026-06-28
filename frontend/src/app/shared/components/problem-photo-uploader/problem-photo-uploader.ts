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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of } from 'rxjs';

import { mapApiError } from '../../../core/errors/api-error.mapper';
import { ProblemsApiService } from '../../../features/problems/problems-api.service';
import { ProblemPhotoMutationResult } from '../../../features/problems/problems.models';

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-problem-photo-uploader',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './problem-photo-uploader.html',
  styleUrl: './problem-photo-uploader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProblemPhotoUploader {
  /** Photos are supported only for problems in v1; parent binds type === 'problem'. */
  readonly enabled = input<boolean>(false);
  readonly allowedMimeTypes = input<readonly string[]>(DEFAULT_ALLOWED_MIME_TYPES);
  readonly maxBytes = input<number>(DEFAULT_MAX_BYTES);

  readonly fileSelected = output<File | null>();
  readonly uploadComplete = output<ProblemPhotoMutationResult>();

  readonly selectedFile = signal<File | null>(null);
  readonly previewName = signal<string | null>(null);
  readonly validationError = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly uploaded = signal<ProblemPhotoMutationResult | null>(null);

  private readonly problemsApi = inject(ProblemsApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Observations never carry a photo; clear any selection if the uploader is disabled.
    effect(() => {
      if (!this.enabled()) {
        this.reset();
      }
    });
  }

  hasFile(): boolean {
    return this.selectedFile() !== null;
  }

  async onFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.uploadError.set(null);
    this.uploaded.set(null);

    if (file === null) {
      this.clearSelection();
      return;
    }

    const validationError = this.validateFile(file);

    if (validationError !== null) {
      this.validationError.set(validationError);
      this.clearSelection();
      return;
    }

    this.validationError.set(null);
    this.selectedFile.set(file);
    this.previewName.set(file.name);
    this.fileSelected.emit(file);

    const compressed = await this.compressImage(file);
    if (this.selectedFile() === file) {
      this.selectedFile.set(compressed);
    }
  }

  /**
   * Uploads the selected file through the backend problems photo endpoint.
   * Returns an observable that completes with the upload result, or null when
   * there is nothing to upload (disabled or no file selected).
   */
  upload(problemId: string): Observable<ProblemPhotoMutationResult | null> {
    const file = this.selectedFile();

    if (!this.enabled() || file === null) {
      return of(null);
    }

    this.uploading.set(true);
    this.uploadError.set(null);

    return new Observable<ProblemPhotoMutationResult | null>((subscriber) => {
      const subscription = this.problemsApi
        .uploadPhoto(problemId, file)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result) => {
            this.uploading.set(false);
            this.uploaded.set(result);
            this.uploadComplete.emit(result);
            subscriber.next(result);
            subscriber.complete();
          },
          error: (error: unknown) => {
            this.uploading.set(false);
            this.uploadError.set(mapApiError(error).message);
            subscriber.next(null);
            subscriber.complete();
          },
        });

      return () => subscription.unsubscribe();
    });
  }

  reset(): void {
    this.clearSelection();
    this.validationError.set(null);
    this.uploadError.set(null);
    this.uploaded.set(null);
    this.uploading.set(false);
  }

  private compressImage(file: File): Promise<File> {
    const MAX_DIMENSION = 1920;
    const QUALITY = 0.85;

    return new Promise<File>((resolve) => {
      let url: string;
      try {
        url = URL.createObjectURL(file);
      } catch {
        resolve(file);
        return;
      }

      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
          resolve(file);
          return;
        }

        const ratio = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // PNG stays lossless (resize only); JPEG/WebP use quality param.
        const quality = file.type === 'image/png' ? undefined : QUALITY;
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], file.name, { type: file.type }) : file),
          file.type,
          quality,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    });
  }

  private clearSelection(): void {
    this.selectedFile.set(null);
    this.previewName.set(null);
    this.fileSelected.emit(null);
  }

  private validateFile(file: File): string | null {
    if (!this.allowedMimeTypes().includes(file.type)) {
      return `Unsupported file type. Allowed: ${this.allowedMimeTypes().join(', ')}.`;
    }

    if (file.size > this.maxBytes()) {
      const maxMb = Math.round(this.maxBytes() / (1024 * 1024));
      return `File is too large. Maximum size is ${maxMb} MB.`;
    }

    return null;
  }
}
