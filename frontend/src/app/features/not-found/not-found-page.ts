import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-not-found-page',
  template: `
    <section class="not-found-page" aria-labelledby="not-found-page-title">
      <h1 id="not-found-page-title">Page not found</h1>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .not-found-page {
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
export class NotFoundPage {}
