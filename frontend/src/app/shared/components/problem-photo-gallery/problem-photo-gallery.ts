import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GalleryModule } from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';

import { ProblemPhoto } from '../../../features/problems/problems.models';

@Component({
  selector: 'app-problem-photo-gallery',
  imports: [GalleryModule, LightboxModule],
  templateUrl: './problem-photo-gallery.html',
  styleUrl: './problem-photo-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProblemPhotoGallery {
  readonly photos = input<readonly ProblemPhoto[]>([]);

  readonly galleryItems = computed(() =>
    this.photos().map((p) => ({ src: p.url, thumb: p.url })),
  );
}
