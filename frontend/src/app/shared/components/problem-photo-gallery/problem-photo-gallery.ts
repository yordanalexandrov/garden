import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ProblemPhoto } from '../../../features/problems/problems.models';

@Component({
  selector: 'app-problem-photo-gallery',
  imports: [MatIconModule],
  templateUrl: './problem-photo-gallery.html',
  styleUrl: './problem-photo-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProblemPhotoGallery {
  readonly photos = input<readonly ProblemPhoto[]>([]);

  protected readonly selectedIndex = signal<number | null>(null);

  protected readonly currentPhoto = computed(() => {
    const idx = this.selectedIndex();
    return idx !== null ? (this.photos()[idx] ?? null) : null;
  });

  protected open(index: number): void {
    this.selectedIndex.set(index);
  }

  protected close(): void {
    this.selectedIndex.set(null);
  }

  protected prev(): void {
    const idx = this.selectedIndex();
    if (idx === null) return;
    this.selectedIndex.set(idx > 0 ? idx - 1 : this.photos().length - 1);
  }

  protected next(): void {
    const idx = this.selectedIndex();
    if (idx === null) return;
    this.selectedIndex.set(idx < this.photos().length - 1 ? idx + 1 : 0);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    if (this.selectedIndex() === null) return;
    if (event.key === 'Escape') this.close();
    if (event.key === 'ArrowLeft') this.prev();
    if (event.key === 'ArrowRight') this.next();
  }
}
