import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-place-detail-shell',
  imports: [RouterLink, RouterOutlet],
  template: `
    <section aria-label="Place detail">
      <nav aria-label="Place navigation">
        <a routerLink="overview">Overview</a>
        <a routerLink="perennials">Trees / Perennials</a>
        <a routerLink="beds">Beds</a>
      </nav>
      <router-outlet />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceDetailShell {}
