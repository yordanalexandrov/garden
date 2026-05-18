import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-feature-placeholder-page',
  template: `
    <section class="feature-placeholder" aria-labelledby="feature-placeholder-title">
      <h1 id="feature-placeholder-title">{{ routeTitle() }}</h1>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .feature-placeholder {
        width: min(100%, 64rem);
      }

      h1 {
        margin: 0;
        color: var(--mat-sys-on-surface);
        font: var(--mat-sys-headline-small);
        font-weight: 500;
        letter-spacing: 0;
        line-height: 1.2;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePlaceholderPage {
  private readonly route = inject(ActivatedRoute);

  readonly routeTitle = toSignal(
    this.route.data.pipe(map((data) => String(data['title'] ?? 'Section'))),
    { initialValue: String(this.route.snapshot.data['title'] ?? 'Section') },
  );
}
